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
  const SHOPIFY_VARIANT_ID =
  '54038879011180';

  const getCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY));
      return parsed && typeof parsed.qty === 'number' ? parsed : { qty: 0 };
    } catch (_) {
      return { qty: 0 };
    }
  };

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
        if (document.querySelector('.review-modal-backdrop.open')) closeReviewModal();
        else if (document.querySelector('.all-reviews-modal-backdrop.open')) closeAllReviewsModal();
        else if (document.querySelector('.confirm-backdrop.open')) closeConfirm(false);
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
      `https://phit9f-0y.myshopify.com/cart/` +
      `${SHOPIFY_VARIANT_ID}:${cart.qty}`;

        window.location.assign(checkoutUrl);
      }
    );
  };

  const REVIEW_INITIAL_PAGE_SIZE = 3;

  const getReviews = () => {
    const reviews = Array.isArray(window.LO_KEY_REVIEWS) ? window.LO_KEY_REVIEWS : [];
    const unique = new Map();

    reviews.forEach((review) => {
      if (!review || !Number.isFinite(Number(review.rating))) return;
      const id = String(review.id || `${review.name}-${review.date}-${review.title}`);
      if (!unique.has(id)) unique.set(id, review);
    });

    return [...unique.values()];
  };

  const escapeHTML = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const reviewDateFormatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatReviewDate = (dateValue) => {
    const date = new Date(`${dateValue}T12:00:00`);
    return Number.isNaN(date.getTime()) ? String(dateValue || '') : reviewDateFormatter.format(date);
  };

  const starMarkup = (rating, className = 'review-stars') => {
    const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    const full = '★'.repeat(safeRating);
    const empty = '☆'.repeat(5 - safeRating);
    return `<span class="${className}" aria-label="${safeRating} out of 5 stars">${full}${empty}</span>`;
  };

  const sortReviews = (reviews, mode) => [...reviews].sort((a, b) => {
    const ratingDifference = Number(b.rating) - Number(a.rating);
    const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();

    if (mode === 'top') return ratingDifference || dateDifference;
    if (mode === 'lowest') return -ratingDifference || dateDifference;
    return dateDifference;
  });

  const reviewVerificationMarkup = (review) => {
    if (review.verified) return '<div class="review-verification">Verified Purchase</div>';
    if (review.verificationStatus === 'pending') {
      return '<div class="review-verification review-verification-pending">Verification pending</div>';
    }
    return '<div class="review-verification review-verification-unverified">Purchase not verified</div>';
  };

  const reviewCardMarkup = (review) => `
    <article class="review-card">
      <div class="review-card-top">
        ${starMarkup(review.rating)}
        <time datetime="${escapeHTML(review.date)}">${escapeHTML(formatReviewDate(review.date))}</time>
      </div>
      <h3>${escapeHTML(review.title)}</h3>
      <p class="review-body">${escapeHTML(review.body)}</p>
      <div class="review-author">
        <strong>${escapeHTML(review.name)}</strong>
        <span>${escapeHTML(review.country)}</span>
      </div>
      ${reviewVerificationMarkup(review)}
    </article>`;

  const updateReviewSummary = (reviews) => {
    const count = reviews.length;
    const average = count
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count
      : 0;
    const averageText = count ? average.toFixed(1) : '—';
    const countText = `${count} ${count === 1 ? 'review' : 'reviews'}`;

    document.querySelectorAll('[data-review-average]').forEach((element) => {
      element.textContent = averageText;
    });
    document.querySelectorAll('[data-review-count], [data-review-count-label]').forEach((element) => {
      element.textContent = countText;
    });
    document.querySelectorAll('[data-product-rating]').forEach((element) => {
      element.textContent = averageText;
    });
    document.querySelectorAll('[data-product-stars]').forEach((element) => {
      const rounded = count ? Math.round(average) : 0;
      element.textContent = `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
      element.setAttribute('aria-label', count ? `${averageText} out of 5 stars` : 'No reviews yet');
    });
    document.querySelectorAll('[data-product-review-count]').forEach((element) => {
      element.textContent = `(${countText})`;
    });
    document.querySelectorAll('[data-review-summary-stars]').forEach((element) => {
      element.textContent = count ? `${'★'.repeat(Math.round(average))}${'☆'.repeat(5 - Math.round(average))}` : '☆☆☆☆☆';
      element.setAttribute('aria-label', count ? `${averageText} out of 5 stars` : 'No reviews yet');
    });
  };

  const reviewComponents = new Set();
  let allReviewsLastFocus = null;

  const renderAllReviewsModal = () => {
    const backdrop = document.querySelector('.all-reviews-modal-backdrop');
    if (!backdrop) return;

    const list = backdrop.querySelector('[data-all-reviews-list]');
    const sort = backdrop.querySelector('[data-all-reviews-sort]');
    const count = backdrop.querySelector('[data-all-reviews-count]');
    const averageElement = backdrop.querySelector('[data-all-reviews-average]');
    const starsElement = backdrop.querySelector('[data-all-reviews-stars]');
    const reviews = getReviews();
    const sorted = sortReviews(reviews, sort?.value || 'recent');
    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
      : 0;
    const averageText = reviews.length ? average.toFixed(1) : '—';
    const roundedAverage = reviews.length ? Math.round(average) : 0;

    if (count) count.textContent = `${sorted.length} ${sorted.length === 1 ? 'review' : 'reviews'}`;
    if (averageElement) averageElement.textContent = averageText;
    if (starsElement) {
      starsElement.textContent = `${'★'.repeat(roundedAverage)}${'☆'.repeat(5 - roundedAverage)}`;
      starsElement.setAttribute('aria-label', reviews.length ? `${averageText} out of 5 stars` : 'No reviews yet');
    }
    if (list) {
      list.innerHTML = sorted.length
        ? sorted.map(reviewCardMarkup).join('')
        : '<div class="reviews-empty">No reviews have been published yet.</div>';
    }
  };

  const ensureAllReviewsModal = () => {
    if (document.querySelector('.all-reviews-modal-backdrop')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="all-reviews-modal-backdrop" aria-hidden="true">
        <section class="all-reviews-modal" role="dialog" aria-modal="true" aria-labelledby="all-reviews-modal-title">
          <div class="all-reviews-modal-header">
            <div>
              <p class="eyebrow">Customer feedback</p>
              <h2 id="all-reviews-modal-title">All reviews</h2>
              <div class="all-reviews-modal-rating" aria-label="Overall customer rating">
                <span class="review-stars-large" data-all-reviews-stars aria-hidden="true">☆☆☆☆☆</span>
                <strong data-all-reviews-average>—</strong>
                <span data-all-reviews-count>0 reviews</span>
              </div>
            </div>
            <button class="all-reviews-modal-close" type="button" aria-label="Close all reviews">×</button>
          </div>
          <div class="all-reviews-modal-toolbar">
            <label class="review-sort-label">Sort reviews
              <select class="review-sort" data-all-reviews-sort>
                <option value="recent">Most recent</option>
                <option value="top">Top rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </label>
            <button class="review-write-button" type="button" data-open-review-from-all>Write a review</button>
          </div>
          <div class="all-reviews-list" data-all-reviews-list aria-live="polite"></div>
        </section>
      </div>
    `);

    const backdrop = document.querySelector('.all-reviews-modal-backdrop');
    backdrop?.addEventListener('click', (event) => {
      if (event.target === backdrop) closeAllReviewsModal();
    });
    backdrop?.querySelector('.all-reviews-modal-close')?.addEventListener('click', closeAllReviewsModal);
    backdrop?.querySelector('[data-all-reviews-sort]')?.addEventListener('change', renderAllReviewsModal);
    backdrop?.querySelector('[data-open-review-from-all]')?.addEventListener('click', () => {
      closeAllReviewsModal(false);
      openReviewModal();
    });
  };

  const openAllReviewsModal = (sortMode = 'recent') => {
    ensureAllReviewsModal();
    const backdrop = document.querySelector('.all-reviews-modal-backdrop');
    if (!backdrop) return;

    allReviewsLastFocus = document.activeElement;
    const sort = backdrop.querySelector('[data-all-reviews-sort]');
    if (sort) sort.value = sortMode;
    renderAllReviewsModal();

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => backdrop.querySelector('.all-reviews-modal-close')?.focus(), 60);
  };

  function closeAllReviewsModal(restoreFocus = true) {
    const backdrop = document.querySelector('.all-reviews-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (restoreFocus) allReviewsLastFocus?.focus?.();
  }

  const renderReviewComponent = (state) => {
    const reviews = getReviews();
    const sorted = sortReviews(reviews, state.sort?.value || 'recent');
    const visibleReviews = sorted.slice(0, state.pageSize);

    state.list.innerHTML = visibleReviews.length
      ? visibleReviews.map(reviewCardMarkup).join('')
      : '<div class="reviews-empty">No reviews have been published yet.</div>';

    if (state.showing) {
      state.showing.textContent = `Showing ${visibleReviews.length} of ${sorted.length}`;
    }

    if (state.showAllWrap && state.showAllButton) {
      state.showAllWrap.hidden = sorted.length === 0;
      state.showAllButton.textContent = 'Show all reviews';
    }

    if (state.demoNotice) {
      state.demoNotice.hidden = !reviews.some((review) => review.demo === true);
    }
  };

  const renderAllReviews = () => {
    const reviews = getReviews();
    updateReviewSummary(reviews);
    reviewComponents.forEach(renderReviewComponent);
    if (document.querySelector('.all-reviews-modal-backdrop.open')) renderAllReviewsModal();
  };

  const initializeReviews = () => {
    document.querySelectorAll('[data-reviews-component]').forEach((component) => {
      const list = component.querySelector('[data-review-list]');
      if (!list) return;

      const pageSize = Math.max(1, Number(component.dataset.reviewPageSize) || REVIEW_INITIAL_PAGE_SIZE);
      const state = {
        component,
        list,
        pageSize,
        sort: component.querySelector('[data-review-sort]'),
        showing: component.querySelector('[data-review-showing]'),
        showAllWrap: component.querySelector('[data-review-show-all-wrap]'),
        showAllButton: component.querySelector('[data-review-show-all]'),
        demoNotice: component.querySelector('[data-demo-review-notice]')
      };

      state.sort?.addEventListener('change', () => renderReviewComponent(state));
      state.showAllButton?.addEventListener('click', () => {
        openAllReviewsModal(state.sort?.value || 'recent');
      });

      reviewComponents.add(state);
    });

    ensureAllReviewsModal();
    renderAllReviews();
  };

  let reviewModalLastFocus = null;

  const ensureReviewModal = () => {
    if (document.querySelector('.review-modal-backdrop')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="review-modal-backdrop" aria-hidden="true">
        <section class="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div class="review-modal-header">
            <div>
              <p class="eyebrow">Share your experience</p>
              <h2 id="review-modal-title">Write a review</h2>
            </div>
            <button class="review-modal-close" type="button" aria-label="Close review form">×</button>
          </div>
          <form class="review-form" data-review-form>
            <fieldset class="review-rating-fieldset">
              <legend>Your rating</legend>
              <div class="review-star-picker" aria-label="Choose a star rating">
                <input type="radio" id="review-star-5" name="rating" value="5" required><label for="review-star-5" title="5 stars">★</label>
                <input type="radio" id="review-star-4" name="rating" value="4"><label for="review-star-4" title="4 stars">★</label>
                <input type="radio" id="review-star-3" name="rating" value="3"><label for="review-star-3" title="3 stars">★</label>
                <input type="radio" id="review-star-2" name="rating" value="2"><label for="review-star-2" title="2 stars">★</label>
                <input type="radio" id="review-star-1" name="rating" value="1"><label for="review-star-1" title="1 star">★</label>
              </div>
            </fieldset>

            <div class="review-form-grid">
              <label>Display name
                <input name="name" autocomplete="name" maxlength="60" required>
              </label>
              <label>Country
                <input name="country" autocomplete="country-name" maxlength="60" placeholder="Canada" required>
              </label>
            </div>

            <label>Review title
              <input name="title" maxlength="90" required>
            </label>

            <label>Your review
              <textarea name="body" rows="5" maxlength="1200" required></textarea>
            </label>

            <div class="review-form-grid">
              <label>Order number <span>(for verification)</span>
                <input name="orderNumber" autocomplete="off" maxlength="40" placeholder="#1001">
              </label>
              <label>Purchase email <span>(for verification)</span>
                <input name="email" type="email" autocomplete="email" maxlength="120">
              </label>
            </div>

            <p class="review-form-note">An order number alone does not create the Verified Purchase label. In production, the order number and purchase email are checked securely against Shopify before publication.</p>
            <p class="review-form-status" data-review-form-status aria-live="polite"></p>

            <div class="review-form-actions">
              <button class="review-form-cancel" type="button">Cancel</button>
              <button class="btn btn-primary" type="submit">Submit review</button>
            </div>
          </form>
        </section>
      </div>
    `);

    const backdrop = document.querySelector('.review-modal-backdrop');
    const form = backdrop?.querySelector('[data-review-form]');

    backdrop?.addEventListener('click', (event) => {
      if (event.target === backdrop) closeReviewModal();
    });
    backdrop?.querySelector('.review-modal-close')?.addEventListener('click', closeReviewModal);
    backdrop?.querySelector('.review-form-cancel')?.addEventListener('click', closeReviewModal);
    form?.addEventListener('submit', submitReviewForm);
  };

  const openReviewModal = (prefill = {}) => {
    ensureReviewModal();
    const backdrop = document.querySelector('.review-modal-backdrop');
    const form = backdrop?.querySelector('[data-review-form]');
    if (!backdrop || !form) return;

    reviewModalLastFocus = document.activeElement;
    if (prefill.orderNumber) form.elements.orderNumber.value = prefill.orderNumber;
    if (prefill.email) form.elements.email.value = prefill.email;

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => form.querySelector('input[name="rating"]')?.focus(), 60);
  };

  function closeReviewModal() {
    const backdrop = document.querySelector('.review-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    reviewModalLastFocus?.focus?.();
  }

  async function submitReviewForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector('[data-review-form-status]');
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const endpoint = String(window.LO_KEY_REVIEW_API || '').trim();

    if (!form.reportValidity()) return;

    if (!endpoint) {
      if (status) {
        status.textContent = 'Review submission is not connected yet. Set LO_KEY_REVIEW_API to your review endpoint.';
      }
      return;
    }

    submitButton.disabled = true;
    if (status) status.textContent = 'Submitting…';

    try {
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Review submission failed.');

      const result = await response.json();
      const review = result.review;
      if (!review) throw new Error('The review service returned an invalid response.');

      if (!Array.isArray(window.LO_KEY_REVIEWS)) window.LO_KEY_REVIEWS = [];
      window.LO_KEY_REVIEWS.unshift(review);

      reviewComponents.forEach((state) => {
        if (state.sort) state.sort.value = 'recent';
      });
      renderAllReviews();
      form.reset();
      closeReviewModal();
      showToast('Thank you. Your review has been submitted.');
    } catch (error) {
      if (status) status.textContent = error.message || 'The review could not be submitted.';
    } finally {
      submitButton.disabled = false;
    }
  }

  const initializeReviewForm = () => {
    ensureReviewModal();
    document.querySelectorAll('[data-open-review]').forEach((button) => {
      button.addEventListener('click', () => openReviewModal());
    });

    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get('order') || params.get('order_number') || params.get('orderNumber') || '';
    const email = params.get('email') || '';
    const shouldOpen = ['1', 'true', 'yes'].includes(String(params.get('review') || params.get('write_review') || '').toLowerCase());

    if (shouldOpen) {
      openReviewModal({ orderNumber, email });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initializeReviews();
    initializeReviewForm();

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
