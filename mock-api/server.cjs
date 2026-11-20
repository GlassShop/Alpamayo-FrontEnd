/**
 * Local mock API for development (replaced by the real backend in sprint 2).
 *
 * Adds to json-server what the frontend needs to exercise sign-in and roles:
 *  - POST /api/v1/authentication/sign-in  → verifies a salted scrypt hash
 *  - every other /api/v1 route requires "Authorization: Bearer <token>"
 *  - /users and writes to /prices and /price-lists are CEO-only
 *  - passwords are hashed on create/reset and never returned
 *
 * This is NOT production security: tokens live in memory and the seed
 * accounts are for development only (see README.md).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const jsonServer = require('json-server');

const PORT = Number(process.env.PORT ?? 3000);
const SESSION_MS = 8 * 60 * 60 * 1000;
const MIN_PASSWORD = 8;
const ROLES = ['CEO', 'SELLER', 'WAREHOUSE'];

const DB_FILE = path.join(__dirname, 'db.json');

/**
 * Seed taken from Dylan's inventory sheet (inventory-seed.json), applied to
 * db.json before json-server reads it (its router only serves the collections
 * present at start). A collection is added only when it is missing, so
 * whatever was typed in the app is kept. The collections of the first
 * "project costs" screen are removed.
 */
function applyInventorySeed(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const seed = require('./inventory-seed.json');
  const before = JSON.stringify(data);
  const nextIn = (list) => list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const lower = (v) => String(v ?? '').trim().toLowerCase();
  for (const key of ['aluminum-colors', 'aluminum-profiles', 'profile-costs', 'accessories', 'glass-sheet-costs', 'cost-history']) delete data[key];
  if ((data.series ?? []).some(s => 'colorIds' in s)) delete data.series;
  data.sites ??= seed.sites;
  data.series ??= seed.series;
  data.products ??= seed.products;
  if (!data['inventory-items']) {
    // Glass of the sheet: reuse the catalog glass type with the same name, thickness and colour, or add it with its prices.
    data['glass-types'] ??= [];
    data.prices ??= [];
    const lists = Object.fromEntries((data['price-lists'] ?? []).map(l => [lower(l.name), l.id]));
    const glassIds = {};
    for (const g of seed.glassTypes) {
      const same = data['glass-types'].find(t => lower(t.name) === lower(g.name) && Number(t.thicknessMm) === g.thicknessMm && lower(t.color) === lower(g.color));
      if (same) { glassIds[g.key] = same.id; continue; }
      const glass = {id: nextIn(data['glass-types']), name: g.name, thicknessMm: g.thicknessMm, color: g.color};
      data['glass-types'].push(glass);
      glassIds[g.key] = glass.id;
      for (const [listName, price] of Object.entries(g.prices ?? {})) {
        const priceListId = lists[lower(listName)];
        if (priceListId) data.prices.push({id: nextIn(data.prices), glassTypeId: glass.id, priceListId, pricePerSqFt: price});
      }
    }
    data['inventory-items'] = seed.items.map(({glassKey, ...item}) => (glassKey ? {...item, glassTypeId: glassIds[glassKey]} : item));
    data['stock-levels'] = seed.stockLevels.map(level => ({...level, inTransit: false, notes: ''}));
  }
  data['stock-levels'] ??= [];
  data['stock-movements'] ??= [];
  data['product-price-history'] ??= [];
  data.purchases ??= [];
  data['cost-settings'] ??= {minMarginPercent: null};
  if (JSON.stringify(data) !== before) fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
applyInventorySeed(DB_FILE);

const server = jsonServer.create();
const router = jsonServer.router(DB_FILE);
const db = router.db;
/** token → { userId, expiresAt } */
const sessions = new Map();

// ── password hashing ─────────────────────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored ?? '').split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function publicUser(user) {
  const {passwordHash, ...rest} = user;
  return rest;
}

function stripSecrets(data) {
  if (Array.isArray(data)) return data.map(stripSecrets);
  if (data && typeof data === 'object' && 'passwordHash' in data) return publicUser(data);
  return data;
}

const users = () => db.get('users');
const findUser = (query) => users().find(query).value();

// ── pipeline ─────────────────────────────────────────────────────────────
server.use(jsonServer.defaults({logger: true}));
server.use(jsonServer.bodyParser);
server.use(jsonServer.rewriter(require('./routes.json')));

// Sign-in
server.post('/authentication/sign-in', (req, res) => {
  const {username, password} = req.body ?? {};
  const user = users().find(u => u.username.toLowerCase() === String(username ?? '').trim().toLowerCase()).value();
  // Same answer for unknown user and wrong password: no account enumeration.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({code: 'invalid-credentials'});
  }
  if (!user.active) return res.status(403).json({code: 'inactive'});
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_MS;
  sessions.set(token, {userId: user.id, expiresAt});
  res.json({token, expiresAt: new Date(expiresAt).toISOString(), user: publicUser(user)});
});

// Authentication for everything else
server.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const session = sessions.get(token);
  const user = session && findUser({id: session.userId});
  if (!session || session.expiresAt < Date.now() || !user?.active) {
    if (session) sessions.delete(token);
    return res.status(401).json({code: 'unauthenticated'});
  }
  req.currentUser = user;
  next();
});

