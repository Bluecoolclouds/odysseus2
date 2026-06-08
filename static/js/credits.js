import * as Modals from './modalManager.js';

const MODAL_ID = 'credits-modal';
const PLANS_ID = 'plans-modal';

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

function _createShell({ id, title, width = 480 }) {
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal';
  modal.style.cssText = 'display:flex;position:fixed;inset:0;z-index:260;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);';
  modal.innerHTML = `
    <div class="modal-content" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(${width}px,95vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,.55);overflow:hidden;">
      <div id="${id}-drag" style="display:flex;align-items:center;padding:12px 14px 11px;border-bottom:1px solid var(--border);gap:8px;flex-shrink:0;cursor:move;user-select:none;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span id="${id}-title" style="font-size:13px;font-weight:600;color:var(--fg);opacity:.75;margin-right:auto;">${title}</span>
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

// ── Plans ──────────────────────────────────────────────────────────── //

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

// ── Payment / Checkout panel ────────────────────────────────────────── //

function _renderPayment(root, plan, yearly, { onBack }) {
  const price = yearly ? plan.py : plan.pm;
  const origPrice = plan.pm;
  const period = yearly ? 'год' : 'месяц';
  const saving = yearly ? origPrice * 12 - price * 12 : 0;

  let activeMethod = 'card';
  let promoOpen = false;
  let promoApplied = false;

  function _formatCard(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function _formatExpiry(val) {
    let v = val.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    return v;
  }
  function _cardBrand(num) {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'VISA';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'MC';
    if (/^2200/.test(n) || /^2201/.test(n)) return 'МИР';
    return '';
  }

  function render() {
    const total = promoApplied ? Math.round(price * 0.9) : price;

    root.innerHTML = `
      <div class="cm-plans-hdr" style="margin-bottom:14px;">
        <button class="cm-back" id="pay-back" title="Назад">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="cm-plans-ttl">Оформление подписки</span>
      </div>

      <div class="cp-order">
        <div class="cp-order-row">
          <div>
            <div class="cp-order-name">${plan.name} ${plan.popular ? '<span class="cp-order-badge">Популярный</span>' : ''}</div>
            <div class="cp-order-tokens">${_fmtShort(plan.tokens_month)} токенов / мес</div>
          </div>
          <div>
            <div class="cp-order-price">$${price}</div>
            <div class="cp-order-period">за ${period}</div>
          </div>
        </div>
        <div class="cp-order-divider"></div>
        <div class="cp-order-line"><span>Тариф «${plan.name}»</span><span>$${origPrice} / мес</span></div>
        ${yearly ? `<div class="cp-order-line"><span>Годовая скидка (−20%)</span><span class="cp-order-discount">−$${Math.round(saving / 12)} / мес</span></div>` : ''}
        ${promoApplied ? `<div class="cp-order-line"><span>Промокод ODYSSEUS10</span><span class="cp-order-discount">−$${Math.round(price * 0.1)}</span></div>` : ''}
        <div class="cp-order-line total"><span>Итого сейчас</span><span>$${total}</span></div>
      </div>

      <div class="cm-card" style="margin-bottom:10px;">
        <div class="cm-sec-label">Способ оплаты</div>
        <div class="cp-methods">
          <button class="cp-method ${activeMethod === 'card' ? 'active' : ''}" data-method="card">
            <span class="cp-method-icon">💳</span>Карта
          </button>
          <button class="cp-method ${activeMethod === 'sbp' ? 'active' : ''}" data-method="sbp">
            <span class="cp-method-icon">⚡</span>СБП
          </button>
          <button class="cp-method ${activeMethod === 'crypto' ? 'active' : ''}" data-method="crypto">
            <span class="cp-method-icon">₿</span>Крипто
          </button>
        </div>

        ${activeMethod === 'card' ? `
          <div class="cp-field">
            <div class="cp-label">Номер карты</div>
            <div class="cp-card-wrap">
              <input class="cp-input" id="cp-cardnum" type="text" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number">
              <span class="cp-card-brand" id="cp-brand"></span>
            </div>
          </div>
          <div class="cp-field">
            <div class="cp-label">Имя на карте</div>
            <input class="cp-input" id="cp-name" type="text" placeholder="IVAN PETROV" autocomplete="cc-name" style="text-transform:uppercase;">
          </div>
          <div class="cp-row cp-field">
            <div>
              <div class="cp-label">Срок действия</div>
              <input class="cp-input" id="cp-expiry" type="text" inputmode="numeric" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp">
            </div>
            <div>
              <div class="cp-label">CVV / CVC</div>
              <input class="cp-input" id="cp-cvv" type="password" inputmode="numeric" placeholder="•••" maxlength="4" autocomplete="cc-csc">
            </div>
          </div>
        ` : activeMethod === 'sbp' ? `
          <div class="cp-alt-panel">
            <div class="cp-qr">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:.2;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h2v2h-2zM16 16h2v2h-2zM18 14h2v2h-2zM14 18h4v2h-4z"/></svg>
            </div>
            <div class="cp-alt-hint">Отсканируйте QR-код в приложении банка или перейдите по ссылке для оплаты через СБП.<br>Оплата зачисляется мгновенно.</div>
          </div>
        ` : `
          <div class="cp-alt-panel">
            <div class="cp-qr">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.2;"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.5 21m1.267-1.911-1.267-7.97m0 0c4.926.868 6.14-6.025 1.217-6.894m-1.217 6.894L9.5 3m1.266 7.89L9.5 3M9.5 3H7"/></svg>
            </div>
            <div class="cp-alt-hint">Поддерживаемые сети: <strong style="opacity:.7;">USDT (TRC-20)</strong>, Bitcoin, Ethereum.<br>Адрес для пополнения:</div>
            <div class="cp-wallet" id="cp-wallet-addr" title="Нажмите, чтобы скопировать">TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx42</div>
          </div>
        `}
      </div>

      <div class="cm-card" style="margin-bottom:10px;">
        ${!promoOpen ? `<span class="cp-promo-toggle" id="cp-promo-open">У меня есть промокод</span>` : `
          <div class="cm-sec-label">Промокод</div>
          <div class="cp-promo-row">
            <input class="cp-input" id="cp-promo-input" type="text" placeholder="Введите промокод" value="${promoApplied ? 'ODYSSEUS10' : ''}">
            <button class="cp-promo-apply" id="cp-promo-btn">${promoApplied ? '✓ Применён' : 'Применить'}</button>
          </div>
          ${promoApplied ? `<div style="font-size:12px;color:var(--red);opacity:.8;">Скидка 10% применена</div>` : ''}
        `}
      </div>

      <button class="cp-submit" id="cp-pay-btn">
        Оплатить $${total} / ${yearly ? 'год' : 'мес'}
      </button>
      <div class="cp-secure">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        Защищённое соединение · SSL
      </div>
    `;

    root.querySelector('#pay-back').addEventListener('click', onBack);

    root.querySelectorAll('.cp-method').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMethod = btn.dataset.method;
        render();
      });
    });

    if (activeMethod === 'card') {
      const cardNum = root.querySelector('#cp-cardnum');
      const brand = root.querySelector('#cp-brand');
      const expiry = root.querySelector('#cp-expiry');
      const name = root.querySelector('#cp-name');

      cardNum?.addEventListener('input', () => {
        const formatted = _formatCard(cardNum.value);
        cardNum.value = formatted;
        if (brand) brand.textContent = _cardBrand(formatted);
      });
      expiry?.addEventListener('input', () => {
        const pos = expiry.selectionStart;
        expiry.value = _formatExpiry(expiry.value);
        try { expiry.setSelectionRange(pos, pos); } catch {}
      });
      name?.addEventListener('input', () => {
        name.value = name.value.toUpperCase();
      });
    }

    if (activeMethod === 'crypto') {
      root.querySelector('#cp-wallet-addr')?.addEventListener('click', function() {
        navigator.clipboard?.writeText(this.textContent.trim()).catch(() => {});
        const orig = this.textContent;
        this.textContent = 'Скопировано!';
        setTimeout(() => { this.textContent = orig; }, 1500);
      });
    }

    root.querySelector('#cp-promo-open')?.addEventListener('click', () => {
      promoOpen = true;
      render();
      setTimeout(() => root.querySelector('#cp-promo-input')?.focus(), 50);
    });

    root.querySelector('#cp-promo-btn')?.addEventListener('click', () => {
      const input = root.querySelector('#cp-promo-input');
      if (input?.value.trim().toUpperCase() === 'ODYSSEUS10') {
        promoApplied = true;
        render();
      } else if (input) {
        input.style.borderColor = 'var(--red)';
        setTimeout(() => { input.style.borderColor = ''; }, 1200);
      }
    });

    root.querySelector('#cp-pay-btn')?.addEventListener('click', () => {
      _renderSuccess(root, plan, yearly, total, onBack);
    });
  }

  render();
}

function _renderSuccess(root, plan, yearly, total, onBack) {
  root.innerHTML = `
    <div class="cp-success">
      <div class="cp-success-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="cp-success-title">Подписка оформлена!</div>
      <div class="cp-success-sub">
        Тариф <strong>${plan.name}</strong> активирован.<br>
        Следующее списание $${total} — через ${yearly ? 'год' : 'месяц'}.
      </div>
      <button class="cp-submit" id="cp-done" style="width:auto;padding:10px 32px;margin-top:6px;">Готово</button>
    </div>
  `;
  root.querySelector('#cp-done').addEventListener('click', onBack);
}

// ── Plans panel ────────────────────────────────────────────────────── //

function _renderPlans(root, { onBack, modalId } = {}) {
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
    `;

    if (onBack) root.querySelector('#plans-back')?.addEventListener('click', onBack);
    root.querySelector('#seg-m').addEventListener('click', () => { yearly = false; render(); });
    root.querySelector('#seg-y').addEventListener('click', () => { yearly = true; render(); });

    root.querySelectorAll('[data-plan]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        const plan = PLANS.find(x => x.id === btn.dataset.plan);
        if (!plan) return;
        const backToPlans = () => {
          _renderPlans(root, { onBack, modalId });
          if (modalId) {
            const t = document.querySelector(`#${modalId}-title`);
            if (t) t.textContent = 'Планы подписки';
          }
        };
        _renderPayment(root, plan, yearly, { onBack: backToPlans });
        if (modalId) {
          const t = document.querySelector(`#${modalId}-title`);
          if (t) t.textContent = 'Оформление';
        }
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
  try { resetDate = reset_at ? new Date(reset_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : null; } catch {}

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
    { label: '10M', tokens: 10_000_000 },
    { label: '20M', tokens: 20_000_000 },
    { label: '30M', tokens: 30_000_000 },
    { label: '50M', tokens: 50_000_000 },
    { label: '100M', tokens: 100_000_000 },
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
      <div class="cm-sec-label">Пополнить кредиты</div>
      <div class="cm-pkg-row" id="cm-pkgs">
        ${packages.map((p, i) => `<button class="cm-pkg-btn" data-pkg="${i}">${p.label}</button>`).join('')}
      </div>
      <div class="cm-pkg-detail" id="cm-pkg-detail"></div>
      <button class="cm-action-btn" id="cm-buy" disabled>Оплатить</button>
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
      selPkg = packages[parseInt(btn.dataset.pkg)];
      root.querySelector('#cm-pkg-detail').textContent = _fmtNum(selPkg.tokens) + ' кредитов';
      const bb = root.querySelector('#cm-buy');
      bb.disabled = false;
      bb.classList.add('active');
      root.querySelector('#cm-buy-msg').style.display = 'none';
    });
  });

  root.querySelector('#cm-buy').addEventListener('click', () => {
    if (!selPkg) return;
    const pkgPlan = { id: 'pkg', name: `Пакет ${selPkg.label}`, desc: '', tokens_month: selPkg.tokens, pm: 0, py: 0, feats: [] };
    pkgPlan.pm = Math.round(selPkg.tokens / 500_000);
    pkgPlan.py = pkgPlan.pm;
    const goBack = () => _loadCredits(root, { onPlans });
    _renderPayment(root, pkgPlan, false, { onBack: goBack });
  });
}

