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

// ── Modal shell ────────────────────────────────────────────────────── //

function _createShell({ id, title, width = 480 }) {
  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal';
  modal.style.cssText = 'display:flex;position:fixed;inset:0;z-index:260;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);';
  modal.innerHTML = `
    <div class="modal-content" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(${width}px,97vw);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 48px rgba(0,0,0,.55);overflow:hidden;">
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
      <div id="${id}-body" class="cm-wrap" style="flex:1;overflow-y:auto;">
        <div class="cm-spinner-wrap"><div class="cm-spinner"></div>Загрузка…</div>
      </div>
    </div>
  `;
  return modal;
}

// ── Plans data ─────────────────────────────────────────────────────── //

const PAID_PLANS = [
  {
    id: 'starter', name: 'Стартовый', desc: 'Для редкого использования ИИ',
    tokens: 5_000_000, pm: 12.9, py: 9.9,
    iconBg: 'rgba(249,115,22,.15)', iconColor: '#f97316',
    iconSvg: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    models: [
      { name: 'DeepSeek V3', msgs: '~3 500 сообщений' },
      { name: 'Claude Opus 4', msgs: '~200 сообщений' },
      { name: 'GPT-4o',       msgs: '~200 сообщений' },
      { name: 'Gemini 2 Pro', msgs: '~400 сообщений' },
    ],
    storage: '1.0 GB', vector: '5 000 записей · ≈ 50 MB',
    support: 'Email и форум сообщества',
  },
  {
    id: 'pro', name: 'Премиум', desc: 'Для профессионалов, часто использующих ИИ',
    popular: true,
    badgeBg: 'linear-gradient(90deg,#7c3aed 0%,#a855f7 50%,#7c3aed 100%)',
    tokens: 15_000_000, pm: 24.9, py: 19.9,
    iconBg: 'rgba(168,85,247,.15)', iconColor: '#a855f7',
    iconSvg: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    models: [
      { name: 'DeepSeek V3', msgs: '~10 600 сообщений' },
      { name: 'Claude Opus 4', msgs: '~500 сообщений' },
      { name: 'GPT-4o',       msgs: '~500 сообщений' },
      { name: 'Gemini 2 Pro', msgs: '~1 200 сообщений' },
    ],
    storage: '2.0 GB', vector: '10 000 записей · ≈ 100 MB',
    support: 'Приоритетная поддержка по email',
  },
  {
    id: 'max', name: 'Максимум', desc: 'Для активных пользователей с комплексными задачами',
    tokens: 35_000_000, pm: 49.9, py: 39.9,
    iconBg: 'rgba(245,158,11,.15)', iconColor: '#f59e0b',
    iconSvg: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    models: [
      { name: 'DeepSeek V3', msgs: '~24 800 сообщений' },
      { name: 'Claude Opus 4', msgs: '~1 300 сообщений' },
      { name: 'GPT-4o',       msgs: '~1 100 сообщений' },
      { name: 'Gemini 2 Pro', msgs: '~2 800 сообщений' },
    ],
    storage: '4.0 GB', vector: '20 000 записей · ≈ 200 MB',
    support: 'Приоритетный чат и email-поддержка',
  },
];

// ── Shared SVGs ────────────────────────────────────────────────────── //