// Authorisation by role
server.use((req, res, next) => {
  const isCeo = req.currentUser.role === 'CEO';
  const writes = req.method !== 'GET';
  const ceoOnly =
    req.path.startsWith('/users') ||
    req.path.startsWith('/price-history') ||
    (writes && req.path.startsWith('/technicians')) ||
    (writes && (req.path.startsWith('/prices') || req.path.startsWith('/price-lists'))) ||
    (writes && req.path.startsWith('/glass-types') && req.method !== 'POST') ||
    // Products: anyone adds one (without price); only the CEO prices them and reads their price history.
    (writes && req.path.startsWith('/products') && req.method !== 'POST') ||
    req.path.startsWith('/product-price-history') ||
    // Purchase costs and margins: only the CEO types or reads them.
    /^\/purchases\/\d+\/costs/.test(req.path) ||
    req.path.startsWith('/cost-settings') ||
    // Everyone reads the maximum discount (sellers need it); only the CEO sets it.
    (writes && req.path.startsWith('/sale-settings'));
  if (ceoOnly && !isCeo) return res.status(403).json({code: 'forbidden'});
  next();
});

// Account rules (mirror of UsersStore on the frontend)
server.post('/users', (req, res, next) => {
  const {username, fullName, role, password} = req.body ?? {};
  const clean = String(username ?? '').trim().toLowerCase();
  if (!clean || /\s/.test(clean) || !String(fullName ?? '').trim() || !ROLES.includes(role)) {
    return res.status(400).json({code: 'invalid-user'});
  }
  if (String(password ?? '').length < MIN_PASSWORD) return res.status(400).json({code: 'weak-password'});
  if (users().find(u => u.username.toLowerCase() === clean).value()) return res.status(409).json({code: 'duplicate-username'});
  req.body = {username: clean, fullName: String(fullName).trim(), role, active: true, passwordHash: hashPassword(password)};
  next();
});

server.patch('/users/:id', (req, res, next) => {
  const target = findUser({id: Number(req.params.id)});
  if (!target) return res.status(404).json({code: 'not-found'});
  const {role, active, password} = req.body ?? {};
  const changes = {};
  if (role !== undefined) {
    if (!ROLES.includes(role)) return res.status(400).json({code: 'invalid-user'});
    changes.role = role;
  }
  if (active !== undefined) changes.active = Boolean(active);
  if (password !== undefined) {
    if (String(password).length < MIN_PASSWORD) return res.status(400).json({code: 'weak-password'});
    changes.passwordHash = hashPassword(password);
  }
  const isSelf = target.id === req.currentUser.id;
  if (isSelf && (changes.active === false || (changes.role && changes.role !== 'CEO'))) {
    return res.status(409).json({code: 'self-lockout'});
  }
  const losesCeo = target.role === 'CEO' && target.active && (changes.active === false || (changes.role && changes.role !== 'CEO'));
  const activeCeos = users().filter(u => u.role === 'CEO' && u.active).size().value();
  if (losesCeo && activeCeos <= 1) return res.status(409).json({code: 'last-ceo'});
  if (changes.active === false || changes.passwordHash) {
    // Revoke the user's open sessions when deactivated or the password changes.
    for (const [token, s] of sessions) if (s.userId === target.id) sessions.delete(token);
  }
  req.body = changes;
  next();
});

server.all(['/users', '/users/:id'], (req, res, next) =>
  ['PUT', 'DELETE'].includes(req.method) ? res.status(405).json({code: 'not-allowed'}) : next());

// ── prices and their history ─────────────────────────────────────────────
// Price writes are handled here (not by json-server) so that every real
// change leaves an immutable history entry with who, when and why.
const MAX_REASON = 140;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const history = () => db.get('price-history');

function recordPriceChange(price, previousPrice, user, rawReason) {
  const reason = String(rawReason ?? '').trim().slice(0, MAX_REASON);
  const id = history().value().reduce((max, h) => Math.max(max, h.id), 0) + 1;
  history().push({
    id, priceId: price.id, glassTypeId: price.glassTypeId, priceListId: price.priceListId,
    previousPrice, newPrice: price.pricePerSqFt, ...(reason ? {reason} : {}),
    changedAt: new Date().toISOString(), changedBy: {id: user.id, fullName: user.fullName},
  }).write();
}

const validPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

server.post('/prices', (req, res) => {
  const {glassTypeId, priceListId, pricePerSqFt, changeReason} = req.body ?? {};
  if (!validPrice(pricePerSqFt) || !db.get('glass-types').find({id: glassTypeId}).value() || !db.get('price-lists').find({id: priceListId}).value()) {
    return res.status(400).json({code: 'invalid-price'});
  }
  if (db.get('prices').find({glassTypeId, priceListId}).value()) return res.status(409).json({code: 'price-exists'});
  const id = db.get('prices').value().reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const price = {id, glassTypeId, priceListId, pricePerSqFt: round2(pricePerSqFt)};
  db.get('prices').push(price).write();
  recordPriceChange(price, null, req.currentUser, changeReason);
  res.status(201).json(price);
});

