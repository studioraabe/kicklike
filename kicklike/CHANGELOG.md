# Changelog — Review & Cleanup Sprint

## v0.60.2 — Probable-Situations predictor fix

The pre-match "Probable Situations" panel was surfacing the same two
frames in almost every match: `GOALIE STREAK` (frame `keeper_in_zone`)
and `THEY ARE RATTLED` (frame `opp_star_down`). Investigation showed
both had broken trigger logic in `predictProbableFrames` —
`keeper_in_zone` had a semantically backwards formula and
`opp_star_down` was hardcoded to fire on essentially every match.

### Fixed: `keeper_in_zone` formula was rewarding opponent strength

```js
// Old:
const score = Math.max(0, Math.min(1, (twDef + oppOff - 100) / 40));
if (score > 0.2) scores.push({ id: 'keeper_in_zone', likelihood: score });
```

The formula **summed** TW defense and opp offense — meaning a strong
opp striker pushed the "your keeper is in form" probability **up**.
Concretely, a weak TW (defense 40) facing a strong opp (offense 70)
fired the frame at likelihood 0.25 (low), even though the matchup
narrative is the opposite ("your keeper will get worked over"). And
any moderately-defensive keeper (TW ≥ 60) vs any moderately-attacking
opp (offense ≥ 50) cleared the threshold trivially.

```js
// New:
const score = Math.max(0, Math.min(1, (twDef - oppOff + 5) / 25));
if (score > 0.25) scores.push({ id: 'keeper_in_zone', likelihood: score });
```

Now uses the **difference** — TW needs to stand out relative to the
expected attacking pressure for the frame to fire. Threshold raised
to 0.25 (from 0.2) so the frame doesn't show up on marginal edges.

Behaviour sweep:

| TW DEF | Opp OFF | Old likelihood | New likelihood |
|---|---|---|---|
| 40 | 70 | 0.25 (fires low) | — (no fire) |
| 60 | 60 | 0.50 (fires med) | — (no fire, threshold) |
| 70 | 50 | 0.50 (fires med) | 1.00 (fires high) |
| 80 | 70 | 1.00 (fires high) | 0.60 (fires med) |
| 90 | 90 | 1.00 (fires high) | — (no fire — no edge) |

The frame now actually predicts what its title says.

### Fixed: `opp_star_down` was a hardcoded constant

```js
// Old:
if (opp.traitHolders && Object.keys(opp.traitHolders).length > 0) {
  scores.push({ id: 'opp_star_down', likelihood: 0.35 });
}
```

The trigger was just "does the opponent have any traitHolders". Every
generated opponent does (entities.js always assigns trait holders),
so this fired on every single match at exactly 0.35 likelihood —
which renders as one dot (low). Wasn't a predictor; was a constant
filler that always took up a slot in the top-3 list.

```js
// New:
if (oppCmp < 65) {
  const likelihood = Math.max(0, Math.min(0.9, (65 - oppCmp) / 30));
  if (likelihood > 0.2) scores.push({ id: 'opp_star_down', likelihood });
}
```

Now scales with opp composure — softer composure → more likely to
lose rhythm during the match. Above 65 composure, the frame doesn't
fire at all (such opponents are too mentally stable for a pre-match
predictor to call this reliably). The frame is narratively a
match-moment event regardless; the predictor only ever estimates
the chance, not a guarantee.

Behaviour sweep:

| Opp CMP | Old | New |
|---|---|---|
| 30 | 0.35 (low) | 0.90 (high) |
| 50 | 0.35 (low) | 0.50 (med) |
| 55 | 0.35 (low) | 0.33 (low) |
| 60 | 0.35 (low) | — (no fire) |
| 70 | 0.35 (low) | — (no fire) |

### Net effect on the panel

Previously: in any balanced matchup with no clear offense/tempo/
composure edge, the only two frames that cleared their thresholds
were these two. Result: every match showed the same `GOALIE STREAK`
+ `THEY ARE RATTLED` pair, often with `NO PAYOFFS` next to both
(player decks rarely target either frame). The panel looked
broken-but-consistent.

Now: balanced matchups with neither a TW edge nor opp composure
softness leave both frames silent, opening top-3 slots for other
frames (`hot_corridor`, `striker_frustrated`, etc) to surface when
relevant — or for the panel to show fewer than three rows when no
specific signals fire, which is the correct behaviour.

### Notes

- `predictProbableFrames` is purely a UI helper (called from the
  pre-match hub render in `ui.js`). It does not influence any
  match-engine logic, so this is a UI/UX fix with zero gameplay
  impact at runtime.
- sim-regression unchanged (same engine, same outcomes).
- audit-persist + audit-tactics still clean.
- Two callsites changed in `decisions.js`. No other files touched
  except `version.js` (bump) and the locale changelog blocks.

---

## v0.60.1 — Pre-stable hotfix (still beta)

Pre-release checkup of v0.60.0 turned up three real bugs and two doc
nits. v0.60.0 never shipped to anyone outside the beta channel, so
this rolls into 0.60.1 — channel stays `beta` for one more cycle
before stable.

### Fixed: `confidenceBonus` didn't survive a tab reload

The win-confidence bonus added in v0.48 (+1 OFF/DEF/TMP/CMP/VIS per
league win, capped at +4 over a season) was missing from THREE
places it should have been in:

- `freshSeason()` in `state.js` — no default declared.
- `SEASON_KEYS` in `state.js` — falls through `routeFor()` to the
  session slice instead of the season slice.
- `PERSIST_FIELDS` in `persistence.js` — not snapshotted, lost on
  any save/load round-trip.

Net effect: a player builds a 4-game winning streak (full +4 buff =
+20 raw stat-points/round across the squad), closes the tab,
reopens, and the bonus has silently evaporated. Worst-case the
player notices their stronger lineup feels weaker post-resume but
has no way to diagnose why. Three-line fix:

- `state.js:freshSeason()` — `confidenceBonus: 0` declared.
- `state.js:SEASON_KEYS` — `'confidenceBonus'` added.
- `persistence.js:PERSIST_FIELDS` — `'confidenceBonus'` added.

The pre-existing season-end resets in `flow.js` (lines 1927, 1999)
keep working unchanged — they were always explicitly setting the
field to 0, so the missing default never broke season transitions
in fresh sessions; only persistence round-trips were affected.

### Fixed: ES translations of two v0.59 cards never actually shipped

The v0.59 changelog claimed "All seven rewritten in EN, DE, ES" for
the seven cards whose descriptions lied about their numbers. Audit
of `js/lang/es.js` shows only five of seven actually got the
rewrite. Two stayed on the old wording, in production, for the
entire v0.59→v0.60 cycle:

- `running_hot` ES — said "+6 OFF / +3 TMP, +5 OFF por victoria
  (máx +25)". Handler does +4 OFF / +2 TMP base + 3 OFF per win,
  cap +15. ES players overestimated the cap by 67%.
- `doping` ES — said "+40 condición, +14 OFF / +8 TMP, 25%
  amarilla". Handler does +30 condición, +10 OFF / +6 TMP (+4 OFF
  on aggressive/tempo), 15-30% backfire risk, forced backfire on
  3rd play. The ES description overstated the buff and omitted both
  the tactic-bonus and the forced-backfire trap entirely.

Both ES strings rewritten to mirror the EN/DE strings that did
ship correctly in v0.59.

### Fixed: `rope_a_dope` "only" qualifier still in DE/ES

The v0.60.0 changelog claimed the redundant "only" qualifier
("R6 only:" / "Nur R6:" / "Solo R6:") was dropped from the one
tactic that still used it, accounting for "3 string changes for
the 'only' cleanup" — one per locale. Reality: only the EN string
was updated. DE still shipped "Nur R6: +35 Defense..." and ES
still shipped "Solo R6: +35 defensa...". Both stripped now.

### Stale comments cleaned

- `engine.js:1167-1169` claimed `HALFTIME_HANDLERS` and
  `FINAL_HANDLERS` were "TODO (next sprint)". Both have been
  fully implemented for releases (now at lines 1329 and 1524 with
  20 and 16+5 handlers respectively, audit-tactics confirms
  coverage). Comment rewritten to describe current state.
- `index.html:316-337` script-order documentation listed 17
  scripts; 28 actually load. Missing from the comment were
  `opp-moves`, `narrative`, `achievements`, `cards`, `roles`,
  `league`, `codex`, `tooltip`, `match-hud`. Comment regenerated
  to match the actual script tags below it.

### Tooling

- `tools/audit-persist.js` — `_quickSim` (the per-match auto-pilot
  flag set/cleared in `flow.js:startQuickSim` / `advance`) added to
  `KNOWN_TRANSIENT` alongside `_skipAnim`. Was the second
  uncategorised field flagged by the audit pre-fix; correct
  classification is "transient", parallel to `_skipAnim`.

### Notes

- audit-persist now exits 0 (was exit 1 with two uncategorised
  fields pre-fix).
