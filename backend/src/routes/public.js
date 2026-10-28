const express = require('express');
const prisma = require('../db/prisma');

const router = express.Router();

// GET /api/public/event/:token - public event page
router.get('/event/:token', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { publicToken: req.params.token },
      include: {
        functions: { orderBy: { order: 'asc' } },
        competitions: { select: { id: true, name: true, description: true, category: true, maxTeamSize: true, prize: true } },
        donations: { 
          where: { isAnonymous: false },
          select: { donorName: true, amount: true, message: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { guests: true } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Compute total donations
    const allDonations = await prisma.donation.aggregate({
      where: { eventId: event.id },
      _sum: { amount: true },
      _count: true
    });

    // Don't expose organizer details or private tokens
    const { organizerId, ...safe } = event;
    res.json({
      ...safe,
      donationStats: {
        total: allDonations._sum.amount || 0,
        count: allDonations._count,
      }
    });
  } catch (err) { next(err); }
});

// POST /api/public/event/:token/rsvp
router.post('/event/:token/rsvp', async (req, res, next) => {
  try {
    const { guestToken, status, partySize, mealChoice, message } = req.body;

    if (!guestToken || !status) {
      return res.status(400).json({ error: 'guestToken and status are required' });
    }
    if (!['yes', 'no', 'maybe'].includes(status)) {
      return res.status(400).json({ error: 'status must be yes, no, or maybe' });
    }

    const event = await prisma.event.findUnique({ where: { publicToken: req.params.token } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const guest = await prisma.guest.findUnique({ where: { qrToken: guestToken } });
    if (!guest || guest.eventId !== event.id) {
      return res.status(404).json({ error: 'Guest not found for this event' });
    }

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        rsvpStatus: status,
        partySize: partySize || 1,
        mealPref: mealChoice || guest.mealPref,
        notes: message || guest.notes,
        rsvpAt: new Date(),
      }
    });

    res.json({ success: true, rsvp: { status: updated.rsvpStatus, partySize: updated.partySize } });
  } catch (err) { next(err); }
});

// POST /api/public/event/:token/donate
router.post('/event/:token/donate', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { publicToken: req.params.token } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.type !== 'community') return res.status(403).json({ error: 'Donations only for community events' });

    const { donorName, amount, message, isAnonymous } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const donation = await prisma.donation.create({
      data: { eventId: event.id, donorName: donorName || 'Anonymous', amount, message, isAnonymous: isAnonymous || false }
    });
    res.status(201).json(donation);
  } catch (err) { next(err); }
});

// POST /api/public/event/:token/competitions/:cid/register
router.post('/event/:token/competitions/:cid/register', async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { publicToken: req.params.token } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const reg = await prisma.competitionRegistration.create({
      data: {
        competitionId: req.params.cid,
        teamName: req.body.teamName,
        members: typeof req.body.members === 'string' ? req.body.members : JSON.stringify(req.body.members),
        email: req.body.email,
        phone: req.body.phone || null,
      }
    });
    res.status(201).json({ ...reg, certUrl: `/api/events/${event.id}/competitions/${req.params.cid}/registrations/${reg.id}/certificate` });
  } catch (err) { next(err); }
});

module.exports = router;
