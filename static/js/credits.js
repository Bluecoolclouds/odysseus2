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

// ── Plans panel ────────────────────────────────────────────────────── //

const PLANS = [
  {
    id: 'free',
    name: 'Старт',
    desc: 'Для личного использования',
    tokens_month: 1_000_000,
    price_month: 0,
    price_year: 0,
    current: true,
    features: ['1M токенов в месяц', 'Все базовые функции', 'История чатов', 'RAG / память'],
  },
  {
    id: 'basic',
    name: 'Базовый',
    desc: 'Для активных пользователей',
    tokens_month: 10_000_000,
    price_month: 20,
    price_year: 16,
    features: ['10M токенов в месяц', 'Приоритетная обработка', 'Расширенная память', 'Агентный режим'],
  },
  {
    id: 'pro',
    name: 'Про',
    desc: 'Для профессионалов',
    tokens_month: 50_000_000,
    popular: true,
    price_month: 80,
    price_year: 64,
    features: ['50M токенов в месяц', 'Все функции Базового', 'Без ограничений на RAG', 'API-доступ'],
  },
  {
    id: 'max',
    name: 'Максимум',
    desc: 'Без ограничений',
    tokens_month: null,
    price_month: 200,
    price_year: 160,
    features: ['Безлимитные токены', 'Выделенные ресурсы', 'SLA 99.9%', 'Поддержка 24/7'],
  },
];

function _showPlans(root, onBack) {
  let yearly = false;

  function render() {
    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <button id="plans-back" style="background:transparent;border:1px solid color-mix(in srgb,var(--fg) 20%,transparent);border-radius:6px;color:var(--fg);opacity:.55;cursor:pointer;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s;" title="Назад">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style="font-size:13.5px;font-weight:600;color:var(--fg);opacity:.8;flex:1;">Планы подписки</span>
        <div style="display:flex;background:color-mix(in srgb,var(--fg) 7%,transparent);border:1px solid var(--border);border-radius:7px;padding:3px;gap:2px;">
          <button id="seg-month" style="padding:5px 14px;border-radius:5px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:background .2s,color .2s;background:${!yearly ? 'var(--panel)' : 'transparent'};color:var(--fg);opacity:${!yearly ? '1' : '.45'};">Месяц</button>
          <button id="seg-year" style="padding:5px 14px;border-radius:5px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:background .2s,color .2s;display:flex;align-items:center;gap:5px;background:${yearly ? 'var(--panel)' : 'transparent'};color:var(--fg);opacity:${yearly ? '1' : '.45'};">
            Год <span style="font-size:10px;font-weight:700;padding:1px 5px;border-radius:99px;background:color-mix(in srgb,var(--red) 18%,transparent);color:var(--red);">−20%</span>
          </button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${PLANS.map(p => {
          const price = yearly ? p.price_year : p.price_month;
          const priceStr = price === 0 ? 'Бесплатно' : `$${price}<span style="font-size:11px;font-weight:400;opacity:.5;">/${yearly ? 'мес' : 'мес'}</span>`;
          const tokStr = p.tokens_month == null ? '∞' : _fmtShort(p.tokens_month);
          const isPopular = p.popular;
          const isCurrent = p.current;
          return `
            <div style="position:relative;background:color-mix(in srgb,var(--fg) ${isPopular ? '5' : '3'}%,transparent);border:1px solid ${isPopular ? 'color-mix(in srgb,var(--red) 45%,transparent)' : 'var(--border)'};border-radius:9px;padding:14px 13px;display:flex;flex-direction:column;gap:10px;">
              ${isPopular ? `<div style="position:absolute;top:-1px;right:12px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;background:var(--red);color:#fff;padding:3px 8px;border-radius:0 0 6px 6px;">Популярный</div>` : ''}
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--fg);margin-bottom:2px;">${p.name}</div>
                <div style="font-size:11px;color:var(--fg);opacity:.38;">${p.desc}</div>
              </div>
              <div style="font-size:24px;font-weight:700;letter-spacing:-.04em;color:var(--fg);line-height:1;">${priceStr}</div>
              <div style="font-size:11px;color:var(--fg);opacity:.4;">
                ${tokStr} токенов / мес
              </div>
              <div style="height:1px;background:var(--border);"></div>
              <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;">
                ${p.features.map(f => `
                  <li style="display:flex;align-items:flex-start;gap:6px;font-size:11.5px;color:var(--fg);opacity:.5;line-height:1.4;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;margin-top:2px;opacity:.7;"><polyline points="20 6 9 17 4 12"/></svg>
                    ${f}
                  </li>`).join('')}
              </ul>
              <button data-plan="${p.id}" style="margin-top:auto;width:100%;padding:8px 0;border-radius:6px;font-size:12px;font-weight:600;cursor:${isCurrent ? 'default' : 'pointer'};transition:opacity .15s;border:1px solid ${isCurrent ? 'color-mix(in srgb,var(--fg) 18%,transparent)' : isPopular ? 'color-mix(in srgb,var(--red) 40%,transparent)' : 'color-mix(in srgb,var(--fg) 22%,transparent)'};background:${isCurrent ? 'transparent' : isPopular ? 'color-mix(in srgb,var(--red) 16%,transparent)' : 'color-mix(in srgb,var(--fg) 6%,transparent)'};color:${isCurrent ? 'var(--fg)' : isPopular ? 'var(--red)' : 'var(--fg)'};opacity:${isCurrent ? '.35' : '1'};" ${isCurrent ? 'disabled' : ''}>
                ${isCurrent ? 'Текущий план' : 'Подключить'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
      <div id="plans-action-msg" style="display:none;margin-top:10px;font-size:12px;color:var(--fg);opacity:.45;text-align:center;line-height:1.6;padding:10px;background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:7px;"></div>
    `;

    root.querySelector('#plans-back').addEventListener('click', onBack);

    root.querySelector('#seg-month').addEventListener('click', () => { yearly = false; render(); });
    root.querySelector('#seg-year').addEventListener('click', () => { yearly = true; render(); });

    root.querySelectorAll('[data-plan]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        const planId = btn.dataset.plan;
        const plan = PLANS.find(p => p.id === planId);
        const msg = root.querySelector('#plans-action-msg');
        msg.style.display = 'block';
        msg.textContent = `Для подключения тарифа «${plan.name}» обратитесь к администратору.`;
      });
    });
  }

  render();
}