server.all('/prices/:id', (req, res, next) => {
  if (!['PUT', 'PATCH'].includes(req.method)) return next();
  const existing = db.get('prices').find({id: Number(req.params.id)}).value();
  if (!existing) return res.status(404).json({code: 'not-found'});
  const {pricePerSqFt, changeReason} = req.body ?? {};
  if (!validPrice(pricePerSqFt)) return res.status(400).json({code: 'invalid-price'});
  const newPrice = round2(pricePerSqFt);
  if (newPrice === existing.pricePerSqFt) return res.json(existing); // no change, no history entry
  const previous = existing.pricePerSqFt;
  const updated = {...existing, pricePerSqFt: newPrice};
  db.get('prices').find({id: existing.id}).assign(updated).write();
  recordPriceChange(updated, previous, req.currentUser, changeReason);
  res.json(updated);
});

server.get('/price-history', (req, res) => {
  const glassTypeId = req.query.glassTypeId ? Number(req.query.glassTypeId) : null;
  const priceListId = req.query.priceListId ? Number(req.query.priceListId) : null;
  res.json(history()
    .filter(h => (glassTypeId === null || h.glassTypeId === glassTypeId) && (priceListId === null || h.priceListId === priceListId))
    .orderBy(['changedAt', 'id'], ['desc', 'desc'])
    .value());
});

// The history is append-only: it cannot be edited or deleted.
server.all(['/price-history', '/price-history/:id'], (req, res) => res.status(405).json({code: 'not-allowed'}));

// ── sale products and inventory ──────────────────────────────────────────
// Products besides glass (aluminium, accessories, acrylics…) have ONE public
// price set by the CEO; every role may add a product without price. The
// inventory keeps each exact item (colour, size) and its stock per site;
// quantities only change through movements, which are never edited.
const PRODUCT_CATEGORIES = ['ALUMINUM_SERIES', 'ALUMINUM_TRADITIONAL', 'ACCESSORY', 'OTHER'];
const WEIGHT_CLASSES = ['LIGHT', 'SEMI_HEAVY', 'HEAVY'];
const PACK_KINDS = ['CRATE', 'BUNDLE', 'BOX'];
const MOVEMENT_KINDS = ['COUNT', 'ADJUSTMENT'];
const MAX_NOTES = 200;
const nextId = (collection) => db.get(collection).value().reduce((max, item) => Math.max(max, item.id), 0) + 1;
const isPositiveNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isWholeNumber = (v) => Number.isInteger(v) && v >= 0;
const trimmed = (v) => String(v ?? '').trim();

// Products
function productLabel(p) {
  const series = p.seriesId ? db.get('series').find({id: p.seriesId}).value()?.name : null;
  return [series, [p.code, p.name].filter(Boolean).join(' '), p.brand].filter(Boolean).join(' · ');
}

server.post('/products', (req, res) => {
  const {category, code, name, seriesId = null, brand, weightClass = null, publicPrice = null} = req.body ?? {};
  const fields = {
    category, code: trimmed(code), name: trimmed(name),
    seriesId: category === 'ALUMINUM_SERIES' ? seriesId : null,
    brand: category === 'ACCESSORY' ? trimmed(brand) : '',
    weightClass: category === 'ALUMINUM_TRADITIONAL' ? weightClass ?? 'LIGHT' : null,
  };
  if (!PRODUCT_CATEGORIES.includes(category) || !fields.name) return res.status(400).json({code: 'invalid-product'});
  if (category === 'ALUMINUM_SERIES' && !db.get('series').find({id: seriesId}).value()) return res.status(400).json({code: 'invalid-product'});
  if (fields.weightClass !== null && !WEIGHT_CLASSES.includes(fields.weightClass)) return res.status(400).json({code: 'invalid-product'});
  const same = (a, b) => trimmed(a).toLowerCase() === trimmed(b).toLowerCase();
  const duplicate = db.get('products').find(p => p.category === category && (p.seriesId ?? null) === fields.seriesId && same(p.brand, fields.brand)
    && (fields.code ? same(p.code, fields.code) : !trimmed(p.code) && same(p.name, fields.name))).value();
  if (duplicate) return res.status(409).json({code: 'duplicate'});
  // Only the CEO prices products; anyone else adds them without price.
  const price = req.currentUser.role === 'CEO' && isPositiveNumber(publicPrice) ? round2(publicPrice) : null;
  const product = {id: nextId('products'), ...fields, publicPrice: price};
  db.get('products').push(product).write();
  if (price !== null) recordProductPrice(product, null, req.currentUser, req.body.changeReason);
  res.status(201).json(product);
});

function recordProductPrice(product, previousPrice, user, rawReason) {
  const reason = trimmed(rawReason).slice(0, MAX_REASON);
  db.get('product-price-history').push({
    id: nextId('product-price-history'), productId: product.id, label: productLabel(product), previousPrice,
    newPrice: product.publicPrice, ...(reason ? {reason} : {}),
    changedAt: new Date().toISOString(), changedBy: {id: user.id, fullName: user.fullName},
  }).write();
}

