// ─────────────────────────────────────────────────────────────────────────────
// tools/sim-regression.js — Headless match-engine regression test.
//
// Runs a set of deterministic match scenarios and compares the results
// to a committed snapshot (tools/sim-snapshots.json). If anything
// drifts — different score, different shot count, different condition
// drain — the test fails loudly and shows the diff.
//
// Scenarios cover:
//   * Each starter team vs an amateur-stage opponent  (balance sanity)
//   * A strong squad vs a boss-like high-power opp    (loss-path coverage)
//   * Same seed, two runs                             (determinism guard)
//   * Each phase's default tactic (balanced / reset / keep_cool)
//     exercised implicitly — other scenarios can vary tactics.
//
// Usage:
//   node tools/sim-regression.js            # compare against snapshot
//   node tools/sim-regression.js --update   # rewrite snapshot (intentional change)
//   node tools/sim-regression.js --verbose  # also print each scenario's result
//
// Exits 0 when all scenarios match, 1 when any drift is detected, 2 on
// infrastructure errors (load failures, etc). Wire into CI.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { loadEnv, summarize } = require('./sim-env');

const SNAPSHOT_PATH = path.join(__dirname, 'sim-snapshots.json');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// ─── Scenario definitions ────────────────────────────────────────────
// Each scenario is a (name, seed, setup) tuple where setup returns
// { squad, opp, picks } — a ready-to-run match configuration. Seeds
// are hand-picked and frozen; they're not magic numbers, just labels
// for "the deterministic RNG stream that produced this snapshot".
//
// Adding a scenario? Run with --update afterwards to freeze its
// expected result.
const SCENARIOS = [
  {
    name: 'starter-pressing-vs-amateur',
    seed: 42,
    setup(ctx) {
      const team = ctx.DATA.starterTeams.find(t => t.id === 'pressing')
                || ctx.DATA.starterTeams[0];
      return {
        squad: team.lineup.map(a =>
          ctx.makePlayer(a, { teamId: team.id, noRandom: true })),
        opp: ctx.generateOpponent(1),
        picks: {
          kickoff: ctx.DATA.kickoffTactics.find(t => t.id === 'balanced'),
          halftime: ctx.DATA.halftimeOptions.find(t => t.id === 'reset'),
          final:   ctx.DATA.finalOptions.find(t => t.id === 'keep_cool')
        }
      };
    }
  },
  {
    name: 'starter-possession-vs-amateur',
    seed: 42,
    setup(ctx) {
      const team = ctx.DATA.starterTeams.find(t => t.id === 'ballbesitz')
                || ctx.DATA.starterTeams[0];
      return {
        squad: team.lineup.map(a =>
          ctx.makePlayer(a, { teamId: team.id, noRandom: true })),
        opp: ctx.generateOpponent(1),
        picks: {
          kickoff: ctx.DATA.kickoffTactics.find(t => t.id === 'possession'),
          halftime: ctx.DATA.halftimeOptions.find(t => t.id === 'vision_play'),
          final:   ctx.DATA.finalOptions.find(t => t.id === 'midfield')
        }
      };
    }
  },
  {
    name: 'starter-konter-vs-amateur-aggressive',
    seed: 1001,
    setup(ctx) {
      const team = ctx.DATA.starterTeams.find(t => t.id === 'konter')
                || ctx.DATA.starterTeams[0];
      return {
        squad: team.lineup.map(a =>
          ctx.makePlayer(a, { teamId: team.id, noRandom: true })),
        opp: ctx.generateOpponent(1),
        picks: {
          kickoff: ctx.DATA.kickoffTactics.find(t => t.id === 'aggressive'),
          halftime: ctx.DATA.halftimeOptions.find(t => t.id === 'push'),
          final:   ctx.DATA.finalOptions.find(t => t.id === 'long_ball')
        }
      };
    }
  },
  {
    name: 'starter-konter-vs-pro-defensive',
    seed: 7,
    setup(ctx) {
      const team = ctx.DATA.starterTeams.find(t => t.id === 'konter')
                || ctx.DATA.starterTeams[0];
      return {
        squad: team.lineup.map(a =>
          ctx.makePlayer(a, { teamId: team.id, noRandom: true })),
        opp: ctx.generateOpponent(15),  // Pro-stage opponent, tougher
        picks: {
          kickoff: ctx.DATA.kickoffTactics.find(t => t.id === 'defensive'),
          halftime: ctx.DATA.halftimeOptions.find(t => t.id === 'stabilize'),
          final:   ctx.DATA.finalOptions.find(t => t.id === 'sneaky')
        }
      };
    }
  },
  {
    name: 'starter-pressing-vs-boss',
    seed: 12345,
    setup(ctx) {
      const team = ctx.DATA.starterTeams.find(t => t.id === 'pressing')
                || ctx.DATA.starterTeams[0];
      return {
        squad: team.lineup.map(a =>
          ctx.makePlayer(a, { teamId: team.id, noRandom: true })),
        opp: ctx.generateOpponent(28),  // late-game boss
        picks: {
          kickoff: ctx.DATA.kickoffTactics.find(t => t.id === 'pressing'),
          halftime: ctx.DATA.halftimeOptions.find(t => t.id === 'high_press'),
          final:   ctx.DATA.finalOptions.find(t => t.id === 'final_press')
        }
      };
    }
  }
];

