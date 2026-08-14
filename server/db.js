const path = require('path');

let db = null;
let useMemoryStore = false;

// Sample initial data for fallback
const sampleReports = [
  { id: 1, city: 'Karachi', area: 'Gulshan-e-Iqbal', status: 'OUTAGE', created_at: new Date(Date.now() - 2 * 60000).toISOString(), ip_hash: 'seed_1' },
  { id: 2, city: 'Lahore', area: 'Model Town', status: 'OUTAGE', created_at: new Date(Date.now() - 5 * 60000).toISOString(), ip_hash: 'seed_2' },
  { id: 3, city: 'Islamabad', area: 'F-8 Markaz', status: 'RESTORED', created_at: new Date(Date.now() - 8 * 60000).toISOString(), ip_hash: 'seed_3' },
  { id: 4, city: 'Karachi', area: 'DHA Phase 5', status: 'OUTAGE', created_at: new Date(Date.now() - 10 * 60000).toISOString(), ip_hash: 'seed_4' },
  { id: 5, city: 'Rawalpindi', area: 'Saddar', status: 'OUTAGE', created_at: new Date(Date.now() - 12 * 60000).toISOString(), ip_hash: 'seed_5' },
  { id: 6, city: 'Islamabad', area: 'G-11', status: 'OUTAGE', created_at: new Date(Date.now() - 15 * 60000).toISOString(), ip_hash: 'seed_6' },
  { id: 7, city: 'Karachi', area: 'Gulshan-e-Iqbal', status: 'OUTAGE', created_at: new Date(Date.now() - 18 * 60000).toISOString(), ip_hash: 'seed_7' },
  { id: 8, city: 'Peshawar', area: 'University Town', status: 'OUTAGE', created_at: new Date(Date.now() - 25 * 60000).toISOString(), ip_hash: 'seed_8' },
  { id: 9, city: 'Faisalabad', area: 'D Ground', status: 'RESTORED', created_at: new Date(Date.now() - 30 * 60000).toISOString(), ip_hash: 'seed_9' },
  { id: 10, city: 'Multan', area: 'Cantonment', status: 'RESTORED', created_at: new Date(Date.now() - 45 * 60000).toISOString(), ip_hash: 'seed_10' }
];

let inMemoryReports = [...sampleReports];
let inMemorySubscribers = [];
let nextReportId = 11;

try {
  const Database = require('better-sqlite3');
  const isVercel = Boolean(process.env.VERCEL);
  const dbPath = isVercel ? '/tmp/bijli.db' : path.join(__dirname, 'bijli.db');

  db = new Database(dbPath);

  if (!isVercel) {
    db.pragma('journal_mode = WAL');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM reports');
  const { count } = countStmt.get();

  if (count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO reports (city, area, status, created_at, ip_hash)
      VALUES (@city, @area, @status, @created_at, @ip_hash)
    `);

    const seedTransaction = db.transaction((reports) => {
      for (const r of reports) {
        insertStmt.run({
          city: r.city,
          area: r.area,
          status: r.status,
          created_at: r.created_at.replace('T', ' ').substring(0, 19),
          ip_hash: r.ip_hash
        });
      }
    });

    seedTransaction(sampleReports);
  }
} catch (err) {
  console.warn('better-sqlite3 loading failed, falling back to in-memory database:', err.message);
  useMemoryStore = true;
}

module.exports = {
  isMemoryStore: () => useMemoryStore,
  getDb: () => db,
  memory: {
    reports: inMemoryReports,
    subscribers: inMemorySubscribers,
    addReport: (report) => {
      const newRep = { id: nextReportId++, ...report, created_at: new Date().toISOString() };
      inMemoryReports.unshift(newRep);
      return newRep;
    },
    addSubscriber: (email) => {
      if (!inMemorySubscribers.includes(email)) {
        inMemorySubscribers.push(email);
      }
    }
  }
};