- audit-tactics unchanged (was already passing).
- sim-regression unchanged (was already passing; engine logic
  hasn't moved since v0.52, this release is purely persistence
  wiring + locale strings + comment cleanup).
- 5 string changes total: 2 ES card descs, 1 DE tactic desc, 1 ES
  tactic desc; plus one new persisted field, three new entries in
  the persistence/state allowlists, and one entry in the audit
  tool's transient list.

### Save compatibility

Bumping VERSION 0.60.0 → 0.60.1 means any existing 0.60.0 save
gets discarded by `persistence.load()` on first read after upgrade
(see the `_gameVersion` gate). This is the correct behaviour:
0.60.0 saves don't have `confidenceBonus` snapshotted, so resuming
into 0.60.1 would silently start every restored run with
confidenceBonus=0 regardless of how many wins the player had built
up. Discarding the save is honest; resurrecting it would re-create
the exact bug being fixed.

---

## v0.60.0 — Backlog sweep

Cumulative release covering five open backlog items as one sprint.
Three of them got real fixes; two were explicitly deferred with
reasoning (see end of this entry).

### Fixed: three more cards lying about their numbers (2nd-pass audit)

The v0.59 audit triaged 36 flagged cards down to 13 real fixes via
manual review. Three slipped through the manual triage and turned
up on a second pass:

| Card | Description claimed | Handler actually does |
|---|---|---|
| `preempt` | +16 DEF, +Flow 2, draw 1 (on cancel) | +22 DEF / +12 TMP / +8 CMP / +10 OFF, +Flow 2, draw 1 (on cancel). 3× the buff with three undocumented stats. |
| `counter_strike` | +22 OFF / +8 TMP hit, +8 OFF base | +28 OFF / +10 TMP hit, +10 OFF base. Off by 6/2/2 plus auto-counter trigger missing from desc. |
| `through_ball` | Setup → +Flow 2, Lane Open. Trigger → −4 DEF | Setup → +4 OFF / +4 TMP, +Flow 2, Lane Open, plus through-ball action. Trigger or Combo → −4 DEF. |

All three rewritten in EN, DE, ES. The `preempt` mismatch was the
most embarrassing: the description claimed a single +16 DEF
boost while the handler delivered four separate stat buffs totalling
+52 raw stat points. The card was always over-performing relative
to expectations; players just had no way to know why.

### Standardised: final-round tactic prefix to "R6:"

Tactic descriptions in the final phase used three different prefix
styles inconsistently:

- "Final round: +15 attack, -15 defense..." (7 tactics)
- "R6: +25 attack..." (4 tactics)
- "R6 only: +35 defense..." (1 tactic, `rope_a_dope`)

All seven "Final round:" descriptions converted to "R6:" to match
the existing R6/R4-6 round-number convention used by the rest of
the tactic pool. The "only" qualifier removed from `rope_a_dope`
since every final-phase tactic is R6-only by definition. 21 string
changes across EN, DE, ES (plus 3 for the "only" cleanup).

Reads more uniform in the picker now — every tactic opens with the
same structural marker for its time window.

### Added: secondary causes under the loss-screen verdict

The v0.56 Match-Verdict-Headline picked the dominant signal from a
priority ladder and rendered it as one italic line under the score.
On losses where multiple signals fired (fatigue + missed chances +
opp ruthless on the same match), only one made the headline. The
other diagnostic signals were silently dropped.

`computeMatchVerdict` refactored:

- Old return: `string` (the headline only)
- New return: `{ headline, causes, toString() }` where `causes` is
  an array of 0-2 secondary signal strings. `toString` returns the
  headline so anything that treated the old return as a string
  still works.

Render site (`renderResult`) reads the new shape: headline above
as before, causes (when present and result is non-win) render as a
small dim italic block below — `.result-causes` container with
`.result-cause-row` children, each prefixed by a small `·` dot,
opacity 0.78, font-size 12px.

Wins skip the causes — there's no need to dissect a victory the
same way you dissect a loss. Underdog moral wins (drew or narrowly
lost vs a much-stronger opp) get the moral framing as headline plus
the actual mechanical issues as causes — "Held the favourites —
points off a stronger side." with "Buildup play stalled — only 42%
of attempts found the runner." underneath. Both true, both useful.

### Audited but intentionally not changed

**Phase-affinity fatigue penalty.** The v0.56 design notes flagged
this as a "could come back to the table" item — extra condition
drain when a card is played off-phase. Considered again here.
Verdict: still no. The reasoning from before holds — phase-affinity
already reduces stat effect by 50–65% for off-phase plays; layering
condition drain on top would remove the player's "I need this
defense now even if it's off-phase" tactical escape valve.
Wouldn't add depth, would add punishment for forced plays. Left as
documented design choice.

**Description-voice sweep.** The flavor sentences in tactic
descriptions ("Roll the dice.", "Concede nothing, score nothing.",
"Disruption over improvement.") use deliberately varied voice. A
sweep to homogenize them would strip texture for "consistency" that
isn't actually broken — the *mechanical* voice is already
consistent after v0.57 (range prefixes) + v0.59 (OFF/DEF/TMP
shorthand). The flavor part is supposed to vary; that's what
flavor is. Left alone.

### Notes

- 9 string-changes (3 cards × 3 langs) for the audit fixes.
- 24 string-changes for the range standardisation.
- 1 JS refactor (`computeMatchVerdict`), 1 render-site update, 1
  CSS block added (`.result-causes` + `.result-cause-row`).
- No engine changes, no balance changes, no save format changes.
- Regression suite passes unchanged.

### Cumulative status (v0.51 → v0.60)

Run-through of what landed since the sprint started:

- v0.51: amateur-league onboarding (power curve cap, trait severity
  by match number)
- v0.52: snowball cure (10 stat-mutating tactics restored
  post-match), telemetry refinements
- v0.53: card-desc placeholder substitution, payoff/counter
  semantics
- v0.54: pulse-tile localization
- v0.55: second-stage onboarding tutorial (match 3)
- v0.56: QoL pass — opp-threat banner slimmed, match-verdict
  headline, probable-situations gating, quick-sim button
- v0.57: tactic description audit (Double Down logic bug, 4
  "permanent" lies, Role Switch / Mind Games omissions, log
  tooltip rewrite)
- v0.58: tactic modal redesign (header → stats → intel → choices)
- v0.58.1: modal separator fix + momentum-bar tooltip
- v0.59: card description audit (7 lies + 6 hidden mechanics)
- v0.60: backlog sweep (3 more card fixes + range standardisation
  + loss-screen secondary causes)

Engine has not changed since v0.52. Every release since has been
description, UI, or onboarding. Save format unchanged throughout.

---

## v0.59.0 — Card description audit

Same handler-vs-description sweep that v0.57 ran on tactics, now
applied to the 73-card pool. Seven cards making numerically wrong
claims; six more cards with hidden mechanics undocumented in the
description.

The audit method: extract `apply(ctx)` body from `cards.js`, parse
out `stats: { ... }` literals plus conditional pushes, compare
against the numbers the player reads in the description. Any
mismatch flagged for manual review (the handler often reads as
`base + conditional bonus`, which the regex couldn't always
disambiguate from a flat number, so manual triage was required).

### Fixed: seven descriptions lying about their numbers

| Card | Description claimed | Handler actually does |
|---|---|---|
| `stone_cold` | +55 OFF | +30 OFF / +8 CMP + guaranteed through-ball action |
| `killing_blow` | +45 OFF / +8 CMP | `min(35, 22 + lead*3)` OFF — caps at +35 |
| `running_hot` | +5 OFF per win, max +25 | +3 OFF per win, max +15 (off by 40%) |
| `hope_shot` | +6 OFF only if Flow=0 | NO buff — only 20% scrappy-goal direct action |
| `doping` | cond +40, +14/+8, 25% yellow | cond +30, +10/+6 base (+4 OFF on aggressive/tempo), 15-30% backfire (modulated by momentum), forced backfire on 3rd play |
| `second_half` | +8 CMP / +4 TMP | +6 CMP / +3 TMP (off by 25%) |
| `bait_counter` | Opp next attack: −18 OFF | NO opp debuff — +8 DEF / +4 TMP this round, +Flow 2 outcome if opp doesn't score next round |

All seven rewritten in EN, DE, ES. The descriptions now match the
handler exactly. Players who pick `stone_cold` won't see the
picker preview say `+30 OFF` and feel cheated of the "+55" they
were promised. `hope_shot` no longer pretends to grant a stat
buff that doesn't exist.

