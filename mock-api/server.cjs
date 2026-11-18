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

// Never send password hashes back
router.render = (req, res) => res.jsonp(stripSecrets(res.locals.data));
server.use(router);

server.listen(PORT, () => {
  console.log(`Mock API with authentication on http://localhost:${PORT}/api/v1`);
});
