import * as Modals from './modalManager.js';

const MODAL_ID = 'credits-modal';

function _closeCredits() {
  const el = document.getElementById(MODAL_ID);
  if (el) el.remove();
  Modals.unregister(MODAL_ID);
}

function _fmtNum(n) {
  if (n == null) return '∞';
  return n.toLocaleString('ru-RU');
}

function _fmtShort(n) {
  if (n == null) return '∞';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K';
  return String(n);
}

async function _loadContent(root) {
  let data;
  try {
    const res = await fetch('/api/auth/usage', { credentials: 'same-origin' });
    if (res.status === 401) { _closeCredits(); return; }
    if (!res.ok) throw new Error('Ошибка сервера ' + res.status);
    data = await res.json();
  } catch (e) {
    root.innerHTML = `<div style="text-align:center;padding:40px 0;color:var(--red);font-size:13px;line-height:1.6;">
      Не удалось загрузить данные.<br><small style="opacity:0.6">${e.message}</small>
    </div>`;
    return;
  }

  const { username, is_admin, limit, used, remaining, reset_at } = data;

  const initial = (username || '?')[0].toUpperCase();
  const roleLabel = is_admin ? 'Администратор' : 'Пользователь';

  function fmtResetDate(iso) {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch { return null; }
  }

  const resetDate = fmtResetDate(reset_at);

  const card = (label, value, sub) => `
    <div style="background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:8px;padding:14px 12px;text-align:center;">
      <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--fg);opacity:.35;margin-bottom:8px;">${label}</div>
      <div style="font-size:22px;font-weight:700;letter-spacing:-.04em;color:var(--fg);line-height:1;">${value}</div>
      ${sub ? `<div style="font-size:10px;color:var(--fg);opacity:.3;margin-top:4px;">${sub}</div>` : ''}
    </div>
  `;

  let body = '';

  if (is_admin || limit === null) {
    body = `
      <div style="display:flex;align-items:center;gap:10px;background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:12px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.45;flex-shrink:0;"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>
        <span style="font-size:13px;color:var(--fg);opacity:.6;">Неограниченный лимит токенов</span>
      </div>
    `;
  } else {
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

    const barFill = pct >= 90
      ? 'var(--red)'
      : 'color-mix(in srgb,var(--fg) 40%,transparent)';

    body = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        ${card('Подписочные кредиты', _fmtShort(limit), 'лимит в месяц')}
        ${card('Использовано', _fmtShort(used), `${_fmtNum(used)} токенов`)}
        ${card('Доступно', _fmtShort(remaining ?? 0), `${_fmtNum(remaining ?? 0)} токенов`)}
      </div>
      <div style="margin-bottom:${resetDate ? 12 : 0}px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;color:var(--fg);opacity:.4;">Использование за месяц</span>
          <span style="font-size:11px;font-weight:600;color:var(--fg);opacity:.5;">${Math.round(pct)}%</span>
        </div>
        <div style="height:5px;background:color-mix(in srgb,var(--fg) 8%,transparent);border-radius:99px;overflow:hidden;">
          <div id="credits-pbar" style="height:100%;border-radius:99px;background:${barFill};width:0%;transition:width .55s cubic-bezier(.4,0,.2,1);"></div>
        </div>
      </div>
      ${resetDate ? `
      <div style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--fg);opacity:.4;margin-top:2px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Сброс ${resetDate}
      </div>` : ''}
    `;
    setTimeout(() => {
      const bar = document.getElementById('credits-pbar');
      if (bar) bar.style.width = pct + '%';
    }, 80);
  }

  root.innerHTML = `
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--red) 14%,transparent);border:1px solid color-mix(in srgb,var(--red) 28%,transparent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--red);flex-shrink:0;text-transform:uppercase;">${initial}</div>
        <div>
          <div style="font-size:13.5px;font-weight:600;color:var(--fg);line-height:1.3;">${username}</div>
          <div style="font-size:11.5px;color:var(--fg);opacity:.38;margin-top:1px;">${roleLabel}</div>
        </div>
      </div>
      <div style="height:1px;background:var(--border);margin-bottom:16px;"></div>
      ${body}
    </div>
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:14px 16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--fg);opacity:.35;margin-bottom:10px;">Как работает</div>
      <div style="font-size:12.5px;color:var(--fg);opacity:.45;line-height:1.7;">
        Каждый месяц вам выделяется
        <strong style="opacity:.85;color:var(--fg);">1 000 000 кредитов</strong>.
        1 кредит = 1 токен.
        Лимит обновляется 1-го числа каждого месяца.
      </div>
    </div>
  `;
}

export async function openCredits() {
  if (Modals.toggle(MODAL_ID)) return;

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.className = 'modal';
  modal.style.cssText = 'display:flex;position:fixed;inset:0;z-index:260;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);';
  modal.innerHTML = `
    <style>
      #credits-modal .credits-spinner {
        width: 22px; height: 22px;
        border: 2px solid color-mix(in srgb,var(--fg) 12%,transparent);
        border-top-color: var(--red);
        border-radius: 50%;
        animation: credits-spin .7s linear infinite;
      }
      @keyframes credits-spin { to { transform: rotate(360deg); } }
    </style>
    <div class="modal-content" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(460px,95vw);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.5);overflow:hidden;">
      <div id="credits-drag-handle" style="display:flex;align-items:center;padding:13px 15px 12px;border-bottom:1px solid var(--border);gap:8px;flex-shrink:0;cursor:move;user-select:none;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style="margin:0;font-size:13px;font-weight:600;color:var(--fg);margin-right:auto;opacity:.8;">Кредиты</span>
        <button id="credits-minimize-btn" class="modal-minimize-btn" title="Свернуть" aria-label="Свернуть">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><line x1="6" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button id="credits-close-btn" style="background:transparent;color:var(--fg);border:1px solid color-mix(in srgb,var(--fg) 30%,transparent);cursor:pointer;width:24px;height:24px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;opacity:.6;transition:opacity .15s;" title="Закрыть">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="credits-body" style="padding:14px;overflow-y:auto;flex:1;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 0;color:var(--fg);opacity:.35;font-size:13px;">
          <div class="credits-spinner"></div>
          Загрузка…
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  Modals.register(MODAL_ID, {
    sidebarBtnId: 'tool-credits-btn',
    closeFn: () => _closeCredits(),
    restoreFn: () => {},
  });

  modal.querySelector('#credits-close-btn').addEventListener('click', _closeCredits);
  modal.querySelector('#credits-minimize-btn').addEventListener('click', () => Modals.minimize(MODAL_ID));
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal) _closeCredits(); });

  try {
    const dragMod = await import('./windowDrag.js');
    if (dragMod?.makeWindowDraggable) {
      dragMod.makeWindowDraggable(modal.querySelector('.modal-content'));
    }
  } catch (_) {}

  _loadContent(modal.querySelector('#credits-body'));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tool-credits-btn')?.addEventListener('click', openCredits);
  document.getElementById('user-bar-credits-btn')?.addEventListener('click', openCredits);
});

window.creditsModule = { open: openCredits };
export default { open: openCredits };