The most embarrassing was `killing_blow` — the obsolete code
comment in the handler still claimed "+40 at lead 1, +50 at lead
2, +60 at lead 3+" while the actual formula was `min(35, 22 +
lead*3)`. Comment updated to match the real formula.

### Documented: six cards with hidden mechanics

These weren't lies — the descriptions were just incomplete. Each
card had a real, code-visible mechanic that the player had no way
to know about from reading the description:

- `tight_shape`, `hold_the_line`, `keeper_rush` — all three are
  telegraph-reactive: their stat buffs scale 1.3× when the
  opponent has loaded a telegraphed threat. Description now
  mentions the scaling without spelling out the exact multiplier
  (preserves some discovery depth).
- `gegenpress` — scales 1.5× when match momentum is trailing.
  Comeback amplifier, undocumented before.
- `overlap_run` — silently grants +6 TMP alongside the OFF buff.
  Now in description.
- `hero_moment` — silently grants +6 CMP alongside the OFF buff.
  Now in description.
- `forward_burst` — silently costs −4 CMP and gets +6 OFF on
  aggressive/tempo tactics. Both effects now documented.

### Scope notes

- 73 cards inventoried, 69 with descriptions to audit (4 are
  internal/utility cards without a player-facing description).
- 13 fixes total across all three languages (39 string changes).
- Card handlers themselves untouched — this is a description-only
  pass. Engine behavior, balance, save format unchanged.
- Regression suite passes unchanged.

### Audit method (for the record)

Used a Python regex sweep extracting:

1. From `js/cards.js`: each card's `apply(ctx) { ... }` body, with
   `stats: { offense: N, ... }` literals parsed into
   `(stat, value)` tuples.
2. From `js/lang/en.js`: each card's `desc` string, with
   `[+−]N STAT` patterns parsed into the same tuple shape.
3. Symmetric difference: claims-not-in-handler (description lies)
   and handler-effects-not-in-claims (undocumented mechanics).

Pattern matching had false positives — many "mismatches" were
conditional handler code (`if (flow >= 2) stats.offense += 26`)
that the regex couldn't disambiguate from base values. Manual
triage on the 36 flagged cards narrowed to 13 real issues.

Saved the audit script in case other description-vs-code drift
shows up later (e.g. after balance changes).

### Audited but intentionally not changed

- Cards with deliberately-fuzzy descriptions ("scales with X",
  "rewards Y") were left alone if the magnitude direction was
  honest. The goal is "no lies", not "every number spelled out
  to the third decimal".
- The flavour-text strings (the second sentence after the
  mechanical desc) weren't touched — those are intentionally
  evocative rather than precise.

---

## v0.58.1 — Tactic modal separator fix + momentum bar tooltip

Two follow-ups from a screenshot review of the v0.58 modal redesign.

### Fixed: three near-parallel dashed separator lines

The v0.58 layout left three dashed lines stacked between the stats
panel and the intel hints. Cause: the stats panel had a single
`border-bottom: dashed rgba(0.08)` and the intel box had its own
`border-top + border-bottom: dashed rgba(0.06)`. With the small
gap created by margins between elements, the bottom-border of the
stats panel and the top-border of the intel box rendered as two
parallel dashed lines very close together — readable as three
separators when combined with the second intel-bottom-border further
down.

**Fix** (`styles.css`): the dashed top/bottom borders now belong
to the stats panel only — it wraps itself in a self-contained
bracketed region. The intel box renders borderless, sitting as a
plain row list underneath. The spacing between regions still reads
as a separation, but with one dashed line instead of two-or-three
near-identical ones.

### Added: tooltip on the in-match momentum bar

Player feedback: the horizontal momentum bar at the top of the
match screen had no tooltip and no in-game explanation of what it
represents or how it's computed. The EDGE / THREAT chips below it
got hover tooltips back in v52.4 but the bar itself was unlabeled.

**Fix** (`ui.js:updateMomentum`): the `.mom-bar` element gets a
title attribute on first render, explaining the three signals that
feed it:

> "Match flow — who is controlling the game right now.
>  Right (green) = your side, left (red) = opponent. Center = even.
>  Blends three signals:
>   · Possession (60%) — rolling average across rounds played
>   · Score diff (10%) — each goal shifts ±10 points (capped)
>   · Engine momentum (30%) — swings on goals, saves, zone changes
>  Updates every round."

The 60/10/30 split matches `computeBlendedMomentum` exactly. New
i18n key `ui.momentum.barTooltip` added in EN, DE, ES.

### Notes

- Patch release; `0.58.1` not added to the in-game changelog
  (which only lists `X.Y.0` minors per the policy set in v0.52).
  In-game changelog still ends at v0.58.0; this patch shows up in
  `CHANGELOG.md` and the version chip only.
- No engine, balance, or save-format changes. Regression suite
  passes unchanged.

---

## v0.58.0 — Tactic modal redesign

UX feedback on the kickoff/halftime/final tactic modal: between the
header and the choice cards there were five visually competing
elements (italic neutral note, two colored banner-hints, three
choice cards) and the team-stats reference panel was at the bottom
of the modal, after the choices. The decision flow was inverted —
choices first, factual reference last.

This release rewires the layout so it follows the natural flow of
a tactical decision: factual reference → interpretation → action.

### Reordered: header → stats → intel → choices

The team-stats panel (`PHASE BUILD · OFF 51-77 · DEF 48-91 · ...`)
moves from the bottom of the modal up to immediately under the
subtitle. The reasoning: the panel shows raw squad-stat ranges and
the matchup phase. Intel hints below it reference these numbers
("Mitoma 84 TEM vs 69") so the player should see the numbers before
the interpretation, not after.

`showInterrupt` (`ui.js`) now appends `interrupt-stats-always`
right after the subtitle/reason rendering, before the intel
container. The append site at the end of the function is gone (was
running unconditionally for tactic phases — now centralised at the
top). `interrupt-stats-always` CSS adjusted: dashed top-border
flipped to dashed bottom-border, margin moved to bottom — it now
reads as a separator under the subtitle rather than a separator
above the choices.

### Three competing banners → one INTEL box

Pre-fix rendering of the intel area:

- `<div class="interrupt-headline">` — italic gray standalone line
  for the primaryLine ("Build-up runs through PM vision/composure")
- `<div class="hint-box">` containing `<div class="hint-line
  hint-good">` (green text, green border, green-tinted background)
  and `<div class="hint-line hint-warn">` (red text, red border,
  red-tinted background)

Three different visual treatments: the italic line had NO severity
marker, the two banners had FULL colored backgrounds AND colored
text — which double-signaled the same severity through both the
left-border and the text color, on top of an already-tinted
background.

Post-fix: a single container `.intel-box` with rows
`.intel-row.intel-{info|good|warn}`. All three rows share the same
shape: a 3px colored left-stripe, gray text body, no background
tint. Severity rides on the stripe alone:

- `.intel-info` — `rgba(255,255,255,0.18)` dim gray (neutral fact)
- `.intel-good` — `var(--accent)` (positive / opportunity)
- `.intel-warn` — `var(--accent-2)` (risk / threat)

The box itself has subtle dashed top/bottom borders so it reads as
a grouped region rather than three separate elements.

`UI.renderIntelBox(primaryLine, hints)` is the new helper. It
accepts the optional primaryLine (rendered as the first row with
type `info`) and the up-to-three hints (rendered as subsequent
rows). The original `renderHintBox` helper is kept (still used by
non-tactic interrupt phases that want only the colored-banner
treatment) but is no longer called from `showInterrupt`.

### Notes

- CSS-only on the visual side: `.intel-box` and three `.intel-row`
  variants added. The dead `.interrupt-headline` rule removed (the
  HTML element it styled was the standalone italic line, now folded
  into the intel box). `.hint-box` and `.hint-line.*` rules kept
  because they're still used by other modals (event interrupts,
  halftime focus subs).
- No engine, balance, or save-format changes. Regression suite
  passes unchanged. The deduplication rule between primaryLine and
  hints (≥2 token overlap = drop hint) is preserved exactly as it
  was — only the rendering target changed.
- The `interrupt-headline` CSS class is removed but other interrupt-
  prefixed classes (`interrupt-modal--event`, `interrupt-snapshot`,
  `interrupt-stats-always`, `interrupt-panel`) are independent and
  untouched.

---

## v0.57.0 — Description audit: tactics tell the truth

### Fixed: Double Down amplified debuffs

The kickoff/halftime tactic Double Down was supposed to reward
momentum — pick it when you have a buff active and the tactic
magnifies it by 40%. The handler used `Math.abs()` to find the
"largest" team buff, which meant a tempo *debuff* of −7 (e.g. from
an opp Slow Tempo trait) qualified as the "largest" entry and got
amplified to −10. Players who picked Double Down expecting a buff
saw the picker preview say `-3 TMP` and rightly went "what?".

**Fix** (`engine.js:applyTactic` `double_down`): the loop now picks
the largest **positive** buff using `>` instead of `Math.abs() >`.
The minimum threshold (≥ 5) and the modest +6 OFF / +6 DEF / +6 CMP
fallback are unchanged. Description in `config-data.js` and
`lang/{en,de,es}.js` updated to spell out the new rule:

> "Amplifies your biggest POSITIVE team buff by +40%. Modest
>  +6 OFF/DEF/CMP if no buff yet."

### Fixed: tactic descriptions no longer claim "permanent"

