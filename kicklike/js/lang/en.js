I18N.registerLocale("en", {
  ui: {
    meta: { title: "KICKLIKE · 5-a-Side Football Roguelite" },
    start: {
      tagline: "> 5-a-side football roguelite_",
      sub: "deckbuilder · team evolution · seasons",
      newRun: "▶ New Run",
      continueRun: "▶ Continue Run",
      newRunConfirm: "Starting a new run will delete your saved progress. Continue?",
      leagueMatch: "Match {n}",
      cupMatch: "Cup M{n}",
      openCodex: "📖 Codex",
      openManual: "→ Full manual",
      changelog: "Changelog",
      howTitle: "How it works:",
      howBody: "Pick a starter team. Each season is a 14-match league (8 teams, home & away). Top 2 promote, bottom 2 drop — Amateur → Pro → CUP (3-match knockout). Each match: 6 rounds. You draw cards, the opponent draws their own moves — aggressive surges, park-the-bus lockdowns, dirty tackles, signature big-moves — and you watch the OPP THREAT banner to know what's coming. Win the cup to become RUN CHAMPION."
    },
    changelog: {
      title: "KICKLIKE · Changelog",
      versions: [
        {
          version: "0.60.2",
          title: "Probable Situations panel — fixed two frames that fired in almost every match",
          entries: [
            {
              title: "GOALIE STREAK no longer fires on weak-keeper matchups",
              body: "The pre-match prediction for **GOALIE STREAK** had its formula backwards: it summed your keeper's defense with the opponent's offense, meaning a **strong opponent striker pushed the probability up**. A weak keeper (defense 40) facing a strong opp (offense 70) was firing the frame as \"likely\", which made no narrative sense — that's the matchup where your keeper gets *worked over*, not the one where he goes on a streak. Formula now uses the difference (TW defense vs opp offense) — the frame only fires when your keeper has a real edge over the expected attacking pressure."
            },
            {
              title: "THEY ARE RATTLED is no longer hardcoded to fire every match",
              body: "**THEY ARE RATTLED** was a fake predictor — it fired at a constant 0.35 likelihood (one dot, low) on every match where the opponent had any trait holders. Every generated opponent has trait holders, so this was firing **always**. Now scales with the opponent's composure: lower opp composure → more likely the frame fires during the match. Solid-composure opponents (65+) don't get this prediction at all, since pre-match analysis can't reliably call it for mentally stable squads."
            },
            {
              title: "Net effect on the panel",
              body: "In balanced matchups with no clear edge, both frames now stay silent — which frees the top-3 slots for frames that *are* relevant to the matchup (`HOT CORRIDOR`, `STRIKER FRUSTRATED`, etc), or shows fewer rows when nothing specific is predicted. The panel was previously showing the same two frames in nearly every match with `NO PAYOFFS` next to each; that pattern should be substantially less common now."
            }
          ]
        },
        {
          version: "0.60.1",
          title: "Pre-stable hotfix — confidence-bonus persistence + missed string updates",
          entries: [
            {
              title: "Win-confidence bonus survives a tab reload now",
              body: "The +1-per-win confidence bonus (caps at +4 across all five stats) was wiped on every save/load round-trip — the field was missing from the persistence allowlist. Build a 4-game streak, close the tab, reopen and the buff was silently gone. Now it persists with the rest of the season state, and resets at season end as it always did."
            },
            {
              title: "Two ES card descriptions corrected",
              body: "**Running Hot (En Racha)** and **Doping (Todo al Rojo)** still showed the pre-v0.59 numbers in Spanish, despite v0.59 claiming all seven cards had been rewritten in EN/DE/ES. Both ES strings now match what the handler actually does — same fix that EN and DE already had."
            },
            {
              title: "Rope-a-Dope: \"only\" qualifier dropped in DE/ES too",
              body: "v0.60.0 dropped the redundant \"only\" qualifier from rope_a_dope in EN (\"R6:\" not \"R6 only:\"). DE and ES still shipped \"Nur R6:\" / \"Solo R6:\" — fixed. All three locales now read uniformly with the rest of the final-phase tactics."
            }
          ]
        },
        {
          version: "0.60.0",
          title: "Backlog sweep — second-pass card audit, range cleanup, loss-screen causes",
          entries: [
            {
              title: "Three more cards lying about their numbers",
              body: "After the v0.59 card-description audit, three cards still slipped through that needed real fixes:\n\n- **Pre-empt** said \"+16 DEF\" — handler actually delivers +22 DEF / +12 TMP / +8 CMP / +10 OFF on a successful cancel. Roughly **three times** the buff the description claimed, with three undocumented stats. Description rewritten to spell out all four numbers plus the \"+Flow 2 / draw 1\" cards.\n- **Counter Strike** said \"+22 OFF / +8 TMP\" hit, \"+8 OFF\" base — handler does +28/+10 hit, +10 OFF base. Off by 6/2/2. Plus the auto-counter trigger (when another card has loaded an auto-counter for this round) wasn't mentioned.\n- **Through Ball** described what types of discards trigger which outcomes, but never mentioned the +4 OFF / +4 TMP buff in the setup-discard branch, nor the guaranteed through-ball action when setup hits.\n\nAll three updated in EN, DE, ES."
            },
            {
              title: "Final-round tactic prefixes standardised",
              body: "Tactic descriptions in the final phase used three different prefix styles: \"Final round: ...\", \"R6: ...\", and \"R6 only: ...\". All seven \"Final round:\" descriptions converted to \"R6:\" to match the existing R6/R4-6 round-number convention used by the other tactics. The \"only\" qualifier dropped from rope_a_dope (all final-phase tactics are R6-only by definition). Reads more uniform in the picker now."
            },
            {
              title: "Loss-screen now shows up to 2 secondary causes under the verdict",
              body: "The v0.56 Match-Verdict-Headline diagnosed a loss in one italic line (\"Squad ran out of legs — Antony Dembélé, Jadon Chiesa dropped below 35 condition.\"). For losses where multiple signals fired — say, fatigue PLUS missed chances PLUS the opponent converting ruthlessly — only the dominant signal made the headline; the others were silently dropped.\n\nNow `computeMatchVerdict` collects every signal that fired and returns the top three. The first becomes the headline (unchanged). The next two render as smaller dim italic rows below the headline, each with a small dot prefix — so the player gets a 2-3 line breakdown of what really happened, not just the worst single thing.\n\nWins skip the secondary causes — there's no need to dissect a victory the same way. Underdog moral wins (drew or narrowly lost vs a much-stronger team) get the moral framing as headline plus the actual mechanical issues as causes — \"Held the favourites — points off a stronger side.\" with \"Buildup play stalled — only 42% of attempts found the runner.\" underneath. Both true, both useful."
            }
          ]
        },
        {
          version: "0.59.0",
          title: "Card description audit: cards tell the truth",
          entries: [
            {
              title: "Seven cards lied about their numbers",
              body: "After the v0.57 tactic-description audit, ran the same handler-vs-description sweep on cards. Found seven cards making numerically wrong claims:\n\n- **Stone Cold** said \"+55 OFF\" — actual handler delivers +30 OFF / +8 CMP plus a guaranteed through-ball direct action. The +55 was never reachable; the through-ball was missing from the description.\n- **Killing Blow** said \"+45 OFF / +8 CMP\" — actual formula is `min(35, 22 + lead*3)`, capped at +35. The description's +45 was never reachable; the obsolete code comment in the handler also still claimed +40/+50/+60.\n- **Running Hot** said \"+5 OFF per win in current streak (max +25)\" — actual formula is `streak * 3` (max +15). Off by 40%.\n- **Hope Shot** said \"+6 OFF only if Flow = 0\" — actual handler does NO stat buff. The card is a 20% chance of a scrappy goal direct-action and nothing else.\n- **All-In (doping)** said \"condition +40, +14 OFF / +8 TMP, 25% yellow card\" — actual: condition +30, +10 OFF / +6 TMP base (+4 OFF on aggressive/tempo tactic), 15-30% backfire risk modulated by momentum, with a forced backfire on the 3rd play of the match.\n- **Second Half** said \"+8 CMP / +4 TMP\" — actual is +6 CMP / +3 TMP. Off by 25%.\n- **Bait The Counter** said \"Opp next attack: −18 OFF\" — there is no opp debuff in the handler. Actual: +8 DEF / +4 TMP this round, plus a Flow +2 outcome if opp doesn't score next round.\n\nAll seven descriptions rewritten in EN, DE, ES to match what the handlers actually do. The obsolete comment in killing_blow's handler also corrected to reflect the real formula."
            },
            {
              title: "Six more cards documented hidden mechanics",
              body: "While auditing, surfaced six cards with mechanics that the player had no way to know about from the description alone:\n\n- **Tight Shape**, **Hold The Line**, **Keeper Rush** all scale 1.3× when the opponent has a telegraphed threat loaded — rewards reading the threat banner before playing the defense card. Description now mentions the scaling.\n- **Gegenpress** scales 1.5× when match momentum is trailing — comeback amplifier. Description updated.\n- **Overlap Run** silently grants +6 TMP alongside its OFF buff. Now in the description.\n- **Hero Moment** silently grants +6 CMP alongside its OFF buff. Now in the description.\n- **Forward Burst** silently costs −4 CMP and gets +6 OFF on aggressive/tempo tactics. Both now documented.\n\nThe scaling on the three telegraph-reactive defense cards was a deliberate hidden depth-mechanic — the player who reads the opp's threat gets the reward — but the description never even hinted at it. Now mentioned briefly without spelling out the exact multiplier behaviour, so there's still discovery space but the player knows the mechanic exists."
            }
          ]
        },
        {
          version: "0.58.0",
          title: "Tactic modal redesign: facts up top, intel as one list",
          entries: [
            {
              title: "Reordered: header → stats → intel → choices",
              body: "The kickoff/halftime/final tactic modal had its layout backwards. The team-stats reference panel (PHASE BUILD · OFF 51-77 · DEF 48-91 · ...) lived at the BOTTOM of the modal, after the choice cards. So the player saw the choices first, scanned them, and only got to the factual reference data when they were already mentally committed to one option. The natural decision flow is the other way around — facts first, interpretation second, action third.\n\nThe stats panel now renders directly under the subtitle, before any intel hints, before the choice list. The intel hints (which interpret those stats) follow. The choice cards are last — given maximum visual weight when the player has the context to evaluate them.\n\nNew order: header → stats → intel → choices."
            },
            {
              title: "Three competing banners consolidated into one INTEL box",
              body: "The intel hints between the subtitle and the choices were rendered as three visually different elements: an italic gray line (\"Build-up runs through PM vision/composure: 85 VIS / 67 CMP\"), then a green-banner-on-green-background hint (\"Nicolás has the pace edge\"), then a red-banner-on-red-background hint (\"Back line under pressure\"). Three different visual treatments, three competing severities, all loud. The italic line had no severity marker; the banners had full colored backgrounds AND colored text — double-signaling the same severity through both the border and the text color.\n\nNew design: one container, three rows, all the same shape — a 3px colored left-stripe followed by gray text. Severity rides on the stripe alone (dim gray for neutral / info, green for opportunity, red for threat). No background tints, no inline colored text. The container has subtle dashed top/bottom borders to mark it as a group.\n\nReads as a list now, not as three boxes fighting for attention."
            }
          ]
        },
        {
          version: "0.57.0",
          title: "Description audit: tactics tell the truth",
          entries: [
            {
              title: "Double Down stopped amplifying debuffs",
              body: "The tactic was supposed to reward momentum — pick it when you have a buff active and Double Down magnifies it by 40%. The handler used `Math.abs()` to find the largest buff, which meant a tempo *debuff* of −7 (e.g. from an opp Slow Tempo trait) qualified as \"largest\" and got amplified to −10. Players picking Double Down expecting a buff saw the picker preview say \"−3 TMP\" and rightly went \"what?\". Fixed: only positive buffs count. If you have nothing positive ≥ 5, falls back to a modest +6 OFF / +6 DEF / +6 CMP all-rounder. Description updated to match."
            },
            {
              title: "Tactic descriptions stopped saying \"permanent\"",
              body: "v0.52 introduced post-match stat restoration to fix a snowball bug where Fortress, Lone Wolf, Masterclass and friends leaked their stat boosts into the run permanently. The fix worked — but six tactic descriptions kept claiming the boost was \"permanent\" or that the player \"permanently gains\" a stat. They were lying since v0.52.\n\nUpdated tactics — Reassign, Shake-Up, Sacrifice, Hero Ball — now read as match-long boosts (which is the truth). Role Switch description gained the missing personal-stat note (LF +8 OFF, ST +8 TMP). Mind Games gained the missing \"for 2 rounds\" duration on the opp composure debuff."
            },
            {
              title: "Log tooltips rewritten to read the line, not define it",
              body: "Hover-tooltips on log lines previously defined the *category* (\"Trait activation — the player effect fires in this round\") but didn't help the player parse the actual line in front of them. They've been rewritten as reading guides: each one names what to look for, where the values live, and what the brackets mean.\n\nExamples:\n\n- **Trait fires** → \"Reads as: player · trait · effect. Buff values appear in brackets.\"\n- **Card resolved** → \"Score the per-stat chips one by one. The phase chip shows fit — green for boost, gold for neutral, red for misfit (effect halved).\"\n- **Fatigue cost** → \"Watch the thresholds: <50 → −3 all stats, <25 → −6.\"\n\n17 tooltip keys, all three languages."
            }
          ]
        },
        {
          version: "0.56.0",
          title: "Quality-of-life pass: less clutter, clearer losses, faster runs",
          entries: [
            {
              title: "Opp threat banner slimmed to one line",
              body: "The OPP THREAT banner above the log routinely wrapped to two lines. The verb-phrase (\"loads up\", \"sets up\") and the trait description (\"opponent's striker forces a tackle, +25 attack\") were inline alongside the pin, label, severity dots and trait name. Now the banner stays one tight row — pin, label, dots, trait name, optional TELEGRAPHED tag — and the verb phrase plus full description live in the hover tooltip where they have room. The banner reads at a glance again.\n\nThe blinking ⚠ in the corner of telegraphed banners is gone. The animation was double-signaling the same information (severity color shift + tag + telegraph mark + blink), and the motion competed with the log content next to it. The marker stays as a static, dimmed glyph; the inline TELEGRAPHED chip already labels the actionable info."
            },
            {
              title: "Match result now opens with a one-line verdict",
              body: "Losing was hard to read. The score and result tag told you what happened, the log told you the play-by-play, but the *why* sat between the two. New: the result-screen hero now leads with a single italic line that reads the telemetry and points at the dominant cause.\n\nA priority ladder picks the most explanatory signal:\n\n- Stood up to a clearly stronger side → \"Held the favourites — points off a stronger side.\"\n- Multiple starters ended below 35 condition → \"Squad ran out of legs — Antony Dembélé, Jadon Chiesa dropped below 35 condition.\"\n- Buildup found the runner less than half the time → \"Buildup play stalled — only 42% of attempts found the runner.\"\n- Created chances but couldn't finish → \"9 shots, one goal — chances came, finishing didn't.\"\n- Opp converted ruthlessly → \"Their 3 chances found 3 goals — clinical.\"\n- Generic fallbacks per result type for the rest.\n\nFalse positives are filtered: a win never gets a fatigue verdict (you won, who cares), an underdog moral verdict only fires on near-misses (won't trigger on a 4:1 demolition that you happened to be slightly favored against). The verdict colours match the result tone (green for wins, muted-warm for losses, gold for draws)."
            },
            {
              title: "Probable Situations panel hidden until match 3",
              body: "The Probable Situations panel — frame name + likelihood dots + counter/payoff count — is one of the densest UI elements on the matchup screen. New players staring at \"GOALIE STREAK · ▰▰▰ · 2 PAYOFFS\" while still figuring out their hand had no shot at decoding it. The panel now waits until match 3 to appear, mirroring the v0.51 trait-severity gating that opponents already follow. By match 3 the second tutorial (v0.55) has run, the player has played one full match, and the panel arrives explained. Frames still occur in matches 1 and 2 — only the pre-match preview waits."
            },
            {
              title: "Quick Sim button for routine fixtures",
              body: "Mid-run the player often faces a fixture they're heavily favored to win — a mid-table amateur on a win streak, +30% power advantage. The card phase still takes 4-5 minutes per match, so a routine 7-match Pro-Liga run starts to feel like padding.\n\nNew: a ⏩ Quick Sim button surfaces in the hub when *all* of these hold — 25%+ power advantage, no boss, no cup tie, on a win streak (≥1), match 3 or later. One click runs the match in a few seconds with no card phase, tactics auto-picked from the recommendation slot, animation accelerated. Fatigue still ticks, opp moves still fire, the engine is unchanged — only the player input is collapsed.\n\nConservative on purpose: every guard must hold, button hides otherwise. Cup ties, boss matches, and any fixture where the player is even slightly underdogged still go through the full flow — the moments where decisions matter. The flag resets after each match so opting in is a per-fixture choice, never a setting that drifts on across meaningful games."
            }
          ]
        },
        {
          version: "0.55.0",
          title: "Second-stage onboarding tutorial",
          entries: [
            {
              title: "New: \"a few more things\" overlay after match 2",
              body: "First-time players got a 5-step Hand / Energy / Flow / Situations / End Turn overlay on their very first card phase. Enough to play match 1, but it left a lot of UI undecoded — the round-header phase words, the ★ chips on cards, the Probable Situations panel that's been visible since the hub.\n\nA second overlay now fires once at the start of match 3's card phase. Three points only, written without jargon: how to read PHASE in the round header (ATTACK boosts combos, DEFENSIVE boosts defense), what the ★ chip on a card means (expected goal impact this turn, hidden when the card is in soft-disconnect), and the Counter vs Payoff distinction in the Probable Situations panel. Dismiss via button or backdrop click; persists in localStorage so existing saves only see it once."
            }
          ]
        },
        {
          version: "0.54.0",
          title: "Pulse-tile tooltip localized",
          entries: [
            {
              title: "Pulse-tile breakdown showed German text in EN/ES",
              body: "The matchday pulse-tile tooltip listed the source of every stat change (condition penalty, player form, team form, cards/tactic buffs). Four of those source labels were hardcoded in German strings — \"Kondition 42 → −3 alle Stats\", \"Form +1 → +2 OFF\", \"Team-Form → +3 alle Stats\", \"Karten/Taktik → +6 DEF, +2 OFF\". They worked in DE but bled through unchanged in EN and ES.\n\nNew i18n keys `ui.match.pulseTipCondition` / `pulseTipForm` / `pulseTipTeamForm` / `pulseTipCardsTactic` carry the templates. Each language file gets its own version with proper terminology (`Condition` / `Kondition` / `Condición`; `Cards/Tactic` / `Karten/Taktik` / `Cartas/Táctica`). The same hover line that surfaces *why* a stat dropped now reads correctly in the active language."
            },
            {
              title: "Confirmed: condition drops stats at 50 / 25 thresholds",
              body: "Reminder for the curious: a player's `condition` directly reduces every one of their five stats once it crosses two thresholds. Below 50, all stats take −3. Below 25, all stats take −6. The hit applies every round in the match, not just at kickoff. The pulse-tile breakdown surfaces this exact line so you can read the cause when a starter looks weaker than their card-shown stats.\n\nThe between-match recovery mechanic (≥60 → restored to 90, 40-59 → 80, 20-39 → 70, below 20 → 55) exists specifically to prevent multi-match dragging into the −3/−6 bands. Rotating an overplayed starter usually fixes it. No mechanic change here — just clarification of an already-shipped system."
            }
          ]
        },
        {
          version: "0.53.0",
          title: "Card-desc placeholders & payoff semantics",
          entries: [
            {
              title: "Cards with role placeholders no longer show literal {st}",
              body: "Lone Striker, Team Unity, Masterclass, Clinical Finish, Stone Cold and ~20 other cards described their effects with role tokens like \"{st} condition ≥ 70\" or \"+15 to {pm}'s vision\". The flavor narration after a card play (\"{st} goes it alone — and finishes\") had a working interpolator since v0.39, but the static **description** went through a different render path that called the i18n lookup with no variables — so the curly-brace placeholders stayed verbatim everywhere they appeared.\n\nThe screenshots that flagged it: the Lone Striker draft tile reading **\"If {st} condition ≥ 70: +22 OFF\"** instead of the player's name.\n\nNew helper `UI.resolveCardDescription(cardId, match)` mirrors the existing flavor-text interpolator. Six call sites now go through it: hand-card body, hand-card unplayable tooltip, deck-panel tooltip, codex card list, team-selection archetype chips, and the card-draft tile itself. In a live match you see real names (\"If Antony Dembélé condition ≥ 70…\"); in the codex/draft views, where there's no squad context, role abbreviations stand in (\"If ST condition ≥ 70…\"). Either way, no more raw `{st}` ever surfaces."
            },
            {
              title: "\"Probable situations\" no longer calls every card a counter",
              body: "The match-prep panel listed up to three upcoming-match frames with a right-side label like **1 COUNTERS** or **NO COUNTERS**. Eight frames are tracked, and five of them — `GOALIE STREAK`, `THEY ARE RATTLED`, `HOT CORRIDOR`, `OPP STAR DOWN`, `OPP KEEPER SHAKY`, `OPP DEFENSE STRETCHED` — are favorable to the player. Calling cards that **exploit** a favorable situation \"counters\" is the wrong word: counters fight threats, payoffs cash in advantages.\n\nThe label now switches on the same severity map that drives the row's color:\n\n- **warn / danger** → \"1 counter\" / \"no counters\" (Konter / Hebel inverse)\n- **good / opportunity** → \"1 payoff\" / \"no payoffs\"\n\nTooltips on both the row title and the right-chip mirror it. \"Counters in your deck:\" becomes \"Payoffs in your deck:\" for favorable frames; the zero-count tooltip says \"no cards that exploit this situation\" instead of \"no cards specifically addressing this situation\". The color coding (`aip-tone-*` / `aip-sev-*`) was already correct in v0.45/v0.52 — this fixes the wording that was contradicting it."
            }
          ]
        },
        {
          version: "0.52.0",
          title: "Snowball cure: tactic stats no longer leak",
          entries: [
            {
              title: "Ten tactics permanently mutated player stats",
              body: "Fortress, Lone Wolf, Masterclass, Hero Ball, Wing Overload, Wingman, Role Switch, Shift, Sacrifice, Shake-Up — ten kickoff/halftime/final tactics directly mutated `player.stats.X` instead of pushing decaying buff layers. The handlers said \"persists past round 6\" and meant *within the match*, but with no post-match restore step the boosts (and the two debuff handlers) leaked into the run permanently.\n\nA telemetry dump from a 14-match Pro-Liga run showed the canonical case: **a Fortress pick at match 5 lifted the keeper's defense from 72 to 99 and locked it there for the next nine fixtures**. Score progression confirmed the consequence: M1–M10 averaged 4.3:1.0, M11–M14 averaged 10.5:0.3. The unattributable late-run snowball was the leak.\n\nFix: every starter's stats are snapshotted before a match and restored when it ends. Tactics still hit hard within the match (their intended effect window) but the run-level damage is gone. Telemetry from a clean v0.52 run confirms organic-only growth: the same keeper rose from 77 → 96 across 12 matches via levels and evolutions, no Fortress carryover spike."
            },
            {
              title: "Tactic picker now shows where direct stat boosts land",
              body: "The kickoff/halftime/final picker preview read `match.teamBuffs` only. When Fortress moved +40 defense **directly onto** the keeper and centre-back, the preview said `[OFF +4  DEF -25  COM -6]` — the +40 was nowhere to be seen, and worse, when a player was already at the 99 cap the entire boost vanished silently.\n\nNew preview line surfaces the personal mutations: `→ Fortress  [OFF +4  DEF -25  COM -6]  (TW DEF +27, VT DEF +13)`. The deltas reflect what actually landed — including any 99-clamp losses (a +40 intent capped to +13 surfaces as +13, signaling the cap quietly). When every personal mutation lands on a 99-capped stat and the delta is zero, no parenthesis is emitted — same shape as tactics that never had a personal effect."
            },
            {
              title: "Telemetry actually populates the shot/buildup/save fields now",
              body: "The post-match telemetry payload was reading from fields that didn't exist (`match._shotsMe`, `_savesMe`, `_buildupAttempts`). The engine writes to a different path (`match.stats.myShots`, `match.stats.saves`, `match.stats.myBuildups`). Result: every telemetry export had every shot, buildup, save and trait-fire count emitted as 0 or null across the entire run, hiding the most useful balance-audit signal.\n\nFixed at the source. The payload now also includes shotsOnTarget, opp-buildup attempts/successes and an average-possession field. Trait-fire totals split into `{me, opp, oppByTrait}` instead of a single hash that was never populated."
            },
            {
              title: "Likelihood dots on the situations panel now agree with the title",
              body: "Frame titles like `GOALIE STREAK` rendered green (situation favors you) but the likelihood dots next to the title rendered red-orange (high-likelihood). Same row, contradictory signals. Severity now wins: green dots for favorable frames, red for threats. The dot count (▰▱▱ / ▰▰▱ / ▰▰▰) keeps encoding likelihood independently."
            }
          ]
        },
        {
          version: "0.51.0",
          title: "Amateur-league onboarding balance",
          entries: [
            {
              title: "Match-1 opponent power tier capped",
              body: "Players reported amateur opponents in the very first match showing stat lines like 65/104/140/67/81 against starter rosters of 52/72/61/63/68 — a tempo gap big enough that the opening fixture felt like punching a brick wall. Root cause: the round-robin schedule pulled opponents from a power curve that distributed strength across the whole season (matches 2 through 9), so the worst-case match-1 fixture could be a tier-9 opp.\n\nThe power curve now caps at tier 6 in an 8-team league. Worst-case match-1 power dropped from 502 to 394 (gap shrank from +44% to +19%). A side-effect: a stale boss-bonus check that auto-applied a +90 stat boost to any opponent seeded at tier 7 became inert (no opponent now reaches that tier in the regular schedule)."
            },
            {
              title: "Severe traits gated to mid-season",
              body: "Trait complexity was keyed to the opponent's power tier, not to where the player is in the run. So a tier-6 opp at match 2 could roll up with severity-3 traits (Counter Specialist, Clutch Finisher) — devastating mechanics the player has no Counter cards for yet.\n\nNow trait severity is clamped by match number. Match 1: no traits at all. Matches 2–5: maximum one trait, severity 1–2 only. Matches 6–12: up to two traits, severity-3 unlocks. Match 13+: full complexity. Boss matches keep their auras intact — those are the explicit difficulty spikes."
            }
          ]
        },
        {
          version: "0.50.0",
          title: "Soft-counter: defense finally counts",
          entries: [
            {
              title: "Defense cards tracked as soft counters",
              body: "The 0/36 defused telemetry was misleading — defense cards worked every time with stat buffs (+6 DEF etc.), but never counted as \"counter\". Only explicit shield triggers (when an opp trait was canceled) counted.\n\nNew: if you play a defense or counter card in a round AND `teamBuffs.defense ≥ 8` is active, the opp move is tracked as \"soft-defused\". You also get a new log line:\n\n> ✓ Defense buffer absorbs Park the Bus — dampens the effect.\n\nThe dual condition (card played AND buff high enough) prevents defense cards without real buffs (pure directAction cards) from wrongly counting as counters. The log line runs with class `player-shield` — so it's automatically tracked as `defused: true` in telemetry."
            },
            {
              title: "Counter system audit: full picture",
              body: "Systematic check of all cards with \"wait-for-opp-event\" patterns:\n\n- 2 cards with `opp-trait-cancel`: ball_recovery, high_press_trap\n- 1 card with `opp-trait-dampen`: wing_trap\n- 1 card with `absorb-next-shot`: clutch_defense\n- 1 card with `yellow-absorb`: desperate_foul\n- 1 card with `bait-counter`: bait_counter\n- 3 cards with `intent-absorb`: block, preempt, pressure_trap\n- **20 cards with `flow-requirement`**: play base effect at flow<2, premium effect at flow≥2\n- 10 cards with `lane-open`: setup for following cards\n\nThis is a bigger theme than expected — especially the 20 flow cards have the same tracking problem (premium trigger is often invisible). That's for a separate release — here only soft-counter for defense/counter cards."
            }
          ]
        },
        {
          version: "0.49.0",
          title: "Stat-scale fix, early-match relief",
          entries: [
            {
              title: "Stat display engine-aligned — real scale fix",
              body: "The screenshot showed \"OFF 46 vs 123\" against an amateur-tier opponent — it looked like a huge gap, but it was an apples-vs-oranges comparison:\n\n**Our value** came from `aggregateTeamStats()` = **average** of 5 players (avg OFF ~46). **Opp value** came from `opp.stats.offense` = **team aggregate** from the engine's power split (~120). Both sides put side-by-side on different scales.\n\nThe engine itself computes **role-weighted**:\n\n- Offense: ST×0.50 + LF×0.28 + PM×0.22 (ST-centric)\n- Defense: VT×0.45 + TW×0.55 (only defensive roles)\n- Tempo: LF×0.50 + ST×0.30 + PM×0.20\n- Vision: PM×0.42 + ST×0.18 + LF×0.18 + VT×0.12 + TW×0.10\n- Composure: avg of all 5\n\nNew helper `teamStatsEngineAligned()` reproduces these weights exactly. Scorecard (match preview in hub), match footer and win probability now use it — no more distorted gap. The preview finally shows what the engine actually computes."
            },
            {
              title: "Opp moves: severity cap in early matches",
              body: "Telemetry + user feedback: \"opp threats come too early in the first matches, you don't have a chance to block anything yet\". The old `stageMin` filter already allowed 4 severity-2 moves in M1 (Quick Strike, Pressing Surge, Rage Offensive, Park the Bus) — too harsh when the player has no counter repertoire yet.\n\nNew severity cap based on match number:\n\n- **M1-2**: severity 1 only (Overload Flank, Long Ball, Counter Blitz, Bunker, Training Focus, Captain Speech — \"mild\" moves)\n- **M3-5**: up to severity 2 (Quick Strike & Co. back in play)\n- **M6+**: all severities (up to 3, once stageMin is met)\n\nCup matches and boss games don't bypass the cap — but those don't hit before M5+. Result: onboarding gets breathing room, late matches stay sharp."
            },
            {
              title: "Counter system audit: clarification, not redesign",
              body: "User question: \"if counter cards were ineffective, does that also apply to other relationships?\". Audit of the 10 counter cards:\n\n- 3 cards (gegenpress, block, preempt) — **unconditional**: always fire with stat buff\n- 3 cards (ball_recovery, wing_trap, high_press_trap) — **pending**: set a flag that only triggers if the opp plays a trait shot-bonus this round\n- 4 cards (desperate_foul, bait_counter, pressure_trap, counterpunch) — **situational**: wait for specific events (yellow card, intent-absorb, counter-blitz)\n\nThe 0/36-defused telemetry came from the pending and situational cards — when the event doesn't happen, nothing counts as \"defused\". **But**: the stat-buff effect still ran. `ball_recovery` still gave +6 DEF / +4 TMP this round even when the opp trait didn't fire.\n\nNo redesign now — that would be design-balance work at scope. But tracking is clearly misleading. Phase 2 would be: count defense cards as soft counters in tracking so the \"defused\" signal isn't underrepresented."
            }
          ]
        },
        {
          version: "0.48.0",
          title: "Balance, bar gone, log tooltips",
          entries: [
            {
              title: "Balance: opp ramp down, win-confidence bonus",
              body: "Telemetry 0.44.0 showed match-9/10 wipeouts (0:5, 0:2) with opp defense 152/154. Two knobs turned together (Balance Option C):\n\n**Opp ramp smoothed**: the seasonal opponent stat multiplier drops from +22% to +18% at the last match. +0% at M1, +8% end of first leg, +18% at last match. No big curve breaks — just slightly gentler late-season peaks.\n\n**Win-confidence bonus**: after every league win, +1 persistent across all five team stats, capped at +4 over the season. No penalty for draws/losses. Resets on season change. Applied as a match-long buffLayer (source: `confidence`, range 1-6) — shows in the stat-breakdown tooltip as part of the cards/tactic line.\n\nNarrative: team plays with confidence after wins, but doesn't lose momentum from single losses. Intentionally subtle (+4 is ~7-8% of a base-55 stat) — noticeable, not snowball."
            },
            {
              title: "Pulse-tile bar removed",
              body: "The Unicode bar scale (▰▰▰▰▰▰▱▱▱▱) added in v0.47 is gone again. Without a hard cap like in Fifa, stats can go above 99 via card and trait buffs (base 88 + buff +20 = 108) — the 10-segment bar overflows or lies. The Base→Effective format with delta stays (\"OFF 55→65 (+10)\") — still readable without the bar."
            },
            {
              title: "Log lines get tooltips",
              body: "Hovering over log lines now shows a short mechanical explanation of the category. 17 categories with tooltips: trait triggers, own/opponent cards, counter shields, micro-boosts, condition gain, role affinity, tactic feedback, streaks, opp save/adapt, fatigue cost, cards (yellow/red), phase shifts.\n\nExamples:\n\n> Trait activation — the player effect fires in this round.\n> Opponent card — effect is active. Counter/defense cards can help.\n> Fatigue cost: condition drops — starters lose stats noticeably.\n\nAddresses feedback \"shouldn't some logs get tooltips too?\". Structural lines (round headers, kickoff) and self-explanatory ones (goals, direct actions) stay without tooltips on purpose."
            }
          ]
        },
        {
          version: "0.47.0",
          title: "Transparency: stats, counters, traits",
          entries: [
            {
              title: "Pulse tooltip: full values + bar scale instead of just deltas",
              body: "The hover tooltip on player-pulse tiles showed only stat deltas (\"DEF −4\") — no context for where the value actually sits. Fully reworked: **all 5 stats** with Base → Effective arrow and a Unicode bar (10 segments, 0-99 → 0-10):\n\n> OFF 55→65 (+10) ▰▰▰▰▰▰▱▱▱▱\n> DEF 48→42 (−6)  ▰▰▰▰▱▱▱▱▱▱\n> TMP 72      ▰▰▰▰▰▰▰▱▱▱\n\nStats without delta show just the current value, stats with delta show base, effective and change. Tabular-nums keeps the bars aligned."
            },
            {
              title: "Stat breakdown: causes of the deltas",
              body: "Below the stat list there's now a breakdown with the **sources** of changes:\n\n> Kondition 42 → −3 alle Stats · Karten/Taktik → +6 DEF, +2 OFF\n\nDirectly addresses the confusion \"card says +8 DEF but the stat is lower than before\". Sources shown: condition penalty (<50 = −3, <25 = −6), player form (±2 per form step on focus stat), team-form bonus, active team-buffs from cards and tactics."
            },
            {
              title: "Counter hints on opp-move telegraph",
              body: "Telemetry showed: across 36 opp-moves in 10 matches, NOT ONE was defused. The counter system was invisible to the player — you didn't know which card helps against which move. New: at severity ≥ 2 telegraphs, a second log line appears with the counter tip per category:\n\n> ▸ Albion Windhaven loads: Bunker [●○○]\n>   ↳ Counter: Combo card with Flow ≥ 2 breaks the wall.\n\nCategories: `aggressive` (defense cards), `lockdown` (combo with Flow), `disruption` (medic/defense), `setup` (trigger cards), `big` (Flow + counter/combo). Kept general as a signpost — precise card-per-move mapping is phase 2."
            },
            {
              title: "Trait categorization in player detail",
              body: "The 45 player traits are now grouped by their timing, with colored category headers:\n\n- **Passive** (cyan): permanent or per-round chance — 17 traits\n- **Event** (gold): on a specific match event (after save, concede, etc.) — 9 traits\n- **Conditional** (magenta): only under certain states (R5-6, tempo delta, when trailing) — 13 traits\n- **One-shot** (green): 1x per match or half — 6 traits\n\nHover over the category header explains the timing behavior. Easier to grasp when which trait fires — especially for legendaries with 2-3 traits at once."
            },
            {
              title: "Hub alerts above match progression",
              body: "Suspensions and critical warnings now appear **above** the season progression row, no longer between match preview and accordion. Warnings should be seen early in the reading flow, not hidden behind scrolling."
            },
            {
              title: "Final-match cell: no special style anymore",
              body: "The final-match cell in the progression was last harmonized in v0.45 (solid + dampened gold tint). Now fully removed: final matches look like any other match cell. Recognition runs through match number and opponent info in the match hub, not through tile chrome."
            }
          ]
        },
        {
          version: "0.46.0",
          title: "Sub-pulse fix, trigger glow & tooltip clarifications",
          entries: [
            {
              title: "Bugfix: match-pulse updates on substitution",
              body: "After a halftime sub (\"Zinedine Zidane on for Riyad Doku\"), the player-pulse tile of the outgoing player remained in place — old name, old role. Only the footer stat bars were updated (v0.38 fix), not the tile itself. Now the sub calls `UI.replacePulseTile()` which replaces the old tile in-place with a fresh one for the incoming player, including role/name/condition-bar/stat-tip."
            },
            {
              title: "Trigger glow on trait activations",
              body: "Trait-trigger log lines get a subtle gold flash on appearance (1.2s gentle fade-out) so activations don't get lost among other messages. Slide-in animation of the other log entries remains unchanged and gentle."
            },
            {
              title: "Tactical Foul tooltip clearer",
              body: "The old tooltip (\"+8 defense, opp tempo -12. Disruption, not self-improvement.\") was cryptic. New framing: who does what (CB deliberately fouls), at what cost (3 condition lost on CB), and why (rhythm-breaker, not an upgrade to your own play)."
            }
          ]
        },
        {
          version: "0.45.0",
          title: "Match-end drama & UI bugfixes",
          entries: [
            {
              title: "Dramaturgical match-end feedback",
              body: "Full-time isn't neutral anymore. Before the standard epilogue there's now an **additional narrative line** when the match falls into a memorable category: comeback, collapse, last-minute goal/concession, shutout win/loss, blowout, nail-biter, goal-fest draw. For normal matches the standard epilogue runs as before.\n\nExamples:\n\n> The team pulls a loss into a win — 3:2. Hat off.\n> Collapse in the final stretch — a lead becomes a loss. 3:4.\n> Clean sheet — the defense stood like a wall. 3:0.\n> Lost on the knife-edge — 2:3. So close.\n\n11 categories × ~3 variants × 3 locales. Requires a new per-round score timeline in match state (`match.scoreTimeline`) so comeback/collapse detection can work."
            },
            {
              title: "Bugfix: Codex legendary traits showed raw i18n keys",
              body: "In the Codex legendary overview, trait names rendered as \"data.traits.big_game.name\" raw because the i18n lookup only checked the `data.traits.*` namespace. Legendary-specific traits live under `data.legendaryTraits.*`. Fix: lookup now tries `data.traits.*` first, then `data.legendaryTraits.*`, then falls back to the raw key."
            },
            {
              title: "Bugfix: progress-cell \"final boss\" background mismatch",
              body: "The final-match tile in match-progression row used a linear-gradient while all other tiles use solid `--bg-3`. This created a visually jarring break in the row. New: solid like all others, plus a dampened gold tint via `box-shadow: inset` so the final tile stays recognizable without breaking the grid consistency."
            },
            {
              title: "Bugfix: probable-situations — who benefits?",
              body: "In the \"Probable Situations\" hub panel it wasn't clear whether a frame runs FOR or AGAINST us. \"GOALIE STREAK\" for example is a positive event (our keeper in form) but rendered identically to negative frames.\n\nNew: frame label gets severity-based color — green for positive (good/opportunity), yellow for warn, red for danger. The counter count on the right keeps its own tone (deck readiness), so both axes stay independently readable."
            }
          ]
        },
        {
          version: "0.44.0",
          title: "Penalties, offside & trait tooltips",
          entries: [
            {
              title: "Inline penalty kick (1.5%)",
              body: "New goal situation: instead of a normal attack, a penalty kick can occur (1.5% chance both sides, roughly 1 per 20-30 matches). Resolved **inline**, no modal — the sequence plays directly in the match log.\n\nIntro → Outcome in two narrative lines:\n\n> Foul in the box! The referee points to the spot — penalty to us.\n> Gakpo converts coolly.\n\nThe **shooter** is the player with highest composure (offense as tiebreak). The **keeper** is the opponent GK. Goal probability from both stats: base 73%, modified by shooter composure/offense (+) and keeper defense (-), range 55-92%. Three outcomes: goal, save, miss (post/over). Goal acts as a normal goal (score +1, momentum +30, matchPhase=buildup). Non-goal: momentum neutral, matchPhase=transition.\n\nStats: myPenalties/oppPenalties + myPenaltiesScored/oppPenaltiesScored.\n\n4 intro variants per side + 4 goal + 4 save + 4 miss = 24 penalty lines per locale, per-match and per-scene anti-repetition."
            },
            {
              title: "Two-sided offside (3%)",
              body: "Parallel to the woodwork: the goal goes in but gets chalked off. 3% per goal event, both sides. Five variants per side:\n\n> Offside! Gakpo was a shoulder too far.\n> The flag saves us — Kagawa was three steps past the line.\n\nNo score effect, matchPhase=transition. Stats: myOffsides/oppOffsides."
            },
            {
              title: "Player-trait tooltips rewritten narratively (45 traits)",
              body: "All 45 player-traits in all 3 locales rewritten from \"mechanics-first\" to \"narrative-first\", same style as the earlier opp-traits and legendary-traits pass. Examples:\n\n- Old: \"Once per match: the first goal conceded is cancelled.\"\n- New: \"Lands on his feet like a cat, the first hit bounces off — once per match, the first goal conceded is cancelled.\"\n\n- Old: \"Entire team gets +3 composure.\"\n- New: \"Brings calm to the whole team on the pitch — every teammate gets +3 composure.\"\n\nMechanics remain unchanged (no balance shift), only the tooltip becomes more explanatory and atmospheric. Trait names unchanged."
            }
          ]
        },
        {
          version: "0.43.0",
          title: "Woodwork",
          entries: [
            {
              title: "Both-sided post hits (4%)",
              body: "Near-goals now have their own drama: 4% chance per goal event that the shot cracks off the woodwork instead of the net. **Both-sided**: my shots can hit the post/crossbar (frustration moment \"that close\") AND opponent shots equally (relief moment \"got away with one\"). Net goal rate on both sides reduced by ~4%, balance stays level.\n\nThe moment gets its own narrative line. Examples:\n\n> Built up through a switch of flanks — Gakpo cracks it off the bar.\n> Post! Gakpo has no luck.\n> An overlapping run puts Gakpo through — and only the post denies them.\n\nOpponent side:\n\n> Post! Kagawa was through — and the frame saves us.\n> The bar denies Kagawa.\n> Kagawa cracks the post — the ball rolls along the line and away.\n\n8 variants on own side + 6 variants on opp side per locale. Anti-repetition per match tracked separately per scene."
            },
            {
              title: "Stats: myPostHits / oppPostHits",
              body: "Two new counters in match.stats. Not UI-exposed yet but available for future telemetry and potential \"The post hates you today\" stats surfaces."
            }
          ]
        },
        {
          version: "0.42.0",
          title: "Narrative layer: goal build-up",
          entries: [
            {
              title: "Your goals now show the build-up chain",
              body: "Previously: play a card, ⚽ goal, done. Now: before the goal event the game tells you **how the attack was built** — using the last setup card, last trigger card, and combo card (if any) from this round or last. Examples:\n\n> Built up through a switch of flanks — Gakpo finishes.\n> The chain from a switch of flanks to an overlapping run puts Gakpo in.\n> The Masterclass! Müller lands the blow.\n\n9 template variants per locale, 16 cards with narrative hints. Anti-repetition per match — the same variant doesn't appear twice in a row. Variants whose placeholders can't be filled from current match state are automatically dropped from the pool (no \"{setupHint}-fallback\" text)."
            },
            {
              title: 'Conceded goals with context — "why did we let that in?"',
              body: "Parallel to the own-goal narrative, conceded goals now get context too. Since the opponent has no card system, the context comes from **our tactical state** when we conceded (were we pushed forward, all-in, aggressive, card-less?) plus a hint from active shot-thematic opp traits (Sniper, Counter, Clutch, etc.). Examples:\n\n> After our push forward — Kagawa strikes back.\n> Counter-strike meets our all-in gamble — Gomez delivers.\n> Classic sniper strike: Kagawa buries it."
            },
            {
              title: "Technical infrastructure: narrative module",
              body: "New `js/narrative.js` with scene registry and template system. Each scene has a variant pool with per-match anti-repetition. Own log-tier `is-narrative` with subtle italic CSS. Engine hooks are defensive in try/catch — narrative can never block engine flow. The infrastructure now serves as a foundation for further scenes (post hits, injuries, penalties in upcoming releases)."
            }
          ]
        },
        {
          version: "0.41.0",
          title: "Tooltip polish round 2",
          entries: [
            {
              title: "Roster chips on team selection now have tooltips",
              body: "The 5 archetype chips on the team-selection screen (\"Blocking Keeper\", \"Sweeper Defender\", etc.) were label-only. Tooltip now surfaces role abbreviation, full stat profile, and highlights the two strongest stats. When an archetype description text exists in i18n, it shows up too."
            },
            {
              title: "Opponent trait descriptions rewritten",
              body: "All 13 opponent-trait descriptions were bare stat specs (\"+8% shot accuracy\") — zero atmosphere, zero game-sense. Now narrative-led with mechanics anchored: \"Drives every shot with surgical precision — their strikes land 8% more accurately on your keeper's frame.\" Covers sturm, riegel, konter_opp, presser_opp, clutch_opp, lucky, ironwall, sniper, boss_aura, bulwark, counter_threat, rage_mode, pressing_wall — across DE, EN, and ES."
            },
            {
              title: "Legendary trait descriptions rewritten",
              body: "The 8 legendary traits got the same treatment. \"Per successful build-up: +8% on the next goal.\" becomes \"Every pass sets up the next. Each successful build-up lifts the next finish's goal chance by +8%.\" Applies to: god_mode, clutch_dna, field_general, unbreakable, big_game, conductor, phoenix, ice_in_veins."
            }
          ]
        },
        {
          version: "0.40.0",
          title: "Team identity & tooltip polish",
          entries: [
            {
              title: "Team choice: archetypal starter decks",
              body: "Through 0.39 the run-start team pick was essentially cosmetic — different legendaries on the bench but an identical starter deck for everyone. Starting now each of the four teams flavors its deck with **4 archetype cards** (plus 10 shared core cards), so team identity is tangible from match 1:\n\n- **Counter Specialists:** hope_shot, long_ball, ball_recovery, grind_through — direct counter-attack football\n- **Powerhouse:** long_ball, deep_defense, grind_through, lone_striker — physical attrition with a target-man finisher\n- **Technicians:** masterclass, triangle_play, clinical_finish, quick_scout — most combo-dense starter, vision-leaning\n- **Pressing Beasts:** forward_burst, high_press_trap, counterpunch, running_hot — aggressive triggers plus two counters\n\nThe 4 archetype cards now appear as color-coded chips on the team-selection screen (border color reflects card type), each with a tooltip."
            },
            {
              title: "Recruits: stratified offers + weak-role bias",
              body: "Post-boss legendary offers used to be three uniform-random picks — a team that didn't need a striker could still get three ST legendaries by bad luck. Now **three different roles guaranteed**, and one slot is **biased toward the weakest starter's role** so the offer always includes a plausible squad-gap filler. Deliberately NOT team-thematic: legendary traits and evolution paths stay fully random, keeping hybrid builds and unexpected synergies on the table."
            },
            {
              title: "UI: deck-panel chips disambiguated",
              body: "The deck-panel chips (\"2 MASTERCLASS\" / \"1 BREATHER\") had the energy cost to the left of the name — visually indistinguishable from a copy count. Players couldn't tell whether \"2\" meant \"costs 2 energy\" or \"2 copies in deck\". Fix: **⚡ prefix** (\"⚡2 MASTERCLASS\"). Duplicates keep their separate \"×N\" marker on the right. Tooltip per chip now structured: name, type, energy cost, fatigue cost, copies — all laid out."
            },
            {
              title: "UI: missing tooltips filled in",
              body: "Three visible chip classes carried no tooltip — the player saw markers without knowing why. Now each explains itself: **opponent key-player row** (who's the main threat and why), **focus-chip on tactical decisions** (which player gets boosted and why), **halftime mechanic tag** (what carries into the second half)."
            }
          ]
        },
        {
          version: "0.39.0",
          title: "Deck-breadth fixes",
          entries: [
            {
              title: "Balance: switch_lane dominance broken",
              body: "0.37 telemetry showed **switch_lane at 59 of 155 plays = 38%** — it stacked three utilities into one cost-1 card: Flow, lane-opener, and +8/+4 stats. Every hand picked it first; drop_deep and quick_build got played three times less. Fix: **laneOpen now requires Flow ≥ 1 already built up**, and fatigue rises from 3 to 4 (matches the defense rebalance from 0.37). A turn-start switch_lane still works as a plain setup; the lane only opens as a chain after another flow-generator."
            },
            {
              title: "Balance: draft pool stratified",
              body: "Through 0.38 the draft pool (58 cards across 6 types) distributed the 3 offers uniformly — big types like setup (21% pool share) appeared in 72% of drafts, thin ones like draw (10%) only in 24%. Over an 11-draft season, counter and draw archetypes could stay **invisible the entire run**. Fix: each draft now surfaces **3 DIFFERENT types** — probability of seeing a draw-archetype per draft goes from 24% to ~42%. Small trade-off: no more drafts with three setups in a row — acceptable since the starter deck is already setup-heavy."
            }
          ]
        },
        {
          version: "0.38.0",
          title: "Condition & tooltips",
          entries: [
            {
              title: "Balance: condition stuck-state broken",
              body: "0.37.0 telemetry showed a death-loop pattern: three starters sat at 45/100 condition from match 4 through the end of the season — precisely the `<20 → 45` recovery floor, and also below the 50 threshold where the -3 stat malus kicks in. End match under 20 → back to 45 → play next match at -3 → end under 20 again → loop. Recovery curve bumped +10: light use 88 (was 82), moderate 76 (70), heavy 65 (58), overplayed 55 (45). Critical: **the new floor at 55 lands above the 50 malus threshold**, so an overplayed starter enters the next match tired but NOT with a permanent stat penalty."
            },
            {
              title: "UI: role abbreviations consistent",
              body: "The condition chips on hand cards and the fatigue warning row in card-mode still showed internal role codes TW/VT/PM/LF/ST instead of the player-facing GK/DF/PM/WG/ST used elsewhere. Now consistent across the whole UI."
            },
            {
              title: "UI: fatigue warning row cleaned up",
              body: "The \"💨 FATIGUE\" row under the phase banner had no CSS at all — label and player chips collided (\"FATIGUELF Gakpo\"), and it lit up for anyone under 40 condition (too many false alarms since the per-card chips already cover that range). Now with proper layout, and only visible when at least one outfield starter sits below 30 — the actual near-danger tier."
            },
            {
              title: "UI: opp-trait tooltips completed",
              body: "Five opponent traits (Bulwark, Double Counter, Rage Mode, Pressing Wall, Boss Aura) had no tooltips — the render path only checked the oppTells translation table, and those five weren't in it. All 13 traits now carry action-oriented tooltip advice."
            },
            {
              title: "UI: fatigue stat malus in player tooltip",
              body: "The tooltip on a player card's condition bar now surfaces the **currently-active stat malus** right at the top: \"Critical fatigue — all stats currently reduced by 6\" under 25, \"-3\" under 50. Recovery explanation below updated to the new values (88/76/65/55)."
            },
            {
              title: "Fix: match-pulse now reacts to substitutions",
              body: "After a halftime sub the stat bar and player-pulse dot row kept showing the outgoing player until the next natural update tick (goal, round end). Now a re-render fires immediately after the sub."
            }
          ]
        },
        {
          version: "0.37.0",
          title: "Balance validation & reload fixes",
          entries: [
            {
              title: "Playtest confirms snowball fix works, but not completely",
              body: "Second test run under 0.36 (spammy play, no tactical optimisation) produced **the first loss** (2:6 against the strongest league team) and **two draws** — compared to 0.35.0 where 11/11 matches were walkovers. League table now has real spread (opponent power 329-583 instead of a flat 330-347). Buff-cap hits dropped from 22% to 11% of card plays. **Still outstanding:** against mid-table return-leg opponents matches still tip into 9-0 / 10-1 — not just an opponent-scaling problem but also a deck-composition one."
            },
            {
              title: "Balance: defense pricier, combos cheaper",
              body: "Telemetry revealed inverted incentives: defense cards averaged 3.1 fatigue/play (cheapest) AND made up 41% of all plays; combos averaged 6.4 fatigue (most expensive) at just 6% of plays. Stability should cost, payoff should be attainable — the numbers said the opposite. Defense core cards (tight_shape, hold_the_line, block, deep_defense, pressure_trap) now cost 4, top combos (masterclass, stone_cold, break_the_line, late_winner, final_whistle, lone_striker) reduced to 5. Recovery cards (breather, medic) stay at 0."
            },
            {
              title: "Balance: combo card added to starter deck",
              body: "The starter deck contained just **one** combo card (hero_moment) out of 13 — combo density 7.7%. Combo payoffs barely landed in the first 9-10 matches, the setup→combo pipeline was effectively invisible. `masterclass` joins — 2/14 = 14% combo density, combos now tangible from match 1."
            },
            {
              title: "Telemetry: goals and opp-card plays now captured",
              body: "The recorder had two gaps — `recordGoal` and `recordOppMove` were defined but the engine never called them. The 0.36.2 export showed 0 goals and 0 opp moves even though 51:15 had actually been scored. Fix: both events are now derived directly from the log stream (log classes `goal-me`/`goal-opp`/`opp-card`/`player-shield`). No engine change, fully backwards-compatible. Future test runs will have complete data."
            },
            {
              title: "Fix: deck loses cards on resume",
              body: "A tab reload between two matches could leave players starting the next game with a partially empty deck — 2 cards or 0 instead of the expected ~20. Root cause: the autosave at hub entry saved only `_cardDeck` (the draw pile), not `_cardDiscard` (the discard pile). After 6 rounds ~16 cards sit in discard and ~4 in deck — next match-start merges them, and with the discard missing only the 4 remained. Fix: the discard pile is now persisted too. Saves taken before this update are affected — starting a new run restores correct state."
            },
            {
              title: "Fix: league table — own row no longer green",
              body: "Your own team's row in the league table shared the same green colour as the promotion zone (top 2). Sitting at rank 3, your row looked like you were in promotion range despite only top 2 going up. Own row now renders in **cyan** instead of green — clearly readable as an identity marker. Zone colours (green/red) stay reserved for promotion/relegation."
            }
          ]
        },
        {
          version: "0.36.0",
          title: "Snowball fix",
          entries: [
            {
              title: "Balance: second-leg now scales with you",
              body: "0.35.0 telemetry showed a cliff at match 7: realistic 1-3 goal games before, 10-12 goal blowouts after. Four targeted fixes against the power creep: **opponents now scale within a season** — the league table has genuine weak-to-strong spread (teams used to be pinned at identical power), and return-leg fixtures bring up to +22% opponent stats proportional to season progress. **Team buffs now have diminishing returns** — anything above +15 per stat counts at half weight, instead of pinning at the hard +25 cap. **Repeated plays of the same card in a match dampen** — second set_piece at 80% effect, third at 60%, floor of 40% from the fourth on. **Stricter condition recovery** — starters end up at 58 after a hard match instead of 70, making rotation a real lever."
            }
          ]
        },
        {
          version: "0.35.0",
          title: "Beta launch",
          entries: [
            {
              title: "Beta phase & test-run recorder",
              body: "The game is officially in **beta**. For balance testing there's an optional **test-run recorder**: enable with `?telemetry=1` in the URL query (or `KL.telemetry.setEnabled(true)` in the console). It captures every match of a run — opponent context, lineup, round phases, every card play with fatigue and multipliers, every tactical decision, opponent moves and whether they were defused, goals, and post-match stats (shots, conditions, trait fires). Export as structured JSON via the footer link once at least one match has been played. Data stays local; nothing is uploaded."
            },
            {
              title: "Continue Run",
              body: "Runs now survive tab closes and browser restarts. A **Continue Run** button appears on the start menu with a summary line (team · tier · season · match · record) whenever a save exists. Starting a new run asks for confirmation first so you can't wipe a save by accident."
            },
            {
              title: "Fatigue feedback on hand cards",
              body: "The cost chip on each card now shows **who** pays the fatigue and **where they land**: `⚡−4 ST 32→28` instead of just `⚡−4 ST`. Colour-coded — neutral, amber below 50, red below 25 — matching the engine's stat-penalty thresholds. Chained card plays cost extra; the tooltip now shows the breakdown (\"Plays cost 6 (base 2 + 4)\") so the inflated number isn't arbitrary."
            },
            {
              title: "Fix: defense-stretched frame was a dud",
              body: "The card-mode frame \"Opponent defense stretched\" advertised a buildup malus on their next round but only set the round counter, not the magnitude. The team buff (+8 OFF / +6 VIS) landed; the advertised buildup malus didn't. Both are now set."
            },
            {
              title: "Fix: timed-effect counters in card-mode",
              body: "Four round counters (buildup malus, striker malus, shot malus, keeper-zone) never decremented in card-mode — and in non-card-mode the decrement fired one round too early. Effects with **2-round duration** often lived for only one round. Fixed; effects now last the advertised number of rounds."
            },
            {
              title: "Saves tied to release",
              body: "Save data is now explicitly bound to the game version. A new release cleanly discards old saves instead of loading them into a world where card ids or balance values may have shifted. Highscore and codex progress are unaffected."
            }
          ]
        }
      ]
    },
    telemetry: {
      emptyNotice: "No test-run data yet. Play at least one match with the recorder enabled.",
      downloadFailed: "Download failed. See the browser console for details."
    },
    manual: {
      title: "KICKLIKE · Manual",
      close: "✕ Close",
      sections: [
        {
          title: "Season & League",
          body: "A season is fourteen matches — every other team home and away. Finish in the top two and you promote, bottom two and the axe drops.\n\nA full run climbs three tiers: Amateur league, then Pro league, then the Cup. Eight teams each league, three knockout rounds for the Cup. Around thirty-one matches if you go all the way.\n\nTwo ways to lose a run before the end:\n\n- **Losing streak.** Three matches in a row without a point and the coach is fired. No warnings, no appeals.\n- **Amateur relegation.** Finish bottom two of the Amateur league and the run ends — there's nowhere below to demote to."
        },
        {
          title: "Match flow",
          body: "Six rounds per match, roughly fifteen simulated minutes each. You pick the opening at kickoff, react at halftime, close the game in the final round — three real decisions. The other eighty-seven minutes run on squad stats, trait fires and whatever cards you've managed to spend.\n\nEach round sits in a phase — build-up, possession, attack, transition, recovery, defensive — and the phase shifts with momentum. The same combo card roars during ATTACK and mumbles during DEFENSIVE. Read the match, time your spends.\n\nAbove the log sits the OPP THREAT banner: what the opponent is loading this round. Every round they draw one move from their own deck — aggressive push, lockdown, disruption, setup, or big-move — and the banner shows what's coming with severity from one to three dots. One dot is quiet background noise. **Two or three dots are telegraphed** — a counter or block card the same round strikes it through, a 'DEFUSED' tag drops in the log. Three-dot big-moves hit hardest: guaranteed goals, triple attacks, three-round offensive surges. Unblocked big-moves break matches. Read the banner and save a Block or Clutch Defense for the right moment."
        },
        {
          title: "Cards & energy",
          body: "Every round you draw four cards and get three energy. Spend them, don't hoard — energy resets at the whistle, unplayed cards hit the discard (unless they carry the *retain* tag). Every card drains a fitting starter's condition when you play it, so the player who matches the card carries the load.\n\nSix card types, each with a job:\n\n- **Setup** primes the attack. Opens lanes, builds flow.\n- **Trigger** fires an effect now — the workhorse stat bump.\n- **Combo** needs the setup to land first, then pays off hard.\n- **Defense** tightens the keeper and backline.\n- **Counter** punishes loaded opponent threats.\n- **Draw** turns one card into more cards.\n\nPhase multipliers sit on top. A combo card sings during ATTACK and mumbles during DEFENSIVE. Most decks reach ATTACK by playing a setup card first — a combo-stacked deck without anchors rarely hits the attack bonus. Plan one setup at minimum.\n\n**Reactive cards** slot into the draft pool as the run develops — Medic heals a fouled starter, Poker Face immunizes the next card against disruption, Clutch Defense guarantees a block on a telegraphed big-move, Counterpunch turns their counter into yours, Break The Line crushes a lockdown, Scout Report reveals their next two moves. Quiet on most rounds, decisive on the wrong ones. Build at least a few into your deck before you hit Pro.\n\n**Mulligan.** Hate your opening hand? On round 1, before you play anything, you can bin the whole hand and redraw. Once per match, free.\n\n**Skip cost.** A round without a single card played isn't free. The team looks uncoordinated — all five stats take a hit that round, and a tempo malus sticks for the rest of the match. First skip is mild; two or three compound badly.\n\n**Diminishing returns.** Playing multiple cards in the same round is rewarded, but past the second one the stat bonuses dampen — 82%, 64%, 46%, floor 35%. Spam is possible but less profitable than measured play. A team buff also hard-caps at ±25 per stat per round, so stacking into the stratosphere is no longer a strategy.\n\n**Chain bonus.** Three distinct card types in one round and the team clicks: *VERSATILE PLAY*, a flat bump across the board. Four or five types is *TOTAL FOOTBALL* — noticeably stronger. Decks that stack one type post clean synergy numbers and lose chain bonuses. Deliberate variety pays."
        },
        {
          title: "Deck-building across the run",
          body: "After almost every match, your deck changes. One pick per match, alternating modes:\n\n- **Add** — three new cards on the table, you keep one.\n- **Remove** — trim a card you've soured on.\n- **Upgrade** — mark a card for a permanent effect boost.\n- **Replace** — swap one out, one in.\n- **Evolution** — at key milestones (match six and thirteen), a role specialization instead.\n\nBoss matches are the exception: win one and you pick **two** cards instead of one. Season ends after the league finale — no pick then, the next season starts fresh."
        },
        {
          title: "Condition & fatigue",
          body: "Every starter carries a fitness gauge that creeps down as the run grinds on. Playing a card drains the starter it fits — the striker takes the hit when you play a finisher, the keeper when you play a save.\n\nBetween matches the squad recovers, but the damage you've done shows through. Push a starter hard across three matches and they'll still be dragging into the fourth. Bench players recover faster and start fresh more often — rotation is a tool, not a rule.\n\nA handful of cards (breather, rotation, doping) actively pump stamina back up mid-run. A critically drained starter triggers *CRITICAL FATIGUE* — a visible frame with team-wide penalties until you do something about it."
        },
        {
          title: "Traits & Evolution",
          body: "Every player can carry up to two passive traits — laser pass, chess predict, ghost run and the like. They fire in the background during matches, shaping attacks and saves without you clicking anything.\n\nWin matches, players earn experience, players level up. Reach level three and a new trait slot opens — pick from a curated shortlist.\n\nAt a few higher levels, the player becomes eligible for an **evolution** instead of a regular level-up. Evolutions reshape stats and unlock a role specialization — regista, inverted winger, sweeper-keeper — with a matching card-affinity bonus. The player keeps everything they had; they gain a signature on top."
        },
        {
          title: "Bosses & legendaries",
          body: "Every league season has two **boss matches** — the mid-season test and the finale. Boss opponents have higher stats across the board, carry more traits on more players, and generally play like they're on speed.\n\nBeat a boss and a **legendary recruit** shows up in the next draft: a high-stat player with a signature trait you won't find anywhere else. You can hold up to two on the bench at a time.\n\nThe Cup is all boss, all the time. Three knockout rounds, the final being a super-boss — more traits, higher stats, zero mercy."
        },
        {
          title: "Living opponent",
          body: "Opponents aren't stat-blocks. Every team plays one of five **archetypes**:\n\n- **Catenaccio** — defensive, patient, deadly on the counter. Parks the bus, punishes turnovers.\n- **Gegenpressing** — high press, grinding. Drains your condition, disrupts your cards.\n- **Tiki-Taka** — possession, late hammer. Patient in build, brutal after halftime.\n- **Direct Play** — aggressive, high-risk. Shoots on sight, goes for the jugular.\n- **Chaos** — unpredictable. Every category in play, no cooldowns respected.\n\nEach archetype carries its own **move deck**. Every round the opponent draws one move from that deck, and the OPP THREAT banner announces it. Moves fall in five categories:\n\n- **Aggressive** — extra shots, flank overloads, counter-blitzes.\n- **Lockdown** — park the bus, bunker, low block, mental wall.\n- **Disruption** — tactical fouls, fake press, time-wasting, dirty tackles that drain your starters.\n- **Setup** — studying your tape, captain's speech, quiet stat-building.\n- **Big-move** — signature plays, desperation pushes, tiki-taka pressure. Severity-3, always telegraphed, devastating if unblocked. Every archetype only has one or two available.\n\n**Opponent intelligence scales with the run.**\n\n- **Amateur (M1-7)** — small move pool, no big-moves, half-random draws. Plans are readable but not transparent.\n- **Pro (M8-14)** — full pool, weighted by context. They see the scoreboard, remember your last three card types, time pressure against your combo spam.\n- **Cup (M15+)** — adversarial. Every big-move unlocked. Boss teams chain two moves per round, keep signature plays in their back pocket across matches.\n\nOpponents still **study you across the season**. Lean on one card type match after match and future opponents show up with a counter-stat bump and an *ADAPTED* tag on their scorecard. No free lunch for mono-deck players.\n\n**Read the banner.** One dot is quiet. Two dots means plan a response. Three dots means you need a Block, Preempt, Clutch Defense or matching counter *this round*, or the move lands unopposed — a free goal, a triple attack, three rounds of raised offense. Time your counters."
        },
        {
          title: "Cup, champions & codex",
          body: "The Cup sits at the top of the mountain — three knockout matches, all bosses, after the Pro season. Draw at full time and you go to extra time, then to penalties. One shot, no replays.\n\nWin the Cup and you're **Run Champion**. That's the top achievement a single run can earn.\n\nThe **Codex** on the start screen tracks your career across every run: achievements you've unlocked, cards you've discovered, legendaries you've ever recruited. Run-to-run continuity — the one thing that survives the coach-firing."
        }
      ]
    },
    draft: {
      title: "Choose your starter team",
      body: "Each team has a theme, a strength, and a weakness. You shape its identity later through evolutions.",
      starterCards: "Archetype cards:"
    },
    hub: {
      yourTeam: "Your Team",
      opponent: "Opponent",
      squad: "Squad",
      bench: "Bench",
      deck: "DECK",
      lineup: "⚙ Lineup",
      startMatch: "▶ Start Match",
      quickSim: "⏩ Quick Sim",
      vs: "VS",
      nextUp: "Next Up",
      bossTag: "BOSS",
      powerGap: "Power {me} vs {opp}",
      suspendedAlert: "{name} is suspended this match",
      suspendedAlertTooltip: "{name}: red card in the previous match. Suspended for {n} more matches. Substitute from the bench before starting.",
      cardAlert: "{name} on a yellow — one more and they're out",
      benchEmpty: "No bench yet",
      tapForDetails: "tap a player for details",
      chipTraits: "{n}× triggered",
      chipGoals:  "{n} goals",
      chipEvos:   "{done}/{max} evos",
      chipStreak: "{n}W streak",
      tilePower:  "Power",
      tileTraits: "Traits fired",
      tileEvos:   "Evolutions",
      // v52.2 — Stats accordion labels
      stats:           "Stats",
      statsWins:       "Wins",
      statsDraws:      "Draws",
      statsLosses:     "Losses",
      statsGoalDiff:   "Goal diff",
      statsGoals:      "Goals",
      statsTraits:     "Traits",
      statsEvos:       "Evos",
      statsStreakNow:  "Streak",
      statsStreakBest: "Best",
      conditionTooltip: "Match play drains condition. Between matches: ≥60 → 90, 40-59 → 80, 20-39 → 70, below 20 → 55. Bench players recover fully (+30 up to 100). Rotating overplayed starters helps, but isn't required.",
      adaptationTag: "ADAPTED",
      adaptationTooltip: "They've studied your deck — {type}-heavy ({share} of plays). +{bump} {stat} on this squad to counter it."
    },
    detail: {
      traits: "Traits",
      traitCategory: {
        passive:     "Passive",
        event:       "Event",
        conditional: "Conditional",
        once:        "One-shot"
      },
      traitCategoryHint: {
        passive:     "Permanent or per-round chance",
        event:       "Fires on a specific match event",
        conditional: "Only under certain conditions",
        once:        "Once per match or half"
      },
      noTraits: "No traits yet — traits unlock at evolutions.",
      stats: "Stats",
      runStats: "This Run",
      runGoals: "Goals",
      runAssists: "Assists",
      runMinutes: "Minutes",
      close: "✕ Close",
      level: "Level {lv}",
      suspended: "Suspended next match",
      yellow: "On a yellow card",
      xpProgress: "{xp} / {next} XP"
    },
    achievements: {
      hatTrickRunner: { title: "Hat-Trick Runner", desc: "{name} bagged 3 in one match" },
      runScorer10:    { title: "Double Digits",    desc: "{name} hit 10 goals this run" },
      runScorer20:    { title: "Serial Killer",    desc: "{name} hit 20 goals this run" },
      triggers50:     { title: "Synergy Engine",   desc: "50 trait triggers this run" },
      triggers150:    { title: "Unstoppable Chain",desc: "150 trait triggers this run" },
      win3:           { title: "Hot Streak",       desc: "3 wins in a row" },
      win5:           { title: "Dynasty",          desc: "5 wins in a row" },
      bossDown:       { title: "Giant Slayer",     desc: "Beat a boss" },
      cleanSheet:     { title: "Clean Sheet",      desc: "Shut them out at home" },
      comeback:       { title: "Comeback Kings",   desc: "Won after trailing at halftime" },
      cupChampion:    { title: "Cup Champion",     desc: "Won the cup final" },
      cupRunnerUp:    { title: "Cup Runner-Up",    desc: "Reached the cup final" },
      cupShutout:     { title: "Cup Wall",         desc: "Beat a cup boss without conceding" },
      cupUpset:       { title: "Cup Upset",        desc: "Beat a cup boss with weaker team power" },
      firstPromotion: { title: "Moving Up",        desc: "First promotion out of Amateur" },
      proSurvivor:    { title: "Pro Survivor",     desc: "Finished a Pro season without relegation" },
      seasonChampion: { title: "League Winner",    desc: "Won the Pro league outright" },
      dominantSeason: { title: "Dominance",        desc: "12+ wins in one season" },
      grudgeSlayer:   { title: "Grudge Slayer",    desc: "Beat a team with grudge ≥ 3" },
      bloodRivalWin:  { title: "Blood Rival",      desc: "Won a blood-feud match" },
      nemesis:        { title: "Nemesis",          desc: "Beat the same team 3× in a row" },
      perfectDeck:    { title: "Complete Drafter", desc: "Used every draft this season" },
      shieldMaster:   { title: "Shield Master",    desc: "Blocked 5 opp cards this run" },
      comebackCup:    { title: "Cup Comeback",     desc: "Won a cup match after trailing at R3" }
    },
    verdict: {
      close:       "Close one",
      favored:     "Favored",
      strongEdge:  "Big edge",
      tough:       "Tough fight",
      bossFight:   "Boss fight",
      trustTraits: "Trust your traits",
      rideForm:    "Form is rolling",
      riskyStreak: "Don't lose a third",
      newRival:    "New challenger"
    },
    prob: {
      win:  "Win",
      draw: "Draw",
      loss: "Loss",
      currentWin: "Current win chance",
      boosts:     "Boosts"
    },
    scorecard: {
      threat: "THREAT",
      edge:   "EDGE",
      off:    "OFF",
      def:    "DEF",
      tmp:    "TMP",
      vis:    "VIS",
      cmp:    "CMP",
      traitActivity: "~{n} trait triggers expected · {p} passives active",
      edgeTooltip:   "Your advantages: traits that counter this opponent plus any stat surplus. Independent of Threat — you can have both high.",
      threatTooltip: "Their danger to you: opponent traits that hurt your squad plus any raw power gap. Independent of Edge — you can have both high."
    },
    momentum: {
      barTooltip:
        "Match flow — who is controlling the game right now.\n\n" +
        "Right (green) = your side, left (red) = opponent. Center = even.\n\n" +
        "Blends three signals:\n" +
        "· Possession (60%) — rolling average across rounds played\n" +
        "· Score diff (10%) — each goal shifts ±10 points (capped)\n" +
        "· Engine momentum (30%) — swings on goals, saves, zone changes\n\n" +
        "Updates every round. Goes well with the EDGE / THREAT chips below."
    },
    intel: {
      probableFrames: "PROBABLE SITUATIONS",
      counters:       "counter(s)",
      noCounters:     "no counter",
      payoffs:        "payoff(s)",
      noPayoffs:      "no payoff"
    },
    lineup: {
      title: "LINEUP",
      tapToSwap: "Tap players to swap",
      defaultHint: "Click one starter, then one bench player to swap them. A goalkeeper (GK) is mandatory.",
      starters: "Starters",
      bench: "Bench",
      done: "✓ Done"
    },
    recruit: {
      title: "LEGENDARY PICK",
      subtitle: "> boss defeated — a new hero chooses your club_",
      body: "Pick one player. They go to your bench — maximum 2 bench slots.",
      decline: "Decline"
    },
    match: {
      pause: "⏸ Pause",
      resume: "▶ Resume",
      speed: "⏩ Speed",
      fast: "⏩ Fast",
      pulseBuildup: "build-up",
      pulseDefense: "stops",
      pulseSaves:   "saves",
      noModifiers:  "No active modifiers",
      // v0.54 — Pulse-tile tooltip breakdown labels. Previously hardcoded
      // German strings ("Kondition", "Karten/Taktik", "alle Stats")
      // bled into the tooltip even when the player had EN/ES set.
      pulseTipCondition:    "Condition {value} → −{pen} all stats",
      pulseTipForm:         "Form {form} → {sign}{delta} {stat}",
      pulseTipTeamForm:     "Team form → {sign}{value} all stats",
      pulseTipCardsTactic:  "Cards/Tactic → {parts}"
    },
    matchHud: {
      phase: {
        firstHalf:   "1st half",
        secondHalf:  "2nd half",
        buildup:     "Build-up",
        possession:  "Possession",
        transition:  "Transition",
        attack:      "Attack",
        recovery:    "Recovery",
        defensive:   "Defensive"
      },
      event: {
        meGoal:  "Goal",
        oppGoal: "Goal against",
        oppCard: "Opponent card",
        shield:  "Shield caught",
        counter: "Counter played"
      },
      interrupt: {
        kickoff:  "Kickoff tactic",
        halftime: "Halftime decision",
        final:    "Final tactic"
      },
      badge: {
        kickoff:  "KO",
        halftime: "HT",
        final:    "FIN",
        oppCard:  "C",
        shield:   "S",
        counter:  "↯"
      }
    },
    phase: {
      shiftOwnGoal: [
        "Back to build-up — restart from the keeper.",
        "Goal scored — reset, don't chase it.",
        "Whistle, kick-off — the match restarts."
      ],
      shiftConceded: [
        "Defensive mode — pull back, absorb the blow.",
        "They got one — drop the line, stay compact.",
        "Regroup at the back — patience."
      ],
      shiftSave: [
        "Transition! Quick ball forward — counter lane opens.",
        "Save turns defense into attack — fly forward.",
        "Keeper catches, throws it out — we break!"
      ],
      shiftMiss: [
        "Chance gone — possession swings back, regroup.",
        "Missed it — they'll come again, reset shape.",
        "Wide of the post — opp collect the goal kick."
      ],
      shiftLaneOpen: [
        "Attack phase — lane is open, press forward.",
        "Overlap — the wing is ours, go.",
        "Space down the channel — exploit it."
      ],
      shiftPossession: [
        "Possession phase — the team is orchestrating.",
        "Keep the ball — tire them out.",
        "Slow it down — dictate tempo."
      ],
      shiftDefensive: [
        "Defensive reset — back into shape after two rough rounds.",
        "Regrouped — the bleeding stopped, now build.",
        "Stabilized — the shape holds again."
      ]
    },
    matchEvents: {
      cornerKick: [
        "Corner kick — the ball whips in. Setup now and cash it.",
        "Flag's up — corner for us. A good delivery lives on one play.",
        "Ref signals the corner. Box is crowded — who rises?"
      ],
      counterPressChance: [
        "Turnover moment — press them before they reset.",
        "They're flat-footed from the save — hunt the ball.",
        "Quick feet, high line — this is when they break."
      ],
      oneOnOne: [
        "Clear sight of the keeper — cold blood or bottle?",
        "Striker through on goal — the moment slows down.",
        "Face to face with the keeper — just one of them lives."
      ],
      injuryScare: [
        "A player is limping — rotate or push through?",
        "Someone's grabbing a hamstring — breather needed.",
        "The bench is watching — condition critical."
      ],
      yellowCardThreat: [
        "Last warning — one more tackle and it's yellow.",
        "The ref's patience is thin — measured challenge or let them run?",
        "Book is out — choose your tackles carefully."
      ]
    },
    result: {
      win: "WIN",
      loss: "LOSS",
      draw: "DRAW",
      continue: "▶ Continue",
      // v0.56 — Match Verdict — single-line diagnoses on the result hero.
      // Walked top-down by UI.computeMatchVerdict; first matching signal wins.
      verdict: {
        underdogStood:    "Held a clearly stronger side — points off the favourites.",
        squadGassed:      "Squad ran out of legs — {players} dropped below 35 condition.",
        buildupStruggled: "Buildup play stalled — only {pct}% of attempts found the runner.",
        chancesMissed:    "{shots} shots, one goal — chances came, finishing didn't.",
        oppRuthless:      "Their {shots} chances found {goals} goals — clinical.",
        dominantWin:      "Routine win — the gap showed.",
        gritWin:          "Hard-fought win.",
        shareSpoils:      "Honours even.",
        toughLoss:        "Tough one — back to the drawing board."
      },
      analysis: "Match Breakdown",
      players: "Player Breakdown",
      matchLogTitle: "Match Log",
      matchFlowTitle: "Match Flow",
      matchFlowHint: "Team stat trajectory during the match (buffs, form, traits).",
      cardSummaryTitle: "Card Play",
      highlightsTitle: "Highlights & Next",
      detailsToggle: "Full Breakdown",
      stopsLabel: "stops",
      sacrificeNote: "{name} gave everything — permanent stat loss.",
      cardsTitle: "Card Play",
      cardsPlayed: "CARDS PLAYED",
      cardsSkipped: "No cards played",
      flowPeak: "FLOW PEAK",
      deckAfter: "DECK SIZE",
      mostPlayed: "Most played",
      framesFired: "Situations",
      condBilanz: "Condition",
      hlGoal:         "{name} on the scoresheet",
      hlBraceOrHat:   "{name} with a brace",
      hlHatTrick:     "{name} hat-trick — {n} goals",
      hlKeeperBig:    "{name} wall — {n} saves",
      hlKeeperSolid:  "{name} held steady — {n} saves",
      hlBreakout:     "{name} breakout — +{xp} XP",
      hlFlop:         "{name} off the pace — needs a reset",
      hlOverperform:  "Over expectation (pre-match: {pre}% win)",
      hlUnderperform: "Below expectation (pre-match: {pre}% win)",
      decisionsTitle: "Your decisions",
      decisionsSum:   "Total",
      decisionNoXp:   "no bonus XP",
      microBoostsTitle: "Stat boosts earned",
      microBoostsHint:  "Decision-driven successes permanently raised these attributes.",
      decisionPhase: {
        kickoff:  "Start",
        halftime: "Halftime",
        final:    "Final"
      },
      traitReportTitle: "Where your edge came from",
      traitReportEmpty: "No abilities fired this match.",
      traitReportFires: "{count} triggers",
      traitReportPassive: "ACTIVE",
      traitReportImpact: "impact ~{value}",
      traitReportFooter: "Trigger count × per-ability weight. Higher = more impact on this match.",
      // v52.2 — achievement pop strip on the result page
      achievementsBanner: '🏆 NEW UNLOCKS',
      achievementsBannerOne: '🏆 Achievement unlocked',
    },
    nextUp: {
      title: "NEXT UP",
      legendaryRecruit: "Legendary recruit offer",
      cardDraftAdd: "Pick a new card for your deck",
      cardDraftRemove: "Remove a card from your deck",
      cardDraftReplace: "Replace a card — swap one for a new one",
      cardDraftDoubleAdd: "Boss reward — pick TWO cards",
      cardDraftUpgrade: "Upgrade a card — +25% effect",
      roleEvolution: "Role evolution — specialize a starter",
      nextMatch: "Next match"
    },
    league: {
      title: "LEAGUE TABLE",
      team: "Team",
      teams: "teams",
      season: "Season {n}",
      seasonComplete: "Season Complete",
      position: "Position {pos} of {total}",
      nextOpponent: "Next: {name}",
      rivalry: "Rivalry match — met them before"
    },
    codex: {
      title: "CODEX",
      back: "← Back",
      tabs: {
        achievements: "ACHIEVEMENTS",
        cards:        "CARD-DEX",
        legendaries:  "LEGENDARIES"
      },
      progressAchievements: "{got} / {total} unlocked",
      progressCards:        "{got} / {total} discovered",
      progressLegendaries:  "{count} recruited",
      locked:       "??? — not yet unlocked",
      cardLocked:   "Not yet seen — draft or play this card to discover it.",
      emptyLegendaries: "No legendaries yet. Beat a boss and recruit one to start the collection.",
      rarity: {
        common:   "COMMON",
        uncommon: "UNCOMMON",
        rare:     "RARE"
      }
    },
    rivalry: {
      banner: "RIVALRY",
      narration: {
        revenge: [
          "{opp} took us apart last time ({lastOpp}-{lastMe}). Tonight we answer.",
          "{lastOpp}-{lastMe} the last one. {opp} owe us nothing — but we owe ourselves.",
          "They beat us before. This pitch remembers."
        ],
        dominant: [
          "Last time: {lastMe}-{lastOpp}. {opp} come in wanting this badly.",
          "We broke them {lastMe}-{lastOpp} on first meeting. Expect them angry.",
          "{opp} haven't forgotten the last result. Sharper tonight."
        ],
        grudge: [
          "{meetings} meetings, still no quarter. Grudge match.",
          "{opp} — we just don't like each other. Every ball a fight.",
          "Rivalry written in the margin of every recent encounter."
        ],
        blood: [
          "Bad blood. {humiliations} blowouts in {meetings} meetings — this is not friendly.",
          "{opp} won't forget. Neither will we. Pure grudge.",
          "Blood on the pitch each time. Tonight no different."
        ],
        neutral: [
          "Second meeting with {opp}. Reverse leg.",
          "Rematch. Same pitch-geometry, different shape."
        ]
      }
    },
    cup: {
      title: "CUP",
      quarter: "QUARTER",
      semi: "SEMI",
      final: "FINAL",
      eliminated: "OUT",
      champion: "CUP CHAMPION"
    },
    gameover: { title: "GAME OVER" },
    victory: {
      survived: "{n} matches survived",
      promotion: "Promoted · season complete",
      relegation: "Relegated · season ends",
      champion: "League champion · season complete",
      cupChampion: "Cup won — run complete",
      cupRunnerUp: "Eliminated in the cup — run ends",
      stats: "RUN STATS",
      squad: "SQUAD"
    },
    transition: {
      welcomeTo: "WELCOME TO",
      dropTo: "DROPPED TO",
      cupTitle: "THE CUP!",
      cupSub: "3 BOSSES BETWEEN YOU AND THE TROPHY",
      cupNarration: "You've conquered the Pro League. Now: knockout. Three bosses, escalating difficulty. Lose one round, your run is over.",
      promoSub: "NEW SEASON · TOUGHER OPPONENTS",
      promoNarration: "You're a tier higher. The opponents are stronger, the bosses harder. Your roster carries — adapt your tactics.",
      dropSub: "RESET · LEAGUE BELOW",
      dropNarration: "Last season went badly. You restart in a lower tier. Take the chance.",
      staySub: "SAME LEAGUE · NEW SEASON",
      stayNarration: "You stay in the league. Different opponents, same challenge — this time perhaps higher?",
      companionPromo: "PROMOTED WITH YOU:",
      companionDrop: "RELEGATED WITH YOU:",
      continue: "CONTINUE"
    },
    oppCards: {
      tacticalFoul: [
        "{opp} cynically chop us down on the counter — set-piece reset, our momentum gone.",
        "Two yellow cards in a minute — {opp} happily trade fouls for breaking our rhythm.",
        "{opp}'s defenders go straight through ankles. Cynical, effective, ugly."
      ],
      parkTheBus: [
        "{opp} drop both wingers into the back line — eleven behind the ball.",
        "Ten-man defensive shell from {opp}. We're hitting a wall.",
        "{opp} have given up on attacking — pure damage control mode."
      ],
      equaliserPush: [
        "{opp}'s keeper sprints forward for a corner — kitchen-sink time.",
        "{opp} throw three strikers on. They smell blood and don't care about the back.",
        "{opp} go full chaos — wingers as strikers, fullbacks as wingers, all-out push."
      ],
      timeWasting: [
        "{opp}'s keeper takes 90 seconds for every goal kick. Time bleeding away.",
        "{opp} milk every throw-in, every set-piece. The clock is their friend now.",
        "Dives, fake injuries, slow restarts — {opp} are running down the clock."
      ],
      pressOverload: [
        "{opp} swarm us in our own half — three men on the ball every time.",
        "Suffocating press from {opp} — our defenders can't even pick a head up.",
        "{opp} go full counter-press from the kickoff. No second to think."
      ],
      setPiece: [
        "{opp} earn a dangerous free-kick on the edge of the box. Wall up.",
        "Corner to {opp}, big bodies storming forward — we have to clear the first ball.",
        "{opp}'s set-piece routine looks rehearsed. This is going to be tight."
      ],
      chainCounter: [
        "{opp} read the turnover, three quick passes and they're at our box.",
        "Lightning counter from {opp} — our shape was completely broken.",
        "{opp} chain six passes after the steal — clinical and fast."
      ],
      desperateRally: [
        "{opp} throw everything forward — the keeper's past the halfway line.",
        "Full chaos from {opp} — they've got nothing to lose and they play like it.",
        "{opp} pile bodies into our box on every attack — structure is gone."
      ]
    },
    oppCardNames: {
      tacticalFoul:   "Tactical Foul",
      parkTheBus:     "Park the Bus",
      equaliserPush:  "Equaliser Push",
      timeWasting:    "Time Wasting",
      pressOverload:  "Press Overload",
      setPiece:       "Set-Piece Threat",
      chainCounter:   "Chain Counter",
      desperateRally: "Desperate Rally"
    },
    labels: {
      power: "Power",
      standard: "Standard",
      hotStreak: "HOT STREAK",
      goodForm: "Good Form",
      crisis: "SLUMP",
      badForm: "Bad Form",
      losingWarning: "⚠ 2 straight losses — one more and the coach is fired!",
      noBench: "No bench players yet — beat a boss to earn one!",
      swapSelected: "→ {name} selected. Click another player to swap.",
      swapRejected: "Swap rejected: the lineup would need exactly 1 goalkeeper.",
      benchSlots: "{count} / {max} slots",
      highscore: "✦ BEST: {runScore} PTS · {wins}W-{draws}D-{losses}L · {outcome} ✦",
      outcomeChampion: "Champion",
      outcomeSurvivor: "Safe",
      outcomeFired: "Fired",
      outcomeCupChampion: "🏆 Cup Champion",
      outcomeCupRunnerUp: "Cup Runner-up",
      outcomePromotion: "Promoted",
      outcomeRelegation: "Relegated",
      outcomeSafe: "Safe",
      seasons: "seasons",
      seasonLabel: "S{n}",
      cupModeLabel: "CUP",
      tier: {
        amateur: "AMATEUR",
        pro: "PRO"
      },
      compactTeamMeta: "{lineup} + {bench}B",
      matchLabel: "Match {num}: {me}:{opp} vs {name}",
      bossTell: "Boss fight — all stats boosted, no mistakes allowed",
      academy: "ACADEMY"
    },
    statsPanel: {
      title: "Stats",
      possession: "Possession",
      shots: "Shots",
      onTarget: "On Target",
      accuracy: "Accuracy",
      buildup: "Build-up %",
      saves: "Saves",
      goals: "Goals",
      abilitiesTriggered: "Abilities Triggered",
      currentTeamStats: "Current Team Stats",
      phaseRelevantStats: "Phase-Relevant Stats",
      whatMattersNow: "What Matters Now",
      own: "You",
      diff: "Diff",
      opponent: "Opponent",
      buffsFootnote: "Buffs stack across kickoff, halftime, and final phase",
      liveFootnote: "Live values include form, streaks, focus and active round effects."
    },

    phaseGuide: {
      kickoffBuildUp: "Build-up runs through PM vision/composure: {vision} VIS / {composure} COM.",
      kickoffControl: "Control edge right now: {delta}.",
      kickoffWide: "Wide threat is LF tempo: {lfTempo} vs {oppTempo}. Back-line hold: {hold} vs {oppOffense} opp OFF.",
      halftimeBuildUp: "Fix build-up first if it is low: {myRate}% for you vs {oppRate}% for them.",
      halftimeAccuracy: "If build-up is fine but finishing lags, solve accuracy next: {myAcc}% for you vs {oppAcc}% for them.",
      halftimeDefense: "Defense now lives in TW/VT hold: {hold} hold value and {saves} saves so far.",
      finalChaseStatus: "You need a goal now. Build-up is {buildup}%, accuracy is {accuracy}%.",
      finalChaseAdvice: "If build-up is the blocker, favor control/vision. If shots are the blocker, favor offense/direct play.",
      finalProtectStatus: "You are protecting a lead. Their build-up is {oppRate}% and your hold line is {hold}.",
      finalProtectAdvice: "Defense and composure are worth more than raw offense right now.",
      finalLevelStatus: "Level game. Pick whether the blocker is entry, finish, or protection: build-up {buildup}%, accuracy {accuracy}%, saves {saves}.",
      finalLevelAdvice: "Midfield/control choices create one clean possession; direct/offense choices chase variance."
    },

    intel: {
      title: "Matchup Intel",
      effectivePowerTitle: "Effective Power",
      basePowerLabel: "Base",
      traitPowerLabel: "Traits",
      effectiveLabel: "Effective",
      powerBreakdown: "{base} +{traits} = {effective}",
      deltaAhead: "+{delta} edge",
      deltaBehind: "{delta} gap",
      deltaEven: "Even match",
      advantagesTitle: "Your edge",
      warningsTitle: "Their threats",
      noAdvantages: "No standout trait advantages — stat-driven match.",
      noWarnings: "No specific opponent threats.",

      verdictDominant: "Should roll them",
      verdictAhead:    "Favored",
      verdictEven:     "Coin flip",
      verdictBehind:   "Tough one",
      verdictUnderdog: "Uphill battle",

      headlineBoth:    "{adv} — but {warn}",
      headlineNothing: "Stat-driven match — no big trait matchups.",

      advPredatorVsPresser: "{name}'s predator instinct punishes their pressing errors.",
      advLateBloom: "{name} comes alive in rounds 4–6.",
      advClutchMatchup: "Your clutch traits match theirs in the closing minutes.",
      advBigGame: "{name} lives for boss fights — +15 focus stat.",
      advFieldGeneral: "Field General lifts the whole squad +4 across the board.",
      advKeeperWall: "Your keeper trait blunts their aerial threat.",
      advTempo: "{name} out-paces their entire backline.",

      warnSniper: "{name} (sniper) — every shot's a threat.",
      warnCounter: "{name} punishes every turnover on the counter.",
      warnIronwall: "{name} locks the early rounds down — 1–2 look impenetrable.",
      warnClutchUnanswered: "{name} surges late — you have no clutch answer.",
      warnPresserNoVision: "{name} presses high and no PM vision to escape it.",
      warnStatGap: "{diff} stat-power behind — need traits to carry it.",
      warnBoss: "Boss opponent — every stat elevated."
    },
    evolution: {
      title: "EVOLUTION!",
      reachedLevel: "{name} ({role}) reached level {level}",
      traitLabel: "Ability: {name}",
      keepsTrait: "keeps: {name} (+30%)"
    },
    evolutions: {
      // Role-specialization draft (matches 6 + 11)
      title: "ROLE EVOLUTION",
      subtitle: "{name} ({role}) has put in the miles. Choose a specialization.",
      actionChoose: "↑ EVOLVE",
      skip: "Skip — keep them generalist",
      poacher: {
        name: "POACHER",
        desc: "Lives in the box. All instinct, all finishing. Forget the link-up."
      },
      false9: {
        name: "FALSE 9",
        desc: "Drops deep, threads the play. A striker who hates scoring alone."
      },
      invertedWinger: {
        name: "INVERTED WINGER",
        desc: "Cuts inside onto the stronger foot. Always a shot, rarely a cross."
      },
      traditionalWinger: {
        name: "TRADITIONAL WINGER",
        desc: "Stays wide, scorches the line, whips it in. Old school, still deadly."
      },
      regista: {
        name: "REGISTA",
        desc: "Deep-lying conductor. Reads two passes ahead, plays one."
      },
      boxToBox: {
        name: "BOX-TO-BOX",
        desc: "From one 18-yard line to the other. Engine of the midfield."
      },
      ballPlayingDefender: {
        name: "BALL-PLAYING DEFENDER",
        desc: "Builds out from the back. Step up, break lines, trust the shape."
      },
      stopper: {
        name: "STOPPER",
        desc: "No-nonsense. Steps into the striker, wins the first ball, no exceptions."
      },
      sweeperKeeper: {
        name: "SWEEPER-KEEPER",
        desc: "High line, claims everything above the area. Plays like a libero."
      },
      shotStopper: {
        name: "SHOT-STOPPER",
        desc: "Lives on the line. If it's on target, he's there first."
      }
    },
    flow: {
      lineupIncomplete: "Lineup incomplete! Please choose 5 players.",
      benchFull: "Bench is full!",
      lineupInvalid: "Invalid lineup! You need exactly 1 goalkeeper and 5 total players.",
      lineupSuspended: "{name} is suspended for this match — please pick a replacement.",
      academyCalledUp: "Bench empty — academy replacements called up: {list}. Their stats are significantly reduced.",
      kickoffTitle: "Kickoff Tactic",
      kickoffSubtitle: "How do we start?",
      halftimeTitle: "Halftime Adjustment",
      scoreSubtitle: "Score: {me}:{opp}",
      finalTitle: "Final Decision",
      roundScoreSubtitle: "Round 6 — Score: {me}:{opp}",
      reward: "Ø {avg} XP/player — performance based",
      gameOverStreak: "3 straight losses — coach fired!",
      gameOverLosses: "{losses} total losses — season abandoned.",
      safe: "SAFE",
      rescued: "JUST SURVIVED",
      promotion: "PROMOTED!",
      relegation: "RELEGATED",
      seasonComplete: "SEASON COMPLETE",
      continueTo: "CONTINUE TO",
      dropTo: "DROP TO",
      defendTitle: "DEFEND TITLE",
      nextSeason: "NEXT SEASON",
      enterCup: "ENTER CUP",
      cupChampion: "CUP CHAMPION!",
      cupRunnerUp: "CUP RUNNER-UP",
      points: "{points} POINTS",
      record: "✦ NEW RECORD ✦",
      bestScore: "Best score: {points} pts ({team})",
      afterMatches: "{points} points after {matches} matches",
      bestRun: "✦ New best run ✦",
      eventTitle: "SITUATION",
      eventSubtitle: "Something's happening on the pitch."
    },
    perf: {
      buildups: "{ok}/{all} build-ups",
      defenses: "{count} stops",
      keeper: "{saves} saves  {conceded} conceded"
    },
    ht: {
      title: "HALF TIME",
      detailsToggle: "Match Details",
      pressBlocked: "Pressing blocked {n} attacks",
      countersFired: "Counter system fired {n}×",
      momentumActive: "Momentum: +{bonus}% build-up bonus next round",
      activeIntoSecondHalf: "Active into 2nd half →",
      mechanicCounter: "Counter trap live",
      mechanicPressing: "Pressing active",
      mechanicPossession: "Possession lock",
      mechanicAggressive: "Attack surge",
      mechanicFlank: "Wing runs",
      mechanicRally: "Rally mode"
    },

    decisions: {
      // Focus-Keys entfernt — Focus-System deprecated.
      subTitle: "Substitution",
      subSubtitle: "Bring someone off the bench.",
      noSub: "No Substitution",
      noSubDesc: "Keep the current lineup.",
      subOption: "Bring on {name} ({role}) — off: {out}",
      subRoleMismatch: "Role mismatch — {role} playing out of position. -8 Defense this round.",
      subLegendary: "Legendary incoming — impact amplified.",
      subDone: "{incoming} on for {outgoing}."
    },

    optionBadges: {
      fitsSquad: "FITS SQUAD",
      risky:    "RISKY",
      synergy:  "SYNERGY ×{mult}",
      conflict: "CONFLICT ×{mult}",
      synergyShort:  "SYNERGY",
      conflictShort: "CONFLICT",
      fitsSquadTooltip: "This tactic suits your squad — full effect applied.",
      riskyTooltip:     "This tactic doesn't suit your squad — reduced effect.",
      synergyTooltip:   "Synergizes with your previous decisions this match — amplified.",
      conflictTooltip:  "Conflicts with your previous decisions — reduced effect."
    },
    optionHints: {
      scalesDeficit: "↑ grows with your deficit",
      scalesLead:    "↑ grows with your lead"
    },

    optionNotes: {
      kickoffAggressive: "early shot volume",
      kickoffDefensive: "safer first three rounds",
      kickoffBalanced: "first build-up guaranteed",
      kickoffTempo: "pace over control",
      kickoffPressing: "caps their attack count if it sticks",
      kickoffPossession: "best for clean build-up",
      kickoffCounter: "failed opp attacks fire counters",
      kickoffFlank: "leans hard into LF tempo",
      halftimePush: "best when you reach the box but lack finish",
      halftimeStabilize: "best when they are getting clean chances",
      halftimeShift: "boosts {name}'s {stat}",
      halftimeRally: "scales with the scoreline",
      halftimeReset: "safe patch for multiple weak spots",
      halftimeCounter: "best if they overcommit",
      halftimeHighPress: "best if their build-up is too clean",
      halftimeVisionPlay: "best if build-up is the real problem",
      finalAllIn: "pure goal chase",
      finalParkBus: "protect the lead",
      finalHeroBall: "{name} gets +30 {stat}",
      finalKeepCool: "best when nerves or build-up fail",
      finalPress: "last-round press with counter upside",
      finalLongBall: "skip some build-up for direct pressure",
      finalMidfield: "best for one clean possession",
      finalSneaky: "protect and counter",
      finalSacrifice: "lose 15 focus on one player for team offense now",
      fitFullValue: "squad fit: full value",
      misfitReduced: "misfit: value reduced, downside rises",
      synergyMult: "synergy x{mult}",
      conflictMult: "conflict x{mult}"
    },

    events: {
      playmaker_pulse: {
        title: "Playmaker Pulse",
        subtitle: "{name} is dictating the rhythm. This is the moment to lean into it.",
        option_release_runner: {
          name: "Release the runner",
          desc: "Immediate wide attack with extra vision. Force the next move through the channel."
        },
        option_dictate_tempo: {
          name: "Dictate the tempo",
          desc: "Vision and composure rise for the rest of the match. Lock the game to your rhythm."
        },
        option_thread_risk: {
          name: "Thread the risk",
          desc: "Next build-up gets a major boost, and the playmaker keeps forcing sharper passes."
        }
      },
      opp_keeper_rattled: {
        title: "Keeper Shaken",
        subtitle: "{name} is wobbling. The next decision can turn pressure into a collapse.",
        option_shoot_early: {
          name: "Shoot on sight",
          desc: "Their keeper save rate drops for 2 rounds. Less patience, more volume."
        },
        option_crash_box: {
          name: "Crash the box",
          desc: "Offense and tempo rise immediately. Swarm the second balls and rebounds."
        },
        option_reset_probe: {
          name: "Reset and probe",
          desc: "Boost the next build-up and sharpen the final pass before the shot."
        }
      },
      backline_step_up: {
        title: "Backline Step-Up",
        subtitle: "{name} keeps reading the game. The back line can now set the tone.",
        option_step_in: {
          name: "Step into midfield",
          desc: "Next build-up gets stronger and the whole shape pushes five yards higher."
        },
        option_hold_shape: {
          name: "Hold the shape",
          desc: "Safer block for 2 rounds. Opponent shot quality drops and composure rises."
        },
        option_spring_trap: {
          name: "Spring the trap",
          desc: "Counter stance armed and their next build-ups get shakier."
        }
      },
      playmaker_pulse: {
        title: "Playmaker Pulse",
        subtitle: "{name} is dictating the rhythm. This is the moment to lean into it.",
        option_release_runner: {
          name: "Release the runner",
          desc: "Immediate wide attack with extra vision. Force the next move through the channel."
        },
        option_dictate_tempo: {
          name: "Dictate the tempo",
          desc: "Vision and composure rise for the rest of the match. Lock the game to your rhythm."
        },
        option_thread_risk: {
          name: "Thread the risk",
          desc: "Next build-up gets a major boost, and the playmaker keeps forcing sharper passes."
        }
      },
      opp_keeper_rattled: {
        title: "Keeper Shaken",
        subtitle: "{name} is wobbling. The next decision can turn pressure into a collapse.",
        option_shoot_early: {
          name: "Shoot on sight",
          desc: "Their keeper save rate drops for 2 rounds. Less patience, more volume."
        },
        option_crash_box: {
          name: "Crash the box",
          desc: "Offense and tempo rise immediately. Swarm the second balls and rebounds."
        },
        option_reset_probe: {
          name: "Reset and probe",
          desc: "Boost the next build-up and sharpen the final pass before the shot."
        }
      },
      backline_step_up: {
        title: "Backline Step-Up",
        subtitle: "{name} keeps reading the game. The back line can now set the tone.",
        option_step_in: {
          name: "Step into midfield",
          desc: "Next build-up gets stronger and the whole shape pushes five yards higher."
        },
        option_hold_shape: {
          name: "Hold the shape",
          desc: "Safer block for 2 rounds. Opponent shot quality drops and composure rises."
        },
        option_spring_trap: {
          name: "Spring the trap",
          desc: "Counter stance armed and their next build-ups get shakier."
        }
      },
      hot_player: {
        title: "On Fire",
        subtitle: "{name} has scored and looks unstoppable.",
        option_boost: { name: "Keep Him Going", desc: "Permanent +{bonus} to {stat}. Let the momentum ride." },
        option_stabilize: { name: "Hold the Shape", desc: "Protect the lead — defensive stability over individual flair." }
      },
      crisis_moment: {
        title: "Heads Are Dropping",
        subtitle: "Down {deficit} — the dressing room needs a spark.",
        option_team_talk: { name: "Team Talk", desc: "Rally the squad. 70% chance it lands — composure and offense boost. 30% it doesn't." },
        option_focus: { name: "Single Focus", desc: "Put the pressure on one player to turn the tide." },
        option_accept: { name: "Accept & Grind", desc: "No speeches. Play smart, stay compact — form recovery on the back end." }
      },
      opp_mistake: {
        title: "They're Cracking",
        subtitle: "{opp} has failed {n} build-ups. The pressure is showing.",
        option_exploit: { name: "Go For It", desc: "Immediate attack with bonus — strike while they're rattled." },
        option_sustain: { name: "Keep the Pressure On", desc: "Sustained pressing malus for the opponent. Grind them down." }
      },
      legendary_demand: {
        title: "{name} Wants In",
        subtitle: "Your legendary is watching from the bench.",
        option_bring_on: { name: "Bring On {name}", desc: "Sub them in now — full legendary impact." },
        option_morale: { name: "Not Yet", desc: "Keep them fresh — bench presence lifts morale. Small team-wide boost." }
      },
      season_finale: {
        title: "Title Race",
        subtitle: "Final match — points on the table, nerves on edge.",
        option_allin: { name: "Go All-In", desc: "Risk everything for maximum points. Higher ceiling, higher floor risk." },
        option_controlled: { name: "Controlled Approach", desc: "Steady and clinical. Lower variance — take what the game gives you." }
      }
    },

    hints: {
      lfTempoEdgeExact: "{name} has the pace edge: {myTempo} TEM vs {oppTempo}.",
      lfTempoRiskExact: "Their pace can punish the flank: {myTempo} TEM vs {oppTempo}.",
      shakyBuildUp: "Build-up looks shaky: PM {vision} VIS / {composure} COM. Control options help most.",
      backlineUnderPressure: "Back line starts under pressure: {hold} hold vs {oppOffense} opp OFF.",
      earlyControl: "You should control the opening exchanges. Possession or balanced can snowball.",
      buildupLow: "Your build-up is only {rate}%. Vision/composure is the first fix.",
      accuracyLow: "You reach shots but do not finish: {rate}% accuracy. Offense/direct play helps more than control.",
      oppBuildupHigh: "They build too cleanly: {rate}% opp build-up. Defense/press/keeper help.",
      finalNeedEntry: "Need cleaner entry first: build-up {rate}%.",
      finalNeedPressure: "Entry is okay. You need shot pressure now: accuracy {rate}%.",
      finalProtectionWorking: "Protection is working. Defense/composure can close this out.",
      ironwallEarly: "Ironwall trait: rounds 1–2 their defence is nearly impenetrable.",
      sniperWarning: "Precision shooter — every attempt is dangerous.",
      clutchOppLate: "They get stronger late — rounds 5–6 watch out.",
      presserOppActive: "High press incoming — build-up will be disrupted.",
      bossWarning: "Boss fight — all their stats are elevated.",
      lfTempoAdvantage: "{name} has a pace edge — wing play could be decisive.",
      lfTempoDisadvantage: "Their tempo is higher — counter-threat on the flanks.",
      squadInForm: "The squad's flying — pressing tactics amplified.",
      squadInCrisis: "Confidence is low — safe options carry less risk.",
      pressingBlocked: "Pressing blocked {n} attacks in the first half.",
      countersFired: "Counter system triggered {n}× — it's working.",
      scoreLeading: "You're ahead — consolidating is an option.",
      scoreTrailing: "You're chasing — urgency matters now.",
      tacticSynergyKickoff: "This tactic fits your squad's strengths.",
      tacticConflict: "This tactic might clash with your current setup.",
      legendaryOnBench: "{name} is on the bench and ready.",
      finalLegendaryOnBench: "Legendary on the bench — final round could be their moment.",
      oppBuildupLow: "Opponent build-up only {pct}% successful — they're vulnerable.",
      noHint: ""
    },

    streaks: {
      zone: "In the zone",
      cold: "Cold spell",
      frustrated: "Frustrated"
    },

    cards: {
      yellow: "Yellow card — one more this match sends them off and suspends them for the next one.",
      secondYellow: "Second yellow — sent off this match, suspended for the next one.",
      red: "Red card — sent off this match, suspended for the next one.",
      suspendedNext: "Suspended — can't be fielded next match.",
      academyTooltip: "Academy call-up — temporary replacement, significantly weaker stats, no traits. Leaves the squad after this match.",

      // Card-play layer (hand/deck/discard UI + card catalog)
      endTurn:      "END TURN",
      mulliganBtn:  "MULLIGAN",
      deckLabel:    "DECK",
      discardLabel: "DISC",
      deckTooltip:    "Deck — cards yet to be drawn this match. When it empties, the discard pile reshuffles into a new deck (standard deckbuilder loop).",
      discardTooltip: "Discard — cards already played or discarded this match. Reshuffles back into the deck when the deck runs dry.",
      flowHint:       "Setup cards add Flow. Trigger and Combo cards consume it for bigger payoffs.",
      laneHint:       "Lane Open unlocks lane-consuming cards for a big offensive kicker.",
      pressHint:      "Press Resist soaks opponent press pressure — blunts their defensive bonus this round.",
      oppIntent:    "OPP THREAT",
      oppIntentVerbs: [
        "loading",
        "teeing up",
        "priming",
        "winding up",
        "cocking back"
      ],
      telegraphed:  "TELEGRAPHED",
      absorbed:     "DEFUSED",
      handEmpty:    "Hand empty — end turn to continue.",
      energyLabel:  "ENERGY",
      skipMalus:    "No cards played — team on autopilot (−4 TMP / −3 VIS).",
      fatigueNarrative: [
        "{name} starts dragging their feet — the intensity is biting.",
        "{name} waves for a break — four rounds wearing on everyone.",
        "Tempo drops noticeably — {name} is searching for air.",
        "{name} loses the timing — the tank is empty."
      ],
      types: {
        setup:   "SETUP",
        trigger: "TRIGGER",
        combo:   "COMBO",
        defense: "DEFENSE",
        counter: "COUNTER",
        draw:    "DRAW"
      },
      drop_deep:       { name: "Drop Deep",       desc: "+8 DEF / +4 VIS. Generates 1 Flow, 2 Press Resist.",
        flavor: [
          "{pm} drops into space — press broken.",
          "Team pulls deep — {opp} loses the trigger.",
          "{pm} reads the line, takes a touch back."
        ]
      },
      switch_lane:     { name: "Switch Lane",     desc: "+8 TMP / +4 OFF. Generates 1 Flow, opens a lane.",
        flavor: [
          "Ball switches sides — new angle opens.",
          "{pm} finds a diagonal — {opp} shifts late.",
          "Quick reversal — free man on the far side."
        ]
      },
      quick_build:     { name: "Quick Build",     desc: "+10 VIS / +3 CMP this round. Generates 1 Flow.",
        flavor: [
          "{pm} picks a fast triangle — clean release.",
          "Short combination through the middle.",
          "{pm} threads it through the press."
        ]
      },
      tight_shape:     { name: "Tight Shape",     desc: "+14 DEF this round. Scales 1.3× vs telegraphed threats.",
        flavor: [
          "Lines stay compact — no space in midfield.",
          "Team compresses — {opp} forced wide.",
          "Shape holds, pressing is comfortable."
        ]
      },
      hold_the_line:   { name: "Hold The Line",   desc: "Free. +8 DEF / +6 CMP, +8 to next save. Scales 1.3× vs telegraphed threats.",
        flavor: [
          "{tw} marshals the back line — patient now.",
          "{vt} organizes, nobody bites the bait.",
          "Team keeps the shape — eleven men behind the ball."
        ]
      },
      keeper_rush:     { name: "Keeper Rush",     desc: "+10 DEF, next save +15. Scales 1.3× vs telegraphed threats.",
        flavor: [
          "{tw} races off his line — sweeps the danger.",
          "{tw} commands the box, claims it cleanly.",
          "{tw} is off his line in a flash."
        ]
      },
      overlap_run:     { name: "Overlap Run",     desc: "+15 OFF / +6 TMP, scales +4 OFF per Flow stack (cap +16). Payoff card.",
        flavor: [
          "{lf} overlaps — numbers on the flank.",
          "{lf} bursts past the fullback, touchline run.",
          "{lf} surges into the final third — now the pass."
        ]
      },
      forward_burst:   { name: "Forward Burst",   desc: "+14 OFF / −4 CMP (+12 OFF if Lane Open, +6 OFF on aggressive/tempo tactic). Consumes Lane Open.",
        flavor: [
          "{lf} and {st} break — two on two.",
          "Counter launches — {st} is away.",
          "{lf} accelerates — defenders scrambling."
        ]
      },
      ball_recovery:   { name: "Ball Recovery",   desc: "+6 DEF / +4 TMP. Dampens the next opp trait fire.",
        flavor: [
          "{pm} steps in — clean interception.",
          "{vt} reads it — ball back in {pm}'s feet.",
          "Pressing pays off — {opp} lose it cheaply."
        ]
      },
      hero_moment:     { name: "Hero Moment",     desc: "+18 OFF / +6 CMP. Becomes +34 OFF if Flow ≥ 2 (consumes 2 Flow).",
        flavorHit: [
          "{st} finds his moment — keeper has no chance!",
          "{st} rolls off the defender — that's on target.",
          "{st} times it perfectly — one touch, one shot."
        ],
        flavorMiss: [
          "{st} tries to force it — not enough build-up.",
          "{st} snatches at the chance, no rhythm yet.",
          "{st} shapes to shoot but nothing sticks around him."
        ]
      },
      wing_trap:       { name: "Wing Trap",       desc: "+12 DEF / +6 TMP. Cancels the next opp trait fire.",
        flavor: [
          "{lf} lures them wide — trap sprung at the line.",
          "{vt} closes the channel — {opp} player trapped.",
          "Touchline cover arrives — clean steal."
        ]
      },
      masterclass:     { name: "Masterclass",     desc: "+40 OFF / +12 VIS if Flow ≥ 3. Otherwise +10 OFF.",
        flavorHit: [
          "{pm} conducts the whole piece — ten passes, one chance.",
          "{pm} runs the match — {opp} chasing ghosts.",
          "{pm} paints it — the team moves as one."
        ],
        flavorMiss: [
          "{pm} tries to orchestrate — pieces don't fit yet.",
          "{pm} looks for the combination, it's not quite there.",
          "{pm} reaches for the moment, no foundation built."
        ]
      },
      stamina_boost:   { name: "Stamina Boost",   desc: "+5 TMP / +5 CMP / +3 DEF for 2 rounds. Generates Flow.",
        flavor: [
          "Team finds a second wind — legs still fresh.",
          "Intensity up across the pitch.",
          "Bench sign: press harder, for longer."
        ]
      },
      clinical_finish: { name: "Clinical Finish", desc: "+16 OFF (+16 more if Lane Open). Consumes Lane Open.",
        flavorHit: [
          "{st} drives into the lane — cool finish.",
          "{st} takes one look, one touch, buries it.",
          "{lf} squares it — {st} slides it home."
        ],
        flavorMiss: [
          "{st} gets the shot off — right at the keeper.",
          "{st} tries it early — drags it wide.",
          "{st} rushes the finish, no angle yet."
        ]
      },
      deep_focus:      { name: "Deep Focus",      desc: "+12 VIS / +6 CMP for 2 rounds. Double Flow generator.",
        flavor: [
          "{pm} slows it down — everyone takes a breath.",
          "Tempo drops by design — {pm} dictates now.",
          "Team settles into possession rhythm."
        ]
      },

      // Action cards (reactive logic — not just stat shifts)
      desperate_foul:  { name: "Desperate Foul",    desc: "+12 DEF this round. VT takes a yellow (−1 CMP permanently this match).",
        flavor: [
          "{vt} chops him down — the yellow is worth it.",
          "{vt} commits — tactical foul in the channel.",
          "{vt} takes one for the team — booked."
        ]
      },
      bait_counter:    { name: "Bait The Counter",  desc: "+8 DEF / +4 TMP. If opp doesn't score next round, +Flow 2.",
        flavor: [
          "Team invites them forward — waiting for the gap.",
          "Deep block — {opp} stretched, looking for the pass.",
          "Baiting the press — one wrong ball and it's ours."
        ]
      },
      through_ball:    { name: "Through Ball",      desc: "Discard 1 random card. Setup → +4 OFF / +4 TMP, +Flow 2, Lane Open, plus a through-ball action. Trigger/Combo → −4 DEF. Defense/Counter → nothing.",
        flavorHit: [
          "{pm} spots the run — threaded it through!",
          "{pm} hits the seam — {lf} is clear.",
          "{pm} releases {st} with a disguised pass."
        ],
        flavorMiss: [
          "{pm} goes long — {opp} defender cleans it up.",
          "{pm} tries it first time — overcooked.",
          "Ball skids through — nobody on the run."
        ]
      },
      stone_cold:      { name: "Stone Cold",        desc: "Needs Flow ≥ 2 AND Lane Open. Consumes both. +30 OFF / +8 CMP — plus a guaranteed through-ball to the ST.",
        flavorHit: [
          "{st} threads it past the keeper — ice cold!",
          "{st} rounds him — rolls into the empty net.",
          "{st} takes one touch, one look, buries it low."
        ],
        flavorMiss: [
          "{st} rushes the moment — nothing to finish.",
          "{st} has no support — chance dies cold.",
          "{st} forces it — keeper reads it easily."
        ]
      },

      // Intentionally weak starter cards — candidates for removal.
      grind_through:   { name: "Grind Through",     desc: "+4 DEF / +2 TMP. Reliable but unremarkable. Dead weight late-game.",
        flavor: [
          "Team grinds it out — nothing pretty.",
          "Functional football — one percent per minute.",
          "Safe pass, safe move, safe round."
        ]
      },
      long_ball:       { name: "Long Ball",         desc: "+5 OFF / −3 VIS. Hopeful and wasteful.",
        flavor: [
          "{tw} hoofs it long — 50/50 at best.",
          "Ball sails forward — nobody reads it.",
          "Hopeful launch into the channel."
        ]
      },
      hope_shot:       { name: "Hope Shot",         desc: "20% chance of a scrappy goal. No stat buff — pure desperation.",
        flavor: [
          "{st} sees it, tries it from range — bit of hope.",
          "{lf} lets fly from thirty yards.",
          "Speculative strike — worth a try."
        ]
      },

      // Tactic-synergy cards (v4)
      gegenpress: { name: "Gegenpress", desc: "+8 DEF / +6 TMP. Doubled to +16/+12 if tactic is aggressive, tempo, or pressing. Scales 1.5× when trailing in match momentum.",
        flavorHit: [
          "Team triggers the counter-press — {opp} has no time to breathe!",
          "Six-second rule — {vt} wins it straight back, aggression pays off.",
          "The whole unit hunts — tactic and card sing the same song."
        ],
        flavorMiss: [
          "{vt} closes down — standard pressure.",
          "Team steps up, holds shape.",
          "{pm} shepherds them wide, patient."
        ]
      },
      possession_lock: { name: "Possession Lock", desc: "+8 VIS / +4 CMP, +Flow 1. If tactic is possession-leaning, draw an extra card.",
        flavorHit: [
          "{pm} dictates the metronome — twenty passes and no pressure.",
          "{opp} chasing ghosts — every pass finds a foot.",
          "Team keeps the ball on its side of the pitch."
        ],
        flavorMiss: [
          "{pm} circulates the ball — cautious rhythm.",
          "Team recycles possession — nothing forced.",
          "Sideways, patient — {pm} looking for the opening."
        ]
      },
      killing_blow: { name: "Killing Blow", desc: "+25 to +35 OFF (scales with lead, capped at 5+ goals ahead) / +8 CMP. Useless if level or behind.",
        flavorHit: [
          "{st} senses the match is there — drives the dagger in!",
          "Leading teams don't flinch — {pm} conducts the final act.",
          "{st} puts the game to bed — ice-cold finish!"
        ],
        flavorMiss: [
          "{st} reaches for the knockout — the score won't allow it.",
          "The team tries to close it out — but there's nothing to close.",
          "{pm} looks for the killer pass — wrong match state."
        ]
      },

      // Telegraph counters — shine against a signalled opp threat
      block: { name: "Block", desc: "Counters a telegraphed opp threat for +28 DEF / +6 CMP. Without a telegraph: just +8 DEF.",
        flavorHit: [
          "{vt} reads it perfectly — danger defused before it starts!",
          "{pm} sees the pattern — steps into the passing lane.",
          "{tw} was already moving — the threat dies cold."
        ],
        flavorMiss: [
          "{vt} holds his line — routine defense.",
          "Team stays compact, nothing to counter yet.",
          "{pm} drops into cover — precautionary."
        ]
      },
      preempt: { name: "Pre-empt", desc: "Cancels a telegraphed threat. With cancel: +22 DEF / +12 TMP / +8 CMP / +10 OFF, +Flow 2, draw 1. Without telegraph: +Flow 1, draw 1, no stat buff.",
        flavorHit: [
          "{pm} reads the move three seconds before it happens — we STEAL the moment!",
          "{vt} intercepts the pass before it's struck — {opp} stunned.",
          "The trap was laid — they walked right in."
        ],
        flavorMiss: [
          "{pm} stays alert — nothing to pre-empt.",
          "Team looks for a read — no obvious cue yet.",
          "{vt} scans the lanes — quiet moment."
        ]
      },

      // Tactic-specific synergy cards (one per major tactic family)
      counter_strike: { name: "Counter Strike", desc: "+28 OFF / +10 TMP / +Flow 1 with Counter tactic active OR auto-counter loaded. Otherwise +10 OFF.",
        flavorHit: [
          "{lf} hits them on the break — the tactic pays!",
          "Counter triggers like clockwork — {st} one-on-one.",
          "Defense to attack in three passes — textbook counter."
        ],
        flavorMiss: [
          "{st} tries the break — nothing behind to support.",
          "Too early, no counter shape yet — forced shot.",
          "{lf} springs forward alone — no numbers."
        ]
      },
      high_press_trap: { name: "Press Trap", desc: "+14 DEF / +6 TMP + Lane Open + cancels next opp trait with Pressing tactic. Otherwise +8 DEF.",
        flavorHit: [
          "Press trap snaps shut — {opp} has nowhere to go!",
          "High block catches them flat-footed — ball coughed up.",
          "{vt} triggers the pressure — turnover in their half."
        ],
        flavorMiss: [
          "Team steps up to press — they beat the first line.",
          "Trap set too deep — {opp} plays out comfortably.",
          "{vt} holds the pressure — standard containment."
        ]
      },
      possession_web: { name: "Possession Web", desc: "+14 VIS / +6 OFF / +6 DEF for 2 rounds, +Flow 2 with Possession tactic. Otherwise +8 VIS / +4 CMP.",
        flavorHit: [
          "{pm} weaves the web — {opp} can't touch the ball.",
          "Possession lockdown — twenty passes in their half.",
          "Team controls everything — {opp} reduced to chasing."
        ],
        flavorMiss: [
          "{pm} tries to knit it together — too loose.",
          "Ball circulation slow, no rhythm yet.",
          "Team holds possession — {opp} happy to let them."
        ]
      },
      flank_overload: { name: "Flank Overload", desc: "+22 OFF / +10 TMP for 2 rounds + persistent Lane Open with Flank Play tactic. Otherwise +10 OFF / +4 TMP.",
        flavorHit: [
          "{lf} and fullback overload the wing — three against one!",
          "Flank play clicks — {lf} gets to the byline twice.",
          "Overload pulls them wide — the channel's wide open."
        ],
        flavorMiss: [
          "{lf} goes down the wing — nobody overlapping.",
          "Attempted overload — only two against two.",
          "{lf} isolated on the flank — has to try alone."
        ]
      },

      // Discard-synergy archetype
      second_wind: { name: "Second Wind", desc: "+4 TMP / +2 CMP, +Flow 1. Scales: +2 TMP / +1 CMP per card already in discard (cap 5).",
        flavorHit: [
          "Team finds a second gear — the bench sees it too.",
          "{pm} rises with the rhythm — legs still there.",
          "Fatigue fades — the pressing looks fresh again."
        ],
        flavorMiss: [
          "Team catches a breath — modest reset.",
          "{pm} lifts the tempo a notch.",
          "Light gear shift, nothing dramatic."
        ]
      },
      dig_deep: { name: "Dig Deep", desc: "Discard 1 random card. +20 OFF / +4 TMP this round. Nothing if hand is empty.",
        flavorHit: [
          "{st} digs in — raw will finds the chance!",
          "{lf} abandons the plan, carries it himself.",
          "Team forces the issue — someone has to try."
        ],
        flavorMiss: [
          "{st} tries to force it — nothing to dig into.",
          "Hand is tapped out — no reserves left.",
          "Team has nothing to throw at this."
        ]
      },

      // Draw-based archetype
      tactical_pause: { name: "Tactical Pause", desc: "Draw 2 cards. +6 CMP / +4 VIS this round. Trades a round's punch for card velocity.",
        flavor: [
          "{pm} slows things down — reads the match again.",
          "Quick reset on the touchline — new shape, new options.",
          "Coach signals a rethink — cards flow faster now."
        ]
      },
      second_half: { name: "Second Half", desc: "Shuffles discard into deck and draws 3. +Flow 1, +6 CMP / +3 TMP. The reset button.",
        flavor: [
          "Whistle, water, new plan — team emerges reborn.",
          "Half-time treatment works — {pm} leads a new rhythm.",
          "Reset across the board — this is a different match now."
        ]
      },

      // Condition-system cards
      breather: { name: "Breather", desc: "Most tired starter regains +20 condition. Small defensive support. Simple maintenance.",
        flavorHit: [
          "{target} waves for a moment — team drops deep, gets the lungs back.",
          "Quick water break — {target} catches the breath, legs return.",
          "Coach signals controlled possession — {target} resets."
        ],
        flavor: [
          "Team drops deep for a moment, catches the breath.",
          "Quick water break at the whistle — legs return.",
          "Coach calls for controlled possession."
        ]
      },
      rotation: { name: "Rotation", desc: "Most tired starter refreshes to 90 condition. +Tempo / +CMP for 2 rounds. Rare, cheap.",
        flavorHit: [
          "Fresh legs for {target} — comes alive, whole unit lifts with them.",
          "Positional shuffle refreshes {target} — energy ripples through.",
          "Smart rotation finds {target} a break — the tempo snaps back."
        ],
        flavor: [
          "Fresh legs make the difference — energy ripples through the unit.",
          "Team finds a rotation that works — momentum swings.",
          "Positional shuffle refreshes the whole line."
        ]
      },
      doping: { name: "All-In", desc: "Striker's condition +30. +10 OFF / +6 TMP this round (+4 OFF on aggressive/tempo tactic). 15-30% backfire risk: −4 CMP for the rest of the match. Forced backfire on 3rd play.",
        flavorHit: [
          "{st} lifts it to another level — raw energy floods the attack!",
          "{st} taps into something — unstoppable for a moment.",
          "The striker goes all-in — he's firing on everything."
        ],
        flavorMiss: [
          "{st} pushes too hard — referee pulls out the yellow.",
          "{st} gives it everything — one rough tackle, one card.",
          "The push backfires — {st} oversteps and gets booked."
        ],
        flavorForced: [
          "{st} throws the last of it — the ref had enough, straight yellow.",
          "Body can't take a third push — {st} clatters someone, booked.",
          "Third All-In — and {st} crosses the line every ref watches for."
        ]
      },

      burn_plan: { name: "Burn Plan", desc: "Exile one random other card from hand (returns next match). +22 OFF / +10 TMP this round.",
        flavorHit: [
          "The dugout burns an option — every eye sharpens on the remaining plan.",
          "Sacrifice on the whiteboard — the squad commits hard on what's left.",
          "One plan goes in the bin, and suddenly the pitch looks clearer."
        ],
        flavorMiss: [
          "Nothing left to burn — the plan was already lean.",
          "Hand's empty, no sacrifice to make — the effort sputters.",
          "Burn Plan with nothing to burn — a weak spark, no fire."
        ]
      },

      running_hot: { name: "Running Hot", desc: "+4 OFF / +2 TMP base, plus +3 OFF per win in current streak (max +15). Scales further with momentum and aggressive/tempo tactics.",
        flavorHit: [
          "The squad is on a roll — confidence moves them one yard faster.",
          "Winning mentality kicks in — everyone moves with belief.",
          "Five-wins-in-a-row energy floods the pitch."
        ],
        flavorMiss: [
          "Cold legs, cold heads — no streak to ride.",
          "No wins to draw on — the boost is muted.",
          "Running Hot needs momentum — today there's just frost."
        ]
      },

      second_wave: { name: "Second Wave", desc: "Draw 1 card. Replay the last card played this match at 60% effect.",
        flavorHit: [
          "The same move, one beat later — their defenders never reset.",
          "Repeat the pattern — they're still falling for it.",
          "Once is a move. Twice is a trend — and they can't stop a trend."
        ],
        flavorMiss: [
          "Nothing to echo — the wave hits empty water.",
          "No prior play to repeat — just a fresh draw.",
          "First wave of the match — echoes come later."
        ]
      },

      tide_turner: { name: "Tide Turner", desc: "Only works when trailing in momentum. Reset momentum to +10, +18 OFF / +8 CMP, and a counter-attack.",
        flavorHit: [
          "The tide turns — and the team senses it.",
          "One chance to flip it — {pm} grabs it.",
          "Rallying cry — the back line steps up."
        ],
        flavorMiss: [
          "Too early — no tide to turn yet.",
          "The crowd's still on our side — save this one.",
          "Momentum's fine — no comeback needed."
        ]
      },

      ride_the_wave: { name: "Ride the Wave", desc: "Only at +40 momentum or better. +24 OFF / +10 TMP / +6 CMP and a cross into the box.",
        flavorHit: [
          "Everything clicks — {lf} puts the cross on a plate.",
          "The rush is on — {st} is flying.",
          "No stopping us now — the box is chaos."
        ],
        flavorMiss: [
          "Not feeling it yet — the wave hasn't built.",
          "Not enough momentum to ride — save it.",
          "Needs a storm of form — today's flat."
        ]
      },

      storm_warning: { name: "Storm Warning", desc: "+10 DEF / +4 CMP for 2 rounds. Next goal conceded: momentum drop halved.",
        flavorHit: [
          "Brace position — they know something's coming.",
          "{vt} barks the warning — backs close ranks.",
          "See the storm coming, shore up the defence."
        ]
      },

      tactical_discipline: { name: "Tactical Discipline", desc: "Cost 2 · SHIELD. +4 DEF / +3 CMP until it triggers. Blocks the next opp-card completely.",
        flavor: [
          "Heads cool — they won't catch us off-guard.",
          "{pm} calls for composure — no cheap fouls, no baiting.",
          "Pre-empt the mind-game — we know their plays."
        ]
      },

      counter_read: { name: "Counter Read", desc: "Cost 2 · SHIELD. +6 VIS / +3 CMP this round. Next opp-card plays at half effect.",
        flavor: [
          "{pm} reads the setup — we're half a step ahead.",
          "Count their triggers — step in before they resolve.",
          "Their shape telegraphs — reduce the damage."
        ]
      },

      regroup: { name: "Regroup", desc: "Cost 3 · SHIELD. +10 DEF / +6 CMP / +4 TMP this round. Purges all active opp-adaptations and opp-cards.",
        flavor: [
          "Reset the plan — everything they've built fades.",
          "Timeout in all but name. Their wave crashes on nothing.",
          "Back to zero — fresh ground, fresh legs."
        ]
      },

      intel_leak: { name: "Intel Leak", desc: "Cost 1 · SHIELD. +5 VIS this round. Reveals next opp-card before it plays.",
        flavor: [
          "{pm} spots the tell — we'll see it coming.",
          "Scout read — their plan is no longer secret.",
          "Read the sideline — their signal is clear."
        ]
      },

      // ── v52.2 Draw archetype ──
      quick_scout: { name: "Quick Scout", desc: "Draw 2 cards. +5 VIS / +2 TMP this round. Flow tag.",
        flavor: [
          "{pm} glances up — two fresh options come to mind.",
          "Quick scan, picture clear — the next play writes itself.",
          "A beat to look around — {pm} re-reads the lanes."
        ]
      },

      study_opposition: { name: "Study Opposition", desc: "Draw 2 cards. +8 VIS / +3 CMP. Every opp intent is flagged this round — even minor ones become blockable.",
        flavorHit: [
          "Pattern spotted — every move they make is telegraphed now.",
          "{pm} reads their build — nothing they do is coming as a surprise.",
          "The signal's decoded — we know what's coming, even when it's whispered."
        ]
      },

      endgame_plan: { name: "Endgame Plan", desc: "Draw 3 cards. From round 4 onwards: +Flow 1, +10 CMP / +6 VIS. Late-match card velocity.",
        flavorHit: [
          "{pm} knows the clock — every play matters. Three new options.",
          "Dressing-room briefing kicks in — the team knows what to do.",
          "Closing time. {pm} pulls the plan out of his pocket."
        ],
        flavorMiss: [
          "Too early for the endgame plan — but three fresh cards is three fresh cards.",
          "The playbook waits — for now, just top up the hand.",
          "The big moves come later. Right now: just draw."
        ]
      },

      // ── v52.2 Inventory fill ──
      quick_screen: { name: "Quick Screen", desc: "+6 DEF / +3 TMP this round. Press-resist +1.",
        flavor: [
          "Quick line, compact — they find no gap.",
          "{vt} shifts early — their press hits nothing.",
          "Line up, ball gone — simple and clean."
        ]
      },

      triangle_play: { name: "Triangle Play", desc: "+6 TMP / +4 VIS / +2 OFF. Generates 1 Flow AND opens a lane.",
        flavor: [
          "Short-short-long — {pm} finds the way through the middle.",
          "Three men, three touches — the lane opens up.",
          "{pm} and {lf} play free — triangle's up, the space is there."
        ]
      },

      pressure_trap: { name: "Pressure Trap", desc: "Cost 1 · COUNTER. On telegraphed opp threat: +14 DEF / +6 CMP / +4 TMP and +Flow 1; absorbs the threat. Otherwise small base effect.",
        flavorHit: [
          "They run into it — {vt} snaps the trap shut, ball back.",
          "Bait taken — trap's closed, possession's ours.",
          "Timing is perfect — their attack collapses, we turn it around."
        ],
        flavorMiss: [
          "Trap set — but nothing's biting.",
          "No clear threat — the trap sits empty.",
          "Ready to react, but they keep their feet still."
        ]
      },

      set_piece: { name: "Set Piece", desc: "Cost 1 · COMBO. Needs Flow ≥ 2. Then +26 OFF / +4 CMP plus shot — no lane required.",
        flavorHit: [
          "Corner. Rehearsed. {st} meets it at the near post — shot!",
          "Free kick, short variation — {pm} to {st}, full broadside!",
          "Set-piece runs through — everyone knows their spot, {st} finishes."
        ],
        flavorMiss: [
          "Set-piece lined up — but without buildup, the routine fizzles.",
          "No flow in the team — the corner variation goes nowhere.",
          "Rehearsed but unprepared — nothing gets through."
        ]
      },

      deep_defense: { name: "Deep Defense", desc: "+20 DEF / +4 CMP this round. Press-resist +1.",
        flavor: [
          "Whole back line drops deep — the bus in front of the goal.",
          "{vt} organises the mass defense — they can't get through.",
          "Everyone behind the ball — 'the opponent's had their turn.'"
        ]
      },

      lone_striker: { name: "Lone Striker", desc: "Cost 1 · COMBO. If {st} condition ≥ 70: +22 OFF / +6 CMP plus shot. Tired {st}: tiny base effect.",
        flavorHit: [
          "{st} goes it alone — and finishes.",
          "{st} burns the defense — shot, goal in reach.",
          "{st} on his own — the legs still have something."
        ],
        flavorMiss: [
          "{st} tries — the legs are too heavy for the solo.",
          "{st} lacks the punch — the breakaway fizzles out.",
          "{st} can't get away — too tired to do it alone."
        ]
      },

      team_unity: { name: "Team Unity", desc: "Cost 2. Every starter below 60 condition gets +10. Up to +12 CMP / +2 VIS scaling with lifted players.",
        flavorHit: [
          "Quick huddle at the centre circle — breath, we've got this.",
          "{pm} calls them in — one more focused push.",
          "Eye contact, fists together — the team wakes up."
        ],
        flavorMiss: [
          "Unity called — but the legs were fine anyway.",
          "No need for a restart — everyone's still sharp.",
          "Speech lands flat — nobody needed it."
        ]
      },

      final_whistle: { name: "Final Whistle", desc: "Cost 1 · COMBO · RETAIN. From round 5 when not ahead: +20 OFF / +10 TMP / +6 CMP, lane open, +Flow 1 plus shot. Otherwise small base effect.",
        flavorHit: [
          "Last chance — {st} feels it, ALL or nothing.",
          "Clock's ticking down — and the team cranks up. Whistle's close!",
          "The final attack — {pm} sends {st} on his way."
        ],
        flavorMiss: [
          "Too early in the match — we save the closing kick for later.",
          "Lead in hand — no reason for the crowbar.",
          "Whistle's still quiet — the big play waits."
        ]
      },

      last_stand: { name: "Last Stand", desc: "Cost 1 · DEFENSE. When trailing: +24 DEF / +10 CMP, next conceded goal at half momentum drop. Otherwise small base effect.",
        flavorHit: [
          "Backs against the wall — and the team pulls the lines tight.",
          "{vt} rallies the chain — nobody's getting through here.",
          "The deficit woke them up — uncompromising defense."
        ],
        flavorMiss: [
          "No deficit, no last-stand energy — we defend calmly.",
          "Held defensively — no drama, not the moment.",
          "We're up — the emergency brake stays in the cupboard."
        ]
      },

      field_commander: { name: "Field Commander", desc: "Cost 2 · TRIGGER. Fresh {pm} (≥50 condition): +14 OFF / +10 TMP / +6 CMP / +6 VIS plus +Flow 1. Tired {pm}: tiny effect.",
        flavorHit: [
          "{pm} takes charge — everyone knows where to go, ball flies.",
          "The captain directs — the team runs on rails.",
          "{pm} becomes the conductor — four runs start at the same time."
        ],
        flavorMiss: [
          "{pm} tries to direct — but the air's gone.",
          "The voice is quieter — {pm} can't call the tempo anymore.",
          "Calls come late — tired legs swallow the precision."
        ]
      },

      break_the_line: { name: "Break The Line", desc: "Cost 2 · COMBO · Flow ≥ 2. Spends Flow 2, opens Lane. +22 OFF, +8 TMP (+15 vs Lockdown or Big-Move). Extra shot.",
        flavorHit: [
          "{st} finds the gap in the concrete — through the chain.",
          "A pass through the middle — {lf} runs unchallenged.",
          "The bunker breaks — {pm} plays the decisive ball."
        ],
        flavorMiss: [
          "Not enough flow — the line holds.",
          "No opening — the plan runs into nothing."
        ]
      },
      medic: { name: "Medic", desc: "Cost 1 · DEFENSE. Restores 25 condition (prefers the fouled victim). +4 CMP / +3 DEF.",
        flavor: [
          "Quick spray, back on his feet — {name} keeps going.",
          "The physio sprints on, helps {name} up.",
          "Fast treatment — {name} plays through it."
        ]
      },
      poker_face: { name: "Poker Face", desc: "Cost 1 · DEFENSE. Next card is disruption-immune. Cancels Fake Press / Study Tape. +8 CMP / +4 VIS.",
        flavor: [
          "{pm} shows nothing — no tell at all.",
          "Unreadable stare — they can't decode it.",
          "The team gives nothing away — plan stays hidden."
        ]
      },
      read_the_game: { name: "Read The Game", desc: "Cost 1 · DRAW. Reveals the opponent's next move. Draw 1, +1 Flow, +10 VIS / +3 CMP.",
        flavor: [
          "{pm} reads the rhythm — he knows what's coming.",
          "Two seconds ahead — {pm} has cracked the plan.",
          "The signals are clear — the opponent is transparent."
        ]
      },
      late_winner: { name: "Late Winner", desc: "Cost 2 · COMBO. Round 5+: +28 OFF, +10 CMP, +6 TMP, ignores opp defensive buffs. Extra shot. Early: just +5 CMP.",
        flavorHit: [
          "Final minutes — {st} finds the moment.",
          "When it matters, {st} is there — late hero.",
          "Time ticking, {st} pulls the trigger — perfect timing."
        ],
        flavorMiss: [
          "Too early — the card needs the endgame.",
          "Timing's off — the effect doesn't land."
        ]
      },
      clutch_defense: { name: "Clutch Defense", desc: "Cost 2 · DEFENSE. GUARANTEED block of a telegraphed big-move. +30 DEF / +12 CMP. Without big-move: +12 DEF and absorbs next shot.",
        flavorHit: [
          "{tw} reads the big-move — stopped cold.",
          "The chain holds — their signature play fizzles.",
          "{vt} throws himself in — at the decisive moment."
        ],
        flavorMiss: [
          "No big threat in the air — just holding shape.",
          "Insurance measure — in case something comes."
        ]
      },
      counterpunch: { name: "Counterpunch", desc: "Cost 1 · COUNTER. Vs telegraphed Counter-Blitz: +18 OFF, +8 TMP, +6 DEF, triggers counter. Otherwise: +6 OFF / +4 TMP.",
        flavorHit: [
          "{lf} flips the script — out of nowhere in their box.",
          "Their counter becomes ours — {st} runs through.",
          "Turnover ignites — counter-counter with power."
        ],
        flavorMiss: [
          "No counter in sight — small hedge.",
          "Nothing to flip — simple tempo push."
        ]
      },
      scout_report: { name: "Scout Report", desc: "Cost 2 · DRAW. Reveals next 2 opponent moves. Draw 2, +2 Flow, +14 VIS / +4 CMP.",
        flavor: [
          "{pm} has done the video work — he knows everything.",
          "Two moves ahead — the team has the rhythm figured.",
          "The opponent's plan lies open — we play them off the park."
        ]
      }
    },

    oppMove: {
      overload_flank: { name: "Flank Overload", telegraph: "They load up the wing — next shot hits harder." },
      quick_strike: { name: "Quick Strike", telegraph: "Instant shot at round start — no warning." },
      long_ball: { name: "Long Ball", telegraph: "Everything up to the striker — risky pass, strong offense." },
      pressing_surge: { name: "Pressing Surge", telegraph: "They come out high — build-ups will be disrupted." },
      counter_blitz: { name: "Counter Blitz", telegraph: "On save: they switch instantly." },
      rage_offensive: { name: "Rage Offensive", telegraph: "Everything forward — bonus attack." },
      park_the_bus: { name: "Park The Bus", telegraph: "Whole chain drops — hard to get through." },
      bunker: { name: "Bunker", telegraph: "Keeper locks in — saves get safer." },
      low_block: { name: "Low Block", telegraph: "They pack the box — combos dampened." },
      mental_wall: { name: "Mental Wall", telegraph: "They play on your nerves — composure drops." },
      tactical_foul: { name: "Tactical Foul", telegraph: "The striker goes down — condition lost." },
      fake_press: { name: "Fake Press", telegraph: "Feigning pressure — your next card weakens." },
      time_waste: { name: "Time Waste", telegraph: "Stalling — you draw fewer cards." },
      dirty_tackle: { name: "Dirty Tackle", telegraph: "Rough — a starter loses major condition." },
      study_tape: { name: "Study Tape", telegraph: "Scouting you — two rounds of transparent play." },
      training_focus: { name: "Training Focus", telegraph: "They adjust a stat permanently for this match." },
      captain_speech: { name: "Captain's Speech", telegraph: "Motivation boost — composure gain over three rounds." },
      signature_play: { name: "Signature Play", telegraph: "Their rehearsed killer — GUARANTEED goal if unblocked!" },
      desperation_push: { name: "Desperation Push", telegraph: "All hands forward — three attacks this round!" },
      tiki_taka_press: { name: "Tiki-Taka Press", telegraph: "Possession dominance — three rounds of raised offense!" }
    },

    oppArchetype: {
      catenaccio: "{opp} plays CATENACCIO — defensive, patient, deadly on the counter.",
      gegenpressing: "{opp} plays GEGENPRESSING — high press, grinding.",
      tiki_taka: "{opp} plays TIKI-TAKA — possession, late hammer.",
      direct_play: "{opp} plays DIRECT PLAY — aggressive, high-risk.",
      chaos: "{opp} plays CHAOS — unpredictable."
    },

    // Inline situation frames — replace old modal events when cards are on.
    frames: {
      strikerFrustrated: {
        title:  "STRIKER FRUSTRATED",
        text:   "{name} has burned {n} chances and is boiling.",
        effect: "−6 OFF this round",
        hint:   "Play a Setup on him — Quick Build or Drop Deep shakes it off."
      },
      keeperInZone: {
        title:  "GOALIE STREAK",
        text:   "{name} has stopped {n} shots in a row — unbeatable right now.",
        effect: "Defense +10 · next save +12",
        hint:   "Press the advantage with an attacking card."
      },
      hotCorridor: {
        title:  "LANE IS WIDE OPEN",
        text:   "{name} has the channel for himself.",
        effect: "Lane Open · +5 TMP · +4 OFF",
        hint:   "Forward Burst or Clinical Finish cash in hard."
      },
      oppStarDown: {
        title:  "THEY ARE RATTLED",
        text:   "{opp} has lost their rhythm.",
        effect: "+8 OFF · +6 TMP · next opp trait dampened",
        hint:   "Push. A Combo card finishes the job."
      },
      redCardRisk: {
        title:  "WALKING ON EGGS",
        text:   "{name} is one bad tackle from a red.",
        effect: "−4 CMP · aggressive play risks dismissal",
        hint:   "Defense cards are safe. Pressing is a gamble."
      },
      oppKeeperShaky: {
        title:  "THEIR KEEPER IS BEATEN",
        text:   "{opp}'s keeper has lost his bearings.",
        effect: "+10 OFF · their next save dampened",
        hint:   "Push it home with any finisher — he's reading the wrong runs."
      },
      oppDefenseStretched: {
        title:  "THEIR SHAPE IS BROKEN",
        text:   "{opp} have been chasing — gaps appearing.",
        effect: "+8 OFF · +6 VIS · their next build-up harder",
        hint:   "Combo through the middle — no-one to cover."
      },
      conditionCritical: {
        title:  "CRITICAL FATIGUE",
        text:   "{name} is running on fumes — legs gone, timing wrecked.",
        effect: "−2 CMP team-wide · fatigue penalties stacking",
        hint:   "Breather or Rotation NOW, or accept the collapse."
      }
    },

    cardDraft: {
      addTitle:      "ADD A CARD",
      addSubtitle:   "Pick one to add to your deck. Your build gets sharper.",
      removeTitle:   "THIN YOUR DECK",
      removeSubtitle:"Pick one card to remove permanently. Less deck = more consistency.",
      bossTitle:     "BOSS REWARD",
      bossSubtitle:  "You toppled a boss. Take two cards to sharpen your deck.",
      replaceStep1Title:    "REPLACE — STEP 1/2",
      replaceStep1Subtitle: "Pick a card to remove. You'll choose its replacement next.",
      replaceStep2Title:    "REPLACE — STEP 2/2",
      replaceStep2Subtitle: "Pick a replacement for the removed card.",
      upgradeTitle:         "UPGRADE",
      upgradeSubtitle:      "Pick a card to upgrade — permanent +25% stat effect.",
      actionAdd:     "+ ADD",
      actionRemove:  "− REMOVE",
      actionUpgrade: "↑ UPGRADE",
      skipAdd:       "Skip this card",
      skipRemove:    "Keep all cards",
      skipUpgrade:   "Skip upgrade"
    },

    eventActors: {
      format: "{owner} {role} {name}",
      owners: {
        my: "your",
        opp: "their"
      },
      roles: {
        TW: "goalkeeper",
        VT: "defender",
        PM: "playmaker",
        ST: "striker",
        LF: "winger",
        player: "player"
      }
    },

    eventReasons: {
      strikerMisses: "{name} has missed {n} chances in a row — frustration is building.",
      keeperSaves: "{name} has made {n} saves back-to-back — fully dialled in.",
      oppStrikerMisses: "Their striker {name} keeps missing — confidence is cracking.",
      momentumShift: "Conceded {n} in a row — the match is slipping away.",
      hotCorridor: "{name} keeps finding space down the wing — the channel is open.",
      oppPmDirigent: "Their playmaker {name} is orchestrating — {n} clean build-ups in a row.",
      hitzigerMoment: "Emotions are running high after that last goal.",
      freierMann: "{name} is breaking through — a runner is loose.",
      clearChance: "{name} gets the service and the angle — this is a moment.",
      taktikwechsel: "{opp} is struggling — they'll change shape next.",
      legendaryDemand: "{name} is watching from the bench, itching to go.",
      playmakerPulse: "{name} has linked {n} clean build-ups in a row.",
      oppKeeperRattled: "{name} has started to look uncertain under repeated pressure.",
      backlineStepUp: "{name} has already broken up {n} attacks.",
      redCardRisk: "{name} is playing on the edge — studs are up, tempers short.",
      weatherRain: "The heavens open — pitch is soaked, ball is slick.",
      weatherWind: "Swirling wind — long balls are a lottery now.",
      weatherHeat: "The heat is brutal — legs are getting heavy out there.",
      fanRevolt: "Crowd is on the players' backs after going down {opp}-{me}.",
      oppStarDown: "{name} is limping off — their key man might be gone.",
      coachWhisperDirect: "Assistant coach in your ear: \"Forget build-up, go direct.\"",
      coachWhisperPatient: "Assistant coach in your ear: \"Slow it down, pick them apart.\"",
      setPieceAwarded: "Foul just outside their box — a gilt-edged delivery chance.",
      legsGone: "Heavy legs from the early tempo — the squad needs rhythm, not bursts.",
      tacticalClashPressing: "Your press is running into their composure wall — it's costing shape.",
      tacticalClashPossession: "Their pace burns through your possession game — they're already on the break.",
      refereeStern: "The referee's whistle is fast today — every challenge is a risk."
    },

    events: {
      striker_frustrated: {
        title: "Striker Frustrated",
        subtitle: "{name} has missed {n} chances — the body language is off.",
        option_layoff_pm: {
          name: "Lay off to the playmaker",
          desc: "Playmaker-driven approach: scorer forced to ST, bonus scales with PM vision."
        },
        option_push_through: {
          name: "Push through it",
          desc: "+14% on {name}'s next shot. Trust him to break the spell."
        },
        option_swap_off: {
          name: "Swap him off",
          desc: "Bring a fresh forward from the bench. Resets his streak, costs chemistry."
        }
      },
      keeper_in_zone: {
        title: "Keeper in the Zone",
        subtitle: "{name} has pulled off {n} saves in a row — on fire.",
        option_launch_counter: {
          name: "Launch a counter now",
          desc: "Immediate attack with +22% bonus. Ride the momentum."
        },
        option_stay_solid: {
          name: "Stay solid",
          desc: "+12% next save. Let him keep the clean sheet going."
        }
      },
      opp_striker_frustrated: {
        title: "They're Rattled",
        subtitle: "Their striker {name} has missed {n} chances — cracking under the pressure.",
        option_press_high: {
          name: "Press high",
          desc: "-18% opposing shot accuracy for 2 rounds. Squeeze them harder."
        },
        option_guard_desperate: {
          name: "Guard the desperate shot",
          desc: "+20% next save. Frustrated strikers swing wildly."
        }
      },
      momentum_shift: {
        title: "Momentum Slipping",
        subtitle: "Conceded {conceded} in a row — something has to change now.",
        option_timeout: {
          name: "Timeout talk",
          desc: "+12 composure, +6 defense rest of match. Calm the squad."
        },
        option_switch_tactic: {
          name: "Switch shape",
          desc: "Defensive counter stance. Auto-counter active 2 rounds."
        }
      },
      hot_corridor: {
        title: "Hot Corridor",
        subtitle: "{name} has been breaking down the wing repeatedly.",
        option_double_down: {
          name: "Double down on the wing",
          desc: "{name} takes the next shot with +15% bonus. Flank runs extended."
        },
        option_switch_center: {
          name: "Switch to the centre",
          desc: "+14 vision, +6 offense. Surprise them in the middle."
        }
      },
      opp_pm_dirigent: {
        title: "Their Conductor",
        subtitle: "Their playmaker {name} has strung together {n} clean build-ups.",
        option_push_vt_high: {
          name: "Push VT up high",
          desc: "-18% their build-up for 2 rounds, but -6 defense (gambling high line)."
        },
        option_double_mark: {
          name: "Double-mark him",
          desc: "-25% their build-up for 3 rounds. Suffocate the creator."
        },
        option_bait_counter: {
          name: "Bait the counter",
          desc: "Auto-counter armed 2 rounds. Let him think he's in control."
        }
      },
      hitziger_moment: {
        title: "Heated Moment",
        subtitle: "Tempers flaring after that last exchange.",
        option_captain_calm: {
          name: "Captain calms them",
          desc: "+10 composure rest of match. Cool heads prevail."
        },
        option_go_harder: {
          name: "Go harder",
          desc: "+10 defense, +5 tempo. Card risk: 37% (18% red). High stakes."
        },
        option_ignore: {
          name: "Ignore it",
          desc: "No change. Let the game breathe on its own."
        }
      },
      freier_mann: {
        title: "Runner Loose",
        subtitle: "{name} has broken through — someone has to make a decision.",
        option_foul_stop: {
          name: "Tactical foul",
          desc: "Stops the attack cold. VT picks up a yellow (maybe red on second)."
        },
        option_retreat: {
          name: "Retreat and cover",
          desc: "-15% opposing shot this round. Safer, less decisive."
        },
        option_keeper_out: {
          name: "Keeper comes out",
          desc: "50/50: clean win or a forced goal. Coin flip."
        }
      },
      clear_chance: {
        title: "Clear Sight of Goal",
        subtitle: "{name} has the ball, the angle, and the whole goal in view.",
        option_place_flat: {
          name: "Place it flat",
          desc: "+18% immediate shot bonus. Conservative, reliable."
        },
        option_chip_keeper: {
          name: "Chip the keeper",
          desc: "Composure-dependent: +30% if composed, -10% if nervy."
        },
        option_square_lf: {
          name: "Square to the runner",
          desc: "+22% LF takes the shot. Unselfish, often lethal."
        }
      },
      taktikwechsel_opp: {
        title: "They're Changing Shape",
        subtitle: "{opp} is switching to high press — their coach is reacting.",
        option_long_balls: {
          name: "Long balls over the top",
          desc: "+14 offense, -6 vision rest of match. Bypass the press."
        },
        option_hold_possession: {
          name: "Hold possession",
          desc: "+14 vision, +8 composure. Possession lock active."
        },
        option_match_aggression: {
          name: "Match their aggression",
          desc: "+12 tempo, +8 defense, -4 composure. Pressing active."
        }
      },
      playmaker_pulse: {
        title: "Playmaker Pulse",
        subtitle: "{name} is dictating the rhythm. This is the moment to lean into it.",
        option_release_runner: {
          name: "Release the runner",
          desc: "Immediate wide attack with extra vision. Force the next move through the channel."
        },
        option_dictate_tempo: {
          name: "Dictate the tempo",
          desc: "Vision and composure rise for the rest of the match. Lock the game to your rhythm."
        },
        option_thread_risk: {
          name: "Thread the risk",
          desc: "Next build-up gets a major boost, and the playmaker keeps forcing sharper passes."
        }
      },
      opp_keeper_rattled: {
        title: "Keeper Shaken",
        subtitle: "{name} is wobbling. The next decision can turn pressure into a collapse.",
        option_shoot_early: {
          name: "Shoot on sight",
          desc: "Their keeper save rate drops for 2 rounds. Less patience, more volume."
        },
        option_crash_box: {
          name: "Crash the box",
          desc: "Offense and tempo rise immediately. Swarm the second balls and rebounds."
        },
        option_reset_probe: {
          name: "Reset and probe",
          desc: "Boost the next build-up and sharpen the final pass before the shot."
        }
      },
      backline_step_up: {
        title: "Backline Step-Up",
        subtitle: "{name} keeps reading the game. The back line can now set the tone.",
        option_step_in: {
          name: "Step into midfield",
          desc: "Next build-up gets stronger and the whole shape pushes five yards higher."
        },
        option_hold_shape: {
          name: "Hold the shape",
          desc: "Safer block for 2 rounds. Opponent shot quality drops and composure rises."
        },
        option_spring_trap: {
          name: "Spring the trap",
          desc: "Counter stance armed and their next build-ups get shakier."
        }
      },
      red_card_risk: {
        title: "Walking a Line",
        subtitle: "{name} is riled up — one bad tackle away from disaster.",
        option_play_hard: { name: "Play On the Edge", desc: "+14 defense, +6 tempo. But 25% chance of a yellow card." },
        option_play_clean: { name: "Reel It In", desc: "+10 composure, +5 defense. Safe, smart, slower." },
        option_substitute_def: { name: "Sub Him Off", desc: "Swap in a fresh defender from the bench. Reset the fuse." }
      },
      weather_shift: {
        title: "Weather Turn",
        subtitle: "Conditions just changed — the game needs a new plan.",
        option_adapt_tempo: { name: "Adapt", desc: "Slow the game, ride out the conditions. Defense-heavy boost." },
        option_push_through_weather: { name: "Push Through", desc: "Ignore the weather, attack anyway. +12 attack, -6 composure." }
      },
      fan_revolt: {
        title: "Crowd Unrest",
        subtitle: "The stands are restless — boos are starting.",
        option_rally_crowd: { name: "Use It As Fuel", desc: "+14 attack, +8 tempo. Channel the anger forward." },
        option_ignore_noise: { name: "Tune It Out", desc: "+16 composure, +8 vision. Clinical, focused football." }
      },
      opp_star_down: {
        title: "Their Star Is Fading",
        subtitle: "{name} is off the pace — body language says they're done.",
        option_capitalize: { name: "Go For the Throat", desc: "+18 attack, +10 tempo, -4 defense. Don't let them recover." },
        option_stay_disciplined: { name: "Stay Disciplined", desc: "+10 defense, +10 composure, +6 vision. Wait them out." }
      },
      coach_whisper: {
        title: "Assistant's Input",
        subtitle: "Your assistant has an idea.",
        option_trust_coach: { name: "Trust the Call", desc: "Follow the suggested adjustment. Situational but targeted." },
        option_trust_instinct: { name: "Stick With Gut", desc: "Balanced +8 across attack, defense, composure." }
      },
      hot_player: {
        title: "On Fire",
        subtitle: "{name} has scored and looks unstoppable.",
        option_boost: { name: "Keep Him Going", desc: "Permanent +{bonus} to {stat}." },
        option_stabilize: { name: "Hold the Shape", desc: "Protect the lead — defensive stability." }
      },
      crisis_moment: {
        title: "Heads Are Dropping",
        subtitle: "Down {deficit} — the dressing room needs a spark.",
        option_team_talk: { name: "Team Talk", desc: "70% composure+offense boost, 30% fail." },
        option_focus: { name: "Single Focus", desc: "Pressure on one player to turn the tide." },
        option_accept: { name: "Accept & Grind", desc: "Stay compact — form recovery." }
      },
      opp_mistake: {
        title: "They're Cracking",
        subtitle: "{opp} has failed {n} build-ups. The pressure is showing.",
        option_exploit: { name: "Go For It", desc: "Immediate attack with bonus." },
        option_sustain: { name: "Keep the Pressure On", desc: "Sustained build-up malus." }
      },
      legendary_demand: {
        title: "{name} Wants In",
        subtitle: "Your legendary is watching from the bench.",
        option_bring_on: { name: "Bring On {name}", desc: "Sub them in — full legendary impact." },
        option_morale: { name: "Not Yet", desc: "Keep them fresh — small team-wide boost." }
      },
      season_finale: {
        title: "Title Race",
        subtitle: "Final match — points on the table, nerves on edge.",
        option_allin: { name: "Go All-In", desc: "Risk everything — higher ceiling, higher floor." },
        option_controlled: { name: "Controlled Approach", desc: "Steady and clinical." }
      },
      set_piece_awarded: {
        title: "Set Piece",
        subtitle: "Foul deep in their half — how do you deliver it?",
        option_quick_surprise: { name: "Quick & Surprise", desc: "Immediate attack, +24% bonus. Catch them unset." },
        option_delivery_focus: { name: "Work the Delivery", desc: "+14% next build-up, team +6 composure/vision for 2 rounds." }
      },
      legs_gone: {
        title: "Legs Are Going",
        subtitle: "Late in the match and the squad's running on fumes.",
        option_push_anyway: { name: "Push Anyway", desc: "+6 tempo, +4 attack, -8 composure. Hope the adrenaline carries us." },
        option_manage_rhythm: { name: "Manage the Rhythm", desc: "-6 tempo, +8 defense, +10 composure. Preserve and control." }
      },
      tactical_clash: {
        title: "Tactical Clash",
        subtitle: "Your approach is walking into their strength — adjust or commit?",
        option_adapt: { name: "Adapt", desc: "-5 attack, +10 defense, +8 vision. Adjust the plan mid-game." },
        option_double_down: { name: "Double Down", desc: "+14 attack, +6 tempo, -8 defense. Beat them at their own game." }
      },
      referee_stern: {
        title: "Stern Referee",
        subtitle: "The official's whistle is quick — cards await anyone crossing the line.",
        option_play_clean: { name: "Play It Clean", desc: "+10 composure, -4 tempo. No card risk, controlled tempo." },
        option_normal_game: { name: "Keep Playing Normal", desc: "They're wary too: opp -5 tempo for 2 rounds. Mutual caution." }
      }
    },

    log: {
      matchIntro: [
        "{me} vs {opp} — kick-off.",
        "{me} take on {opp}.",
        "{me} vs {opp} — the referee blows.",
        "Both sides ready. {me} vs {opp}."
      ],
      formHot: [
        "🔥 The squad's flying — sharp and hungry.",
        "🔥 Hot streak — confidence through the roof.",
        "🔥 In form. Expect crisp football today."
      ],
      formCrisis: [
        "❄ Shaky confidence. They need a result badly.",
        "❄ Heavy legs and heavy heads. This'll be a grind.",
        "❄ Three poor runs. Something's got to give today."
      ],
      opponentIntro: "  ↳ {parts}",
      kickoffChoice: "  → {name}",
      halftimeHeader: "––– HALF TIME –––",
      halftimeChoice: "  → {name}",
      halftimeRecovery: "Dressing room rest — {count} player(s) back to 80 condition.",
      cardCancelOppTrait: "✦ Card effect nullified their loaded trait.",
      cardDampenOppTrait: "✦ Card effect weakened their loaded trait.",
      // v52.7 — Opp wakes up after our 2-goal scoring streak
      oppWakeUp: "⚠ {opp} reorganize the defense — they have you on their radar.",
      finalChoice: "  → {name}",
      // v52.2 — silent tactic feedback (drain / no effect)
      tacticDrain:           "  ⚡ Tactic cost: {parts}",
      tacticConditionMiss:   "  ⚠ {name}: condition not met — no effect this phase.",
      tacticNoEffect:        "  ⚠ {name}: no effect applied.",
      roundHeader: "ROUND {round}",
      eventPlaymakerRelease: "  ↗ {name} releases the runner early.",
      eventPlaymakerDictate: "  🎼 {name} slows the game to your pace.",
      eventPlaymakerThread: "  🧵 {name} starts threading sharper passes.",
      eventOppKeeperTarget: "  🎯 {name} is targeted from everywhere now.",
      eventCrashBox: "  🧨 Bodies flood the box — every rebound is alive.",
      eventResetProbe: "  🧭 One more clean move — then hit the gap.",
      eventBacklineStepIn: "  ⬆ {name} steps in and compresses the pitch.",
      eventBacklineHold: "  🧱 The line stays compact — fewer gaps, calmer heads.",
      eventBacklineTrap: "  🪤 The back line sits on the cue — one bad pass and you break.",
      eventPlayHardYellow: "  🟨 {name} goes in hard — ref books him. Walking the line now.",
      eventPlayHardClean: "  💢 {name} wins it cleanly on the edge — no card, full impact.",
      eventPlayClean: "  ✓ {name} pulls back — game smart, composure lifted.",
      eventSubDefender: "  ⇄ {out} off, {in} on — fresh defender plugs the gap.",
      eventWeatherAdapt: "  ☔ Shape tightens, tempo drops — adapt to the conditions.",
      eventWeatherPush: "  💨 Ignore the weather — straight through.",
      eventFanRally: "  📣 Crowd noise redirected — team channels it forward.",
      eventFanIgnore: "  🔇 Players tune out — clinical focus.",
      eventStarCapitalize: "  ⚡ Their star is off — pressure on.",
      eventStarDiscipline: "  🛡 Hold shape — don't let them regroup cheap.",
      eventCoachTrust: "  📋 Following the assistant's read — plan engaged.",
      eventCoachInstinct: "  🎯 Gut call — balanced approach.",
      eventSetPieceQuick: "  ⚡ Quick delivery — catch them cold!",
      eventSetPieceDelivery: "  🎯 Work the set piece — patient build-up coming.",
      eventLegsPush: "  💢 Legs heavy — push through anyway.",
      eventLegsManage: "  🧘 Manage the rhythm — preserve and control.",
      eventClashAdapt: "  🔄 Adapting — drop the clashing approach.",
      eventClashCommit: "  ⚔ Doubling down — commit to the fight.",
      eventRefClean: "  ✓ Playing clean — composure over aggression.",
      eventRefNormal: "  ⚖ Both sides wary of the ref — cautious game.",
      roundIntroTied: [
        "Level at {me}:{opp} — anyone's game.",
        "Still goalless. Tension rising.",
        "{me}:{opp} — neither side's giving an inch.",
        "All square. Next goal could decide everything."
      ],
      roundIntroLeading: [
        "{me}:{opp} — holding the advantage.",
        "Up {me}:{opp}. Keep the shape.",
        "{me}:{opp} — in control, for now.",
        "Leading {me}:{opp}. Don't invite them back in."
      ],
      roundIntroTrailing: [
        "{me}:{opp} — need to find a way back.",
        "Chasing the game at {me}:{opp}.",
        "{me}:{opp} — the pressure's mounting.",
        "Behind at {me}:{opp}. Something's got to change."
      ],
      roundIntroFinal: [
        "Last round. Everything's on the line at {me}:{opp}.",
        "Final minutes. {me}:{opp}. No margin for error.",
        "It all comes down to this. {me}:{opp}.",
        "One round left. {me}:{opp}. Make it count."
      ],
      possessionPressure: [
        "  Dominating possession at {pct}% — pushing for an opening.",
        "  {pct}% of the ball — camped in their half.",
        "  Controlling at {pct}% — constant pressure."
      ],
      possessionDominated: [
        "  Pinned back at {pct}% possession.",
        "  Forced deep — barely seeing the ball.",
        "  {pct}% — scrambling to hold shape."
      ],
      activeBuffs: "  📊 {buffs}",
      oppMood: {
        cruising: [
          "{opp} dropping a gear — they're starting to stroll.",
          "{opp} easing off the throttle — the lead is making them comfortable.",
          "{opp} look content — fewer sprints, more passes sideways."
        ],
        bottling: [
          "{opp} tightening up — nerves visible on their faces.",
          "{opp} defending deep now — they can feel us coming back.",
          "{opp} playing like they want to hold on — fear in the shape."
        ],
        rattled: [
          "{opp} retreating into their shell — stopping the bleeding.",
          "{opp} going conservative — every touch pointed backwards.",
          "{opp} parking it — they've stopped trying to play."
        ],
        desperate: [
          "{opp} throwing everyone forward — all-in, nothing to lose.",
          "{opp} going kamikaze — the back line has abandoned ship.",
          "{opp} pressing everything — panicked, dangerous, open."
        ]
      },
      chainAttack: "  ⚡ Quick combination — another chance follows.",
      luckyDouble: "  🍀 {name} steal possession — second attack!",
      counter: "  🔁 Turnover — counter's on.",
      autoCounter: "  ⚡ They gave it away — we pounce.",
      microBoost: "  ⚡ {name} · {stat} ↑ {value} (decision paying off)",
      doubleCounter: "  ⚡⚡ Two attacks wasted — double counter!",
      pressingCap: "  Pressing cuts off their second run.",
      aggressiveThird: "  💥 Wave after wave — a third attack follows.",
      rallyReaction: "  💢 Instant response after conceding.",
      flankRun: "  {name} burns down the wing — extra chance.",
      momentumBuilt: "  Momentum building — consecutive control's paying off.",
      momentumZone: {
        rush:      "  The team's in a rush — everything clicks.",
        leading:   "  We've got the upper hand now.",
        neutral:   "",
        pressured: "  Under pressure — falling back, riding it out.",
        desperate: "  Backs to the wall — last-ditch effort now."
      },
      momentumFumble: "  💥 Overconfidence! The team loses the bubble.",
      htSummaryPressing: "Pressing blocked {n} attacks",
      htSummaryCounters: "Counter system fired {n}x",
      htSummaryMomentum: "Momentum active",
      pressingBeaten: [
        "  {opp} finds the gap — space opens behind the press.",
        "  The line's beaten — {opp} is in behind.",
        "  Pressing bypassed — {opp} has numbers going forward."
      ],
      aggressiveError: [
        "  Too eager — the move breaks down in transition.",
        "  Overcommitted — the ball's lost.",
        "  The urgency costs them — loose ball in midfield."
      ],
      possessionLost: [
        "  Ball given away — {opp} is already moving.",
        "  Sloppy touch — {opp} immediately presses high.",
        "  Turned over in build-up — {opp} ready to counter."
      ],
      defensiveLackOfPunch: [
        "  Compact but toothless — no runners forward.",
        "  The shape's there, but the attack has no bite.",
        "  Too cautious going forward."
      ],
      leadComplacency: [
        "  Comfortable lead — the urgency fades.",
        "  Two up — maybe a touch too relaxed.",
        "  The legs stop working as hard with a cushion."
      ],
      deficitNervousness: [
        "  Chasing the game — tension's affecting the passing.",
        "  The deficit's showing — decisions rushed.",
        "  Behind and pressing — mistakes creeping in."
      ],
      allInExposed: [
        "  All-in and caught open — {opp} finds the space.",
        "  The gamble backfires — {opp} has acres behind.",
        "  All men forward — {opp} finds the gap."
      ],
      attackingExposed: [
        "  Attacking shape leaves gaps — {opp} exploits it.",
        "  High line, thin cover — {opp} runs straight through.",
        "  Going forward costs them — {opp} hits on the break."
      ],
      aggressiveExposed: [
        "  Aggressive press punished — {opp} through on goal.",
        "  Too high, too open — {opp} finds the channel.",
        "  The aggression turns against them — {opp} in space."
      ],
      synergyCombo: [
        "{a} & {b} combine",
        "{a} sets up {b}",
        "Quick exchange — {b} finishes",
        "{a} finds {b} in space",
        "One-two: {a} to {b}"
      ],
      ownGoal: "⚽ GOAL {name}!{suffix}   {me}:{opp}",
      ownGoalCombo: "⚽ GOAL {name}! {combo}   {me}:{opp}",
      oppGoal: "💥 {name} ({team}) scores   {me}:{opp}",
      fullTime: "🏁 FULL TIME — {me}:{opp}",
      epilogueWin: [
        "Three points. Job done.",
        "Hard-earned — but worth it.",
        "The squad delivers when it matters.",
        "Deserved. Clinical when it counted."
      ],
      epilogueDraw: [
        "A point each. Both sides left something out there.",
        "Honours even — could've gone either way.",
        "A hard-fought draw. On to the next."
      ],
      epilogueLoss: [
        "Heads drop. A tough one to take.",
        "Not good enough today. Regroup.",
        "They were sharper. A lesson to learn from."
      ],
      extratimeIntro: "⏱ EXTRA TIME — {me}:{opp} after 90. Who still has legs?",
      extratimeHalf: "🕐 EXTRA TIME · HALF {n}",
      extratimeGoalMe: "⚽ {name} strikes in extra time! {me}:{opp}",
      extratimeGoalOpp: "😱 {scorer} scores for {opp} — {me}:{oppScore}",
      extratimeNoGoalMe: "  Extra-time chance — over the bar.",
      extratimeNoGoalOpp: "  {opp} blaze it high — let off the hook.",
      extratimeEnd: "⏱ END OF EXTRA TIME — {me}:{opp}",
      extratimeStillTied: "  Still level. Penalties decide it.",
      shieldBlocked:  "{shield} — {oppCard} absorbed, the move dies on impact.",
      shieldHalved:   "{shield} — reading the build-up. {oppCard} lands at half strength.",
      shieldRevealed: "👁 Intel leak — {oppCard} loading. We'll see it coming.",
      penaltiesIntro: "🏁 90 MINUTES — {me}:{opp}. Penalties.",
      penaltiesTitle: "⚽ SHOOTOUT — who'll hold their nerve?",
      penaltyScored: "  {num}. ⚽ — {me}:{opp}",
      penaltyMissed: "  {num}. ✗ — {me}:{opp}",
      oppPenaltyScored: "  {name} scores — {me}:{opp}",
      oppPenaltyMissed: "  {name} misses — {me}:{opp}",
      suddenDeath: "  Sudden death: {me}:{opp}",
      penaltiesWin: "🏆 WIN ON PENALTIES",
      penaltiesLoss: "💥 OUT ON PENALTIES",
      tacticPressingTrigger: "  Pressing pays — ball won.",
      tacticCounterTrigger: "  Counter set — next move boosted.",
      tacticRallyTrigger: "  💪 Rally fires — +{bonus} from the deficit.",
      tacticHighPressTrigger: "  High press — ball recovered.",
      tacticFinalPressTrigger: "  ⚡ Final press — counter launched.",
      tacticGambleWin: "  🎲 Gamble lands — +35 team offense.",
      tacticGambleLoss: "  🎲 Gamble flops — -15 to every stat.",
      tacticShakeUp: "  🔄 Shake-up: {name} punished, team sharpens.",
      tacticLoneWolf: "  🐺 Lone wolf: {name} carries it.",
      tacticFortress: "  🛡 Fortress: {tw} & {vt} lock the back.",
      tacticMasterclass: "  🎼 Masterclass: {name} conducts.",
      tacticFit: "  ✓ {name} — conditions met, bonus applied.",
      laserPass: "🎯 {name} — laser pass, counter's on.",
      bulldoze: "🛡 {name} — bulldozes through, ball won.",
      hardTackle: "🥾 {name} — hard tackle, counter!",
      chessPredict: "♟ {name} — reads it perfectly, goal's wiped out.",
      speedBurst: "💨 {name} — build-up guaranteed.",
      pounce: "🐆 {name} — pounces on the error.",
      oppBlitzCounter: "  ⚡ {name} ({team}) hits back immediately.",
      shadowStrike: "{name} — phantom run, sudden chance.",
      streetTrick: "{name} — leaves the defender standing.",
      silentKiller: "{name} — first touch, maximum damage.",
      cannonBlast: "{name} — fires.",
      ghostRun: "{name} — appears from nowhere.",
      puzzleConnect: "{name} — the final piece.",
      nineLives: "🐱 {name} — cleared off the line. Still alive.",
      killerPass: "⚡ {name} — that pass opens another chance.",
      maestroCombo: "🎼 {name} — the combination clicks. Next goal counts double.",
      unstoppable: "🚀 {name} — through on goal, no stopping that.",
      godMode: "⭐ {name} — everything's clicking. Next goal counts triple.",
      unbreakable: "🛡 {name} — stands firm. Goal cancelled.",

      synergyAmplified: "  🔗 Pressing synergy — decision amplified.",
      synergyConflict: "  ⚠ Tactic conflict — decision reduced.",
      synergyPressingCombo: "  🔗 Pressing + pressing decision — in the zone.",
      synergyPossessionPM: "  🔗 Possession + playmaker focus — style coherence bonus.",
      conflictPressingAfterPossession: "  ⚠ Pressing after possession kickoff — energy misaligned.",
      conflictPressingCollapse: "  ⚠ Pre-existing misfit — pressing decision carrying risk.",
      conflictPlayerCrisis: "  ⚠ Player in crisis — focus is risky.",
      conflictPlayerHot: "  🔗 Player in form — focus amplified.",
      conflictLegendarySub: "  🔗 Legendary incoming — impact amplified.",

      // Focus-Log-Keys entfernt — Focus-System deprecated.

      misfitPressingCollapse: "  ⚠ Pressing collapses — legs can't sustain it.",
      misfitCounterStall: "  ⚠ Counter stalls — no one quick enough to run.",

      eventHotPlayerBoost: "  🔥 {name} gets the nod — permanent {stat} boost locked in.",
      eventHotPlayerStabilize: "  🛡 Shape held — individual flair reined in for team stability.",
      eventCrisisTeamTalk: "  📢 The message lands — squad rallied.",
      eventCrisisTeamTalkFailed: "  The message didn't land.",
      eventCrisisFocus: "  🎯 One player carries the burden.",
      eventCrisisAccept: "  Heads down, grind it out.",
      eventOppMistakeExploit: "  ⚡ Immediate attack — capitalising on their breakdown.",
      eventOppMistakeSustain: "  🏃 Pressing sustained — opponent under continuous strain.",
      eventLegendaryBringOn: "  ⚜ {name} is on. This just changed.",
      eventLegendaryMorale: "  The bench rallies the team — small boost across the board.",
      eventSeasonFinaleAllIn: "  🔥 All-in for the title — no holding back.",
      eventSeasonFinaleControlled: "  Composed and controlled — let the game come to them.",

      eventStrikerLayoff: "  ↺ {name} drops back — ball recycled through midfield.",
      eventStrikerPush: "  💪 {name} pushes through it — trust in the shot.",
      eventStrikerSwap: "  ⇄ {out} off, {in} on — fresh legs up top.",
      eventKeeperLaunch: "  🧤→⚡ {name} launches it long — counter's on.",
      eventKeeperSolid: "  🛡 {name} stays calm — save cushion for the rest.",
      eventOppStrikerPress: "  🏃 Press the frustrated striker — {name} under the cosh.",
      eventOppStrikerGuard: "  🛡 Guard the desperate shot from {name}.",
      eventMomentumTimeout: "  🕐 Timeout — the squad recomposes.",
      eventMomentumSwitch: "  ⚙ Shape switched — defensive counter stance live.",
      eventCorridorDouble: "  ↪ {name} goes again — same channel, same mayhem.",
      eventCorridorSwitch: "  ↔ Ball into the middle — centre opens up.",
      eventOppPmHigh: "  ⬆ Push up on {name} — gambling the high line.",
      eventOppPmMark: "  🎯 {name} double-marked — service cut.",
      eventOppPmBait: "  🎣 Let him play — counter trap armed.",
      eventHitzigCalm: "  🧘 Captain steadies the squad.",
      eventHitzigClean: "  😤 {name} stays sharp — no card.",
      eventHitzigYellow: "  🟨 {name} — yellow card.",
      eventHitzigSecondYellow: "  🟨🟥 {name} — second yellow. Sent off.",
      eventHitzigRed: "  🟥 {name} — straight red. Sent off.",
      eventHitzigIgnore: "  The tension lingers.",
      eventFreierFoul: "  🟨 {name} brings the runner down — yellow card.",
      eventFreierFoulRed: "  🟨🟥 {name} — second yellow. Sent off.",
      eventFreierRetreat: "  Retreating to cover — shot quality reduced.",
      eventFreierKeeperWin: "  🧤 {name} wins it at his feet — cleared!",
      eventFreierKeeperLose: "  ⚽ {opp} rounds {name} — open net.",
      eventClearFlat: "  📏 {name} — flat, calm, into the corner.",
      eventClearChip: "  🌙 {name} chips — high risk, high reward.",
      eventClearSquare: "  ⇄ {st} squares it to {lf} — tap-in attempt.",
      eventTaktikLong: "  📏 Long balls over the top.",
      eventTaktikHold: "  🎯 Hold the ball — possession lock engaged.",
      eventTaktikMatch: "  💥 Match their aggression — pressing engaged.",

      cardYellow: "  🟨 {name} — yellow card.",
      cardRed:    "  🟥 {name} — red card. Suspended for the next match.",

      streak: {
        myTeam: {
          zone:       "  🔥 {name} is in the zone — sharp as glass.",
          cold:       "  ❄ {name} is cold — the confidence is gone.",
          frustrated: "  😤 {name} is frustrated — short fuse."
        },
        oppTeam: {
          zone:       "  🔥 {name} ({team}) is in the zone — watch him.",
          cold:       "  ❄ {name} ({team}) has gone cold.",
          frustrated: "  😤 {name} ({team}) is losing his head."
        }
      },

      oppTrait: {
        sturmShot: "  {name} ({team}) — precision striking, every shot counts.",
        sniperShot: "  {name} ({team}) — picks his spot, clinical finish.",
        riegelDeny: "  {name} ({team}) — saves getting harder to make.",
        presserDisrupt: "  {name} ({team}) — high press disrupts the build-up.",
        ironwallEarly: "  {name} ({team}) — defensive wall up early, nearly impenetrable.",
        clutchSurge: "  {name} ({team}) — late surge, energy levels rising.",
        bulwarkDeny: "  🛡 {name} ({team}) — bulwark! Ball scrambled off the line."
      },
      oppRageAttack: "  🔥 {team} — rage offensive: throwing everything forward.",
      attackCapped: "  ⚠ Too much pressure at once — attacking momentum rolls to the next chance.",
      pressingResisted: "  ⚠ {opp} thrives on pressure — your press bounces off.",
      aggressiveResisted: "  ⚠ {opp} counter-presses — your aggression creates no extra openings.",
      oppMoveTelegraph: "  ▸ {opp} loads: {name} [{sev}]",
      oppMoveQuiet: "  · {opp}: {name}",
      // v0.50 — Soft-defuse log. Emitted when the player played a
      // defense/counter card this round and active defense buff ≥ 8.
      // cls='player-shield' so telemetry tracking counts it as defused.
      oppMoveSoftDefused: "  ✓ Defense buffer absorbs {name} — dampens the effect.",
      oppMove: {
        quickStrike: "  ⚡ {opp} — quick strike!",
        extraAttack: "  ▸ {opp} presses on!",
        counterBlitz: "  ↺ {opp} — counter after save!",
        signatureGoal: "  🎯 {opp} unleashes the signature play — unblocked!"
      }
    },
    // v0.47 — Counter hints per opp-move category. Shown as a second
    // line after the telegraph (only severity ≥ 2), so the player knows
    // which kind of card can counter. Kept general — precise "card X
    // counters move Y" mapping is phase 2. Deliberately a signpost, not
    // a guarantee.
    oppMoveCounter: {
      aggressive: "    ↳ Counter: Defense cards soften the attack (Drop Deep, Tight Shape, Zone Defense).",
      lockdown:   "    ↳ Counter: Combo card with Flow ≥ 2 breaks the wall (Break the Line, Hero Moment, Masterclass).",
      disruption: "    ↳ Counter: Medic absorbs foul damage. Defense cards dampen disruption.",
      setup:      "    ↳ Counter: Disrupt early — Ball Recovery or trigger cards break their setup.",
      big:        "    ↳ Counter: Heavy threat — stack Flow, then fire a counter or combo card."
    },
    // v0.48 — Tooltips on log lines. One short mechanical explanation
    // per cls class. Attached in ui.js:appendLog via data-kl-tip, shown
    // on hover by the global KL.tip system. Goal: player understands
    // what a log category means without needing the codex.
    logTip: {
      trigger:         "A trait fires. Reads as: player · trait · effect. Buff values appear in brackets.",
      cardPlay:        "Card resolved. Score the per-stat chips one by one. The phase chip shows fit — green for boost, gold for neutral, red for misfit (effect halved).",
      cardSummary:     "End-of-round card recap. Aggregates the total stat shift from everything you played this round.",
      playerShield:    "Counter card landed. An opponent move was blocked, dampened, or absorbed. Compare to the threat banner above to see what got neutralised.",
      microBoost:      "Small short-term stat bump — from a win streak, role affinity, or an event window. Not from a card.",
      conditionGain:   "Player regained condition. Above 50 keeps stats clean; below 50 → −3 all stats; below 25 → −6.",
      roleAffinity:    "Role match bonus. The right card landed on the right player — extra stat value applied this round.",
      interruptChoice: "Your tactic pick for this phase. The bracket shows the net team buff; any (TW DEF +N) tail shows direct personal stat boosts.",
      tacticFeedback:  "Active tactic firing this round. Brackets show what's currently shifting — separate from card buffs.",
      streak:          "Form-driven bump: hot streaks add, cold streaks subtract. Tied to recent matches, not this one.",
      oppCard:         "Opponent played a card. Effect lasts the round (or longer for big-moves). A counter or defense card can dampen it next round.",
      oppSave:         "Their keeper saved. Their DEF + CMP vs your OFF + ST condition decides this — fatigue kills shots more than you'd think.",
      oppAdapt:        "Opp tuned to your most-played card type — a small targeted defensive stat bump on their side. Diversify to dodge it.",
      fatigueCost:     "Card costs condition for the matching role. Watch the thresholds: <50 → −3 all stats, <25 → −6. Recovery cards (breather, rotation, medic) are free of this drain.",
      cardYellow:      "Yellow card — a second yellow flips to red. Sub the player before pressing your luck.",
      cardRed:         "Red card — player ejected this match, suspended next. An academy fallback fills the slot until they're back.",
      phaseShift:      "Match phase changed (Buildup → Attack, etc.). Cards re-rate by phase fit; the EV chips on your hand update accordingly."
    }
  },

  tactic: {
    misfit: {
      aggressiveSlow: "  ⚠ Squad lacks pace for aggressive press — fatigue risk elevated.",
      defensiveNoVision: "  ⚠ No playmaker vision — deep block has no outlet.",
      tempoOutpaced: "  ⚠ Tempo game backfires — opponent is faster.",
      pressingNoLegs: "  ⚠ Not enough legs for sustained pressing — collapse incoming.",
      possessionNoVision: "  ⚠ No vision to hold possession — turnovers will hurt.",
      counterNoRunner: "  ⚠ No quick runner — counter threat blunted.",
      flankCutOut: "  ⚠ Flank runs cut out — opponent's shape neutralises width."
    }
  },

  stats: {
    offense: "Attack",
    defense: "Defense",
    tempo: "Tempo",
    vision: "Vision",
    composure: "Composure"
  },
  generated: {
    masteryName: "{label} Mastery",
    masteryDesc: "Evolution from {parent}: amplifies {stats}. The parent trait's 30% stronger."
  },
  logs: {
    ownBuildFail: [
      "{pm} loses it in midfield — possession's gone.",
      "The pass from {pm} is cut out by {oppVT}.",
      "{vt} plays it backwards — the move stalls.",
      "{pm} tries to force it — {oppPM} intercepts.",
      "{oppPM} wins the ball back with a crunching press.",
      "Turnover. {oppPM} and {oppVT} transition immediately.",
      // v52.6 — chained reaction phrasing
      "{pm} is dispossessed — {opp} springs forward on the break.",
      "{vt}'s clearance falls right to {oppPM} — pressure straight back on us.",
      "{pm} shapes for the through-ball but {oppVT} reads it perfectly.",
      "Press from {opp} forces {pm} into a hospital pass — picked off.",
      "{vt} mishits the long ball, {opp} starts a counter from our half.",
      "Build-up stalls — {pm} can't find an outlet, ball recycled to the keeper."
    ],
    ownBuildSuccess: [
      "{pm} slides it through — {lf}'s running.",
      "{pm} finds the gap, {lf} takes it on.",
      "Quick ball from {vt}, {pm} releases {lf} in behind.",
      "{pm} switches play — {lf}'s in space.",
      "{lf} accelerates past his marker.",
      "{pm} drives forward, {lf} makes the overlap.",
      "Neat combination — {pm} to {lf}, ball into the box.",
      // v52.6 — chained variants
      "{pm} feints, slips it through {lf} — defender stranded.",
      "{vt} clips it long, {pm} controls on the half-turn and feeds {lf}.",
      "{lf} drives at the fullback, drops the shoulder — past him.",
      "One-two between {pm} and {lf}, opens the channel cleanly.",
      "{pm} threads it, {lf} bursts onto it — backline scrambling to recover.",
      "{vt} steps out with it, finds {pm} in the pocket — quick release."
    ],
    chance: [
      "{scorer} shapes to shoot...",
      "{scorer} gets on the end of it...",
      "{scorer} cuts inside, finds the angle...",
      "{scorer}'s one-on-one...",
      "{scorer} arrives late — powerful effort...",
      "{scorer} has time and space...",
      // v52.6 — variants
      "{scorer} swivels in the box, lines it up...",
      "{scorer} steals a yard, fires...",
      "{scorer} meets the cross at full stretch...",
      "{scorer} takes a touch, looks up, strikes..."
    ],
    miss: [
      "{scorer} drags it wide.",
      "{scorer} hits the post — so close.",
      "{scorer} skies it — well over.",
      "Blocked! {scorer} can't believe it.",
      "{scorer} hesitates — the chance is gone.",
      "{scorer} gets under it — up and over.",
      // v52.6 — chained reaction phrasing
      "{scorer} pulls the trigger — defender flings himself in the way.",
      "Right at the keeper from {scorer} — gathered comfortably.",
      "{scorer} tries to chip it — too much air, drifts wide.",
      "{scorer} curls one — kisses the woodwork and out.",
      "Heavy touch from {scorer} — keeper smothers before he can shoot.",
      "{scorer} leans back, balloons it into row Z."
    ],
    oppKeeperSave: [
      "{keeper} ({team}) palms {scorer}'s effort away.",
      "{keeper} ({team}) — big hands, {scorer} denied.",
      "{scorer} forces the save — {keeper} ({team}) holds it.",
      "{keeper} ({team}) reads {scorer} perfectly — tipped over.",
      "Point-blank from {scorer} — {keeper} ({team}) stands tall.",
      "{keeper} ({team}) dives full stretch — {scorer} can't believe it."
    ],
    oppBuildFail: [
      "{opp} ({team}) loses it — {vt} reads the play.",
      "Pressure from {vt} forces {opp} ({team}) into a poor touch.",
      "{opp} ({team}) tries to play out — {vt} intercepts.",
      "The pass from {opp} ({team}) is sloppy — our ball.",
      "{vt} wins it cleanly off {opp} ({team}).",
      // v52.6 — variants
      "{vt} steps in front of {opp} ({team}) — turnover, we transition.",
      "{opp} ({team}) gets caught dwelling on it — {vt} pounces.",
      "Press from {pm} suffocates {opp} ({team}) — ball recovered.",
      "{opp} ({team}) overhits the through-ball — straight to {tw}.",
      "{vt} times the slide perfectly — {opp} ({team}) furious."
    ],
    oppApproach: [
      "{opp} ({team}) advances with purpose.",
      "{oppPM} releases {opp} — numbers forward.",
      "{oppPM} works it into {opp} — dangerous position.",
      "{opp} ({team}) finds space in behind.",
      "{oppPM} isolates the backline — {opp} incoming.",
      // v52.6 — variants
      "Quick switch to {opp} ({team}) on the flank — chance building.",
      "{opp} ({team}) carries the ball at speed, defenders backpedalling.",
      "{oppPM} threads it, {opp} ({team}) is in.",
      "Aerial duel for the long ball — {opp} ({team}) wins it.",
      "{opp} ({team}) pulls wide, looks for the cross."
    ],
    save: [
      "{tw} — strong hands on {shooter}'s effort. Stays out.",
      "{tw} dives full stretch — {shooter} denied.",
      "{vt} throws himself in {shooter}'s path — blocked.",
      "{tw} smothers {shooter} at the near post.",
      "Tipped over by {tw} — {shooter} ({team}) can't believe it.",
      "{vt} clears off the line — crucial on {shooter}.",
      // v52.6 — chained reaction phrasing
      "{tw} stands up tall, {shooter} ({team}) can't beat him.",
      "Reflex save from {tw} — pushes the rebound to safety too.",
      "{vt} reads the cutback, snuffs out {shooter} before he can shoot.",
      "{tw} comes off his line — closes the angle, {shooter} skews it wide.",
      "Double save! {tw} keeps out {shooter}, then the follow-up too.",
      "{vt} gets a vital block on {shooter} — corner, but the danger's gone."
    ]
  },
  // v0.42 — Narrative layer (top-level, sibling of `ui` and `data`).
  // See de.js for the full design note. Same placeholder contract:
  // {shooter}, {role}, {setupHint}, {triggerHint}, {comboHint}.
  narrative: {
    goalBuildup: {
      variants: [
        "Built up through {setupHint} — {shooter} finishes.",
        "{setupHint} cracks the gap open, {shooter} is right there.",
        "After {setupHint}: {shooter} tucks it away.",
        "{setupHint}, then {triggerHint} — {shooter} strikes.",
        "The chain from {setupHint} to {triggerHint} puts {shooter} in.",
        "{triggerHint} bursts through — {shooter} converts.",
        "{comboHint}! {shooter} lands the blow.",
        "{shooter} finds the gap.",
        "{shooter} slides it home."
      ]
    },
    cards: {
      switch_lane:    { buildupHint: "a switch of flanks" },
      drop_deep:      { buildupHint: "a deep build-up" },
      quick_build:    { buildupHint: "a quick transition" },
      triangle_play:  { buildupHint: "a triangle" },
      long_ball:      { buildupHint: "a long ball" },
      overlap_run:    { buildupHint: "an overlapping run" },
      forward_burst:  { buildupHint: "a forward burst" },
      hope_shot:      { buildupHint: "a half-field cross" },
      grind_through:  { buildupHint: "a physical muscle-through" },
      hero_moment:    { buildupHint: "the Hero Moment" },
      masterclass:    { buildupHint: "the Masterclass" },
      clinical_finish:{ buildupHint: "the Clinical Finish" },
      lone_striker:   { buildupHint: "the lone-striker run" },
      set_piece:      { buildupHint: "a set piece" },
      flank_overload: { buildupHint: "the flank overload" },
      break_the_line: { buildupHint: "a line-break" }
    },
    // Conceded-goal narrative. Context comes from OUR tactical state
    // (exposureHint) and from a thematically-relevant opponent trait
    // (oppTraitHint). The templates answer "why did we concede?"
    // rather than just logging the mechanical event.
    oppGoalBuildup: {
      variants: [
        "Our {exposureHint} punished — {oppScorer} converts.",
        "After our {exposureHint} — {oppScorer} strikes back.",
        "{exposureHint} exposed us — {oppScorer} takes the gap.",
        "{oppTraitHint} cuts through — {oppScorer} finishes.",
        "Classic {oppTraitHint}: {oppScorer} buries it.",
        "{oppTraitHint} meets our {exposureHint} — {oppScorer} delivers.",
        "{oppScorer} punishes the positional slip.",
        "{oppScorer} is left free and finishes.",
        "{oppScorer} pulls the trigger and buries it."
      ],
      exposure: {
        all_in:        "all-in gamble",
        attack_phase:  "push forward",
        aggressive:    "aggressive press",
        no_cards:      "card-less round"
      },
      oppTrait: {
        sniper:         "sniper strike",
        sturm:          "storm-roller push",
        konter_opp:     "counter-strike",
        clutch_opp:     "ice-cold moment",
        lucky:          "lucky bounce",
        rage_mode:      "rage-mode burst",
        counter_threat: "double-counter"
      }
    },
    // v0.43 — Post hits (both sides). 4% chance per goal event that the
    // shot cracks off the woodwork instead of finding the net. Separate
    // scene name per side (anti-repetition tracked independently).
    postHitMine: {
      variants: [
        "Built up through {setupHint} — {shooter} cracks it off the bar.",
        "After {setupHint} — {shooter} finds only woodwork.",
        "{triggerHint} puts {shooter} through — and only the post denies them.",
        "{shooter} hits the post — gasps around the stadium.",
        "Post! {shooter} has no luck.",
        "The crossbar bails them out — {shooter} was that close.",
        "{shooter} hits from distance — aluminium only.",
        "{shooter} finds only woodwork."
      ]
    },
    postHitOpp: {
      variants: [
        "{oppScorer} hits the post — we got away with one.",
        "Post! {oppScorer} was through — and the frame saves us.",
        "The bar denies {oppScorer}.",
        "Aluminium saves us — {oppScorer} in disbelief.",
        "{oppScorer} hits only iron — our luck.",
        "{oppScorer} cracks the post — the ball rolls along the line and away."
      ]
    },
    // v0.44 — Offside (both-sided, 3%). Goal gets chalked off because
    // someone was a step too far. Anti-repetition per match, separate
    // per scene.
    offsideMine: {
      variants: [
        "{shooter} finds the net — but the flag goes up. Offside.",
        "Offside! {shooter} was a shoulder too far.",
        "{shooter} left too early — goal chalked off.",
        "Whistle and flag — {shooter} offside.",
        "{shooter} puts it in, but the ref points to the line."
      ]
    },
    offsideOpp: {
      variants: [
        "{oppScorer} finds the net — but the flag goes up. Offside, lucky us.",
        "Offside! {oppScorer} was a shoulder too far — goal chalked off.",
        "{oppScorer} left too early — whistle, no goal.",
        "The flag saves us — {oppScorer} was three steps past the line.",
        "{oppScorer} celebrates — but the goal doesn't count. Offside."
      ]
    },
    // v0.44 — Inline penalty kick. Three phases per penalty: intro,
    // outcome (covering all three results goal/save/miss). Separate pools
    // per side (Mine/Opp) for anti-repetition and proper framing.
    penaltyIntroMine: {
      variants: [
        "Foul in the box! The referee points to the spot — penalty to us.",
        "Penalty! {shooter} sets the ball down.",
        "Unfair challenge inside the area — {shooter} steps up.",
        "Whistle in the box. {shooter} grabs the ball."
      ]
    },
    penaltyIntroOpp: {
      variants: [
        "Foul in our own box. Penalty against us.",
        "Penalty to them! {shooter} sets the ball down.",
        "Needless challenge inside the area — penalty whistle.",
        "The referee points to the spot. {shooter} comes up."
      ]
    },
    penaltyGoalMine: {
      variants: [
        "{shooter} converts coolly.",
        "{shooter} drills it low into the corner — goal.",
        "{shooter} slots it home. {keeper} went the wrong way.",
        "{shooter} dummies {keeper} — and finishes."
      ]
    },
    penaltyGoalOpp: {
      variants: [
        "{shooter} converts safely. {keeper} had no chance.",
        "{shooter} blasts it into the far corner — goal.",
        "{shooter} finishes ice-cold from the spot. {keeper} went the wrong way.",
        "{shooter} slots it low — unstoppable for {keeper}."
      ]
    },
    penaltySaveMine: {
      variants: [
        "{keeper} saves! The penalty stays in his hands.",
        "{keeper} gets down — save of the match.",
        "{keeper} reads it — {shooter} can't believe it.",
        "{keeper} saves with his boot — what a reflex."
      ]
    },
    penaltySaveOpp: {
      variants: [
        "{keeper} saves! What a reflex.",
        "{keeper} reads the corner and parries — the stadium erupts.",
        "{keeper} stretches full and claws it — {shooter} in disbelief.",
        "{keeper} has it! Save in the top corner."
      ]
    },
    penaltyMissMine: {
      variants: [
        "{shooter} blazes it over — head in hands.",
        "{shooter} cracks the post — ball bounces back out.",
        "{shooter} lifts it over the bar — wasted.",
        "{shooter} pulls it wide — chance gone."
      ]
    },
    penaltyMissOpp: {
      variants: [
        "{shooter} blazes it over — we got lucky.",
        "{shooter} cracks the post — ball bounces out.",
        "{shooter} lifts it over the bar — we breathe.",
        "{shooter} pulls it wide — missed."
      ]
    },
    // v0.45 — Match-End drama: extra narrative line before the standard
    // epilogue when the match falls into a dramaturgical category.
    // Placeholders {me} and {opp} are the final scores.
    matchEndDrama: {
      comeback_win: [
        "Comeback of the match — we were on the ropes, final {me}:{opp}.",
        "Turned the deficit around — what a performance. Final {me}:{opp}.",
        "The team pulls a loss into a win — {me}:{opp}. Hat off.",
        "The match was slipping, but we dragged it back. {me}:{opp}."
      ],
      collapse_loss: [
        "Collapse in the final stretch — a lead becomes a loss. {me}:{opp}.",
        "Threw away the lead. Couldn't be bitterer. {me}:{opp}.",
        "We had the match in hand — and let it slip. {me}:{opp}.",
        "Ahead, then losing. {me}:{opp} — that hurts."
      ],
      last_minute_win: [
        "Last-minute goal — stadium erupts. {me}:{opp}.",
        "A late strike decides the match. {me}:{opp}.",
        "Found the net in stoppage time — {me}:{opp}. What a thriller."
      ],
      last_minute_loss: [
        "Late concession — the points are gone. {me}:{opp}.",
        "Conceded at the death. {me}:{opp} — brutal.",
        "Lost at the end what we thought we'd won. {me}:{opp}."
      ],
      shutout_win: [
        "Clean sheet — the defense stood like a wall. {me}:{opp}.",
        "No goals conceded, clear win. {me}:{opp}. This defense holds.",
        "The zero stands — with {me} of our own. {me}:{opp}."
      ],
      shutout_loss: [
        "Not a single goal of our own, and the defense cracks. {me}:{opp} — sobering.",
        "Shut down in attack, outplayed in defense. {me}:{opp}.",
        "Nothing forward, everything back. {me}:{opp}."
      ],
      blowout_win: [
        "Goal fest — we roll over the opponent. {me}:{opp}.",
        "The scoreline speaks for itself: {me}:{opp}. Can't be clearer.",
        "A power display on the pitch. {me}:{opp}."
      ],
      blowout_loss: [
        "We get rolled — {me}:{opp}. Nothing to take home today.",
        "A painful lesson. {me}:{opp} — we need to digest this.",
        "The opponent was superior in every aspect. {me}:{opp}."
      ],
      nail_biter_win: [
        "A thriller to the last minute — we squeeze through. {me}:{opp}.",
        "Paper-thin win. {me}:{opp} — nerves held.",
        "It was on a knife-edge. {me}:{opp}, lucky to go home."
      ],
      nail_biter_loss: [
        "Lost on the knife-edge — {me}:{opp}. So close.",
        "A single goal separates us from points. {me}:{opp}.",
        "Close but no cigar. {me}:{opp}."
      ],
      goal_fest_draw: [
        "Goal fest with an open ending — both sides give everything. {me}:{opp}.",
        "A spectacle no one wins. {me}:{opp}. But pure entertainment.",
        "Nine goals in ninety minutes — a football feast. {me}:{opp}."
      ]
    }
  },
  data: {
    evoLabels: {
      titan: "Titan", fortress: "Fortress", shotstopper: "Shot Stopper",
      libero_keeper: "Libero Keeper", distributor: "Distributor", highline: "High-Liner",
      acrobat: "Acrobat", wall: "Wall", catman: "Cat Man",
      enforcer: "Enforcer", bulldozer: "Bulldozer", captain_cool: "Captain Cool",
      shark: "Shark", terminator: "Terminator", whirlwind: "Whirlwind",
      orchestrator: "Orchestrator", late_bloomer: "Late Bloomer", scholar: "Scholar",
      metronome: "Metronome", architect: "Architect", whisperer: "Whisperer",
      hunter: "Hunter", gegenpress: "Gegenpress", shadow: "Shadow",
      maestro_mid: "Maestro", chess: "Chessmaster", conductor_mid: "Conductor",
      speedster: "Speedster", rocket: "Rocket", freight: "Freight Train",
      magician: "Magician", street: "Street Baller", trickster: "Trickster",
      ironman: "Ironman", dynamo: "Dynamo", eternal: "Eternal",
      assassin: "Assassin", predator_s: "Predator", opportunist: "Opportunist",
      cannon: "Cannon", skyscraper: "Skyscraper", brick: "Brick",
      ghost: "Ghost", puzzle: "Puzzle", chameleon: "Chameleon"
    },
    roles: {
      TW: { label: "Goalkeeper", desc: "Wins one-on-ones" },
      VT: { label: "Defender", desc: "Back-line anchor" },
      PM: { label: "Playmaker", desc: "Orchestrates attacks" },
      LF: { label: "Runner", desc: "Chaos engine" },
      ST: { label: "Striker", desc: "Finisher" }
    },
    archetypes: {
      keeper_block: "Blocking Keeper", keeper_sweep: "Sweeper Keeper", keeper_reflex: "Reflex Keeper",
      def_wall: "Concrete Wall", def_tackle: "Biter", def_sweeper: "Libero",
      pm_regista: "Regista", pm_press: "Press Engine", pm_playmaker: "Playmaker",
      lf_winger: "Wing Burner", lf_dribbler: "Dribbler", lf_box: "Box-to-Box",
      st_poacher: "Poacher", st_target: "Target Man", st_false9: "False Nine"
    },
    traits: {
      titan_stand: { name: "Titan Stance", desc: "Stands like a wall when the game's on a knife-edge — with a score gap of ≤1, shots are 30% more likely to be stopped." },
      fortress_aura: { name: "Fortress Aura", desc: "His presence reflects onto the back line — while the keeper plays, the defender gets +6 defense." },
      clutch_save: { name: "Clutch Save", desc: "Rises exactly when the clock's ticking down — rounds 5-6: +20% save rate." },
      sweep_assist: { name: "Sweep Assist", desc: "Catches the ball and launches it straight into attack — after any save +8% to the next build-up." },
      laser_pass: { name: "Laser Pass", desc: "The counter is lit from his hands in seconds — after a save, 20% chance to trigger an instant counter." },
      offside_trap: { name: "Offside Trap", desc: "Step out in sync, tear the line open — 15% of enemy attacks are tempo-based neutralized." },
      acrobat_parry: { name: "Acrobatics", desc: "Spectacular follow-save, ball still in play — after a save once per match, +12% save chance on the next shot." },
      wall_effect: { name: "Wall", desc: "A wall between ball and net, but the offensive spark is dampened — +15% permanent save rate, but -10% own build-up." },
      nine_lives: { name: "Nine Lives", desc: "Lands on his feet like a cat, the first hit bounces off — once per match, the first goal conceded is cancelled." },
      intimidate: { name: "Intimidate", desc: "His look alone unsettles the enemy striker — the enemy ST gets -5 offense." },
      bulldoze: { name: "Bulldozer", desc: "Throws himself into every enemy shot — 10% chance per round to steal the ball before the finish." },
      captain_boost: { name: "Captain", desc: "Brings calm to the whole team on the pitch — every teammate gets +3 composure." },
      blood_scent: { name: "Blood Scent", desc: "Every conceded goal fuels his fire further — after each goal conceded, +5 defense for the rest of the match." },
      hard_tackle: { name: "Hard Tackle", desc: "Aggressive challenge that launches the counter — 20% chance to break the enemy attack and trigger a counter immediately." },
      whirlwind_rush: { name: "Whirlwind", desc: "Sudden tempo explosion for one moment — once per half, doubles his tempo for one round." },
      build_from_back: { name: "Build from the Back", desc: "Structures the game from deep — the playmaker gets +8 vision." },
      late_bloom: { name: "Late Bloomer", desc: "Finds his rhythm only in the second half — from round 4: +10 offense and +5 vision." },
      read_game: { name: "Read the Game", desc: "Plays the ball with his head, not his feet — once per match, an enemy attack is automatically neutralized." },
      metronome_tempo: { name: "Metronome", desc: "Steady rhythm, more control each round — every round +2% to own build-up (cumulative)." },
      killer_pass: { name: "Killer Pass", desc: "Killer pass that cuts through defensive lines — on own attack, 25% chance for a chain shot." },
      whisper_boost: { name: "Whisper", desc: "Quiet director behind the striker, gives him confidence — the striker gets +8 composure and +4 offense." },
      hunter_press: { name: "Hunting Fever", desc: "Hunts the ball-carrier, no way out — 15% chance per round to win the ball through pressing." },
      gegenpress_steal: { name: "Gegenpress", desc: "Drills in immediately after enemy turnover — after every enemy turnover +15% to the next own build-up." },
      shadow_strike: { name: "Shadow Strike", desc: "Unexpected attack from nowhere in key rounds — in rounds 3 and 6, 20% chance for a hidden attack." },
      maestro_combo: { name: "Maestro Combo", desc: "When the whole team scores, it sounds like a symphony — if PM, LF and ST all score, the next goal counts double." },
      chess_predict: { name: "Prediction", desc: "Sees the shot coming before the striker pulls the trigger — once per half, an enemy goal turns into a save." },
      symphony_pass: { name: "Symphony", desc: "The more teammates fire, the stronger the team — if 2+ teammates trigger traits, +10% team offense." },
      speed_burst: { name: "Speed Burst", desc: "Explosive tempo burst at the right moment — once per half, one build-up is guaranteed successful." },
      launch_sequence: { name: "Launch", desc: "Flying start, no warm-up — in round 1, the team gets +20% to own attacks." },
      unstoppable_run: { name: "Unstoppable", desc: "When the tempo's right, no one catches him — if tempo > enemy defense, 10% chance for an automatic goal." },
      dribble_chain: { name: "Dribble Chain", desc: "One dribble ignites the next — each successful attack gives +5% to the following one (stacking)." },
      street_trick: { name: "Street Trick", desc: "Street-style freestyle, defender left standing — 15% chance to beat the defender completely." },
      nutmeg: { name: "Nutmeg", desc: "Unexpected tunnel between the legs — on own attack, 20% chance to ignore enemy defense entirely." },
      ironman_stamina: { name: "Ironman", desc: "Stays fresh into the final minutes and lifts the team — rounds 5-6: no stat decay, team gets +2 tempo." },
      dynamo_power: { name: "Dynamo", desc: "Rhythmic power waves to the team — every second round, the team gets +6 offense for that round." },
      never_stop: { name: "Never Stop", desc: "Falling behind makes him more aggressive — when trailing, +8 offense per goal conceded." },
      silent_killer: { name: "Silent Killer", desc: "The first shot lands perfectly, unexpected — the first shot of the match gets +30% offense." },
      predator_pounce: { name: "Predator Pounce", desc: "Waits for the enemy mistake, then strikes instantly — after a failed enemy attack, 25% chance for an instant goal." },
      opportunity: { name: "Opportunity", desc: "Turns small chances into real goals — each successful build-up adds +3% goal chance." },
      cannon_blast: { name: "Cannon Blast", desc: "Dangerous hammer shots, but more risk of blowing one — every shot: 10% auto-goal, but +5% miss risk." },
      header_power: { name: "Header Beast", desc: "Lord of the air, loves the long ball — with high team vision, +15% goal chance." },
      brick_hold: { name: "Ball Retention", desc: "Stabilizer on the pitch, no press gets through — the team suffers -10% enemy pressing." },
      ghost_run: { name: "Ghost Run", desc: "Suddenly appears in the box when no one's looking — 15% chance per round to appear suddenly for a chance." },
      puzzle_connect: { name: "Puzzle Piece", desc: "Invisible connection to the playmaker — if the PM scores, this player gets +25% to the next goal chance." },
      chameleon_adapt: { name: "Adaptation", desc: "Adapts to the game like a chameleon — in round 4, copies the trait of the most active teammate." }
    },
    starterTeams: {
      konter: { name: "Counter Specialists", theme: "fast, defensive, punishes mistakes", desc: "Strong in midfield and out wide. Scores through fast transitions." },
      kraft: { name: "Powerhouse", theme: "physical, aerial, grinding", desc: "Wins through raw power. Especially strong late in the match." },
      technik: { name: "Technique Magicians", theme: "vision-based, combo passing", desc: "Builds attacks out of nowhere. Slow, but precise." },
      pressing: { name: "Pressing Beasts", theme: "aggressive, breaks build-up", desc: "Forces errors through constant pressure. High-risk football with shaky nerves." }
    },
    opponents: {
      prefixes: ["SC ", "FC ", "Athletic ", "Union ", "Sporting ", "Dynamo ", "Real ", "Racing ", "Red Star ", "Albion "],
      places: ["Nightwood", "Stormhold", "Coldcrag", "Ironvale", "Roughbridge", "Thunder Peak", "Windhaven", "Froststorm", "Ravenfield", "Shadowvale", "Firehorn", "Mistkeep", "Wastemark", "Bloodrock", "Tempest Grove"],
      specials: {
        offensive: "Attack Focus", defensive: "Stronghold", pacey: "Lightning Quick",
        cerebral: "Tactician", stoic: "Iron-Willed", balanced: "Balanced"
      }
    },
    oppTells: {
      offensive: "Very attacking — prioritise defensive shape",
      defensive: "Parked completely — needs pace or vision to crack",
      pacey: "Extremely fast — counter-threat on both ends",
      cerebral: "Tactically polished — possession game's dangerous",
      stoic: "Unshakeable — nerves decide in the final push",
      balanced: "No obvious weakness — stay adaptable",
      trait_sturm: "Deadly in front of goal — shots are very accurate",
      trait_riegel: "Actively counters finishing — saves are harder",
      trait_konter_opp: "Waits for mistakes — instant counter on any turnover",
      trait_presser_opp: "Aggressive pressing — build-up under constant strain",
      trait_clutch_opp: "Stronger in the closing stages — rounds 5-6 are dangerous",
      trait_lucky: "Unpredictably lucky — expect surprise attacks",
      trait_ironwall: "Very defensive early — rounds 1-2 are hard to break down",
      trait_sniper: "Precision shooter — every shot's a threat",
      trait_bulwark: "Defends the line to the last — one guaranteed goal gets scrambled off per match",
      trait_counter_threat: "Double counter-stalker — a failed buildup invites an instant shot back",
      trait_rage_mode: "Grows fiercer when trailing — goal deficit fuels their attack",
      trait_pressing_wall: "Suffocating press — many of your buildups collapse early",
      trait_boss_aura: "Boss presence — the entire opposing squad ticks up a notch every round"
    },
    tactics: {
      kickoff: {
        aggressive: { name: "Aggressive Start", desc: "+18 attack R1-3, -8 defense. All-out pressure from the first whistle." },
        defensive: { name: "Defensive Start", desc: "+18 defense R1-3, -8 attack. Invite them on and hit on the break." },
        balanced: { name: "Balanced", desc: "+8 to ALL stats R1-3. First build-up's guaranteed — no cold start." },
        tempo: { name: "Tempo Game", desc: "+22 tempo R1-3, -6 composure. Overwhelm with pace before they settle." },
        pressing: { name: "Pressing", desc: "+14 defense, +10 tempo R1-3. Their build-up drops hard — but gaps appear if beaten." },
        possession: { name: "Possession", desc: "+18 vision, +10 composure R1-3. Control the game — but a turnover invites a counter." },
        counter: { name: "Counter Trap", desc: "+22 defense, +10 tempo, -6 attack. Every failed enemy attack triggers a counter." },
        flank_play: { name: "Wing Play", desc: "+14 tempo, +14 attack R1-3. Wide and fast from the off." },
        slow_burn: { name: "Slow Burn", desc: "Punish their patience: -4 attack R1-2, then +22 attack R3. Lull them first." },
        shot_flood: { name: "Shot Flood", desc: "+24 attack R1-3. Quantity over quality — expect misses, force errors." },
        lockdown: { name: "Lockdown", desc: "+28 defense R1-3, -12 attack, -8 tempo. Concede nothing, score nothing." },
        mindgames: { name: "Mind Games", desc: "+14 vision, +10 composure. Enemy -6 composure R1-3. Get into their heads." },
        underdog: { name: "Underdog Mode", desc: "Only vs. much stronger: +14 to ALL stats R1-6. The whole team rises to the occasion." },
        favorite: { name: "Strut", desc: "Only when clearly favored: +10 vision, +6 tempo, momentum fills faster. Play with swagger." },
        wet_start: { name: "Soak & Strike", desc: "Absorb R1-2 with full defense, then explode R3 with +24 attack at kickoff." },
        chaos: { name: "Chaos Football", desc: "Each round a random stat gets +20, two get -10. High variance — embrace it." },
        zone_defense: { name: "Zone Defense", desc: "+12 defense, +12 composure, -5 tempo R1-3. Structured, not aggressive. Between pressing and lockdown." },
        quick_strike: { name: "Quick Strike", desc: "R1: +30 attack burst. R2-3: +5 to all stats. Explosive opening then measured." },
        disciplined: { name: "Disciplined", desc: "+10 all stats R1-3. Negative form penalties ignored — crisis players play normally." },
        read_the_room: { name: "Read the Room", desc: "+15 vision, +10 composure, +8 defense R1-3. Cerebral opening, no tempo." }
      },
      halftime: {
        push: { name: "Risk Push", desc: "+20 attack R4-6, -10 defense. If trailing, the boost grows with every goal owed." },
        stabilize: { name: "Stabilize", desc: "+18 defense, +10 composure R4-6. If leading, the wall grows per goal ahead." },
        shift: { name: "Reassign", desc: "Top-form player: +18 focus stat (match-long boost on the strongest fit)." },
        rally: { name: "Rally", desc: "+6 attack per goal conceded, +6 defense per goal scored. Massive swing potential." },
        reset: { name: "Reset Shape", desc: "+12 to ALL stats R4-6. Wipe the slate clean — no more script." },
        counter_h: { name: "Lean Into Counters", desc: "+24 tempo, +14 defense R4-6. Failed enemy attack triggers a counter." },
        high_press: { name: "High Press", desc: "+22 defense R4-6, -6 composure. Squeeze their build-up — but gaps are real." },
        vision_play: { name: "Open the Game", desc: "+22 vision, +10 attack R4-6. Create gaps and pick them apart." },
        shake_up: { name: "Shake-Up", desc: "Worst-form player benched in spirit: −5 all stats. Team responds: +12 OFF R4-6." },
        lock_bus: { name: "Lock the Bus", desc: "Only if leading: +30 defense, -20 attack R4-6. Impenetrable but toothless." },
        desperate: { name: "Desperate Attack", desc: "Only if trailing 2+: +32 attack R4-6, -20 defense. Keeper on his own. All or nothing." },
        role_switch: { name: "Role Switch", desc: "LF and ST swap roles R4-6. Team: +10 TMP, +10 OFF, −8 VIS. LF +8 OFF, ST +8 TMP personal. New angles of attack." },
        coach_fire: { name: "Fiery Team Talk", desc: "Only if losing: next match's team form +1, this match +14 attack R4-6. Anger fuels them." },
        cold_read: { name: "Cold Read", desc: "Read their tactics. +20 defense, enemy attack -8 R4-6. Outsmart, don't outfight." },
        wingman: { name: "Free the Wingman", desc: "LF: +25 TMP, +15 OFF personal R4-6. Team −4 CMP. One-man show risk." },
        mind_reset: { name: "Mental Reset", desc: "Wipes all form deltas in squad. Fresh slate into R4-6 — no baggage, no momentum." },
        double_down: { name: "Double Down", desc: "Amplifies your biggest POSITIVE team buff by +40%. Falls back to a modest +6 OFF/DEF/CMP if you have no real buff yet." },
        tactical_foul: { name: "Tactical Fouls", desc: "Rhythm-breaker: CB deliberately fouls to stop counter-attacks. +8 defense, opp tempo -12 for R4-5. CB loses 3 condition (the commitment). Disrupt, don't improve your own play." },
        wing_overload: { name: "Wing Overload", desc: "LF: +20 offense, +20 tempo personal R4-6. Team -6 defense. One-winger show." },
        shell_defense: { name: "Shell Defense", desc: "Only drawing or leading: +24 defense, +14 composure, -10 attack R4-6. Preserve the state." }
      },
      final: {
        all_in: { name: "All In", desc: "R6: +15 attack, -15 defense. Scales with goals owed. Leaves you wide open.\nEveryone forward — the back is abandoned. Win or die trying." },
        park_bus: { name: "Park the Bus", desc: "R6: +15 defense, -10 attack. Scales with every goal in hand.\nTen men behind the ball, no pretense of attacking. Just hold the lead." },
        hero_ball: { name: "Hero Ball", desc: "Top-form player: +30 focus stat (match-long).\nOne player takes the ball and the weight. The team runs off him." },
        keep_cool: { name: "Stay Cool", desc: "R6: +20 composure, +12 vision. Nerves of steel.\nDeep breaths, simple passes, trust the process. Don't let the moment shake us." },
        final_press: { name: "Final Press", desc: "R6: +24 tempo, +18 defense, -10 attack. High counter chance.\nHigh line, man-to-man, hunt the ball. Make them break first." },
        long_ball: { name: "Long Balls", desc: "R6: +28 attack, -10 vision. Direct and hard.\nFlick it long, chase it down. Skip the midfield entirely." },
        midfield: { name: "Midfield Control", desc: "R6: +20 vision, +16 tempo, +14 composure.\nOwn the middle third. They can't score if they never have the ball." },
        sneaky: { name: "Ambush", desc: "R6: +28 defense, +18 tempo, -14 attack. Lure and pounce.\nDrop deep, invite pressure, break when they commit. Classic counter shape." },
        sacrifice: { name: "Sacrifice", desc: "Top-form player: −15 focus stat. Team: +35 OFF this match.\nOne player gives his body to spring the team. He'll pay for it." },
        kamikaze: { name: "Kamikaze", desc: "Only if trailing: +40 attack, -40 defense. Keeper exposed. Hope and pray.\nNothing to lose — keeper's coming up for corners. All or nothing." },
        clockwatch: { name: "Clock Watching", desc: "Only if leading: +25 defense, +18 composure. Let the clock work for you.\nEvery touch a little longer. Every throw-in studied. Time is our teammate." },
        poker: { name: "Poker Face", desc: "Only if tied: +15 to every single stat. Pure clutch — everything to play for.\nEveryone sharp, no tells, no panic. The next goal wins everything." },
        lone_wolf: { name: "Lone Wolf", desc: "Striker: +40 attack, +20 tempo personal. Rest of team: -6 attack. One shot, one kill.\nBall up to the striker, let him cook. Everyone else hold shape." },
        fortress: { name: "Fortress", desc: "TW/VT get +40 defense. Team -20 attack. Turn the goal into a bunker.\nKeeper and center-back lock the door. Everything else is noise." },
        gamble: { name: "Gamble", desc: "Coin flip: +35 attack on heads, -15 all stats on tails. Pure chaos energy.\nThrow caution out. Either we storm them or we implode. Pick a side." },
        masterclass: { name: "Masterclass", desc: "PM: +30 vision, +20 composure personal. Team +12 attack. Let the maestro conduct.\nThe playmaker runs everything through himself. His vision, his tempo, his match." },
        rope_a_dope: { name: "Rope-a-Dope", desc: "R6: +35 defense. Every enemy attack triggers an auto-counter. Bait then strike.\nInvite them forward. Absorb. Release the fast break. Their exhaustion, our chance." },
        set_piece: { name: "Set Piece Master", desc: "R6: +25 attack, but ONLY on attacks from successful buildups. Narrow, surgical boost.\nWork the ball patiently, then strike from routine. Clinical from set plays." },
        siege_mode: { name: "Siege Mode", desc: "R6: +20 attack, +10 tempo, +10 vision. Clean all-around pressure, no penalty.\nSustained territory, wave after wave. Something has to give." },
        bus_and_bike: { name: "Bus & Counter", desc: "R6: +18 defense. Each save/stop loads +30 attack on your next ball.\nAbsorb, save, spring forward. Their chance becomes our chance." },
        face_pressure: { name: "Face the Pressure", desc: "R6: +25 composure, opp shots -8% accuracy. Clutch nerves under the lights.\nLook them in the eye. Their shots shake, ours don't. Mentality wins it." }
      }
    },
    teamNamePools: {
      konter: {
        first: [
          "Kylian", "Mohamed", "Vinicius", "Raphinha", "Wilfried", "Leroy", "Jadon", "Marcus", "Phil", "Bukayo",
          "Raheem", "Ousmane", "Nico", "Rafael", "Kingsley", "Serge", "Jamal", "Cody", "Lamine", "Rodrygo",
          "Kaoru", "Takefusa", "Jérémy", "Hirving", "Riyad", "Federico", "Ángel", "Nicolás", "Khvicha", "Antony",
          "Ademola", "Eberechi", "Anthony", "Mykhailo", "Randal", "Allan", "Brennan", "Moussa", "Domingos", "Savio"
        ],
        last: [
          "Mbappé", "Salah", "Júnior", "Traoré", "Sané", "Sancho", "Rashford", "Foden", "Saka", "Sterling",
          "Dembélé", "Williams", "Leão", "Coman", "Gnabry", "Musiala", "Gakpo", "Yamal", "Doku", "Nkunku",
          "Mitoma", "Kubo", "Doku", "Lozano", "Mahrez", "Chiesa", "Di María", "González", "Kvaratskhelia", "Antony",
          "Lookman", "Eze", "Gordon", "Mudryk", "Kolo Muani", "Saint-Maximin", "Johnson", "Diaby", "Quenda", "Martinelli"
        ]
      },
      pressing: {
        first: [
          "Erling", "Joshua", "Leon", "Robert", "Granit", "Jude", "Declan", "Aurélien", "Federico", "Nicolò",
          "Adrien", "Ilkay", "Frenkie", "Pedri", "Gavi", "Enzo", "Moisés", "Rodri", "Casemiro", "Bruno",
          "N'Golo", "Youri", "Dominik", "Martin", "Sofyan", "Manuel", "Marcelo", "Aaron", "Conor", "Ryan",
          "Alexis", "Kobbie", "Angelo", "Florian", "Yves", "Warren", "Eduardo", "Exequiel", "Joaquín", "Teun"
        ],
        last: [
          "Haaland", "Kimmich", "Goretzka", "Lewandowski", "Xhaka", "Bellingham", "Rice", "Tchouaméni", "Valverde", "Barella",
          "Rabiot", "Gündoğan", "de Jong", "Fernandes", "Guimarães", "Caicedo", "Mac Allister", "Zubimendi", "Locatelli", "Koopmeiners",
          "Kanté", "Tielemans", "Szoboszlai", "Ødegaard", "Amrabat", "Ugarte", "Brozović", "Wan-Bissaka", "Gallagher", "Gravenberch",
          "Mac Allister", "Mainoo", "Stiller", "Wirtz", "Bissouma", "Zaïre-Emery", "Camavinga", "Palacios", "Correa", "Koopmeiners"
        ]
      },
      technik: {
        first: [
          "Lionel", "Luka", "Andrés", "Toni", "Thiago", "David", "Riyad", "Kevin", "İlkay", "Marco",
          "Bernardo", "Christopher", "Mason", "Florian", "Paulo", "Federico", "Hakim", "Cole", "Rodrigo", "Bruno",
          "Dele", "Mesut", "Juan", "Martin", "Christian", "Hakan", "Isco", "James", "Philippe", "Riccardo",
          "Dominik", "Paulo", "Xavi", "Sergi", "Iñigo", "Arda", "Dani", "Fabián", "Arthur", "Nicolás"
        ],
        last: [
          "Messi", "Modrić", "Iniesta", "Kroos", "Silva", "de Bruyne", "Mahrez", "Verratti", "Reus", "Wirtz",
          "Palmer", "Ødegaard", "Dybala", "Chiesa", "Ziyech", "Olmo", "Eriksen", "Havertz", "Alcaraz", "Isco",
          "Özil", "Mata", "Coutinho", "Calcıoğlu", "Pellegrini", "Asensio", "Rodríguez", "Pastore", "Orsolini", "Reyes",
          "Szoboszlai", "Raspadori", "Simons", "Roberts", "Muniain", "Güler", "Ceballos", "Ruiz", "Melo", "Paz"
        ]
      },
      kraft: {
        first: [
          "Harry", "Romelu", "Virgil", "Antonio", "Sergio", "Kalidou", "Rúben", "Dayot", "Matthijs", "William",
          "Ronald", "Pepe", "Raphaël", "Ibrahima", "Niklas", "Jonathan", "Josko", "Mats", "Marquinhos", "Kim",
          "Zlatan", "Olivier", "Didier", "Oliver", "Alessandro", "Fabio", "Mathijs", "Ronald", "Paolo", "Fabio",
          "Jorginho", "John", "Benjamin", "Stefan", "Nathan", "Joško", "Antonio", "Trevoh", "Willy", "Micky"
        ],
        last: [
          "Kane", "Lukaku", "van Dijk", "Rüdiger", "Ramos", "Koulibaly", "Dias", "Upamecano", "de Ligt", "Saliba",
          "Araújo", "Reina", "Varane", "Konaté", "Süle", "Tah", "Gvardiol", "Hummels", "Silva", "Min-jae",
          "Ibrahimović", "Giroud", "Drogba", "Bierhoff", "Nesta", "Cannavaro", "de Ligt", "Araújo", "Maldini", "Materazzi",
          "Frattesi", "Stones", "Pavard", "Savić", "Aké", "Gvardiol", "Rüdiger", "Chalobah", "Boly", "van de Ven"
        ]
      }
    },
    opponentNamePools: {
      sharp: {
        first: [
          "Cristiano", "Karim", "Olivier", "Lautaro", "Darwin", "Gabriel", "Victor", "Álvaro", "Randal", "Alexander",
          "Lois", "Niclas", "Serhou", "Taty", "Dominik", "Julian", "Benjamin", "Lukas", "Arkadiusz", "Dušan",
          "Sébastien", "Ivan", "Erling", "Jonathan", "Timo", "Tammy", "Memphis", "Gerard", "Radamel", "Romelu",
          "Luis", "Zlatan", "Edinson", "Mauro", "Rafael", "Wissam", "Iago", "Andrea", "Donyell", "Joshua"
        ],
        last: [
          "Ronaldo", "Benzema", "Giroud", "Martínez", "Núñez", "Jesus", "Osimhen", "Morata", "Kolo Muani", "Isak",
          "Openda", "Füllkrug", "Guirassy", "Castellanos", "Livaković", "Álvarez", "Šeško", "Hradecky", "Milik", "Vlahović",
          "Haller", "Toney", "Højlund", "David", "Werner", "Abraham", "Depay", "Moreno", "Falcao", "Lukaku",
          "Suárez", "Ibrahimović", "Cavani", "Icardi", "Leão", "Ben Yedder", "Aspas", "Belotti", "Malen", "Zirkzee"
        ]
      },
      heavy: {
        first: [
          "Axel", "Dayot", "Manuel", "Wout", "Jan", "Nathan", "Ezri", "Nordi", "Cristian", "Stefan",
          "Ibrahim", "Olivier", "Sergi", "Giorgio", "Jean-Clair", "Dominique", "Yerry", "Antonio", "Danilo", "Gabriel",
          "Leonardo", "Kieran", "Harry", "Eric", "Niklas", "Thilo", "Antoine", "Clément", "Pau", "Jules",
          "Diego", "Willian", "Salvatore", "Trevoh", "Éder", "Lucas", "Daniele", "Benjamin", "Lucas", "Konrad"
        ],
        last: [
          "Witsel", "Upamecano", "Akanji", "Faes", "Vertonghen", "Aké", "Konsa", "Mukiele", "Romero", "Savić",
          "Konaté", "Kemen", "Roberto", "Chiellini", "Todibo", "Soumaoro", "Mina", "Rüdiger", "Pereira", "Magalhães",
          "Bonucci", "Trippier", "Maguire", "Dier", "Süle", "Kehrer", "Griezmann", "Lenglet", "Torres", "Koundé",
          "Godín", "Pablo", "Bastoni", "Chalobah", "Militão", "Hernández", "Rugani", "Mendy", "Tomori", "Laimer"
        ]
      },
      cerebral: {
        first: [
          "Andrea", "Xabi", "Xavi", "Paul", "Lorenzo", "Marco", "Dani", "Hakan", "Sergej", "Mateo",
          "Nikola", "Aleksandar", "Ivan", "Dušan", "Piotr", "Krzysztof", "Grzegorz", "Miralem", "Ismaël", "Eduardo",
          "Jorge", "Gaizka", "Wesley", "Zinedine", "Bastian", "Toni", "Mesut", "Juan", "Rui", "Joan",
          "Luis", "Iniesta", "Juan Mata", "Raul", "Eden", "Samir", "Radja", "Tonali", "Sardar", "Remo"
        ],
        last: [
          "Pirlo", "Alonso", "Hernández", "Pogba", "Pellegrini", "Asensio", "Parejo", "Çalhanoğlu", "Milinković", "Kovačić",
          "Vlašić", "Mitrović", "Rakitić", "Kovacic", "Zieliński", "Piątek", "Krychowiak", "Pjanić", "Bennacer", "Camavinga",
          "Xavi", "Mendieta", "Sneijder", "Zidane", "Schweinsteiger", "Kroos", "Özil", "Mata", "Costa", "Verdú",
          "Iniesta", "Silva", "Capoue", "García", "Hazard", "Handanović", "Nainggolan", "Tonali", "Azmoun", "Freuler"
        ]
      },
      neutral: {
        first: [
          "Aaron", "Takehiro", "Takumi", "Daichi", "Ritsu", "Wataru", "Ko", "Kaoru", "Dominik", "Oliver",
          "Mathias", "Milan", "Lovro", "Bruno", "João", "Diogo", "Gonçalo", "Francisco", "André", "Rafael",
          "Josip", "Dominik", "Milot", "Robin", "Thibaut", "Jan", "Henrikh", "Alphonso", "Ki", "Dejan",
          "Kasper", "Christian", "Pierre-Emile", "Andreas", "Matty", "Kieran", "Yoane", "Ciro", "Gianluca", "Mikel"
        ],
        last: [
          "Ramsey", "Tomiyasu", "Minamino", "Kamada", "Dōan", "Endō", "Itakura", "Mitoma", "Szoboszlai", "Gloukh",
          "Olivera", "Livaković", "Škriniar", "Majer", "Fernandes", "Neves", "Jota", "Ramos", "Conceição", "Silva",
          "Mikautadze", "Sučić", "Rashica", "Gosens", "Courtois", "Oblak", "Mkhitaryan", "Davies", "Sung-yueng", "Lovren",
          "Schmeichel", "Eriksen", "Højbjerg", "Christensen", "Cash", "Trippier", "Wissa", "Immobile", "Scamacca", "Merino"
        ]
      }
    },
    legendaryNames: [
      "Diego Maradona", "Zinedine Zidane", "Ronaldinho Gaúcho", "Pelé Nascimento", "Johan Cruyff",
      "Franz Beckenbauer", "Ronaldo Fenômeno", "George Best", "Alfredo Di Stéfano", "Ferenc Puskás",
      "Michel Platini", "Marco van Basten", "Gerd Müller", "Bobby Charlton", "Eusébio Ferreira",
      "Garrincha Santos", "Paolo Maldini", "Roberto Baggio", "Thierry Henry", "Andrea Pirlo",
      "Lothar Matthäus", "Rivaldo Vítor", "Romário Farias", "Socrates Brasileiro", "Zico Antunes",
      "Bobby Moore", "Dino Zoff", "Franco Baresi", "Lev Yashin", "Oliver Kahn",
      "Rui Costa", "Luis Figo", "Hristo Stoichkov", "Davor Šuker", "Dennis Bergkamp",
      "Patrick Vieira", "Clarence Seedorf", "Cafu Santos", "Roberto Carlos", "Paolo Rossi"
    ],
    oppTraits: {
      sturm:          { name: "Storm Roller",      desc: "Drives every shot with surgical precision — their strikes land 8% more accurately on your keeper's frame." },
      riegel:         { name: "Lock Chain",        desc: "Slam the door on the box relentlessly — your saves get 5% harder to turn into clearances each round." },
      konter_opp:     { name: "Counter Threat",    desc: "They're waiting for you to slip. Any failed build-up hands them a 30% shot from the counter-transition." },
      presser_opp:    { name: "Press Machine",     desc: "They press high and attack every pass. Your build-ups break down 10% more often under the sustained pressure." },
      clutch_opp:     { name: "Ice Cold",          desc: "They come alive as the clock burns down. Rounds 5-6: +10 attack, +5 tempo — right when it hurts most." },
      lucky:          { name: "Lucky Devils",      desc: "Something always clicks for them. Once per match an unpredictable bonus attack comes out of nowhere." },
      ironwall:       { name: "Iron Wall",         desc: "They start the match bolted shut. First 2 rounds play nearly impenetrable — +10 defense." },
      sniper:         { name: "Sniper",            desc: "Patient hunters waiting for the one clean look. Every shot +15% accuracy, but slower on the ball (-5 tempo)." },
      boss_aura:      { name: "Dominant Presence", desc: "Career-hardened, every round another small stat bump stacks on each opponent — the longer it drags, the harder it gets." },
      bulwark:        { name: "Bulwark",           desc: "One of those players who pulls the ball off the line. Once per match a nailed-on goal gets scrambled away in the last instant." },
      counter_threat: { name: "Double Counter",    desc: "Two lurkers hunting your mistake. A failed build-up gives a 35% shot risk — and that scales higher if they're trailing." },
      rage_mode:      { name: "Rage Mode",         desc: "Falling behind lights a fire. At 2+ goals down they get an extra bonus-attack chance every round." },
      pressing_wall:  { name: "Pressing Wall",     desc: "Coordinated high press across the whole midfield. Your build-ups collapse 15% more often." }
    },
    legendaryTraits: {
      god_mode:      { name: "God Mode",        desc: "They lift themselves above the moment. Once per match your next goal counts triple — a match can flip in a single strike." },
      clutch_dna:    { name: "Clutch DNA",      desc: "The later the match, the clearer their head. Final round: +20 attack, +10 composure — exactly when it counts." },
      field_general: { name: "Field General",   desc: "Organizes the whole team from the pitch. Entire squad gets +4 to every stat — everywhere, always." },
      unbreakable:   { name: "Unbreakable",     desc: "The first goal against just bounces off. Once per match one conceded goal is flat-out cancelled." },
      big_game:      { name: "Big-Game Player", desc: "Regular matches are routine, but boss fights bring them out. +15 to focus stat in boss matches." },
      conductor:     { name: "Conductor",       desc: "Every pass sets up the next. Each successful build-up lifts the next finish's goal chance by +8%." },
      phoenix:       { name: "Phoenix",         desc: "Going down wakes them up. At 2+ goals behind they unlock +12 attack for the rest of the match — the comeback starts here." },
      ice_in_veins:  { name: "Ice in the Veins",desc: "No trick, no mind-game, no opponent composure buff reaches them. Their judgement stays sharp — enemy composure buffs simply don't apply." }
    }
  }
});
