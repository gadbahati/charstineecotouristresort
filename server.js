const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const APP_PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = 'charstineeco@gmail.com';
const ADMIN_PASSWORD = 'Resort254/';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sessions
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './db' }),
  secret: process.env.SESSION_SECRET || 'change_this_to_secure_value',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 hours
}));

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6,
  message: { error: 'Too many login attempts, please try again later.' }
});

// DB setup
const dbPath = path.join(__dirname, 'db', 'data.sqlite');
const dbDir = path.join(__dirname, 'db');
const fs = require('fs');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
const db = new sqlite3.Database(dbPath);

function runSql(sql, params = []){
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err){
      if (err) reject(err); else resolve(this);
    });
  });
}

function getSql(sql, params = []){
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
}

function allSql(sql, params = []){
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

async function initDb(){
  await runSql(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );`);

  await runSql(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    description TEXT
  );`);

  await runSql(`CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    renter_name TEXT,
    hire_date TEXT,
    return_date TEXT,
    price REAL,
    FOREIGN KEY(item_id) REFERENCES items(id)
  );`);

  // ensure admin exists
  const admin = await getSql('SELECT * FROM admin WHERE email = ?', [ADMIN_EMAIL]);
  if (!admin){
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await runSql('INSERT INTO admin (email, password_hash) VALUES (?, ?)', [ADMIN_EMAIL, hash]);
    console.log('Seeded admin user:', ADMIN_EMAIL);
  }
}

initDb().catch(err => console.error('DB init error', err));

// Static files: serve existing site and admin public pages
app.use(express.static(path.join(__dirname, 'Charstine')));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Auth middleware
function requireAuth(req, res, next){
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Login route
app.post('/api/admin/login', loginLimiter, async (req, res) =>{
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  try{
    const row = await getSql('SELECT * FROM admin WHERE email = ?', [email]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    // success
    req.session.isAdmin = true;
    req.session.adminEmail = email;
    res.json({ ok: true });
  }catch(err){
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/logout', (req, res) =>{
  req.session.destroy(() => res.json({ ok: true }));
});

// Items
app.get('/api/admin/items', requireAuth, async (req, res) =>{
  const items = await allSql('SELECT * FROM items ORDER BY id DESC');
  res.json(items);
});

app.post('/api/admin/items', requireAuth, async (req, res) =>{
  const { name, category, quantity, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const q = parseInt(quantity || 0, 10);
  try{
    const result = await runSql('INSERT INTO items (name, category, quantity, description) VALUES (?, ?, ?, ?)', [name, category||'', q, description||'']);
    res.json({ id: result.lastID });
  }catch(err){ console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/admin/items/:id', requireAuth, async (req, res) =>{
  const id = req.params.id;
  const { name, category, quantity, description } = req.body;
  try{
    await runSql('UPDATE items SET name=?, category=?, quantity=?, description=? WHERE id=?', [name, category, quantity, description, id]);
    res.json({ ok: true });
  }catch(err){ console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Rentals
app.get('/api/admin/rentals', requireAuth, async (req, res) =>{
  const rows = await allSql(`SELECT r.*, i.name as item_name FROM rentals r LEFT JOIN items i ON r.item_id = i.id ORDER BY r.id DESC`);
  res.json(rows);
});

app.post('/api/admin/rentals', requireAuth, async (req, res) =>{
  const { item_id, quantity, renter_name, hire_date, return_date, price } = req.body;
  if (!item_id || !quantity) return res.status(400).json({ error: 'item_id and quantity required' });
  try{
    await runSql('INSERT INTO rentals (item_id, quantity, renter_name, hire_date, return_date, price) VALUES (?, ?, ?, ?, ?, ?)', [item_id, quantity, renter_name||'', hire_date||'', return_date||'', price||0]);
    // decrement item stock
    await runSql('UPDATE items SET quantity = quantity - ? WHERE id = ?', [quantity, item_id]);
    res.json({ ok: true });
  }catch(err){ console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Simple route to check auth
app.get('/api/admin/me', (req, res) =>{
  res.json({ isAdmin: !!(req.session && req.session.isAdmin), email: req.session && req.session.adminEmail });
});

app.listen(APP_PORT, () => console.log(`Server running on http://localhost:${APP_PORT}`));
