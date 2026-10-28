const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function genQR() { return crypto.randomBytes(12).toString('hex'); }

// GET /api/events/:id/guests
router.get('/:id/guests', authenticate, async (req, res, next) => {
  try {
    const { search, group, rsvp, page = 1, limit = 50 } = req.query;
    const where = { eventId: req.params.id };
    if (search) where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } }
    ];
    if (group) where.group = group;
    if (rsvp) where.rsvpStatus = rsvp;

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where, skip: (Number(page) - 1) * Number(limit),
        take: Number(limit), orderBy: { name: 'asc' }
      }),
      prisma.guest.count({ where })
    ]);
    res.json({ guests, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// POST /api/events/:id/guests
router.post('/:id/guests', authenticate, async (req, res, next) => {
  try {
    const guest = await prisma.guest.create({
      data: { eventId: req.params.id, qrToken: genQR(), ...req.body }
    });
    res.status(201).json(guest);
  } catch (err) { next(err); }
});

// PUT /api/events/:id/guests/:gid
router.put('/:id/guests/:gid', authenticate, async (req, res, next) => {
  try {
    const { id, gid } = req.params;
    const { qrToken, eventId, ...data } = req.body;
    const updated = await prisma.guest.update({ where: { id: gid }, data });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id/guests/:gid
router.delete('/:id/guests/:gid', authenticate, async (req, res, next) => {
  try {
    await prisma.guest.delete({ where: { id: req.params.gid } });
    res.json({ message: 'Guest deleted' });
  } catch (err) { next(err); }
});

// POST /api/events/:id/guests/import - CSV import
router.post('/:id/guests/import', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const content = req.file.buffer.toString('utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have header and at least one row' });

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const results = { imported: 0, skipped: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });

      if (!row.name) { results.skipped++; continue; }
      try {
        await prisma.guest.create({
          data: {
            eventId: req.params.id,
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            group: row.group || null,
            mealPref: row.mealpref || row.meal_pref || null,
            plusOnes: parseInt(row.plusones || row.plus_ones || '0') || 0,
            notes: row.notes || null,
            qrToken: genQR(),
          }
        });
        results.imported++;
      } catch (e) {
        results.errors.push(`Row ${i + 1}: ${e.message}`);
        results.skipped++;
      }
    }
    res.json(results);
  } catch (err) { next(err); }
});

// GET /api/events/:id/guests/:gid/qr - generate QR code
router.get('/:id/guests/:gid/qr', authenticate, async (req, res, next) => {
  try {
    const QRCode = require('qrcode');
    const guest = await prisma.guest.findUnique({ where: { id: req.params.gid } });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const qrData = JSON.stringify({ token: guest.qrToken, guestId: guest.id, eventId: req.params.id });
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 256, margin: 2 });
    res.json({ qrDataUrl, qrToken: guest.qrToken });
  } catch (err) { next(err); }
});

module.exports = router;
