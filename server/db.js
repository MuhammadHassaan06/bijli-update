const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bijli.db');
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

// Initialize tables
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

// Check if seeding is needed
const countStmt = db.prepare('SELECT COUNT(*) as count FROM reports');
const { count } = countStmt.get();

if (count === 0) {
  console.log('Seeding SQLite database with realistic sample outage reports...');

  const insertStmt = db.prepare(`
    INSERT INTO reports (city, area, status, created_at, ip_hash)
    VALUES (@city, @area, @status, @created_at, @ip_hash)
  `);

  const sampleReports = [
    { city: 'Karachi', area: 'Gulshan-e-Iqbal', status: 'OUTAGE', offsetMinutes: 2, ip_hash: 'seed_ip_1' },
    { city: 'Lahore', area: 'Model Town', status: 'OUTAGE', offsetMinutes: 5, ip_hash: 'seed_ip_2' },
    { city: 'Islamabad', area: 'F-8 Markaz', status: 'RESTORED', offsetMinutes: 8, ip_hash: 'seed_ip_3' },
    { city: 'Karachi', area: 'DHA Phase 5', status: 'OUTAGE', offsetMinutes: 10, ip_hash: 'seed_ip_4' },
    { city: 'Rawalpindi', area: 'Saddar', status: 'OUTAGE', offsetMinutes: 12, ip_hash: 'seed_ip_5' },
    { city: 'Islamabad', area: 'G-11', status: 'OUTAGE', offsetMinutes: 15, ip_hash: 'seed_ip_6' },
    { city: 'Karachi', area: 'Gulshan-e-Iqbal', status: 'OUTAGE', offsetMinutes: 18, ip_hash: 'seed_ip_7' },
    { city: 'Lahore', area: 'Model Town', status: 'OUTAGE', offsetMinutes: 22, ip_hash: 'seed_ip_8' },
    { city: 'Peshawar', area: 'University Town', status: 'OUTAGE', offsetMinutes: 25, ip_hash: 'seed_ip_9' },
    { city: 'Faisalabad', area: 'D Ground', status: 'RESTORED', offsetMinutes: 30, ip_hash: 'seed_ip_10' },
    { city: 'Islamabad', area: 'G-11', status: 'OUTAGE', offsetMinutes: 32, ip_hash: 'seed_ip_11' },
    { city: 'Karachi', area: 'Gulshan-e-Iqbal', status: 'OUTAGE', offsetMinutes: 40, ip_hash: 'seed_ip_12' },
    { city: 'Multan', area: 'Cantonment', status: 'RESTORED', offsetMinutes: 45, ip_hash: 'seed_ip_13' },
    { city: 'Lahore', area: 'Gulberg III', status: 'OUTAGE', offsetMinutes: 50, ip_hash: 'seed_ip_14' },
    { city: 'Islamabad', area: 'F-10 Markaz', status: 'RESTORED', offsetMinutes: 55, ip_hash: 'seed_ip_15' },
    { city: 'Rawalpindi', area: 'Satellite Town', status: 'OUTAGE', offsetMinutes: 65, ip_hash: 'seed_ip_16' },
    { city: 'Quetta', area: 'Jinnah Road', status: 'OUTAGE', offsetMinutes: 75, ip_hash: 'seed_ip_17' },
    { city: 'Hyderabad', area: 'Latifabad', status: 'RESTORED', offsetMinutes: 90, ip_hash: 'seed_ip_18' },
    { city: 'Gujranwala', area: 'Civil Lines', status: 'OUTAGE', offsetMinutes: 110, ip_hash: 'seed_ip_19' },
    { city: 'Karachi', area: 'Gulshan-e-Iqbal', status: 'OUTAGE', offsetMinutes: 130, ip_hash: 'seed_ip_20' }
  ];

  const seedTransaction = db.transaction((reports) => {
    for (const r of reports) {
      const d = new Date(Date.now() - r.offsetMinutes * 60 * 1000);
      const created_at = d.toISOString().replace('T', ' ').substring(0, 19);
      insertStmt.run({
        city: r.city,
        area: r.area,
        status: r.status,
        created_at,
        ip_hash: r.ip_hash
      });
    }
  });

  seedTransaction(sampleReports);
  console.log('Seeding complete.');
}

module.exports = db;
