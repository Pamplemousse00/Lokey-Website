(() => {
  'use strict';

  const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });
  const CART_KEY = 'lokey-cart-v1';
  const product = {
    id: 'lokey-cr2032',
    name: 'Lo-Key Smart Battery',
    price: 29.99,
    image: 'assets/exploded-lokey.webp',
    subtitle: 'CR2032-compatible motion-sleep battery'
  };





  const getCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY));
      return parsed && typeof parsed.qty === 'number' ? parsed : { qty: 0 };
    } catch (_) {
      return { qty: 0 };
    }
  };

  const SHOPIFY_VARIANT_ID = '54038879011180';
  const SHOPIFY_STORE =
  `https://phit9f-0y.myshopify.com/cart/` +
  `${SHOPIFY_VARIANT_ID}:${getCart()}`;

  const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  };

  const showToast = (message) => {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  let confirmResolver = null;

  const closeConfirm = (result = false) => {
    const backdrop = document.querySelector('.confirm-backdrop');
    backdrop?.classList.remove('open');
    backdrop?.setAttribute('aria-hidden', 'true');
    const resolve = confirmResolver;
    confirmResolver = null;
    if (resolve) resolve(result);
  };

  const ensureConfirmUI = () => {
    if (document.querySelector('.confirm-backdrop')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="confirm-backdrop" aria-hidden="true">
        <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="remove-title" aria-describedby="remove-description">
          <h2 id="remove-title">Remove Lo-Key from your cart?</h2>
          <p id="remove-description">Reducing the quantity to zero will remove this item.</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" type="button">Keep it</button>
            <button class="confirm-remove" type="button">Remove</button>
          </div>
        </section>
      </div>
    `);
    const backdrop = document.querySelector('.confirm-backdrop');
    backdrop?.addEventListener('click', (event) => {
      if (event.target === backdrop) closeConfirm(false);
    });
    document.querySelector('.confirm-cancel')?.addEventListener('click', () => closeConfirm(false));
    document.querySelector('.confirm-remove')?.addEventListener('click', () => closeConfirm(true));
  };

  const confirmRemoval = () => {
    ensureConfirmUI();
    return new Promise((resolve) => {
      confirmResolver = resolve;
      const backdrop = document.querySelector('.confirm-backdrop');
      backdrop?.classList.add('open');
      backdrop?.setAttribute('aria-hidden', 'false');
      setTimeout(() => document.querySelector('.confirm-cancel')?.focus(), 60);
    });
  };

  const ensureCartUI = () => {
    if (document.querySelector('.cart-drawer')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="cart-backdrop" aria-hidden="true"></div>
      <aside class="cart-drawer" aria-label="Shopping cart" aria-hidden="true">
        <div class="cart-head">
          <h2>Your cart</h2>
          <button class="cart-close" type="button" aria-label="Close cart">×</button>
        </div>
        <div class="cart-body"></div>
        <div class="cart-foot"></div>
      </aside>
    `);

    document.querySelector('.cart-backdrop').addEventListener('click', closeCart);
    document.querySelector('.cart-close').addEventListener('click', closeCart);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (document.querySelector('.confirm-backdrop.open')) closeConfirm(false);
        else closeCart();
      }
    });
  };

  const openCart = () => {
    ensureCartUI();
    renderCart();
    document.querySelector('.cart-backdrop').classList.add('open');
    const drawer = document.querySelector('.cart-drawer');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => document.querySelector('.cart-close')?.focus(), 100);
  };

  function closeCart() {
    document.querySelector('.cart-backdrop')?.classList.remove('open');
    const drawer = document.querySelector('.cart-drawer');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  const renderCart = () => {
    ensureCartUI();
    const cart = getCart();
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = String(cart.qty);
      el.hidden = cart.qty === 0;
    });

    const body = document.querySelector('.cart-body');
    const foot = document.querySelector('.cart-foot');
    if (!body || !foot) return;

    if (cart.qty <= 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div>
            <div style="font-size:2.6rem;margin-bottom:12px">◯</div>
            <strong style="display:block;color:#081321;margin-bottom:6px">Your cart is empty</strong>
            <span>Add Lo-Key to keep it here while you browse.</span>
          </div>
        </div>`;
      foot.innerHTML = `<a class="btn btn-dark btn-block" href="product.html">View Lo-Key</a>`;
      return;
    }

    body.innerHTML = `
      <article class="cart-item">
        <div class="cart-item-image"><img src="${product.image}" alt="Lo-Key smart battery concept rendering"></div>
        <div>
          <h3>${product.name}</h3>
          <div class="cart-item-meta">${product.subtitle}</div>
          <div class="cart-item-actions">
            <div class="cart-mini-qty" aria-label="Quantity controls">
              <button type="button" data-cart-action="decrease" aria-label="Decrease quantity">−</button>
              <span>${cart.qty}</span>
              <button type="button" data-cart-action="increase" aria-label="Increase quantity">+</button>
            </div>
            <strong>${money.format(product.price * cart.qty)}</strong>
          </div>
          <button class="remove-item" type="button" data-cart-action="remove">Remove</button>
        </div>
      </article>`;

    foot.innerHTML = `
      <div class="cart-total"><span>Subtotal</span><span>${money.format(product.price * cart.qty)}</span></div>
      <button class="btn btn-primary btn-block" type="button" data-checkout>Proceed to checkout</button>
      <p class="cart-note">Front-end demo cart. Connect this button to Shopify, Stripe, or another checkout when ready.</p>`;

    body.querySelectorAll('[data-cart-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.cartAction;
        const current = getCart();

        if (action === 'increase') {
          current.qty += 1;
        }

        if (action === 'decrease') {
          if (current.qty === 1) {
            const remove = await confirmRemoval();
            if (!remove) return;
            current.qty = 0;
          } else {
            current.qty = Math.max(0, current.qty - 1);
          }
        }

        if (action === 'remove') {
          const remove = await confirmRemoval();
          if (!remove) return;
          current.qty = 0;
        }

        saveCart(current);
      });
    });

    foot.querySelector('[data-checkout]')?.addEventListener(
      'click',
      () => {
        const cart = getCart();

        if (cart.qty < 1) {
          return;
        }

        const checkoutUrl =
          `${SHOPIFY_STORE}/cart/` +
          `${SHOPIFY_VARIANT_ID}:${cart.qty}` +
          `?channel=buy_button`;

        window.location.assign(checkoutUrl);
      }
    );
  };

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const announcement = document.querySelector('.announcement');
    const updateHeader = () => {
      if (!header) return;
      const announcementHeight = announcement?.offsetHeight || 0;
      const remainingOffset = Math.max(0, announcementHeight - window.scrollY);
      header.style.setProperty('--header-top', `${remainingOffset}px`);
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    menuToggle?.addEventListener('click', () => {
      const isOpen = navLinks?.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    });
    navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle?.classList.remove('active');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }));

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.14 })
      : null;
    document.querySelectorAll('.reveal').forEach((el) => observer ? observer.observe(el) : el.classList.add('visible'));

    document.querySelectorAll('.faq-question').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        const answer = item?.querySelector('.faq-answer');
        const opening = !item?.classList.contains('open');
        item?.classList.toggle('open', opening);
        button.setAttribute('aria-expanded', String(opening));
        if (answer) answer.style.maxHeight = opening ? `${answer.scrollHeight}px` : '0px';
      });
    });

    document.querySelectorAll('.purchase-box').forEach((box) => {
      const qtyInput = box.querySelector('[data-quantity-input]');
      box.querySelectorAll('[data-qty]').forEach((button) => {
        button.addEventListener('click', () => {
          if (!qtyInput) return;
          const next = Math.max(1, Math.min(20, Number(qtyInput.value || 1) + Number(button.dataset.qty)));
          qtyInput.value = String(next);
        });
      });

      box.querySelector('[data-add-to-cart]')?.addEventListener('click', () => {
        const amount = Math.max(1, Math.min(20, Number(qtyInput?.value || 1)));
        const cart = getCart();
        cart.qty += amount;
        saveCart(cart);
        showToast(`${amount} ${amount === 1 ? 'Lo-Key' : 'Lo-Keys'} added to cart.`);
        openCart();
      });
    });

    document.querySelectorAll('[data-open-cart]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        openCart();
      });
    });

    document.querySelectorAll('[data-compatibility]').forEach((button) => {
      button.addEventListener('click', () => {
        const choice = button.dataset.compatibility;
        if (choice === 'cr2032') {
          showToast('Good starting point. Confirm the compartment has enough clearance for the finished Lo-Key unit.');
        } else {
          showToast('Check the marking on your current key-fob battery before ordering.');
        }
      });
    });

    ensureCartUI();
    renderCart();
  });
})();