// The CEO changes the public price; the history keeps the previous one (read before writing: assign() mutates).
server.all('/products/:id', (req, res, next) => {
  if (req.method === 'DELETE') return res.status(405).json({code: 'not-allowed'});
  if (!['PUT', 'PATCH'].includes(req.method)) return next();
  const existing = db.get('products').find({id: Number(req.params.id)}).value();
  if (!existing) return res.status(404).json({code: 'not-found'});
  const {publicPrice, changeReason} = req.body ?? {};
  if (!isPositiveNumber(publicPrice)) return res.status(400).json({code: 'invalid-price'});
  const previous = existing.publicPrice ?? null;
  const newPrice = round2(publicPrice);
  if (newPrice === previous) return res.json(existing);
  const updated = {...existing, publicPrice: newPrice};
  db.get('products').find({id: existing.id}).assign(updated).write();
  recordProductPrice(updated, previous, req.currentUser, changeReason);
  res.json(updated);
});

server.get('/product-price-history', (req, res) => {
  res.json(db.get('product-price-history').orderBy(['changedAt', 'id'], ['desc', 'desc']).value());
});
server.all(['/product-price-history', '/product-price-history/:id'], (req, res) => res.status(405).json({code: 'not-allowed'}));

// Sites and series are reference data in this sprint.
server.all(['/sites', '/sites/:id', '/series', '/series/:id'], (req, res, next) =>
  req.method === 'GET' ? next() : res.status(405).json({code: 'not-allowed'}));

// Inventory items
function itemProblem(item) {
  const hasSize = item.widthCm !== null || item.heightCm !== null;
  if (hasSize && !(isPositiveNumber(item.widthCm) && isPositiveNumber(item.heightCm))) return 'invalid-size';
  if (item.packKind === null ? item.unitsPerPack !== null : !PACK_KINDS.includes(item.packKind) || !(Number.isInteger(item.unitsPerPack) && item.unitsPerPack >= 1)) {
    return 'invalid-pack';
  }
  if (item.minStock !== null && !isWholeNumber(item.minStock)) return 'invalid-quantity';
  return null;
}

function itemFields(body) {
  const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
  return {
    color: trimmed(body.color), sku: trimmed(body.sku), widthCm: num(body.widthCm), heightCm: num(body.heightCm),
    packKind: body.packKind ?? null, unitsPerPack: num(body.unitsPerPack), minStock: num(body.minStock),
  };
}

server.post('/inventory-items', (req, res) => {
  const {glassTypeId = null, productId = null} = req.body ?? {};
  const owner = glassTypeId !== null
    ? productId === null && db.get('glass-types').find({id: glassTypeId}).value()
    : db.get('products').find({id: productId}).value();
  if (!owner) return res.status(400).json({code: 'invalid-item'});
  const fields = itemFields(req.body);
  const problem = itemProblem(fields);
  if (problem) return res.status(400).json({code: problem});
  const duplicate = db.get('inventory-items').find(i => (i.glassTypeId ?? null) === glassTypeId && (i.productId ?? null) === productId
    && trimmed(i.color).toLowerCase() === fields.color.toLowerCase()
    && (i.widthCm ?? null) === fields.widthCm && (i.heightCm ?? null) === fields.heightCm).value();
  if (duplicate) return res.status(409).json({code: 'duplicate-item'});
  const item = {id: nextId('inventory-items'), glassTypeId, productId, ...fields};
  db.get('inventory-items').push(item).write();
  res.status(201).json(item);
});

// Details may change; the product or glass type an item belongs to may not.
server.all('/inventory-items/:id', (req, res, next) => {
  if (req.method === 'DELETE') return res.status(405).json({code: 'not-allowed'});
  if (!['PUT', 'PATCH'].includes(req.method)) return next();
  const existing = db.get('inventory-items').find({id: Number(req.params.id)}).value();
  if (!existing) return res.status(404).json({code: 'not-found'});
  const fields = itemFields({...existing, ...req.body});
  const problem = itemProblem(fields);
  if (problem) return res.status(400).json({code: problem});
  const updated = {id: existing.id, glassTypeId: existing.glassTypeId ?? null, productId: existing.productId ?? null, ...fields};
  db.set('inventory-items', db.get('inventory-items').map(i => (i.id === existing.id ? updated : i)).value()).write();
  res.json(updated);
});

// Stock levels: quantities change only through movements; "en camino" and notes are typed by hand.
function levelFlags(body) {
  const out = {};
  if (body?.inTransit !== undefined) out.inTransit = body.inTransit === true;
  if (body?.notes !== undefined) out.notes = trimmed(body.notes).slice(0, MAX_NOTES);
  return out;
}

function findLevel(itemId, siteId) {
  return db.get('stock-levels').find({itemId, siteId}).value();
}

function siteAndItemExist(itemId, siteId) {
  return db.get('inventory-items').find({id: itemId}).value() && db.get('sites').find({id: siteId}).value();
}

// Creates the level of an item never counted in a site; if it already exists, the flags are applied to it.
server.post('/stock-levels', (req, res) => {
  const {itemId, siteId} = req.body ?? {};
  if (!siteAndItemExist(itemId, siteId)) return res.status(400).json({code: 'invalid-level'});
  const existing = findLevel(itemId, siteId);
  if (existing) {
    const updated = {...existing, ...levelFlags(req.body)};
    db.get('stock-levels').find({id: existing.id}).assign(updated).write();
    return res.json(updated);
  }
  const level = {id: nextId('stock-levels'), itemId, siteId, quantity: null, inTransit: false, notes: '', ...levelFlags(req.body)};
  db.get('stock-levels').push(level).write();
  res.status(201).json(level);
});

