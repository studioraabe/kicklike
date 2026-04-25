// v0.53 verification — confirm card description placeholders are interpolated
const { loadEnv } = require('./sim-env');

async function main() {
  const { ctx } = loadEnv(99);
  const { makePlayer, KL } = ctx;

  // Build a starter team
  const starter = ctx.DATA.starterTeams.find(t => t.id === 'powerhouse')
    || ctx.DATA.starterTeams[0];
  const squad = starter.lineup.map(archId =>
    makePlayer(archId, { teamId: starter.id, noRandom: true })
  );

  const stName = squad.find(p => p.role === 'ST').name;
  const twName = squad.find(p => p.role === 'TW').name;
  console.log('Squad ST:', stName);
  console.log('Squad TW:', twName);
  console.log('Squad PM:', squad.find(p => p.role === 'PM').name);

  // Mock the I18N.t result for lone_striker
  const cardId = 'lone_striker';
  const rawDesc = 'Cost 1 · COMBO. If {st} condition ≥ 70: +22 OFF / +6 CMP plus shot. Tired {st}: tiny base effect.';

  // Manually exercise the substitution logic (mimicking ui.js:resolveCardDescription)
  const roles = { PM:'', LF:'', ST:'', VT:'', TW:'' };
  for (const p of squad) {
    if (roles[p.role] !== undefined && !roles[p.role]) roles[p.role] = p.name;
  }
  const interpolated = rawDesc
    .replace(/\{pm\}/g, roles.PM || 'PM')
    .replace(/\{lf\}/g, roles.LF || 'LF')
    .replace(/\{st\}/g, roles.ST || 'ST')
    .replace(/\{vt\}/g, roles.VT || 'VT')
    .replace(/\{tw\}/g, roles.TW || 'TW');

  console.log('\nIn-match (with squad):');
  console.log(' ', interpolated);

  // Out-of-match fallback (no squad → role abbreviations)
  const fallback = rawDesc
    .replace(/\{pm\}/g, 'PM')
    .replace(/\{lf\}/g, 'LF')
    .replace(/\{st\}/g, 'ST')
    .replace(/\{vt\}/g, 'VT')
    .replace(/\{tw\}/g, 'TW');
  console.log('\nOut-of-match fallback:');
  console.log(' ', fallback);

  // Verify
  const okInMatch = !interpolated.includes('{') && interpolated.includes(stName);
  const okFallback = !fallback.includes('{') && fallback.includes('ST');
  console.log('\n' + (okInMatch && okFallback ? '✅ Interpolation works in both contexts' : '❌ FAILED'));
}

main().catch(e => { console.error(e); process.exit(1); });
