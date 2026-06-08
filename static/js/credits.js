import * as Modals from './modalManager.js';

const MODAL_ID  = 'credits-modal';
const PLANS_ID  = 'plans-modal';

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

// ── Shared modal shell ─────────────────────────────────────────────── //

function _createShell({ id, title, width = 480, sidebarBtnId }) {
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal';
  modal.style.cssText = 'display:flex;position:fixed;inset:0;z-index:260;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);';
  modal.innerHTML = `
    <div class="modal-content" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(${width}px,95vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,.55);overflow:hidden;">
      <div id="${id}-drag" style="display:flex;align-items:center;padding:12px 14px 11px;border-bottom:1px solid var(--border);gap:8px;flex-shrink:0;cursor:move;user-select:none;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style="font-size:13px;font-weight:600;color:var(--fg);opacity:.75;margin-right:auto;">${title}</span>
        <button id="${id}-min" class="modal-minimize-btn" title="Свернуть" aria-label="Свернуть">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><line x1="6" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button id="${id}-close" style="background:transparent;color:var(--fg);border:1px solid color-mix(in srgb,var(--fg) 28%,transparent);cursor:pointer;width:24px;height:24px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;opacity:.55;transition:opacity .15s;" title="Закрыть">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="${id}-body" class="cm-wrap" style="flex:1;">
        <div class="cm-spinner-wrap"><div class="cm-spinner"></div>Загрузка…</div>
      </div>
    </div>
  `;
  return modal;
}

// ── Plans panel (reusable — used by both credits modal and plans modal) //

const PLANS = [
  { id:'free',  name:'Старт',    desc:'Для личного использования', tokens_month:1_000_000,  pm:0,   py:0,   current:true,
    feats:['1M токенов в месяц','Все базовые функции','История чатов','RAG / память'] },
  { id:'basic', name:'Базовый',  desc:'Для активных пользователей', tokens_month:10_000_000, pm:20,  py:16,
    feats:['10M токенов в месяц','Приоритетная обработка','Расширенная память','Агентный режим'] },
  { id:'pro',   name:'Про',      desc:'Для профессионалов',         tokens_month:50_000_000, pm:80,  py:64,  popular:true,
    feats:['50M токенов в месяц','Все функции Базового','Без ограничений RAG','API-доступ'] },
  { id:'max',   name:'Максимум', desc:'Без ограничений',            tokens_month:null,       pm:200, py:160,
    feats:['Безлимитные токены','Выделенные ресурсы','SLA 99.9%','Поддержка 24/7'] },
];

const CHECK_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;

