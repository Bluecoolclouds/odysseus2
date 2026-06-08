import * as Modals from './modalManager.js';

const MODAL_ID = 'credits-modal';

function _closeCredits() {
  const el = document.getElementById(MODAL_ID);
  if (el) el.remove();
  Modals.unregister(MODAL_ID);
}

function _fmtTokens(n) {
  if (n == null) return '∞';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
  return String(n);
}

function _fmtUsd(n) {
  return '$' + n.toFixed(2);
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

  const { username, is_admin, limit, used, remaining, reset_at, tokens_per_dollar = 500_000, monthly_budget_usd = 2.0 } = data;

  function fmtResetDate(iso) {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return null; }
  }

  function barColor(pct) {
    if (pct >= 90) return 'var(--red)';
    if (pct >= 65) return 'var(--warn, #f0ad4e)';
    return 'var(--green)';
  }

  const initial = (username || '?')[0].toUpperCase();
  const roleLabel = is_admin ? 'Администратор' : 'Пользователь';

  let statsHTML = '';
  let progressHTML = '';
  let resetHTML = '';

  if (is_admin || limit === null) {
    statsHTML = `
      <div style="display:inline-flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--green) 12%,transparent);border:1px solid color-mix(in srgb,var(--green) 28%,transparent);color:var(--green);border-radius:99px;padding:5px 14px;font-size:13px;font-weight:600;margin-bottom:12px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>
        Без ограничений
      </div>
      <div style="font-size:13px;color:var(--fg);opacity:0.5;line-height:1.65;">Ваш аккаунт имеет неограниченный лимит токенов.</div>
    `;
  } else {
    const usedUsd = used / tokens_per_dollar;
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const bColor = barColor(pct);
    const resetDateStr = fmtResetDate(reset_at);

    statsHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;">
        <div style="background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:7px;padding:12px 10px;text-align:center;">
          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--fg);opacity:.38;margin-bottom:6px;">Бюджет</div>
          <div style="font-size:20px;font-weight:700;line-height:1;letter-spacing:-.03em;color:var(--fg);opacity:.55;">${_fmtUsd(monthly_budget_usd)}</div>
          <div style="font-size:10px;color:var(--fg);opacity:.3;margin-top:3px;">${_fmtTokens(limit)} токенов</div>
        </div>
        <div style="background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:7px;padding:12px 10px;text-align:center;">
          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--fg);opacity:.38;margin-bottom:6px;">Потрачено</div>
          <div style="font-size:22px;font-weight:700;line-height:1;letter-spacing:-.03em;color:${bColor};">${_fmtUsd(usedUsd)}</div>
          <div style="font-size:10px;color:var(--fg);opacity:.3;margin-top:3px;">${_fmtTokens(used)} токенов</div>
        </div>
        <div style="background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:7px;padding:12px 10px;text-align:center;">
          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--fg);opacity:.38;margin-bottom:6px;">Осталось</div>
          <div style="font-size:22px;font-weight:700;line-height:1;letter-spacing:-.03em;color:${remaining === 0 ? 'var(--red)' : 'var(--green)'};">${_fmtUsd((remaining ?? 0) / tokens_per_dollar)}</div>
          <div style="font-size:10px;color:var(--fg);opacity:.3;margin-top:3px;">${_fmtTokens(remaining)} токенов</div>
        </div>
      </div>
    `;

    progressHTML = `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px;font-size:12px;color:var(--fg);opacity:.55;">
          <span>Использование за месяц</span>
          <span style="font-weight:700;opacity:1;color:${bColor};">${pct}%</span>
        </div>
        <div style="height:6px;background:color-mix(in srgb,var(--fg) 8%,transparent);border-radius:99px;overflow:hidden;">
          <div id="credits-pbar" style="height:100%;border-radius:99px;background:${bColor};width:0%;transition:width .6s cubic-bezier(.4,0,.2,1);"></div>
        </div>
        <div style="font-size:11px;color:var(--fg);opacity:.35;margin-top:5px;">${_fmtTokens(used)} из ${_fmtTokens(limit)} токенов в этом месяце</div>
      </div>
    `;

    resetHTML = `
      <div style="height:1px;background:var(--border);margin:16px 0;"></div>
      <div style="display:flex;align-items:center;gap:7px;background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:7px;padding:10px 13px;font-size:12px;color:var(--fg);opacity:.6;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${resetDateStr
          ? `Лимит обновится <strong style="color:var(--fg);opacity:1;font-weight:600;">${resetDateStr}</strong>`
          : 'Лимит обновляется каждое 1-е число месяца'}
      </div>
    `;

    setTimeout(() => {
      const bar = document.getElementById('credits-pbar');
      if (bar) bar.style.width = pct + '%';
    }, 80);
  }

  root.innerHTML = `
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:18px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--fg);opacity:.4;margin-bottom:14px;">Аккаунт</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <div style="width:38px;height:38px;border-radius:50%;background:color-mix(in srgb,var(--red) 18%,transparent);border:1px solid color-mix(in srgb,var(--red) 35%,transparent);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:var(--red);flex-shrink:0;text-transform:uppercase;">${initial}</div>
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--fg);line-height:1.3;">${username}</div>
          <div style="font-size:12px;color:var(--fg);opacity:.45;margin-top:1px;">${roleLabel}</div>
        </div>
      </div>
      <div style="height:1px;background:var(--border);margin-bottom:16px;"></div>
      ${statsHTML}
      ${progressHTML}
      ${resetHTML}
    </div>
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--fg);opacity:.4;margin-bottom:12px;">Как работает лимит</div>
      <div style="font-size:13px;color:var(--fg);opacity:.5;line-height:1.65;">
        Каждому пользователю выделяется <strong style="opacity:1;color:var(--fg);">$2 в месяц</strong> —
        это <strong style="opacity:1;color:var(--fg);">1&nbsp;000&nbsp;000 токенов</strong> (500&nbsp;000 токенов = $1).
        Лимит обновляется в начале каждого календарного месяца. Токены расходуются на запросы к языковым моделям:
        чем длиннее контекст и ответ — тем больше токенов.
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
    <style>#credits-modal .credits-spinner{width:24px;height:24px;border:2px solid color-mix(in srgb,var(--fg) 15%,transparent);border-top-color:var(--red);border-radius:50%;animation:credits-spin .75s linear infinite;}@keyframes credits-spin{to{transform:rotate(360deg);}}</style>
    <div class="modal-content" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(480px,95vw);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.45);overflow:hidden;">
      <div id="credits-drag-handle" style="display:flex;align-items:center;padding:14px 16px 13px;border-bottom:1px solid var(--border);gap:8px;flex-shrink:0;cursor:move;user-select:none;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h4 style="margin:0;font-size:13px;font-weight:600;color:var(--fg);margin-right:auto;">Кредиты</h4>
        <button id="credits-minimize-btn" class="modal-minimize-btn" title="Свернуть" aria-label="Свернуть">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button id="credits-close-btn" style="background:var(--bg);color:var(--fg);border:1px solid var(--fg);cursor:pointer;width:24px;height:24px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;transition:background .15s,color .15s;" title="Закрыть" aria-label="Закрыть">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="credits-body" style="padding:16px;overflow-y:auto;flex:1;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 0;color:var(--fg);opacity:.4;font-size:13px;">
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

  modal.addEventListener('pointerdown', (e) => {
    if (e.target === modal) _closeCredits();
  });

  try {
    const dragMod = await import('./windowDrag.js');
    if (dragMod && dragMod.makeWindowDraggable) {
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
