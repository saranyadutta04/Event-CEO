const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');
const { generateEventPlan, generateInvitation } = require('../services/aiService');

const router = express.Router();

// Rate limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '10'),
  message: { error: 'Too many AI requests. Please wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/ai/generate-plan
router.post('/generate-plan', authenticate, aiLimiter, async (req, res, next) => {
  try {
    const { eventId, preferences } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId: req.user.id }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const input = {
      type: event.type,
      title: event.title,
      eventDate: event.date.toISOString(),
      guestCount: event.guestCount,
      budget: event.budget,
      city: event.city,
      preferences: preferences || '',
      language: event.language,
    };

    const { plan, source, model, error: aiError } = await generateEventPlan(input);

    // Save AI plan to DB
    const aiPlan = await prisma.aiPlan.create({
      data: {
        eventId,
        prompt: JSON.stringify(input),
        response: JSON.stringify(plan),
        model: model || 'template-fallback',
      }
    });

    res.json({
      id: aiPlan.id,
      plan,
      source,
      model,
      warning: aiError ? 'AI service unavailable — template plan used' : undefined,
    });
  } catch (err) { next(err); }
});

// POST /api/ai/apply-plan/:planId - apply AI plan to event
router.post('/apply-plan/:planId', authenticate, async (req, res, next) => {
  try {
    const aiPlan = await prisma.aiPlan.findUnique({
      where: { id: req.params.planId },
      include: { event: true }
    });
    if (!aiPlan) return res.status(404).json({ error: 'AI plan not found' });
    if (aiPlan.event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (aiPlan.applied) return res.status(409).json({ error: 'Plan already applied' });

    const plan = typeof aiPlan.response === 'string' ? JSON.parse(aiPlan.response) : aiPlan.response;
    const eventId = aiPlan.eventId;
    const eventDate = aiPlan.event.date;

    const results = { tasksCreated: 0, budgetItemsCreated: 0, errors: [] };

    // Create tasks
    if (Array.isArray(plan.tasks)) {
      const existingCount = await prisma.task.count({ where: { eventId } });
      for (let i = 0; i < plan.tasks.length; i++) {
        const t = plan.tasks[i];
        try {
          const dueDate = new Date(eventDate);
          dueDate.setDate(dueDate.getDate() - (t.daysBeforeEvent || 7));
          await prisma.task.create({
            data: {
              eventId, title: t.title, category: t.category || null,
              dueDate, priority: t.priority || 'medium',
              status: 'todo', aiGenerated: true, order: existingCount + i,
            }
          });
          results.tasksCreated++;
        } catch (e) { results.errors.push(`Task: ${e.message}`); }
      }
    }

    // Create budget items
    if (Array.isArray(plan.budgetBreakdown)) {
      for (const b of plan.budgetBreakdown) {
        try {
          await prisma.budgetItem.create({
            data: {
              eventId, category: b.category, name: b.name,
              estimated: b.estimated || 0, actual: 0, paid: 0, aiGenerated: true,
            }
          });
          results.budgetItemsCreated++;
        } catch (e) { results.errors.push(`Budget: ${e.message}`); }
      }
    }

    // Mark plan as applied
    await prisma.aiPlan.update({
      where: { id: req.params.planId },
      data: { applied: true, appliedAt: new Date() }
    });

    res.json({ success: true, ...results, planId: req.params.planId });
  } catch (err) { next(err); }
});

// POST /api/ai/invitation
router.post('/invitation', authenticate, aiLimiter, async (req, res, next) => {
  try {
    const { eventId, tone, language } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId: req.user.id }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { invitation, source, error: aiError } = await generateInvitation(event, tone, language || event.language);

    res.json({
      invitation,
      source,
      warning: aiError ? 'AI unavailable — template used' : undefined,
    });
  } catch (err) { next(err); }
});

// GET /api/ai/plans/:eventId - list AI plans for event
router.get('/plans/:eventId', authenticate, async (req, res, next) => {
  try {
    const plans = await prisma.aiPlan.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, model: true, applied: true, appliedAt: true, createdAt: true }
    });
    res.json(plans);
  } catch (err) { next(err); }
});

// GET /api/ai/plans/detail/:planId
router.get('/plans/detail/:planId', authenticate, async (req, res, next) => {
  try {
    const plan = await prisma.aiPlan.findUnique({ where: { id: req.params.planId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json({ ...plan, response: typeof plan.response === 'string' ? JSON.parse(plan.response) : plan.response });
  } catch (err) { next(err); }
});

module.exports = router;
