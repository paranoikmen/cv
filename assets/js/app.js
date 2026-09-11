(function () {
  const SECTIONS = ['about', 'experience', 'skills', 'projects', 'education', 'languages'];

  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  const footer = document.getElementById('footer');
  const langSelect = document.getElementById('lang-select');
  const langLabel = document.getElementById('lang-label');
  const printBtn = document.getElementById('print-btn');

  let config;

  /** Tiny DOM helper: h('a', { href }, 'text', child, ...). Text is always set safely. */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') el.className = value;
      else el.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child === undefined || child === null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  // ---------- dates ----------

  function parseYm(value) {
    if (!value) return null;
    const [year, month = 1] = value.split('-').map(Number);
    return { year, month };
  }

  function formatYm(value, lang, ui) {
    const ym = parseYm(value);
    if (!ym) return ui.present;
    if (!String(value).includes('-')) return String(ym.year); // "YYYY" — year only
    const date = new Date(ym.year, ym.month - 1, 1);
    return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' }).format(date);
  }

  function formatUnit(n, unit, lang, ui) {
    const forms = ui.units[unit];
    const rule = new Intl.PluralRules(lang).select(n);
    return (forms[rule] || forms.other).replace('{n}', n);
  }

  function formatDuration(start, end, lang, ui) {
    const from = parseYm(start);
    if (!from) return '';
    const now = new Date();
    const to = parseYm(end) || { year: now.getFullYear(), month: now.getMonth() + 1 };
    const total = (to.year - from.year) * 12 + (to.month - from.month) + 1; // inclusive
    const years = Math.floor(total / 12);
    const months = total % 12;
    return [
      years > 0 && formatUnit(years, 'year', lang, ui),
      months > 0 && formatUnit(months, 'month', lang, ui),
    ].filter(Boolean).join(' ');
  }

  function period(item, lang, ui, withDuration) {
    const range = item.start
      ? `${formatYm(item.start, lang, ui)} — ${formatYm(item.end, lang, ui)}`
      : formatYm(item.end, lang, ui); // only a graduation / end year is known
    const duration = withDuration ? formatDuration(item.start, item.end, lang, ui) : '';
    return h('p', { class: 'period' }, range, duration && h('span', { class: 'period__duration' }, ` · ${duration}`));
  }

  // ---------- sections ----------

  function tags(items) {
    if (!items || !items.length) return null;
    return h('ul', { class: 'tags' }, items.map((item) => h('li', { class: 'tag' }, item)));
  }

  function section(id, title, ...body) {
    return h('section', { class: 'section', id, 'aria-labelledby': `${id}-title` },
      h('h2', { class: 'section__title', id: `${id}-title` }, title),
      body,
    );
  }

  function initials(name) {
    return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  function renderHero(profile) {
    return h('section', { class: 'hero', id: 'top' },
      h('div', { class: 'hero__avatar', 'aria-hidden': 'true' },
        profile.photo ? h('img', { src: profile.photo, alt: '' }) : initials(profile.name),
      ),
      h('div', { class: 'hero__body' },
        h('h1', { class: 'hero__name' }, profile.name),
        h('p', { class: 'hero__title' }, profile.title),
        profile.location && h('p', { class: 'hero__location' }, profile.location),
        h('ul', { class: 'contacts' }, (profile.contacts || []).map((c) =>
          h('li', null, h('a', {
            class: `contact contact--${c.type}`,
            href: c.url,
            target: c.url.startsWith('http') ? '_blank' : null,
            rel: c.url.startsWith('http') ? 'noopener' : null,
          }, c.label)),
        )),
      ),
    );
  }

  function renderExperience(items, lang, ui) {
    return h('ol', { class: 'timeline' }, items.map((job) =>
      h('li', { class: 'timeline__item' },
        h('div', { class: 'timeline__head' },
          h('h3', { class: 'timeline__role' }, job.role),
          h('p', { class: 'timeline__company' },
            job.url ? h('a', { href: job.url, target: '_blank', rel: 'noopener' }, job.company) : job.company,
            job.location && h('span', { class: 'muted' }, ` · ${job.location}`),
          ),
          period(job, lang, ui, true),
        ),
        job.summary && h('p', { class: 'timeline__summary' }, job.summary),
        job.highlights && job.highlights.length && h('ul', { class: 'highlights' },
          job.highlights.map((text) => h('li', null, text)),
        ),
        tags(job.stack),
      ),
    ));
  }

  function renderSkills(groups) {
    return h('div', { class: 'skills' }, groups.map((group) =>
      h('div', { class: 'skills__group' },
        h('h3', { class: 'skills__name' }, group.group),
        tags(group.items),
      ),
    ));
  }

  function renderProjects(items) {
    return h('div', { class: 'cards' }, items.map((project) =>
      h('article', { class: 'card' },
        h('h3', { class: 'card__title' },
          project.url ? h('a', { href: project.url, target: '_blank', rel: 'noopener' }, project.name) : project.name,
        ),
        h('p', { class: 'card__text' }, project.description),
        tags(project.stack),
      ),
    ));
  }

  function renderEducation(items, lang, ui) {
    return h('ul', { class: 'list' }, items.map((item) =>
      h('li', { class: 'list__item' },
        h('h3', { class: 'list__title' }, item.institution),
        h('p', null, item.degree),
        period(item, lang, ui, false),
      ),
    ));
  }

  function renderLanguages(items) {
    return h('ul', { class: 'langs' }, items.map((item) =>
      h('li', null, h('strong', null, item.name), h('span', { class: 'muted' }, ` — ${item.level}`)),
    ));
  }

  function render(content, lang) {
    const { ui, profile } = content;

    document.documentElement.lang = lang;
    document.title = content.meta.title;
    document.querySelector('meta[name="description"]').setAttribute('content', content.meta.description);
    langLabel.textContent = ui.language;
    printBtn.textContent = ui.print;

    const bodies = {
      about: profile.summary && h('p', { class: 'about' }, profile.summary),
      experience: content.experience?.length && renderExperience(content.experience, lang, ui),
      skills: content.skills?.length && renderSkills(content.skills),
      projects: content.projects?.length && renderProjects(content.projects),
      education: content.education?.length && renderEducation(content.education, lang, ui),
      languages: content.languages?.length && renderLanguages(content.languages),
    };
    const visible = SECTIONS.filter((id) => bodies[id]);

    nav.replaceChildren(...visible.map((id) => h('a', { href: `#${id}` }, ui.nav[id])));
    app.replaceChildren(
      renderHero(profile),
      ...visible.map((id) => section(id, ui.sections[id], bodies[id])),
    );
    footer.replaceChildren(
      content.updated ? `${ui.updated}: ${formatYm(content.updated, lang, ui)}` : '',
    );
    app.setAttribute('aria-busy', 'false');
  }

  async function switchLang(code) {
    const content = await I18n.loadContent(code, config);
    langSelect.value = code;
    render(content, code);
    I18n.reflectLangInUrl(code, config);
  }

  async function init() {
    try {
      config = await I18n.loadConfig();
      langSelect.replaceChildren(...config.available.map((l) => h('option', { value: l.code }, l.label)));
      langSelect.hidden = config.available.length < 2;
      langSelect.addEventListener('change', () => {
        I18n.storeLang(langSelect.value);
        switchLang(langSelect.value);
      });
      printBtn.addEventListener('click', () => window.print());
      await switchLang(I18n.detectLang(config));
    } catch (error) {
      console.error(error);
      app.replaceChildren(h('p', { class: 'error' },
        'Could not load the CV content. If you opened index.html from disk, run a local server instead (see README).'));
    }
  }

  init();
})();
