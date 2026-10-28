const express = require('express');
const prisma = require('../db/prisma');
const { authenticate } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();

// GET /api/events/:id/competitions
router.get('/:id/competitions', authenticate, async (req, res, next) => {
  try {
    const competitions = await prisma.competition.findMany({
      where: { eventId: req.params.id },
      include: { registrations: true }
    });
    res.json(competitions);
  } catch (err) { next(err); }
});

// POST /api/events/:id/competitions
router.post('/:id/competitions', authenticate, async (req, res, next) => {
  try {
    const comp = await prisma.competition.create({
      data: { eventId: req.params.id, ...req.body }
    });
    res.status(201).json(comp);
  } catch (err) { next(err); }
});

// POST /api/events/:id/competitions/:cid/register
router.post('/:id/competitions/:cid/register', async (req, res, next) => {
  try {
    const reg = await prisma.competitionRegistration.create({
      data: {
        competitionId: req.params.cid,
        teamName: req.body.teamName,
        members: typeof req.body.members === 'string' ? req.body.members : JSON.stringify(req.body.members),
        email: req.body.email,
        phone: req.body.phone || null,
      }
    });
    res.status(201).json(reg);
  } catch (err) { next(err); }
});

// GET /api/events/:id/competitions/:cid/registrations/:rid/certificate
// Generate PDF participation certificate
router.get('/:id/competitions/:cid/registrations/:rid/certificate', async (req, res, next) => {
  try {
    const reg = await prisma.competitionRegistration.findUnique({
      where: { id: req.params.rid },
      include: { competition: { include: { event: true } } }
    });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    const { competition, teamName, members: membersJson } = reg;
    const members = JSON.parse(membersJson || '[]');
    const event = competition.event;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${reg.id}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    doc.pipe(res);

    // Certificate background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f0e2e');
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#7c3aed').lineWidth(3);
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke('#a78bfa').lineWidth(1);

    // Header
    doc.fillColor('#a78bfa').fontSize(14).text('🎓 CERTIFICATE OF PARTICIPATION', { align: 'center' }).moveDown(0.5);
    doc.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold').text(event.title, { align: 'center' }).moveDown(0.5);
    doc.fillColor('#a78bfa').fontSize(16).font('Helvetica').text(`${competition.name} · ${new Date(event.date).toDateString()}`, { align: 'center' }).moveDown(1);

    doc.fillColor('#e2e8f0').fontSize(14).text('This is to certify that', { align: 'center' }).moveDown(0.5);
    doc.fillColor('#fbbf24').fontSize(26).font('Helvetica-Bold').text(teamName, { align: 'center' }).moveDown(0.3);

    if (members.length > 0) {
      doc.fillColor('#a78bfa').fontSize(13).font('Helvetica').text('Team Members: ' + members.join(', '), { align: 'center' }).moveDown(0.5);
    }

    doc.fillColor('#e2e8f0').fontSize(14).text('participated in', { align: 'center' }).moveDown(0.3);
    doc.fillColor('#34d399').fontSize(20).font('Helvetica-Bold').text(competition.name, { align: 'center' }).moveDown(1);

    if (competition.prize) {
      doc.fillColor('#fbbf24').fontSize(13).font('Helvetica').text(`Prize Pool: ${competition.prize}`, { align: 'center' }).moveDown(0.5);
    }

    doc.fillColor('#94a3b8').fontSize(11).text(
      `Certificate ID: ${reg.certToken} · Issued: ${new Date().toDateString()} · ${event.city}`,
      { align: 'center' }
    );

    doc.end();
  } catch (err) { next(err); }
});

module.exports = router;
