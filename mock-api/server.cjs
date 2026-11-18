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
const path = require('node:path');
const crypto = require('node:crypto');
const jsonServer = require('json-server');

const PORT = Number(process.env.PORT ?? 3000);
const SESSION_MS = 8 * 60 * 60 * 1000;
const MIN_PASSWORD = 8;
const ROLES = ['CEO', 'SELLER', 'WAREHOUSE'];

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
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
    (writes && req.path.startsWith('/glass-types') && req.method !== 'POST');
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

// ── quotes ───────────────────────────────────────────────────────────────
// Sellers and warehouse staff see only their own quotes; the CEO sees all.
// Totals and glass prices are re-checked so a client cannot tamper with them.
const PAYMENT_METHODS = ['CASH', 'YAPE', 'PLIN', 'CARD'];
const quotes = () => db.get('quotes');
const canSee = (user, quote) => user.role === 'CEO' || quote.seller.id === user.id;

function quoteProblem(body) {
  const {customer, paymentMethod, priceList, lines = [], extras = [], total, advance, termsAccepted} = body ?? {};
  if (!customer?.name?.trim() || !['DNI', 'RUC'].includes(customer?.docType) || !/^\d{8}$|^\d{11}$/.test(customer?.docNumber ?? '')) return 'invalid-customer';
  if (!PAYMENT_METHODS.includes(paymentMethod)) return 'invalid-payment';
  if (lines.length + extras.length === 0) return 'empty';
  if (termsAccepted !== true) return 'terms-not-accepted';
  for (const line of lines) {
    const price = db.get('prices').find({glassTypeId: line.glassTypeId, priceListId: priceList?.id}).value();
    const expected = round2(((line.billedWidthCm * line.billedHeightCm / 900) * line.pricePerSqFt) * line.quantity);
    if (!price || price.pricePerSqFt !== line.pricePerSqFt || expected !== round2(line.total)) return 'totals-mismatch';
  }
  for (const extra of extras) {
    if (!String(extra.description ?? '').trim() || round2(extra.quantity * extra.unitPrice) !== round2(extra.total)) return 'totals-mismatch';
  }
  const sum = round2([...lines, ...extras].reduce((acc, l) => acc + l.total, 0));
  if (sum !== round2(total)) return 'totals-mismatch';
  if (!(advance >= 0 && advance <= total)) return 'invalid-advance';
  return null;
}

function quoteFields(body) {
  const {customer, paymentMethod, priceList, currency, lines = [], extras = [], total, subtotal, igv, advance, termsAccepted, notes} = body;
  return {customer, paymentMethod, priceList, currency: currency ?? 'PEN', lines, extras,
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
  const problem = quoteProblem(req.body);
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
  const problem = quoteProblem(req.body);
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
