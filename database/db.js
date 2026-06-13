const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = path.join(__dirname, 'database.sqlite');
let SQL;
let db;

// exported API placeholder
const exported = {
  ready: null,
  prepare: function() { throw new Error('DB not initialized'); },
  run: function() { throw new Error('DB not initialized'); },
  get: function() { throw new Error('DB not initialized'); },
  all: function() { throw new Error('DB not initialized'); }
};

module.exports = exported;

async function init() {
  SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE);
    db = new SQL.Database(new Uint8Array(data));
  } else {
    db = new SQL.Database();
  }

  function save() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  }

  function runSql(sql, params) {
    if (params && params.length) db.run(sql, params); else db.run(sql);
    save();
  }

  function allImpl(sql, params) {
    const stmt = db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.reset();
    return rows;
  }

  function getImpl(sql, params) {
    const stmt = db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.reset();
    return row;
  }

  // create tables
  runSql(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'buyer',
    district TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  runSql(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );`);

  runSql(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    name_en TEXT NOT NULL,
    name_np TEXT,
    description TEXT,
    price INTEGER NOT NULL,
    category_id INTEGER,
    unit TEXT DEFAULT 'kg',
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  runSql(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    contact TEXT,
    district TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  runSql(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
  );`);

  const cnt = allImpl('SELECT COUNT(*) AS cnt FROM categories');
  if (!cnt || cnt[0].cnt === 0) {
    ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Other'].forEach(c => runSql('INSERT INTO categories (name) VALUES (?);', [c]));
  }

  // set exported API
  exported.prepare = function(sql) {
    const stmt = db.prepare(sql);
    return {
      get: function(...params) {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];
        if (!params) params = [];
        // normalize: convert undefined to null
        params = params.map(p => p === undefined ? null : p);
        if (params.length) stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : null;
        stmt.reset();
        return row;
      },
      all: function(...params) {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];
        if (!params) params = [];
        // normalize: convert undefined to null
        params = params.map(p => p === undefined ? null : p);
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.reset();
        return rows;
      },
      run: function(...params) {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];
        if (!params) params = [];
        // normalize: convert undefined to null
        params = params.map(p => p === undefined ? null : p);
        if (params.length) stmt.bind(params);
        const ok = stmt.step();
        stmt.reset();
        save();
        // get last insert id
        const last = db.exec('SELECT last_insert_rowid() AS id');
        const lastId = (last && last[0] && last[0].values && last[0].values[0]) ? last[0].values[0][0] : null;
        return { lastInsertRowid: lastId };
      }
    };
  };

  exported.run = function(sql, params) { runSql(sql, params); };
  exported.get = function(sql, params) { return getImpl(sql, params); };
  exported.all = function(sql, params) { return allImpl(sql, params); };
}

exported.ready = init();

