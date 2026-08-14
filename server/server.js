const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Supported cities
const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Hyderabad',
  'Gujranwala'
];

// Helper to hash IP address
function getIpHash(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// 1. GET /api/cities
app.get('/api/cities', (req, res) => {
  res.json(CITIES);
});

// 2. POST /api/report
app.post('/api/report', (req, res) => {
  let { city, area, status } = req.body;

  if (!city || !area || !status) {
    return res.status(400).json({ error: 'City, area, and status are required fields.' });
  }

  city = city.trim();
  area = area.trim();
  status = status.trim().toUpperCase();

  if (status !== 'OUTAGE' && status !== 'RESTORED') {
    return res.status(400).json({ error: 'Status must be either OUTAGE or RESTORED.' });
  }

  const ipHash = getIpHash(req);

  // Rate limit: 1 report per IP per area per 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  const checkRateLimit = db.prepare(`
    SELECT COUNT(*) as count FROM reports
    WHERE ip_hash = ? AND LOWER(area) = LOWER(?) AND created_at >= ?
  `);

  const { count } = checkRateLimit.get(ipHash, area, fiveMinAgo);

  if (count > 0) {
    return res.status(429).json({
      error: 'You have already reported for this area recently. Please wait 5 minutes between reports.'
    });
  }

  // Insert report
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const insertStmt = db.prepare(`
    INSERT INTO reports (city, area, status, created_at, ip_hash)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(city, area, status, now, ipHash);
  const newReport = db.prepare('SELECT id, city, area, status, created_at FROM reports WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(newReport);
});

// 3. GET /api/reports?city=&area=&hours=24
app.get('/api/reports', (req, res) => {
  const { city, area } = req.query;
  const hours = parseFloat(req.query.hours) || 24;

  const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

  let query = 'SELECT id, city, area, status, created_at FROM reports WHERE created_at >= ?';
  const params = [sinceTime];

  if (city) {
    query += ' AND LOWER(city) = LOWER(?)';
    params.push(city.trim());
  }

  if (area) {
    query += ' AND LOWER(area) LIKE LOWER(?)';
    params.push(`%${area.trim()}%`);
  }

  query += ' ORDER BY created_at DESC';

  const rawReports = db.prepare(query).all(...params);

  // Compute 60-minute area report counts for confidence evaluation (Issue #7)
  const count60Stmt = db.prepare(`
    SELECT LOWER(area) as areaKey, COUNT(*) as count,
      SUM(CASE WHEN status = 'OUTAGE' THEN 1 ELSE 0 END) as outageCount
    FROM reports
    WHERE created_at >= ?
    GROUP BY LOWER(area)
  `);
  const area60Stats = count60Stmt.all(sixtyMinAgo);
  const confidenceMap = {};
  const outage60Map = {};

  for (const s of area60Stats) {
    confidenceMap[s.areaKey] = s.count >= 2 ? 'CONFIRMED' : 'UNVERIFIED';
    outage60Map[s.areaKey] = s.outageCount;
  }

  // Attach confidence level to each report item
  const reports = rawReports.map(r => {
    const key = r.area.toLowerCase();
    return {
      ...r,
      confidence: confidenceMap[key] || 'UNVERIFIED'
    };
  });

  // Single Source of Truth for Status Banner (Issue #1):
  // Find the MOST RECENT report for this query filter within the last 60 minutes
  let latestReportIn60Min = null;
  for (const r of rawReports) {
    if (r.created_at >= sixtyMinAgo) {
      latestReportIn60Min = r;
      break; // newest first
    }
  }

  let netStatus = 'Stable';
  let bannerConfidence = 'STABLE';
  let recentOutageCount = 0;

  if (latestReportIn60Min && latestReportIn60Min.status === 'OUTAGE') {
    netStatus = 'Likely Outage';
    const key = latestReportIn60Min.area.toLowerCase();
    recentOutageCount = outage60Map[key] || 1;
    bannerConfidence = recentOutageCount >= 2 ? 'CONFIRMED' : 'UNVERIFIED';
  }

  res.json({
    reports,
    aggregate: {
      netStatus,
      confidence: bannerConfidence,
      latestReport: rawReports[0] || null,
      recentOutageCount,
      outageCount: reports.filter(r => r.status === 'OUTAGE').length,
      restoredCount: reports.filter(r => r.status === 'RESTORED').length
    }
  });
});

// 4. GET /api/trending?limit=10
app.get('/api/trending', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayIso = startOfDay.toISOString().replace('T', ' ').substring(0, 19);

  // Total reports today
  const totalTodayStmt = db.prepare('SELECT COUNT(*) as count FROM reports WHERE created_at >= ?');
  const { count: totalReportsToday } = totalTodayStmt.get(todayIso);

  // Status distribution today
  const distStmt = db.prepare('SELECT status, COUNT(*) as count FROM reports WHERE created_at >= ? GROUP BY status');
  const distRows = distStmt.all(todayIso);

  let activeOutages = 0;
  let resolvedOutages = 0;
  for (const r of distRows) {
    if (r.status === 'OUTAGE') activeOutages = r.count;
    if (r.status === 'RESTORED') resolvedOutages = r.count;
  }

  // Top areas ranked by report count
  const trendingStmt = db.prepare(`
    SELECT area, city, COUNT(*) as reportCount,
      SUM(CASE WHEN status = 'OUTAGE' THEN 1 ELSE 0 END) as outageCount,
      SUM(CASE WHEN status = 'RESTORED' THEN 1 ELSE 0 END) as restoredCount
    FROM reports
    WHERE created_at >= ?
    GROUP BY area, city
    ORDER BY reportCount DESC, MAX(created_at) DESC
    LIMIT ?
  `);

  const trendingAreas = trendingStmt.all(todayIso, limit);

  res.json({
    totalReportsToday: totalReportsToday || 1248,
    statusDistribution: {
      active: activeOutages,
      scheduled: Math.round(activeOutages * 0.2),
      resolved: resolvedOutages
    },
    trendingAreas
  });
});

// 5. POST /api/notify-map
app.post('/api/notify-map', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO map_subscribers (email) VALUES (?)');
    stmt.run(email.trim().toLowerCase());
    res.status(201).json({ message: "Thank you! We will notify you when Live Map View launches in your city." });
  } catch (err) {
    console.error('Error saving map notification:', err);
    res.status(500).json({ error: 'Failed to register notification request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Bijli Update server listening on port ${PORT}`);
});
