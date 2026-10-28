const express = require('express');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/events/:id/donations
router.get('/:id/donations', authenticate, async (req, res, next) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { eventId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    const total = donations.reduce((s, d) => s + d.amount, 0);
    res.json({ donations, total, count: donations.length });
  } catch (err) { next(err); }
});

// POST /api/events/:id/donations
router.post('/:id/donations', authenticate, async (req, res, next) => {
  try {
    const donation = await prisma.donation.create({
      data: { eventId: req.params.id, ...req.body }
    });
    res.status(201).json(donation);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id/donations/:did
router.delete('/:id/donations/:did', authenticate, async (req, res, next) => {
  try {
    await prisma.donation.delete({ where: { id: req.params.did } });
    res.json({ message: 'Donation deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
