(() => {
  const loader = document.querySelector('.loader');
  if (loader) { const dismiss = () => setTimeout(() => loader.classList.add('done'), 650); window.addEventListener('load', dismiss, { once: true }); setTimeout(() => loader.classList.add('done'), 2800); }

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: .13 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  document.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => {
    document.querySelector('.filter-chip.active')?.classList.remove('active'); chip.classList.add('active');
    const filter = chip.dataset.filter;
    document.querySelectorAll('.product-card').forEach(card => card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter));
  }));

  const toast = document.querySelector('.toast'); let toastTimer;
  const cartKey = 'everyhouseholdshop-cart';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(cartKey) || '{}') || {}; } catch { cart = {}; }
  const drawer = document.querySelector('.cart-drawer');
  const setDrawer = open => {
    if (!drawer) return;
    drawer.classList.toggle('open', open); drawer.setAttribute('aria-hidden', String(!open));
    document.querySelector('.cart-scrim')?.classList.toggle('open', open);
    document.body.classList.toggle('cart-open', open);
    document.querySelectorAll('.bag-link').forEach(button => button.setAttribute('aria-expanded', String(open)));
  };
  const money = amount => `$${Number(amount || 0).toFixed(2)}`;
  const renderCart = () => {
    const items = Object.values(cart); const count = items.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.bag-count').forEach(el => el.textContent = count);
    document.querySelectorAll('.drawer-count').forEach(el => el.textContent = `(${count})`);
    const lines = document.querySelector('.cart-lines');
    if (lines) lines.innerHTML = items.length ? items.map(item => `<article class="cart-line"><div class="cart-line-info"><h3>${item.name}</h3><span>${money(item.price)} each</span></div><div class="cart-line-controls"><button type="button" data-cart-action="decrease" data-cart-id="${item.id}" aria-label="Remove one ${item.name}">−</button><span>${item.qty}</span><button type="button" data-cart-action="increase" data-cart-id="${item.id}" aria-label="Add one ${item.name}">＋</button><button type="button" class="remove-line" data-cart-action="remove" data-cart-id="${item.id}">Remove</button></div><strong class="cart-line-total">${money(item.price * item.qty)}</strong></article>`).join('') : '<p class="cart-empty">Your bag is taking a quiet moment.<br>Find something you love in the collection.</p>';
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    document.querySelectorAll('.cart-total').forEach(el => el.textContent = money(total));
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch { /* Bag still works for this visit if storage is unavailable. */ }
  };
  renderCart();
  document.querySelectorAll('.bag-link').forEach(button => button.addEventListener('click', () => setDrawer(true)));
  document.querySelectorAll('[data-close-cart], .cart-close').forEach(button => button.addEventListener('click', () => setDrawer(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setDrawer(false); });
  document.querySelector('.cart-lines')?.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]'); if (!button) return;
    const item = cart[button.dataset.cartId]; if (!item) return;
    if (button.dataset.cartAction === 'increase') item.qty += 1;
    if (button.dataset.cartAction === 'decrease') item.qty -= 1;
    if (button.dataset.cartAction === 'remove' || item.qty <= 0) delete cart[item.id];
    renderCart();
  });
  document.querySelectorAll('.quick-add').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.product-card'); let price = Number(card.dataset.price); let id = card.dataset.id;
    const engraving = card.querySelector('.engraving-option select');
    if (engraving) { price += Number(engraving.value); if (Number(engraving.value)) id += '-engraved'; }
    const name = `${button.dataset.product}${engraving && Number(engraving.value) ? ' · engraved' : ''}`;
    cart[id] ||= { id, name, price, qty: 0 }; cart[id].qty += 1; renderCart(); setDrawer(true);
    if (toast) { toast.textContent = `${button.dataset.product} added to your bag`; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
  }));
  document.querySelector('.engraving-option select')?.addEventListener('change', event => {
    const extra = Number(event.target.value); const price = document.querySelector('.product-price');
    if (price) price.textContent = money(32.99 + extra);
  });

  const menuToggle = document.querySelector('.menu-toggle');
  menuToggle?.addEventListener('click', () => { const nav = document.querySelector('.primary-nav'); const open = nav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
  document.querySelectorAll('.primary-nav a').forEach(link => link.addEventListener('click', () => { document.querySelector('.primary-nav')?.classList.remove('open'); menuToggle?.setAttribute('aria-expanded', 'false'); }));

  const film = document.querySelector('.film-video'); const filmButton = document.querySelector('.film-toggle');
  filmButton?.addEventListener('click', () => { if (film.paused) { film.play(); filmButton.innerHTML = 'Pause film <span>Ⅱ</span>'; filmButton.setAttribute('aria-label', 'Pause nature film'); } else { film.pause(); filmButton.innerHTML = 'Play film <span>▶</span>'; filmButton.setAttribute('aria-label', 'Play nature film'); } });

  // A quiet, optional ambient bed generated locally; audio never starts without a visitor action.
  let audioContext, masterGain, soundNodes = [], soundOn = false, melodyTimer, melodyIndex = 0;
  const soundButtons = document.querySelectorAll('.sound-toggle');
  const startSound = async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx(); await audioContext.resume();
    masterGain = audioContext.createGain(); masterGain.gain.value = 0; masterGain.connect(audioContext.destination);
    const notes = [174.61, 220, 261.63, 329.63];
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator(), gain = audioContext.createGain(), filter = audioContext.createBiquadFilter();
      osc.type = i === 3 ? 'sine' : 'triangle'; osc.frequency.value = freq; filter.type = 'lowpass'; filter.frequency.value = 540;
      gain.gain.value = i === 0 ? .13 : .055; osc.connect(filter).connect(gain).connect(masterGain); osc.start(); soundNodes.push(osc);
    });
    masterGain.gain.setTargetAtTime(.12, audioContext.currentTime, .8);
  };
  const melody = [392, 440, 523.25, 440, 392, 329.63, 349.23, 392];
  const playSoftNote = () => {
    if (!audioContext || !masterGain) return;
    const now = audioContext.currentTime, note = audioContext.createOscillator(), envelope = audioContext.createGain();
    note.type = 'sine'; note.frequency.value = melody[melodyIndex++ % melody.length];
    envelope.gain.setValueAtTime(.0001, now); envelope.gain.exponentialRampToValueAtTime(.22, now + .16); envelope.gain.exponentialRampToValueAtTime(.0001, now + 2.2);
    note.connect(envelope).connect(masterGain); note.start(now); note.stop(now + 2.25);
  };
  const startMelody = () => { if (melodyTimer) return; playSoftNote(); melodyTimer = setInterval(playSoftNote, 2300); };
  const pauseMelody = () => { clearInterval(melodyTimer); melodyTimer = null; };
  soundButtons.forEach(button => button.addEventListener('click', async () => {
    if (!soundOn) { if (!masterGain) await startSound(); else { await audioContext.resume(); masterGain.gain.setTargetAtTime(.12, audioContext.currentTime, .6); } startMelody(); soundOn = true; }
    else { pauseMelody(); masterGain?.gain.setTargetAtTime(0, audioContext.currentTime, .25); soundOn = false; }
    soundButtons.forEach(item => { item.setAttribute('aria-pressed', String(soundOn)); item.querySelector('.sound-label').textContent = soundOn ? 'Pause track' : 'Play track'; });
  }));

  document.querySelector('#tracking-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const trackingNumber = document.querySelector('#tracking-number').value.trim();
    if (!trackingNumber) return;
    const trackingUrl = `https://www.canadapost-postescanada.ca/track-reperage/en/search?searchFor=${encodeURIComponent(trackingNumber)}`;
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  });
})();
