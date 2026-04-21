I18N.registerLocale("en", {
  ui: {
    meta: { title: "KICKLIKE · 5-a-Side Autobattler" },
    start: {
      tagline: "> 5-a-side autobattler_",
      sub: "15 matches · 4 starter teams · emergent synergies",
      newRun: "▶ New Run",
      howTitle: "How it works:",
      howBody: "Pick one of 4 starter teams. Play 15 matches, with boss fights at matches 5, 10 and 15. Win a boss and you recruit a legend to your bench. Each player evolves at levels 5, 9 and 13 — pick 1 of 3 paths each time. Matches auto-play, but you call the shots at 3 key moments: kickoff, halftime, final. Traits chain into each other. 3 points for a win, 1 for a draw, 3 straight losses = fired. 36+ points = Champion, 24+ = Safe."
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
      startMatch: "▶ Start Match",
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
      tileEvos:   "Evolutions"
    },
    detail: {
      traits: "Traits",
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
      comeback:       { title: "Comeback Kings",   desc: "Won after trailing at halftime" }
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
      pulseSaves:   "saves"
    },
    result: {
      win: "WIN",
      loss: "LOSS",
      draw: "DRAW",
      continue: "▶ Continue",
      analysis: "Match Breakdown",
      players: "Player Breakdown",
      matchLogTitle: "Match Log",
      matchFlowTitle: "Match Flow",
      matchFlowHint: "Team stat trajectory during the match (buffs, form, traits).",
      detailsToggle: "Full Breakdown",
      stopsLabel: "stops",
      sacrificeNote: "{name} gave everything — permanent stat loss.",
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
      bossTell: "Boss fight — all stats boosted, no mistakes allowed",
      academy: "ACADEMY"
    },
    statsPanel: {
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
      conflictShort: "CONFLICT"
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
      academyTooltip: "Academy call-up — temporary replacement, significantly weaker stats, no traits. Leaves the squad after this match."
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
      finalChoice: "  → {name}",
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
      synergyBonus: "  🔗 {name} ({trait}) +{bonus}%",

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
        clutchSurge: "  {name} ({team}) — late surge, energy levels rising."
      }
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
      "Turnover. {oppPM} and {oppVT} transition immediately."
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
      "{scorer} skies it — well over.",
      "Blocked! {scorer} can't believe it.",
      "{scorer} hesitates — the chance is gone.",
      "{scorer} gets under it — up and over."
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
      "{vt} wins it cleanly off {opp} ({team})."
    ],
    oppApproach: [
      "{opp} ({team}) advances with purpose.",
      "{oppPM} releases {opp} — numbers forward.",
      "{oppPM} works it into {opp} — dangerous position.",
      "{opp} ({team}) finds space in behind.",
      "{oppPM} isolates the backline — {opp} incoming."
    ],
    save: [
      "{tw} — strong hands on {shooter}'s effort. Stays out.",
      "{tw} dives full stretch — {shooter} denied.",
      "{vt} throws himself in {shooter}'s path — blocked.",
      "{tw} smothers {shooter} at the near post.",
      "Tipped over by {tw} — {shooter} ({team}) can't believe it.",
      "{vt} clears off the line — crucial on {shooter}."
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
      trait_sniper: "Precision shooter — every shot's a threat"
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
        shift: { name: "Reassign", desc: "One player permanently gains +18 to their focus stat right now." },
        rally: { name: "Rally", desc: "+6 attack per goal conceded, +6 defense per goal scored. Massive swing potential." },
        reset: { name: "Reset Shape", desc: "+12 to ALL stats R4-6. Wipe the slate clean — no more script." },
        counter_h: { name: "Lean Into Counters", desc: "+24 tempo, +14 defense R4-6. Failed enemy attack triggers a counter." },
        high_press: { name: "High Press", desc: "+22 defense R4-6, -6 composure. Squeeze their build-up — but gaps are real." },
        vision_play: { name: "Open the Game", desc: "+22 vision, +10 attack R4-6. Create gaps and pick them apart." },
        shake_up: { name: "Shake-Up", desc: "Worst-form player takes a permanent -5 all stats hit. Team responds: +12 attack R4-6." },
        lock_bus: { name: "Lock the Bus", desc: "Only if leading: +30 defense, -20 attack R4-6. Impenetrable but toothless." },
        desperate: { name: "Desperate Attack", desc: "Only if trailing 2+: +32 attack R4-6, -20 defense. Keeper on his own. All or nothing." },
        role_switch: { name: "Role Switch", desc: "LF and ST swap roles R4-6. +10 tempo, +10 attack, -8 vision. New angles of attack." },
        coach_fire: { name: "Fiery Team Talk", desc: "Only if losing: next match's team form +1, this match +14 attack R4-6. Anger fuels them." },
        cold_read: { name: "Cold Read", desc: "Read their tactics. +20 defense, enemy attack -8 R4-6. Outsmart, don't outfight." },
        wingman: { name: "Free the Wingman", desc: "LF gets +25 tempo, +15 attack personal. Team -4 composure. One-man show risk." },
        mind_reset: { name: "Mental Reset", desc: "Wipes all form deltas in squad. Fresh slate into R4-6 — no baggage, no momentum." },
        double_down: { name: "Double Down", desc: "Amplifies your biggest current team buff by +40%. Rewards momentum — dead if you have none." },
        tactical_foul: { name: "Tactical Fouls", desc: "+8 defense, opp tempo -12 for 2 rounds. Disruption, not self-improvement." },
        wing_overload: { name: "Wing Overload", desc: "LF: +20 offense, +20 tempo personal R4-6. Team -6 defense. One-winger show." },
        shell_defense: { name: "Shell Defense", desc: "Only drawing or leading: +24 defense, +14 composure, -10 attack R4-6. Preserve the state." }
      },
      final: {
        all_in: { name: "All In", desc: "Final round: +15 attack, -15 defense. Scales with goals owed. Leaves you wide open." },
        park_bus: { name: "Park the Bus", desc: "Final round: +15 defense, -10 attack. Scales with every goal in hand." },
        hero_ball: { name: "Hero Ball", desc: "Best-form player permanently gains +30 focus stat." },
        keep_cool: { name: "Stay Cool", desc: "Final round: +20 composure, +12 vision. Nerves of steel." },
        final_press: { name: "Final Press", desc: "Final round: +24 tempo, +18 defense, -10 attack. High counter chance." },
        long_ball: { name: "Long Balls", desc: "Final round: +28 attack, -10 vision. Direct and hard." },
        midfield: { name: "Midfield Control", desc: "Final round: +20 vision, +16 tempo, +14 composure." },
        sneaky: { name: "Ambush", desc: "Final round: +28 defense, +18 tempo, -14 attack. Lure and pounce." },
        sacrifice: { name: "Sacrifice", desc: "One player loses 15 focus stat permanently. Team: +35 attack now." },
        kamikaze: { name: "Kamikaze", desc: "Only if trailing: +40 attack, -40 defense. Keeper exposed. Hope and pray." },
        clockwatch: { name: "Clock Watching", desc: "Only if leading: +25 defense, +18 composure. Let the clock work for you." },
        poker: { name: "Poker Face", desc: "Only if tied: +15 to every single stat. Pure clutch — everything to play for." },
        lone_wolf: { name: "Lone Wolf", desc: "Striker: +40 attack, +20 tempo personal. Rest of team: -6 attack. One shot, one kill." },
        fortress: { name: "Fortress", desc: "TW/VT get +40 defense. Team -20 attack. Turn the goal into a bunker." },
        gamble: { name: "Gamble", desc: "Coin flip: +35 attack on heads, -15 all stats on tails. Pure chaos energy." },
        masterclass: { name: "Masterclass", desc: "PM: +30 vision, +20 composure personal. Team +12 attack. Let the maestro conduct." },
        rope_a_dope: { name: "Rope-a-Dope", desc: "R6 only: +35 defense. Every enemy attack triggers an auto-counter. Bait then strike." },
        set_piece: { name: "Set Piece Master", desc: "R6: +25 attack, but ONLY on attacks from successful buildups. Narrow, surgical boost." },
        siege_mode: { name: "Siege Mode", desc: "R6: +20 attack, +10 tempo, +10 vision. Clean all-around pressure, no penalty." },
        bus_and_bike: { name: "Bus & Bike", desc: "R6: +18 defense. Each save/stop loads +30 attack on your next ball." },
        face_pressure: { name: "Face the Pressure", desc: "R6: +25 composure, opp shots -8% accuracy. Clutch nerves under the lights." }
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
      sturm: { name: "Storm Roller", desc: "+8% shot accuracy." },
      riegel: { name: "Lock Chain", desc: "+5% save denial each round." },
      konter_opp: { name: "Counter Threat", desc: "On your failed build-up: 30% chance for an instant shot." },
      presser_opp: { name: "Press Machine", desc: "Your build-ups fail 10% more often." },
      clutch_opp: { name: "Ice Cold", desc: "Last 2 rounds: +10 attack, +5 tempo." },
      lucky: { name: "Lucky Devils", desc: "Once per match: random bonus attack." },
      ironwall: { name: "Iron Wall", desc: "First 2 rounds: +10 defense." },
      sniper: { name: "Sniper", desc: "+15% shot accuracy, but -5 tempo." },
      boss_aura: { name: "Dominant Presence", desc: "Boss-only aura: all opponent players get a permanent stat boost every round." }
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