// ── Main credits view ──────────────────────────────────────────────── //

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
    try { return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); }
    catch { return null; }
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
      <div style="display:flex;align-items:center;gap:10px;background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--border);border-radius:8px;padding:14px 16px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.45;flex-shrink:0;"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>
        <span style="font-size:13px;color:var(--fg);opacity:.6;">Неограниченный лимит токенов</span>
      </div>
    `;
  } else {
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const barFill = pct >= 90 ? 'var(--red)' : 'color-mix(in srgb,var(--fg) 40%,transparent)';
    body = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        ${card('Подписочные кредиты', _fmtShort(limit), 'лимит в месяц')}
        ${card('Использовано', _fmtShort(used), _fmtNum(used) + ' токенов')}
        ${card('Доступно', _fmtShort(remaining ?? 0), _fmtNum(remaining ?? 0) + ' токенов')}
      </div>
      <div style="margin-bottom:${resetDate ? 10 : 0}px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;color:var(--fg);opacity:.4;">Использование за месяц</span>
          <span style="font-size:11px;font-weight:600;color:var(--fg);opacity:.5;">${Math.round(pct)}%</span>
        </div>
        <div style="height:5px;background:color-mix(in srgb,var(--fg) 8%,transparent);border-radius:99px;overflow:hidden;">
          <div id="credits-pbar" style="height:100%;border-radius:99px;background:${barFill};width:0%;transition:width .55s cubic-bezier(.4,0,.2,1);"></div>
        </div>
      </div>
      ${resetDate ? `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--fg);opacity:.35;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Сброс ${resetDate}
      </div>` : ''}
    `;
    setTimeout(() => {
      const bar = document.getElementById('credits-pbar');
      if (bar) bar.style.width = pct + '%';
    }, 80);
  }

  const packages = [
    { label: '10M', tokens: 10_000_000 },
    { label: '20M', tokens: 20_000_000 },
    { label: '30M', tokens: 30_000_000 },
    { label: '50M', tokens: 50_000_000 },
    { label: '100M', tokens: 100_000_000 },
  ];

  root.innerHTML = `
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--red) 14%,transparent);border:1px solid color-mix(in srgb,var(--red) 28%,transparent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--red);flex-shrink:0;text-transform:uppercase;">${initial}</div>
        <div style="flex:1;">
          <div style="font-size:13.5px;font-weight:600;color:var(--fg);line-height:1.3;">${username}</div>
          <div style="font-size:11.5px;color:var(--fg);opacity:.38;margin-top:1px;">${roleLabel}</div>
        </div>
        <button id="credits-plans-btn" style="display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:6px;border:1px solid color-mix(in srgb,var(--fg) 20%,transparent);background:transparent;color:var(--fg);font-size:11.5px;font-weight:600;cursor:pointer;opacity:.6;transition:opacity .15s;white-space:nowrap;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Планы
        </button>
      </div>
      <div style="height:1px;background:var(--border);margin-bottom:16px;"></div>
      ${body}
    </div>
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--fg);opacity:.35;margin-bottom:12px;">Выберите пакет</div>
      <div id="credits-pkgs" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px;">
        ${packages.map((p, i) => `
          <button data-pkg="${i}" style="min-width:62px;padding:6px 13px;border-radius:6px;border:1px solid var(--border);background:color-mix(in srgb,var(--fg) 4%,transparent);color:var(--fg);font-size:13px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s;opacity:.7;">${p.label}</button>`).join('')}
      </div>
      <div id="credits-pkg-detail" style="font-size:11.5px;color:var(--fg);opacity:.38;min-height:16px;margin-bottom:11px;"></div>
      <button id="credits-buy-btn" disabled style="width:100%;padding:8px 0;border-radius:7px;border:1px solid transparent;background:color-mix(in srgb,var(--fg) 8%,transparent);color:var(--fg);font-size:13px;font-weight:600;cursor:not-allowed;opacity:.3;transition:all .15s;">Пополнить</button>
      <div id="credits-buy-msg" style="display:none;margin-top:9px;font-size:12px;color:var(--fg);opacity:.45;text-align:center;line-height:1.6;"></div>
    </div>
    <div style="background:color-mix(in srgb,var(--fg) 3%,transparent);border:1px solid var(--border);border-radius:8px;padding:14px 16px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--fg);opacity:.35;margin-bottom:10px;">Как работает</div>
      <div style="font-size:12.5px;color:var(--fg);opacity:.45;line-height:1.7;">
        Каждый месяц вам выделяется <strong style="opacity:.85;color:var(--fg);">1 000 000 кредитов</strong>.
        1 кредит = 1 токен. Лимит обновляется 1-го числа каждого месяца.
      </div>
    </div>
  `;

  root.querySelector('#credits-plans-btn').addEventListener('click', () => {
    _showPlans(root, () => _loadContent(root));
  });

  let selectedPkg = null;
  root.querySelectorAll('[data-pkg]').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-pkg]').forEach(b => {
        b.style.borderColor = 'var(--border)';
        b.style.background = 'color-mix(in srgb,var(--fg) 4%,transparent)';
        b.style.color = 'var(--fg)'; b.style.opacity = '.7';
        delete b.dataset.sel;
      });
      btn.style.borderColor = 'var(--red)';
      btn.style.background = 'color-mix(in srgb,var(--red) 12%,transparent)';
      btn.style.color = 'var(--red)'; btn.style.opacity = '1';
      btn.dataset.sel = '1';
      const i = parseInt(btn.dataset.pkg);
      selectedPkg = packages[i];
      root.querySelector('#credits-pkg-detail').textContent = _fmtNum(selectedPkg.tokens) + ' кредитов';
      const bb = root.querySelector('#credits-buy-btn');
      bb.disabled = false;
      bb.style.cssText += ';background:color-mix(in srgb,var(--red) 16%,transparent);border-color:color-mix(in srgb,var(--red) 35%,transparent);color:var(--red);cursor:pointer;opacity:1;';
      root.querySelector('#credits-buy-msg').style.display = 'none';
    });
  });

  root.querySelector('#credits-buy-btn').addEventListener('click', () => {
    if (!selectedPkg) return;
    const msg = root.querySelector('#credits-buy-msg');
    msg.style.display = 'block';
    msg.textContent = `Для пополнения на ${selectedPkg.label} кредитов обратитесь к администратору.`;
  });
}

