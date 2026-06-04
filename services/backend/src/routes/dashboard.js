const express = require('express');
const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const p = req.prisma;
    const total_volunteers = await p.volunteer.count();
    const active_volunteers = await p.volunteer.count({ where: { status: 'ACTIVE' } });
    const total_reports = await p.report.count();
    const critical_reports = await p.report.count({ where: { urgency_level: 'CRITICAL' } });
    const pending_needs = await p.need.count({ where: { status: 'PENDING' } });
    const fulfilled_needs = await p.need.count({ where: { status: 'FULFILLED' } });
    const total_dispatches = await p.dispatch.count();
    const completed_dispatches = await p.dispatch.count({ where: { status: 'COMPLETED' } });
    res.json({ total_volunteers, active_volunteers, total_reports, critical_reports, pending_needs, fulfilled_needs, total_dispatches, completed_dispatches });
  } catch (error) {
    console.error('[Dashboard Route Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
