const express = require('express');
const prisma = require('../db/prisma');

const router = express.Router();

// GET /api/checkin/scan/:qrToken - scan QR and check in guest
router.post('/scan', async (req, res, next) => {
  try {
    const { qrToken, eventId } = req.body;
    if (!qrToken) return res.status(400).json({ error: 'qrToken is required' });

    const guest = await prisma.guest.findUnique({ where: { qrToken } });
    if (!guest) return res.status(404).json({ error: 'Guest not found. Invalid QR code.' });
    if (eventId && guest.eventId !== eventId) {
      return res.status(403).json({ error: 'QR code is for a different event.' });
    }
    if (guest.checkedIn) {
      return res.status(409).json({
        error: 'Guest already checked in',
        guest: { name: guest.name, checkedInAt: guest.checkedInAt },
        alreadyCheckedIn: true
      });
    }

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: { checkedIn: true, checkedInAt: new Date() }
    });
    res.json({ success: true, guest: updated, message: `Welcome, ${updated.name}! ✨` });
  } catch (err) { next(err); }
});

// GET /api/checkin/event/:eventId/stats
router.get('/event/:eventId/stats', async (req, res, next) => {
  try {
    const guests = await prisma.guest.findMany({
      where: { eventId: req.params.eventId },
      select: { id: true, name: true, group: true, checkedIn: true, checkedInAt: true, rsvpStatus: true }
    });
    res.json({
      total: guests.length,
      checkedIn: guests.filter(g => g.checkedIn).length,
      rsvpYes: guests.filter(g => g.rsvpStatus === 'yes').length,
      recentCheckIns: guests
        .filter(g => g.checkedIn)
        .sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt))
        .slice(0, 10)
    });
  } catch (err) { next(err); }
});

module.exports = router;