v0.52 introduced post-match stat restoration to fix the snowball
bug where Fortress, Lone Wolf, Masterclass and friends leaked their
in-match stat boosts permanently into the run. The fix worked. But
six tactic descriptions kept claiming the boost was "permanent" or
the player "permanently gains" a stat. They were lying since v0.52.

Audit-and-rewrite pass on the four offenders:

```
shift       — "One player permanently gains +18 focus stat."
            → "Top-form player: +18 focus stat (match-long boost
               on the strongest fit)."

shake_up    — "Worst-form player swapped — permanent -5 all stats,
               team +12 attack R4-6."
            → "Worst-form player benched in spirit: −5 all stats.
               Team +12 OFF R4-6."

sacrifice   — "A player loses 15 focus stat permanently. Team:
               +35 attack now."
            → "Top-form player: −15 focus stat. Team: +35 OFF
               this match."

hero_ball   — "Best-form player permanently gains +30 focus stat."
            → "Top-form player: +30 focus stat (match-long)."
```

Plus two omissions called out by the audit:

- `role_switch` — listed only the team-buff side (+10 TMP, +10 OFF,
  −8 VIS) and silently mutated LF.offense by +8 and ST.tempo by +8
  in the handler. Description now spells out the personal mutations
  alongside the team buff.
- `mindgames` — described the +14 VIS / +10 CMP team buff and the
  enemy −6 CMP debuff but didn't say the debuff lasts 2 rounds
  (the handler sets `_mindgamesRoundsLeft = 2`). Duration now
  explicit.

All seven changes propagate through three layers: `config-data.js`
(master tactic definitions), `lang/{en,de,es}.js` `decisions.tactic`
block (picker-rendered descriptions), parallel rewording in DE and
ES so all three languages match.

### Cards audited, no false claims found

The same audit pattern applied to card descriptions in
`lang/en.js`. Three "permanent" mentions surfaced, all legitimate:

- `option_boost` (Keep Him Going) — level-up reward, genuinely
  permanent across matches.
- `wall_effect` — keeper trait, persistent across the run.
- `desperate_foul` — "−1 CMP permanently this match" — accurate
  since v0.52 (within-match-permanent), wording is awkward but the
  semantics match the handler.

No card descriptions need changing.

### Rewrote: log-line tooltips read the line, not define it

The hover tooltips on log lines (introduced in v0.48) were defined
per CSS class via `LOG_TIP_KEY` → 17 i18n strings. Pre-fix tone:
each tooltip *defined the category*. Post-fix tone: each tooltip
*explains how to read this specific line*.

Before:

> "Trait activation — the player effect fires in this round."
> "Your card played — effect is active, usually just this round."
> "Fatigue cost: condition drops — starters lose stats noticeably."

After:

> "A trait fires. Reads as: player · trait · effect. Buff values
>  appear in brackets."
> "Card resolved. Score the per-stat chips one by one. The phase
>  chip shows fit — green for boost, gold for neutral, red for
>  misfit (effect halved)."
> "Card costs condition for the matching role. Watch the
>  thresholds: <50 → −3 all stats, <25 → −6."

All 17 tooltip keys rewritten in EN, DE, ES with parallel voice and
the same actionable framing. The tooltip system code is unchanged
— only the strings flipped from category-definition to reading-
guide. Helps players parse the message in front of them instead of
re-reading what the message class is supposed to do.

### Notes

- Description-and-tooltip-only sprint. No engine changes (apart
  from the one-character `Math.abs()` removal in Double Down), no
  balance changes, no save format changes. Regression suite passes
  unchanged. Stat-restore round-trip test still passes.
- Tactics now use a slightly more consistent shorthand — `OFF` /
  `DEF` / `TMP` / `VIS` / `CMP` for stat labels, `R4-6` /
  `match-long` for ranges, em-dashes for clauses. Not a complete
  standardisation pass — the long flavor sentences still vary in
  voice — but the mechanically-relevant numbers read more uniformly
  across the picker.

### Audited but intentionally not changed

- **Wing Overload, Wingman, Lone Wolf, Fortress, Masterclass** all
  claim "personal" stat boosts in their descriptions. After v0.52
  these are also match-only, but the descriptions never used the
  word "permanent" — they say "personal" or "ST: +40 attack" with
  no claim of persistence. Players reading them naturally assume
  match-scope (because every other tactic is match-scope). Left
  alone.
- **Range annotations on tactics** are inconsistent across the
  pool — some say "R4-6", some "Final round", some no range. Not a
  bug, but a polish target for a future pass. Picker UI could also
  surface this directly as a chip rather than embedding the range
  in prose.

---

## v0.56.0 — Quality-of-Life Pass

A four-fix sprint addressing the recurring complaints that came up
when thinking about showing the game to people: visual clutter,
unread losses, run pacing on routine fixtures, and information
overload for new players.

### Fixed: opp threat banner ate two lines

The OPP THREAT banner in the match log was a five-element inline
strip — pin, label, severity dots, verb-phrase, trait name, dash,
description — that wrapped to two lines on virtually every render.
Plus a blinking ⚠ in the corner pulsing on telegraphed banners,
double-signaling the same information that the color tint, the
inline TELEGRAPHED tag, and the row severity already conveyed.

**Fix** (`ui.js:renderOppIntent`): banner reduced to one tight row
— pin, label, dots, name, optional tag. Verb-phrase and full trait
description moved into the hover tooltip where they have room. The
blink animation in `styles.css` (`@keyframes telegraphBlink`)
removed; the ⚠ stays as a static, dimmed glyph (opacity 0.7) so
it's still readable but no longer commands attention.

The TELEGRAPHED chip already labels the actionable bit — "you can
counter this" — and the inline-text approach reads cleaner than a
flashing corner mark competing with log content next to it.

### Added: match-end verdict headline

Telemetry collected per-match data (shots, buildups, condition
endpoints, opp shot conversion) but never surfaced any of it to the
player on the result screen — the score and result tag told you
*what*, the long log told you *how*, the *why* sat between them.

**Fix** (`ui.js:computeMatchVerdict`): a new helper walks a six-step
priority ladder over the match's telemetry and returns a single
italic sentence. The ladder, top-down:

1. **Underdog moral** — drew or narrowly lost vs an opp with 15%+
   power advantage → "Held the favourites — points off a stronger
   side." (only on draw / 1-goal loss; won't fire on a 4:1 loss
   where you happened to be leading by a hair)
2. **Squad fatigue** — non-win + 2+ starters ended below 35
   condition → "Squad ran out of legs — {names} dropped below 35."
3. **Buildup struggled** — non-win + 6+ buildup attempts + <50%
   success → "Buildup play stalled — only {pct}% of attempts found
   the runner."
4. **Chances missed** — non-win + 6+ shots + ≤1 goal → "{shots}
   shots, one goal — chances came, finishing didn't."
5. **Opp ruthless** — opp scored 2+ on 60%+ shot conversion → "Their
   {shots} chances found {goals} goals — clinical."
6. **Generic per-result fallbacks** — dominantWin / gritWin /
   shareSpoils / toughLoss.

Verdict colour matches the result hero tone (green for wins, muted-
warm for losses, gold for draws). Nine i18n keys added in EN / DE /
ES under `ui.result.verdict.*`. The whole helper returns `''` when
no signal fires, so the hero falls back to just title + score on
inconclusive matches.

### Added: Probable Situations gated until match 3

The Probable Situations panel — frame name, three-dot likelihood
indicator, payoff/counter count — is one of the densest UI elements
on the matchup screen. New players had nothing to anchor it to in
matches 1-2. Now hidden via `state.matchNumber >= 2` guard until the
hub renders for match 3, which mirrors the v0.51 trait-severity-by-
match-number gate that opponents already follow. By match 3 the
v0.55 second-stage tutorial has run, the player has finished one
full match, and the panel arrives explained. Frames mechanically
still occur from M1 — only the pre-match preview waits.

### Added: Quick Sim button for routine fixtures

Mid-run pacing complaint: a 7-match Pro-Liga season often contains
3-4 fixtures the player is overwhelmingly favored to win. Each
still costs 4-5 minutes of card-phase decisions for a near-certain
result. Padding feeling stacks up.

**Fix** (`flow.js:startQuickSim`, `ui.js:renderHub`,
`index.html:btn-row`): a new ⏩ Quick Sim button surfaces in the hub
button row when *all* of these conditions hold:

- 25%+ effective-power advantage over opp
- Not a boss match
- Not a cup tie
- Win streak ≥ 1
- Match number ≥ 3 (post-onboarding)

One click sets `state._quickSim = true` and runs the regular match
flow. In `handleMatchEvent`:

- `round_card` interrupts return immediately (no card phase shown)
- `kickoff`/`halftime`/`final` interrupts auto-pick the first
  decorated option (the recommendation slot) and resolve sync
- The flag is reset post-match in `advance()` — opt-in per fixture

Telemetry records auto-picks as `kind: 'auto-quicksim'` so balance
audits can distinguish quick-sim runs from manual ones.
`state._skipAnim` flips to true for the duration so animation
between rounds runs at fast-mode speed. The engine itself is
untouched — fatigue still ticks, opp moves still fire, save format
unchanged. Only the player input is collapsed.

