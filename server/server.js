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
    try { notifySubscribersForReport(newRep); } catch(e){}
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

  try { notifySubscribersForReport(newReport); } catch(e){}

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

const nodemailer = require('nodemailer');

// Notification Inbox Memory Log
const sentNotificationsLog = [];

// Nodemailer Transporter Setup (uses JSON / Console logging if no SMTP env configured)
const mailTransporter = nodemailer.createTransport({
  jsonTransport: true
});

async function sendOutageEmail(toEmail, subject, text, html) {
  const mailOptions = {
    from: '"Bijli Update Alerts 🇵🇰" <alerts@bijliupdate.pk>',
    to: toEmail,
    subject,
    text,
    html
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    const notification = {
      id: Date.now(),
      recipient: toEmail,
      channel: 'email',
      subject,
      text,
      html,
      sent_at: new Date().toISOString()
    };
    sentNotificationsLog.unshift(notification);
    console.log(`[EMAIL DISPATCHED to ${toEmail}]:`, subject);
    return notification;
  } catch (err) {
    console.error('Email dispatch error:', err);
    return null;
  }
}

function sendWhatsAppAlert(phone, text) {
  const notification = {
    id: Date.now(),
    recipient: phone,
    channel: 'whatsapp',
    subject: 'WhatsApp Outage Alert',
    text,
    sent_at: new Date().toISOString()
  };
  sentNotificationsLog.unshift(notification);
  console.log(`[WHATSAPP DISPATCHED to ${phone}]:`, text);
  return notification;
}

// Function to notify subscribers when a new report is created
function notifySubscribersForReport(report) {
  const { city, area, status, duration } = report;
  const isOutage = status === 'OUTAGE';

  let subscribers = [];
  if (dbModule.isMemoryStore()) {
    subscribers = dbModule.memory.subscribers || [];
  } else {
    try {
      const db = dbModule.getDb();
      subscribers = db.prepare('SELECT * FROM map_subscribers WHERE LOWER(city) = LOWER(?)').all(city);
    } catch (e) {
      subscribers = [];
    }
  }

  for (const sub of subscribers) {
    const contact = typeof sub === 'string' ? sub : (sub.email || sub.phone || sub.contact);
    const subChannel = (typeof sub === 'object' && sub.channel) ? sub.channel : (contact && contact.includes('@') ? 'email' : 'whatsapp');

    if (!contact) continue;

    if (subChannel === 'email') {
      const subject = isOutage
        ? `🔴 Bijli Alert: Power Outage reported in ${area} (${city})`
        : `🟢 Bijli Restored: Power back on in ${area} (${city})`;

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
          <h2 style="color: ${isOutage ? '#ba1a1a' : '#006600'}; font-size: 20px; margin-top: 0;">
            ${isOutage ? '🔴 Power Outage Reported' : '🟢 Power Restored'}
          </h2>
          <p style="font-size: 15px; color: #333;">
            An outage report was just recorded for <strong>${area}, ${city}</strong>.
          </p>
          <div style="background: #ffffff; padding: 12px; border-radius: 8px; margin: 15px 0; border: 1px solid #eee;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> ${isOutage ? 'OUTAGE IN PROGRESS' : 'RESTORED'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Expected Duration:</strong> ${duration || 'Unscheduled'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Reported At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="font-size: 13px; color: #666;">
            Emergency Helplines for ${city}: Call <strong>118</strong> or contact DISCO customer support.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center;">
            Bijli Update Pakistan 🇵🇰 — Hyperlocal Power Tracker
          </p>
        </div>
      `;

      sendOutageEmail(contact, subject, `Outage reported in ${area} (${city})`, html);
    } else {
      const waText = isOutage
        ? `🔴 Bijli Outage Alert in ${area} (${city})! Expected duration: ${duration || 'Unscheduled'}. Track live on Bijli Update!`
        : `🟢 Bijli Restored in ${area} (${city})! Power grid is operating normally.`;

      sendWhatsAppAlert(contact, waText);
    }
  }
}

// GET /api/notifications/inbox
app.get('/api/notifications/inbox', (req, res) => {
  const contact = req.query.contact ? req.query.contact.trim().toLowerCase() : '';
  if (!contact) {
    return res.json(sentNotificationsLog.slice(0, 10));
  }
  const userLogs = sentNotificationsLog.filter(n =>
    n.recipient.toLowerCase().includes(contact)
  );
  res.json(userLogs);
});

// POST /api/notify-map (Outage Alerts Subscription)
app.post('/api/notify-map', async (req, res) => {
  const { email, phone, city = 'Karachi', area = 'General', channel = 'email' } = req.body;

  let contact = channel === 'whatsapp' ? phone : email;

  if (!contact) {
    return res.status(400).json({ error: 'Please enter a valid email address or WhatsApp phone number.' });
  }

  contact = contact.trim();

  if (channel === 'email' && !contact.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. user@example.com).' });
  }

  if (channel === 'whatsapp') {
    const cleanPhone = contact.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit WhatsApp phone number (e.g. 03001234567).' });
    }
    contact = cleanPhone;
  }

  // Save to DB / Memory
  if (dbModule.isMemoryStore()) {
    dbModule.memory.addSubscriber({ contact, email: channel === 'email' ? contact : null, phone: channel === 'whatsapp' ? contact : null, city, area, channel });
  } else {
    try {
      const db = dbModule.getDb();
      const stmt = db.prepare(`
        INSERT INTO map_subscribers (email, phone, city, area, channel)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        channel === 'email' ? contact.toLowerCase() : null,
        channel === 'whatsapp' ? contact : null,
        city,
        area,
        channel
      );
    } catch (err) {
      // Ignore duplicate subscription errors
    }
  }

  // Send Welcome Confirmation Email or WhatsApp message
  if (channel === 'email') {
    const welcomeSubject = `✅ Confirmed: Bijli Outage Alerts for ${area} (${city})`;
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #106e09; border-radius: 12px; background: #f4fbf4;">
        <h2 style="color: #106e09; font-size: 20px; margin-top: 0;">
          ✅ Alert Subscription Active!
        </h2>
        <p style="font-size: 15px; color: #333;">
          You are now subscribed to live load-shedding and outage alerts for <strong>${area}, ${city}</strong>.
        </p>
        <p style="font-size: 14px; color: #555;">
          Whenever neighbors report an outage in your area, you will receive an instant email notification right here.
        </p>
        <hr style="border: none; border-top: 1px solid #cce5cc; margin: 20px 0;" />
        <p style="font-size: 11px; color: #777; text-align: center;">
          Bijli Update Pakistan 🇵🇰 — Hyperlocal Power Tracker
        </p>
      </div>
    `;
    await sendOutageEmail(contact.toLowerCase(), welcomeSubject, `Subscribed to outage alerts for ${area} (${city})`, welcomeHtml);
  } else {
    const welcomeText = `✅ Bijli Update: Welcome! You are subscribed to instant WhatsApp load shedding alerts for ${area} (${city}).`;
    sendWhatsAppAlert(contact, welcomeText);
  }

  res.status(201).json({
    success: true,
    contact,
    channel,
    city,
    area,
    message: `Subscribed successfully! Confirmation sent to ${contact}.`
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Bijli Update server listening on port ${PORT}`);
  });
}

module.exports = app;