// ── Credits modal ──────────────────────────────────────────────────── //

function _closeCredits() {
  document.getElementById(MODAL_ID)?.remove();
  Modals.unregister(MODAL_ID);
}

export async function openCredits() {
  if (Modals.toggle(MODAL_ID)) return;
  if (document.getElementById(MODAL_ID)) return;

  const modal = _createShell({ id: MODAL_ID, title: 'Кредиты', width: 480 });
  document.body.appendChild(modal);

  Modals.register(MODAL_ID, { sidebarBtnId: 'tool-credits-btn', closeFn: _closeCredits, restoreFn: () => {} });
  modal.querySelector(`#${MODAL_ID}-close`).addEventListener('click', _closeCredits);
  modal.querySelector(`#${MODAL_ID}-min`).addEventListener('click', () => Modals.minimize(MODAL_ID));
  modal.addEventListener('pointerdown', e => { if (e.target === modal) _closeCredits(); });

  try { const d = await import('./windowDrag.js'); d?.makeWindowDraggable?.(modal.querySelector('.modal-content')); } catch {}

  const body = modal.querySelector(`#${MODAL_ID}-body`);
  const goPlans = () => _renderPlans(body, {
    onBack: () => _loadCredits(body, { onPlans: goPlans }),
    modalId: MODAL_ID,
  });
  _loadCredits(body, { onPlans: goPlans });
}

