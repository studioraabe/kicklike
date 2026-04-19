I18N.registerLocale("en", {
  ui: {
    meta: { title: "KICKLIKE · 5-a-Side Autobattler" },
    start: {
      tagline: "> 5-a-side autobattler_",
      sub: "15 matches · 4 starter teams · emergent synergies",
      newRun: "▶ New Run",
      howTitle: "How it works:",
      howBody: "Choose one starter team out of 4 concepts. Each of your 5 players evolves along one of 3 paths during the run. Matches play out as auto-battles, but you choose the direction at 3 key moments. Traits trigger each other. Earn points (3 for a win, 1 for a draw), and avoid 3 straight losses. Goal: 36+ points = Champion, 24+ points = Safe."
    },
    draft: {
      title: "Choose your starter team",
      body: "Each team has a theme, a strength, and a weakness. You shape its identity later through evolutions."
    },
    hub: {
      yourTeam: "Your Team",
      opponent: "Opponent",
      squad: "Squad",
      bench: "Bench",
      lineup: "⚙ Lineup",
      startMatch: "▶ Start Match"
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
      fast: "⏩ Fast"
    },
    result: {
      win: "WIN",
      loss: "LOSS",
      draw: "DRAW",
      continue: "▶ Continue",
      analysis: "Match Breakdown",
      players: "Player Breakdown",
      sacrificeNote: "⚠ {name} gave everything — permanent stat loss."
    },
    gameover: { title: "GAME OVER" },
    victory: { survived: "15 matches survived" },
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
      highscore: "✦ BEST SCORE: {points} PTS · {wins}W-{draws}D-{losses}L · {outcome} ✦",
      outcomeChampion: "Champion",
      outcomeSurvivor: "Safe",
      outcomeFired: "Fired",
      compactTeamMeta: "{lineup} + {bench}B",
      matchLabel: "Match {num}: {me}:{opp} vs {name}",
      bossTell: "Boss fight — all stats boosted, no mistakes allowed"
    },
    statsPanel: {
      possession: "Possession",
      shots: "Shots",
      accuracy: "Accuracy",
      buildup: "Build-up %",
      saves: "Saves",
      goals: "Goals",
      abilitiesTriggered: "Abilities Triggered",
      currentTeamStats: "Current Team Stats",
      own: "You",
      diff: "Diff",
      opponent: "Opponent",
      buffsFootnote: "Buffs stack across kickoff, halftime, and final phase"
    },
    evolution: {
      title: "EVOLUTION!",
      reachedLevel: "{name} ({role}) reached level {level}",
      traitLabel: "Ability: {name}",
      keepsTrait: "keeps: {name} (+30%)"
    },
    flow: {
      lineupIncomplete: "Lineup incomplete! Please choose 5 players.",
      benchFull: "Bench is full!",
      lineupInvalid: "Invalid lineup! You need exactly 1 goalkeeper and 5 total players.",
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
      points: "{points} POINTS",
      record: "✦ NEW RECORD ✦",
      bestScore: "Best score: {points} pts ({team})",
      afterMatches: "{points} points after {matches} matches",
      bestRun: "✦ New best run ✦"
    },
    perf: {
      buildups: "{ok}/{all} build-ups",
      defenses: "{count} stops",
      keeper: "{saves} saves  {conceded} conceded"
    },
    ht: {
      title: "HALF TIME",
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
      finalChoice: "  → {name}",
      roundHeader: "ROUND {round}",
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
      chainAttack: "  ⚡ Quick combination — another chance follows.",
      luckyDouble: "  🍀 {name} steal possession — second attack!",
      counter: "  🔁 Turnover — counter's on.",
      autoCounter: "  ⚡ They gave it away — we pounce.",
      doubleCounter: "  ⚡⚡ Two attacks wasted — double counter!",
      pressingCap: "  Pressing cuts off their second run.",
      aggressiveThird: "  💥 Wave after wave — a third attack follows.",
      rallyReaction: "  💢 Instant response after conceding.",
      flankRun: "  {name} burns down the wing — extra chance.",
      momentumBuilt: "  Momentum building — consecutive control's paying off.",
      htSummaryPressing: "Pressing blocked {n} attacks",
      htSummaryCounters: "Counter system fired {n}x",
      htSummaryMomentum: "Momentum active",
      pressingBeaten: [
        "  {opp} find the gap — space opens behind the press.",
        "  The line's beaten — {opp} are in behind.",
        "  Pressing bypassed — {opp} have numbers going forward."
      ],
      aggressiveError: [
        "  Too eager — the move breaks down in transition.",
        "  Overcommitted — the ball's lost.",
        "  The urgency costs them — loose ball in midfield."
      ],
      possessionLost: [
        "  Ball given away — {opp} are already moving.",
        "  Sloppy touch — {opp} immediately press high.",
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
        "  All-in and caught open — the defence is thin.",
        "  The gamble backfires — acres of space at the back.",
        "  All men forward — {opp} find the gap."
      ],
      attackingExposed: [
        "  Attacking shape leaves gaps — {opp} exploit it.",
        "  High line, thin cover — {opp} run straight through.",
        "  Going forward costs them — {opp} hit on the break."
      ],
      aggressiveExposed: [
        "  Aggressive press punished — {opp} through on goal.",
        "  Too high, too open — {opp} find the channel.",
        "  The aggression turns against them."
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
      oppGoal: "💥 {name} score   {me}:{opp}",
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
      laserPass: "🎯 {name} — laser pass, counter's on.",
      bulldoze: "🛡 {name} — bulldozes through, ball won.",
      hardTackle: "🥾 {name} — hard tackle, counter!",
      chessPredict: "♟ {name} — reads it perfectly, goal's wiped out.",
      speedBurst: "💨 {name} — build-up guaranteed.",
      pounce: "🐆 {name} — pounces on the error.",
      oppBlitzCounter: "  ⚡ {name} hit back immediately.",
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
      synergyBonus: "  🔗 {name} ({trait}) +{bonus}%",
      tacticFit: "  ✓ {name} — conditions met, bonus applied.",
      tacticMisfitKey: "  ⚠ Tactic misfit — reduced effect.",
      misfitPressingCollapse: "  ⚠ Pressing collapses — legs can't sustain it.",
      misfitCounterStall: "  ⚠ Counter stalls — no one quick enough to run.",
      aggressiveError: [
        "  Too eager — the move breaks down in transition.",
        "  Overcommitted — the ball's lost.",
        "  The urgency costs them — loose ball in midfield."
      ]
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
      "The pass from {pm} is cut out.",
      "{vt} plays it backwards — the move stalls.",
      "{pm} tries to force it — intercepted.",
      "The press wins the ball back.",
      "Turnover. They transition immediately."
    ],
    ownBuildSuccess: [
      "{pm} slides it through — {lf}'s running.",
      "{pm} finds the gap, {lf} takes it on.",
      "Quick ball from {vt}, {pm} releases {lf} in behind.",
      "{pm} switches play — {lf}'s in space.",
      "{lf} accelerates past his marker.",
      "{pm} drives forward, {lf} makes the overlap.",
      "Neat combination — {pm} to {lf}, ball into the box."
    ],
    chance: [
      "{scorer} shapes to shoot...",
      "{scorer} gets on the end of it...",
      "{scorer} cuts inside, finds the angle...",
      "{scorer}'s one-on-one...",
      "{scorer} arrives late — powerful effort...",
      "{scorer} has time and space..."
    ],
    miss: [
      "{scorer} drags it wide.",
      "{scorer} hits the post — so close.",
      "{scorer} goes central — keeper reads it.",
      "{scorer} skies it — well over.",
      "Blocked! {scorer} can't believe it.",
      "{scorer} hesitates — the chance is gone.",
      "{scorer} gets under it — up and over."
    ],
    oppBuildFail: [
      "They lose it — {vt} reads the play.",
      "Pressure from {vt} forces a poor touch.",
      "They try to play out — {vt} intercepts.",
      "The pass is sloppy — our ball.",
      "{vt} wins it cleanly in the challenge."
    ],
    oppApproach: [
      "{opp} advance with purpose.",
      "{opp} break quickly — numbers forward.",
      "{opp} work it into a dangerous position.",
      "A runner finds space in behind.",
      "{opp} isolate the backline — threat's incoming."
    ],
    save: [
      "{tw} — strong hands. Stays out.",
      "{tw} dives full stretch — remarkable.",
      "{vt} throws himself in the way — blocked.",
      "{tw} smothers it at the near post.",
      "Tipped over by {tw} — corner.",
      "{vt} clears off the line — crucial."
    ]
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
      titan_stand: { name: "Titan Stance", desc: "Against enemy shots: 30% chance to stop them while the score's close (≤1 diff)." },
      fortress_aura: { name: "Fortress Aura", desc: "Defender gets +6 defense while the keeper's active." },
      clutch_save: { name: "Clutch Save", desc: "In rounds 5-6: +20% save rate." },
      sweep_assist: { name: "Sweep Assist", desc: "After a goalkeeper save: +8% to the next build-up." },
      laser_pass: { name: "Laser Pass", desc: "After a save: 20% chance to trigger an immediate counter." },
      offside_trap: { name: "Offside Trap", desc: "15% of all enemy attacks are negated (tempo-based)." },
      acrobat_parry: { name: "Acrobatics", desc: "After a save: +12% save chance on the next shot (once per match)." },
      wall_effect: { name: "Wall", desc: "+15% permanent save rate, but -10% to your own build-up." },
      nine_lives: { name: "Nine Lives", desc: "Once per match: the first goal conceded is cancelled." },
      intimidate: { name: "Intimidate", desc: "Enemy striker gets -5 offense." },
      bulldoze: { name: "Bulldozer", desc: "Each round: 10% chance to steal the ball before the enemy shot." },
      captain_boost: { name: "Captain", desc: "Entire team gets +3 composure." },
      blood_scent: { name: "Blood Scent", desc: "After every enemy goal: +5 defense for the rest of the match." },
      hard_tackle: { name: "Hard Tackle", desc: "20% chance to break the enemy attack and launch a counter." },
      whirlwind_rush: { name: "Whirlwind", desc: "Once per half: doubles this player's tempo for one round." },
      build_from_back: { name: "Build from the Back", desc: "Playmaker gets +8 vision." },
      late_bloom: { name: "Late Bloomer", desc: "From round 4: +10 offense and +5 vision." },
      read_game: { name: "Read the Game", desc: "Once per match: automatically negates an enemy attack." },
      metronome_tempo: { name: "Metronome", desc: "Each round: +2% to your build-up (cumulative)." },
      killer_pass: { name: "Killer Pass", desc: "On your attack: 25% chance to trigger a chain shot." },
      whisper_boost: { name: "Whisper", desc: "Striker gets +8 composure and +4 offense." },
      hunter_press: { name: "Hunting Fever", desc: "15% chance per round to win the ball through pressing." },
      gegenpress_steal: { name: "Gegenpress", desc: "After every enemy turnover: +15% to your next build-up." },
      shadow_strike: { name: "Shadow Strike", desc: "In rounds 3 and 6: 20% chance for a hidden attack." },
      maestro_combo: { name: "Maestro Combo", desc: "If PM, LF, and ST all score: next goal counts double." },
      chess_predict: { name: "Prediction", desc: "Once per half: turns an enemy goal into a save." },
      symphony_pass: { name: "Symphony", desc: "If 2+ teammates trigger traits: +10% team offense." },
      speed_burst: { name: "Speed Burst", desc: "Once per half: guaranteed successful build-up." },
      launch_sequence: { name: "Launch", desc: "In round 1: +20% to your attack success." },
      unstoppable_run: { name: "Unstoppable", desc: "If tempo exceeds enemy defense: 10% chance for an automatic goal." },
      dribble_chain: { name: "Dribble Chain", desc: "Each successful attack gives +5% to the next one (stacking)." },
      street_trick: { name: "Street Trick", desc: "15% chance to beat the defender completely." },
      nutmeg: { name: "Nutmeg", desc: "20% chance on your attack to ignore enemy defense." },
      ironman_stamina: { name: "Ironman", desc: "In rounds 5-6: no stat decay and the team gets +2 tempo." },
      dynamo_power: { name: "Dynamo", desc: "Every second round: +6 team offense for that round." },
      never_stop: { name: "Never Stop", desc: "When trailing: +8 offense per goal conceded." },
      silent_killer: { name: "Silent Killer", desc: "First shot of the match gets +30% offense." },
      predator_pounce: { name: "Predator Pounce", desc: "After a failed enemy attack: 25% chance for an instant goal." },
      opportunity: { name: "Opportunity", desc: "Each successful build-up adds +3% goal chance." },
      cannon_blast: { name: "Cannon Blast", desc: "Every shot has a 10% chance to become an automatic goal, but miss chance rises by 5%." },
      header_power: { name: "Header Beast", desc: "With high team vision: +15% goal chance." },
      brick_hold: { name: "Ball Retention", desc: "Stabilizes the team: -10% enemy pressing." },
      ghost_run: { name: "Ghost Run", desc: "15% chance per round to appear suddenly for a chance." },
      puzzle_connect: { name: "Puzzle Piece", desc: "If the playmaker scores: +25% to your next goal chance." },
      chameleon_adapt: { name: "Adaptation", desc: "Copies the trait of the most active teammate in round 4." }
    },
    starterTeams: {
      konter: { name: "Counter Specialists", theme: "fast, defensive, punishes mistakes", desc: "Strong in midfield and out wide. Scores through fast transitions.", difficultyLabel: "Beginner" },
      kraft: { name: "Powerhouse", theme: "physical, aerial, grinding", desc: "Wins through raw power. Especially strong late in the match.", difficultyLabel: "Moderate" },
      technik: { name: "Technique Magicians", theme: "vision-based, combo passing", desc: "Builds attacks out of nowhere. Slow, but precise.", difficultyLabel: "Demanding" },
      pressing: { name: "Pressing Beasts", theme: "aggressive, breaks build-up", desc: "Forces errors through constant pressure. High-risk football with shaky nerves.", difficultyLabel: "Expert" }
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
      trait_sniper: "Precision shooter — every shot's a threat"
    },
    tactics: {
      kickoff: {
        aggressive: { name: "Aggressive Start", desc: "+18 attack in rounds 1-3, -8 defense. All-out pressure from the first whistle." },
        defensive: { name: "Defensive Start", desc: "+18 defense in rounds 1-3, -8 attack. Invite them on and hit on the break." },
        balanced: { name: "Balanced", desc: "+8 to ALL stats in rounds 1-3. First build-up's guaranteed — no cold start." },
        tempo: { name: "Tempo Game", desc: "+22 tempo in rounds 1-3, -6 composure. Overwhelm with pace before they settle." },
        pressing: { name: "Pressing", desc: "+14 defense, +10 tempo in rounds 1-3. Their build-up drops hard — but gaps appear if beaten." },
        possession: { name: "Possession", desc: "+18 vision, +10 composure in rounds 1-3. Control the game — but a turnover invites a counter." },
        counter: { name: "Counter Trap", desc: "+22 defense, +10 tempo in rounds 1-3, -6 attack. Every failed enemy attack triggers an automatic counter." },
        flank_play: { name: "Wing Play", desc: "+14 tempo, +14 attack in rounds 1-3. Wide and fast from the off." }
      },
      halftime: {
        push: { name: "Risk Push", desc: "+20 attack in rounds 4-6, -10 defense. If trailing, the boost grows with every goal owed." },
        stabilize: { name: "Stabilize", desc: "+18 defense, +10 composure in rounds 4-6. If leading, the wall grows with every goal ahead." },
        shift: { name: "Reassign", desc: "One player permanently gains +18 to their focus stat right now." },
        rally: { name: "Rally", desc: "+6 attack per goal conceded, +6 defense per goal scored. Massive swing potential." },
        reset: { name: "Reset Shape", desc: "+12 to ALL stats in rounds 4-6. Wipe the slate clean." },
        counter_h: { name: "Lean Into Counters", desc: "+24 tempo, +14 defense in rounds 4-6. Every failed enemy attack triggers an automatic counter." },
        high_press: { name: "High Press", desc: "+22 defense in rounds 4-6, -6 composure. Squeeze their build-up — but the gaps are real if beaten." },
        vision_play: { name: "Open the Game", desc: "+22 vision, +10 attack in rounds 4-6. Create the gaps and pick them apart." }
      },
      final: {
        all_in: { name: "All In", desc: "Final round: +15 attack, -15 defense. Scales with every goal owed — but leaves you wide open." },
        park_bus: { name: "Park the Bus", desc: "Final round: +15 defense, -10 attack. Scales with every goal in hand." },
        hero_ball: { name: "Hero Ball", desc: "Best form player permanently gains +30 to focus stat." },
        keep_cool: { name: "Stay Cool", desc: "Final round: +20 composure, +12 vision. Nerves of steel." },
        final_press: { name: "Final Press", desc: "Final round: +24 tempo, +18 defense, -10 attack. High counter chance." },
        long_ball: { name: "Long Balls", desc: "Final round: +28 attack, -10 vision. Direct and hard." },
        midfield: { name: "Midfield Control", desc: "Final round: +20 vision, +16 tempo, +14 composure." },
        sneaky: { name: "Ambush", desc: "Final round: +28 defense, +18 tempo, -14 attack. Lure and pounce." },
        sacrifice: { name: "Sacrifice", desc: "One player loses 15 focus stat permanently. Team: +35 offense now." }
      }
    },
    teamNamePools: {
      konter: {
        first: ["Jax", "Skye", "Ash", "Kai", "Zed", "Rex", "Vex", "Nyx", "Rook", "Swift", "Blaze", "Corvo", "Dash", "Echo", "Ravi", "Slate", "Volt", "Zane", "Kit", "Milo"],
        last: ["Quick", "Cross", "Dash", "Skye", "Reeve", "Blaze", "Quinn", "Striker", "Fall", "Rush", "Edge", "Swift", "Hale", "Stryder", "Vortex", "Flicker", "Cipher"]
      },
      pressing: {
        first: ["Grim", "Varg", "Krag", "Brax", "Thorn", "Raze", "Brunt", "Bjorn", "Krogh", "Ulf", "Magnus", "Ragnar", "Brokk", "Vidar", "Harald", "Ivor", "Orin", "Knut"],
        last: ["Bulk", "Crush", "Wolf", "Blood", "Steel", "Fang", "Claw", "Bane", "Hammer", "Iron", "Stone", "Mauler", "Tusk", "Growl", "Grave", "Forge", "Grimwald"]
      },
      technik: {
        first: ["Luca", "Nico", "Rafa", "Mateo", "Dante", "Enzo", "Alessio", "Marco", "Gianni", "Xavi", "Theo", "Renzo", "Leandro", "Diego", "Seb", "Liam", "Silas"],
        last: ["Bellucci", "Corelli", "Ferrando", "Moretti", "Salvatore", "Laurent", "Rossi", "Valenti", "Monti", "Rinaldi", "Serra", "Piazza", "Viale", "Lioncourt", "Delacroix"]
      },
      kraft: {
        first: ["Brent", "Holt", "Reinhard", "Klaus", "Kurt", "Manny", "Detlef", "Sigurd", "Hartwin", "Werner", "Friedhelm", "Heinrich", "Gunther", "Egon", "Rolf", "Ulrich"],
        last: ["Thunderpeak", "Ironfist", "Stonebrook", "Steelhammer", "Stormwald", "Ravencrest", "Wolfsberg", "Ackerman", "Rothmann", "Smith", "Gruber", "Bulwark", "Hardstone"]
      }
    },
    legendaryNames: ["Nikolai Vega", "Rasmus Orth", "Idris Storm", "Jago Sand", "Milo Rivera", "Octavian Cross", "Darian Lux", "Suren Vex", "Leon Trax", "Rune Kainz", "Ashe Quandt", "Zephyr Boehm", "Malik Kroos", "Nils Falk", "Sovereign Reinhardt", "Maksim Thoma"],
    oppTraits: {
      sturm: { name: "Storm Roller", desc: "+8% shot accuracy." },
      riegel: { name: "Lock Chain", desc: "+5% save denial each round." },
      konter_opp: { name: "Counter Threat", desc: "On your failed build-up: 30% chance for an instant shot." },
      presser_opp: { name: "Press Machine", desc: "Your build-ups fail 10% more often." },
      clutch_opp: { name: "Ice Cold", desc: "Last 2 rounds: +10 attack, +5 tempo." },
      lucky: { name: "Lucky Devils", desc: "Once per match: random bonus attack." },
      ironwall: { name: "Iron Wall", desc: "First 2 rounds: +10 defense." },
      sniper: { name: "Sniper", desc: "+15% shot accuracy, but -5 tempo." }
    },
    legendaryTraits: {
      god_mode: { name: "God Mode", desc: "Once per match: the next goal counts triple." },
      clutch_dna: { name: "Clutch DNA", desc: "In the final round: +20 attack, +10 composure." },
      field_general: { name: "Field General", desc: "Entire team: +4 to all stats." },
      unbreakable: { name: "Unbreakable", desc: "First goal conceded each match: cancelled." },
      big_game: { name: "Big-Game Player", desc: "Against bosses: +15 to focus stat." },
      conductor: { name: "Conductor", desc: "Per successful build-up: +8% on the next goal." },
      phoenix: { name: "Phoenix", desc: "When trailing by 2+: +12 attack for the rest of the match." },
      ice_in_veins: { name: "Ice in the Veins", desc: "Ignores enemy composure buffs completely." }
    }
  }
});