Conservative on purpose: the button hides whenever any guard fails.
Boss matches, cup ties, and any fixture with even a slight
underdogging stay on the full-input path — the moments where
decisions matter. The reset-per-match rule prevents a flag set on
match 4 from drifting into the Pro-Liga finale.

### Notes

- All four changes are UI-/flow-layer only. No engine logic
  changed, no balance changed, no save format changed. Regression
  suite (`tools/sim-regression.js`) and stat-restore test
  (`tools/sim-stat-restore.js`) both pass unchanged.
- The v0.55 second-stage tutorial fires at match 3 — same boundary
  as the Probable Situations panel reveal. Intentional alignment:
  the tutorial introduces phase / EV chips / situations panel
  exactly as the panel becomes visible.
- Quick-Sim button uses `state.currentWinStreak` for the streak
  guard. The field is the canonical streak counter (set from
  `flow.js` post-match logic) — a draw doesn't break it from the
  player's perspective, but the streak field treats draws as
  break-points. Considered loosening to "no recent loss" (last 2
  matches) but kept the tighter rule to err toward conservative —
  Quick-Sim should feel like a clear, legitimate skip, not a
  marginal call.

### Audited but intentionally not changed

- **Phase-affinity fatigue penalty** still consciously not added.
  Phase-Affinity already reduces stat effect by 50–65% for
  off-phase plays; doubling that with extra condition drain would
  remove the player's "I need this defense now even if it's
  off-phase" tactical escape valve. Mentioned in v0.53 audit, still
  the right call.
- **Loss-screen top-3-causes block** (the longer-form expansion of
  the verdict headline) — recommended quick-win still on the audit
  board. The headline alone covers 70% of the value; the expanded
  block can come later if player feedback identifies the headline
  as insufficient.

---

## v0.55.0 — Second-stage onboarding tutorial

### New: "A few more things" overlay after match 2

The first-ever card phase fires a 5-step overlay (Hand / Energy /
Flow / Situations / End Turn — the absolute basics needed to play
match 1). The next layer of mechanics has always been on screen but
undocumented for new players: phase affinity in the round header,
the ★ chips on cards, the soft-disconnect badges, and the Probable
Situations panel that the hub has been showing since match 1. After
v0.53 split the panel labels into "counters" vs "payoffs", that
distinction is also non-obvious without context.

Solution: a second tutorial overlay fires once at the start of
match 3's card phase. Three points, plain language, no jargon. Same
dismissable-overlay UX as the first tutorial. Persisted in
localStorage under a separate key (`kicklike_tutorial_cards2_seen`),
so existing players also see it exactly once on their next run.

The three points covered:

- **PHASE** — round-header words like ATTACK / DEFENSIVE shift card
  power. A combo card sings in ATTACK, mumbles in DEFENSIVE. Watch
  the round header.
- **STAR CHIP** — the ★ on a card is its expected goal impact this
  turn. ★★★ strong now, ★ weak. Soft-disconnected (⏸ FLOW / ⏸ LANE)
  cards hide the chip — they play at half effect.
- **SITUATIONS PANEL** — pre-match "Probable Situations" lists
  frames you might hit. *Counters* mean you can defend a threat;
  *payoffs* mean you can exploit a favourable moment.

Match 3 was chosen as the trigger over match 2 to give the player
one full match of basic-loop play (kickoff tactic + 6 rounds of
cards + halftime tactic + final tactic) before adding the second
layer. Match 2 still runs unchanged — the player has already seen
phase headers and ★ chips by then but receives no explanation, so
the second overlay reinforces what they've already half-noticed
rather than introducing something new.

### Notes

- Onboarding-only sprint — no engine changes, no balance changes,
  no save format changes. Regression suite passes unchanged.
- Card tutorial 1 (`UI.showCardTutorial`) is unchanged. The new
  second-stage handler is `UI.showCardTutorial2`. Both overlays
  reuse the same CSS (`.card-tutorial-overlay` / `-modal`) so visual
  treatment stays consistent.

### Audited but intentionally not changed

- **Information overload at minute 0** is still on the audit board.
  The second tutorial helps, but doesn't *gate* UI elements — the
  Probable Situations panel, EV chips, soft-disconnect badges all
  remain visible from match 1 even before they're explained. A
  future progressive-disclosure pass could hide some of these UI
  elements before match 3 (mirroring the v0.51 pattern that gates
  opp-trait severity by match number). Out of scope for this
  release.
- **Match-loss forensics** — a one-line "Match Verdict" headline on
  the result screen plus a top-3-causes block, both consuming
  existing telemetry. Recommended quick-win, not implemented yet.
- **Quick Sim button** for routine matches (significant power
  advantage + win streak + non-boss) — would skip the card phase
  for fixtures the player is overwhelmingly favored in. Recommended
  quick-win for run-pacing, not implemented yet.

---

## v0.54.0 — Pulse-tile localization

### Fixed: matchday pulse-tile tooltip leaked German into EN/ES

The pulse-tile breakdown tooltip — the per-player hover that lists
*why* a stat changed this round (condition penalty, player form, team
form, cards/tactic buffs) — had four hardcoded German strings:

```
Kondition 42 → −3 alle Stats
Form +1 → +2 OFF
Team-Form → +3 alle Stats
Karten/Taktik → +6 DEF, +2 OFF
```

These rendered correctly for DE players but bled through unchanged on
EN and ES, where the rest of the UI was already localized. The
breakdown is one of the most-read tooltips in the match (it answers
the recurring "why is this stat lower than the card said" question),
so the inconsistency stood out.

**Fix** (`ui.js:buildPlayerStatTip`): four hardcoded literals replaced
with `I18N.t(...)` calls. Four new i18n keys
(`ui.match.pulseTipCondition`, `pulseTipForm`, `pulseTipTeamForm`,
`pulseTipCardsTactic`) populated in all three language files with
locale-correct terminology — `Condition` / `Kondition` / `Condición`,
`Cards/Tactic` / `Karten/Taktik` / `Cartas/Táctica`,
`all stats` / `alle Stats` / `todas las stats`. Templates use the
existing `{value}`, `{form}`, `{sign}`, `{delta}`, `{stat}`, `{parts}`
substitution mechanics — no new i18n machinery.

A wider audit (`grep` for hardcoded German strings in user-visible
contexts across `ui.js`, `flow.js`) turned up only the engine.js
opp-move log fallbacks (`'▸ Gegner — Blitzschuss!'` etc.). Those are
pure dead-code safety nets — the i18n keys they fall back from
(`ui.log.oppMove.quickStrike` and friends) are populated in all three
languages, so the fallback never fires in practice. Left alone for
now.

### Notes

- **Condition stat-impact is unchanged** — confirming the existing
  behavior in `stats.js:computePlayerStats`: a player's condition
  applies a flat penalty to ALL five of their stats once it crosses
  two thresholds. Below 50 → −3 across the board. Below 25 → −6.
  Threshold-based, not gradual. The pulse-tile tooltip surfaces this
  line directly when it triggers. The between-match recovery
  mechanic (`≥60 → 90`, `40-59 → 80`, `20-39 → 70`, `<20 → 55`)
  exists specifically to prevent multi-match drift into the penalty
  bands.
- The version `0.53.1` (in-game changelog backfill) is no longer
  surfaced as a separate accordion entry. Per project policy, only
  major.minor releases (`X.Y.0`) appear in the in-game changelog
  modal — patch releases (`X.Y.Z` with Z > 0) document themselves
  here in `CHANGELOG.md` only.

---

## v0.53.0 — Card-Desc Substitution + Payoff Semantics

### Fixed: card descriptions showed literal `{st}` / `{tw}` placeholders

Cards with role-keyed descriptions (`lone_striker`, `team_unity`,
`masterclass`, `clinical_finish`, `stone_cold`, `field_commander`,
`through_ball`, `hero_moment`, `killing_blow`, `block`, `forward_burst`,
`preempt`, `counter_strike`, `flank_overload`, and ~10 more) rendered
their `{st}` / `{tw}` / `{pm}` / `{lf}` / `{vt}` placeholders verbatim.
The reported example was the Lone Striker draft card showing `If {st}
condition ≥ 70: +22 OFF / +6 CMP plus shot. Tired {st}: tiny base
effect.` — placeholders never substituted.

The flavor-text path (post-play narration like `{st} goes it alone —
and finishes`) had a working interpolator (`UI.resolveCardNarrative`,
since v0.39) that pulled player names from `match.squad`. Card
**descriptions** went through a different render path that called
`I18N.t('ui.cards.<id>.desc')` directly with no `vars` argument, so
the `{key}` curly-brace handling in `I18N.format` left them as
literals.

**Fix** (`ui.js`): new `UI.resolveCardDescription(cardId, match)`
helper, sister to `resolveCardNarrative`. Same role-substitution logic
but with role-abbreviation fallbacks (ST/TW/VT/PM/LF) instead of
sentence-style ones ("the striker"/"the keeper") because card
descriptions render in compact UI surfaces (hand cards, draft tiles,
deck panel chips) where the abbreviation reads cleaner. Six call sites
converted:

