/*
 * Language handling.
 *
 * Every language lives in content/<code>.json and is listed in content/languages.json.
 * A translation file only has to contain the text that differs from the default
 * language: it is deep-merged over the default one (objects by key, arrays of
 * objects by index), so dates, links and tech stacks can stay in en.json only.
 */
(function () {
  const STORAGE_KEY = 'cv-lang';

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function deepMerge(base, override) {
    if (override === undefined) return base;
    if (Array.isArray(base) && Array.isArray(override)) {
      const allObjects = base.every(isPlainObject) && override.every(isPlainObject);
      if (!allObjects) return override;
      const length = Math.max(base.length, override.length);
      return Array.from({ length }, (_, i) => deepMerge(base[i], override[i]));
    }
    if (isPlainObject(base) && isPlainObject(override)) {
      const result = { ...base };
      for (const key of Object.keys(override)) {
        result[key] = deepMerge(base[key], override[key]);
      }
      return result;
    }
    return override;
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
  }

  function readStoredLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function storeLang(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* private mode etc. — not critical */
    }
  }

  /**
   * Priority: ?lang= in URL → saved choice → default.
   * The browser language is deliberately ignored: first-time visitors always get the default (English).
   */
  function detectLang(config) {
    const codes = config.available.map((l) => l.code);
    const fromUrl = new URLSearchParams(location.search).get('lang');
    const candidates = [fromUrl, readStoredLang()];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const code = candidate.toLowerCase().split('-')[0];
      if (codes.includes(code)) return code;
    }
    return config.default;
  }

  const cache = new Map();

  async function loadContent(code, config) {
    if (cache.has(code)) return cache.get(code);
    const base = await fetchJson(`content/${config.default}.json`);
    const content = code === config.default
      ? base
      : deepMerge(base, await fetchJson(`content/${code}.json`).catch((error) => {
          console.warn(error);
          return {};
        }));
    cache.set(code, content);
    return content;
  }

  function reflectLangInUrl(code, config) {
    const url = new URL(location.href);
    if (code === config.default) url.searchParams.delete('lang');
    else url.searchParams.set('lang', code);
    history.replaceState(null, '', url);
  }

  window.I18n = {
    loadConfig: () => fetchJson('content/languages.json'),
    detectLang,
    loadContent,
    storeLang,
    reflectLangInUrl,
  };
})();
