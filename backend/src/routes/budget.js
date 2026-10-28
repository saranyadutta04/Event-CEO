const express = require('express');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/events/:id/budget
router.get('/:id/budget', authenticate, async (req, res, next) => {
  try {
    const items = await prisma.budgetItem.findMany({
      where: { eventId: req.params.id },
      orderBy: { category: 'asc' }
    });

    const summary = {
      totalEstimated: items.reduce((s, i) => s + i.estimated, 0),
      totalActual: items.reduce((s, i) => s + i.actual, 0),
      totalPaid: items.reduce((s, i) => s + i.paid, 0),
      byCategory: {},
    };

    items.forEach(item => {
      if (!summary.byCategory[item.category]) {
        summary.byCategory[item.category] = { estimated: 0, actual: 0, paid: 0 };
      }
      summary.byCategory[item.category].estimated += item.estimated;
      summary.byCategory[item.category].actual += item.actual;
      summary.byCategory[item.category].paid += item.paid;
    });

    res.json({ items, summary });
  } catch (err) { next(err); }
});

// POST /api/events/:id/budget
router.post('/:id/budget', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.budgetItem.create({
      data: { eventId: req.params.id, ...req.body }
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PUT /api/events/:id/budget/:bid
router.put('/:id/budget/:bid', authenticate, async (req, res, next) => {
  try {
    const { eventId, id, ...data } = req.body;
    const item = await prisma.budgetItem.update({ where: { id: req.params.bid }, data });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id/budget/:bid
router.delete('/:id/budget/:bid', authenticate, async (req, res, next) => {
  try {
    await prisma.budgetItem.delete({ where: { id: req.params.bid } });
    res.json({ message: 'Budget item deleted' });
  } catch (err) { next(err); }
});

// POST /api/events/:id/budget/bulk
router.post('/:id/budget/bulk', authenticate, async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });

    const created = await prisma.$transaction(
      items.map(item => prisma.budgetItem.create({
        data: {
          eventId: req.params.id,
          category: item.category,
          name: item.name,
          estimated: item.estimated || 0,
          actual: 0, paid: 0,
          aiGenerated: true,
        }
      }))
    );
    res.status(201).json(created);
  } catch (err) { next(err); }
});

module.exports = router;
