const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const eventSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid('wedding', 'birthday', 'college', 'community').required(),
  date: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().optional().allow('', null),
  venue: Joi.string().min(2).required(),
  city: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  guestCount: Joi.number().integer().min(0).default(0),
  budget: Joi.number().min(0).default(0),
  currency: Joi.string().default('INR'),
  surpriseMode: Joi.boolean().default(false),
  language: Joi.string().valid('en', 'hi', 'bn').default('en'),
  coverImage: Joi.string().optional().allow('', null),
});

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-' + crypto.randomBytes(3).toString('hex');
}

// GET /api/events - list user's events
router.get('/', authenticate, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      include: {
        _count: { select: { guests: true, tasks: true, budgetItems: true } },
        guests: { select: { rsvpStatus: true, checkedIn: true } },
        tasks: { select: { status: true } },
        budgetItems: { select: { estimated: true, actual: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = events.map(e => ({
      ...e,
      stats: {
        totalGuests: e._count.guests,
        rsvpYes: e.guests.filter(g => g.rsvpStatus === 'yes').length,
        rsvpNo: e.guests.filter(g => g.rsvpStatus === 'no').length,
        rsvpMaybe: e.guests.filter(g => g.rsvpStatus === 'maybe').length,
        rsvpPending: e.guests.filter(g => g.rsvpStatus === 'pending').length,
        checkedIn: e.guests.filter(g => g.checkedIn).length,
        tasksTotal: e._count.tasks,
        tasksDone: e.tasks.filter(t => t.status === 'done').length,
        budgetEstimated: e.budgetItems.reduce((s, b) => s + b.estimated, 0),
        budgetActual: e.budgetItems.reduce((s, b) => s + b.actual, 0),
      },
      guests: undefined, tasks: undefined, budgetItems: undefined, _count: undefined
    }));

    res.json(enriched);
  } catch (err) { next(err); }
});

// POST /api/events - create event
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error, value } = eventSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const slug = generateSlug(value.title);
    const publicToken = crypto.randomBytes(12).toString('hex');

    const event = await prisma.event.create({
      data: {
        ...value,
        date: new Date(value.date),
        endDate: value.endDate ? new Date(value.endDate) : null,
        slug,
        publicToken,
        organizerId: req.user.id,
      }
    });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// GET /api/events/:id - get single event with full details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizerId: req.user.id },
      include: {
        guests: { orderBy: { name: 'asc' } },
        tasks: { orderBy: [{ status: 'asc' }, { order: 'asc' }] },
        budgetItems: { orderBy: { category: 'asc' } },
        functions: { orderBy: { order: 'asc' } },
        donations: { orderBy: { createdAt: 'desc' } },
        competitions: { include: { registrations: true } },
        _count: { select: { guests: true, tasks: true } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Compute stats
    const stats = {
      totalGuests: event.guests.length,
      rsvpYes: event.guests.filter(g => g.rsvpStatus === 'yes').length,
      rsvpNo: event.guests.filter(g => g.rsvpStatus === 'no').length,
      rsvpMaybe: event.guests.filter(g => g.rsvpStatus === 'maybe').length,
      rsvpPending: event.guests.filter(g => g.rsvpStatus === 'pending').length,
      checkedIn: event.guests.filter(g => g.checkedIn).length,
      tasksTotal: event.tasks.length,
      tasksDone: event.tasks.filter(t => t.status === 'done').length,
      budgetEstimated: event.budgetItems.reduce((s, b) => s + b.estimated, 0),
      budgetActual: event.budgetItems.reduce((s, b) => s + b.actual, 0),
      totalDonations: event.donations.reduce((s, d) => s + d.amount, 0),
      daysLeft: Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24)),
    };

    res.json({ ...event, stats });
  } catch (err) { next(err); }
});

// PUT /api/events/:id - update event
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizerId: req.user.id }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { error, value } = eventSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...value,
        date: new Date(value.date),
        endDate: value.endDate ? new Date(value.endDate) : null,
      }
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, organizerId: req.user.id }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
});

// GET /api/events/:id/functions
router.get('/:id/functions', authenticate, async (req, res, next) => {
  try {
    const fns = await prisma.eventFunction.findMany({
      where: { eventId: req.params.id },
      orderBy: { order: 'asc' }
    });
    res.json(fns);
  } catch (err) { next(err); }
});

// POST /api/events/:id/functions
router.post('/:id/functions', authenticate, async (req, res, next) => {
  try {
    const fn = await prisma.eventFunction.create({
      data: { eventId: req.params.id, ...req.body }
    });
    res.status(201).json(fn);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id/functions/:fnId
router.delete('/:id/functions/:fnId', authenticate, async (req, res, next) => {
  try {
    await prisma.eventFunction.delete({ where: { id: req.params.fnId } });
    res.json({ message: 'Function deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
