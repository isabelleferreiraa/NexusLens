/** Browser-only display preferences. Never store credentials or dataset rows. */
export const UI_PREFERENCES_KEY = 'nexuslens.ui-preferences.v1';

export const DEFAULT_UI_PREFERENCES = Object.freeze({
  sidebarCollapsed: false,
  reduceMotion: false,
});

export function normalizeUiPreferences(value) {
  return {
    sidebarCollapsed: typeof value?.sidebarCollapsed === 'boolean' ? value.sidebarCollapsed : false,
    reduceMotion: typeof value?.reduceMotion === 'boolean' ? value.reduceMotion : false,
  };
}

export function readUiPreferences(storage) {
  try {
    const raw = storage?.getItem(UI_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_UI_PREFERENCES };
    const stored = JSON.parse(raw);
    if (!stored || stored.version !== 1 || typeof stored.preferences !== 'object' || Array.isArray(stored.preferences)) {
      return { ...DEFAULT_UI_PREFERENCES };
    }
    return normalizeUiPreferences(stored.preferences);
  } catch {
    return { ...DEFAULT_UI_PREFERENCES };
  }
}

export function saveUiPreferences(storage, preferences) {
  if (typeof preferences?.sidebarCollapsed !== 'boolean' || typeof preferences?.reduceMotion !== 'boolean') {
    return false;
  }
  try {
    if (!storage) return false;
    storage.setItem(UI_PREFERENCES_KEY, JSON.stringify({
      version: 1,
      preferences: normalizeUiPreferences(preferences),
    }));
    return true;
  } catch {
    return false;
  }
}

/** Never infer a healthy/loaded dataset from HTTP 200 alone. */
export function interpretIbmStatus(response) {
  if (!response || response.dataset !== 'ibm-aml-hi-small' ||
      response.dados_sinteticos !== true || response.moeda !== 'USD' ||
      typeof response.disponivel !== 'boolean' ||
      !Number.isInteger(response.total_contas) || response.total_contas < 0 ||
      !Number.isInteger(response.total_transacoes) || response.total_transacoes < 0 ||
      !['pronto', 'vazio', 'nao_importado'].includes(response.situacao)) {
    return null;
  }
  if (response.disponivel !== (response.situacao === 'pronto') ||
      (response.disponivel && (response.total_contas === 0 || response.total_transacoes === 0)) ||
      (!response.disponivel && (response.total_contas !== 0 || response.total_transacoes !== 0))) {
    return null;
  }
  return {
    available: response.disponivel,
    state: response.situacao,
    accounts: response.total_contas,
    transactions: response.total_transacoes,
  };
}
