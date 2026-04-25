const { loadEnv, summarize } = require('./sim-env');

async function main() {
  const { ctx } = loadEnv(42);
  const { makePlayer, generateOpponent } = ctx;

  // Pick a starter team from the config and build its squad.
  const starter = ctx.DATA.starterTeams[0];
  console.log(`Starter team: ${starter.id} (${starter.name || '?'})`);

  const squad = starter.lineup.map(archId =>
    makePlayer(archId, { teamId: starter.id, noRandom: true })
  );
  console.log(`Squad: ${squad.map(p => `${p.role} ${p.name}`).join(', ')}`);

  // Generate a round-1 opponent.
  const opp = generateOpponent(1);
  console.log(`Opponent: ${opp.name} (power ${opp.power})`);

  // state.currentOpponent is read inside the engine for logs;
  // set it up minimally.
  ctx.state.currentOpponent = opp;
  ctx.state.teamName = starter.name || starter.id;
  ctx.state.starterTeamId = starter.id;
  ctx.state.roster = squad;
  ctx.state.lineupIds = squad.map(p => p.id);

  // Collect events and respond to phase-interrupts. The engine asks
  // for a tactic at kickoff / halftime / final via
  // onEvent({type:'interrupt', phase, match}); normally the UI would
  // show a picker. In the headless sim we return a safe balanced pick
  // for each phase. Different test scenarios can override this to
  // exercise specific tactics.
  const events = [];
  const DEFAULT_PICKS = {
    kickoff:  ctx.DATA.kickoffTactics.find(t => t.id === 'balanced'),
    halftime: ctx.DATA.halftimeOptions.find(t => t.id === 'reset'),
    final:    ctx.DATA.finalOptions.find(t => t.id === 'keep_cool')
  };
  const onEvent = async (ev) => {
    events.push({ type: ev.type, phase: ev.phase });
    if (ev.type === 'interrupt') {
      if (DEFAULT_PICKS[ev.phase]) return DEFAULT_PICKS[ev.phase];
      // Modal in-match event — grab first option.
      const opts = ev.event?.options || [];
      if (opts.length) return opts[0];
    }
    return null;
  };

  console.log('\nRunning match...');
  const t0 = Date.now();
  const ret = await ctx.KL.engine.startMatch(squad, opp, onEvent);
  const match = ret.match || ret;
  const dt = Date.now() - t0;
  console.log(`Done in ${dt}ms. Events: ${events.length}. Result: ${ret.result}`);

  const sum = summarize(match, squad, opp);
  console.log('\nResult:');
  console.log(`  Final: ${sum.final.me}-${sum.final.opp} (${sum.rounds} rounds)`);
  console.log(`  My shots: ${sum.stats.myShots} (${sum.stats.myShotsOnTarget} on target) from ${sum.stats.myBuildupsOk}/${sum.stats.myBuildups} buildups`);
  console.log(`  Opp shots: ${sum.stats.oppShots} (${sum.stats.oppShotsOnTarget} on target) from ${sum.stats.oppBuildups} buildups`);
  console.log(`  Final momentum: ${sum.finalMomentum}`);
  console.log(`  Triggers: ${sum.triggers}`);
  console.log(`  Squad conditions after:`);
  for (const p of sum.squadConditions) console.log(`    ${p.role}: ${p.cond}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