server.all('/stock-levels/:id', (req, res, next) => {
  if (['PUT', 'DELETE'].includes(req.method)) return res.status(405).json({code: 'not-allowed'});
  if (req.method !== 'PATCH') return next();
  const existing = db.get('stock-levels').find({id: Number(req.params.id)}).value();
  if (!existing) return res.status(404).json({code: 'not-found'});
  const updated = {...existing, ...levelFlags(req.body)};
  db.get('stock-levels').find({id: existing.id}).assign(updated).write();
  res.json(updated);
});

// Movements: a COUNT sets the quantity counted, an ADJUSTMENT adds or removes units.
server.post('/stock-movements', (req, res) => {
  const {itemId, siteId, kind, quantity, reason} = req.body ?? {};
  if (!siteAndItemExist(itemId, siteId) || !MOVEMENT_KINDS.includes(kind)) return res.status(400).json({code: 'invalid-movement'});
  const level = findLevel(itemId, siteId);
  const current = level?.quantity ?? null;
  let after;
  if (kind === 'COUNT') {
    if (!isWholeNumber(quantity)) return res.status(400).json({code: 'invalid-quantity'});
    after = quantity;
  } else {
    if (!Number.isInteger(quantity) || quantity === 0 || (current ?? 0) + quantity < 0) return res.status(400).json({code: 'invalid-adjustment'});
    after = (current ?? 0) + quantity;
  }
  let saved;
  if (level) {
    saved = {...level, quantity: after};
    db.get('stock-levels').find({id: level.id}).assign(saved).write();
  } else {
    saved = {id: nextId('stock-levels'), itemId, siteId, quantity: after, inTransit: false, notes: ''};
    db.get('stock-levels').push(saved).write();
  }
  const cleanReason = trimmed(reason).slice(0, MAX_REASON);
  const movement = {
    id: nextId('stock-movements'), itemId, siteId, kind, delta: after - (current ?? 0), quantityAfter: after,
    ...(cleanReason ? {reason: cleanReason} : {}), at: new Date().toISOString(), by: actor(req.currentUser),
  };
  db.get('stock-movements').push(movement).write();
  res.status(201).json({movement, level: saved});
});

server.get('/stock-movements', (req, res) => {
  const itemId = req.query.itemId ? Number(req.query.itemId) : null;
  res.json(db.get('stock-movements').filter(m => itemId === null || m.itemId === itemId)
    .orderBy(['at', 'id'], ['desc', 'desc']).value());
});
server.all('/stock-movements/:id', (req, res, next) => (req.method === 'GET' ? next() : res.status(405).json({code: 'not-allowed'})));
server.all('/stock-movements', (req, res) => res.status(405).json({code: 'not-allowed'}));

// ── purchases and their costs ────────────────────────────────────────────
// Any role registers an arrival: the stock of the site goes up at once and
// the purchase waits for its costs. Only the CEO types the dollars, exchange
// rate, freight and Lima → Huaraz transport; the landed cost of each unit is
// worked out here (freight and transport shared by value). Amounts are
// removed from every answer to other roles.
const CURRENCIES = ['PEN', 'USD'];
const purchases = () => db.get('purchases');
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

function forRole(purchase, user) {
  if (user.role === 'CEO') return purchase;
  const {costs, costedBy, costedAt, ...rest} = purchase;
  return {...rest, lines: purchase.lines.map(({unitPriceUsd, unitCost, ...line}) => line)};
}

function toSoles(money, rate) {
  return money.currency === 'USD' ? money.amount * rate : money.amount;
}

/** Same rule as the frontend preview (landed-cost.ts). */
function landedUnitCosts(lines, prices, rate, freight, transport) {
  const values = lines.map((line, i) => line.quantity * prices[i] * rate);
  const total = values.reduce((sum, v) => sum + v, 0);
  const extra = toSoles(freight, rate) + toSoles(transport, rate);
  return lines.map((line, i) => round4((values[i] + extra * (total > 0 ? values[i] / total : 0)) / line.quantity));
}

server.get('/purchases', (req, res) => {
  res.json(purchases().orderBy(['date', 'id'], ['desc', 'desc']).value().map(p => forRole(p, req.currentUser)));
});

server.get('/purchases/:id', (req, res) => {
  const purchase = purchases().find({id: Number(req.params.id)}).value();
  if (!purchase) return res.status(404).json({code: 'not-found'});
  res.json(forRole(purchase, req.currentUser));
});

