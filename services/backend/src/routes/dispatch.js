const express = require('express');
const router = express.Router();

// GET /api/dispatches/recent — last 10 dispatches
router.get('/recent', async (req, res) => {
  try {
    const dispatches = await req.prisma.dispatch.findMany({
      take: 10, orderBy: { dispatched_at: 'desc' },
      include: {
        volunteer: { select: { first_name: true, last_name: true } },
        need: { include: { skill: true, report: { select: { urgency_level: true, description: true } } } }
      }
    });
    res.json(dispatches.map(d => ({
      id: d.dispatch_id, 
      volunteer_name: d.volunteer ? `${d.volunteer.first_name} ${d.volunteer.last_name}` : "Unknown Volunteer",
      skill: d.need?.skill?.skill_name || "General", 
      urgency: d.need?.report?.urgency_level || "MEDIUM",
      status: d.status, 
      eta_minutes: d.eta_minutes || 0, 
      dispatched_at: d.dispatched_at,
      description: d.need?.report?.description || "No description"
    })));
  } catch (error) {
    console.error('[Dispatch /recent Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dispatch/auto — Smart auto-dispatch (E1)
router.post('/auto', async (req, res) => {
  try {
    const { need_id } = req.body;
    if (!need_id) return res.status(400).json({ error: 'need_id required' });

    const need = await req.prisma.need.findUnique({
      where: { need_id }, include: { report: { include: { center: true } }, skill: true }
    });
    if (!need) return res.status(404).json({ error: 'Need not found' });
    if (!need.report.center) return res.status(400).json({ error: 'Need has no associated NGO center' });

    const centerLat = need.report.center.lat;
    const centerLng = need.report.center.lng;

    // Find volunteers with the required skill
    const candidates = await req.prisma.volunteer.findMany({
      where: { status: { in: ['ACTIVE', 'STANDBY'] }, skills: { some: { skill_id: need.skill_id } } },
      include: { skills: { include: { skill: true } } }
    });

    if (candidates.length === 0) return res.status(404).json({ error: 'No matching volunteers available' });

    // Haversine distance
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Score and rank
    const scored = candidates.map(v => {
      const dist = haversine(v.current_lat, v.current_lng, centerLat, centerLng);
      const score = (1 / Math.max(dist, 0.1)) * 100 + (v.status === 'ACTIVE' ? 20 : 0);
      return { volunteer: v, distance: dist, score };
    }).sort((a, b) => b.score - a.score);

    const best = scored[0];
    const eta = Math.round(best.distance * 3 + 5); // rough ETA

    const dispatch = await req.prisma.dispatch.create({
      data: { need_id, volunteer_id: best.volunteer.volunteer_id, eta_minutes: eta, status: 'EN_ROUTE' }
    });
    await req.prisma.volunteer.update({ where: { volunteer_id: best.volunteer.volunteer_id }, data: { status: 'EN_ROUTE' } });
    await req.prisma.need.update({ where: { need_id }, data: { status: 'FULFILLED' } });

    res.json({
      success: true, dispatch_id: dispatch.dispatch_id,
      volunteer_name: `${best.volunteer.first_name} ${best.volunteer.last_name}`,
      distance_km: best.distance.toFixed(2), eta_minutes: eta, score: best.score.toFixed(1)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