// Run a single scenario end-to-end. The env is fresh per scenario so
// there's no cross-contamination between runs (state mutations, opp
// memory, achievements etc).
async function runScenario(sc) {
  const env = loadEnv(sc.seed);
  const { ctx } = env;
  const setup = sc.setup(ctx);
  const { squad, opp, picks } = setup;

  ctx.state.currentOpponent = opp;
  ctx.state.teamName = 'Test Team';
  ctx.state.starterTeamId = 'test';
  ctx.state.roster = squad;
  ctx.state.lineupIds = squad.map(p => p.id);

  const onEvent = async (ev) => {
    if (ev.type === 'interrupt' && picks[ev.phase]) {
      return picks[ev.phase];
    }
    if (ev.type === 'interrupt') {
      const opts = ev.event?.options || [];
      if (opts.length) return opts[0];
    }
    return null;
  };

  const ret = await ctx.KL.engine.startMatch(squad, opp, onEvent);
  const match = ret.match || ret;
  return {
    ...summarize(match, squad, opp),
    result: ret.result  // 'win' | 'loss' | 'draw'
  };
}

// Deep-equal for our snapshot shape. Returns null if equal, else a
// human-readable diff string.
function diff(a, b, trailPrefix = '') {
  if (a === b) return null;
  if (typeof a !== typeof b) return `${trailPrefix} type changed: ${typeof a} → ${typeof b}`;
  if (a == null || b == null) return `${trailPrefix} value: ${JSON.stringify(a)} → ${JSON.stringify(b)}`;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return `${trailPrefix} array/non-array mismatch`;
    }
    if (a.length !== b.length) {
      return `${trailPrefix} length: ${a.length} → ${b.length}`;
    }
    for (let i = 0; i < a.length; i++) {
      const d = diff(a[i], b[i], `${trailPrefix}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const d = diff(a[k], b[k], `${trailPrefix}.${k}`);
      if (d) return d;
    }
    return null;
  }
  return `${trailPrefix}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`;
}

async function main() {
  const snapshot = fs.existsSync(SNAPSHOT_PATH)
    ? JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'))
    : {};

  console.log(`Running ${SCENARIOS.length} scenarios${UPDATE ? ' (UPDATE MODE)' : ''}...\n`);
  const t0 = Date.now();

  const current = {};
  const failures = [];

  for (const sc of SCENARIOS) {
    const result = await runScenario(sc);
    current[sc.name] = result;

    const expected = snapshot[sc.name];
    if (!expected) {
      console.log(`✨ ${sc.name}  (new — add with --update)`);
      if (VERBOSE) console.log('     ', JSON.stringify(result));
      failures.push({ name: sc.name, reason: 'new scenario, no snapshot yet' });
      continue;
    }

    const d = diff(expected, result);
    if (d) {
      console.log(`❌ ${sc.name}`);
      console.log(`     diff: ${d}`);
      if (VERBOSE) {
        console.log(`     expected: ${JSON.stringify(expected)}`);
        console.log(`     got:      ${JSON.stringify(result)}`);
      }
      failures.push({ name: sc.name, diff: d });
    } else {
      console.log(`✅ ${sc.name}  —  ${result.final.me}-${result.final.opp} (${result.result})`);
      if (VERBOSE) {
        console.log(`     shots ${result.stats.myShots}:${result.stats.oppShots}  ·  momentum ${result.finalMomentum}`);
      }
    }
  }

  // Determinism guard: re-run the first scenario once more and verify
  // identical output. If this fails, we've introduced a Math.random
  // bypass somewhere (Date.now in hot path, unseeded shuffle, etc).
  if (SCENARIOS.length > 0) {
    const again = await runScenario(SCENARIOS[0]);
    const d = diff(current[SCENARIOS[0].name], again);
    if (d) {
      console.log(`\n❌ DETERMINISM BROKEN — same seed, different result: ${d}`);
      failures.push({ name: '<determinism>', diff: d });
    } else {
      console.log(`\n✅ Determinism OK — same seed produces the same result.`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nElapsed: ${elapsed}s`);

  if (UPDATE) {
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(current, null, 2) + '\n');
    console.log(`Snapshot written to ${path.relative(process.cwd(), SNAPSHOT_PATH)}`);
    process.exit(0);
  }

  if (failures.length) {
    console.log(`\n${failures.length} failure(s). Re-run with --update if the change is intentional.`);
    process.exit(1);
  } else {
    console.log('All scenarios match the snapshot.');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('INFRA ERROR:', e?.message || e);
  console.error(e?.stack);
  process.exit(2);
});