- Hand-card body text (`hc-desc`)
- Hand-card unplayable tooltip
- Deck-panel-entry tooltip (long-form)
- Codex card list (no match → role abbreviations)
- Team-selection screen archetype-card chips (no match → abbreviations)
- Card-draft tile body (`dc-desc`, no match → abbreviations)

In-match contexts get real player names ("If Antony Dembélé condition
≥ 70…"); out-of-match contexts fall back to role tokens ("If ST
condition ≥ 70…"). Either way, no more raw `{st}` ever surfaces.
Fast-path early return when the description has no placeholders, so
the helper is free to call on every card (no avoidable string churn).

### Fixed: "Probable Situations" panel called every interaction "counters"

The match-prep "Probable Situations" panel listed up to three
upcoming-match frames with a right-side label like `1 COUNTERS` or
`NO COUNTERS`. Eight frames are tracked and the user reported it as
contradictory: a frame like `GOALIE STREAK` (severity `good` —
favorable to the player) was rendered with the green frame-title but
labeled `1 COUNTERS` on the right. Counters fight against threats; a
favorable streak isn't a threat. Same for `THEY ARE RATTLED`,
`HOT CORRIDOR`, `OPP STAR DOWN`, `OPP KEEPER SHAKY`, `OPP DEFENSE
STRETCHED` — five of the eight tracked frames are favorable, and the
`FRAME_COUNTERS` table's own code comments call those mappings
`payoff cards multiply the saved-opportunity moment` for
`keeper_in_zone`, `payoff aggressive play when opp is weakened` for
`opp_star_down`. The data was already saying *payoff*, the UI was
saying *counter*.

**Fix** (`ui.js` around `aip-counter` rendering): label switches on
the same `FRAME_SEVERITY` map that drives the row's color tint.

```
warn / danger    → "1 counter" / "no counters"
good / opportunity → "1 payoff"  / "no payoffs"
```

The `FRAME_SEVERITY` declaration moved up from below the row append
so it's available to the label decision. Tooltip text on both the
row title and the right-chip mirror the change — "Counters in your
deck:" becomes "Payoffs in your deck:" for favorable frames; the
zero-count tooltip says "no cards that exploit this situation"
instead of "no cards specifically addressing this situation". The
`aip-tone-*` (counter readiness) and `aip-sev-*` (frame favorability)
classes are unchanged — they're orthogonal axes and both still apply.

New i18n keys `ui.intel.payoffs` / `ui.intel.noPayoffs` added to
`en` ("payoff(s)" / "no payoff"), `de` ("Hebel" / "keine Hebel"),
`es` ("remates" / "sin remates"). Existing `counters` / `noCounters`
keys unchanged for back-compatibility.

### Notes

- `tools/sim-card-desc.js` added — confirms placeholder substitution
  works in-match (real names) and out-of-match (role abbreviations).
- Regression suite (`tools/sim-regression.js`) and stat-restore test
  (`tools/sim-stat-restore.js`) both pass unchanged. v0.53 is a pure
  UI/i18n sprint — no engine changes, no balance changes, no save
  format changes.
- v0.52 telemetry (12-match Pro-Liga run, 9W/2D/1L/41:9) confirmed the
  v0.52 stat-restore fix: TW Federico organic growth from 77 → 96 over
  the run, no Fortress carryover lock at 99. New telemetry payload
  shape (correct field names from v0.52) verified consistent across
  all 12 matches: shots ≥ shotsOnTarget ≥ goals invariant holds, my
  buildup-success ≈ shot count, opp shot-on-target ≈ saves + goals.

### Audited but intentionally not changed

- **Condition drain is not phase-dependent.** Cards drain the same
  fatigue regardless of phase fit; only the stat-effect layer is
  scaled by `phaseAffinity` (×0.50–×1.30). Adding fatigue penalty for
  off-phase plays would double-tax a single decision (already-reduced
  effect + extra drain) and remove the player's deliberate "I need
  this defense now even if it's off-phase" escape hatch. The
  reduction is a sufficient signal; phase awareness is already
  surfaced through the EV chip and soft-disconnect badge. Kept as-is.
- **Manual** (`ui.manual.sections` in lang files) and the **card
  tutorial overlay** (`UI.showCardTutorial`) reviewed against v0.51
  / v0.52 / v0.53 changes. Both stay accurate — manual covers
  league/season structure, card phases, opp move scaling, condition
  drain, traits/evolutions, bosses, codex; tutorial covers hand /
  energy / flow / situations / end-turn. None of v0.51-v0.53 changed
  user-facing mechanics enough to require updates. The trait-severity
  scaling in v0.51 is implicitly covered by the existing
  "Living opponent" copy.
- **Composure stat** has visibly weak save effects (~0.1% per delta
  unit on save chances). Mathematically consistent with vision
  (~0.2% per delta on save bonus, but offset by stronger buildup
  contribution). Bumping CMP's defensive scale would be a balance
  pass, not a coherence fix — left for a future tuning sprint if
  player feedback identifies it as a real friction.

---

## v0.52.0 — Snowball-Cure Sprint

### Fixed: ten kickoff/halftime/final tactics permanently mutated roster stats

The kickoff/halftime/final pickers offered ten tactics whose handlers
called `player.stats.X = clamp(player.stats.X + N, 20, 99)` directly on
roster entries instead of pushing decaying buff layers — `fortress`,
`lone_wolf`, `masterclass`, `hero_ball`, `wing_overload`, `wingman`,
`role_switch`, `shift`, `sacrifice`, and `shake_up`. Comments on the
handlers said "direct mutation persists past R6" and meant *within the
match*, but with no post-match restore step the boosts (and the two
debuff handlers) leaked into the run permanently.

Telemetry from a 14-match amateur run showed the canonical example: a
Fortress pick at the M5 final-tactic decision lifted TW Hirving from
72 → 99 defense and VT Marcus from 86 → 99. Both stayed pinned at the
99 clamp ceiling for the next nine fixtures, locking the engine-aligned
team-defense at 99 from M6 onward. Score progression made the
consequence visible: M1–M10 averaged 4.3:1.0, M11–M14 averaged 10.5:0.3
— the snowball that had been impossible to attribute to any single
mechanic.

A second-order issue compounded it. When a player was already at the
99 cap (TW after evolutions and the Fortress carryover from a previous
match), every subsequent Fortress pick was a complete no-op — the +40
got eaten silently. The picker preview only read `match.teamBuffs`
(the layered side of the tactic), so the user saw `[OFF +4 DEF -25
COM -6]` for Fortress with no indication that the headline +40
defense was either applied to TW/VT or lost to the cap.

**Fix** (`flow.js:advance` around `startMatch`): snapshot every
starter's `stats` object before the match runs and restore from the
snapshot once `startMatch` returns. The restore happens before the
post-match XP/level-up/recovery block so legitimate growth math
computes against the genuine pre-match baseline, not the mutated
in-match values. Tactics still mutate freely within the match (their
intended effect window) but the run-level damage is gone.

**Fix** (`engine.js:applyTactic`): a per-call snapshot of squad stats
runs around the tactic handlers. The diff is stashed on
`match._lastTacticPersonalMutations` as `[{role, stat, delta}]`. The
three picker log sites read it through the new
`formatTacticPersonalMutations(match)` helper and append a
parenthesized hint after the team-buff bracket. Result:

```
v0.51 (silent):
  → Fortress  [OFF +4  DEF -25  COM -6]

v0.52:
  → Fortress  [OFF +4  DEF -25  COM -6]  (TW DEF +27, VT DEF +13)
```

The deltas reflect what actually happened, including the 99-clamp
losses (a +40 intent capped to +13 surfaces as `+13`, signaling the
cap quietly). When every personal mutation lands on a 99-capped stat
and the delta is zero, no parenthesis is emitted — same shape as
tactics that never had a personal effect.

### Fixed: post-match telemetry payload had wrong field names

`flow.js:recordPostMatch` read `match._shotsMe`, `_shotsOpp`, `_savesMe`,
`_buildupAttempts`, `_buildupSuccess`, and `_traitFireCounts` — fields
that never existed. The engine writes to `match.stats.{myShots,
oppShots, saves, myBuildups, myBuildupsSuccess, triggersFired,
oppTriggersFired}`. Pre-fix telemetry exports therefore had every
shot, buildup, save, and trait-fire count emitted as 0 or null across
an entire run, hiding the most useful balance-audit signal.

The payload now reads the correct fields and adds a few that were
silently absent (`shotsOnTargetMe`, `oppBuildupAttempts`,
`oppBuildupSuccess`, `possessionAvgMe`). `traitFires` is now an object
`{ me, opp, oppByTrait }` rather than a single hash that was never
populated.

### Fixed: AIP-LVL likelihood dots ignored severity

The "Probable Situations" panel renders each frame as `▰▰▱  GOALIE
STREAK  3 COUNTERS`. The frame title (`.aip-frame`) picked up
severity-tone color (green for `good`/`opportunity`, gold for `warn`,
red for `danger`), but the likelihood dots (`.aip-lvl-*`) were colored
purely by likelihood with `aip-lvl-high` always rendering in red-orange
(`var(--accent-2)`). Result: `GOALIE STREAK` showed a green title next
to red dots — contradictory signals, with the "this is good for us"
message half-cancelled by the visual urgency of the dots.

**Fix** (`styles.css`): severity-driven `.aip-lvl` rules with higher
specificity than the likelihood-only variants. The dots now match the
frame disposition — green when the situation favors the player, red
when it threatens them — while the dot count (▰▱▱ / ▰▰▱ / ▰▰▰) keeps
encoding likelihood independently.

### Notes

- Existing saves carry forward correctly: the stat snapshot/restore
  applies on every `advance()` call, so any in-progress run benefits
  from the fix on its next match. Pre-existing leaked buffs from
  earlier Fortress/lone_wolf/masterclass picks are NOT rolled back —
  they're already baked into `state.roster`. A clean run is the only
  way to reset to the intended baseline.
- Regression suite (`tools/sim-regression.js`) passes unchanged. The
  five committed scenarios don't pick any of the ten direct-mutation
  tactics, so the fix is invisible to them. New tool
  `tools/sim-stat-restore.js` confirms the snapshot/restore round-trip.
- The condition system still mutates `player.condition` during a match
  and that drain IS preserved post-match — the snapshot only covers
  `player.stats`, deliberately. Tactics that drain condition
  (`desperate`'s TW −6) keep their intended cost.

### Audited but intentionally not changed

- `matchDifficulty()` (`engine.js`) still scales only opp offense and
  the player's buildup penalty by player position, not opp defense.
  The asymmetric multiplier is by design — the player has organic
  growth pathways the opponent does not. Without the v0.52 stat
  restore, this asymmetry was being weaponized by Fortress carryover;
  with the restore in place the natural opp-vs-player balance returns.
- The "Beat a team with grudge ≥ 3" run-goal reads
  `_oppMemory[oppId].grudge`, a counter incremented by losses and
  narrow defeats against the same team. A 13W/1D/0L run never raises
  any team's grudge to 3, so the goal stays unreachable. Not a bug —
  the goal is by design only available when results are mixed.
- General trait-log "us vs them" disambiguation (player names appearing
  without team context in trait fires) is still on the audit board for
  a UI-focused sprint. Out of scope for v0.52.

---

## v0.51.0 — Amateur-League Onboarding Balance

### Fixed: opponent power-tier seed could land in the player's first fixture

In an 8-team league, opponents were pre-generated at season start with
power-tier indices spanning `matchNumber=2..9` (`league.js:generateLeagueOpponents`).
The round-robin schedule that follows is purely combinatorial — it does
not order pairings by team strength — so the team seeded at the top of
the curve (`mn=8` or `mn=9`) could be drawn as the player's week 1
opponent. Telemetry from amateur runs showed worst-case stat gaps of
+44% over the player's lineup in the very first match, with the
opponent's tempo stat pinned at the 140 clamp ceiling.

A second-order bug compounded it: `entities.generateOpponent` flags an
opponent as a boss whenever `KL.config.CONFIG.bossMatches` (default
`[7, 14]`) contains the passed `matchNumber`. With the league spread
formula assigning `mn=7` to the i=4 power slot, that team silently
inherited the +90 boss bonus that was meant for cup ties — landing the
de-facto strongest league opponent at ~502 power against a player team
sitting around 330.

**Fix** (`league.js:generateLeagueOpponents`): the power-curve span is
narrowed from `Math.round(2 + t * (needed + 1 - 2))` to
`Math.round(2 + t * (needed - 3))`. For an 8-team league this maps the
seven opponents across `mn=2..6` instead of `mn=2..9`. Five distinct
power tiers preserve table variance; the worst-case opponent power
drops from ~502 to ~394 (a +19% gap over an early player team rather
than +44%). The boss-flag bug becomes inert as a side-effect — no league
team is seeded at `mn=7` anymore, so `bossMatches.includes()` never
fires for league opponents. Cup ties, which call `generateOpponent(14)`
explicitly, retain their boss bonus.

Late-season toughness still climbs through the existing runtime
`statMul` (`flow.js`, `+0%` at match 1 → `+18%` at match 14) compounded
with the player's own growth via levels, evolutions, card upgrades, and
recruits.

### Fixed: telegraphed sev-3 threats reachable from match 2

A separate asymmetry surfaced after the power fix. Opponent traits are
rolled at gen time keyed off the team's power-tier seed — an `mn=6`-seeded
team gets 2 traits, picked uniformly from a pool that includes
severity-3 archetypes (`konter_opp`, `clutch_opp`). Round-robin
scheduling could therefore present a 2-trait, sev-3-equipped opponent
in week 2, when the player has not yet drafted Counter or Block cards
that interact with telegraphed threats. The opp-moves system gates its
own moves by player position (`getSeverityCap`, `getIntelligenceStage`)
but the opp-trait pipeline does not — an inconsistency this entry
resolves.

**Fix** (`flow.js:advance`): when a league opponent is fetched for the
upcoming fixture, the trait list is filtered against the player's
actual season position before being attached to the live opp:

- **Severity ceiling.** Sev-3 traits gated to player position ≥ 4. Sev-2
  threats remain available from M2 so the early-game opponent isn't
  toothless — only the "real damage if unanswered" tier is held back.
- **Count ceiling.** Same M-keyed thresholds the gen used (M1:0, M2-5:1,
  M6-12:2, M13+:3) but applied against `state.matchNumber+1` instead of
  the seed `matchNumber`.
- **Sort by ascending severity** before the count slice, so the easier
  trait surfaces when the count limit cuts the list.

`boss_aura` always passes through unchanged when present on the source —
cup bosses retain their aura regardless of player position. Cup mode
uses a separate dispatch path (`getNextCupOpponent`) and is unaffected
by this clamp.

The clamp is non-destructive: `baseOpp.traits` in `seasonOpponents` is
never mutated, only the shallow-cloned `opp` for the live fixture. A
debug field `opp._complexityClamp` records `{ seedTraits,
effectiveTraits, maxSev, playerMn }` for telemetry.

### Notes

- Existing saves: the league.js power-curve change applies only to
  newly-generated seasons. Mid-run saves carry their already-generated
  opponents forward with the original seeded power tiers. The trait
  clamp in flow.js, by contrast, applies on every advance call — so an
  in-progress amateur run will see immediate relief from the trait
  side of the issue without needing to start a new run.
- Regression suite (`tools/sim-regression.js`) passes unchanged. The
  five committed scenarios call `generateOpponent` directly and bypass
  the league module, so they are not affected by either fix.

### Audited but intentionally not changed

- `matchDifficulty()` (`engine.js:534`) scales opp offense and the
  player's buildup penalty by player position only. There is no
  symmetric player-side multiplier. Verdict: by design — the player
  has organic growth pathways (XP, evolutions, card upgrades,
  recruits, traits) that the opponent does not. The asymmetric
  multiplier compensates.
- Score-adaptive opp trait multiplier (`traits.js:669-680`) gives the
  trailing opponent a comeback boost on offensive traits and the
  leading opponent a defensive boost. The player has no automatic
  equivalent. Verdict: by design — the player carries the rally card
  family for elective comeback amplification, mirroring the opp's
  automatic boost.
- Spotlight stat boost (`entities.js:327`) gates at power-tier
  `matchNumber ≥ 3` rather than player position. Verdict: minor — the
  spotlight only redistributes weight within an already-clamped stat
  total. It does not raise total power. Left untouched to keep this
  patch small.

---

## Added (prior)


### Headless match-engine regression test

New dev tool: `tools/sim-regression.js` — runs five deterministic match
scenarios through the real engine (no DOM, no browser) and compares
the results to a committed JSON snapshot. Catches any drift in match
outcome, shot totals, build-up success rate, final momentum, or squad
condition drain.

Supporting pieces:

- `tools/sim-env.js` — headless simulation harness. Loads every
  gameplay module under Node's `vm` sandbox with a minimal DOM /
  localStorage / window stub and replaces `Math.random` with a
  seedable Mulberry32 RNG so every simulation is reproducible from a
  seed. Skips DOM-heavy modules (ui, flow, match-hud, fx) since the
  engine doesn't need them to run a match.
- `tools/sim-match.js` — single-match smoke test. Picks a starter
  team, spawns an opponent, runs a complete 6-round match, and prints
  a human-readable summary. Useful for quick sanity checks.
- `tools/sim-snapshots.json` — the committed baseline. Five
  scenarios spanning starter teams, amateur/pro/boss-tier opponents,
  and different tactic combinations. Elapsed time: ~25s for the full
  suite.
- Commands:
  - `node tools/sim-regression.js`            — run and compare
  - `node tools/sim-regression.js --update`   — rewrite snapshot after
    an intentional balance change
  - `node tools/sim-regression.js -v`         — show per-scenario
    shot totals and momentum

Why this matters: every future change to `engine.js`, card effects,
tactic handlers, opponent generation or stat computation can now be
validated against a frozen outcome before commit. Drift is visible
immediately instead of surfacing as "feels different" three playtests
later. The determinism guard inside the runner (same seed re-run)
also catches accidental `Math.random` bypasses (e.g. unseeded shuffle,
Date.now in hot path).

### Fatigue feedback on hand cards (card play UX)

The fatigue-cost chip on each hand card now surfaces two things that
were previously hidden in the tooltip:

- **Target player's condition** — the chip reads `⚡−4 ST 32→28`
  instead of just `⚡−4 ST`, so the player can see at a glance which
  starter will pay and whether they're already stressed.
- **Severity tier** — the chip is colored to match the projected
  post-play condition: neutral (muted red, same as before) when the
  target stays above 50, warn (amber) when they drop below 50, danger
  (saturated red with subtle pulse) when they drop below 25. Tiers
  mirror the engine's stat-penalty thresholds in `stats.js` (50 = -3
  per stat, 25 = -6).
- **Escalation hint in tooltip** — chained card plays pile +2 extra
  drain per prior card this round. When chained, the tooltip now shows
  the breakdown ("Plays cost 6 (base 2 + 4)") so the inflated number
  doesn't feel arbitrary.

### Tactic-handler registry pattern (data-driven dispatch)

`engine.js:applyTactic` previously dispatched all 56 tactics via a 600+
line `if (tactic.id === 'X')` chain spread across three phase blocks.
That pattern made the function hard to read, hard to search, and
invited silent bugs when a new tactic's id got added to config but not
to the dispatch chain (v52.2 had to retrofit eight of these).

Replaced with three phase-keyed registries at the top of the engine
IIFE:

- `KICKOFF_HANDLERS` — 20 entries (all kickoff tactics)
- `HALFTIME_HANDLERS` — 20 entries (all halftime tactics)
- `FINAL_HANDLERS` — 16 entries (final tactics; the five with a
  `.condition()` function in config-data.js — all_in, park_bus,
  kamikaze, clockwatch, poker — remain on the dynamic-stat path)

Every handler shares the signature `(match, layer, ctx) => void|true`,
with `ctx = { phase, squad, onEvent, deficit, lead, isLeading }`. A
handler returning `true` short-circuits the rest of `applyTactic`
(layer push, fit/misfit scaling, zero-effect detection, focus
marking); used by `shift`, `hero_ball`, and `sacrifice` — all three
have effects that don't fit the normal team-layer flow.

`applyTactic`'s phase-dispatch blocks collapsed from ~440 lines to
~45. Behaviour is exactly preserved: handlers have identical stat
values, identical side-effect flags, identical layer pushes as the
pre-refactor code, verified line-by-line.

New dev tool: `tools/audit-tactics.js` — confirms every tactic id
declared in config-data.js has a matching handler in the right phase
registry (and flags orphan handlers as dead code). Currently exits 0.

### Save / Load — Continue Run

Runs now persist across tab reloads and browser restarts via
`localStorage`. Saves are automatic at safe transitions (hub entry,
starter-team pick, season rollovers) and cleared when a run ends (game
over, win, cup finale).

The start screen shows a **Continue Run** button with a summary line
(team · tier · season · match · record) whenever a save exists. A
**New Run** secondary button stays available but asks for confirm
before discarding the save.

- New module: `js/persistence.js` — `KL.persistence` API
  (`save / load / apply / autoSave / hasSave / clear / summary`)
- Explicit 54-field allow-list (`PERSIST_FIELDS`)
- Schema versioning via `SCHEMA_VERSION` for future migrations
- Graceful fallback: corrupt / mismatched saves are cleared and
  treated as "no save" rather than crashing
- i18n keys in all three locales: `ui.start.continueRun`,
  `ui.start.newRunConfirm`, `ui.start.leagueMatch`,
  `ui.start.cupMatch`, `ui.labels.seasonLabel`,
  `ui.labels.cupModeLabel`, `ui.labels.tier.{amateur,pro}`
- CSS: `.menu-resume-summary` + layout switch for `.menu-actions`
  when resume is active (via `:has()`)
- New dev tool: `tools/audit-persist.js` — static check that every
  `state.*` field seen in the codebase is either persisted or in the
  known-transient deny-list. Exits 1 on drift; wire into CI.

### Dev assertions

- `state.js` — boot-time warn if any `freshSeason()` key is missing
  from `SEASON_KEYS` (prevents silent routing-fallback to the session
  slice with dead defaults).

## Fixed

### `opp_defense_stretched` frame had a dead effect

The card-mode frame event `opp_defense_stretched` (decisions.js) was
setting `_oppBuildupPenaltyRounds` but not `_oppBuildupPenalty`. The
engine reads only the latter (`engine.js:2245`), so the advertised
"their next buildup is harder" effect was mechanical dead code — the
frame triggered a +8 OFF / +6 VIS team buff but nothing more.

Now sets both the magnitude (`0.15`) and the rounds counter, matching
every other setter of this flag pair.

### Round-counter decrements skipped in card-mode

`checkSituativeEvents` returned early when `cardsEnabled` (the default),
so the four timed-effect counters (`_oppBuildupPenaltyRounds`,
`_oppStrikerMalusRounds`, `_oppShotMalusRounds`, `_keeperZoneRounds`)
never decremented during card-mode play. Today only
`opp_defense_stretched` sets any of these in card-mode, but any future
frame/event reaching for the machinery would have silently had a
permanent effect.

The decrement block is now a standalone `tickRoundCounters()` helper
called unconditionally at the start of `checkSituativeEvents`, before
any early return. Architecturally: "every round, first tick down
timed effects, then maybe fire a new event".

**Balance note (non-card-mode):** moving the decrement from the end
to the start also fixes a pre-existing off-by-one. Counters set to
`Rounds=2` previously lived for only 1 round because the decrement
ran in the same call that set them. They now honor their advertised
duration. All four counters are opponent-malus helpers, so this is
a small player buff in non-card-mode. Re-check any tuning values
that were calibrated against the buggy 1-round lifespan.

## Changed

### Removed unreachable `computeSynergyBonus` and related dead code

The `computeSynergyBonus` function and its helper `ROLE_TAGS` table in
`stats.js` (~46 lines) were exported on `KL.stats` and on `window`,
but no caller ever invoked them — verified via grep across every
module. The accompanying i18n keys `ui.log.synergyBonus` in all three
locales (two copies in each of `de.js` and `es.js` — silent duplicate-
key overrides within the same `log:` block) were likewise never
referenced.

Deletion verified against the regression snapshot: zero drift across
all 5 scenarios. This is the first real use of `sim-regression.js`:
confirming that a chunk of code is genuinely unreachable by running
the match engine through frozen scenarios and noting the snapshot
still matches.

The review had originally flagged this as "D4 — make synergy bonus
deterministic" because the 35%-chance branch in the function looked
like fake depth. Turns out the whole function was fake depth: it
never ran. Cleaner fix than deterministic-ising it.

### `cards.js` uses local `drawCards` reference

The 12 in-file `window.KL.cards.drawCards(...)` call sites inside the
cards IIFE now use the directly-scoped `drawCards` function. Since
the IIFE defines it via `function` declaration it is hoisted and in
scope throughout. Null-safety guards (`state && window.KL?.cards`)
correspondingly shortened to `state`. No behavior change; removes a
tail-latency risk that would have kicked in only if `cards.js` failed
mid-load.

### `engine.js:startMatch` — match.squad contract documented

Added an inline contract comment on `match.squad` making the implicit
"index-write only, never reassign" rule explicit. The three swap
sites (halftime sub, event-driven swaps at `decisions.js:759, 1643,
2466`) all honor this; future swap sites must too, or every
`attemptAttack(match, squad, ...)` helper below would have to be
refactored to read `match.squad` freshly instead of closing over the
squad parameter.

## Verified (and found to be false alarms from a prior review)

- **In-match subs affect gameplay**: the shared array reference between
  `match.squad` and the closure `squad` parameter means index-writes
  propagate. `match.memory.myPlayerStates` lazy-inits for new players
  via `getMemState`. `applyStreakStatMod` handles unknown players
  gracefully. Subs work end-to-end.
- **Tactical decision previews match engine behaviour**: `applyDecision`
  (decisions.js:2540) calls `applyTactic` (engine.js:1074) and scales
  the resulting layers by the `mult` computed by `computeDecisionImpact` —
  the same `mult` the preview UI uses. No desync.
- **Trait coverage**: 53 handlers in `traits.js` cover all 45
  hand-authored `DATA.traits` + 8 legendary traits. 135 stage-2
  `_mastery` evolutions auto-wrap working parent handlers. 0 orphan
  handlers. Legendary trait definitions match between `de.js` and
  `en.js`.
