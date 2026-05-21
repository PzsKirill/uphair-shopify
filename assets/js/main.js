// uphair.shop — landing page interactions

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Lenis smooth scroll ──────────────────────────────
  let lenis = null;
  if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // ─── Anchor scrolling (works with Lenis or fallback) ───
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -80, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ─── Reveal-on-scroll (IntersectionObserver) ───────────
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ─── GSAP hero parallax + bottle float ─────────────────
  if (!prefersReducedMotion && typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

    // Hero entrance
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero__copy .pill', { y: 20, opacity: 0, duration: 0.7 })
      .from('.hero__copy h1', { y: 30, opacity: 0, duration: 0.9 }, '-=0.4')
      .from('.hero__lede', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.hero__cta > *', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.4')
      .from('.hero__trust-item', { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.3')
      .from('.hero__bottle', { y: 60, opacity: 0, scale: 0.94, duration: 1.1, ease: 'power2.out' }, 0.2)
      .from('.hero__floating', { y: 20, opacity: 0, duration: 0.6, stagger: 0.15 }, '-=0.4');

    // Parallax on hero bottle
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.to('.hero__bottle', {
        y: 80,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
      gsap.to('.hero__halo', {
        scale: 1.2,
        opacity: 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    }
  }

  // ─── Header scroll state ──────────────────────────────
  const header = $('.header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 24) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ─── Variant picker ────────────────────────────────────
  const variants = $$('.variant');
  const buyBtn = $('[data-buy-btn]');
  const stickyBuyBtn = $('[data-sticky-buy-btn]');
  const stickyPriceLabel = $('[data-sticky-price]');
  const priceNow = $('[data-price-now]');
  const priceWas = $('[data-price-was]');
  const priceSave = $('[data-price-save]');

  const currentVariant = () => {
    const active = $('.variant.is-active') || variants[0];
    if (!active) return null;
    const label = active.querySelector('.variant__main strong')?.textContent.trim() || 'uphair Hair Growth Serum';
    const basePrice = parseFloat(active.dataset.price) || 0;
    const price = isSubscribed ? basePrice * (1 - SUB_DISCOUNT) : basePrice;
    const subSuffix = isSubscribed ? ' · subscription (10% off)' : '';
    return {
      id: 'serum-' + (active.querySelector('input')?.value || '1') + (isSubscribed ? '-sub' : ''),
      title: 'uphair Hair Growth Serum',
      variant: label + subSuffix,
      price: Math.round(price * 100) / 100,
      image: 'assets/img/uphair-bottle.png'
    };
  };

  const subscribeEl = $('[data-subscribe]');
  const subscribeToggle = $('[data-subscribe-toggle]');
  const subscribePriceLabel = $('[data-subscribe-price]');
  const SUB_DISCOUNT = 0.10;
  let isSubscribed = false;

  const setVariant = el => {
    variants.forEach(v => v.classList.remove('is-active'));
    el.classList.add('is-active');
    const input = el.querySelector('input');
    if (input) input.checked = true;
    const basePrice = parseFloat(el.dataset.price) || 0;
    const wasPrice = parseFloat(el.dataset.was) || 0;
    const save = el.dataset.save;

    const finalPrice = isSubscribed ? basePrice * (1 - SUB_DISCOUNT) : basePrice;
    const finalLabel = '$' + finalPrice.toFixed(isSubscribed ? 0 : 0);

    if (priceNow) priceNow.textContent = finalLabel;
    if (priceWas) priceWas.textContent = '$' + wasPrice;
    if (priceSave) priceSave.textContent = isSubscribed
      ? 'Save ' + Math.round((1 - finalPrice / wasPrice) * 100) + '%'
      : 'Save ' + save;
    if (stickyPriceLabel) stickyPriceLabel.textContent = finalLabel;
    if (subscribePriceLabel) subscribePriceLabel.textContent = '−$' + (basePrice * SUB_DISCOUNT).toFixed(2);
  };
  variants.forEach(v => {
    v.addEventListener('click', () => setVariant(v));
  });

  subscribeEl?.addEventListener('click', e => {
    // Avoid double-fire when checkbox itself is clicked
    if (e.target === subscribeToggle) return;
    e.preventDefault();
    if (subscribeToggle) subscribeToggle.checked = !subscribeToggle.checked;
    isSubscribed = subscribeToggle?.checked || false;
    subscribeEl.classList.toggle('is-active', isSubscribed);
    const active = $('.variant.is-active') || variants[0];
    if (active) setVariant(active);
  });
  subscribeToggle?.addEventListener('change', () => {
    isSubscribed = subscribeToggle.checked;
    subscribeEl?.classList.toggle('is-active', isSubscribed);
    const active = $('.variant.is-active') || variants[0];
    if (active) setVariant(active);
  });

  // ─── Cart store ────────────────────────────────────────
  const STORAGE_KEY = 'uphair-cart-v1';
  const FREE_SHIP_THRESHOLD = 60;
  let cart = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { items: [] }; }
    catch { return { items: [] }; }
  })();

  const persistCart = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { }
  };
  const cartSubtotal = () => cart.items.reduce((s, it) => s + it.price * it.qty, 0);
  const cartCount = () => cart.items.reduce((s, it) => s + it.qty, 0);

  // ─── Cart drawer DOM ───────────────────────────────────
  const drawer = $('#cart-drawer');
  const overlay = $('[data-overlay]');
  const headerCartBtn = $('[aria-label="Cart"]');
  const headerCartCount = $('.cart-count');
  const itemsList = $('[data-cart-items]');
  const subtotalEl = $('[data-cart-subtotal]');
  const cartCountLabel = $('[data-cart-count-label]');
  const shippingBar = $('[data-shipping-bar]');
  const shippingFill = $('[data-shipping-fill]');
  const shippingText = $('[data-shipping-text]');

  const renderCart = () => {
    if (!drawer) return;
    const subtotal = cartSubtotal();
    const count = cartCount();

    drawer.classList.toggle('is-empty', cart.items.length === 0);
    if (cartCountLabel) cartCountLabel.textContent = `(${count})`;
    if (headerCartCount) headerCartCount.textContent = count;
    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(0);

    // Free-shipping progress
    if (shippingBar && shippingFill && shippingText) {
      const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
      const pct = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);
      shippingFill.style.width = pct + '%';
      if (remaining <= 0) {
        shippingText.innerHTML = '<strong>You\'ve unlocked free EU shipping</strong>';
        shippingBar.classList.add('is-unlocked');
      } else {
        shippingText.innerHTML = `Spend <strong>$${remaining.toFixed(0)}</strong> more to unlock free EU shipping`;
        shippingBar.classList.remove('is-unlocked');
      }
    }

    // Upsell shows only when at least one item present and upsell isn't already there
    const upsellEl = $('[data-cart-upsell]');
    const hasUpsell = cart.items.some(it => it.id === 'upsell-roller');
    if (upsellEl) upsellEl.hidden = cart.items.length === 0 || hasUpsell;

    // Items
    if (!itemsList) return;
    itemsList.innerHTML = cart.items.map(it => `
      <li class="cart-drawer__item" data-id="${it.id}">
        <div class="cart-drawer__item-thumb">
          <img src="${it.image}" alt="${it.title}" loading="lazy">
        </div>
        <div class="cart-drawer__item-main">
          <span class="cart-drawer__item-title">${it.title}</span>
          <span class="cart-drawer__item-variant">${it.variant}</span>
          <div class="cart-drawer__item-bottom">
            <div class="qty-stepper" role="group" aria-label="Quantity">
              <button type="button" data-qty="-1" aria-label="Decrease quantity" ${it.qty <= 1 ? 'disabled' : ''}>−</button>
              <span class="qty-stepper__value">${it.qty}</span>
              <button type="button" data-qty="+1" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-drawer__item-price">$${(it.price * it.qty).toFixed(0)}</span>
          </div>
        </div>
        <button class="cart-drawer__item-remove" data-remove aria-label="Remove ${it.title}">Remove</button>
      </li>
    `).join('');
  };

  const addToCart = (item) => {
    const existing = cart.items.find(it => it.id === item.id);
    if (existing) existing.qty += item.qty || 1;
    else cart.items.push({ ...item, qty: item.qty || 1 });
    persistCart();
    renderCart();
  };
  const removeItem = (id) => {
    cart.items = cart.items.filter(it => it.id !== id);
    persistCart();
    renderCart();
  };
  const changeQty = (id, delta) => {
    const it = cart.items.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    persistCart();
    renderCart();
  };

  // Drawer open/close
  const openDrawer = () => {
    if (!drawer || !overlay) return;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-drawer-open');
    if (lenis) lenis.stop();
  };
  const closeDrawer = () => {
    if (!drawer || !overlay) return;
    overlay.classList.remove('is-visible');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-drawer-open');
    if (lenis) lenis.start();
    setTimeout(() => { if (!drawer.classList.contains('is-open')) overlay.hidden = true; }, 400);
  };

  // Wire triggers
  if (headerCartBtn) headerCartBtn.addEventListener('click', e => { e.preventDefault(); openDrawer(); });
  $('[data-cart-close]')?.addEventListener('click', closeDrawer);
  $('[data-cart-close-cta]')?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer?.classList.contains('is-open')) closeDrawer(); });

  // Wire ATC buttons
  const wireAtc = (btn) => {
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const variant = currentVariant();
      if (!variant) return;
      addToCart(variant);
      openDrawer();
    });
  };
  wireAtc(buyBtn);
  wireAtc(stickyBuyBtn);

  // Wire delegated cart actions
  itemsList?.addEventListener('click', e => {
    const li = e.target.closest('[data-id]');
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.matches('[data-remove]')) removeItem(id);
    else if (e.target.matches('[data-qty]')) {
      const delta = parseInt(e.target.dataset.qty, 10);
      changeQty(id, delta);
    }
  });

  // Upsell add
  $('[data-add-upsell]')?.addEventListener('click', () => {
    addToCart({
      id: 'upsell-roller',
      title: 'Scalp Massage Roller',
      variant: 'Boosts absorption',
      price: 19,
      image: 'assets/img/LMZ266_65.webp'
    });
  });

  // Initial render
  renderCart();

  // ─── Mobile nav drawer ─────────────────────────────────
  const navDrawer = $('#nav-drawer');
  const navToggle = $('.nav-toggle');

  const openNavDrawer = () => {
    if (!navDrawer || !overlay) return;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    navDrawer.classList.add('is-open');
    navDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-drawer-open');
    if (lenis) lenis.stop();
  };
  const closeNavDrawer = () => {
    if (!navDrawer || !overlay) return;
    overlay.classList.remove('is-visible');
    navDrawer.classList.remove('is-open');
    navDrawer.setAttribute('aria-hidden', 'true');
    if (!drawer?.classList.contains('is-open')) {
      document.body.classList.remove('is-drawer-open');
      if (lenis) lenis.start();
      setTimeout(() => {
        if (!drawer?.classList.contains('is-open') && !navDrawer.classList.contains('is-open')) {
          overlay.hidden = true;
        }
      }, 400);
    }
  };

  navToggle?.addEventListener('click', e => { e.preventDefault(); openNavDrawer(); });
  $('[data-nav-close]')?.addEventListener('click', closeNavDrawer);
  $$('[data-nav-link]').forEach(a => a.addEventListener('click', () => closeNavDrawer()));
  overlay?.addEventListener('click', () => {
    if (navDrawer?.classList.contains('is-open')) closeNavDrawer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navDrawer?.classList.contains('is-open')) closeNavDrawer();
  });

  // ─── Welcome pop-up ────────────────────────────────────
  const welcome = $('#welcome-popup');
  const welcomeForm = $('[data-welcome-form]');
  const welcomeSuccess = $('[data-welcome-success]');
  const WELCOME_KEY = 'uphair-welcome-shown';

  const openWelcome = () => {
    if (!welcome || sessionStorage.getItem(WELCOME_KEY)) return;
    welcome.hidden = false;
    requestAnimationFrame(() => welcome.classList.add('is-open'));
    welcome.setAttribute('aria-hidden', 'false');
    sessionStorage.setItem(WELCOME_KEY, '1');
    document.body.classList.add('is-drawer-open');
    if (lenis) lenis.stop();
  };
  const closeWelcome = () => {
    if (!welcome) return;
    welcome.classList.remove('is-open');
    welcome.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-drawer-open');
    if (lenis) lenis.start();
    setTimeout(() => { welcome.hidden = true; }, 320);
  };

  if (welcome) {
    $$('[data-welcome-close]').forEach(b => b.addEventListener('click', closeWelcome));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && welcome.classList.contains('is-open')) closeWelcome();
    });

    welcomeForm?.addEventListener('submit', e => {
      e.preventDefault();
      const email = welcomeForm.querySelector('input[type="email"]')?.value.trim();
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        welcomeForm.querySelector('input[type="email"]')?.focus();
        return;
      }
      welcomeForm.hidden = true;
      if (welcomeSuccess) welcomeSuccess.hidden = false;
      setTimeout(closeWelcome, 3000);
    });

    // Trigger: 10s OR 30% scroll
    if (!sessionStorage.getItem(WELCOME_KEY)) {
      const timer = setTimeout(openWelcome, 10000);
      const onScroll = () => {
        const pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (pct > 0.3) {
          clearTimeout(timer);
          window.removeEventListener('scroll', onScroll);
          openWelcome();
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  // ─── Cookie consent banner ─────────────────────────────
  const cookie = $('#cookie-banner');
  const COOKIE_KEY = 'uphair-cookie-consent';

  const showCookie = () => {
    if (!cookie) return;
    cookie.hidden = false;
    requestAnimationFrame(() => cookie.classList.add('is-visible'));
  };
  const hideCookie = () => {
    if (!cookie) return;
    cookie.classList.remove('is-visible');
    setTimeout(() => { cookie.hidden = true; }, 600);
  };
  const saveConsent = (consent) => {
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...consent, ts: Date.now() })); } catch { }
    // In production this would trigger GTM consent update; here we only persist.
    window.dispatchEvent(new CustomEvent('uphair:consent', { detail: consent }));
    hideCookie();
  };

  if (cookie) {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(COOKIE_KEY)); } catch { }
    if (!stored) setTimeout(showCookie, 800);

    $('[data-cookie-accept]')?.addEventListener('click', () => saveConsent({ necessary: true, analytics: true, marketing: true }));
    $('[data-cookie-reject]')?.addEventListener('click', () => saveConsent({ necessary: true, analytics: false, marketing: false }));
    $('[data-cookie-customize]')?.addEventListener('click', () => {
      const panel = $('[data-cookie-custom]');
      if (panel) panel.hidden = !panel.hidden;
    });
    $('[data-cookie-save]')?.addEventListener('click', () => {
      const analytics = $('[data-cat="analytics"]')?.checked || false;
      const marketing = $('[data-cat="marketing"]')?.checked || false;
      saveConsent({ necessary: true, analytics, marketing });
    });
  }

  // ─── Search overlay ────────────────────────────────────
  const search = $('#search-overlay');
  const searchInput = search?.querySelector('input[type="search"]');

  const openSearch = () => {
    if (!search) return;
    search.hidden = false;
    requestAnimationFrame(() => search.classList.add('is-open'));
    search.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-drawer-open');
    if (lenis) lenis.stop();
    setTimeout(() => searchInput?.focus(), 100);
  };
  const closeSearch = () => {
    if (!search) return;
    search.classList.remove('is-open');
    search.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-drawer-open');
    if (lenis) lenis.start();
    setTimeout(() => { search.hidden = true; }, 320);
  };

  $('[data-search-open]')?.addEventListener('click', openSearch);
  $$('[data-search-close]').forEach(b => b.addEventListener('click', closeSearch));
  $$('[data-search-link]').forEach(a => a.addEventListener('click', () => closeSearch()));
  $('[data-search-form]')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput?.value.trim();
    if (!q) return;
    // Prototype: just close — would search products/articles in real impl.
    closeSearch();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && search?.classList.contains('is-open')) closeSearch();
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (search?.classList.contains('is-open')) closeSearch(); else openSearch();
    }
  });

  // ─── Account dropdown ──────────────────────────────────
  const accountToggle = $('[data-account-toggle]');
  const accountMenu = $('[data-account-menu]');
  const closeAccount = () => {
    if (!accountMenu) return;
    accountMenu.hidden = true;
    accountToggle?.setAttribute('aria-expanded', 'false');
  };
  accountToggle?.addEventListener('click', e => {
    e.stopPropagation();
    if (!accountMenu) return;
    const isOpen = !accountMenu.hidden;
    if (isOpen) {
      closeAccount();
    } else {
      accountMenu.hidden = false;
      accountToggle.setAttribute('aria-expanded', 'true');
    }
  });
  document.addEventListener('click', e => {
    if (!accountMenu || accountMenu.hidden) return;
    if (!e.target.closest('.account')) closeAccount();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && accountMenu && !accountMenu.hidden) closeAccount();
  });

  // ─── Sticky cart visibility ────────────────────────────
  const stickyCart = $('.sticky-cart');
  const buyAnchor = $('#buy');
  if (stickyCart && buyAnchor && 'IntersectionObserver' in window) {
    // Show sticky cart once user scrolls past hero, hide when buy module is in view
    const hero = $('.hero');
    let pastHero = false;
    let inBuy = false;
    const update = () => {
      if (pastHero && !inBuy) stickyCart.classList.add('is-visible');
      else stickyCart.classList.remove('is-visible');
    };
    new IntersectionObserver(entries => {
      pastHero = !entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(entries => {
      inBuy = entries[0].isIntersecting;
      update();
    }, { threshold: 0.4 }).observe(buyAnchor);
  }

  // ─── Before / After slider ─────────────────────────────
  const ba = $('.ba__slider');
  if (ba) {
    const setPos = clientX => {
      const rect = ba.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      ba.style.setProperty('--ba-pos', (x * 100) + '%');
    };
    let dragging = false;
    const start = e => { dragging = true; setPos(e.touches ? e.touches[0].clientX : e.clientX); };
    const move = e => { if (!dragging) return; setPos(e.touches ? e.touches[0].clientX : e.clientX); };
    const end = () => { dragging = false; };
    ba.addEventListener('mousedown', start);
    ba.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    // click also moves
    ba.addEventListener('click', e => setPos(e.clientX));
  }

  // ─── Single-open FAQ ───────────────────────────────────
  const faqs = $$('.faq__item');
  faqs.forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
    });
  });

  // ─── Year stamp in footer ──────────────────────────────
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ─── Customer Reviews widget ───────────────────────────
  const reviewsList = $('[data-reviews-list]');
  if (reviewsList) {
    const PER_PAGE = 5;

    // date format: YYYY-MM-DD (sortable); displayed as MM/DD/YYYY
    const REVIEWS = [
      {
        name: 'Daniel R.', initials: 'DR', rating: 5, date: '2026-05-10', verified: true, pinned: true,
        body: [
          'I originally started using uphair for my beard, but after a few weeks it became part of my full daily hair routine.',
          'My beard looks fuller, patchy areas started filling in, and my hair overall feels healthier and thicker. The serum is lightweight, absorbs quickly, and doesn’t leave any greasy feeling like most hair oils I’ve tried before.',
          'Definitely one of the best premium hair serums I’ve used for both beard care and overall hair density support.'
        ]
      },
      {
        name: 'Diego M.', initials: 'DM', rating: 5, date: '2026-05-10', verified: true,
        body: [
          'uphair is honestly the first lightweight hair serum that actually feels clean on the scalp.',
          'I’ve tried heavy oils before, but this formula absorbs fast and works perfectly for daily use. After consistent application, my hairline started looking fuller, my temples looked healthier, and I noticed much less shedding overall.',
          'Perfect if you’re looking for a non-greasy scalp serum that supports fuller-looking hair and healthy hair density.'
        ]
      },
      {
        name: 'Stephanie L.', initials: 'SL', rating: 5, date: '2026-05-10', verified: true,
        body: [
          'I’ve tested so many hair growth products over the years, and uphair is the first one I genuinely enjoy using every day.',
          'Within a few weeks my hairline started looking healthier and more full, and overall my hair feels thicker and stronger. I also love how lightweight the serum feels compared to most products made for thinning hair.',
          'The packaging, texture, and overall experience feel much more premium than anything else I’ve tried in this category.'
        ]
      },
      {
        name: 'Rosa M. Mendez', initials: 'RM', rating: 5, date: '2026-01-12', verified: true,
        body: [
          'I originally bought uphair for my son because he works long hours in a kitchen wearing a hat almost every day.',
          'After about a month, I could already see improvement. His hair looks noticeably thicker and healthier, and he’s much more confident now.'
        ]
      },
      {
        name: 'Gabby T.', initials: 'GT', rating: 5, date: '2026-02-19', verified: true,
        body: [
          'I started noticing visible improvement within the first couple of weeks, which honestly surprised me.',
          'My scalp feels healthier, less dry, and my hair already looks fuller around the front. I also love that the serum doesn’t leave my scalp oily.'
        ]
      },
      {
        name: 'Gaston C.', initials: 'GC', rating: 5, date: '2026-02-19', verified: true,
        body: [
          'Excellent product and very premium quality. The serum feels lightweight, smells clean, and fits perfectly into my daily routine.'
        ],
        reply: { author: 'uphair', text: 'Thank you so much, Gaston! We’re thrilled it’s become part of your daily routine.' }
      }
    ];

    const sortEl = $('[data-review-sort]');
    const pagerEl = $('[data-reviews-pager]');
    const breakdownEl = $('[data-breakdown]');
    const avgScoreEl = $('[data-avg-score]');
    const countEl = $('[data-review-count]');

    let page = 1;
    let sort = 'recent';

    const starsMarkup = n =>
      Array.from({ length: 5 }, (_, i) =>
        `<svg${i < n ? '' : ' style="opacity:.25"'}><use href="#i-star" /></svg>`).join('');

    const fmtDate = iso => {
      const [y, m, d] = iso.split('-');
      return `${m}/${d}/${y}`;
    };

    const escapeHtml = s => s.replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const sorted = () => {
      const arr = [...REVIEWS];
      switch (sort) {
        case 'oldest': arr.sort((a, b) => a.date.localeCompare(b.date)); break;
        case 'highest': arr.sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date)); break;
        case 'lowest': arr.sort((a, b) => a.rating - b.rating || b.date.localeCompare(a.date)); break;
        default: arr.sort((a, b) => b.date.localeCompare(a.date)); // recent
      }
      // pinned reviews float to top regardless of sort
      arr.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      return arr;
    };

    const renderSummary = () => {
      const total = REVIEWS.length;
      const avg = total ? REVIEWS.reduce((s, r) => s + r.rating, 0) / total : 0;
      if (avgScoreEl) avgScoreEl.textContent = avg.toFixed(2);
      if (countEl) countEl.textContent = total;
      if (breakdownEl) {
        breakdownEl.innerHTML = [5, 4, 3, 2, 1].map(star => {
          const n = REVIEWS.filter(r => r.rating === star).length;
          const pct = total ? (n / total) * 100 : 0;
          return `
            <div class="breakdown-row">
              <span class="breakdown-row__stars" aria-hidden="true">${starsMarkup(star)}</span>
              <span class="breakdown-row__track"><span class="breakdown-row__fill" style="width:${pct}%"></span></span>
              <span class="breakdown-row__count">${n}</span>
            </div>`;
        }).join('');
      }
    };

    const renderList = () => {
      const data = sorted();
      const pages = Math.max(1, Math.ceil(data.length / PER_PAGE));
      page = Math.min(page, pages);
      const slice = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

      reviewsList.innerHTML = slice.map(r => `
        <li class="review-item">
          <span class="review-item__stars" aria-label="${r.rating} out of 5">${starsMarkup(r.rating)}</span>
          <span class="review-item__date">${fmtDate(r.date)}</span>
          <div class="review-item__author">
            <span class="review-item__avatar"><svg><use href="#i-user" /></svg></span>
            <span class="review-item__name">${escapeHtml(r.name)}</span>
            ${r.verified ? '<span class="review-item__badge">Verified</span>' : ''}
            ${r.pinned ? '<svg class="review-item__pin" aria-label="Pinned review"><use href="#i-pin" /></svg>' : ''}
          </div>
          <div class="review-item__body">
            ${r.body.map(p => `<p>${escapeHtml(p)}</p>`).join('')}
            ${r.reply ? `<div class="review-item__reply"><strong>${escapeHtml(r.reply.author)} replied:</strong><p>${escapeHtml(r.reply.text)}</p></div>` : ''}
          </div>
        </li>`).join('');

      renderPager(pages);
    };

    const renderPager = (pages) => {
      if (!pagerEl) return;
      if (pages <= 1) { pagerEl.innerHTML = ''; return; }
      let html = `<button data-page="prev" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>`;
      for (let i = 1; i <= pages; i++) {
        html += `<button data-page="${i}" class="${i === page ? 'is-active' : ''}" aria-label="Page ${i}"${i === page ? ' aria-current="true"' : ''}>${i}</button>`;
      }
      html += `<button data-page="next" ${page === pages ? 'disabled' : ''} aria-label="Next page">›</button>`;
      pagerEl.innerHTML = html;
    };

    const goToReviews = () => {
      const section = $('#reviews');
      if (!section) return;
      if (lenis) lenis.scrollTo(section, { offset: -80 });
      else section.scrollIntoView({ behavior: 'smooth' });
    };

    pagerEl?.addEventListener('click', e => {
      const btn = e.target.closest('button[data-page]');
      if (!btn) return;
      const v = btn.dataset.page;
      const pages = Math.max(1, Math.ceil(REVIEWS.length / PER_PAGE));
      if (v === 'prev') page = Math.max(1, page - 1);
      else if (v === 'next') page = Math.min(pages, page + 1);
      else page = parseInt(v, 10);
      renderList();
      goToReviews();
    });

    sortEl?.addEventListener('change', () => {
      sort = sortEl.value;
      page = 1;
      renderList();
    });

    // Write-a-review form
    const reviewForm = $('[data-review-form]');
    const writeBtn = $('[data-write-review]');
    const cancelBtn = $('[data-review-cancel]');
    const formStars = $('[data-form-stars]');
    let formRating = 5;

    const paintFormStars = () => {
      $$('button', formStars).forEach((b, i) => b.classList.toggle('is-on', i < formRating));
    };
    if (formStars) {
      paintFormStars();
      formStars.addEventListener('click', e => {
        const b = e.target.closest('button[data-star]');
        if (!b) return;
        formRating = parseInt(b.dataset.star, 10);
        paintFormStars();
      });
    }
    writeBtn?.addEventListener('click', () => {
      if (!reviewForm) return;
      reviewForm.hidden = !reviewForm.hidden;
      if (!reviewForm.hidden) reviewForm.querySelector('input[name="name"]')?.focus();
    });
    cancelBtn?.addEventListener('click', () => { if (reviewForm) reviewForm.hidden = true; });
    reviewForm?.addEventListener('submit', e => {
      e.preventDefault();
      const name = reviewForm.querySelector('input[name="name"]').value.trim();
      const bodyText = reviewForm.querySelector('textarea[name="body"]').value.trim();
      if (!name || !bodyText) return;
      const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
      REVIEWS.unshift({
        name, initials, rating: formRating, date: new Date().toISOString().slice(0, 10),
        verified: false, body: bodyText.split(/\n+/).filter(Boolean)
      });
      reviewForm.reset();
      formRating = 5; paintFormStars();
      reviewForm.hidden = true;
      sort = 'recent'; if (sortEl) sortEl.value = 'recent';
      page = 1;
      renderSummary();
      renderList();
    });

    renderSummary();
    renderList();
  }

  // ─── UGC story carousel ────────────────────────────────
  const ugcTrack = $('[data-ugc-track]');
  if (ugcTrack) {
    const prevBtn = $('[data-ugc-prev]');
    const nextBtn = $('[data-ugc-next]');

    const step = () => {
      const card = ugcTrack.querySelector('.ugc-card');
      if (!card) return ugcTrack.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(ugcTrack).columnGap) || 16;
      return card.offsetWidth + gap;
    };

    const updateArrows = () => {
      const maxScroll = ugcTrack.scrollWidth - ugcTrack.clientWidth - 2;
      if (prevBtn) prevBtn.disabled = ugcTrack.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = ugcTrack.scrollLeft >= maxScroll;
    };

    const scrollByCards = (dir) => {
      ugcTrack.scrollBy({
        left: dir * step(),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    };

    prevBtn?.addEventListener('click', () => scrollByCards(-1));
    nextBtn?.addEventListener('click', () => scrollByCards(1));
    ugcTrack.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });
    updateArrows();

    // Drag-to-scroll (mouse only; touch uses native scroll)
    let isDown = false, startX = 0, startScroll = 0, moved = 0;
    ugcTrack.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      isDown = true;
      moved = 0;
      startX = e.clientX;
      startScroll = ugcTrack.scrollLeft;
      ugcTrack.classList.add('is-dragging');
      ugcTrack.setPointerCapture(e.pointerId);
    });
    ugcTrack.addEventListener('pointermove', e => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      ugcTrack.scrollLeft = startScroll - dx;
    });
    const endDrag = e => {
      if (!isDown) return;
      isDown = false;
      ugcTrack.classList.remove('is-dragging');
      try { ugcTrack.releasePointerCapture(e.pointerId); } catch { }
    };
    ugcTrack.addEventListener('pointerup', endDrag);
    ugcTrack.addEventListener('pointercancel', endDrag);
    // Suppress click (e.g. play button) right after a drag
    ugcTrack.addEventListener('click', e => {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
})();
