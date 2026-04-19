I18N.registerLocale('en', {
  ui: {
    meta: { title: 'KICKLIKE · 5-a-Side Autobattler' },
    start: {
      tagline: '> 5-a-side autobattler_',
      sub: '15 matches · 4 starter teams · emergent synergies',
      newRun: '▶ New Run',
      howTitle: 'How it works:',
      howBody: 'Choose one starter team out of 4 concepts. Each of your 5 players evolves along one of 3 paths during the run. Matches play out as auto-battles, but you choose the direction at 3 key moments. Traits trigger each other. Earn points (3 for a win, 1 for a draw), and avoid 3 straight losses. Goal: 36+ points = Champion, 24+ points = Safe.'
    },
    draft: {
      title: 'Choose your starter team',
      body: 'Each team has a theme, a strength, and a weakness. You shape its identity later through evolutions.'
    },
    hub: {
      yourTeam: 'Your Team',
      opponent: 'Opponent',
      squad: 'Squad',
      bench: 'Bench',
      lineup: '⚙ Lineup',
      startMatch: '▶ Start Match'
    },
    lineup: {
      title: 'LINEUP',
      tapToSwap: 'Tap players to swap',
      defaultHint: 'Click one starter, then one bench player to swap them. A goalkeeper (GK) is mandatory.',
      starters: 'Starters',
      bench: 'Bench',
      done: '✓ Done'
    },
    recruit: {
      title: 'LEGENDARY PICK',
      subtitle: '> boss defeated — a new hero chooses your club_',
      body: 'Pick one player. They go to your bench — maximum 2 bench slots.',
      decline: 'Decline'
    },
    match: {
      pause: '⏸ Pause',
      resume: '▶ Resume',
      speed: '⏩ Speed',
      fast: '⏩ Fast'
    },
    result: {
      win: 'WIN',
      loss: 'LOSS',
      draw: 'DRAW',
      continue: '▶ Continue',
      analysis: 'Match Breakdown',
      players: 'Player Breakdown'
    },
    gameover: { title: 'GAME OVER' },
    victory: { survived: '15 matches survived' },
    labels: {
      power: 'Power',
      standard: 'Standard',
      hotStreak: 'HOT STREAK',
      goodForm: 'Good Form',
      crisis: 'SLUMP',
      badForm: 'Bad Form',
      losingWarning: '⚠ 2 straight losses — one more and the coach is fired!',
      noBench: 'No bench players yet — beat a boss to earn one!',
      swapSelected: '→ {name} selected. Click another player to swap.',
      swapRejected: 'Swap rejected: the lineup would need exactly 1 goalkeeper.',
      benchSlots: '{count} / {max} slots',
      highscore: '✦ BEST SCORE: {points} PTS · {wins}W-{draws}D-{losses}L · {outcome} ✦',
      outcomeChampion: 'Champion',
      outcomeSurvivor: 'Safe',
      outcomeFired: 'Fired',
      compactTeamMeta: '{lineup} + {bench}B',
      matchLabel: 'Match {num}: {me}:{opp} vs {name}'
    },
    statsPanel: {
      possession: 'Possession',
      shots: 'Shots',
      accuracy: 'Accuracy',
      buildup: 'Build-up %',
      saves: 'Saves',
      goals: 'Goals',
      traitsTriggered: 'Traits Triggered',
      currentTeamStats: 'Current Team Stats',
      own: 'You',
      diff: 'Diff',
      opponent: 'Opponent',
      buffsFootnote: 'Buffs stack across kickoff, halftime, and final phase'
    },
    evolution: {
      title: 'EVOLUTION!',
      reachedLevel: '{name} ({role}) reached level {level}',
      traitLabel: 'Trait: {name}',
      keepsTrait: 'keeps: {name} (+30%)'
    },
    flow: {
      lineupIncomplete: 'Lineup incomplete! Please choose 5 players.',
      benchFull: 'Bench is full!',
      lineupInvalid: 'Invalid lineup! You need exactly 1 goalkeeper and 5 total players.',
      kickoffTitle: 'Kickoff Tactic',
      kickoffSubtitle: 'How do we start?',
      halftimeTitle: 'Halftime Adjustment',
      scoreSubtitle: 'Score: {me}:{opp}',
      finalTitle: 'Final Decision',
      roundScoreSubtitle: 'Round 6 — Score: {me}:{opp}',
      reward: 'Ø {avg} XP/player — performance based',
      gameOverStreak: '3 straight losses — coach fired!',
      gameOverLosses: '{losses} total losses — season abandoned.',
      safe: 'SAFE',
      rescued: 'JUST SURVIVED',
      points: '{points} POINTS',
      record: '✦ NEW RECORD ✦',
      bestScore: 'Best score: {points} pts ({team})',
      afterMatches: '{points} points after {matches} matches',
      bestRun: '✦ New best run ✦'
    },
    perf: {
      buildups: '{ok}/{all} build-ups',
      defenses: '{count} stops',
      keeper: '{saves} saves  {conceded} conceded'
    },
    log: {
      opponentIntro: '  ↳ Opponent: {parts}',
      kickoffChoice: '  → Kickoff: {name}',
      halftimeHeader: '––– HALFTIME –––',
      halftimeChoice: '  → Halftime: {name}',
      finalChoice: '  → Final phase: {name}',
      possessionPressure: '  Possession: {pct}% — pressure phase',
      possessionDominated: '  Possession: {pct}% — opponent in control',
      chainAttack: '  ⚡ Chain attack!',
      luckyDouble: '  🍀 {name} gets lucky — double attack!',
      counter: '  🔁 Counterattack!',
      laserPass: '🎯 {name} LASER PASS — counter triggered!',
      bulldoze: '🛡 {name} BULLDOZE — turnover and counter!',
      hardTackle: '🥾 {name} HARD TACKLE — counter!',
      chessPredict: '♟ {name} CHESS PREDICT — reads out the goal!',
      speedBurst: '💨 {name} SPEED BURST — build-up guaranteed!',
      pounce: '🐆 {name} HUNTING INSTINCT — instant counter!',
      oppBlitzCounter: '  ⚡ {name} breaks into a lightning counter!',
      shadowStrike: '{name} SHADOW STRIKE - hidden attack!',
      streetTrick: '{name} STREET TRICK - defender beaten!',
      silentKiller: '{name} SILENT KILLER - first shot empowered!',
      cannonBlast: '{name} CANNON BLAST!',
      ghostRun: '{name} GHOST RUN - hidden chance!',
      puzzleConnect: '{name} PUZZLE LINKED!',
      nineLives: '🐱 {name} NINE LIVES — goal cancelled!',
      killerPass: '⚡ {name} KILLER PASS — chain next round!',
      maestroCombo: '🎼 {name} MAESTRO COMBO — next goal counts double!',
      unstoppable: '🚀 {name} UNSTOPPABLE — uncontested goal!',
      godMode: '⭐ {name} GOD MODE — next goal x3!',
      unbreakable: '🛡 {name} UNBREAKABLE — goal cancelled!',
      roundHeader: 'ROUND {round}',
      ownGoal: '⚽ GOAL {name}!{suffix}   {me}:{opp}',
      oppGoal: '💥 Conceded — {name} scores   {me}:{opp}',
      fullTime: '🏁 FULL TIME — {me}:{opp}',
      penaltiesIntro: '🏁 90 MINUTES OVER — {me}:{opp}',
      penaltiesTitle: '⚽ PENALTY SHOOTOUT — no draw in the final match!',
      penaltyScored: '  {num}. ⚽ scored — {me}:{opp}',
      penaltyMissed: '  {num}. ⚠ missed — {me}:{opp}',
      oppPenaltyScored: '  {name} scores — {me}:{opp}',
      oppPenaltyMissed: '  {name} misses — {me}:{opp}',
      suddenDeath: '  Sudden death: {me}:{opp}',
      penaltiesWin: '🏆 WIN ON PENALTIES',
      penaltiesLoss: '💥 LOSS ON PENALTIES'
    }
  },
  stats: {
    offense: 'Attack',
    defense: 'Defense',
    tempo: 'Tempo',
    vision: 'Vision',
    composure: 'Composure'
  },
  generated: {
    masteryName: '{label} Mastery',
    masteryDesc: 'Evolution from {parent}: amplifies {stats}. The parent trait is 30% stronger.'
  },
  logs: {
    ownBuildFail: [
      '{pm} loses the ball in midfield',
      'The opponent intercepts {pm}\'s pass',
      'A misplaced pass from {vt} sparks danger',
      '{pm} overhits the vertical ball',
      'Pressing forces {pm} into a back pass',
      'Turnover on the halfway line'
    ],
    ownBuildSuccess: [
      '{pm} opens midfield with a through ball',
      '{pm} finds the lane between the lines',
      'Quick one-two between {pm} and {lf}',
      '{pm} switches it wide',
      '{lf} surges down the flank',
      '{vt} starts the move well — {pm} takes over',
      '{pm} drives the ball into the final third'
    ],
    chance: [
      '{scorer} gets the shot away...',
      '{scorer} breaks free in the box...',
      '{scorer} has the chance...',
      '{scorer} is lurking in front of goal...',
      '{scorer} is fed inside the area...'
    ],
    miss: [
      '{scorer} drags it just wide',
      '{scorer} hits the post!',
      '{scorer} shoots too centrally — keeper saves',
      '{scorer} fires over',
      '{scorer} is blocked at the last second',
      '{scorer} wastes the chance',
      '{scorer} rattles the bar!'
    ],
    oppBuildFail: [
      '{opp} loses the ball in the build-up',
      '{opp} misplaces the pass completely',
      '{vt} cuts it out',
      '{opp} is disrupted in possession',
      'Counter-pressing forces {opp} into a mistake'
    ],
    oppApproach: [
      '{opp} attacks down the wing',
      '{opp} moves the ball forward at speed',
      '{opp} looks for the finish',
      'The opposing striker slips beyond the back line',
      '{opp} plays through midfield'
    ],
    save: [
      '{tw} makes a strong save!',
      '{tw} gathers it cleanly',
      '{vt} blocks the shot at the last second',
      'Wayward effort — {tw} has it covered',
      '{tw} produces a brilliant stop!',
      'Header wide of the goal'
    ]
  },
  data: {
    evoLabels: {
      titan: 'Titan',
      fortress: 'Fortress',
      shotstopper: 'Shot Stopper',
      libero_keeper: 'Libero Keeper',
      distributor: 'Distributor',
      highline: 'High-Liner',
      acrobat: 'Acrobat',
      wall: 'Wall',
      catman: 'Cat Man',
      enforcer: 'Enforcer',
      bulldozer: 'Bulldozer',
      captain_cool: 'Captain Cool',
      shark: 'Shark',
      terminator: 'Terminator',
      whirlwind: 'Whirlwind',
      orchestrator: 'Orchestrator',
      late_bloomer: 'Late Bloomer',
      scholar: 'Scholar',
      metronome: 'Metronome',
      architect: 'Architect',
      whisperer: 'Whisperer',
      hunter: 'Hunter',
      gegenpress: 'Gegenpress',
      shadow: 'Shadow',
      maestro_mid: 'Maestro',
      chess: 'Chessmaster',
      conductor_mid: 'Conductor',
      speedster: 'Speedster',
      rocket: 'Rocket',
      freight: 'Freight Train',
      magician: 'Magician',
      street: 'Street Baller',
      trickster: 'Trickster',
      ironman: 'Ironman',
      dynamo: 'Dynamo',
      eternal: 'Eternal',
      assassin: 'Assassin',
      predator_s: 'Predator',
      opportunist: 'Opportunist',
      cannon: 'Cannon',
      skyscraper: 'Skyscraper',
      brick: 'Brick',
      ghost: 'Ghost',
      puzzle: 'Puzzle',
      chameleon: 'Chameleon'
    },
    roles: {
      TW: { label: 'Goalkeeper', desc: 'Wins one-on-ones' },
      VT: { label: 'Defender', desc: 'Back-line anchor' },
      PM: { label: 'Playmaker', desc: 'Orchestrates attacks' },
      LF: { label: 'Runner', desc: 'Chaos engine' },
      ST: { label: 'Striker', desc: 'Finisher' }
    },
    archetypes: {
      keeper_block: 'Blocking Keeper',
      keeper_sweep: 'Sweeper Keeper',
      keeper_reflex: 'Reflex Keeper',
      def_wall: 'Concrete Wall',
      def_tackle: 'Biter',
      def_sweeper: 'Libero',
      pm_regista: 'Regista',
      pm_press: 'Press Engine',
      pm_playmaker: 'Playmaker',
      lf_winger: 'Wing Burner',
      lf_dribbler: 'Dribbler',
      lf_box: 'Box-to-Box',
      st_poacher: 'Poacher',
      st_target: 'Target Man',
      st_false9: 'False Nine'
    },
    traits: {
      titan_stand: { name: 'Titan Stance', desc: 'Against enemy shots: 30% chance to stop them while the score is close, with a difference of 1 or less.' },
      fortress_aura: { name: 'Fortress Aura', desc: 'The defender gets +6 defense while the keeper is active.' },
      clutch_save: { name: 'Clutch Save', desc: 'In rounds 5-6: +20% save rate.' },
      sweep_assist: { name: 'Sweep Assist', desc: 'After a goalkeeper save: +8% to the next build-up.' },
      laser_pass: { name: 'Laser Pass', desc: 'After a save: 20% chance to trigger an immediate counter.' },
      offside_trap: { name: 'Offside Trap', desc: '15% of all enemy attacks are negated, based on tempo.' },
      acrobat_parry: { name: 'Acrobatics', desc: 'After a save: +12% save chance on the next shot, once per match.' },
      wall_effect: { name: 'Wall', desc: '+15% permanent save rate, but -10% to your own build-up.' },
      nine_lives: { name: 'Nine Lives', desc: 'Once per match: the first goal conceded is cancelled.' },
      intimidate: { name: 'Intimidate', desc: 'The enemy striker gets -5 offense.' },
      bulldoze: { name: 'Bulldozer', desc: 'Each round: 10% chance to steal the ball before the enemy shot.' },
      captain_boost: { name: 'Captain', desc: 'The entire team gets +3 composure.' },
      blood_scent: { name: 'Blood Scent', desc: 'After every enemy goal: +5 defense for the rest of the match.' },
      hard_tackle: { name: 'Hard Tackle', desc: '20% chance to break the enemy attack and launch a counter.' },
      whirlwind_rush: { name: 'Whirlwind', desc: 'Once per half: doubles this player\'s tempo for one round.' },
      build_from_back: { name: 'Build from the Back', desc: 'The playmaker gets +8 vision.' },
      late_bloom: { name: 'Late Bloomer', desc: 'From round 4 onward: +10 offense and +5 vision.' },
      read_game: { name: 'Read the Game', desc: 'Once per match: automatically negates an enemy attack.' },
      metronome_tempo: { name: 'Metronome', desc: 'Each round: +2% to your build-up, stacking over time.' },
      killer_pass: { name: 'Killer Pass', desc: 'On your attack: 25% chance to trigger a chain shot.' },
      whisper_boost: { name: 'Whisper', desc: 'The striker gets +8 composure and +4 offense.' },
      hunter_press: { name: 'Hunting Fever', desc: '15% chance per round to win the ball through pressing.' },
      gegenpress_steal: { name: 'Gegenpress', desc: 'After every enemy turnover: +15% to your next build-up.' },
      shadow_strike: { name: 'Shadow Strike', desc: 'In rounds 3 and 6: 20% chance for a hidden attack.' },
      maestro_combo: { name: 'Maestro Combo', desc: 'If PM, LF, and ST all score: your next goal counts double.' },
      chess_predict: { name: 'Prediction', desc: 'Once per half: turns an enemy goal into a save.' },
      symphony_pass: { name: 'Symphony', desc: 'If 2 or more teammates trigger traits: +10% team offense.' },
      speed_burst: { name: 'Speed Burst', desc: 'Once per half: guaranteed successful build-up.' },
      launch_sequence: { name: 'Launch', desc: 'In round 1: +20% to your attack success.' },
      unstoppable_run: { name: 'Unstoppable', desc: 'If tempo is higher than enemy defense: 10% chance for an automatic goal.' },
      dribble_chain: { name: 'Dribble Chain', desc: 'Each successful attack gives +5% to the next one, stacking.' },
      street_trick: { name: 'Street Trick', desc: '15% chance to beat the defender completely.' },
      nutmeg: { name: 'Nutmeg', desc: '20% chance on your attack to ignore enemy defense.' },
      ironman_stamina: { name: 'Ironman', desc: 'In rounds 5-6: no stat decay and the team gets +2 tempo.' },
      dynamo_power: { name: 'Dynamo', desc: 'Every second round: +6 team offense for that round.' },
      never_stop: { name: 'Never Stop', desc: 'When trailing: +8 offense per goal conceded.' },
      silent_killer: { name: 'Silent Killer', desc: 'The first shot of the match gets +30% offense.' },
      predator_pounce: { name: 'Predator Pounce', desc: 'After a failed enemy attack: 25% chance for an instant goal.' },
      opportunity: { name: 'Opportunity', desc: 'Each successful build-up adds +3% goal chance even without an attack trigger.' },
      cannon_blast: { name: 'Cannon Blast', desc: 'Every shot has a 10% chance to become an automatic goal, but miss chance rises by 5%.' },
      header_power: { name: 'Header Beast', desc: 'With high team vision: +15% goal chance.' },
      brick_hold: { name: 'Ball Retention', desc: 'Stabilizes the team: -10% enemy pressing.' },
      ghost_run: { name: 'Ghost Run', desc: '15% chance per round to appear suddenly for a chance.' },
      puzzle_connect: { name: 'Puzzle Piece', desc: 'If the playmaker scores: +25% to your next goal chance in the following round.' },
      chameleon_adapt: { name: 'Adaptation', desc: 'Copies the trait of the most active teammate in round 4.' }
    },
    starterTeams: {
      konter: { name: 'Counter Specialists', theme: 'fast, defensive, punishes mistakes', desc: 'Strong in midfield and out wide. Scores through fast transitions.', difficultyLabel: 'Beginner' },
      kraft: { name: 'Powerhouse', theme: 'physical, aerial, grinding', desc: 'Wins through raw power. Especially strong late in the match.', difficultyLabel: 'Moderate' },
      technik: { name: 'Technique Magicians', theme: 'vision-based, combo passing', desc: 'Builds attacks out of nowhere. Slow, but precise.', difficultyLabel: 'Demanding' },
      pressing: { name: 'Pressing Beasts', theme: 'aggressive, breaks build-up', desc: 'Forces errors through constant pressure. High-risk football with shaky nerves.', difficultyLabel: 'Expert' }
    },
    opponents: {
      prefixes: ['SC ', 'FC ', 'Athletic ', 'Union ', 'Sporting ', 'Dynamo ', 'Real ', 'Racing ', 'Red Star ', 'Albion '],
      places: ['Nightwood', 'Stormhold', 'Coldcrag', 'Ironvale', 'Roughbridge', 'Thunder Peak', 'Windhaven', 'Froststorm', 'Ravenfield', 'Shadowvale', 'Firehorn', 'Mistkeep', 'Wastemark', 'Bloodrock', 'Tempest Grove'],
      specials: {
        offensive: 'Attack Focus',
        defensive: 'Stronghold',
        pacey: 'Lightning Quick',
        cerebral: 'Tactician',
        stoic: 'Iron-Willed',
        balanced: 'Balanced'
      }
    },
    tactics: {
      kickoff: {
        aggressive: { name: 'Aggressive Start', desc: '+6 attack in rounds 1-3, -4 defense.' },
        defensive: { name: 'Defensive Start', desc: '+6 defense in rounds 1-3, -4 attack.' },
        balanced: { name: 'Balanced', desc: '+3 to all stats in rounds 1-3.' },
        tempo: { name: 'Tempo Game', desc: '+8 tempo in rounds 1-3, -3 composure.' },
        pressing: { name: 'Pressing', desc: '+5 defense and +4 tempo in rounds 1-3.' },
        possession: { name: 'Possession', desc: '+6 vision and +4 composure in rounds 1-3.' },
        counter: { name: 'Counter Trap', desc: '+8 defense, +4 tempo in rounds 1-3, -2 attack.' },
        flank_play: { name: 'Wing Play', desc: '+5 tempo and +5 attack in rounds 1-3.' }
      },
      halftime: {
        push: { name: 'Risk Push', desc: '+8 attack in rounds 4-6, -6 defense.' },
        stabilize: { name: 'Stabilize', desc: '+6 defense and +4 composure in rounds 4-6.' },
        shift: { name: 'Reassign', desc: 'One player permanently gains +10 to their focus stat.' },
        rally: { name: 'Rally', desc: '+3 attack per goal conceded, +3 defense per goal scored.' },
        reset: { name: 'Reset Shape', desc: '+5 to all stats in rounds 4-6.' },
        counter_h: { name: 'Lean Into Counters', desc: '+10 tempo and +5 defense in rounds 4-6.' },
        high_press: { name: 'High Press', desc: '+8 defense in rounds 4-6, -3 composure.' },
        vision_play: { name: 'Open the Game', desc: '+8 vision and +4 attack in rounds 4-6.' }
      },
      final: {
        all_in: { name: 'All In', desc: 'Final round: +15 attack, -15 defense.' },
        park_bus: { name: 'Park the Bus', desc: 'Final round: +15 defense, -10 attack.' },
        hero_ball: { name: 'Hero Ball', desc: 'One random player permanently gains +20 focus stat.' },
        keep_cool: { name: 'Stay Cool', desc: 'Final round: +8 composure and +5 vision.' },
        final_press: { name: 'Final Press', desc: 'Final round: +10 tempo and +8 defense, -5 attack.' },
        long_ball: { name: 'Long Balls', desc: 'Final round: +12 attack, -5 vision.' },
        midfield: { name: 'Midfield Control', desc: 'Final round: +8 vision, +6 tempo, +6 composure.' },
        sneaky: { name: 'Ambush', desc: 'Final round: +12 defense, +8 tempo, -8 attack.' }
      }
    },
    teamNamePools: {
      konter: {
        first: ['Jax','Skye','Ash','Kai','Zed','Rex','Vex','Nyx','Rook','Swift','Blaze','Corvo','Dash','Echo','Ravi','Slate','Volt','Zane','Kit','Milo'],
        last: ['Quick','Cross','Dash','Skye','Reeve','Blaze','Quinn','Striker','Fall','Rush','Edge','Swift','Hale','Stryder','Vortex','Flicker','Cipher']
      },
      pressing: {
        first: ['Grim','Varg','Krag','Brax','Thorn','Raze','Brunt','Bjorn','Krogh','Ulf','Magnus','Ragnar','Brokk','Vidar','Harald','Ivor','Orin','Knut'],
        last: ['Bulk','Crush','Wolf','Blood','Steel','Fang','Claw','Bane','Hammer','Iron','Stone','Mauler','Tusk','Growl','Grave','Forge','Grimwald']
      },
      technik: {
        first: ['Luca','Nico','Rafa','Mateo','Dante','Enzo','Alessio','Marco','Gianni','Xavi','Theo','Renzo','Leandro','Diego','Seb','Liam','Silas'],
        last: ['Bellucci','Corelli','Ferrando','Moretti','Salvatore','Laurent','Rossi','Valenti','Monti','Rinaldi','Serra','Piazza','Viale','Lioncourt','Delacroix']
      },
      kraft: {
        first: ['Brent','Holt','Reinhard','Klaus','Kurt','Manny','Detlef','Sigurd','Hartwin','Werner','Friedhelm','Heinrich','Gunther','Egon','Rolf','Ulrich'],
        last: ['Thunderpeak','Ironfist','Stonebrook','Steelhammer','Stormwald','Ravencrest','Wolfsberg','Ackerman','Rothmann','Smith','Gruber','Bulwark','Hardstone']
      }
    },
    legendaryNames: ['Nikolai Vega','Rasmus Orth','Idris Storm','Jago Sand','Milo Rivera','Octavian Cross','Darian Lux','Suren Vex','Leon Trax','Rune Kainz','Ashe Quandt','Zephyr Boehm','Malik Kroos','Nils Falk','Sovereign Reinhardt','Maksim Thoma'],
    oppTraits: {
      sturm: { name: 'Storm Roller', desc: '+8% shot accuracy.' },
      riegel: { name: 'Lock Chain', desc: '+5% save denial each round.' },
      konter_opp: { name: 'Counter Threat', desc: 'On your failed build-up: 30% chance for an instant shot.' },
      presser_opp: { name: 'Press Machine', desc: 'Your build-ups fail 10% more often.' },
      clutch_opp: { name: 'Ice Cold', desc: 'Last 2 rounds: +10 attack, +5 tempo.' },
      lucky: { name: 'Lucky Devils', desc: 'Once per match: random bonus attack.' },
      ironwall: { name: 'Iron Wall', desc: 'First 2 rounds: +10 defense.' },
      sniper: { name: 'Sniper', desc: '+15% shot accuracy, but -5 tempo.' }
    },
    legendaryTraits: {
      god_mode: { name: 'God Mode', desc: 'Once per match: the next goal counts triple.' },
      clutch_dna: { name: 'Clutch DNA', desc: 'In the final round: +20 attack, +10 composure.' },
      field_general: { name: 'Field General', desc: 'Entire team: +4 to all stats.' },
      unbreakable: { name: 'Unbreakable', desc: 'First goal conceded each match: cancelled.' },
      big_game: { name: 'Big-Game Player', desc: 'Against bosses: +15 to focus stat.' },
      conductor: { name: 'Conductor', desc: 'Per successful build-up: +8% on the next goal.' },
      phoenix: { name: 'Phoenix', desc: 'When trailing by 2+: +12 attack for the rest of the match.' },
      ice_in_veins: { name: 'Ice in the Veins', desc: 'Ignores enemy composure buffs completely.' }
    }
  }
});