// ── Modal shell ────────────────────────────────────────────────────── //

export async function openCredits() {
  if (Modals.toggle(MODAL_ID)) return;

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.className = 'modal';
  modal.style.cssText = 'display:flex;position:fixed;inset:0;z-index:260;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);';
  modal.innerHTML = `
    <style>
      #credits-modal .credits-spinner{width:22px;height:22px;border:2px solid color-mix(in srgb,var(--fg) 12%,transparent);border-top-color:var(--red);border-radius:50%;animation:credits-spin .7s linear infinite;}
      @keyframes credits-spin{to{transform:rotate(360deg);}}
    </style>
    <div class="modal-content" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(480px,95vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.5);overflow:hidden;">
      <div id="credits-drag-handle" style="display:flex;align-items:center;padding:13px 15px 12px;border-bottom:1px solid var(--border);gap:8px;flex-shrink:0;cursor:move;user-select:none;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span style="font-size:13px;font-weight:600;color:var(--fg);margin-right:auto;opacity:.8;">Кредиты</span>
        <button id="credits-minimize-btn" class="modal-minimize-btn" title="Свернуть" aria-label="Свернуть">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><line x1="6" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button id="credits-close-btn" style="background:transparent;color:var(--fg);border:1px solid color-mix(in srgb,var(--fg) 30%,transparent);cursor:pointer;width:24px;height:24px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0;opacity:.6;transition:opacity .15s;" title="Закрыть">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="credits-body" style="padding:14px;overflow-y:auto;flex:1;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 0;color:var(--fg);opacity:.35;font-size:13px;">
          <div class="credits-spinner"></div>Загрузка…
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
    const d = await import('./windowDrag.js');
    if (d?.makeWindowDraggable) d.makeWindowDraggable(modal.querySelector('.modal-content'));
  } catch (_) {}

  _loadContent(modal.querySelector('#credits-body'));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tool-credits-btn')?.addEventListener('click', openCredits);
  document.getElementById('user-bar-credits-btn')?.addEventListener('click', openCredits);
});

window.creditsModule = { open: openCredits };
export default { open: openCredits };