function _renderPlans(root, { onBack } = {}) {
  let yearly = false;

  function render() {
    root.innerHTML = `
      <div class="cm-plans-hdr">
        ${onBack ? `<button class="cm-back" id="plans-back" title="Назад">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>` : ''}
        <span class="cm-plans-ttl">Планы подписки</span>
        <div class="cm-seg">
          <button class="cm-seg-btn ${!yearly ? 'active' : ''}" id="seg-m">Месяц</button>
          <button class="cm-seg-btn ${yearly ? 'active' : ''}" id="seg-y">
            Год <span class="cm-seg-badge">−20%</span>
          </button>
        </div>
      </div>
      <div class="cm-plans-grid">
        ${PLANS.map(p => {
          const price = yearly ? p.py : p.pm;
          const priceHtml = price === 0
            ? `<div class="cm-plan-price">Бесплатно</div>`
            : `<div class="cm-plan-price">$${price}<span> / мес</span></div>`;
          return `
            <div class="cm-plan ${p.popular ? 'popular' : ''}">
              ${p.popular ? `<div class="cm-plan-badge">Популярный</div>` : ''}
              <div>
                <div class="cm-plan-name">${p.name}</div>
                <div class="cm-plan-desc">${p.desc}</div>
              </div>
              ${priceHtml}
              <div class="cm-plan-tokens">${_fmtShort(p.tokens_month)} токенов / мес</div>
              <div class="cm-plan-hr"></div>
              <ul class="cm-plan-feats">
                ${p.feats.map(f => `<li>${CHECK_SVG}${f}</li>`).join('')}
              </ul>
              <button class="cm-plan-cta ${p.popular ? 'popular' : ''}" data-plan="${p.id}" ${p.current ? 'disabled' : ''}>
                ${p.current ? 'Текущий план' : 'Подключить'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="cm-plans-msg" id="plans-msg"></div>
    `;

    if (onBack) root.querySelector('#plans-back')?.addEventListener('click', onBack);
    root.querySelector('#seg-m').addEventListener('click', () => { yearly = false; render(); });
    root.querySelector('#seg-y').addEventListener('click', () => { yearly = true; render(); });

    root.querySelectorAll('[data-plan]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        const p = PLANS.find(x => x.id === btn.dataset.plan);
        const msg = root.querySelector('#plans-msg');
        msg.style.display = 'block';
        msg.textContent = `Для подключения тарифа «${p.name}» обратитесь к администратору.`;
      });
    });
  }

  render();
}

// ── Credits content ────────────────────────────────────────────────── //

async function _loadCredits(root, { onPlans }) {
  root.innerHTML = '<div class="cm-spinner-wrap"><div class="cm-spinner"></div>Загрузка…</div>';

  let data;
  try {
    const res = await fetch('/api/auth/usage', { credentials: 'same-origin' });
    if (res.status === 401) { _closeCredits(); return; }
    if (!res.ok) throw new Error('Ошибка сервера ' + res.status);
    data = await res.json();
  } catch (e) {
    root.innerHTML = `<div style="text-align:center;padding:36px 0;color:var(--red);font-size:13px;line-height:1.6;">Не удалось загрузить данные.<br><small style="opacity:.5">${e.message}</small></div>`;
    return;
  }

  const { username, is_admin, limit, used, remaining, reset_at } = data;
  const initial = (username || '?')[0].toUpperCase();
  const roleLabel = is_admin ? 'Администратор' : 'Пользователь';

  let resetDate = null;
  try { resetDate = reset_at ? new Date(reset_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long' }) : null; } catch {}

  let usageBlock = '';
  if (is_admin || limit === null) {
    usageBlock = `<div class="cm-unlimited">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="opacity:.5;flex-shrink:0;"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>
      Неограниченный лимит токенов
    </div>`;
  } else {
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const barColor = pct >= 90 ? 'var(--red)' : 'color-mix(in srgb,var(--fg) 42%,transparent)';
    usageBlock = `
      <div class="cm-stats">
        <div class="cm-stat"><div class="cm-stat-lbl">Подписочные</div><div class="cm-stat-val">${_fmtShort(limit)}</div><div class="cm-stat-sub">лимит в месяц</div></div>
        <div class="cm-stat"><div class="cm-stat-lbl">Использовано</div><div class="cm-stat-val">${_fmtShort(used)}</div><div class="cm-stat-sub">${_fmtNum(used)} токенов</div></div>
        <div class="cm-stat"><div class="cm-stat-lbl">Доступно</div><div class="cm-stat-val">${_fmtShort(remaining ?? 0)}</div><div class="cm-stat-sub">${_fmtNum(remaining ?? 0)} токенов</div></div>
      </div>
      <div>
        <div class="cm-bar-hdr">
          <span class="cm-bar-lbl">Использование за месяц</span>
          <span class="cm-bar-pct">${Math.round(pct)}%</span>
        </div>
        <div class="cm-bar-track"><div id="cm-bar" class="cm-bar-fill" style="width:0%;background:${barColor};"></div></div>
        ${resetDate ? `<div class="cm-reset-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Сброс ${resetDate}</div>` : ''}
      </div>
    `;
    setTimeout(() => { const b = document.getElementById('cm-bar'); if (b) b.style.width = pct + '%'; }, 80);
  }

  const packages = [
    { label:'10M',  tokens:10_000_000 },
    { label:'20M',  tokens:20_000_000 },
    { label:'30M',  tokens:30_000_000 },
    { label:'50M',  tokens:50_000_000 },
    { label:'100M', tokens:100_000_000 },
  ];

  root.innerHTML = `
    <div class="cm-card">
      <div class="cm-user-row">
        <div class="cm-avatar">${initial}</div>
        <div class="cm-user-info">
          <div class="cm-user-name">${username}</div>
          <div class="cm-user-role">${roleLabel}</div>
        </div>
        <button class="cm-chip" id="cm-plans-btn">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Планы
        </button>
      </div>
      <div class="cm-divider"></div>
      ${usageBlock}
    </div>
    <div class="cm-card">
      <div class="cm-sec-label">Выберите пакет</div>
      <div class="cm-pkg-row" id="cm-pkgs">
        ${packages.map((p, i) => `<button class="cm-pkg-btn" data-pkg="${i}">${p.label}</button>`).join('')}
      </div>
      <div class="cm-pkg-detail" id="cm-pkg-detail"></div>
      <button class="cm-action-btn" id="cm-buy" disabled>Пополнить</button>
      <div class="cm-action-msg" id="cm-buy-msg"></div>
    </div>
    <div class="cm-card">
      <div class="cm-sec-label">Как работает</div>
      <p class="cm-info">Каждый месяц вам выделяется <strong>1 000 000 кредитов</strong>. 1 кредит = 1 токен. Лимит обновляется 1-го числа каждого месяца.</p>
    </div>
  `;

  root.querySelector('#cm-plans-btn').addEventListener('click', () => onPlans());

  let selPkg = null;
  root.querySelectorAll('.cm-pkg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.cm-pkg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const i = parseInt(btn.dataset.pkg);
      selPkg = packages[i];
      root.querySelector('#cm-pkg-detail').textContent = _fmtNum(selPkg.tokens) + ' кредитов';
      const bb = root.querySelector('#cm-buy');
      bb.disabled = false;
      bb.classList.add('active');
      root.querySelector('#cm-buy-msg').style.display = 'none';
    });
  });

  root.querySelector('#cm-buy').addEventListener('click', () => {
    if (!selPkg) return;
    const msg = root.querySelector('#cm-buy-msg');
    msg.style.display = 'block';
    msg.textContent = `Для пополнения на ${selPkg.label} кредитов обратитесь к администратору.`;
  });
}

// ── Credits modal ──────────────────────────────────────────────────── //

function _closeCredits() {
  document.getElementById(MODAL_ID)?.remove();
  Modals.unregister(MODAL_ID);
}

export async function openCredits() {
  if (Modals.toggle(MODAL_ID)) return;

  const modal = _createShell({ id: MODAL_ID, title: 'Кредиты', width: 480, sidebarBtnId: 'tool-credits-btn' });
  document.body.appendChild(modal);

  Modals.register(MODAL_ID, { sidebarBtnId: 'tool-credits-btn', closeFn: _closeCredits, restoreFn: () => {} });
  modal.querySelector(`#${MODAL_ID}-close`).addEventListener('click', _closeCredits);
  modal.querySelector(`#${MODAL_ID}-min`).addEventListener('click', () => Modals.minimize(MODAL_ID));
  modal.addEventListener('pointerdown', e => { if (e.target === modal) _closeCredits(); });

  try { const d = await import('./windowDrag.js'); d?.makeWindowDraggable?.(modal.querySelector('.modal-content')); } catch {}

  const body = modal.querySelector(`#${MODAL_ID}-body`);
  const goPlans = () => _renderPlans(body, { onBack: () => _loadCredits(body, { onPlans: goPlans }) });
  _loadCredits(body, { onPlans: goPlans });
}

// ── Plans modal (opened directly from sidebar) ─────────────────────── //

function _closePlans() {
  document.getElementById(PLANS_ID)?.remove();
  Modals.unregister(PLANS_ID);
}

export async function openPlans() {
  if (Modals.toggle(PLANS_ID)) return;

  const modal = _createShell({ id: PLANS_ID, title: 'Планы подписки', width: 520, sidebarBtnId: 'tool-plans-btn' });
  document.body.appendChild(modal);

  Modals.register(PLANS_ID, { sidebarBtnId: 'tool-plans-btn', closeFn: _closePlans, restoreFn: () => {} });
  modal.querySelector(`#${PLANS_ID}-close`).addEventListener('click', _closePlans);
  modal.querySelector(`#${PLANS_ID}-min`).addEventListener('click', () => Modals.minimize(PLANS_ID));
  modal.addEventListener('pointerdown', e => { if (e.target === modal) _closePlans(); });

  try { const d = await import('./windowDrag.js'); d?.makeWindowDraggable?.(modal.querySelector('.modal-content')); } catch {}

  _renderPlans(modal.querySelector(`#${PLANS_ID}-body`));
}

// ── Wire up ────────────────────────────────────────────────────────── //

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tool-credits-btn')?.addEventListener('click', openCredits);
  document.getElementById('user-bar-credits-btn')?.addEventListener('click', openCredits);
  document.getElementById('tool-plans-btn')?.addEventListener('click', openPlans);
});

window.creditsModule = { open: openCredits, openPlans };
export default { open: openCredits, openPlans };
