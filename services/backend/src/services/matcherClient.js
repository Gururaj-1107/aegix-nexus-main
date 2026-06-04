const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = 
    0.5 - Math.cos(dLat)/2 + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function dispatchMatcher(reqData) {
  // 1. Fetch available volunteers from DB using Prisma
  const volunteersList = await prisma.volunteer.findMany({
    where: { status: 'AVAILABLE' },
    include: {
      skills: {
        include: { skill: true }
      }
    }
  });

  const volunteers = volunteersList.map(v => ({
    id: v.volunteer_id,
    lat: v.current_lat,
    lng: v.current_lng,
    skills: v.skills.map(vs => vs.skill.skill_name)
  }));

  if (volunteers.length === 0) {
     return null; // No one available
  }

  // 2. Filter by requested skill
  const eligibleVolunteers = volunteers.filter(v => v.skills.includes(reqData.skill));
  if (eligibleVolunteers.length === 0) {
      return null;
  }

  // 3. Find closest match natively via Haversine distance
  let bestMatch = null;
  let minDistance = Infinity;

  for (const v of eligibleVolunteers) {
      const distance = getDistance(reqData.lat, reqData.lng, v.lat, v.lng);
      if (distance < minDistance) {
          minDistance = distance;
          bestMatch = v;
      }
  }

  if (bestMatch) {
      return {
          id: bestMatch.id,
          distance_km: minDistance.toFixed(2),
          lat: bestMatch.lat,
          lng: bestMatch.lng
      };
  }

  return null;
}

module.exports = { dispatchMatcher };
