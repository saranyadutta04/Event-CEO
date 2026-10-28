const express = require('express');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/events/:id/tasks
router.get('/:id/tasks', authenticate, async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { eventId: req.params.id },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { order: 'asc' }]
    });
    res.json(tasks);
  } catch (err) { next(err); }
});

// POST /api/events/:id/tasks
router.post('/:id/tasks', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.task.count({ where: { eventId: req.params.id } });
    const task = await prisma.task.create({
      data: {
        eventId: req.params.id,
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        order: count,
      }
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// PUT /api/events/:id/tasks/:tid
router.put('/:id/tasks/:tid', authenticate, async (req, res, next) => {
  try {
    const { eventId, id, ...data } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.tid },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }
    });
    res.json(task);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id/tasks/:tid
router.delete('/:id/tasks/:tid', authenticate, async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.tid } });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
});

// POST /api/events/:id/tasks/bulk - bulk create tasks (from AI plan)
router.post('/:id/tasks/bulk', authenticate, async (req, res, next) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ error: 'tasks must be an array' });

    const count = await prisma.task.count({ where: { eventId: req.params.id } });
    const created = await prisma.$transaction(
      tasks.map((t, i) => prisma.task.create({
        data: {
          eventId: req.params.id,
          title: t.title,
          category: t.category || null,
          owner: t.owner || null,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          priority: t.priority || 'medium',
          status: 'todo',
          progress: 0,
          aiGenerated: true,
          order: count + i,
        }
      }))
    );
    res.status(201).json(created);
  } catch (err) { next(err); }
});

module.exports = router;
