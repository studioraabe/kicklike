export function createMatchEngine(deps) {
  const {
    core,
    decisions,
  } = deps;

  function startMatch(gameState, opponent, onEvent) {
    if (!core || !core.startMatch) {
      throw new Error('core.startMatch missing');
    }
    return core.startMatch(gameState, opponent, onEvent);
  }

  function applyDecision(match, decision, phase, state) {
    return decisions.applyDecision(match, decision, phase, state);
  }

  function checkEvents(match, onEvent, state) {
    return decisions.checkSituativeEvents(match, onEvent, state);
  }

  return {
    startMatch,
    applyDecision,
    checkEvents,
  };
}
