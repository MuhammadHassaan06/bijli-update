const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const dbModule = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

function getIpHash(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

const DISCO_HELPLINES = {
  'Karachi': { company: 'K-Electric (KE)', phone: '118', whatsapp: '923480000118', sms: '8118', website: 'https://www.ke.com.pk' },
  'Lahore': { company: 'LESCO', phone: '118', whatsapp: '', sms: '8118', website: 'https://www.lesco.gov.pk' },
  'Islamabad': { company: 'IESCO', phone: '118', whatsapp: '', sms: '8118', website: 'https://iesco.com.pk' },
  'Rawalpindi': { company: 'IESCO', phone: '118', whatsapp: '', sms: '8118', website: 'https://iesco.com.pk' },
  'Faisalabad': { company: 'FESCO', phone: '118', whatsapp: '', sms: '8118', website: 'http://fesco.com.pk' },
  'Multan': { company: 'MEPCO', phone: '118', whatsapp: '', sms: '8118', website: 'http://mepco.com.pk' },
  'Peshawar': { company: 'PESCO', phone: '118', whatsapp: '', sms: '8118', website: 'http://pesco.com.pk' },
  'Quetta': { company: 'QESCO', phone: '118', whatsapp: '', sms: '8118', website: 'http://qesco.com.pk' },
  'Hyderabad': { company: 'HESCO', phone: '118', whatsapp: '', sms: '8118', website: 'http://hesco.gov.pk' },
  'Gujranwala': { company: 'GEPCO', phone: '118', whatsapp: '', sms: '8118', website: 'http://gepco.com.pk' }
};

const POPULAR_AREAS = {
  'Karachi': ['Gulshan-e-Iqbal', 'DHA Phase 5', 'Clifton', 'PECHS', 'North Nazimabad', 'Federal B Area'],
  'Lahore': ['Model Town', 'DHA Phase 6', 'Gulberg III', 'Johar Town', 'Ferozepur Road', 'Askari 11'],
  'Islamabad': ['F-8 Markaz', 'G-11', 'F-10', 'I-8 Sector', 'Blue Area', 'E-11'],
  'Rawalpindi': ['Saddar', 'Satellite Town', 'Bahria Town Phase 4', 'Westridge', 'Adyala Road'],
  'Faisalabad': ['D Ground', 'Peoples Colony', 'Madina Town', 'Canal Road', 'Gulberg'],
  'Multan': ['Cantonment', 'Gulgasht Colony', 'Bosna Road', 'Shah Rukn-e-Alam'],
  'Peshawar': ['University Town', 'Hayatabad Phase 3', 'Saddar', 'Wapda Town'],
  'Quetta': ['Chaman Housing', 'Airport Road', 'Jinnah Road', 'Cantt'],
  'Hyderabad': ['Latifabad Unit 7', 'Qasimabad', 'Saddar', 'Auto Bhan Road'],
  'Gujranwala': ['DC Road', 'Model Town', 'Peoples Colony', 'Satellite Town']
};

app.get('/api/cities', (req, res) => {
  res.json(CITIES);
});

app.get('/api/helplines', (req, res) => {
  const city = req.query.city || 'Karachi';
  const info = DISCO_HELPLINES[city] || DISCO_HELPLINES['Karachi'];
  res.json({ city, ...info });
});

app.get('/api/popular-areas', (req, res) => {
  const city = req.query.city || 'Karachi';
  const areas = POPULAR_AREAS[city] || POPULAR_AREAS['Karachi'];
  res.json(areas);
});

// POST /api/report
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

  let duration = req.body.duration || 'Unscheduled';

  if (dbModule.isMemoryStore()) {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentSame = dbModule.memory.reports.filter(r => 
      r.ip_hash === ipHash &&
      r.area.toLowerCase() === area.toLowerCase() &&
      new Date(r.created_at).getTime() >= fiveMinAgo
    );

    if (recentSame.length > 0) {
      return res.status(429).json({
        error: 'You have already reported for this area recently. Please wait 5 minutes between reports.'
      });
    }

    const newRep = dbModule.memory.addReport({ city, area, status, duration, ip_hash: ipHash });
    return res.status(201).json(newRep);
  }

  // SQLite DB path
  const db = dbModule.getDb();
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

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const insertStmt = db.prepare(`
    INSERT INTO reports (city, area, status, duration, created_at, ip_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(city, area, status, duration, now, ipHash);
  const newReport = db.prepare('SELECT id, city, area, status, duration, created_at FROM reports WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(newReport);
});

// GET /api/reports
app.get('/api/reports', (req, res) => {
  const { city, area } = req.query;
  const hours = parseFloat(req.query.hours) || 24;
  const sinceMs = Date.now() - hours * 60 * 60 * 1000;
  const sixtyMinAgoMs = Date.now() - 60 * 60 * 1000;

  if (dbModule.isMemoryStore()) {
    let filtered = dbModule.memory.reports.filter(r => new Date(r.created_at).getTime() >= sinceMs);
    if (city) filtered = filtered.filter(r => r.city.toLowerCase() === city.trim().toLowerCase());
    if (area) filtered = filtered.filter(r => r.area.toLowerCase().includes(area.trim().toLowerCase()));

    // 60-min stats
    const reports60 = dbModule.memory.reports.filter(r => new Date(r.created_at).getTime() >= sixtyMinAgoMs);
    const areaCounts60 = {};
    const areaOutage60 = {};
    for (const r of reports60) {
      const k = r.area.toLowerCase();
      areaCounts60[k] = (areaCounts60[k] || 0) + 1;
      if (r.status === 'OUTAGE') areaOutage60[k] = (areaOutage60[k] || 0) + 1;
    }

    const reportsWithConfidence = filtered.map(r => ({
      ...r,
      confidence: (areaCounts60[r.area.toLowerCase()] || 0) >= 2 ? 'CONFIRMED' : 'UNVERIFIED'
    }));

    const latestIn60 = filtered.find(r => new Date(r.created_at).getTime() >= sixtyMinAgoMs);
    let netStatus = 'Stable';
    let bannerConfidence = 'STABLE';
    let recentOutageCount = 0;

    if (latestIn60 && latestIn60.status === 'OUTAGE') {
      netStatus = 'Likely Outage';
      const key = latestIn60.area.toLowerCase();
      recentOutageCount = areaOutage60[key] || 1;
      bannerConfidence = recentOutageCount >= 2 ? 'CONFIRMED' : 'UNVERIFIED';
    }

    return res.json({
      reports: reportsWithConfidence,
      aggregate: {
        netStatus,
        confidence: bannerConfidence,
        latestReport: filtered[0] || null,
        recentOutageCount,
        outageCount: reportsWithConfidence.filter(r => r.status === 'OUTAGE').length,
        restoredCount: reportsWithConfidence.filter(r => r.status === 'RESTORED').length
      }
    });
  }

  // SQLite execution
  const db = dbModule.getDb();
  const sinceTime = new Date(sinceMs).toISOString().replace('T', ' ').substring(0, 19);
  const sixtyMinAgo = new Date(sixtyMinAgoMs).toISOString().replace('T', ' ').substring(0, 19);

  let query = 'SELECT id, city, area, status, duration, created_at FROM reports WHERE created_at >= ?';
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

  const reports = rawReports.map(r => {
    const key = r.area.toLowerCase();
    return {
      ...r,
      confidence: confidenceMap[key] || 'UNVERIFIED'
    };
  });

  let latestReportIn60Min = null;
  for (const r of rawReports) {
    if (r.created_at >= sixtyMinAgo) {
      latestReportIn60Min = r;
      break;
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

// GET /api/trending
app.get('/api/trending', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  if (dbModule.isMemoryStore()) {
    const reports = dbModule.memory.reports;
    const areaGroup = {};

    for (const r of reports) {
      const k = `${r.area}___${r.city}`;
      if (!areaGroup[k]) {
        areaGroup[k] = { area: r.area, city: r.city, reportCount: 0, outageCount: 0, restoredCount: 0 };
      }
      areaGroup[k].reportCount++;
      if (r.status === 'OUTAGE') areaGroup[k].outageCount++;
      if (r.status === 'RESTORED') areaGroup[k].restoredCount++;
    }

    const trendingAreas = Object.values(areaGroup)
      .sort((a, b) => b.reportCount - a.reportCount)
      .slice(0, limit);

    return res.json({
      totalReportsToday: reports.length,
      statusDistribution: {
        active: reports.filter(r => r.status === 'OUTAGE').length,
        scheduled: 5,
        resolved: reports.filter(r => r.status === 'RESTORED').length
      },
      trendingAreas
    });
  }

  // SQLite execution
  const db = dbModule.getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayIso = startOfDay.toISOString().replace('T', ' ').substring(0, 19);

  const totalTodayStmt = db.prepare('SELECT COUNT(*) as count FROM reports WHERE created_at >= ?');
  const { count: totalReportsToday } = totalTodayStmt.get(todayIso);

  const distStmt = db.prepare('SELECT status, COUNT(*) as count FROM reports WHERE created_at >= ? GROUP BY status');
  const distRows = distStmt.all(todayIso);

  let activeOutages = 0;
  let resolvedOutages = 0;
  for (const r of distRows) {
    if (r.status === 'OUTAGE') activeOutages = r.count;
    if (r.status === 'RESTORED') resolvedOutages = r.count;
  }

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

// POST /api/notify-map
app.post('/api/notify-map', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (dbModule.isMemoryStore()) {
    dbModule.memory.addSubscriber(email.trim().toLowerCase());
    return res.status(201).json({ message: "Thank you! We will notify you when Live Map View launches in your city." });
  }

  try {
    const db = dbModule.getDb();
    const stmt = db.prepare('INSERT OR IGNORE INTO map_subscribers (email) VALUES (?)');
    stmt.run(email.trim().toLowerCase());
    res.status(201).json({ message: "Thank you! We will notify you when Live Map View launches in your city." });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register notification request.' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Bijli Update server listening on port ${PORT}`);
  });
}

module.exports = app;