server.post('/purchases', (req, res) => {
  const {date, supplier, siteId, notes, lines} = req.body ?? {};
  if (!isDate(date) || !trimmed(supplier) || !db.get('sites').find({id: siteId}).value()) return res.status(400).json({code: 'invalid-purchase'});
  if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({code: 'no-lines'});
  const itemIds = lines.map(l => l.itemId);
  if (new Set(itemIds).size !== itemIds.length) return res.status(400).json({code: 'repeated-item'});
  for (const line of lines) {
    if (!db.get('inventory-items').find({id: line.itemId}).value() || !Number.isInteger(line.quantity) || line.quantity < 1) {
      return res.status(400).json({code: 'invalid-line'});
    }
  }
  const now = new Date().toISOString();
  const purchase = {
    id: nextId('purchases'), date, supplier: trimmed(supplier), siteId, notes: trimmed(notes).slice(0, MAX_NOTES),
    status: 'PENDING_COST', costs: null, costedBy: null, costedAt: null, createdBy: actor(req.currentUser), createdAt: now,
    lines: lines.map(l => ({itemId: l.itemId, quantity: l.quantity, packs: Number.isInteger(l.packs) ? l.packs : null, unitPriceUsd: null, unitCost: null})),
  };
  purchases().push(purchase).write();
  // The goods are in the site now: add them to the stock and clear "en camino".
  const levels = purchase.lines.map(line => {
    const level = findLevel(line.itemId, siteId);
    const before = level?.quantity ?? 0;
    const saved = level
      ? {...level, quantity: before + line.quantity, inTransit: false}
      : {id: nextId('stock-levels'), itemId: line.itemId, siteId, quantity: line.quantity, inTransit: false, notes: ''};
    if (level) db.get('stock-levels').find({id: level.id}).assign(saved).write();
    else db.get('stock-levels').push(saved).write();
    db.get('stock-movements').push({
      id: nextId('stock-movements'), itemId: line.itemId, siteId, kind: 'PURCHASE', delta: line.quantity, quantityAfter: saved.quantity,
      reason: `Compra a ${purchase.supplier}`, purchaseId: purchase.id, at: now, by: actor(req.currentUser),
    }).write();
    return saved;
  });
  res.status(201).json({purchase: forRole(purchase, req.currentUser), levels});
});

// Costs (CEO only, see the authorisation middleware). They may be corrected later; quantities may not.
server.put('/purchases/:id/costs', (req, res) => {
  const existing = purchases().find({id: Number(req.params.id)}).value();
  if (!existing) return res.status(404).json({code: 'not-found'});
  const {exchangeRate, freight, transport, unitPricesUsd} = req.body ?? {};
  const validMoney = (m) => m && CURRENCIES.includes(m.currency) && typeof m.amount === 'number' && Number.isFinite(m.amount) && m.amount >= 0;
  if (!isPositiveNumber(exchangeRate) || !validMoney(freight) || !validMoney(transport)
    || !Array.isArray(unitPricesUsd) || unitPricesUsd.length !== existing.lines.length || !unitPricesUsd.every(isPositiveNumber)) {
    return res.status(400).json({code: 'invalid-costs'});
  }
  const unitCosts = landedUnitCosts(existing.lines, unitPricesUsd, exchangeRate, freight, transport);
  const updated = {
    ...existing, status: 'COSTED',
    costs: {exchangeRate, freight: {amount: round2(freight.amount), currency: freight.currency}, transport: {amount: round2(transport.amount), currency: transport.currency}},
    lines: existing.lines.map((line, i) => ({...line, unitPriceUsd: unitPricesUsd[i], unitCost: unitCosts[i]})),
    costedBy: actor(req.currentUser), costedAt: new Date().toISOString(),
  };
  db.set('purchases', purchases().map(p => (p.id === existing.id ? updated : p)).value()).write();
  res.json(updated);
});

server.all(['/purchases', '/purchases/:id', '/purchases/:id/costs'], (req, res) => res.status(405).json({code: 'not-allowed'}));

// Minimum margin that raises the low-margin warning (CEO only); null keeps it off.
server.get('/cost-settings', (req, res) => res.json(db.get('cost-settings').value() ?? {minMarginPercent: null}));
server.put('/cost-settings', (req, res) => {
  const {minMarginPercent} = req.body ?? {};
  if (minMarginPercent !== null && !(typeof minMarginPercent === 'number' && minMarginPercent >= 0 && minMarginPercent <= 100)) {
    return res.status(400).json({code: 'invalid-margin'});
  }
  db.set('cost-settings', {minMarginPercent}).write();
  res.json({minMarginPercent});
});
server.all('/cost-settings', (req, res) => res.status(405).json({code: 'not-allowed'}));

// Most a seller may lower a catalog price on a quote, in %; null (not set) allows no discount.
const maxDiscountPercent = () => db.get('sale-settings').value()?.maxDiscountPercent ?? null;
server.get('/sale-settings', (req, res) => res.json({maxDiscountPercent: maxDiscountPercent()}));
server.put('/sale-settings', (req, res) => {
  const {maxDiscountPercent: value} = req.body ?? {};
  if (value !== null && !(typeof value === 'number' && value >= 0 && value <= 100)) {
    return res.status(400).json({code: 'invalid-discount'});
  }
  db.set('sale-settings', {maxDiscountPercent: value}).write();
  res.json({maxDiscountPercent: value});
});
server.all('/sale-settings', (req, res) => res.status(405).json({code: 'not-allowed'}));

// ── quotes ───────────────────────────────────────────────────────────────
// Sellers and warehouse staff see only their own quotes; the CEO sees all.
// Totals and catalog prices are re-checked so a client cannot tamper with
// them, and so is the final price typed by a seller: never below the CEO's
// maximum discount (the CEO has no limit). Mirror of price-adjustment.ts.
const PAYMENT_METHODS = ['CASH', 'YAPE', 'PLIN', 'CARD'];
const SALE_UNITS = {ALUMINUM_SERIES: 'BAR', ALUMINUM_TRADITIONAL: 'BAR', ACCESSORY: 'UNIT', OTHER: 'SHEET'};
const quotes = () => db.get('quotes');
const canSee = (user, quote) => user.role === 'CEO' || quote.seller.id === user.id;

