# Dev tools

Static audits and headless tests that run under plain Node (no build
step, no deps). Wire these into CI to catch drift automatically.

## `audit-persist.js`

Verifies every `state.*` field referenced in the JS code is either
in `PERSIST_FIELDS` (survives save/load) or the `KNOWN_TRANSIENT`
deny-list. Exits 1 on drift.

```
node tools/audit-persist.js
```

## `audit-tactics.js`

Verifies every kickoff / halftime / final tactic declared in
`config-data.js` has a matching handler in the corresponding registry
in `engine.js`, and flags orphan handlers. Exits 1 on drift.

```
node tools/audit-tactics.js
```

## `sim-env.js`

Not run directly. Loads every gameplay module under Node's `vm`
with a minimal DOM stub and a seedable RNG. Used by the match-sim
tools below.

## `sim-match.js`

Runs one match end-to-end and prints a summary. Useful for quick
sanity checks without needing the browser.

```
node tools/sim-match.js
```

## `sim-regression.js`

Runs a set of frozen scenarios and compares against
`sim-snapshots.json`. Exits 1 on any drift.

```
node tools/sim-regression.js            # compare
node tools/sim-regression.js --update   # rewrite snapshot after
                                          # an intentional change
node tools/sim-regression.js -v         # verbose per-scenario stats
```

Runtime: ~25s for 5 scenarios.

## Suggested CI hookup

All three audit/test tools are side-effect-free and fast:

```sh
node tools/audit-persist.js  && \
node tools/audit-tactics.js  && \
node tools/sim-regression.js
```

Any non-zero exit means a regression, and the output points at the
exact field or scenario that changed.
