const INTERNAL = {
  state: null,
  listeners: new Set(),
};

export function createInitialAppState() {
  return {
    game: null,
    ui: {
      screen: 'start',
      modal: null,
      busy: false,
      lang: 'en',
    },
    session: {
      seed: null,
      version: 'v2-architecture',
    },
  };
}

export function getAppState() {
  return INTERNAL.state;
}

export function setAppState(nextState) {
  INTERNAL.state = nextState;
  emit();
  return INTERNAL.state;
}

export function patchAppState(patch) {
  INTERNAL.state = {
    ...(INTERNAL.state || createInitialAppState()),
    ...patch,
  };
  emit();
  return INTERNAL.state;
}

export function updateAppState(updater) {
  const current = INTERNAL.state || createInitialAppState();
  INTERNAL.state = updater(current);
  emit();
  return INTERNAL.state;
}

export function subscribe(listener) {
  INTERNAL.listeners.add(listener);
  return () => INTERNAL.listeners.delete(listener);
}

function emit() {
  for (const listener of INTERNAL.listeners) {
    try {
      listener(INTERNAL.state);
    } catch (error) {
      console.warn('[app/store] listener failed', error);
    }
  }
}

export function initializeStore(initialState = createInitialAppState()) {
  INTERNAL.state = initialState;
  return INTERNAL.state;
}