function allowedPrice(catalogPrice, finalPrice, user) {
  if (!(finalPrice > 0)) return false;
  if (user.role === 'CEO' || finalPrice >= catalogPrice) return true;
  return finalPrice >= Math.ceil(catalogPrice * (100 - (maxDiscountPercent() ?? 0)) - 1e-6) / 100;
}

function quoteProblem(body, user) {
  const {customer, paymentMethod, priceList, lines = [], products = [], extras = [], total, advance, termsAccepted} = body ?? {};
  if (!customer?.name?.trim() || !['DNI', 'RUC'].includes(customer?.docType) || !/^\d{8}$|^\d{11}$/.test(customer?.docNumber ?? '')) return 'invalid-customer';
  if (!PAYMENT_METHODS.includes(paymentMethod)) return 'invalid-payment';
  if (lines.length + products.length + extras.length === 0) return 'empty';
  if (termsAccepted !== true) return 'terms-not-accepted';
  for (const line of lines) {
    const price = db.get('prices').find({glassTypeId: line.glassTypeId, priceListId: priceList?.id}).value();
    const catalogPrice = line.catalogPricePerSqFt ?? line.pricePerSqFt;
    const expected = round2(((line.billedWidthCm * line.billedHeightCm / 900) * line.pricePerSqFt) * line.quantity);
    if (!price || price.pricePerSqFt !== catalogPrice || expected !== round2(line.total)) return 'totals-mismatch';
    if (!allowedPrice(catalogPrice, line.pricePerSqFt, user)) return 'discount-too-high';
  }
  for (const line of products) {
    const product = db.get('products').find({id: line.productId}).value();
    if (!product || product.publicPrice === null || product.publicPrice !== line.catalogUnitPrice) return 'totals-mismatch';
    if (!Number.isInteger(line.quantity) || line.quantity < 1) return 'invalid-quantity';
    if (line.saleUnit !== SALE_UNITS[product.category] || round2(line.unitPrice * line.quantity) !== round2(line.total)) return 'totals-mismatch';
    if (!allowedPrice(line.catalogUnitPrice, line.unitPrice, user)) return 'discount-too-high';
  }
  for (const extra of extras) {
    if (!String(extra.description ?? '').trim() || round2(extra.quantity * extra.unitPrice) !== round2(extra.total)) return 'totals-mismatch';
  }
  const sum = round2([...lines, ...products, ...extras].reduce((acc, l) => acc + l.total, 0));
  if (sum !== round2(total)) return 'totals-mismatch';
  if (!(advance >= 0 && advance <= total)) return 'invalid-advance';
  return null;
}

function quoteFields(body) {
  const {customer, paymentMethod, priceList, currency, lines = [], products = [], extras = [], total, subtotal, igv, advance, termsAccepted, notes} = body;
  return {customer, paymentMethod, priceList, currency: currency ?? 'PEN', lines, products, extras,
    total: round2(total), subtotal: round2(subtotal), igv: round2(igv), advance: round2(advance),
    balance: round2(total - advance), termsAccepted, ...(notes ? {notes} : {})};
}

server.get('/quotes', (req, res) => {
  res.json(quotes().filter(q => canSee(req.currentUser, q)).value());
});

server.get('/quotes/:id', (req, res) => {
  const quote = quotes().find({id: Number(req.params.id)}).value();
  if (!quote || !canSee(req.currentUser, quote)) return res.status(404).json({code: 'not-found'});
  res.json(quote);
});

server.post('/quotes', (req, res) => {
  const problem = quoteProblem(req.body, req.currentUser);
  if (problem) return res.status(problem === 'totals-mismatch' ? 422 : 400).json({code: problem});
  const all = quotes().value();
  const id = all.reduce((max, q) => Math.max(max, q.id), 0) + 1;
  const now = new Date().toISOString();
  const quote = {
    id, number: `COT-${String(id).padStart(6, '0')}`, createdAt: now, updatedAt: now,
    seller: {id: req.currentUser.id, fullName: req.currentUser.fullName}, ...quoteFields(req.body),
  };
  quotes().push(quote).write();
  res.status(201).json(quote);
});

server.put('/quotes/:id', (req, res) => {
  const existing = quotes().find({id: Number(req.params.id)}).value();
  if (!existing || !canSee(req.currentUser, existing)) return res.status(404).json({code: 'not-found'});
  const problem = quoteProblem(req.body, req.currentUser);
  if (problem) return res.status(problem === 'totals-mismatch' ? 422 : 400).json({code: problem});
  const updated = {...existing, ...quoteFields(req.body), updatedAt: new Date().toISOString()};
  quotes().find({id: existing.id}).assign(updated).write();
  res.json(updated);
});

server.all(['/quotes', '/quotes/:id'], (req, res) => res.status(405).json({code: 'not-allowed'}));

