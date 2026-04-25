// ─────────────────────────────────────────────────────────────────────────────
// cards.js — Card layer on top of the existing match engine.
//
// Integration point: at the start of each round (R1-R6), BEFORE the engine
// dispatches the 'roundStart' trigger, we ask the flow layer for a
// 'round_card' interrupt. Cards resolve by pushing {range:[r,r], stats:{}}
// layers onto match.buffLayers — exactly the same mechanism tactics use.
// This means card effects stack transparently with tactics, traits, and
// opponent auras. No parallel engine.
//
// Feature-gated via CONFIG.cardsEnabled. If off, the match loop runs exactly
// as before and nothing in this file is touched.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});

  // ─── Card catalog ────────────────────────────────────────────────────────
  // Each card:
  //   id          — stable identifier
  //   cost        — energy cost (1 or 2 in MVP)
  //   type        — 'setup' | 'trigger' | 'counter' | 'defense' | 'combo'
  //   rarity      — 'common' | 'uncommon' | 'rare'
  //   tags        — synergy tags this card SETS when played (e.g. ['flow'])
  //   needs       — synergy tags this card CONSUMES / glows on (e.g. ['flow'])
  //   apply(ctx)  — pushes a buff layer or mutates match state
  //
  // Every card description is in i18n under ui.cards.<id>.name / .desc.
  // ────────────────────────────────────────────────────────────────────────

  const CARDS = {
    // ── Commons ──────────────────────────────────────────────────────────
    drop_deep: {
      id: 'drop_deep',
      cost: 1,
      type: 'setup',
      rarity: 'common',
      tags: ['flow', 'pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:drop_deep',
          range: [match.round, match.round],
          stats: { defense: 8, vision: 4 },
          special: null
        });
        // Press resist is a sticky mood, not a round buff.
        match._cardPressResist = (match._cardPressResist || 0) + 2;
      }
    },
    switch_lane: {
      id: 'switch_lane',
      cost: 1,
      type: 'setup',
      rarity: 'common',
      // v0.39 — laneOpen removed from the auto-tags. Telemetry showed
      // switch_lane at 38% of ALL card plays (59 out of 155) — dominant
      // because it stacked 3 utilities into a single cost-1 card: Flow
      // generation, stat buff, AND lane-opener. Every hand picked it
      // over drop_deep / quick_build. The gate is now: the lane only
      // opens if the player has already built Flow (≥1) from a PRIOR
      // setup card this round. The switch_lane at turn start becomes
      // a plain setup; chained after another setup it also opens the
      // lane. Keeps the card playable from match 1, trims dominance.
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:switch_lane',
          range: [match.round, match.round],
          stats: { tempo: 8, offense: 4 },
          special: null
        });
        // Conditional lane-open: requires prior setup flow this round.
        // _cardFlow is incremented AFTER apply (see playCard tag loop),
        // so this reads pre-play flow — the player must have played
        // another flow card first in the same round OR carried flow
        // from an earlier round.
        if ((match._cardFlow || 0) >= 1) {
          match._cardLaneOpen = true;
        }
      }
    },
    quick_build: {
      id: 'quick_build',
      cost: 1,
      type: 'setup',
      rarity: 'common',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:quick_build',
          range: [match.round, match.round],
          stats: { vision: 10, composure: 3 },
          special: null
        });
      }
    },
    tight_shape: {
      id: 'tight_shape',
      cost: 1,
      type: 'defense',
      rarity: 'common',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Telegraph-reactive: when the opp has loaded a serious threat
        // (severity ≥ 2), this defense card reads the intent and clamps
        // harder — stats scaled 1.3x. Rewards the player for watching
        // the intent chip.
        const threat = window.KL?.cards?.getTelegraphedThreat?.(match);
        const mult = threat ? 1.3 : 1.0;
        // Also resolves yellow-card threat event — holding shape
        // means we don't lunge in.
        let yellowResolved = false;
        if (match._yellowCardPending) {
          match._yellowCardPending = false;
          yellowResolved = true;
        }
        match.buffLayers.push({
          source: 'card:tight_shape',
          range: [match.round, match.round],
          stats: { defense: Math.round(14 * mult) },
          special: null
        });
        return threat ? { synergy: 'telegraph', payoff: true, yellowResolved }
                      : { payoff: false, yellowResolved };
      }
    },
    hold_the_line: {
      id: 'hold_the_line',
      cost: 0,
      type: 'defense',
      rarity: 'common',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Telegraph-reactive: defense scaled + save bonus amplified
        // when the opp has loaded a threat. Free card so the boost
        // isn't game-breaking; it just makes this a reliable opening
        // move against an obviously-dangerous opponent.
        const threat = window.KL?.cards?.getTelegraphedThreat?.(match);
        const mult = threat ? 1.3 : 1.0;
        match.buffLayers.push({
          source: 'card:hold_the_line',
          range: [match.round, match.round],
          stats: {
            defense: Math.round(8 * mult),
            composure: Math.round(6 * mult)
          },
          special: null
        });
        match.nextSaveBonus = (match.nextSaveBonus || 0) + Math.round(8 * mult);
        return threat ? { synergy: 'telegraph', payoff: true } : { payoff: false };
      }
    },
    keeper_rush: {
      id: 'keeper_rush',
      cost: 2,
      type: 'defense',
      rarity: 'common',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Telegraph-reactive: keeper reads the incoming play and
        // repositions; defense + save bonus both scaled on threat.
        const threat = window.KL?.cards?.getTelegraphedThreat?.(match);
        const mult = threat ? 1.3 : 1.0;
        match.buffLayers.push({
          source: 'card:keeper_rush',
          range: [match.round, match.round],
          stats: { defense: Math.round(10 * mult) },
          special: null
        });
        // Engine already honours nextSaveBonus across rounds.
        match.nextSaveBonus = (match.nextSaveBonus || 0) + Math.round(15 * mult);
        return threat ? { synergy: 'telegraph', payoff: true } : { payoff: false };
      }
    },
    overlap_run: {
      id: 'overlap_run',
      cost: 2,
      type: 'trigger',
      rarity: 'common',
      tags: [],
      needs: ['flow'],
      apply(ctx) {
        const { match } = ctx;
        const flow = (match._cardFlow || 0);
        const bonus = 15 + Math.min(flow, 4) * 4;  // +15 base, +4 per flow stack
        match.buffLayers.push({
          source: 'card:overlap_run',
          range: [match.round, match.round],
          stats: { offense: bonus, tempo: 6 },
          special: null
        });
        return { scaled: bonus, flowUsed: flow, directAction: { type: 'cross' } };
      }
    },
    forward_burst: {
      id: 'forward_burst',
      cost: 2,
      type: 'trigger',
      rarity: 'common',
      tags: [],
      needs: ['laneOpen'],
      apply(ctx) {
        const { match } = ctx;
        const open = !!match._cardLaneOpen;
        // Tactic coupling: aggressive/tempo tactics turn forward burst
        // into a real weapon — the team is already leaning forward.
        const tags = match.activeTacticTags || [];
        const tacticAmped = tags.includes('aggressive') || tags.includes('tempo');
        const tacticBonus = tacticAmped ? 6 : 0;
        const off = (open ? 26 : 14) + tacticBonus;
        match.buffLayers.push({
          source: 'card:forward_burst',
          range: [match.round, match.round],
          stats: { offense: off, composure: -4 },
          special: null
        });
        if (open) { if (match._cardLanePersistent) { match._cardLanePersistent = false; } else { match._cardLaneOpen = false; } }
        return {
          laneOpenConsumed: open,
          directAction: open ? { type: 'extraShot' } : null
        };
      }
    },
    ball_recovery: {
      id: 'ball_recovery',
      cost: 1,
      type: 'counter',
      rarity: 'common',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match._cardOppTraitCancelPending = true;
        match.buffLayers.push({
          source: 'card:ball_recovery',
          range: [match.round, match.round],
          stats: { defense: 6, tempo: 4 },
          special: null
        });
        return { directAction: { type: 'oppStumble' } };
      }
    },
    hero_moment: {
      id: 'hero_moment',
      cost: 2,
      type: 'combo',
      rarity: 'common',
      tags: [],
      needs: ['flow'],
      apply(ctx) {
        const { match } = ctx;
        const flow = match._cardFlow || 0;
        // Base 18, +10 if flow >= 2 (the advertised payoff).
        const off = flow >= 2 ? 34 : 18;
        match.buffLayers.push({
          source: 'card:hero_moment',
          range: [match.round, match.round],
          stats: { offense: off, composure: 6 },
          special: null
        });
        if (flow >= 2) match._cardFlow -= 2;
        return { flowPayoff: flow >= 2, directAction: { type: 'extraShot' } };
      }
    },

    // ── Uncommons (post-match draft pool) ────────────────────────────────
    wing_trap: {
      id: 'wing_trap',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:wing_trap',
          range: [match.round, match.round],
          stats: { defense: 12, tempo: 6 },
          special: null
        });
        // Dampen (halve) the next opp trait hit — cost 1 is too cheap
        // for a full cancel. Ball Recovery covers the full cancel at
        // the same cost but gives less raw defense.
        match._cardOppTraitDampenPending = true;
        return { directAction: { type: 'absorbShot' } };
      }
    },
    masterclass: {
      id: 'masterclass',
      cost: 2,
      type: 'combo',
      rarity: 'uncommon',
      tags: [],
      needs: ['flow'],
      apply(ctx) {
        const { match } = ctx;
        const flow = match._cardFlow || 0;
        if (flow >= 3) {
          match.buffLayers.push({
            source: 'card:masterclass',
            range: [match.round, match.round],
            stats: { offense: 25, vision: 10 },
            special: null
          });
          match._cardFlow -= 3;
          return { payoff: true, directAction: { type: 'throughBall', target: 'ST' } };
        } else {
          match.buffLayers.push({
            source: 'card:masterclass',
            range: [match.round, match.round],
            stats: { offense: 10 },
            special: null
          });
          return { payoff: false };
        }
      }
    },
    stamina_boost: {
      id: 'stamina_boost',
      cost: 1,
      type: 'setup',
      rarity: 'uncommon',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Slight all-round boost for 2 rounds.
        match.buffLayers.push({
          source: 'card:stamina_boost',
          range: [match.round, match.round + 1],
          stats: { tempo: 5, composure: 5, defense: 3 },
          special: null
        });
        registerActiveEffect(match, {
          cardId:   'stamina_boost',
          icon:     '💨',
          label:    'Stamina',
          type:     'multi',
          duration: 2,
          note:     '+5 TMP/CMP, +3 DEF for 2 rounds.'
        });
      }
    },
    clinical_finish: {
      id: 'clinical_finish',
      cost: 2,
      type: 'combo',
      rarity: 'uncommon',
      tags: [],
      needs: ['laneOpen'],
      apply(ctx) {
        const { match } = ctx;
        const open = !!match._cardLaneOpen;
        const off = open ? 32 : 16;
        match.buffLayers.push({
          source: 'card:clinical_finish',
          range: [match.round, match.round],
          stats: { offense: off, composure: 8 },
          special: null
        });
        if (open) { if (match._cardLanePersistent) { match._cardLanePersistent = false; } else { match._cardLaneOpen = false; } }
        return {
          laneOpenConsumed: open,
          directAction: open ? { type: 'extraShot' } : null
        };
      }
    },
    deep_focus: {
      id: 'deep_focus',
      cost: 2,
      type: 'setup',
      rarity: 'uncommon',
      tags: ['flow', 'flow'],  // double-flow generator
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:deep_focus',
          range: [match.round, match.round + 1],
          stats: { vision: 12, composure: 6 },
          special: null
        });
        registerActiveEffect(match, {
          cardId:   'deep_focus',
          icon:     '🧠',
          label:    'Focus',
          type:     'multi',
          duration: 2,
          note:     '+12 VIS, +6 CMP for 2 rounds.'
        });
      }
    },

    // ── Action cards ─────────────────────────────────────────────────────
    // These trade pure stat shifts for reactive logic: conditions, side
    // effects, random outcomes, guaranteed payoffs with prerequisites.
    // They're where the game gets a personality beyond "bigger numbers".

    // Desperate Foul — buy a big defense swing this round by risking a
    // card on your keeper's composure. Narratively: your VT takes a
    // yellow on purpose. Mechanically: −1 CMP sticks for the match so
    // the cost is real but survivable.
    desperate_foul: {
      id: 'desperate_foul',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:desperate_foul',
          range: [match.round, match.round],
          stats: { defense: 12 },
          special: null
        });
        // Sticky match-long composure hit — the "yellow card" narrative.
        match.buffLayers.push({
          source: 'card:desperate_foul_cost',
          range: [match.round, 6],
          stats: { composure: -1 },
          special: null
        });
        match._cardYellowAbsorbed = (match._cardYellowAbsorbed || 0) + 1;
        registerActiveEffect(match, {
          cardId: 'desperate_foul',
          icon:   '🟨',
          label:  'Yellow',
          type:   'sticky',
          note:   '−1 CMP for the rest of the match.'
        });
        // Direct action: the foul itself — absorbs the next opp attempt,
        // visible and narrated at play time.
        return { directAction: { type: 'foulBreak' } };
      }
    },

    // Bait The Counter — reactive, payoff-next-round card. Weakens opp's
    // next attack; if they fail, next round starts with Flow +2.
    bait_counter: {
      id: 'bait_counter',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:bait_counter',
          range: [match.round, match.round],
          stats: { defense: 8, tempo: 4 },
          special: null
        });
        match._cardBaitActive = {
          round: match.round,
          oppScoreSnapshot: match.scoreOpp || 0
        };
        registerActiveEffect(match, {
          cardId:        'bait_counter',
          icon:          '🎣',
          label:         'Bait',
          type:          'pending',
          expiresAtRound: match.round + 1,
          note:          'Opp scores this round → fails. Else → Flow +2.'
        });
      }
    },

    // Through Ball — random-discard gamble. Outcome depends on what's
    // actually discarded, creating high-variance moments and punishing
    // hoarding defense cards.
    through_ball: {
      id: 'through_ball',
      cost: 1,
      type: 'setup',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        const hand = state?._cardHand || [];
        if (hand.length === 0) return { discarded: null, outcome: 'empty' };

        // Random discard (excluding any copy of this card still in hand —
        // the one being played is already removed before apply runs).
        const idx = Math.floor(Math.random() * hand.length);
        const discardedId = hand[idx];
        hand.splice(idx, 1);
        state._cardDiscard.push(discardedId);

        const discardedDef = CARDS[discardedId];
        const type = discardedDef?.type;

        if (type === 'setup') {
          match.buffLayers.push({
            source: 'card:through_ball_hit',
            range: [match.round, match.round],
            stats: { offense: 4, tempo: 4 },
            special: null
          });
          match._cardFlow = (match._cardFlow || 0) + 2;
          match._cardLaneOpen = true;
          // Direct action on successful setup match — the through-ball
          // is actually played. 45% goal chance tied into the play log.
          return { discarded: discardedId, outcome: 'setup',
            directAction: { type: 'throughBall', target: 'ST' } };
        } else if (type === 'trigger' || type === 'combo') {
          match.buffLayers.push({
            source: 'card:through_ball_miss',
            range: [match.round, match.round],
            stats: { defense: -4 },
            special: null
          });
          return { discarded: discardedId, outcome: 'miss' };
        } else {
          // Defense or counter — wasted opportunity, no payoff no penalty.
          return { discarded: discardedId, outcome: 'dud' };
        }
      }
    },

    // Stone Cold — high-commit payoff card. Needs Flow ≥ 2 AND Lane Open
    // at time of play. Consumes both. If prerequisites met, pushes a
    // decisive offense spike. Balanced at +55 so it's clearly the round's
    // payoff move but not a binary "auto-goal" — the engine still rolls.
    stone_cold: {
      id: 'stone_cold',
      cost: 2,
      type: 'combo',
      rarity: 'rare',
      tags: ['retain'],
      needs: ['flow', 'laneOpen'],
      apply(ctx) {
        const { match } = ctx;
        const flow = match._cardFlow || 0;
        const laneOpen = !!match._cardLaneOpen;
        if (flow >= 2 && laneOpen) {
          match.buffLayers.push({
            source: 'card:stone_cold',
            range: [match.round, match.round],
            stats: { offense: 30, composure: 8 },
            special: null
          });
          match._cardFlow = flow - 2;
          if (match._cardLanePersistent) {
            match._cardLanePersistent = false;
          } else {
            match._cardLaneOpen = false;
          }
          return { payoff: true, directAction: { type: 'throughBall', target: 'ST' } };
        }
        return { payoff: false };
      }
    },

    // ── Tactic-synergy cards ─────────────────────────────────────────────
    // Each of these checks the active kickoff tactic. Under the matching
    // tactic they deliver 2-3x the value of their baseline, turning the
    // kickoff commitment into an echo that rings through the whole match.
    // Narrative branches between `flavorHit` (tactic matched) and
    // `flavorMiss` (played outside the sweet spot) make the difference
    // readable in the log.
    //
    // Helper: active tactic id from lastTactic + activeTacticTags. Falls
    // back to tag-matching for cases where tags were cleared.

    counter_strike: {
      id: 'counter_strike',
      cost: 2,
      type: 'trigger',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const tactic = match.lastTactic?.id;
        const autoActive = (match.autoCounterRoundsLeft || 0) > 0;
        const hit = tactic === 'counter' || autoActive;
        if (hit) {
          match.buffLayers.push({
            source: 'card:counter_strike_hit',
            range: [match.round, match.round],
            stats: { offense: 28, tempo: 10 },
            special: null
          });
          match._cardFlow = (match._cardFlow || 0) + 1;
          return { payoff: true, directAction: { type: 'interceptCounter' } };
        }
        match.buffLayers.push({
          source: 'card:counter_strike_base',
          range: [match.round, match.round],
          stats: { offense: 10 },
          special: null
        });
        return { payoff: false };
      }
    },

    high_press_trap: {
      id: 'high_press_trap',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const tactic = match.lastTactic?.id;
        const pressActive = (match.pressingRoundsLeft || 0) > 0;
        const hit = tactic === 'pressing' || pressActive;
        if (hit) {
          match.buffLayers.push({
            source: 'card:high_press_trap_hit',
            range: [match.round, match.round],
            stats: { defense: 14, tempo: 6 },
            special: null
          });
          match._cardLaneOpen = true;
          match._cardOppTraitCancelPending = true;
          return { payoff: true, directAction: { type: 'pressWin' } };
        }
        match.buffLayers.push({
          source: 'card:high_press_trap_base',
          range: [match.round, match.round],
          stats: { defense: 8 },
          special: null
        });
        return { payoff: false };
      }
    },

    possession_web: {
      id: 'possession_web',
      cost: 2,
      type: 'setup',
      rarity: 'uncommon',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const tactic = match.lastTactic?.id;
        const possActive = !!match.possessionActive;
        const hit = tactic === 'possession' || possActive;
        if (hit) {
          match.buffLayers.push({
            source: 'card:possession_web_hit',
            range: [match.round, match.round + 1],
            stats: { vision: 14, offense: 6, defense: 6 },
            special: null
          });
          match._cardFlow = (match._cardFlow || 0) + 2;
          return { payoff: true };
        }
        match.buffLayers.push({
          source: 'card:possession_web_base',
          range: [match.round, match.round],
          stats: { vision: 8, composure: 4 },
          special: null
        });
        return { payoff: false };
      }
    },

    flank_overload: {
      id: 'flank_overload',
      cost: 2,
      type: 'combo',
      rarity: 'uncommon',
      tags: ['laneOpen'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const tactic = match.lastTactic?.id;
        const flankActive = (match.flankRoundsLeft || 0) > 0;
        const hit = tactic === 'flank_play' || flankActive;
        if (hit) {
          match.buffLayers.push({
            source: 'card:flank_overload_hit',
            range: [match.round, match.round + 1],
            stats: { offense: 22, tempo: 10 },
            special: null
          });
          // Lane Open persists for this round AND next round.
          match._cardLaneOpen = true;
          match._cardLanePersistent = true;
          return { payoff: true };
        }
        match.buffLayers.push({
          source: 'card:flank_overload_base',
          range: [match.round, match.round],
          stats: { offense: 10, tempo: 4 },
          special: null
        });
        match._cardLaneOpen = true;
        return { payoff: false };
      }
    },

    // ── Momentum archetype ───────────────────────────────────────────────
    // These three cards interact with match.matchMomentum (-100..+100).
    // They reward reading the match flow: Tide Turner is a come-back
    // tool, Ride the Wave punishes letting good moments pass, Storm
    // Warning cushions the inevitable concede. Together they make
    // momentum feel actionable, not passive scenery.

    tide_turner: {
      id: 'tide_turner',
      cost: 1,
      type: 'trigger',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const mm = match.matchMomentum || 0;
        if (mm <= -20) {
          // Reset + immediate action. Perfect comeback moment.
          match.matchMomentum = 10;
          match.buffLayers.push({
            source: 'card:tide_turner_comeback',
            range: [match.round, match.round],
            stats: { offense: 18, composure: 8 },
            special: null
          });
          return { payoff: true, directAction: { type: 'interceptCounter' } };
        }
        // Played out of situation — fizzles with tiny bonus.
        match.buffLayers.push({
          source: 'card:tide_turner_flat',
          range: [match.round, match.round],
          stats: { composure: 4 },
          special: null
        });
        return { payoff: false, outcome: 'dud' };
      }
    },

    ride_the_wave: {
      id: 'ride_the_wave',
      cost: 0,
      type: 'combo',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const mm = match.matchMomentum || 0;
        if (mm >= 40) {
          match.buffLayers.push({
            source: 'card:ride_the_wave',
            range: [match.round, match.round],
            stats: { offense: 24, tempo: 10, composure: 6 },
            special: null
          });
          return { payoff: true, directAction: { type: 'cross' } };
        }
        // Needs momentum — otherwise just a flat dud (0-cost so no waste).
        return { payoff: false, outcome: 'needs_momentum' };
      }
    },

    storm_warning: {
      id: 'storm_warning',
      cost: 1,
      type: 'defense',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:storm_warning',
          range: [match.round, match.round + 1],
          stats: { defense: 10, composure: 4 },
          special: null
        });
        // Absorbs next momentum-drop: the next goal conceded only
        // costs -15 momentum instead of -30. One-shot flag that the
        // opp-goal handler in engine.js respects.
        match._cardMomentumShield = true;
        registerActiveEffect(match, {
          cardId:   'storm_warning',
          icon:     '⛈',
          label:    'Shield',
          type:     'pending',
          duration: 99,
          note:     'Next goal conceded: half momentum drop.'
        });
        return { payoff: true };
      }
    },

    // ── Weak basics ──────────────────────────────────────────────────────
    // Deliberately underpowered cards seeded into the starter deck so the
    // post-match REMOVE option has something meaningful to target. Without
    // these, deck thinning is pointless.

    grind_through: {
      id: 'grind_through',
      cost: 1,
      type: 'defense',
      rarity: 'common',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:grind_through',
          range: [match.round, match.round],
          stats: { defense: 4, tempo: 2 },
          special: null
        });
      }
    },

    long_ball: {
      id: 'long_ball',
      cost: 1,
      type: 'trigger',
      rarity: 'common',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Direct-action: TW/VT hoofs it long. ST gets an immediate
        // shot attempt. Low prep, low chance, visible moment.
        return { directAction: { type: 'extraShot' } };
      }
    },

    hope_shot: {
      id: 'hope_shot',
      cost: 1,
      type: 'trigger',
      rarity: 'common',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Direct-action: 20% chance to score a scrappy goal right now.
        // No stat buff — it's just a desperate attempt. Narratively this
        // is "just hoof it and hope" — low EV but tangible moment.
        return { directAction: { type: 'scrappyGoal' } };
      }
    },

    // ── Tactic-synergy action cards ──────────────────────────────────────
    // These read match.activeTacticTags and scale dramatically when
    // paired with a compatible kickoff/halftime/final choice. First
    // time the card/tactic interaction surfaces as a mechanical axis.

    // Gegenpress — counter-press that WORKS with aggressive play. Alone
    // it's mediocre; paired with aggressive tactic it's elite defense.
    gegenpress: {
      id: 'gegenpress',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const tags = match.activeTacticTags || [];
        const amped = tags.includes('aggressive') || tags.includes('tempo') || tags.includes('pressing');
        // Comeback-scaling: at low momentum (trailing a match), gegenpress
        // gains +50% effectiveness. Teams pressing from behind feel
        // different — the body language, the urgency, the height of the
        // line. Above -20 momentum this is ordinary pressing.
        const mm = match.matchMomentum || 0;
        const comebackMult = mm <= -20 ? 1.5 : 1.0;

        if (amped) {
          match.buffLayers.push({
            source: 'card:gegenpress_synergy',
            range: [match.round, match.round],
            stats: {
              defense: Math.round(16 * comebackMult),
              tempo:   Math.round(12 * comebackMult)
            },
            special: null
          });
          return { synergy: 'aggressive', payoff: true, directAction: { type: 'pressWin' } };
        } else {
          match.buffLayers.push({
            source: 'card:gegenpress_base',
            range: [match.round, match.round],
            stats: {
              defense: Math.round(8 * comebackMult),
              tempo:   Math.round(6 * comebackMult)
            },
            special: null
          });
          return { synergy: null, payoff: false, directAction: { type: 'pressWin' } };
        }
      }
    },

    // Possession Lock — Flow generator that scales with possession-style
    // tactics. Draws an extra card if the tactic matches.
    possession_lock: {
      id: 'possession_lock',
      cost: 1,
      type: 'setup',
      rarity: 'uncommon',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        const tags = match.activeTacticTags || [];
        const amped = tags.includes('possession') || tags.includes('balanced') || tags.includes('disciplined');

        match.buffLayers.push({
          source: 'card:possession_lock',
          range: [match.round, match.round],
          stats: { vision: 8, composure: 4 },
          special: null
        });
        match._cardFlow = (match._cardFlow || 0) + 1;  // extra flow

        if (amped && state) {
          drawCards(state, 1);  // draw a bonus card
          return { synergy: 'possession', payoff: true };
        }
        return { synergy: null, payoff: false };
      }
    },

    // Killing Blow — rare, expensive, score-conditional. Only shines
    // when you're already leading. Narratively: putting the game away.
    killing_blow: {
      id: 'killing_blow',
      cost: 2,
      type: 'combo',
      rarity: 'rare',
      tags: ['retain'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const lead = (match.scoreMe || 0) - (match.scoreOpp || 0);
        if (lead >= 1) {
          // Scales with lead size — the bigger the gap, the more decisive
          // the killing blow feels. Formula: 22 + lead*3, capped at 35.
          // So +25 OFF at lead 1, +28 at lead 2, +35 at lead 5+. Cap
          // prevents runaway scaling at absurd score gaps.
          const off = Math.min(35, 22 + lead * 3);
          match.buffLayers.push({
            source: 'card:killing_blow',
            range: [match.round, match.round],
            stats: { offense: off, composure: 8 },
            special: null
          });
          return { synergy: 'lead', payoff: true, leadAt: lead, directAction: { type: 'extraShot' } };
        } else {
          // No lead — the card whimpers. Nothing happens, energy is wasted.
          // Punishes panic play; rewards knowing when to draw vs hold.
          return { synergy: null, payoff: false };
        }
      }
    },

    // ── Telegraph counters ───────────────────────────────────────────────
    // These cards depend on the opp-intent preview being "loaded" with a
    // serious threat (severity ≥ 2). When nothing is telegraphed they
    // still have a base effect so they're never completely dead, but the
    // REAL value comes from reading the intent panel and punishing a
    // signalled opp action before it lands.

    // Block — cheap reactive defense. Soaks a telegraphed threat; small
    // fallback effect when nothing is loaded.
    block: {
      id: 'block',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const threat = window.KL?.cards?.getTelegraphedThreat?.(match);
        const oppMoveThreat = window.KL?.oppMoves?.getTelegraphedThreat?.(match);
        let blockedMove = null;
        if (oppMoveThreat && window.KL?.oppMoves?.blockAnyBigMove) {
          if (window.KL.oppMoves.blockAnyBigMove(match)) {
            blockedMove = oppMoveThreat.id;
          }
        }
        if (threat || blockedMove) {
          match.buffLayers.push({
            source: 'card:block_telegraph',
            range: [match.round, match.round],
            stats: { defense: 28, composure: 6 },
            special: null
          });
          match._oppIntentAbsorbed = threat?.id || blockedMove;
          return { synergy: 'telegraph', payoff: true, absorbed: threat?.name || blockedMove, directAction: { type: 'absorbShot' } };
        }
        // No telegraphed threat — small generic defense.
        match.buffLayers.push({
          source: 'card:block_base',
          range: [match.round, match.round],
          stats: { defense: 8 },
          special: null
        });
        return { synergy: null, payoff: false };
      }
    },

    // Pre-empt — rare prophetic play. If opp has telegraphed a serious
    // action, we short-circuit it AND steal their momentum as flow + a
    // drawn card. Without a telegraph it's a mild flow generator.
    preempt: {
      id: 'preempt',
      cost: 2,
      type: 'counter',
      rarity: 'rare',
      tags: ['pressResist', 'retain'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        const threat = window.KL?.cards?.getTelegraphedThreat?.(match);
        const oppMoveThreat = window.KL?.oppMoves?.getTelegraphedThreat?.(match);
        let blockedMove = null;
        if (oppMoveThreat && window.KL?.oppMoves?.blockAnyBigMove) {
          if (window.KL.oppMoves.blockAnyBigMove(match)) {
            blockedMove = oppMoveThreat.id;
          }
        }
        if (threat || blockedMove) {
          match.buffLayers.push({
            source: 'card:preempt_telegraph',
            range: [match.round, match.round],
            stats: { defense: 22, tempo: 12, composure: 8, offense: 10 },
            special: null
          });
          match._oppIntentAbsorbed = threat?.id || blockedMove;
          match._cardFlow = (match._cardFlow || 0) + 2;
          if (state) drawCards(state, 1);
          return { synergy: 'telegraph', payoff: true, absorbed: threat?.name || blockedMove, directAction: { type: 'interceptCounter' } };
        }
        match._cardFlow = (match._cardFlow || 0) + 1;
        if (state) drawCards(state, 1);
        return { synergy: null, payoff: false };
      }
    },

    // ── Discard-synergy archetype ────────────────────────────────────────
    // Builds around THROUGH BALL's random-discard mechanic, creating a
    // real deck-building axis: "discard-heavy" vs "payoff". Players who
    // pick these cards want Through Ball + Second Wind + Dig Deep in the
    // same deck; the combo rewards emptying your hand early.

    // Second Wind — reward for emptying your hand. Cheap, scales with
    // discards. Incentivizes Through Ball + fast card-play rhythm.
    second_wind: {
      id: 'second_wind',
      cost: 1,
      type: 'setup',
      rarity: 'uncommon',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        const discardCount = (state?._cardDiscard || []).length;
        const scaled = Math.min(discardCount, 5);
        match.buffLayers.push({
          source: 'card:second_wind',
          range: [match.round, match.round],
          stats: { tempo: 4 + scaled * 2, composure: 2 + scaled },
          special: null
        });
        match._cardFlow = (match._cardFlow || 0) + 1;
        // Tactic coupling: possession-style tactics draw an extra card
        // — "catching second wind" fits a team that's orchestrating.
        const tags = match.activeTacticTags || [];
        const possessionTactic = tags.includes('possession') || tags.includes('balanced');
        if (possessionTactic && state) {
          drawCards(state, 1);
        }
        return { discardScale: scaled, payoff: scaled >= 3, tacticBonus: possessionTactic };
      }
    },

    // Dig Deep — pay a discard to gain significant offense. The tension:
    // you voluntarily thin your own hand, hoping the deck pays you back.
    dig_deep: {
      id: 'dig_deep',
      cost: 1,
      type: 'trigger',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        const hand = state?._cardHand || [];
        if (hand.length === 0) {
          // No cards to discard — card is wasted.
          return { discarded: null, payoff: false };
        }
        // Random discard.
        const idx = Math.floor(Math.random() * hand.length);
        const discardedId = hand[idx];
        hand.splice(idx, 1);
        state._cardDiscard.push(discardedId);

        match.buffLayers.push({
          source: 'card:dig_deep',
          range: [match.round, match.round],
          stats: { offense: 20, tempo: 4 },
          special: null
        });
        return { discarded: discardedId, payoff: true, directAction: { type: 'extraShot' } };
      }
    },

    // ── Draw-based archetype ─────────────────────────────────────────────
    // Gives players a way to see more cards per round, creating combo
    // potential and making setup-heavy hands actually playable.

    // Tactical Pause — cheap draw engine. Trades a small buff for card
    // velocity. Best in longer matches where deck-cycling matters.
    tactical_pause: {
      id: 'tactical_pause',
      cost: 1,
      type: 'setup',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (state) {
          drawCards(state, 2);
        }
        match.buffLayers.push({
          source: 'card:tactical_pause',
          range: [match.round, match.round],
          stats: { composure: 6, vision: 4 },
          special: null
        });
        return { payoff: true };
      }
    },

    // Second Half — dramatic mid-match rebuild. At cost 2, shuffles discard
    // back into deck and draws a fresh hand. The "reset" card for when
    // you've burned through setups and need the payoffs back.
    second_half: {
      id: 'second_half',
      cost: 2,
      type: 'setup',
      rarity: 'rare',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (state) {
          // Shuffle discard back into deck
          if (state._cardDiscard && state._cardDiscard.length > 0) {
            state._cardDeck = (state._cardDeck || []).concat(state._cardDiscard);
            state._cardDiscard = [];
            // Simple in-place shuffle
            for (let i = state._cardDeck.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [state._cardDeck[i], state._cardDeck[j]] = [state._cardDeck[j], state._cardDeck[i]];
            }
          }
          // Draw up to hand size + 2 (bonus cards)
          drawCards(state, 3);
        }
        match._cardFlow = (match._cardFlow || 0) + 1;
        // Momentum reframe: like a dressing-room team talk. If the
        // match momentum was negative or neutral coming in, the card
        // snaps us to +20 — a tactical restart. If we're already riding
        // (>+20), it doesn't add because we're already on the wave.
        if ((match.matchMomentum || 0) <= 10) {
          match.matchMomentum = 10;
        }
        match.buffLayers.push({
          source: 'card:second_half',
          range: [match.round, match.round],
          stats: { composure: 6, tempo: 3 },
          special: null
        });
        return { payoff: true };
      }
    },

    // ── Condition-system cards ───────────────────────────────────────────
    // These three cards pair with the match-long condition mechanic. At
    // kickoff every starter is at 100; they lose 8 per round until the
    // end, when most are sitting below the <50 stat-penalty threshold.
    // These cards let the player actively manage that curve.

    // Breather — restore condition to the lowest-condition starter. Cheap
    // maintenance, no drama. Pairs well with late-match play.
    breather: {
      id: 'breather',
      cost: 1,
      type: 'defense',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const starters = (match.squad || []).filter(p => typeof p.condition === 'number');
        if (starters.length === 0) return { payoff: false };
        // Target the most tired starter (prioritize injury scare target if active).
        starters.sort((a, b) => (a.condition || 0) - (b.condition || 0));
        let target = starters[0];
        let injuryResolved = false;
        if (match._injuryScareTarget) {
          const injured = starters.find(p => p.id === match._injuryScareTarget);
          if (injured) {
            target = injured;
            match._injuryScareTarget = null;
            injuryResolved = true;
          }
        }
        const before = target.condition;
        const mm = match.matchMomentum || 0;
        const restoreAmount = (mm > -20 && mm < 20) ? 30 : 20;
        // If resolving injury scare, heal more (caring for the problem)
        const finalRestore = injuryResolved ? restoreAmount + 15 : restoreAmount;
        target.condition = Math.min(100, target.condition + finalRestore);
        match.buffLayers.push({
          source: 'card:breather',
          range: [match.round, match.round],
          stats: { defense: 4, composure: 4 },
          special: null
        });
        return {
          payoff: true,
          targetId: target.id,
          targetName: target.name,
          conditionDelta: target.condition - before,
          conditionAfter: target.condition,
          injuryResolved
        };
      }
    },

    // Rotation — swap a tired starter off for a bench player. Restores
    // the outgoing player's condition to 90 and refreshes stats via the
    // fresh bench slot. Only works if bench has players; fails loud if
    // it can't swap.
    rotation: {
      id: 'rotation',
      cost: 1,
      type: 'defense',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Rotation is a "future feature placeholder" for the full-game
        // substitution system. For MVP we just pump condition on the
        // most tired player — the idea is there, the plumbing can come
        // when the broader sub system lands.
        const starters = (match.squad || []).filter(p => typeof p.condition === 'number');
        if (starters.length === 0) return { payoff: false };
        starters.sort((a, b) => (a.condition || 0) - (b.condition || 0));
        const target = starters[0];
        const before = target.condition;
        target.condition = 90;
        match.buffLayers.push({
          source: 'card:rotation',
          range: [match.round, match.round + 1],
          stats: { tempo: 6, composure: 4 },
          special: null
        });
        return {
          payoff: true,
          targetId: target.id,
          targetName: target.name,
          conditionDelta: 90 - before,
          conditionAfter: target.condition
        };
      }
    },

    // Doping — risk/reward resource play. Big condition bump but a 25%
    // chance of a yellow card to the ST, which is a permanent CMP hit
    // for the rest of the match. Narratively: the striker takes the
    // risk. Third play in the same match FORCES the backfire — the
    // ref has lost patience, the body can't take more.
    doping: {
      id: 'doping',
      cost: 2,
      type: 'trigger',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const st = (match.squad || []).find(p => p.role === 'ST');
        if (!st) return { payoff: false };

        // Boost condition dramatically
        const conditionBefore = st.condition ?? 100;
        st.condition = Math.min(100, (st.condition ?? 100) + 30);
        const conditionDelta = st.condition - conditionBefore;

        // Tactic coupling: disciplined/possession tactics reduce the
        // backfire risk — the team structure keeps the striker in check.
        // Aggressive tactics amplify it — adrenaline on adrenaline.
        const tags = match.activeTacticTags || [];
        const disciplined = tags.includes('disciplined') || tags.includes('possession') || tags.includes('balanced');
        const amped = tags.includes('aggressive') || tags.includes('tempo');

        match.buffLayers.push({
          source: 'card:doping',
          range: [match.round, match.round],
          stats: { offense: 10 + (amped ? 4 : 0), tempo: 6 },
          special: null
        });

        // Cooldown: track plays per match. 1st-2nd have 25% backfire,
        // 3rd+ is forced (100% backfire). Pushes the player toward
        // "burn two copies max" and punishes trying to cheese it.
        match._dopingCount = (match._dopingCount || 0) + 1;
        const forcedBackfire = match._dopingCount >= 3;
        const backfired = forcedBackfire || Math.random() < dopingBackfireChance();

        function dopingBackfireChance() {
          // Momentum modulates risk — a team riding a rush has such
          // momentum that the risky enhancement feels routine (15%
          // instead of 25%). Pressured teams flip to 30% — fatigue
          // and urgency combine against the play. Tactic coupling:
          // disciplined tactics shave 5 points off the backfire risk.
          const mm = match.matchMomentum || 0;
          let base;
          if (mm >= 60) base = 0.15;
          else if (mm <= -40) base = 0.30;
          else base = 0.25;
          if (disciplined) base = Math.max(0.10, base - 0.05);
          return base;
        }

        if (backfired) {
          match.buffLayers.push({
            source: 'card:doping_backfire',
            range: [match.round, 6],
            stats: { composure: -4 },
            special: null
          });
          return {
            payoff: true, backfired: true, forced: forcedBackfire,
            targetId: st.id, targetName: st.name, conditionDelta,
            conditionAfter: st.condition, plays: match._dopingCount
          };
        }
        return {
          payoff: true, backfired: false,
          targetId: st.id, targetName: st.name, conditionDelta,
          conditionAfter: st.condition, plays: match._dopingCount
        };
      }
    },

    // ─── Sacrifice archetype — trade deck depth for raw power ───────────
    // Burn Plan: costs 0, but immediately exiles ANOTHER random card from
    // your hand (removed from match deck — returns for next match). In
    // exchange: +22 OFF / +10 TMP this round. Rewards hands with a dud
    // you'd discard anyway and punishes picking it when your hand is all
    // gold. Very roguelike — a real cost for a real payoff.
    burn_plan: {
      id: 'burn_plan',
      cost: 0,
      type: 'trigger',
      rarity: 'rare',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (!state || !state._cardHand || state._cardHand.length === 0) {
          // Nothing to sacrifice — dud play, weak effect only.
          match.buffLayers.push({
            source: 'card:burn_plan_empty',
            range: [match.round, match.round],
            stats: { offense: 6 },
            special: null
          });
          return { payoff: false, outcome: 'dud' };
        }

        // Pick a random OTHER card from hand to sacrifice. Prefer low-cost
        // (often the weak basics — grind_through, hope_shot, long_ball)
        // but leave some randomness so the player doesn't always dump
        // their least-valuable card. Simple weighted pick: inverse-cost
        // weight, no explicit filtering of card type.
        const hand = state._cardHand;
        const weights = hand.map(id => {
          const def = window.KL?.cards?.getCardDef?.(id);
          return Math.max(1, 4 - (def?.cost || 1));
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let pick = Math.random() * total;
        let targetIdx = 0;
        for (let i = 0; i < weights.length; i++) {
          pick -= weights[i];
          if (pick <= 0) { targetIdx = i; break; }
        }
        const sacrificedId = hand.splice(targetIdx, 1)[0];

        // Track burned cards for narrative + next-match restore.
        // We don't permanently delete from deck — the card exits THIS
        // match only, returns in the shuffle next match. This keeps
        // Burn Plan's cost bounded (one dud-turn) without the stakes
        // of truly permanent deletion.
        if (!match._burnedCards) match._burnedCards = [];
        match._burnedCards.push(sacrificedId);

        match.buffLayers.push({
          source: 'card:burn_plan',
          range: [match.round, match.round],
          stats: { offense: 22, tempo: 10 },
          special: null
        });

        const sacrificedDef = window.KL?.cards?.getCardDef?.(sacrificedId);
        const sacrificedName = sacrificedDef
          ? (window.I18N?.t?.('ui.cards.' + sacrificedId + '.name') || sacrificedId)
          : sacrificedId;
        return { payoff: true, sacrificed: sacrificedName, directAction: { type: 'extraShot' } };
      }
    },

    // ─── Momentum archetype — scales with run-level win streak ───────────
    // Running Hot: base +6 OFF / +3 TMP, plus +5 OFF per consecutive run
    // win (capped at 5 wins = +25 bonus = +31 OFF total). Makes a win
    // streak FEEL like a snowball — the deck gets stronger as you stack
    // wins. Punishes losses: streak resets, card becomes weak.
    running_hot: {
      id: 'running_hot',
      cost: 1,
      type: 'trigger',
      rarity: 'rare',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const streak = Math.min(5, window.state?.currentWinStreak || 0);
        const bonus = streak * 3;
        const mm = match.matchMomentum || 0;
        const momentumBonus = Math.round(mm / 20);

        const tags = match.activeTacticTags || [];
        const tacticAmped = tags.includes('aggressive') || tags.includes('tempo');
        const tacticBonus = tacticAmped ? 4 : 0;

        match.buffLayers.push({
          source: 'card:running_hot',
          range: [match.round, match.round],
          stats: {
            offense: 4 + bonus + momentumBonus + tacticBonus,
            tempo: 2 + Math.floor(bonus / 2)
          },
          special: null
        });

        // Outcome flavor: "cold" with streak 0-1, "warm" 2-3, "hot" 4+
        let heat = 'cold';
        if (streak >= 4) heat = 'hot';
        else if (streak >= 2) heat = 'warm';
        return {
          payoff: streak > 0,
          outcome: streak === 0 ? 'dud' : (streak >= 4 ? 'setup' : null),
          streak, bonus, heat,
          directAction: streak >= 2 ? { type: 'extraShot' } : null
        };
      }
    },

    // ─── Echo archetype — replay the last non-echo card played ───────────
    // Second Wave: draws +1 AND if anything has been played this match,
    // replays the last one at 60% effect (applied via a scaled-down
    // buffLayer copy). Combo enabler: stack a big setup, then Echo it for
    // a cheap second round of impact.
    second_wave: {
      id: 'second_wave',
      cost: 1,
      type: 'draw',
      rarity: 'rare',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (state) {
          drawCards(state, 1);
        }

        const played = (match._cardsPlayedThisMatch || []).filter(p =>
          p.id && p.id !== 'second_wave'
        );
        if (played.length === 0) {
          // No prior play — Second Wave just draws. Acknowledged dud.
          return { payoff: false, outcome: 'dud' };
        }

        const last = played[played.length - 1];
        const lastDef = window.KL?.cards?.getCardDef?.(last.id);
        if (!lastDef) return { payoff: false, outcome: 'dud' };

        // Echo the last card's stats at 60%. We snapshot from the most
        // recent matching buffLayer (scoped to that play's round) rather
        // than re-invoking apply() — cleaner, no double-dipping on
        // state mutations like drawing or condition changes.
        const lastRound = last.round;
        const matching = (match.buffLayers || []).filter(L =>
          L.source === 'card:' + last.id && L.range[0] === lastRound
        );

        if (matching.length === 0) {
          // Last play didn't leave a buffLayer (e.g. was a draw card).
          // Fall back to small generic bonus.
          match.buffLayers.push({
            source: 'card:second_wave_fallback',
            range: [match.round, match.round],
            stats: { offense: 6, tempo: 3 },
            special: null
          });
          return { payoff: true, echoed: last.id, fallback: true };
        }

        // Clone the first matching buffLayer, scale stats, shift round.
        const src = matching[0];
        const scaledStats = {};
        for (const k of Object.keys(src.stats || {})) {
          scaledStats[k] = Math.round((src.stats[k] || 0) * 0.6);
        }
        match.buffLayers.push({
          source: 'card:second_wave_echo',
          range: [match.round, match.round],
          stats: scaledStats,
          special: null
        });

        const lastName = window.I18N?.t?.('ui.cards.' + last.id + '.name') || last.id;
        return { payoff: true, echoed: last.id, echoedName: lastName };
      }
    },

    // ─── Shield archetype (v51) — player-reactive counters to OPP_CARDS ──
    // Shields set match._playerShield = { type, cardId }. The engine checks
    // this in applyOppAdaptation #7 before picking an opp-card to play, and
    // consumes the shield according to its type. Max 1 shield active at a
    // time — playing a second shield overrides the first (so energy is a
    // real constraint, not just "stack all four"). On successful block,
    // state._oppCardBlocksThisRun increments (shieldMaster achievement).

    tactical_discipline: {
      id: 'tactical_discipline',
      cost: 2,
      type: 'defense',
      rarity: 'uncommon',
      tags: ['shield', 'counter'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match._playerShield = { type: 'block', cardId: 'tactical_discipline' };
        // Small passive defense boost until the shield triggers — you're
        // keeping shape waiting for their move.
        match.buffLayers.push({
          source: 'card:tactical_discipline',
          range: [match.round, 6],
          stats: { defense: 4, composure: 3 },
          special: null
        });
      }
    },

    counter_read: {
      id: 'counter_read',
      cost: 2,
      type: 'defense',
      rarity: 'uncommon',
      tags: ['shield', 'defense'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match._playerShield = { type: 'halve', cardId: 'counter_read' };
        match.buffLayers.push({
          source: 'card:counter_read',
          range: [match.round, match.round],
          stats: { vision: 6, composure: 3 },
          special: null
        });
      }
    },

    regroup: {
      id: 'regroup',
      cost: 3,
      type: 'defense',
      rarity: 'rare',
      tags: ['shield', 'counter'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Purge all active opp-adaptation layers — opp-cards, halftime
        // adjustments, scouts, rages. Fresh slate from this round on.
        const before = (match.buffLayers || []).length;
        match.buffLayers = (match.buffLayers || []).filter(L => {
          const src = L.source || '';
          return !src.startsWith('opp_adapt:') && !src.startsWith('opp_card:');
        });
        const purged = before - match.buffLayers.length;
        match._regroupPurgedThisMatch = (match._regroupPurgedThisMatch || 0) + purged;
        // Count this as a block for shieldMaster if we purged an opp-card.
        if (purged > 0 && ctx.state) {
          ctx.state._oppCardBlocksThisRun = (ctx.state._oppCardBlocksThisRun || 0) + 1;
        }
        // Fresh defensive stance for this round.
        match.buffLayers.push({
          source: 'card:regroup',
          range: [match.round, match.round],
          stats: { defense: 10, composure: 6, tempo: 4 },
          special: null
        });
        return { payoff: purged > 0, purged };
      }
    },

    intel_leak: {
      id: 'intel_leak',
      cost: 1,
      type: 'setup',
      rarity: 'common',
      tags: ['shield'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        // Reveal-type shield. Doesn't block — just logs the incoming
        // opp-card when it fires, so the player can adjust next round.
        match._playerShield = { type: 'reveal', cardId: 'intel_leak' };
        // Small vision bump — you're reading the game.
        match.buffLayers.push({
          source: 'card:intel_leak',
          range: [match.round, match.round],
          stats: { vision: 5 },
          special: null
        });
      }
    },

    // ─── Draw archetype expansion (v52.2) ────────────────────────────────
    // Before v52.2 `second_wave` was the only card typed `draw`, which
    // meant the entire `draw` row of PHASE_AFFINITY covered a single
    // card. The three cards below give the archetype real presence so
    // the phase-affinity row isn't dead coverage, and so decks can
    // actually commit to a draw-heavy identity.

    // Quick Scout — cheap cycle. The workhorse draw. One-cost, draws 2,
    // small vision buff. Flow-tag so it still contributes to setup-heavy
    // payoff chains even without its own standalone payoff.
    quick_scout: {
      id: 'quick_scout',
      cost: 1,
      type: 'draw',
      rarity: 'common',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (state) {
          drawCards(state, 2);
        }
        match.buffLayers.push({
          source: 'card:quick_scout',
          range: [match.round, match.round],
          stats: { vision: 5, tempo: 2 },
          special: null
        });
        return { payoff: true };
      }
    },

    // Study Opposition — information-draw. Draws 2 and promotes the
    // current opp intent to telegraphed status regardless of severity.
    // Pairs with Block / Pre-empt: normally those only fire on severity
    // ≥ 2, but after a Study play even a severity-1 nuisance gets flagged
    // and can be absorbed. Synergy with the shield archetype.
    study_opposition: {
      id: 'study_opposition',
      cost: 1,
      type: 'draw',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (state) {
          drawCards(state, 2);
        }
        match.buffLayers.push({
          source: 'card:study_opposition',
          range: [match.round, match.round],
          stats: { vision: 8, composure: 3 },
          special: null
        });
        // Force-telegraph the current intent for this round so reactive
        // counters become live. We flag it via a match-scoped marker
        // that getTelegraphedThreat honours — see cards.js telegraphy.
        match._forceTelegraphThisRound = true;
        return { payoff: true };
      }
    },

    // Endgame Plan — late-match draw-payoff hybrid. Draws 3. In rounds
    // 4-6 it also fires +Flow 1 and a composure bump, converting raw
    // card velocity into closing power. In early rounds it's "just"
    // a 3-draw for 2 energy — still useful, but the real payoff is
    // when you cycle it into a late-match hand.
    //
    // Payoff flag maps to narrative branch: true → "endgame activated"
    // flavorHit, false → "too early, just a draw" flavorMiss. The card
    // still draws 3 either way — payoff here signals "did the BONUS
    // effect fire", not "did the card do anything".
    endgame_plan: {
      id: 'endgame_plan',
      cost: 2,
      type: 'draw',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        if (state) {
          drawCards(state, 3);
        }
        const lateGame = (match.round || 1) >= 4;
        if (lateGame) {
          match._cardFlow = (match._cardFlow || 0) + 1;
          match.buffLayers.push({
            source: 'card:endgame_plan_late',
            range: [match.round, match.round],
            stats: { composure: 10, vision: 6 },
            special: null
          });
          return { payoff: true, lateGame: true };
        }
        match.buffLayers.push({
          source: 'card:endgame_plan_early',
          range: [match.round, match.round],
          stats: { vision: 4 },
          special: null
        });
        return { payoff: false, lateGame: false };
      }
    },

    // ─── Inventory-fill cards (v52.2) ────────────────────────────────────
    // Ten additional cards addressing thin spots in the catalog: more
    // combo coverage that doesn't strictly need a lane, defensive
    // options for trailing matches, condition-management setup, and a
    // few role-specific power plays. All registered in UNCOMMON_POOL
    // below — none are starter deck by default.

    // Quick Screen — cheap defensive setup. Cheap shape + a small
    // pressResist tick. Useful early-round filler when your hand has
    // no big plays yet. Press-resist comes from the 'pressResist' tag
    // (auto-applied by playCard's tag loop); apply() itself doesn't
    // need to bump it or it would double-count.
    quick_screen: {
      id: 'quick_screen',
      cost: 1,
      type: 'setup',
      rarity: 'common',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:quick_screen',
          range: [match.round, match.round],
          stats: { defense: 6, tempo: 3 },
          special: null
        });
      }
    },

    // Triangle Play — dual-signal setup. A rare single-card producer of
    // BOTH flow AND laneOpen. Compresses two setup-plays into one slot,
    // so combo decks can reach the attack-phase multiplier with fewer
    // setup turns spent.
    triangle_play: {
      id: 'triangle_play',
      cost: 1,
      type: 'setup',
      rarity: 'uncommon',
      tags: ['flow', 'laneOpen'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:triangle_play',
          range: [match.round, match.round],
          stats: { tempo: 6, vision: 4, offense: 2 },
          special: null
        });
        match._cardLaneOpen = true;
      }
    },

    // Pressure Trap — counter that converts an opp telegraph into flow.
    // Fills out the counter archetype for possession decks: they rarely
    // absorb shots but want to turn opp loads into their own momentum.
    pressure_trap: {
      id: 'pressure_trap',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const threat = window.KL?.cards?.getTelegraphedThreat?.(match);
        if (threat) {
          match.buffLayers.push({
            source: 'card:pressure_trap_hit',
            range: [match.round, match.round],
            stats: { defense: 14, composure: 6, tempo: 4 },
            special: null
          });
          match._cardFlow = (match._cardFlow || 0) + 1;
          match._oppIntentAbsorbed = threat.id;
          return { synergy: 'telegraph', payoff: true, absorbed: threat.name };
        }
        match.buffLayers.push({
          source: 'card:pressure_trap_base',
          range: [match.round, match.round],
          stats: { defense: 8, composure: 3 },
          special: null
        });
        return { synergy: null, payoff: false };
      }
    },

    // Set Piece — flow-gated combo that does NOT require laneOpen. Gives
    // combo-heavy decks without setups-with-laneOpen a payoff line:
    // corners, free kicks, set routines that don't need open space.
    set_piece: {
      id: 'set_piece',
      cost: 1,
      type: 'combo',
      rarity: 'uncommon',
      tags: [],
      needs: ['flow'],
      apply(ctx) {
        const { match } = ctx;
        const flow = match._cardFlow || 0;
        if (flow >= 2) {
          match.buffLayers.push({
            source: 'card:set_piece',
            range: [match.round, match.round],
            stats: { offense: 26, composure: 4 },
            special: null
          });
          match._cardFlow = flow - 1;
          return { payoff: true, directAction: { type: 'extraShot' } };
        }
        match.buffLayers.push({
          source: 'card:set_piece_weak',
          range: [match.round, match.round],
          stats: { composure: 4 },
          special: null
        });
        return { payoff: false };
      }
    },

    // Deep Defense — flat defensive brick. No conditions, no interaction.
    // The stable wall card for rounds where you just need to not concede.
    // Boring by design — it exists so "play defense" is always an option
    // even when your reactive counters don't fit the round. Press-resist
    // comes from the tag; apply() doesn't re-bump it.
    deep_defense: {
      id: 'deep_defense',
      cost: 1,
      type: 'defense',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        match.buffLayers.push({
          source: 'card:deep_defense',
          range: [match.round, match.round],
          stats: { defense: 20, composure: 4 },
          special: null
        });
      }
    },

    // Lone Striker — rare combo gated on striker condition. If your ST
    // is fresh (condition ≥ 70), you get a big offensive spike + a
    // direct extraShot. Incentivises keeping the ST out of fatigue-
    // heavy plays earlier, and rewards rotation management.
    lone_striker: {
      id: 'lone_striker',
      cost: 1,
      type: 'combo',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const st = (match.squad || []).find(p => p.role === 'ST');
        const fresh = st && (st.condition || 0) >= 70;
        if (fresh) {
          match.buffLayers.push({
            source: 'card:lone_striker_fresh',
            range: [match.round, match.round],
            stats: { offense: 22, composure: 6 },
            special: null
          });
          return { payoff: true, freshStriker: true, directAction: { type: 'extraShot' } };
        }
        match.buffLayers.push({
          source: 'card:lone_striker_tired',
          range: [match.round, match.round],
          stats: { offense: 5 },
          special: null
        });
        return { payoff: false, freshStriker: false };
      }
    },

    // Team Unity — broad-stroke condition management. Any starter under
    // 60 condition gets +10. Numbers are deliberately modest per-player
    // so it's not a strict upgrade over Breather (which dumps 20-30 on
    // one player) — Unity instead shines when MANY starters are tired.
    team_unity: {
      id: 'team_unity',
      cost: 2,
      type: 'setup',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const starters = (match.squad || []).filter(p => typeof p.condition === 'number');
        let lifted = 0;
        for (const p of starters) {
          if (p.condition < 60) {
            p.condition = Math.min(100, p.condition + 10);
            lifted += 1;
          }
        }
        match.buffLayers.push({
          source: 'card:team_unity',
          range: [match.round, match.round],
          stats: { composure: 4 + Math.min(8, lifted * 2), vision: 2 },
          special: null
        });
        return { payoff: lifted >= 2, lifted };
      }
    },

    // Final Whistle — late-match comeback combo. Only wakes up in rounds
    // 5-6 when you're not ahead. Opens a lane + flow + offense spike,
    // deliberately strong because its window is narrow: leading teams,
    // early rounds, and mid-lead matches all see nothing from it.
    final_whistle: {
      id: 'final_whistle',
      cost: 1,
      type: 'combo',
      rarity: 'rare',
      tags: ['retain'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const lateEnough = (match.round || 1) >= 5;
        const trailingOrTied = (match.scoreMe || 0) <= (match.scoreOpp || 0);
        if (lateEnough && trailingOrTied) {
          match.buffLayers.push({
            source: 'card:final_whistle',
            range: [match.round, match.round],
            stats: { offense: 20, tempo: 10, composure: 6 },
            special: null
          });
          match._cardLaneOpen = true;
          match._cardFlow = (match._cardFlow || 0) + 1;
          return { payoff: true, directAction: { type: 'extraShot' } };
        }
        match.buffLayers.push({
          source: 'card:final_whistle_dud',
          range: [match.round, match.round],
          stats: { composure: 4 },
          special: null
        });
        return { payoff: false, lateEnough, trailingOrTied };
      }
    },

    // Last Stand — desperation defense. When you're trailing, this is a
    // big defensive spike plus activates the momentum-drop shield so
    // the next conceded goal only halves your momentum loss. Mirror
    // card to Final Whistle on the defensive axis: comeback tool kit.
    last_stand: {
      id: 'last_stand',
      cost: 1,
      type: 'defense',
      rarity: 'rare',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const trailing = (match.scoreMe || 0) < (match.scoreOpp || 0);
        if (trailing) {
          match.buffLayers.push({
            source: 'card:last_stand_trailing',
            range: [match.round, match.round],
            stats: { defense: 24, composure: 10 },
            special: null
          });
          match._cardMomentumShield = true;
          registerActiveEffect(match, {
            cardId:   'last_stand',
            icon:     '🛡',
            label:    'Shield',
            type:     'pending',
            duration: 99,
            note:     'Next goal conceded: half momentum drop.'
          });
          return { payoff: true, trailing: true };
        }
        match.buffLayers.push({
          source: 'card:last_stand_base',
          range: [match.round, match.round],
          stats: { defense: 8, composure: 3 },
          special: null
        });
        return { payoff: false, trailing: false };
      }
    },

    // Field Commander — powerful multi-stat trigger gated on the PM's
    // condition. Fresh PM (≥ 50) enables a broad +OFF / +TMP / +CMP
    // spike plus a flow tick; fatigued PM gets only a small consolation.
    // Gives PM-centric builds a marquee card that scales with how well
    // the player manages midfield load.
    //
    // NOTE: no 'flow' tag on this card — the flow +1 is part of the
    // fresh-PM payoff, not a guaranteed side effect. Using the tag here
    // would double-count with the explicit bump in the fresh branch,
    // and would also hand +1 flow to the tired-PM branch that shouldn't
    // be getting the bonus at all.
    field_commander: {
      id: 'field_commander',
      cost: 2,
      type: 'trigger',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const pm = (match.squad || []).find(p => p.role === 'PM');
        const fresh = pm && (pm.condition || 0) >= 50;
        if (fresh) {
          match.buffLayers.push({
            source: 'card:field_commander_fresh',
            range: [match.round, match.round],
            stats: { offense: 14, tempo: 10, composure: 6, vision: 6 },
            special: null
          });
          match._cardFlow = (match._cardFlow || 0) + 1;
          return { payoff: true, freshPm: true };
        }
        match.buffLayers.push({
          source: 'card:field_commander_tired',
          range: [match.round, match.round],
          stats: { tempo: 4, composure: 2 },
          special: null
        });
        return { payoff: false, freshPm: false };
      }
    },

    break_the_line: {
      id: 'break_the_line',
      cost: 2,
      type: 'combo',
      rarity: 'rare',
      tags: ['laneOpen'],
      needs: ['flow'],
      apply(ctx) {
        const { match } = ctx;
        const flow = match._cardFlow || 0;
        const oppLocked = match._oppMoveCurrentCategory === 'lockdown';
        const oppBigMove = !!window.KL?.oppMoves?.getTelegraphedThreat?.(match);
        const bonus = oppLocked || oppBigMove ? 15 : 0;
        if (flow >= 2) {
          match.buffLayers.push({
            source: 'card:break_the_line',
            range: [match.round, match.round],
            stats: { offense: 22 + bonus, tempo: 8 },
            special: null
          });
          match._cardFlow -= 2;
          match._cardLaneOpen = true;
          if (oppLocked && match._oppMoveCurrent) {
            window.KL?.oppMoves?.blockSignalledMove?.(match, match._oppMoveCurrent);
          }
          return { synergy: oppLocked ? 'vs_lockdown' : 'flow', payoff: true, directAction: { type: 'extraShot' } };
        }
        match.buffLayers.push({
          source: 'card:break_the_line',
          range: [match.round, match.round],
          stats: { offense: 8 },
          special: null
        });
        return { synergy: null, payoff: false };
      }
    },

    medic: {
      id: 'medic',
      cost: 1,
      type: 'defense',
      rarity: 'uncommon',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const victimId = match._oppMoveDirtyTackleVictim;
        const foulPending = match._oppMoveFoulPending;
        let target = null;
        if (victimId) {
          target = (match.squad || []).find(p => p.id === victimId);
          match._oppMoveDirtyTackleVictim = null;
        }
        if (!target) {
          const starters = (match.squad || []).filter(p => typeof p.condition === 'number');
          starters.sort((a, b) => (a.condition || 0) - (b.condition || 0));
          target = starters[0];
        }
        if (target) {
          target.condition = Math.min(100, (target.condition ?? 100) + 25);
        }
        if (foulPending) {
          match._oppMoveFoulPending = false;
        }
        match.buffLayers.push({
          source: 'card:medic',
          range: [match.round, match.round],
          stats: { composure: 4, defense: 3 },
          special: null
        });
        const payoff = !!(victimId || foulPending);
        return { payoff, restored: target?.name };
      }
    },

    poker_face: {
      id: 'poker_face',
      cost: 1,
      type: 'defense',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const fakePressActive = match._oppMoveFakePress;
        const studyTapeActive = (match._oppMoveStudyTapeRoundsLeft || 0) > 0;
        if (fakePressActive) match._oppMoveFakePress = false;
        if (studyTapeActive) match._oppMoveStudyTapeRoundsLeft = 0;
        match._pokerFaceImmune = true;
        match.buffLayers.push({
          source: 'card:poker_face',
          range: [match.round, match.round],
          stats: { composure: 8, vision: 4 },
          special: null
        });
        return { payoff: fakePressActive || studyTapeActive };
      }
    },

    read_the_game: {
      id: 'read_the_game',
      cost: 1,
      type: 'draw',
      rarity: 'uncommon',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        match._readTheGameActive = true;
        match._cardFlow = (match._cardFlow || 0) + 1;
        if (state) drawCards(state, 1);
        match.buffLayers.push({
          source: 'card:read_the_game',
          range: [match.round, match.round],
          stats: { vision: 10, composure: 3 },
          special: null
        });
        return { payoff: true };
      }
    },

    late_winner: {
      id: 'late_winner',
      cost: 2,
      type: 'combo',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const isLate = (match.round || 0) >= 5;
        if (isLate) {
          match.buffLayers.push({
            source: 'card:late_winner',
            range: [match.round, match.round],
            stats: { offense: 28, composure: 10, tempo: 6 },
            special: null
          });
          match._lateWinnerIgnoreOppDefBuffs = true;
          return { payoff: true, directAction: { type: 'extraShot' } };
        }
        match.buffLayers.push({
          source: 'card:late_winner_early',
          range: [match.round, match.round],
          stats: { composure: 5 },
          special: null
        });
        return { payoff: false };
      }
    },

    clutch_defense: {
      id: 'clutch_defense',
      cost: 2,
      type: 'defense',
      rarity: 'rare',
      tags: [],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const oppBigMove = window.KL?.oppMoves?.getTelegraphedThreat?.(match);
        let blocked = false;
        if (oppBigMove && window.KL?.oppMoves?.blockAnyBigMove) {
          blocked = window.KL.oppMoves.blockAnyBigMove(match);
        }
        if (blocked) {
          match.buffLayers.push({
            source: 'card:clutch_defense_big',
            range: [match.round, match.round],
            stats: { defense: 30, composure: 12 },
            special: null
          });
          match._cardGuaranteedSave = true;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 20);
          return { synergy: 'big_block', payoff: true, absorbed: oppBigMove.id, directAction: { type: 'absorbShot' } };
        }
        match.buffLayers.push({
          source: 'card:clutch_defense_base',
          range: [match.round, match.round],
          stats: { defense: 12, composure: 6 },
          special: null
        });
        match._cardAbsorbNextOppShot = true;
        return { payoff: false };
      }
    },

    counterpunch: {
      id: 'counterpunch',
      cost: 1,
      type: 'counter',
      rarity: 'uncommon',
      tags: ['pressResist'],
      needs: [],
      apply(ctx) {
        const { match } = ctx;
        const cbArmed = match._oppMoveCounterBlitzArmed;
        if (cbArmed) {
          match._oppMoveCounterBlitzArmed = false;
          match.buffLayers.push({
            source: 'card:counterpunch_cb',
            range: [match.round, match.round],
            stats: { offense: 18, tempo: 8, defense: 6 },
            special: null
          });
          match.counterPending = true;
          return { synergy: 'vs_counter', payoff: true, directAction: { type: 'interceptCounter' } };
        }
        match.buffLayers.push({
          source: 'card:counterpunch_base',
          range: [match.round, match.round],
          stats: { offense: 6, tempo: 4 },
          special: null
        });
        return { payoff: false };
      }
    },

    scout_report: {
      id: 'scout_report',
      cost: 2,
      type: 'draw',
      rarity: 'rare',
      tags: ['flow'],
      needs: [],
      apply(ctx) {
        const { match, state } = ctx;
        match._scoutReportActive = 2;
        match._cardFlow = (match._cardFlow || 0) + 2;
        if (state) drawCards(state, 2);
        match.buffLayers.push({
          source: 'card:scout_report',
          range: [match.round, match.round],
          stats: { vision: 14, composure: 4 },
          special: null
        });
        const oppDeck = match.opp?._oppDeck || [];
        return { payoff: true, deckSize: oppDeck.length };
      }
    }
  };

  // ─── Starter deck ────────────────────────────────────────────────────────
  // 12 cards — a mix of workhorse commons PLUS 3 deliberately-weak basics
  // so the post-match REMOVE option has meaningful targets. Thinning the
  // deck is a progression move: draw more consistency, see your payoff
  // cards more often.
  // v0.40 — Team-archetype starter decks.
  //
  // Design: 10 shared CORE cards that every team starts with (they teach
  // the fundamental mechanics — Flow, Lane, Recovery, basic triggers),
  // plus 4 TEAM-specific cards that reinforce the team's thematic
  // identity and give it a distinct early-game feel.
  //
  // Core slots: drop_deep ×2, switch_lane ×2, quick_build, tight_shape,
  // hold_the_line, overlap_run, hero_moment, breather. Total 10 cards
  // covering 3 setups, 2 defenses, 1 trigger, 1 combo, 1 recovery,
  // plus 2 extra flow-generators (drop_deep ×2, switch_lane ×2).
  //
  // Archetype slots are picked to match each team's thematic profile:
  //
  //   konter (Counter-Specialists): pragmatic, counter-attack.
  //     → hope_shot + long_ball + ball_recovery + grind_through
  //     Fast direct play with a real counter card; physical grind as
  //     fallback when the break-away doesn't materialize.
  //
  //   kraft (Powerhouse): physical, late-game dominance.
  //     → long_ball + deep_defense + grind_through + lone_striker
  //     Route-one football plus a target-man combo; deep_defense
  //     anchors the late-match attrition identity.
  //
  //   technik (Technicians): vision, possession, precision combos.
  //     → masterclass + triangle_play + clinical_finish + quick_scout
  //     A second combo card, a short-pass setup, a precision combo
  //     finisher, and one draw card to keep the technical engine
  //     ticking. Most combo-dense starter of the four.
  //
  //   pressing (Pressing Beasts): aggressive, disruption.
  //     → forward_burst + high_press_trap + counterpunch + running_hot
  //     Two counter-type cards (press_trap + counterpunch) plus two
  //     high-intensity triggers. Punishing when everything clicks,
  //     brittle when condition drops.
  //
  // Fallback: any unrecognized team uses the konter deck (previous
  // starter composition was closest to this archetype).
  const STARTER_CORE = [
    'drop_deep', 'drop_deep',
    'switch_lane', 'switch_lane',
    'quick_build',
    'tight_shape',
    'hold_the_line',
    'overlap_run',
    'hero_moment',
    'breather'
  ];
  const STARTER_ARCHETYPE = {
    konter:   ['hope_shot',      'long_ball',        'ball_recovery', 'grind_through'],
    kraft:    ['long_ball',      'deep_defense',     'grind_through', 'lone_striker'],
    technik:  ['masterclass',    'triangle_play',    'clinical_finish', 'quick_scout'],
    pressing: ['forward_burst',  'high_press_trap',  'counterpunch',  'running_hot']
  };

  // Legacy export — kept for backwards compatibility with any code that
  // reads STARTER_DECK directly. Contains the konter archetype composition
  // so existing runs without a teamId keep working.
  const STARTER_DECK = STARTER_CORE.concat(STARTER_ARCHETYPE.konter);

  // Draft pool — what the player can ADD from post-match offers. Mix of
  // regular uncommons and the new action cards (which start out only in
  // the draft pool, not in the starter deck).
  const UNCOMMON_POOL = [
    'wing_trap',
    'masterclass',
    'stamina_boost',
    'clinical_finish',
    'deep_focus',
    'keeper_rush',
    'forward_burst',
    'ball_recovery',
    // Action cards — the soul of the deck
    'desperate_foul',
    'bait_counter',
    'through_ball',
    'stone_cold',
    // Tactic-synergy cards (new)
    'gegenpress',
    'possession_lock',
    'killing_blow',
    // Telegraph counters — punish signalled opp threats
    'block',
    'preempt',
    // Discard-synergy archetype — pairs with Through Ball
    'second_wind',
    'dig_deep',
    // Draw-based archetype — card velocity
    'tactical_pause',
    'second_half',
    // Condition-system cards — manage player fatigue
    'breather',
    'rotation',
    'doping',
    // New archetypes — sacrifice / momentum / echo
    'burn_plan',
    'running_hot',
    'second_wave',
    // Momentum archetype — interact with match-level momentum swings
    'tide_turner',
    'ride_the_wave',
    'storm_warning',
    // Aggressive patterns
    'high_press_trap',
    'possession_web',
    'flank_overload',
    // Shield archetype (v51) — reactive counters to opp-cards
    'tactical_discipline',
    'counter_read',
    'regroup',
    'intel_leak',
    // v52.2 draw archetype expansion — gives the `draw` phase row real coverage
    'quick_scout',
    'study_opposition',
    'endgame_plan',
    // v52.2 inventory fill — archetype gaps (combo-no-lane, comeback tools,
    // condition management, role-gated power plays)
    'quick_screen',
    'triangle_play',
    'pressure_trap',
    'set_piece',
    'deep_defense',
    'lone_striker',
    'team_unity',
    'final_whistle',
    'last_stand',
    'field_commander',

    'break_the_line',
    'medic',
    'poker_face',
    'read_the_game',
    'late_winner',
    'clutch_defense',
    'counterpunch',
    'scout_report'
  ];

  // ─── Deck operations ─────────────────────────────────────────────────────

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Run-level deck lives on state. Persistence piggybacks on the existing
  // state proxy — we add keys with leading underscore so the SESSION_KEY_MAP
  // falls through to session (matches state.js routing).
  //
  // v0.40 — deck composition now reads state.starterTeamId and picks the
  // matching archetype slot set. Unknown or unset teamId falls back to
  // the konter archetype (closest to the pre-0.40 starter). Called from
  // FLOW.chooseStarterTeam AFTER state.starterTeamId is set so the team
  // id is available.
  function initRunDeck(state) {
    const teamId = state?.starterTeamId;
    const archetypeSlots = STARTER_ARCHETYPE[teamId] || STARTER_ARCHETYPE.konter;
    const deck = STARTER_CORE.concat(archetypeSlots);
    state._cardDeck     = deck.slice();
    state._cardDiscard  = [];
    state._cardHand     = [];
    shuffleInPlace(state._cardDeck);
    // Mark every starter card as codex-seen at run start — otherwise the
    // Card-Dex would show cards you've played all run as "locked".
    if (window.KL?.codex?.recordCardSeen) {
      const uniqueIds = Array.from(new Set(deck));
      for (const id of uniqueIds) window.KL.codex.recordCardSeen(id);
    }
  }

  function initMatchDeck(match, state) {
    // At the start of each match we reshuffle deck + discard back into the
    // play pile so every match starts clean.
    const fullDeck = (state._cardDeck || []).concat(state._cardDiscard || []);
    state._cardDeck    = shuffleInPlace(fullDeck);
    state._cardDiscard = [];
    state._cardHand    = [];
    match._cardFlow    = 0;
    match._cardLaneOpen = false;
    match._cardPressResist = 0;
    match._cardsPlayedThisMatch = [];
    match._cardEnergy = 0;
    match._activeCardEffects = [];   // live badges in the match header
    match._mulliganUsed = false;     // one-time "redraw hand" button per match
  }

  // Mulligan: discard whole hand, redraw to handSize. Free, once per match,
  // R1 only, AND only before any card has been played. v52.7 — added the
  // "no plays yet" guard. Previously you could play a card in R1, then hit
  // mulligan and refill the hand for free — effectively turning a 4-card
  // opening into 5+ cards. The button is hidden in the UI under the same
  // conditions, but we double-gate here for safety.
  function useMulligan(state, match) {
    if (match._mulliganUsed) return false;
    if ((match.round || 1) > 1) return false;
    if ((match._cardsPlayedThisMatch?.length || 0) > 0) return false;
    // Unconditional discard — retain tag doesn't apply here (it's a
    // voluntary reset, not end-of-round).
    state._cardDiscard.push(...(state._cardHand || []));
    state._cardHand = [];
    const CFG = window.CONFIG || window.KL?.config?.CONFIG;
    drawCards(state, (CFG?.handSize || 4));
    match._mulliganUsed = true;
    return true;
  }

  // ─── Active card effects ────────────────────────────────────────────────
  // Lightweight registry for card effects that PERSIST beyond the round
  // they're played in — multi-round buffs, delayed payoffs, match-long
  // costs. Each entry becomes a badge in the match header so the player
  // sees what's still ticking. UI resolves them, cards declare them.
  //
  // Shape: { cardId, icon, duration, playedRound, type, status, note }
  //   type: 'multi' | 'pending' | 'sticky'
  //   status: 'active' | 'success' | 'failed' | 'expired'
  //   duration: rounds remaining (for multi), or null (pending/sticky)

  function registerActiveEffect(match, effect) {
    if (!match._activeCardEffects) match._activeCardEffects = [];
    match._activeCardEffects.push({
      status: 'active',
      playedRound: match.round,
      ...effect
    });
  }

  // Called at the START of each round (from flow.js) — ticks down durations,
  // expires anything at 0, and flips pending resolutions to success/failed
  // based on external signals. Returns any effects that resolved so the UI
  // can flash them.
  function tickActiveEffects(match) {
    const list = match._activeCardEffects || [];
    const resolved = [];
    for (const e of list) {
      if (e.status !== 'active') continue;

      if (e.type === 'multi' && e.duration !== undefined) {
        e.duration -= 1;
        if (e.duration <= 0) {
          e.status = 'expired';
          resolved.push(e);
        }
      } else if (e.type === 'pending') {
        // Pending effects are resolved by their owner card via setEffectStatus.
        // If the owner never resolves them by the time their window passes,
        // quietly expire.
        if (e.expiresAtRound !== undefined && match.round > e.expiresAtRound) {
          e.status = 'expired';
          resolved.push(e);
        }
      }
      // sticky effects never auto-resolve — they ride the whole match
    }
    return resolved;
  }

  // Set an effect's final status when its owner card's condition has been
  // checked (e.g. Bait Counter flipping to 'success' on a no-score round).
  function setEffectStatus(match, cardId, status, note) {
    const list = match._activeCardEffects || [];
    for (const e of list) {
      if (e.cardId === cardId && e.status === 'active') {
        e.status = status;
        if (note) e.note = note;
        return e;
      }
    }
    return null;
  }

  // Remove fully resolved (non-active) effects after a UI beat so badges
  // don't linger forever. Called by UI after render.
  function pruneResolvedEffects(match) {
    if (!match._activeCardEffects) return;
    match._activeCardEffects = match._activeCardEffects.filter(e => e.status === 'active');
  }

  function drawCards(state, n) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (!state._cardDeck.length) {
        if (!state._cardDiscard.length) break;  // empty
        state._cardDeck = shuffleInPlace(state._cardDiscard);
        state._cardDiscard = [];
        // v52.1: surface the reshuffle — UI reads this to briefly flash
        // the deck counter so the player sees the pile was rebuilt from
        // discard. Without this, the counter seemingly never hit zero.
        state._deckJustReshuffled = true;
      }
      const cardId = state._cardDeck.pop();
      state._cardHand.push(cardId);
      drawn.push(cardId);
    }
    return drawn;
  }

  // Keep hand topped up to a target size at the start of each round.
  function drawToHandSize(state, target = 4) {
    const need = target - state._cardHand.length;
    if (need <= 0) return [];
    return drawCards(state, need);
  }

  function discardHand(state) {
    // Retain-tagged cards stay in hand — they don't discard at round end.
    // Player can hold a power-card for the right moment. Tag is on the
    // card def. Returns the cards that were actually discarded for UI use.
    const hand = state._cardHand || [];
    const retained = [];
    const discarded = [];
    for (const cardId of hand) {
      const def = CARDS[cardId];
      if (def && (def.tags || []).includes('retain')) {
        retained.push(cardId);
      } else {
        discarded.push(cardId);
      }
    }
    state._cardDiscard.push(...discarded);
    state._cardHand = retained;
    return { discarded, retained };
  }

  // ─── Fatigue system — module-level tables ──────────────────────────────
  // Lifted out of playCard so the UI can read-ahead the fatigue cost of a
  // card before it's played (shown as a small chip on the hand card).
  const FATIGUE_TYPE_TO_ROLE = {
    setup:   ['PM', 'LF'],
    trigger: ['PM', 'ST'],
    combo:   ['ST', 'LF'],
    defense: ['VT', 'TW'],
    counter: ['VT', 'PM']
  };
  const FATIGUE_VALUES = {
    // v0.38 — Fatigue rebalance based on 0.36.2 telemetry (227 plays):
    // defense averaged 3.1 fatigue/play at 41% of all plays; combos
    // averaged 6.4 at 6% of plays. Defense was the mechanically cheapest
    // type AND the most played — backwards incentive. Combos were the
    // expensive-and-rare payoff tier. Moved defense core +1 (make the
    // stability spam actually cost something), combo power tier -1
    // (the payoff should be more attainable than a premium pick).
    // Recovery cards (breather, medic, rotation, second_wind, team_unity)
    // stay at 0 — they're the fatigue economy's release valve and must
    // remain cheap to be played when needed.
    gegenpress:     8,  doping:         9,  full_press:     7,
    running_hot:    7,  overlap_run:    6,  wing_trap:      6,
    forward_burst:  6,
    stone_cold:     5,  masterclass:    5,  killing_blow:   4,
    hero_moment:    4,  clinical_finish:4,
    desperate_foul: 5,  tight_shape:    4,  hold_the_line:  4,
    keeper_rush:    4,  preempt:        5,  block:          4,
    drop_deep:      2,  quick_build:    2,  long_ball:      2,
    switch_lane:    4,
    through_ball:   3,  hope_shot:      1,  cross:          3,
    second_half:    1,  dig_deep:       3,  burn_plan:      4,
    counter_strike: 3,  tide_turner:    2,  ride_the_wave:  2,
    ball_recovery:  2,  storm_warning:  2,  breather:       0,
    rotation:       0,  second_wind:    0,
    // v52.2 draw archetype — pure cycle cards are low-drain (the PM
    // glances around, there's no physical load); endgame_plan costs
    // slightly more because the late-match composure bump implies the
    // PM is actively orchestrating, not just scanning.
    quick_scout:      1,  study_opposition: 1,  endgame_plan: 3,
    // v52.2 inventory fill — drains track role/intensity. Combat-heavy
    // payoffs hit their role hardest; support cards (triangle_play,
    // team_unity) are low-drain because nobody's sprinting full-tilt.
    // v0.38 — defense cluster here (pressure_trap, deep_defense) also
    // bumped +1 to match the wider defense rebalance.
    quick_screen:    3,  triangle_play:    2,  pressure_trap: 4,
    set_piece:       4,  deep_defense:     4,  lone_striker:  5,
    team_unity:      0,  final_whistle:    5,  last_stand:    5,
    field_commander: 5,

    break_the_line: 5,  medic:           0,  poker_face:     2,
    read_the_game:  1,  late_winner:     5,  clutch_defense: 5,
    counterpunch:   3,  scout_report:    2
  };
  const FATIGUE_TARGET_ROLE = {
    gegenpress: 'LF', doping: 'ST', full_press: 'VT',
    running_hot: 'ST', stone_cold: 'ST', masterclass: 'ST',
    killing_blow: 'ST', hero_moment: 'ST', clinical_finish: 'ST',
    preempt: 'VT', keeper_rush: 'TW', desperate_foul: 'VT',
    tight_shape: 'VT', hold_the_line: 'VT',
    // v52.2 additions — where the physical load actually lands.
    lone_striker:   'ST',  final_whistle:   'ST',
    field_commander:'PM',  pressure_trap:   'VT',
    last_stand:     'VT',  set_piece:       'ST',
    deep_defense:   'VT',

    break_the_line: 'ST',  late_winner: 'ST',
    clutch_defense: 'TW',  counterpunch: 'LF',
    poker_face:     'PM',  scout_report: 'PM',
    read_the_game:  'PM'
  };

  // Preview the fatigue cost of a card for UI display before it's played.
  // Returns { amount, role, playerName } or null when cost would be 0.
  function getFatigueCost(match, cardId) {
    const def = CARDS[cardId];
    if (!def) return null;
    let amount = FATIGUE_VALUES[cardId];
    if (amount == null) amount = def.cost * 2 + 1;
    if (amount === 0) return null;
    // v53 — Staffel-Drain in der UI-Vorschau sichtbar machen. Spiegelt
    // die Logik aus playCard: ab der 2. Karte in der gleichen Runde
    // werden +2 Drain pro vorheriger Karte draufgelegt. Restore-Karten
    // (amount===0) bleiben neutral.
    const cardsThisRound = match?._cardsThisRound || 0;
    if (amount > 0 && cardsThisRound > 0) {
      amount += cardsThisRound * 2;
    }
    const forcedRole = FATIGUE_TARGET_ROLE[cardId];
    let target = null;
    if (forcedRole) {
      target = (match?.squad || []).find(p => p.role === forcedRole);
    }
    if (!target) {
      const roles = FATIGUE_TYPE_TO_ROLE[def.type] || ['PM'];
      const candidates = (match?.squad || []).filter(p => roles.includes(p.role));
      candidates.sort((a, b) => (b.condition || 0) - (a.condition || 0));
      target = candidates[0];
    }
    return {
      amount,
      role: target?.role,
      playerName: target?.name
    };
  }

  // ─── Play a card ─────────────────────────────────────────────────────────

  function getCardDef(id) {
    return CARDS[id] || null;
  }

  // Power cards requiring a fit starter's condition. If fatigue has
  // drained the required role below the threshold, the card becomes
  // unplayable — star-moves need a fresh player. Scales with card
  // intensity: rare finishers need high condition, strong-tagged
  // plays need medium, defensive physicality needs its own threshold.
  const POWER_CARD_CONDITION = {
    // Rare offensive finishers — high bar
    stone_cold:      { role: 'ST', min: 55 },
    masterclass:     { role: 'ST', min: 55 },
    killing_blow:    { role: 'ST', min: 50 },
    // Uncommon combos + situational power
    clinical_finish: { role: 'ST', min: 45 },
    hero_moment:     { role: 'ST', min: 45 },
    overlap_run:     { role: 'LF', min: 40 },
    wing_trap:       { role: 'LF', min: 40 },
    forward_burst:   { role: 'LF', min: 40 },
    // Physical/pressing intensity
    gegenpress:      { role: 'LF', min: 45 },
    full_press:      { role: 'VT', min: 40 },
    running_hot:     { role: 'ST', min: 40 },
    doping:          { role: 'ST', min: 35 },
    // Defensive power plays
    preempt:         { role: 'VT', min: 45 },
    desperate_foul:  { role: 'VT', min: 35 },
    keeper_rush:     { role: 'TW', min: 40 }
  };

  function conditionGate(match, cardId) {
    const gate = POWER_CARD_CONDITION[cardId];
    if (!gate) return { ok: true };
    const player = (match.squad || []).find(p => p.role === gate.role);
    if (!player || typeof player.condition !== 'number') return { ok: true };
    if (player.condition >= gate.min) return { ok: true };
    return {
      ok: false,
      reason: 'condition',
      role: gate.role,
      playerName: player.name,
      current: Math.round(player.condition),
      required: gate.min
    };
  }

  function canPlay(state, match, cardId) {
    const def = getCardDef(cardId);
    if (!def) return false;
    if ((match._cardEnergy || 0) < def.cost) return false;
    const gate = conditionGate(match, cardId);
    if (!gate.ok) return false;
    return true;
  }

  // Payoff status — distinct from canPlay. A card can be PLAYABLE
  // (energy suffices) but its "needs" may not be met, meaning the
  // apply will run a weaker branch. Surfaces the distinction so the
  // hand UI can visually hint "this will misfire" before the click.
  // Returns: { full: bool, missing: 'flow'|'lane'|'both'|null }
  function payoffStatus(state, match, cardId) {
    const def = getCardDef(cardId);
    if (!def) return { full: true, missing: null };
    const needs = def.needs || [];
    if (needs.length === 0) return { full: true, missing: null };
    const haveFlow = (match._cardFlow || 0) >= (needs.includes('flow') ? (def.id === 'masterclass' ? 3 : 2) : 0);
    const haveLane = !!match._cardLaneOpen;
    const missFlow = needs.includes('flow') && !haveFlow;
    const missLane = needs.includes('laneOpen') && !haveLane;
    if (missFlow && missLane) return { full: false, missing: 'both' };
    if (missFlow) return { full: false, missing: 'flow' };
    if (missLane) return { full: false, missing: 'lane' };
    return { full: true, missing: null };
  }

  // Play a card from hand at a specific index. Returns a result descriptor
  // used by the UI to render animations.
  // Phase affinity — translates card type × match phase into a buff
  // multiplier for the stat layer the card pushes. Multiplies the
  // offense/defense/etc values on the final buffLayer. Returns 1.0
  // for neutral combinations, 1.20–1.30 for strong alignment, 0.70
  // for weak alignment. Never 0 — even off-phase cards still do
  // something, just less.
  //
  //            buildup  possession  transition  attack  loss   defensive
  //  setup     1.00     1.20        0.80        1.00    0.70   1.00
  //  trigger   1.00     0.80        1.25        1.10    0.80       0.85
  //  combo     1.00     1.00        1.00        1.30    0.80       0.70
  //  defense   1.00     0.80        0.80        0.70    1.00       1.25
  //  counter   1.00     0.80        1.20        0.90    1.25       1.00
  //  draw      1.00     1.15        1.00        1.00    1.00       0.95
  // The recovery column was previously keyed 'loss' — renamed in v52.1
  // because players read the 'LOSS' chip as "match lost" rather than
  // "ball lost, now recovering". Semantic unchanged, visible label clearer.
  // v52.1 phase-softening: four cells were judged too harsh or
  // too generous in the review. Tweaked so wrong-phase plays are
  // noticeable-but-not-ruined rather than near-useless:
  //   trigger × defensive   0.70 → 0.85  (not every trigger is offensive)
  //   setup   × defensive   1.00 → 0.90  (setups chain off possession)
  //   draw    × defensive   1.00 → 0.95  (defense = less time for cards)
  //   counter × attack      0.80 → 0.90  (softened; still mild penalty)
  //
  // INTENT — attack-phase gating (v52.2 doc note, no behaviour change):
  //   The attack phase is entered when the engine flips on a lane-open
  //   signal, which only setup-type cards produce (switch_lane, and the
  //   successful-setup branch of through_ball). Combo cards are tuned
  //   highest in attack (×1.30) — the payoff column — but a deck made
  //   entirely of combos + triggers will rarely SEE that column because
  //   it never opens a lane. That's deliberate: setups are the key that
  //   unlocks the attack multiplier for everything else in the deck, so
  //   "combo decks need a setup anchor" is an enforced design constraint
  //   rather than a soft suggestion. Mentioned in the player manual so
  //   the expected play pattern is transparent. If the attack column
  //   ever feels unreachable in practice (telemetry: < 5% of rounds hit
  //   it), the right lever is to add more setup producers to the
  //   starter deck or the draft pool — NOT to soften the gate itself.
  // v53 — Phase-Affinity-Floor gehärtet. Die 0.70er waren zu weich: selbst
  // eine combo-Karte in defensive Phase brachte 70% Effekt, was "Timing
  // spielt nur beim Bonus eine Rolle" als Signal sendete. Jetzt fallen
  // Wrong-Phase-Zellen auf 0.50-0.65, richtig getroffene Phasen bleiben
  // bei 1.15-1.30. Mitten-Werte (0.90-0.95) leicht runter auf 0.80.
  // Resultat: Phase-Reading wird zur Pflicht, nicht zur Kür.
  const PHASE_AFFINITY = {
    setup:   { buildup: 1.00, possession: 1.20, transition: 0.65, attack: 1.00, recovery: 0.50, defensive: 0.80 },
    trigger: { buildup: 1.00, possession: 0.65, transition: 1.25, attack: 1.10, recovery: 0.65, defensive: 0.70 },
    combo:   { buildup: 1.00, possession: 1.00, transition: 1.00, attack: 1.30, recovery: 0.65, defensive: 0.50 },
    defense: { buildup: 1.00, possession: 0.65, transition: 0.65, attack: 0.50, recovery: 1.00, defensive: 1.25 },
    counter: { buildup: 1.00, possession: 0.65, transition: 1.20, attack: 0.75, recovery: 1.25, defensive: 1.00 },
    draw:    { buildup: 1.00, possession: 1.15, transition: 1.00, attack: 1.00, recovery: 1.00, defensive: 0.80 }
  };
  function getPhaseAffinity(cardType, matchPhase) {
    const type = PHASE_AFFINITY[cardType];
    if (!type) return 1.0;
    return type[matchPhase || 'buildup'] || 1.0;
  }

  function playCard(state, match, handIndex) {
    const cardId = state._cardHand[handIndex];
    if (cardId == null) return null;
    const def = getCardDef(cardId);
    if (!def) return null;
    if ((match._cardEnergy || 0) < def.cost) return null;

    // Pay cost
    match._cardEnergy -= def.cost;

    // Remove from hand, add to discard.
    state._cardHand.splice(handIndex, 1);
    state._cardDiscard.push(cardId);

    // Snapshot before apply so we can report deltas. Also snapshot
    // buffLayers length so we can identify the layers this card
    // pushed and scale them by phase affinity.
    const teamBuffsBefore = { ...match.teamBuffs };
    const flowBefore = match._cardFlow || 0;
    const layerCountBefore = (match.buffLayers || []).length;

    const applyResult = def.apply({ match, state }) || {};

    const isUpgraded = !!(state?._cardUpgrades?.[cardId]);
    const roleAffinity = window.KL?.roles?.getCardAffinityBonus?.(match, cardId) || 1.0;
    const phaseAffinity = getPhaseAffinity(def.type, match.matchPhase);

    const CFG_MUL = window.KL?.config?.CONFIG || {};
    const useMax = (CFG_MUL.cardMultiplierMode || 'max') === 'max';
    let combinedMultiplier;
    if (useMax) {
      combinedMultiplier = Math.max(
        isUpgraded ? 1.25 : 1.0,
        roleAffinity,
        phaseAffinity,
        1.0
      );
    } else {
      combinedMultiplier = (isUpgraded ? 1.25 : 1.0) * roleAffinity * phaseAffinity;
    }
    if (combinedMultiplier !== 1.0) {
      const newLayers = (match.buffLayers || []).slice(layerCountBefore);
      for (const layer of newLayers) {
        if (!layer.stats) continue;
        for (const k of Object.keys(layer.stats)) {
          layer.stats[k] = Math.round(layer.stats[k] * combinedMultiplier);
        }
      }
      if (isUpgraded)               applyResult.upgraded = true;
      if (roleAffinity !== 1.0)     applyResult.roleAffinity = roleAffinity;
      if (phaseAffinity !== 1.0) {
        applyResult.phaseAffinity = phaseAffinity;
        applyResult.matchPhase    = match.matchPhase;
      }
      applyResult.combinedMultiplier = combinedMultiplier;
    }

    {
      const CFG = window.KL?.config?.CONFIG || {};
      const dampenAfter = CFG.cardStatDampenAfter ?? 2;
      const dampenStep  = CFG.cardStatDampenStep ?? 0.18;
      const dampenFloor = CFG.cardStatDampenFloor ?? 0.35;
      const playedSoFar = match._cardsThisRound || 0;
      if (playedSoFar >= dampenAfter) {
        const steps = playedSoFar - dampenAfter + 1;
        const dampen = Math.max(dampenFloor, 1 - steps * dampenStep);
        if (dampen < 1) {
          const newLayers = (match.buffLayers || []).slice(layerCountBefore);
          for (const layer of newLayers) {
            if (!layer.stats) continue;
            for (const k of Object.keys(layer.stats)) {
              layer.stats[k] = Math.round(layer.stats[k] * dampen);
            }
          }
          applyResult.cardSpamDampen = dampen;
        }
      }
    }

    // v0.36 — Per-match repeat dampen.
    //
    // Telemetry from 0.35.0 showed set_piece played 22 times across 11
    // matches (twice per match on average, 3× in M7 which kicked off
    // the snowball). A single dominant card with a phase-affinity
    // sweet spot and upgrade-eligible status becomes a hammer the
    // player spams every match.
    //
    // Rule: the Nth play of the SAME card id in the SAME match gets
    // a diminishing effect multiplier applied to the buff layers it
    // pushed. 1st play full. 2nd at 0.75. 3rd at 0.55. 4th at 0.40
    // (floor). Narratively plausible (opponents read the pattern,
    // you're telegraphing your own play); mechanically it means
    // building a deck around variety pays off more than spamming one
    // strong card.
    {
      const CFG = window.KL?.config?.CONFIG || {};
      const repeatFloor = CFG.cardRepeatDampenFloor ?? 0.40;
      const repeatStep  = CFG.cardRepeatDampenStep  ?? 0.20;
      if (!match._cardRepeatCounts) match._cardRepeatCounts = {};
      const prevCount = match._cardRepeatCounts[cardId] || 0;
      match._cardRepeatCounts[cardId] = prevCount + 1;
      // prevCount is plays BEFORE this one. 0 = first play (no dampen).
      if (prevCount > 0) {
        const dampen = Math.max(repeatFloor, 1 - prevCount * repeatStep);
        if (dampen < 1) {
          const newLayers = (match.buffLayers || []).slice(layerCountBefore);
          for (const layer of newLayers) {
            if (!layer.stats) continue;
            for (const k of Object.keys(layer.stats)) {
              layer.stats[k] = Math.round(layer.stats[k] * dampen);
            }
          }
          applyResult.cardRepeatDampen = dampen;
          applyResult.cardRepeatCount  = prevCount + 1;
        }
      }
    }

    // Generate tags AFTER apply so "needs" checks use pre-play state.
    for (const tag of (def.tags || [])) {
      if (tag === 'flow')       match._cardFlow = (match._cardFlow || 0) + 1;
      if (tag === 'laneOpen')   match._cardLaneOpen = true;
      if (tag === 'pressResist')match._cardPressResist = (match._cardPressResist || 0) + 1;
    }

    // Fatigue drain — uses module-level tables (FATIGUE_VALUES,
    // FATIGUE_TARGET_ROLE, FATIGUE_TYPE_TO_ROLE). See getFatigueCost()
    // for the UI preview helper that shares these tables.
    let drainAmount = FATIGUE_VALUES[cardId];
    if (drainAmount == null) drainAmount = def.cost * 2 + 1;
    // v53 — Spam-Bremse: pro zusätzlicher Karte in der gleichen Runde
    // steigt der Kondition-Drain. 1. Karte: baseline. 2.: +2. 3.: +4.
    // Bei Spam kippt die heavy-use-Rolle (ST bei Offense, VT bei Defense)
    // binnen 2-3 Runden unter Kondition 50 (-3 Stats) bzw. 25 (-6 Stats).
    // Karten mit Basedrain 0 (breather, rotation, team_unity — die
    // Restore-Karten) bleiben auch als Folgekarte bei 0, damit sie ihre
    // Regenerationsfunktion behalten.
    const cardsThisRound = match._cardsThisRound || 0;
    if (drainAmount > 0 && cardsThisRound > 0) {
      drainAmount += cardsThisRound * 2;
    }
    match._cardsThisRound = cardsThisRound + 1;

    if (drainAmount > 0) {
      const forcedRole = FATIGUE_TARGET_ROLE[cardId];
      let target = null;
      if (forcedRole) {
        target = (match.squad || []).find(p => p.role === forcedRole);
      }
      if (!target) {
        const roles = FATIGUE_TYPE_TO_ROLE[def.type] || ['PM'];
        const candidates = (match.squad || []).filter(p => roles.includes(p.role));
        candidates.sort((a, b) => (b.condition || 0) - (a.condition || 0));
        target = candidates[0];
      }
      if (target && typeof target.condition === 'number') {
        const conditionBefore = target.condition;
        target.condition = Math.max(0, target.condition - drainAmount);
        applyResult.fatigueTarget = target.name;
        applyResult.fatigueTargetRole = target.role;
        applyResult.fatigueDrain = drainAmount;
        applyResult.fatigueConditionBefore = conditionBefore;
        applyResult.fatigueConditionAfter = target.condition;
        // Threshold-crossing detection for narration hooks
        const THRESHOLDS = [50, 35, 20];
        for (const t of THRESHOLDS) {
          if (conditionBefore >= t && target.condition < t) {
            applyResult.fatigueThresholdCrossed = t;
            applyResult.fatigueTargetId = target.id;
            break;
          }
        }
      }
    }

    // Recompute team buffs so downstream math sees the card.
    if (window.recomputeTeamBuffs) window.recomputeTeamBuffs(match);

    match._cardsPlayedThisMatch.push({ id: cardId, round: match.round });

    // v0.50 — Soft-Counter-Tracking: defense- und counter-Karten-Plays
    // werden per-Runde gemerkt, damit der engine-Ebene-Opp-Move-
    // Telegraph ein "Defense-Buff dämpft"-Signal emittieren kann. Adres-
    // siert das "0/36 defused in Telemetrie"-Problem: defense-Karten
    // wirkten immer mit Stat-Buffs, wurden aber nie als Counter gezählt.
    // Jetzt: counter UND defense zählen als "player-responded-this-round".
    if (def.type === 'defense' || def.type === 'counter') {
      match._lastDefenseRound = match.round;
    }

    // ── v52.7 — Card-Type-Chain bonus ───────────────────────────────────
    // Tracks distinct card types played in the current round. Hitting 3
    // distinct types = "VERSATILE PLAY" bonus. Hitting 4+ = "TOTAL FOOTBALL"
    // bonus (replaces VERSATILE if it had fired). One-shot per round; the
    // tier ratchet ensures we never downgrade or double-fire. Reset at
    // round start in flow.js. Solves "playing 3 of the same card type
    // feels as good as varied play" — now varied play is mechanically
    // rewarded, encouraging the deck-shaping the game is designed around.
    if (!match._cardTypeChainThisRound) match._cardTypeChainThisRound = [];
    match._cardTypeChainThisRound.push(def.type);
    const distinctTypes = new Set(match._cardTypeChainThisRound).size;
    const prevTier = match._chainBonusTier || 0;
    let newTier = prevTier;
    if (distinctTypes >= 4 && prevTier < 2) newTier = 2;
    else if (distinctTypes >= 3 && prevTier < 1) newTier = 1;

    if (newTier > prevTier) {
      match._chainBonusTier = newTier;
      const bonusStats = newTier === 2
        ? { offense: 6, defense: 5, tempo: 4, vision: 2, composure: 3 }
        : { offense: 4, defense: 3, tempo: 3, composure: 2 };
      match.buffLayers.push({
        source: 'chain_bonus_' + (newTier === 2 ? 'totalfootball' : 'versatile'),
        range: [match.round, match.round],
        stats: bonusStats,
        special: null
      });
      // Mirror onto the play result so the UI can surface a celebratory log.
      applyResult.chainBonusFired = newTier === 2 ? 'totalfootball' : 'versatile';
      applyResult.chainBonusStats = bonusStats;
    }
    // ── /v52.7 ──────────────────────────────────────────────────────────

    // Opp-adaptation tracking (v52.1): count card plays per type across
    // the whole run. Downstream, generateOpponent reads these totals and
    // gives opponents a passive counter-boost when the player leans
    // heavily on one type (e.g. all-trigger spam → opponents get more
    // composure; all-combo → more defense). This is the "rein über stats
    // haben Gegner mir nichts entgegen" rebalance — dominant strategies
    // start getting visible resistance instead of a silent wall.
    if (state) {
      if (!state._runCardTypePlays) {
        // v52.2 — 'draw' added so draw-heavy runs register for opp
        // adaptation. Keys must match the card def.type values.
        state._runCardTypePlays = { setup: 0, trigger: 0, combo: 0, defense: 0, counter: 0, draw: 0 };
      }
      const t = def.type;
      if (t && t in state._runCardTypePlays) {
        state._runCardTypePlays[t]++;
      }
    }

    return {
      cardId,
      def,
      applyResult,
      teamBuffsBefore,
      teamBuffsAfter: { ...match.teamBuffs },
      flowBefore,
      flowAfter: match._cardFlow || 0,
      laneOpen: !!match._cardLaneOpen
    };
  }

  // ─── Synergy glow detection ─────────────────────────────────────────────
  // For each card in hand, returns whether the current match state would
  // make this card a "synergy play" (i.e. its needs are satisfied OR it
  // sets up a needed tag for another card in hand).

  function synergyStatus(state, match, cardId) {
    const def = getCardDef(cardId);
    if (!def) return { glow: false, reason: null };

    // 0) Condition gate — Power-Card unplayable because fit starter too tired.
    const gate = conditionGate(match, cardId);
    if (!gate.ok) {
      return {
        glow: false,
        reason: 'needs_condition',
        gate
      };
    }

    // 1) This card consumes a tag that's currently active — strong synergy.
    for (const need of (def.needs || [])) {
      if (need === 'flow' && (match._cardFlow || 0) >= 1) {
        return { glow: true, reason: 'needs-flow-active', strength: Math.min(match._cardFlow || 0, 3) };
      }
      if (need === 'laneOpen' && match._cardLaneOpen) {
        return { glow: true, reason: 'needs-lane-open', strength: 1 };
      }
      if (need === 'pressResist' && (match._cardPressResist || 0) >= 1) {
        return { glow: true, reason: 'needs-press-resist-active', strength: 1 };
      }
    }

    // 2) This card sets a tag that another hand card is waiting for — setup glow.
    const thisTags = def.tags || [];
    if (thisTags.length) {
      for (const other of state._cardHand) {
        if (other === cardId) continue;
        const od = getCardDef(other);
        if (!od) continue;
        for (const need of (od.needs || [])) {
          if (thisTags.includes(need)) {
            return { glow: true, reason: 'enables-' + need, strength: 1 };
          }
        }
      }
    }

    return { glow: false, reason: null };
  }

  // ─── Post-match card draft ─────────────────────────────────────────────
  // Called by flow.js after a match ends (and before the recruit screen /
  // advance). Returns 3 uncommon card ids the player can choose from.
  //
  // v0.39 — Stratified sampling by card type. Previously this was a plain
  // uniform shuffle over UNCOMMON_POOL (58 cards across 6 types with
  // uneven size: setup 12, defense 12, combo 11, counter 10, trigger 7,
  // draw 6). That gave the per-draft probabilities:
  //   setup/defense: ~50% chance to appear
  //   combo:         ~47%
  //   counter:       ~43%
  //   trigger:       ~32%
  //   draw:          ~28%
  // Across a 11-draft season the thinner types (trigger, draw) could be
  // invisible the whole run — 0.36.2 telemetry had 0 plays of counter
  // and draw cards, partially because those rarities simply never
  // surfaced as draft options.
  //
  // New approach: pick 3 DIFFERENT types, then one random card from each.
  // This guarantees type diversity per draft. Counter/draw now appear in
  // roughly 50% of drafts (3 of 6 types) instead of 17%/10% pool share.
  // Minor trade-off: no more drafts with three setups in a row, which
  // slightly slows setup-heavy archetypes. That's considered acceptable
  // since the starter deck already over-indexes setup.
  function generateCardDraftOptions() {
    // Bucket pool by type. Malformed entries (missing CARDS def) skipped
    // defensively so a typo in UNCOMMON_POOL doesn't crash the draft.
    const byType = {};
    for (const id of UNCOMMON_POOL) {
      const def = CARDS[id];
      if (!def || !def.type) continue;
      (byType[def.type] || (byType[def.type] = [])).push(id);
    }
    const types = Object.keys(byType).filter(t => byType[t].length > 0);
    // Fallback to old behaviour if for some reason we have fewer than 3
    // populated types — shouldn't happen in normal builds but defensive.
    if (types.length < 3) {
      const pool = UNCOMMON_POOL.slice();
      shuffleInPlace(pool);
      return pool.slice(0, 3);
    }
    shuffleInPlace(types);
    const chosenTypes = types.slice(0, 3);
    const result = [];
    for (const t of chosenTypes) {
      const typePool = byType[t].slice();
      shuffleInPlace(typePool);
      result.push(typePool[0]);
    }
    // Randomize final order so the 3 cards don't always appear in the
    // same type order (e.g. setup always first). Pure cosmetic but
    // avoids the player learning a positional shortcut.
    shuffleInPlace(result);
    return result;
  }

  function addCardToDeck(state, cardId) {
    const def = getCardDef(cardId);
    if (!def) return false;
    state._cardDeck = state._cardDeck || [];
    state._cardDeck.push(cardId);
    // Meta-codex: mark this card as "seen ever" so the v52 Card-Dex can
    // show progressive discovery. Starter-deck cards also get recorded
    // via initRunDeck so they show up from run 1.
    if (window.KL?.codex?.recordCardSeen) {
      window.KL.codex.recordCardSeen(cardId);
    }
    return true;
  }

  // ─── Deck-shaping: removal + upgrade ────────────────────────────────────
  // Deck-thinning is a progression axis just as important as adding cards.
  // Called from the post-match draft when it's a REMOVE round.

  // Returns a list of unique card ids currently in the full deck (deck +
  // discard + hand combined). Caller uses this to show the player which
  // cards can be removed.
  function getFullDeckContents(state) {
    return [].concat(
      state._cardDeck    || [],
      state._cardDiscard || [],
      state._cardHand    || []
    );
  }

  // Remove ONE copy of cardId from whichever pile it sits in.
  function removeCardFromDeck(state, cardId) {
    const piles = ['_cardDeck', '_cardDiscard', '_cardHand'];
    for (const key of piles) {
      const pile = state[key];
      if (!pile) continue;
      const idx = pile.indexOf(cardId);
      if (idx >= 0) {
        pile.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  // Build a list of 3-4 removal candidates — prefer weak-basics first so
  // early-run removal is easy, then let the player thin more selectively.
  function generateRemovalOptions(state) {
    const all = getFullDeckContents(state);
    const unique = Array.from(new Set(all));
    const WEAK = ['grind_through', 'long_ball', 'hope_shot'];
    // Weak cards first, then others, then sort within by rarity (commons
    // first so specialized/rare cards aren't lost easily).
    const weak = unique.filter(id => WEAK.includes(id));
    const rest = unique.filter(id => !WEAK.includes(id));
    const pool = weak.concat(rest);
    // Cap at 5 options to keep the screen manageable.
    return pool.slice(0, 5);
  }

  // Decides which draft mode applies this match. Alternates between ADD
  // and REMOVE so the player reshapes their deck over a run rather than
  // just piling on cards.
  //
  // Match 1 start:   nothing (starter deck is fixed)
  // After match 1:   ADD
  // After match 2:   REMOVE
  // After match 3:   ADD
  // After match 4:   REMOVE
  // After match 5:   DOUBLE_ADD (boss reward — pick TWO cards back-to-back)
  // Draft rhythm for the 14-match round-robin season (8 teams H+R).
  // Each matchNumber (1..14) maps to a draft mode offered AFTER that
  // match. Layout chosen so the power-progression arc matches a longer
  // season with two distinct halves:
  //   M1 add · M2 remove · M3 upgrade · M4 add · M5 remove ·
  //   M6 evolution · M7 boss_double_add (mid-season boss) ·
  //   M8 upgrade · M9 add · M10 replace · M11 remove · M12 upgrade ·
  //   M13 evolution · M14 boss_double_add (season finale)
  // No draft after M14 — season complete.
  function pickDraftMode(matchNumber) {
    if (matchNumber <= 0) return null;
    if (matchNumber >= 14) return null;
    if (matchNumber === 7 || matchNumber === 14) return 'double_add';
    if (matchNumber === 10) return 'replace';
    if (matchNumber === 3 || matchNumber === 8 || matchNumber === 12) return 'upgrade';
    if ((matchNumber === 6 || matchNumber === 13) && window.KL?.roles) return 'evolution';
    return (matchNumber % 2 === 1) ? 'add' : 'remove';
  }

  // Build 3 upgrade options — picks from current deck, excludes cards
  // already upgraded, prioritizes non-weak basics so upgrades feel
  // impactful. Returns array of card IDs to choose from.
  function generateUpgradeOptions(state) {
    const deck = getFullDeckContents(state);
    const upgrades = state._cardUpgrades || {};
    const eligible = deck
      .map(c => c.id || c)
      .filter(id => !upgrades[id]);
    if (eligible.length === 0) return [];
    // Rank by rarity: commons first (they need the boost most), then uncommons.
    // Weak basics (hope_shot, grind_through, long_ball) deprioritized — upgrading
    // a weak basic is still weak.
    const WEAK = new Set(['hope_shot', 'grind_through', 'long_ball', 'quick_build']);
    const ranked = eligible.sort((a, b) => {
      const wa = WEAK.has(a) ? 1 : 0;
      const wb = WEAK.has(b) ? 1 : 0;
      if (wa !== wb) return wa - wb;
      return Math.random() - 0.5;   // otherwise random
    });
    // Dedupe — player shouldn't see two offers for the same card even
    // if they own 2 copies.
    const seen = new Set();
    const deduped = [];
    for (const id of ranked) {
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(id);
      if (deduped.length >= 3) break;
    }
    return deduped;
  }

  function upgradeCard(state, cardId) {
    if (!state._cardUpgrades) state._cardUpgrades = {};
    state._cardUpgrades[cardId] = true;
  }

  // ─── Opp intent for this round ──────────────────────────────────────────
  // Picks ONE trait to preview as "loaded" this round. Selection scores
  // round-fit + freshness; severity is intrinsic to the trait archetype
  // so different matchups FEEL different (not every intent reads as "red").
  //
  // Returns { id, name, desc, severity } or null.

  const TRAIT_ROUND_PREF = {
    ironwall:    [1, 2],
    presser_opp: [1, 3],
    sturm:       [2, 4],
    konter_opp:  [2, 5],
    sniper:      [3, 5],
    lucky:       [3, 4],
    riegel:      [1, 4],
    clutch_opp:  [5, 6],
    boss_aura:   [1, 6]
  };

  // Intrinsic threat rating: how dangerous is this trait when active?
  //   1 = nuisance, manageable through default play
  //   2 = standard threat, a card should address it
  //   3 = real damage, the round will hurt if unanswered
  const TRAIT_SEVERITY = {
    ironwall:    1,
    lucky:       1,
    riegel:      2,
    presser_opp: 2,
    sturm:       2,
    sniper:      2,
    konter_opp:  3,
    clutch_opp:  3,
    boss_aura:   3
  };

  function pickOppIntent(match) {
    const opp = match?.opp;
    if (!opp || !opp.traits || !opp.traits.length) return null;

    const r = match.round || 1;
    const traits = opp.traits;
    const tdefs = window.KL?.traits?.OPP_TRAITS || [];
    const fireCounts = match._oppTraitFireCounts || {};

    // Pick score: fits current round + freshness. This decides which
    // trait to PREVIEW — not how scary it is.
    let best = null;
    let bestScore = -Infinity;
    for (const id of traits) {
      const def = tdefs.find(t => t.id === id);
      if (!def) continue;
      const pref = TRAIT_ROUND_PREF[id] || [1, 6];
      const fits = (r >= pref[0] && r <= pref[1]) ? 5 : 0;
      const fired = fireCounts[id] || 0;
      const freshness = fired === 0 ? 2 : -fired;
      const score = fits + freshness;
      if (score > bestScore) {
        bestScore = score;
        best = { id, def };
      }
    }
    if (!best) return null;

    // Severity is INTRINSIC to the trait, with a mild round-context nudge:
    // a trait outside its preferred round-range drops one level (it's still
    // there as a threat, but less potent this round).
    const baseSev = TRAIT_SEVERITY[best.id] || 2;
    const pref = TRAIT_ROUND_PREF[best.id] || [1, 6];
    const inRange = r >= pref[0] && r <= pref[1];
    const sev = Math.max(1, Math.min(3, inRange ? baseSev : baseSev - 1));

    return {
      id:       best.id,
      name:     best.def.name || best.id,
      desc:     best.def.desc || '',
      severity: sev
    };
  }

  // Telegraph detection — reads the opp-intent preview and returns the
  // threat object IF its severity is 2+ (i.e. a real, actionable threat
  // the player can counter with Block/Pre-empt). Returns null for mild
  // or absent threats, and also null if the SAME threat was absorbed
  // already this round (so Block on round 3 doesn't block a different
  // loaded trait in round 4).
  //
  // v52.2: the `study_opposition` draw card sets
  // `match._forceTelegraphThisRound` to let its owner promote even a
  // severity-1 intent into a blockable threat for the rest of the
  // round. Cleared naturally on the next round because pickOppIntent
  // re-runs and the flag is a simple round-scoped marker — see
  // discardHand / round-start flow that resets per-round state.
  function getTelegraphedThreat(match) {
    if (!match) return null;
    const intent = pickOppIntent(match);
    if (!intent) return null;
    const minSev = match._forceTelegraphThisRound ? 1 : 2;
    if ((intent.severity || 0) < minSev) return null;
    if (match._oppIntentAbsorbed === intent.id) return null;
    return intent;
  }

  // ─── Public API ─────────────────────────────────────────────────────────
  KL.cards = {
    CARDS,
    STARTER_DECK,
    STARTER_CORE,
    STARTER_ARCHETYPE,
    UNCOMMON_POOL,
    getCardDef,
    initRunDeck,
    initMatchDeck,
    drawCards,
    drawToHandSize,
    discardHand,
    canPlay,
    payoffStatus,
    getPhaseAffinity,
    playCard,
    synergyStatus,
    generateCardDraftOptions,
    generateRemovalOptions,
    generateUpgradeOptions,
    pickDraftMode,
    upgradeCard,
    useMulligan,
    conditionGate,
    getFatigueCost,
    addCardToDeck,
    removeCardFromDeck,
    getFullDeckContents,
    pickOppIntent,
    getTelegraphedThreat,
    registerActiveEffect,
    tickActiveEffects,
    setEffectStatus,
    pruneResolvedEffects,
    // v52 codex — all card IDs for the Card-Dex view
    getAllCardIds: () => Object.keys(CARDS)
  };
})();