// ── Plans modal (sidebar) ──────────────────────────────────────────── //

function _closePlans() {
  document.getElementById(PLANS_ID)?.remove();
  Modals.unregister(PLANS_ID);
}

export async function openPlans() {
  if (Modals.toggle(PLANS_ID)) return;
  if (document.getElementById(PLANS_ID)) return;

  const modal = _createShell({ id: PLANS_ID, title: 'Планы подписки', width: 520 });
  document.body.appendChild(modal);

  Modals.register(PLANS_ID, { sidebarBtnId: 'tool-plans-btn', closeFn: _closePlans, restoreFn: () => {} });
  modal.querySelector(`#${PLANS_ID}-close`).addEventListener('click', _closePlans);
  modal.querySelector(`#${PLANS_ID}-min`).addEventListener('click', () => Modals.minimize(PLANS_ID));
  modal.addEventListener('pointerdown', e => { if (e.target === modal) _closePlans(); });

  try { const d = await import('./windowDrag.js'); d?.makeWindowDraggable?.(modal.querySelector('.modal-content')); } catch {}

  _renderPlans(modal.querySelector(`#${PLANS_ID}-body`), { modalId: PLANS_ID });
}

// ── Wire up ────────────────────────────────────────────────────────── //

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tool-credits-btn')?.addEventListener('click', openCredits);
  document.getElementById('user-bar-credits-btn')?.addEventListener('click', openCredits);
  document.getElementById('tool-plans-btn')?.addEventListener('click', openPlans);
});

window.creditsModule = { open: openCredits, openPlans };
export default { open: openCredits, openPlans };