// ── agenda: technicians and visits ───────────────────────────────────────
// Technicians do not sign in; the CEO keeps the list. Everyone sees every
// visit, only its author or the CEO may change it, every change is recorded
// and visits are cancelled, never deleted.
const VISIT_TYPES = ['MEASUREMENT', 'INSTALLATION', 'REPAIR', 'OTHER'];
const VISIT_STATUSES = ['SCHEDULED', 'DONE', 'CANCELLED'];
const visits = () => db.get('visits');
const actor = (user) => ({id: user.id, fullName: user.fullName});

server.all('/technicians/:id', (req, res, next) =>
  req.method === 'DELETE' ? res.status(405).json({code: 'deactivate-instead'}) : next());

function visitProblem(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date ?? '') || !/^\d{2}:\d{2}$/.test(v.time ?? '')) return 'invalid-date';
  if (!VISIT_TYPES.includes(v.type)) return 'invalid-type';
  if (!String(v.title ?? '').trim() || !String(v.address ?? '').trim()) return 'missing-fields';
  if (!String(v.customer?.name ?? '').trim() || !String(v.customer?.phone ?? '').trim()) return 'missing-customer';
  if (v.status !== undefined && !VISIT_STATUSES.includes(v.status)) return 'invalid-status';
  return null;
}

function visitFields(body) {
  const out = {};
  for (const key of ['date', 'time', 'technicianId', 'type', 'title', 'address', 'reference', 'specs', 'quoteId', 'status']) {
    if (key in (body ?? {})) out[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
  }
  if (body?.customer) out.customer = {name: String(body.customer.name ?? '').trim(), phone: String(body.customer.phone ?? '').trim()};
  return out;
}

server.get('/visits', (req, res) => {
  const {from, to} = req.query;
  res.json(visits().filter(v => (!from || v.date >= from) && (!to || v.date <= to)).sortBy(['date', 'time']).value());
});

server.post('/visits', (req, res) => {
  const fields = visitFields(req.body);
  const technician = db.get('technicians').find({id: fields.technicianId}).value();
  if (!technician?.active) return res.status(400).json({code: 'invalid-technician'});
  const problem = visitProblem(fields);
  if (problem) return res.status(400).json({code: problem});
  for (const key of ['reference', 'specs']) if (!fields[key]) delete fields[key];
  const id = visits().value().reduce((max, v) => Math.max(max, v.id), 0) + 1;
  const now = new Date().toISOString();
  const visit = {id, ...fields, status: 'SCHEDULED', createdBy: actor(req.currentUser), createdAt: now,
    changes: [{at: now, by: actor(req.currentUser), fields: ['created']}]};
  visits().push(visit).write();
  res.status(201).json(visit);
});

server.all('/visits/:id', (req, res, next) => {
  if (req.method === 'DELETE') return res.status(405).json({code: 'cancel-instead'});
  if (!['PUT', 'PATCH'].includes(req.method)) return next();
  const existing = visits().find({id: Number(req.params.id)}).value();
  if (!existing) return res.status(404).json({code: 'not-found'});
  if (existing.createdBy.id !== req.currentUser.id && req.currentUser.role !== 'CEO') {
    return res.status(403).json({code: 'not-your-visit'});
  }
  const changes = visitFields(req.body);
  if ('technicianId' in changes && changes.technicianId !== existing.technicianId) {
    const technician = db.get('technicians').find({id: changes.technicianId}).value();
    if (!technician?.active) return res.status(400).json({code: 'invalid-technician'});
  }
  const updated = {...existing, ...changes};
  for (const key of ['reference', 'specs']) if (!updated[key]) delete updated[key];
  const problem = visitProblem(updated);
  if (problem) return res.status(400).json({code: problem});
  const changedFields = Object.keys(changes).filter(k => JSON.stringify(existing[k] ?? '') !== JSON.stringify(updated[k] ?? ''));
  if (changedFields.length === 0) return res.json(existing);
  updated.changes = [...existing.changes, {at: new Date().toISOString(), by: actor(req.currentUser), fields: changedFields}];
  // Replace the whole object so cleared optional fields really disappear.
  db.set('visits', visits().map(v => v.id === existing.id ? updated : v).value()).write();
  res.json(updated);
});

// ── DNI / RUC lookup ─────────────────────────────────────────────────────
// The real backend will query RENIEC/SUNAT. Here: a fictional directory plus
// customers from previous quotes (so a manually entered customer is found next time).
server.get('/document-lookup/:type/:number', (req, res) => {
  const {type, number} = req.params;
  const fromDirectory = db.get('document-directory').find({docType: type, docNumber: number}).value();
  const fromQuotes = quotes().map('customer').filter({docType: type, docNumber: number}).last().value();
  if (!fromQuotes && !fromDirectory) return res.status(404).json({code: 'not-found'});
  // Latest data from quotes wins, but empty fields never erase what the directory knows.
  const filled = Object.fromEntries(Object.entries(fromQuotes ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const found = {...fromDirectory, ...filled};
  res.json({docType: type, docNumber: number, name: found.name, address: found.address ?? null, phone: found.phone ?? null});
});

// Never send password hashes back
router.render = (req, res) => res.jsonp(stripSecrets(res.locals.data));
server.use(router);

server.listen(PORT, () => {
  console.log(`Mock API with authentication on http://localhost:${PORT}/api/v1`);
});
