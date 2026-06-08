let _open = false;
let _panel = null;

function _getPanel() {
  if (!_panel) _panel = document.getElementById('credits-panel');
  return _panel;
}

function _usedColor(pct) {
  if (pct >= 90) return 'var(--red, #e05a5a)';
  if (pct >= 65) return 'var(--yellow, #d4a843)';
  return 'var(--green, #4caf82)';
}

function _fmtReset(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = d - now;
  if (diffMs <= 0) return 'скоро';
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  if (h > 0) return `через ${h} ч ${m} мин`;
  return `через ${m} мин`;
}

async function _loadData() {
  const panel = _getPanel();
  const body = panel.querySelector('#credits-panel-body');
  if (!body) return;

  body.innerHTML = `<div class="credits-loading"><div class="credits-spinner"></div></div>`;

  try {
    const res = await fetch('/api/auth/usage', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Ошибка ' + res.status);
    const d = await res.json();
    _render(body, d);
  } catch (e) {
    body.innerHTML = `<div class="credits-error">Не удалось загрузить данные</div>`;
  }
}

function _render(body, d) {
  const { username, is_admin, limit, used, remaining, reset_at } = d;
  const initial = (username || '?')[0].toUpperCase();
  const roleLabel = is_admin ? 'Администратор' : 'Пользователь';

  let statsHTML = '';
  let progressHTML = '';
  let resetHTML = '';

  if (is_admin || limit === null) {
    statsHTML = `
      <div class="credits-unlimited">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>
        Без ограничений
      </div>
      <div class="credits-info-note">Ваш аккаунт имеет неограниченное количество сообщений.</div>
    `;
  } else {
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const col = _usedColor(pct);

    statsHTML = `
      <div class="credits-stat-grid">
        <div class="credits-stat-box">
          <div class="credits-stat-label">Лимит</div>
          <div class="credits-stat-val" style="color:var(--fg2, rgba(232,232,232,0.55))">${limit}</div>
        </div>
        <div class="credits-stat-box">
          <div class="credits-stat-label">Использовано</div>
          <div class="credits-stat-val" style="color:${col}">${used}</div>
        </div>
        <div class="credits-stat-box">
          <div class="credits-stat-label">Осталось</div>
          <div class="credits-stat-val" style="color:${remaining === 0 ? 'var(--red,#e05a5a)' : 'var(--green,#4caf82)'}">${remaining}</div>
        </div>
      </div>
    `;

    progressHTML = `
      <div class="credits-progress-wrap">
        <div class="credits-progress-header">
          <span>Использование за сутки</span>
          <span style="color:${col};font-weight:600">${pct}%</span>
        </div>
        <div class="credits-progress-track">
          <div class="credits-progress-fill" data-pct="${pct}" style="width:0%;background:${col}"></div>
        </div>
        <div class="credits-progress-hint">${used} из ${limit} сообщений за 24 часа</div>
      </div>
    `;

    const resetStr = _fmtReset(reset_at);
    resetHTML = `
      <div class="credits-reset-row">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${resetStr ? `Лимит обновится <strong>${resetStr}</strong>` : `Лимит обновляется каждые <strong>24 часа</strong>`}
      </div>
    `;
  }

  body.innerHTML = `
    <div class="credits-section">
      <div class="credits-section-title">Аккаунт</div>
      <div class="credits-user-row">
        <div class="credits-avatar">${initial}</div>
        <div>
          <div class="credits-username">${username}</div>
          <div class="credits-role">${roleLabel}</div>
        </div>
      </div>
    </div>

    <div class="credits-divider"></div>

    <div class="credits-section">
      <div class="credits-section-title">Сообщения сегодня</div>
      ${statsHTML}
      ${progressHTML}
      ${resetHTML}
    </div>

    <div class="credits-divider"></div>

    <div class="credits-info-note" style="font-size:11px;opacity:0.5;line-height:1.6;">
      Лимит считается скользящим окном 24 ч от первого сообщения дня. Администратор может изменить лимит для вашего аккаунта.
    </div>
  `;

  requestAnimationFrame(() => {
    const fill = body.querySelector('.credits-progress-fill');
    if (fill) {
      const pct = fill.dataset.pct;
      requestAnimationFrame(() => { fill.style.width = pct + '%'; });
    }
  });
}

export function openPanel() {
  const panel = _getPanel();
  if (!panel) return;
  _open = true;
  panel.classList.add('credits-open');
  document.getElementById('tool-credits-btn')?.classList.add('active');
  document.getElementById('rail-credits')?.classList.add('rail-active');
  _loadData();
}

export function closePanel() {
  const panel = _getPanel();
  if (!panel) return;
  _open = false;
  panel.classList.remove('credits-open');
  document.getElementById('tool-credits-btn')?.classList.remove('active');
  document.getElementById('rail-credits')?.classList.remove('rail-active');
}

export function togglePanel() {
  if (_open) closePanel(); else openPanel();
}

export function isPanelOpen() { return _open; }

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('tool-credits-btn');
  if (btn) btn.addEventListener('click', togglePanel);

  const closeBtn = document.getElementById('credits-panel-close');
  if (closeBtn) closeBtn.addEventListener('click', closePanel);

  const panel = _getPanel();
  if (panel) {
    panel.addEventListener('click', (e) => {
      if (e.target === panel) closePanel();
    });
  }
});

window.creditsModule = { openPanel, closePanel, togglePanel, isPanelOpen };
export default { openPanel, closePanel, togglePanel, isPanelOpen };
