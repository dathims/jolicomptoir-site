// Joli Comptoir : interactions de la page (onglets, codes-barres, démo de caisse).
// Aucune dépendance. Les montants sont manipulés en centimes, comme dans la vraie caisse.

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Une journée en boutique : onglets accessibles (flèches, Début, Fin)
  // ---------------------------------------------------------------------------

  const tabs = [...document.querySelectorAll('.horloge [role="tab"]')];

  function selectTab(tab, focus = false) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const moves = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in moves)) return;
      e.preventDefault();
      selectTab(tabs[(moves[e.key] + tabs.length) % tabs.length], true);
    });
  });

  // Les cartes du hero ouvrent directement le bon moment de la journée.
  document.querySelectorAll('[data-moment]').forEach((link) => {
    link.addEventListener('click', () => {
      const tab = document.getElementById(`tab-${link.dataset.moment}`);
      if (tab) selectTab(tab);
    });
  });

  // ---------------------------------------------------------------------------
  // EAN-13 : même algorithme que la caisse (préfixe 200, usage interne au magasin)
  // ---------------------------------------------------------------------------

  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
  const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

  function ean13CheckDigit(first12) {
    const sum = [...first12].reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10;
  }

  function ean13Bits(code) {
    const d = [...code].map(Number);
    let bits = '101';
    for (let i = 1; i <= 6; i++) bits += (PARITY[d[0]][i - 1] === 'L' ? L : G)[d[i]];
    bits += '01010';
    for (let i = 7; i <= 12; i++) bits += R[d[i]];
    return bits + '101';
  }

  function drawEan(svg) {
    const first12 = svg.dataset.ean.slice(0, 12);
    const bits = ean13Bits(first12 + ean13CheckDigit(first12));
    const guards = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
    let rects = '';
    for (let x = 0; x < bits.length; x++) {
      if (bits[x] === '1') rects += `<rect x="${x}" y="0" width="1" height="${guards.has(x) ? 34 : 30}"/>`;
    }
    svg.innerHTML = rects;
  }

  document.querySelectorAll('svg.ean').forEach(drawEan);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // Slider des promesses du hero : flèches, compteur, touches gauche et droite
  // ---------------------------------------------------------------------------

  const slider = document.querySelector('[data-slider]');
  if (slider) {
    const slides = [...slider.querySelectorAll('[data-slide]')];
    const count = slider.querySelector('[data-count]');
    let current = 0;

    const show = (index, direction) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.hidden = i !== current;
        slide.classList.remove('is-entering', 'from-left');
      });
      const slide = slides[current];
      void slide.offsetWidth; // relance l'animation d'entrée
      slide.classList.add('is-entering');
      if (direction < 0) slide.classList.add('from-left');
      count.textContent = `${current + 1} / ${slides.length}`;
    };

    slider.querySelector('[data-prev]').addEventListener('click', () => show(current - 1, -1));
    slider.querySelector('[data-next]').addEventListener('click', () => show(current + 1, 1));
    slider.addEventListener('keydown', (e) => {
      if (e.target.closest('a')) return;
      if (e.key === 'ArrowLeft') show(current - 1, -1);
      if (e.key === 'ArrowRight') show(current + 1, 1);
    });
  }

  // ---------------------------------------------------------------------------
  // Le comptoir animé : un petit scénario qui fait travailler chaque appareil
  // ---------------------------------------------------------------------------

  const scene = document.querySelector('[data-scene]');
  if (scene) {
    // Le tiroir ne s'ouvre que pour les espèces, comme dans la vraie caisse.
    const STEPS = [
      { dev: 'scanner', state: ['l1', 'c-scan'], fx: ['beam', 'ring'], dur: 2600,
        cap: "Un bip : la douchette lit l'étiquette, le pull s'ajoute à la vente." },
      { dev: 'scanner', state: ['l1', 'l2', 'c-scan'], fx: ['beam', 'ring'], dur: 2600,
        cap: 'Deuxième bip : le jean rejoint la vente et le total se met à jour.' },
      { dev: 'drawer', state: ['l1', 'l2', 'paid-cash', 'receipt', 'drawer', 'c-print', 'c-drawer'], fx: [], dur: 3600,
        cap: "Paiement en espèces : le ticket s'imprime et le tiroir s'ouvre." },
      { dev: 'tpe', state: ['l3', 'card'], fx: [], dur: 2600,
        cap: 'Vente suivante, réglée par carte sur le terminal de votre banque.' },
      { dev: 'printer', state: ['l3', 'paid-card', 'tpe-ok', 'receipt', 'c-print'], fx: [], dur: 3200,
        cap: "Le ticket s'imprime et le tiroir reste fermé." },
      { dev: 'labels', state: ['label', 'c-label'], fx: [], dur: 3600,
        cap: "Arrivage : l'imprimante d'étiquettes sort le prix et le code-barres." },
    ];
    // Les appareils sans étape propre (l'écran) renvoient à l'étape la plus parlante.
    const FIRST_STEP = { screen: 1, scanner: 0, drawer: 2, tpe: 3, printer: 4, labels: 5 };

    // Sur petit écran, cadrage resserré sur le comptoir pour garder les appareils lisibles.
    const narrow = window.matchMedia('(max-width: 560px)');
    const frame = () => scene.setAttribute('viewBox', narrow.matches ? '40 96 740 322' : '14 40 772 410');
    frame();
    narrow.addEventListener('change', frame);

    const caption = document.querySelector('[data-caption]');
    const toggle = document.querySelector('[data-scene-toggle]');
    const legend = [...document.querySelectorAll('[data-device]')];
    let step = 0;
    let timer = null;
    let playing = false;
    let pausedByUser = false;
    let holding = false;

    function apply(index) {
      const s = STEPS[index];
      scene.setAttribute('class', ['scene', ...s.state.map((c) => `s-${c}`)].join(' '));
      for (const name of s.fx) {
        const el = scene.querySelector(`.${name}`);
        el.classList.remove('go');
        void el.getBoundingClientRect();
        el.classList.add('go');
      }
      caption.textContent = s.cap;
      legend.forEach((b) => b.classList.toggle('is-active', b.dataset.device === s.dev));
    }

    function run() {
      clearTimeout(timer);
      apply(step);
      if (!playing || holding) return;
      timer = setTimeout(() => {
        step = (step + 1) % STEPS.length;
        run();
      }, STEPS[step].dur);
    }

    function setPlaying(on) {
      playing = on;
      toggle.textContent = on ? 'Pause' : 'Lecture';
      toggle.setAttribute('aria-label', on ? "Mettre l'animation en pause" : "Lancer l'animation");
      if (on) run();
      else clearTimeout(timer);
    }

    toggle.addEventListener('click', () => {
      pausedByUser = playing;
      setPlaying(!playing);
    });

    legend.forEach((button) => {
      const dev = button.dataset.device;
      const focusOn = () => { scene.dataset.focus = dev; holding = true; clearTimeout(timer); };
      const focusOff = () => { delete scene.dataset.focus; holding = false; if (playing) run(); };
      button.addEventListener('mouseenter', focusOn);
      button.addEventListener('mouseleave', focusOff);
      button.addEventListener('focus', focusOn);
      button.addEventListener('blur', focusOff);
      button.addEventListener('click', () => {
        step = FIRST_STEP[dev];
        holding = false;
        delete scene.dataset.focus;
        run();
        if (playing) return;
        scene.dataset.focus = dev; // à l'arrêt, l'appareil reste mis en avant
      });
    });

    // Lecture quand le comptoir est visible, sauf si la personne a mis en pause
    // ou préfère réduire les animations (on montre alors la vente en espèces, figée).
    if (reduceMotion) {
      step = 2;
      apply(step);
      setPlaying(false);
    } else {
      apply(step);
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !pausedByUser) setPlaying(true);
        else if (!entry.isIntersecting && playing) setPlaying(false);
      }, { threshold: 0.35 }).observe(scene);
    }
  }

  // ---------------------------------------------------------------------------
  // Démo de caisse
  // ---------------------------------------------------------------------------

  const root = document.querySelector('[data-caisse]');
  if (!root) return;

  const PRODUCTS = [
    { id: 1, name: 'Pull col rond mérinos', cat: 'Hauts', price: 8900, color: '#e6dccb' },
    { id: 2, name: 'Chemise en lin', cat: 'Hauts', price: 7900, color: '#bfc6ad' },
    { id: 3, name: 'Robe portefeuille', cat: 'Hauts', price: 12900, color: '#b3573c' },
    { id: 4, name: 'Jean droit brut', cat: 'Bas', price: 11900, color: '#2f3b5e' },
    { id: 5, name: 'Pantalon large en laine', cat: 'Bas', price: 13500, color: '#8a7a69' },
    { id: 6, name: 'Écharpe en laine', cat: 'Accessoires', price: 4500, color: '#7c8d68' },
    { id: 7, name: 'Chaussettes côtelées', cat: 'Accessoires', price: 1500, color: '#d6a28c' },
    { id: 8, name: 'Tote bag en toile', cat: 'Accessoires', price: 2500, color: '#e4d8bf' },
  ];

  const VAT_BP = 2000; // TVA 20 %, en points de base comme dans la caisse
  const WIDTH = 32;    // colonnes d'un ticket 58 mm

  const $ = (sel) => root.querySelector(sel);
  const grid = $('[data-grid]');
  const cartEl = $('[data-cart]');
  const emptyEl = $('[data-empty]');
  const totalEl = $('[data-total]');
  const chronoEl = $('[data-chrono]');
  const payBtns = root.querySelectorAll('[data-pay]');
  const printer = $('[data-printer]');
  const receiptEl = $('[data-receipt]');
  const resultEl = $('[data-result]');

  const state = { lines: new Map(), startedAt: null, timer: null, ticketNo: 348, filter: 'Tout' };

  // 1234567 centimes -> "12 345,67"
  function money(cents) {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const euros = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${sign}${euros},${String(abs % 100).padStart(2, '0')}`;
  }

  const seconds = (ms) => (ms / 1000).toFixed(1).replace('.', ',');
  const total = () => [...state.lines.values()].reduce((s, l) => s + l.product.price * l.qty, 0);

  // ----- Bip de douchette (Web Audio, créé au premier geste) -----
  let audio;
  function beep() {
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = 1760;
      gain.gain.setValueAtTime(0.06, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.1);
    } catch {
      // Pas de son disponible : la démo fonctionne sans.
    }
  }

  // ----- Catalogue -----
  function renderGrid() {
    grid.innerHTML = '';
    PRODUCTS.filter((p) => state.filter === 'Tout' || p.cat === state.filter).forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'produit';
      b.dataset.id = p.id;
      b.setAttribute('aria-label', `Ajouter ${p.name}, ${money(p.price)} euros`);
      b.innerHTML = `<span class="produit-swatch" style="--c:${p.color}"></span>
        <span class="produit-nom">${p.name}</span>
        <span class="produit-prix">${money(p.price)} €</span>`;
      b.addEventListener('click', () => add(p));
      grid.append(b);
    });
  }

  root.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.filter = chip.dataset.filter;
      root.querySelectorAll('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      renderGrid();
    });
  });

  $('[data-scan]').addEventListener('click', () => {
    const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    beep();
    add(p);
    const tile = grid.querySelector(`[data-id="${p.id}"]`);
    if (tile) {
      tile.classList.add('is-scanned');
      setTimeout(() => tile.classList.remove('is-scanned'), 450);
    }
  });

  // ----- Panier -----
  function add(product, delta = 1) {
    if (!printer.hidden) return;
    const line = state.lines.get(product.id) ?? { product, qty: 0 };
    line.qty += delta;
    if (line.qty <= 0) state.lines.delete(product.id);
    else state.lines.set(product.id, line);
    if (delta > 0 && !state.startedAt) startChrono();
    if (state.lines.size === 0) stopChrono(true);
    renderCart();
  }

  function renderCart() {
    cartEl.innerHTML = '';
    for (const { product, qty } of state.lines.values()) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="panier-nom">${product.name}</span>
        <span class="panier-qte">
          <button type="button" aria-label="Retirer un ${product.name}"><svg viewBox="0 0 16 16"><path d="M3.5 8h9"/></svg></button>
          <span>${qty}</span>
          <button type="button" aria-label="Ajouter un ${product.name}"><svg viewBox="0 0 16 16"><path d="M3.5 8h9M8 3.5v9"/></svg></button>
        </span>
        <span class="panier-ligne">${money(product.price * qty)}</span>`;
      const [minus, plus] = li.querySelectorAll('button');
      minus.addEventListener('click', () => add(product, -1));
      plus.addEventListener('click', () => add(product, 1));
      cartEl.append(li);
    }
    const empty = state.lines.size === 0;
    emptyEl.hidden = !empty;
    totalEl.textContent = `${money(total())} €`;
    payBtns.forEach((b) => { b.disabled = empty; });
  }

  // ----- Chronomètre -----
  function startChrono() {
    state.startedAt = performance.now();
    chronoEl.classList.add('is-running');
    state.timer = setInterval(() => {
      chronoEl.textContent = `${seconds(performance.now() - state.startedAt)} s`;
    }, 100);
  }

  function stopChrono(reset = false) {
    clearInterval(state.timer);
    state.timer = null;
    chronoEl.classList.remove('is-running');
    if (reset) {
      state.startedAt = null;
      chronoEl.textContent = '0,0 s';
    }
  }

  // ----- Ticket -----
  const center = (s) => ' '.repeat(Math.max(0, Math.floor((WIDTH - s.length) / 2))) + s;
  const row = (left, right) => left + ' '.repeat(Math.max(1, WIDTH - left.length - right.length)) + right;
  const rule = '-'.repeat(WIDTH);

  async function fingerprint(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 10)}…${hex.slice(-6)}`;
    } catch {
      return null; // contexte non sécurisé : on n'affiche pas de fausse signature
    }
  }

  async function pay(method) {
    const elapsed = performance.now() - state.startedAt;
    stopChrono();
    const ttc = total();
    const vat = Math.round((ttc * VAT_BP) / (10000 + VAT_BP));
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR');
    const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const no = String(state.ticketNo++).padStart(6, '0');

    const out = [center('BOUTIQUE DÉMO'), center('Démonstration Joli Comptoir'), rule];
    for (const { product, qty } of state.lines.values()) {
      out.push(product.name);
      out.push(row(`  ${qty} x ${money(product.price)}`, money(product.price * qty)));
    }
    out.push(rule, row('TOTAL TTC', `${money(ttc)} EUR`), row('dont TVA 20 %', money(vat)), row('Total HT', money(ttc - vat)), '');

    if (method === 'carte') {
      out.push(row('Carte bancaire', money(ttc)));
    } else {
      // Le client tend le billet rond au-dessus (ou l'appoint s'il tombe juste).
      const given = Math.ceil(ttc / 1000) * 1000;
      out.push(row('Espèces reçues', money(given)), row('Rendu', money(given - ttc)));
    }

    out.push(rule, row(`Ticket ${no}`, `${date} ${time}`));
    const sig = await fingerprint(out.join('\n'));
    if (sig) out.push(`Empreinte ${sig}`);
    out.push('', center('Merci de votre visite !'));

    receiptEl.textContent = out.join('\n');
    printer.hidden = false;
    receiptEl.classList.remove('is-printing');
    void receiptEl.offsetWidth; // relance l'animation d'impression
    receiptEl.classList.add('is-printing');
    resultEl.innerHTML = `Encaissé en <em>${seconds(elapsed)} s</em>. Le client repart, le stock est à jour.`;
    payBtns.forEach((b) => { b.disabled = true; });
    $('[data-reset]').focus({ preventScroll: true });
  }

  payBtns.forEach((b) => b.addEventListener('click', () => pay(b.dataset.pay)));

  $('[data-reset]').addEventListener('click', () => {
    printer.hidden = true;
    state.lines.clear();
    stopChrono(true);
    renderCart();
    grid.querySelector('.produit')?.focus({ preventScroll: true });
  });

  renderGrid();
  renderCart();
})();
