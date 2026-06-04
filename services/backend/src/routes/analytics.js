const express = require('express');
const router = express.Router();

// GET /api/analytics/timeline — reports count by date for last 30 days
router.get('/timeline', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const reports = await req.prisma.report.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { timestamp: true }
    });
    const countByDate = {};
    reports.forEach(r => {
      const date = r.timestamp.toISOString().slice(0, 10);
      countByDate[date] = (countByDate[date] || 0) + 1;
    });
    const result = Object.entries(countByDate).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    res.json(result);
  } catch (error) {
    console.error('[Analytics /timeline Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/skills — volunteer skill distribution
router.get('/skills', async (req, res) => {
  try {
    const skills = await req.prisma.skill.findMany({ include: { volunteer_skills: true } });
    res.json(skills.map(s => ({ name: s.skill_name, count: s.volunteer_skills.length })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/centers — top centers by activity
router.get('/centers', async (req, res) => {
  try {
    const centers = await req.prisma.nGOCenter.findMany({
      include: { reports: { include: { needs: { include: { dispatches: true } } } } }
    });
    const ranked = centers.map(c => {
      const reportCount = c.reports.length;
      const dispatchCount = c.reports.reduce((sum, r) => sum + r.needs.reduce((s, n) => s + n.dispatches.length, 0), 0);
      return { name: c.name, reports: reportCount, dispatches: dispatchCount, total: reportCount + dispatchCount };
    }).sort((a, b) => b.total - a.total);
    res.json(ranked);
  } catch (error) {
    console.error('[Analytics /centers Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