const CHECK = `<svg class="cm-p3-item-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// ── Payment panel ──────────────────────────────────────────────────── //

function _renderPayment(root, plan, yearly, { onBack }) {
  const price    = yearly ? plan.py : plan.pm;
  const origPrice = plan.pm;
  const period   = yearly ? 'год' : 'мес';
  const saving   = yearly ? Math.round((origPrice - plan.py) * 12) : 0;

  let activeMethod = 'card';
  let promoOpen    = false;
  let promoApplied = false;

  function _fmt4(v)  { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
  function _fmtExp(v){ let s=v.replace(/\D/g,'').slice(0,4); if(s.length>2) s=s.slice(0,2)+'/'+s.slice(2); return s; }
  function _brand(n) { n=n.replace(/\s/g,''); if(/^4/.test(n)) return 'VISA'; if(/^5[1-5]|^2[2-7]/.test(n)) return 'MC'; if(/^2200/.test(n)) return 'МИР'; return ''; }

  function render() {
    const total = promoApplied ? +(price * 0.9).toFixed(1) : price;
    root.innerHTML = `
      <div class="cm-plans-hdr" style="margin-bottom:14px;">
        <button class="cm-back" id="pay-back">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="cm-plans-ttl">Оформление подписки</span>
      </div>
      <div class="cp-order">
        <div class="cp-order-row">
          <div>
            <div class="cp-order-name">${plan.name}</div>
            <div class="cp-order-tokens">${_fmtShort(plan.tokens)} токенов / мес</div>
          </div>
          <div>
            <div class="cp-order-price">$${price}</div>
            <div class="cp-order-period">за ${period}</div>
          </div>
        </div>
        <div class="cp-order-divider"></div>
        <div class="cp-order-line"><span>Тариф «${plan.name}»</span><span>$${origPrice} / мес</span></div>
        ${yearly ? `<div class="cp-order-line"><span>Годовая скидка (−20%)</span><span class="cp-order-discount">−$${Math.round(saving/12)} / мес</span></div>` : ''}
        ${promoApplied ? `<div class="cp-order-line"><span>Промокод ODYSSEUS10</span><span class="cp-order-discount">−$${(price*0.1).toFixed(1)}</span></div>` : ''}
        <div class="cp-order-line total"><span>Итого сейчас</span><span>$${total}</span></div>
      </div>
      <div class="cm-card" style="margin-bottom:10px;">
        <div class="cm-sec-label">Способ оплаты</div>
        <div class="cp-methods">
          <button class="cp-method ${activeMethod==='card'?'active':''}" data-method="card"><span class="cp-method-icon">💳</span>Карта</button>
          <button class="cp-method ${activeMethod==='sbp'?'active':''}" data-method="sbp"><span class="cp-method-icon">⚡</span>СБП</button>
          <button class="cp-method ${activeMethod==='crypto'?'active':''}" data-method="crypto"><span class="cp-method-icon">₿</span>Крипто</button>
        </div>
        ${activeMethod === 'card' ? `
          <div class="cp-field"><div class="cp-label">Номер карты</div>
            <div class="cp-card-wrap"><input class="cp-input" id="cp-cardnum" type="text" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number">
            <span class="cp-card-brand" id="cp-brand"></span></div></div>
          <div class="cp-field"><div class="cp-label">Имя на карте</div>
            <input class="cp-input" id="cp-name" type="text" placeholder="IVAN PETROV" autocomplete="cc-name" style="text-transform:uppercase;"></div>
          <div class="cp-row cp-field">
            <div><div class="cp-label">Срок действия</div><input class="cp-input" id="cp-expiry" type="text" inputmode="numeric" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp"></div>
            <div><div class="cp-label">CVV / CVC</div><input class="cp-input" id="cp-cvv" type="password" inputmode="numeric" placeholder="•••" maxlength="4"></div>
          </div>
        ` : activeMethod === 'sbp' ? `
          <div class="cp-alt-panel">
            <div class="cp-qr"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:.2;"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h2v2h-2zM16 16h2v2h-2zM18 14h2v2h-2zM14 18h4v2h-4z"/></svg></div>
            <div class="cp-alt-hint">Отсканируйте QR в приложении банка для оплаты через СБП. Зачисление мгновенное.</div>
          </div>
        ` : `
          <div class="cp-alt-panel">
            <div class="cp-qr"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.2;"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.5 21m1.267-1.911-1.267-7.97m0 0c4.926.868 6.14-6.025 1.217-6.894m-1.217 6.894L9.5 3m1.266 7.89L9.5 3M9.5 3H7"/></svg></div>
            <div class="cp-alt-hint">USDT (TRC-20), Bitcoin, Ethereum.<br>Адрес кошелька:</div>
            <div class="cp-wallet" id="cp-wallet" title="Скопировать">TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx42</div>
          </div>
        `}
      </div>
      <div class="cm-card" style="margin-bottom:10px;">
        ${!promoOpen ? `<span class="cp-promo-toggle" id="cp-promo-open">У меня есть промокод</span>` : `
          <div class="cm-sec-label">Промокод</div>
          <div class="cp-promo-row">
            <input class="cp-input" id="cp-promo-input" type="text" placeholder="Введите промокод" value="${promoApplied?'ODYSSEUS10':''}">
            <button class="cp-promo-apply" id="cp-promo-btn">${promoApplied?'✓ Применён':'Применить'}</button>
          </div>
          ${promoApplied?`<div style="font-size:12px;color:var(--red);opacity:.8;">Скидка 10% применена</div>`:''}
        `}
      </div>
      <button class="cp-submit" id="cp-pay">Оплатить $${total} / ${yearly?'год':'мес'}</button>
      <div class="cp-secure"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Защищённое соединение · SSL</div>
    `;

    root.querySelector('#pay-back').addEventListener('click', onBack);
    root.querySelectorAll('.cp-method').forEach(b => b.addEventListener('click', () => { activeMethod = b.dataset.method; render(); }));

    if (activeMethod === 'card') {
      const cn = root.querySelector('#cp-cardnum'), br = root.querySelector('#cp-brand'), ex = root.querySelector('#cp-expiry'), nm = root.querySelector('#cp-name');
      cn?.addEventListener('input', () => { cn.value = _fmt4(cn.value); if(br) br.textContent = _brand(cn.value); });
      ex?.addEventListener('input', () => { const p=ex.selectionStart; ex.value=_fmtExp(ex.value); try{ex.setSelectionRange(p,p);}catch{} });
      nm?.addEventListener('input', () => { nm.value = nm.value.toUpperCase(); });
    }
    if (activeMethod === 'crypto') {
      root.querySelector('#cp-wallet')?.addEventListener('click', function() {
        navigator.clipboard?.writeText(this.textContent.trim()).catch(()=>{});
        const o=this.textContent; this.textContent='Скопировано!'; setTimeout(()=>{ this.textContent=o; },1500);
      });
    }
    root.querySelector('#cp-promo-open')?.addEventListener('click', () => { promoOpen=true; render(); setTimeout(()=>root.querySelector('#cp-promo-input')?.focus(),50); });
    root.querySelector('#cp-promo-btn')?.addEventListener('click', () => {
      const v = root.querySelector('#cp-promo-input');
      if (v?.value.trim().toUpperCase() === 'ODYSSEUS10') { promoApplied=true; render(); }
      else if (v) { v.style.borderColor='var(--red)'; setTimeout(()=>{ v.style.borderColor=''; },1200); }
    });
    root.querySelector('#cp-pay')?.addEventListener('click', () => _renderSuccess(root, plan, yearly, total, onBack));
  }

  render();
}

function _renderSuccess(root, plan, yearly, total, onBack) {
  root.innerHTML = `
    <div class="cp-success">
      <div class="cp-success-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div class="cp-success-title">Подписка оформлена!</div>
      <div class="cp-success-sub">Тариф <strong>${plan.name}</strong> активирован.<br>Следующее списание $${total} — через ${yearly?'год':'месяц'}.</div>
      <button class="cp-submit" id="cp-done" style="width:auto;padding:10px 32px;margin-top:6px;">Готово</button>
    </div>
  `;
  root.querySelector('#cp-done').addEventListener('click', onBack);
}

// ── Plans panel (3-column) ─────────────────────────────────────────── //

function _renderPlans(root, { onBack, modalId } = {}) {
  let yearly = false;

  function check(color) {
    return `<svg class="cm-p3-item-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" opacity=".7"><polyline points="20 6 9 17 4 12"/></svg>`;
  }

  function render() {
    root.innerHTML = `
      <div class="cm-plans-hdr" style="margin-bottom:18px;">
        ${onBack ? `<button class="cm-back" id="plans-back"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>` : ''}
        <span class="cm-plans-ttl">Планы подписки</span>
        <div class="cm-seg">
          <button class="cm-seg-btn ${!yearly?'active':''}" id="seg-m">Месяц</button>
          <button class="cm-seg-btn ${yearly?'active':''}" id="seg-y">Год <span class="cm-seg-badge">−20%</span></button>
        </div>
      </div>

      <div class="cm-p3-grid">
        ${PAID_PLANS.map(p => {
          const price = yearly ? p.py : p.pm;
          const ck = check(p.iconColor);
          return `
            <div class="cm-p3 ${p.popular ? 'popular' : ''}">
              ${p.popular ? `<div class="cm-p3-top-badge" style="background:${p.badgeBg};">✦ Самый популярный</div>` : ''}
              <div class="cm-p3-body">
                <div class="cm-p3-icon" style="background:${p.iconBg};color:${p.iconColor};">${p.iconSvg}</div>
                <div class="cm-p3-name">${p.name}</div>
                <div class="cm-p3-desc">${p.desc}</div>
                <div class="cm-p3-price-row">
                  <span class="cm-p3-dollar">$</span>
                  <span class="cm-p3-amount">${price}</span>
                  <span class="cm-p3-period">/ в месяц</span>
                </div>
                <button class="cm-p3-cta ${p.popular?'primary':''}" data-plan="${p.id}">Обновить</button>
                <div class="cm-p3-divider"></div>

                <div class="cm-p3-section-title">Вычислительные кредиты</div>
                <div class="cm-p3-credits-val" style="color:${p.iconColor};">${p.tokens.toLocaleString('en-US')} / мес</div>
                ${p.models.map(m => `
                  <div class="cm-p3-item">${ck}
                    <div class="cm-p3-item-wrap">
                      <div class="cm-p3-item-label">${m.name}</div>
                      <div class="cm-p3-item-sub">${m.msgs}</div>
                    </div>
                  </div>`).join('')}
                <div class="cm-p3-item">${ck}
                  <div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Больше моделей в сравнении планов</div></div>
                </div>

                <div class="cm-p3-hr"></div>
                <div class="cm-p3-section-title">Файлы и база знаний</div>
                <div class="cm-p3-item">${ck}
                  <div class="cm-p3-item-wrap">
                    <div class="cm-p3-item-label">Файлы и базы знаний в диалогах</div>
                    <div class="cm-p3-item-sub">PDF · MD · DOC · XLS · PPT и другие</div>
                  </div>
                </div>
                <div class="cm-p3-item">${ck}
                  <div class="cm-p3-item-wrap">
                    <div class="cm-p3-item-label">Хранилище файлов</div>
                    <div class="cm-p3-item-sub">${p.storage}</div>
                  </div>
                </div>
                <div class="cm-p3-item">${ck}
                  <div class="cm-p3-item-wrap">
                    <div class="cm-p3-item-label">Векторное хранилище</div>
                    <div class="cm-p3-item-sub">${p.vector}</div>
                  </div>
                </div>

                <div class="cm-p3-hr"></div>
                <div class="cm-p3-section-title">Сервис моделей</div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Собственный API популярных моделей</div></div></div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Неограниченные запросы сообщений</div></div></div>

                <div class="cm-p3-hr"></div>
                <div class="cm-p3-section-title">Облачный сервис</div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Неограниченная история чатов</div></div></div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Глобальная синхронизация в облаке</div></div></div>

                <div class="cm-p3-hr"></div>
                <div class="cm-p3-section-title">Премиум-функции</div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Маркет агентов</div></div></div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Эксклюзивные премиум-плагины</div></div></div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">Умный веб-поиск</div></div></div>

                <div class="cm-p3-hr"></div>
                <div class="cm-p3-section-title">Поддержка</div>
                <div class="cm-p3-item">${ck}<div class="cm-p3-item-wrap"><div class="cm-p3-item-label">${p.support}</div></div></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    if (onBack) root.querySelector('#plans-back')?.addEventListener('click', onBack);
    root.querySelector('#seg-m').addEventListener('click', () => { yearly = false; render(); });
    root.querySelector('#seg-y').addEventListener('click', () => { yearly = true; render(); });

    root.querySelectorAll('[data-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = PAID_PLANS.find(x => x.id === btn.dataset.plan);
        if (!plan) return;
        const backToPlans = () => {
          _renderPlans(root, { onBack, modalId });
          _setTitle(modalId, 'Планы подписки');
        };
        _renderPayment(root, plan, yearly, { onBack: backToPlans });
        _setTitle(modalId, 'Оформление');
      });
    });
  }

  render();
}

function _setTitle(modalId, text) {
  if (!modalId) return;
  const el = document.querySelector(`#${modalId}-title`);
  if (el) el.textContent = text;
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
  const initial   = (username || '?')[0].toUpperCase();
  const roleLabel = is_admin ? 'Администратор' : 'Пользователь';

  let resetDate = null;
  try { resetDate = reset_at ? new Date(reset_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : null; } catch {}

  let usageBlock = '';
  if (is_admin || limit === null) {
    usageBlock = `<div class="cm-unlimited"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="opacity:.5;flex-shrink:0;"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>Неограниченный лимит токенов</div>`;
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
        <div class="cm-bar-hdr"><span class="cm-bar-lbl">Использование за месяц</span><span class="cm-bar-pct">${Math.round(pct)}%</span></div>
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
    const fakePlan = { id: 'pkg', name: `Пакет ${selPkg.label}`, tokens: selPkg.tokens,
      pm: +(selPkg.tokens / 500_000).toFixed(1), py: +(selPkg.tokens / 500_000).toFixed(1) };
    const goBack = () => _loadCredits(root, { onPlans });
    _renderPayment(root, fakePlan, false, { onBack: goBack });
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
  const goPlans = () => {
    _renderPlans(body, { onBack: () => _loadCredits(body, { onPlans: goPlans }), modalId: MODAL_ID });
    _setTitle(MODAL_ID, 'Планы подписки');
  };
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

  const modal = _createShell({ id: PLANS_ID, title: 'Планы подписки', width: 1020 });
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
