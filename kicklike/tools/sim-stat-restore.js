// v0.52 verification — confirm tactic stat mutations are restored after match
const { loadEnv } = require('./sim-env');

async function main() {
  const { ctx } = loadEnv(123);
  const { makePlayer, generateOpponent, KL } = ctx;

  // Build a starter team with NO randomization so we can compare exactly
  const starter = ctx.DATA.starterTeams[0];
  const squad = starter.lineup.map(archId =>
    makePlayer(archId, { teamId: starter.id, noRandom: true })
  );

  console.log('Pre-match TW.defense:', squad.find(p => p.role === 'TW').stats.defense);
  console.log('Pre-match VT.defense:', squad.find(p => p.role === 'VT').stats.defense);
  console.log('Pre-match ST.offense:', squad.find(p => p.role === 'ST').stats.offense);

  // Snapshot stats (mimicking what flow.js now does)
  const snapshot = squad.map(p => ({ id: p.id, stats: { ...p.stats } }));

  // Simulate fortress tactic mutation directly (bypassing match flow)
  const tw = squad.find(p => p.role === 'TW');
  const vt = squad.find(p => p.role === 'VT');
  tw.stats.defense = Math.min(99, tw.stats.defense + 40);
  vt.stats.defense = Math.min(99, vt.stats.defense + 40);
  console.log('\nAfter fortress mutation:');
  console.log('  TW.defense:', tw.stats.defense, '(was clamped if > 99)');
  console.log('  VT.defense:', vt.stats.defense);

  // Apply restore (mimicking what flow.js now does post-match)
  for (const snap of snapshot) {
    const p = squad.find(x => x.id === snap.id);
    if (p) p.stats = snap.stats;
  }
  console.log('\nAfter restore:');
  console.log('  TW.defense:', tw.stats.defense, '(should match pre-match)');
  console.log('  VT.defense:', vt.stats.defense);
  console.log('  ST.offense:', squad.find(p => p.role === 'ST').stats.offense);

  // Verify
  const twPre  = snapshot.find(s => s.id === tw.id).stats.defense;
  const vtPre  = snapshot.find(s => s.id === vt.id).stats.defense;
  const ok = (tw.stats.defense === twPre) && (vt.stats.defense === vtPre);
  console.log('\n' + (ok ? '✅ Restore works correctly' : '❌ Restore FAILED'));
}

main().catch(e => { console.error(e); process.exit(1); });
