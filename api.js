// שרת קטן ב-Netlify: מביא מקומות מ-OpenStreetMap בצד השרת (בלי חסימות דפדפן/רשת).
const EPS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const Q = {
  food: 'nwr["amenity"~"^(restaurant|fast_food)$"]',
  coffee: 'nwr["amenity"="cafe"]',
  synagogue: 'nwr["amenity"="place_of_worship"]["religion"="jewish"]',
  mikveh: 'nwr["bath:type"="mikveh"]',
  trail: 'nwr["leisure"="nature_reserve"];nwr["boundary"="national_park"];nwr["natural"="spring"];nwr["tourism"="viewpoint"]',
  beach: 'nwr["natural"="beach"]',
  park: 'nwr["leisure"="park"]',
  kids: 'nwr["leisure"="playground"];nwr["tourism"~"^(theme_park|zoo)$"]',
  museum: 'nwr["tourism"="museum"]',
  nightlife: 'nwr["amenity"~"^(bar|pub|nightclub)$"]',
  shopping: 'nwr["shop"="mall"]',
  hotel: 'nwr["tourism"~"^(hotel|guest_house|hostel|apartment)$"]',
  sports: 'nwr["leisure"~"^(sports_centre|fitness_centre|swimming_pool)$"]',
  health: 'nwr["amenity"~"^(pharmacy|clinic|hospital)$"]',
  fuel: 'nwr["amenity"="fuel"]',
};
const UA = 'ma-yesh-baezor/1.0 (prototype)';
const out = (code, body, extra = {}) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', ...extra },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  const p = event.queryStringParameters || {};
  try {
    if (p.type === 'geocode') {
      const q = String(p.q || '').slice(0, 80);
      if (!q) return out(400, { error: 'missing q' });
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=il&accept-language=he&q=' + encodeURIComponent(q), {
        headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return out(502, { error: 'geocode HTTP ' + r.status });
      const j = await r.json();
      if (!j[0]) return out(404, { error: 'not found' });
      return out(200, { lat: +j[0].lat, lon: +j[0].lon }, { 'Cache-Control': 'public, max-age=86400' });
    }
    const lat = +p.lat, lon = +p.lon, r = Math.min(Math.max(+p.r || 3, 1), 15), cat = p.cat;
    if (!(lat > 29 && lat < 34 && lon > 34 && lon < 36.5) || !Q[cat]) return out(400, { error: 'bad params' });
    const query = '[out:json][timeout:9];(' + Q[cat].split(';').map(s => `${s}(around:${r * 1000},${lat},${lon});`).join('') + ');out center tags 120;';
    const body = 'data=' + encodeURIComponent(query);
    const elements = await Promise.any(EPS.map(async (u) => {
      const res = await fetch(u, {
        method: 'POST', body, signal: AbortSignal.timeout(8500),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      });
      if (!res.ok) throw new Error(new URL(u).host + ' HTTP ' + res.status);
      const j = await res.json();
      if (!j.elements) throw new Error(new URL(u).host + ' bad response');
      return j.elements;
    }));
    return out(200, { elements }, { 'Cache-Control': 'public, max-age=1800' });
  } catch (e) {
    const msg = e.errors ? e.errors.map(x => x.message).join(' | ') : e.message;
    return out(502, { error: msg });
  }
};
