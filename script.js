(() => {
  'use strict';

  const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });
  const CART_KEY = 'lokey-cart-v1';
  const SHOPIFY_VARIANT_ID = '54038879011180';
  const product = {
    id: 'lokey-cr2032',
    name: 'Lo-Key Anti-Theft CR2032 Battery',
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
        if (document.querySelector('.vehicle-request-modal-backdrop.open')) closeVehicleRequestModal();
        else if (document.querySelector('.review-modal-backdrop.open')) closeReviewModal();
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

      const overview = component.querySelector('.reviews-overview');
      if (overview) {
        overview.setAttribute('role', 'button');
        overview.setAttribute('tabindex', '0');
        overview.setAttribute('aria-label', 'Show all customer reviews');
        const openFromOverview = (event) => {
          event?.preventDefault?.();
          openAllReviewsModal(state.sort?.value || 'recent');
        };
        overview.addEventListener('click', openFromOverview);
        overview.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFromOverview(event);
          }
        });
      }

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


  const getProductImages = () => {
    const images = Array.isArray(window.LO_KEY_PRODUCT_IMAGES)
      ? window.LO_KEY_PRODUCT_IMAGES
      : [];

    return images.filter((image) => image && image.src);
  };

  const preloadProductImages = (images) => {
    images.forEach((image) => {
      const preload = new Image();
      preload.src = image.src;
    });
  };

  const initializeProductGallery = () => {
    const gallery = document.querySelector('[data-product-gallery]');
    if (!gallery) return;

    const images = getProductImages();
    if (!images.length) return;

    const mainImage = gallery.querySelector('[data-product-main-image]');
    const label = gallery.querySelector('[data-product-image-label]');
    const thumbnails = gallery.querySelector('[data-product-thumbnails]');
    const imageCard = gallery.querySelector('.product-image-card');
    const zoomPreview = gallery.querySelector('[data-product-zoom]');
    const zoomLens = gallery.querySelector('[data-product-zoom-lens]');
    if (!mainImage || !thumbnails) return;

    preloadProductImages(images);

    let selectedIndex = -1;

    const selectImage = (index) => {
      const image = images[index];
      if (!image || index === selectedIndex) return;
      selectedIndex = index;

      mainImage.classList.add('is-changing');
      window.setTimeout(() => {
        mainImage.src = image.src;
        mainImage.alt = image.alt || 'Lo-Key product image';
        if (zoomPreview) zoomPreview.style.backgroundImage = `url("${image.src}")`;
        if (label) label.textContent = image.label || 'Product image';
        thumbnails.querySelectorAll('[data-product-image-index]').forEach((button) => {
          const active = Number(button.dataset.productImageIndex) === index;
          button.classList.toggle('active', active);
          button.setAttribute('aria-current', active ? 'true' : 'false');
        });
        mainImage.classList.remove('is-changing');
      }, 70);
    };

    thumbnails.innerHTML = images.map((image, index) => `
      <button class="product-thumbnail${index === 0 ? ' active' : ''}" type="button"
        data-product-image-index="${index}"
        aria-label="Show ${escapeHTML(image.label || `product image ${index + 1}`)}"
        aria-current="${index === 0 ? 'true' : 'false'}">
        <img src="${escapeHTML(image.src)}" alt="">
      </button>
    `).join('');

    thumbnails.querySelectorAll('[data-product-image-index]').forEach((button) => {
      const index = Number(button.dataset.productImageIndex);
      button.addEventListener('mouseenter', () => selectImage(index));
      button.addEventListener('focus', () => selectImage(index));
      button.addEventListener('click', () => selectImage(index));
    });

    if (imageCard && zoomPreview) {
      const hideZoom = () => {
        zoomPreview.classList.remove('visible');
        zoomPreview.setAttribute('aria-hidden', 'true');
        zoomLens?.classList.remove('visible');
      };

      const updateZoom = (event) => {
        if (event.pointerType === 'touch') return;

        const cardRect = imageCard.getBoundingClientRect();
        const imageRect = mainImage.getBoundingClientRect();
        const lensWidth = zoomLens?.offsetWidth || 124;
        const lensHeight = zoomLens?.offsetHeight || 124;

        /*
         * Work from the rendered image bounds rather than the surrounding
         * card. The card contains empty space above and below some product
         * images, so using the card percentages made the preview drift near
         * the edges even though it looked correct in the centre.
         */
        const pointerX = event.clientX - imageRect.left;
        const pointerY = event.clientY - imageRect.top;
        const isOverRenderedImage = pointerX >= 0 && pointerX <= imageRect.width &&
          pointerY >= 0 && pointerY <= imageRect.height;

        if (!isOverRenderedImage) {
          hideZoom();
          return;
        }

        const lensLeftInImage = Math.max(
          0,
          Math.min(imageRect.width - lensWidth, pointerX - lensWidth / 2)
        );
        const lensTopInImage = Math.max(
          0,
          Math.min(imageRect.height - lensHeight, pointerY - lensHeight / 2)
        );

        if (zoomLens) {
          zoomLens.style.left = `${imageRect.left - cardRect.left + lensLeftInImage}px`;
          zoomLens.style.top = `${imageRect.top - cardRect.top + lensTopInImage}px`;
        }

        /*
         * The preview and lens use the same aspect ratio. Scale the complete
         * rendered image by the preview-to-lens ratio, then offset that image
         * by the exact lens position. This makes every pixel in the preview
         * correspond to the highlighted square, including at the top/bottom.
         */
        const scaleX = zoomPreview.clientWidth / lensWidth;
        const scaleY = zoomPreview.clientHeight / lensHeight;
        zoomPreview.style.backgroundSize =
          `${imageRect.width * scaleX}px ${imageRect.height * scaleY}px`;
        zoomPreview.style.backgroundPosition =
          `${-lensLeftInImage * scaleX}px ${-lensTopInImage * scaleY}px`;

        zoomPreview.classList.add('visible');
        zoomPreview.setAttribute('aria-hidden', 'false');
        zoomLens?.classList.add('visible');
      };

      imageCard.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch') return;
        updateZoom(event);
      });

      imageCard.addEventListener('pointermove', updateZoom);
      imageCard.addEventListener('pointerleave', hideZoom);
    }

    selectImage(0);
  };

  const initializeProductCarousel = () => {
    const carousel = document.querySelector('[data-product-carousel]');
    if (!carousel) return;

    const images = getProductImages();
    if (!images.length) return;

    const imageElement = carousel.querySelector('[data-carousel-image]');
    const label = carousel.querySelector('[data-carousel-label]');
    const dots = carousel.querySelector('[data-carousel-dots]');
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    if (!imageElement || !dots) return;

    preloadProductImages(images);

    let currentIndex = 0;
    let timer = null;
    let manuallyPaused = false;

    const update = (index) => {
      currentIndex = (index + images.length) % images.length;
      const image = images[currentIndex];

      imageElement.classList.add('is-changing');
      window.setTimeout(() => {
        imageElement.src = image.src;
        imageElement.alt = image.alt || 'Lo-Key product image';
        if (label) label.textContent = image.label || 'Product image';
        dots.querySelectorAll('[data-carousel-index]').forEach((dot) => {
          const active = Number(dot.dataset.carouselIndex) === currentIndex;
          dot.classList.toggle('active', active);
          dot.setAttribute('aria-current', active ? 'true' : 'false');
        });
        imageElement.classList.remove('is-changing');
      }, 130);
    };

    const stopRotation = () => {
      manuallyPaused = true;
      if (timer) window.clearInterval(timer);
      timer = null;
      carousel.classList.add('is-paused');
    };

    const startRotation = () => {
      if (manuallyPaused || images.length < 2) return;
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => update(currentIndex + 1), 4600);
    };

    dots.innerHTML = images.map((image, index) => `
      <button class="product-carousel-dot${index === 0 ? ' active' : ''}" type="button"
        data-carousel-index="${index}"
        aria-label="Show ${escapeHTML(image.label || `product image ${index + 1}`)}"
        aria-current="${index === 0 ? 'true' : 'false'}"></button>
    `).join('');

    previous?.addEventListener('click', () => {
      stopRotation();
      update(currentIndex - 1);
    });

    next?.addEventListener('click', () => {
      stopRotation();
      update(currentIndex + 1);
    });

    dots.querySelectorAll('[data-carousel-index]').forEach((dot) => {
      dot.addEventListener('click', () => {
        stopRotation();
        update(Number(dot.dataset.carouselIndex));
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (timer) window.clearInterval(timer);
        timer = null;
      } else {
        startRotation();
      }
    });

    update(0);
    startRotation();
  };


  const normalizeVehicleValue = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const compatibilityFallback = () => {
    const data = window.LO_KEY_COMPATIBILITY_FALLBACK;
    return data && Array.isArray(data.makes) ? data : { years: [], makes: [] };
  };

  const requestCompatibilityData = async (query = {}) => {
    const url = new URL('compatibility-data.json', window.location.href);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Compatibility request failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      return compatibilityFallback();
    }
  };

  const compatibilityCopyFor = (status) => {
    const configured = window.LO_KEY_COMPATIBILITY_MESSAGES?.[status];
    if (configured?.lead && configured?.message) {
      return {
        lead: String(configured.lead),
        message: String(configured.message)
      };
    }

    return {
      lead: 'Not confirmed.',
      message: 'Compatibility information is not available for this selection.'
    };
  };

  const normalizedCompatibilityStatus = (status, battery = '') => {
    const value = String(status || '').toLowerCase();
    if (['verified', 'compatible', 'conditional', 'incompatible'].includes(value)) return value;

    const normalizedBattery = String(battery || '').trim().toUpperCase();
    if (value === 'untested' && normalizedBattery === 'CR2032') return 'compatible';
    if (value === 'untested' && normalizedBattery.includes('CR2032')) return 'conditional';
    return 'unknown';
  };

  let vehicleRequestLastFocus = null;

  const ensureVehicleRequestModal = () => {
    if (document.querySelector('.vehicle-request-modal-backdrop')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="vehicle-request-modal-backdrop" aria-hidden="true">
        <section class="vehicle-request-modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-request-modal-title">
          <div class="vehicle-request-modal-header">
            <div>
              <p class="eyebrow">Help expand compatibility</p>
              <h2 id="vehicle-request-modal-title">Request a vehicle</h2>
            </div>
            <button class="vehicle-request-modal-close" type="button" aria-label="Close vehicle request form">×</button>
          </div>

          <p class="vehicle-request-modal-intro">Tell us which vehicle you would like added to the compatibility list.</p>

          <form class="vehicle-request-form" data-vehicle-request-form>
            <div class="vehicle-request-form-grid">
              <label>Year
                <input name="year" type="number" inputmode="numeric" min="1980" max="2035" placeholder="2024" required>
              </label>
              <label>Make
                <input name="make" autocomplete="organization" maxlength="60" placeholder="Toyota" required>
              </label>
            </div>

            <label>Model
              <input name="model" maxlength="80" placeholder="RAV4" required>
            </label>

            <p class="vehicle-request-form-note">Submitting a request does not confirm compatibility. It tells us which vehicle and key fob to research or test next.</p>
            <p class="vehicle-request-form-status" data-vehicle-request-status aria-live="polite"></p>

            <div class="vehicle-request-form-actions">
              <button class="vehicle-request-form-cancel" type="button">Cancel</button>
              <button class="btn btn-primary" type="submit">Submit request</button>
            </div>
          </form>
        </section>
      </div>
    `);

    const backdrop = document.querySelector('.vehicle-request-modal-backdrop');
    const form = backdrop?.querySelector('[data-vehicle-request-form]');

    backdrop?.addEventListener('click', (event) => {
      if (event.target === backdrop) closeVehicleRequestModal();
    });
    backdrop?.querySelector('.vehicle-request-modal-close')?.addEventListener('click', closeVehicleRequestModal);
    backdrop?.querySelector('.vehicle-request-form-cancel')?.addEventListener('click', closeVehicleRequestModal);
    form?.addEventListener('submit', submitVehicleRequestForm);
  };

  const openVehicleRequestModal = () => {
    ensureVehicleRequestModal();
    const backdrop = document.querySelector('.vehicle-request-modal-backdrop');
    const form = backdrop?.querySelector('[data-vehicle-request-form]');
    if (!backdrop || !form) return;

    vehicleRequestLastFocus = document.activeElement;

    const selectedYear = document.querySelector('[data-vehicle-year]')?.value || '';
    const selectedMake = document.querySelector('[data-vehicle-make]')?.value || '';
    const selectedModel = document.querySelector('[data-vehicle-model]')?.value || '';
    if (selectedYear) form.elements.year.value = selectedYear;
    if (selectedMake) form.elements.make.value = selectedMake;
    if (selectedModel) form.elements.model.value = selectedModel;

    const status = form.querySelector('[data-vehicle-request-status]');
    if (status) status.textContent = '';

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    const firstEmpty = [...form.querySelectorAll('input')].find((input) => !input.value);
    setTimeout(() => (firstEmpty || form.elements.year)?.focus(), 60);
  };

  function closeVehicleRequestModal() {
    const backdrop = document.querySelector('.vehicle-request-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    vehicleRequestLastFocus?.focus?.();
  }

  async function submitVehicleRequestForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector('[data-vehicle-request-status]');
    const submitButton = form.querySelector('button[type="submit"]');
    const endpoint = String(window.LO_KEY_VEHICLE_REQUEST_API || '').trim();

    if (!form.reportValidity()) return;

    if (!endpoint) {
      if (status) status.textContent = 'Vehicle requests are not connected yet. Set LO_KEY_VEHICLE_REQUEST_API in vehicle-request-config.js.';
      return;
    }

    const formData = new FormData(form);
    const payload = {
      year: Number(formData.get('year')),
      make: String(formData.get('make') || '').trim(),
      model: String(formData.get('model') || '').trim(),
      source: 'compatibility-request',
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href
    };

    submitButton.disabled = true;
    if (status) status.textContent = 'Submitting…';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('The vehicle request could not be submitted. Please try again.');

      form.reset();
      closeVehicleRequestModal();
      showToast('Thanks. Your vehicle request has been submitted.');
    } catch (error) {
      if (status) status.textContent = error.message || 'The vehicle request could not be submitted.';
    } finally {
      submitButton.disabled = false;
    }
  }

  const initializeVehicleRequestForm = () => {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-open-vehicle-request]');
      if (!button) return;
      event.preventDefault();
      openVehicleRequestModal();
    });
  };

  const initializeCompatibilityChecker = async () => {
    const checker = document.querySelector('[data-vehicle-checker]');
    if (!checker) return;

    const form = checker.querySelector('[data-vehicle-form]');
    const result = checker.querySelector('[data-vehicle-result]');
    const yearSelect = checker.querySelector('[data-vehicle-year]');
    const makeSelect = checker.querySelector('[data-vehicle-make]');
    const modelSelect = checker.querySelector('[data-vehicle-model]');
    if (!form || !result || !yearSelect || !makeSelect || !modelSelect) return;

    let data = await requestCompatibilityData();
    if (!Array.isArray(data.makes)) data = compatibilityFallback();

    const fillSelect = (select, values, placeholder) => {
      select.innerHTML = `<option value="" selected disabled>${escapeHTML(placeholder)}</option>` +
        values.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('');
    };

    const availableMakesForYear = (year) => data.makes
      .filter((make) => make.models.some((model) => year >= Number(model.from) && year <= Number(model.to)))
      .map((make) => make.name)
      .sort((a, b) => a.localeCompare(b));

    const availableModels = (year, makeName) => {
      const make = data.makes.find((entry) => entry.name === makeName);
      if (!make) return [];
      return [...new Set(make.models
        .filter((model) => year >= Number(model.from) && year <= Number(model.to))
        .map((model) => model.name))]
        .sort((a, b) => a.localeCompare(b));
    };

    const years = Array.isArray(data.years) && data.years.length
      ? data.years
      : Array.from({ length: 31 }, (_, index) => 2026 - index);
    fillSelect(yearSelect, years.map(String), 'Select year');
    fillSelect(makeSelect, [], 'Select make');
    fillSelect(modelSelect, [], 'Select model');
    makeSelect.disabled = true;
    modelSelect.disabled = true;

    yearSelect.addEventListener('change', () => {
      const year = Number(yearSelect.value);
      fillSelect(makeSelect, availableMakesForYear(year), 'Select make');
      fillSelect(modelSelect, [], 'Select model');
      makeSelect.disabled = false;
      modelSelect.disabled = true;
      result.hidden = true;
    });

    makeSelect.addEventListener('change', () => {
      const year = Number(yearSelect.value);
      fillSelect(modelSelect, availableModels(year, makeSelect.value), 'Select model');
      modelSelect.disabled = false;
      result.hidden = true;
    });

    const showResult = (status, lead, message, detail = '') => {
      result.className = `vehicle-result vehicle-result-${status}`;
      result.hidden = false;
      const requestButton = status === 'incompatible'
        ? `<button class="vehicle-request-button vehicle-result-request" data-open-vehicle-request type="button">Request a vehicle</button>`
        : '';
      result.innerHTML = `
        <div class="vehicle-result-heading"><strong>${escapeHTML(lead)}</strong><span>${escapeHTML(message)}</span></div>
        ${detail ? `<span class="vehicle-result-detail">${escapeHTML(detail)}</span>` : ''}
        ${requestButton}`;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const year = Number(yearSelect.value);
      const make = makeSelect.value;
      const model = modelSelect.value;
      if (!year || !make || !model) return;

      result.className = 'vehicle-result vehicle-result-loading';
      result.hidden = false;
      result.textContent = 'Checking compatibility…';

      const response = await requestCompatibilityData({ year, make, model });
      if (response?.result) {
        const item = response.result;
        const battery = item.keyFobBattery || item.battery || '';
        const status = normalizedCompatibilityStatus(item.status, battery);
        const copy = compatibilityCopyFor(status);
        const visualStatus = status === 'verified'
          ? 'verified'
          : status === 'incompatible'
            ? 'incompatible'
            : 'untested';
        showResult(
          visualStatus,
          copy.lead,
          copy.message,
          battery ? `Listed key-fob battery: ${battery}` : ''
        );
        return;
      }

      const rules = Array.isArray(data.batteryRules) ? data.batteryRules : [];
      const selectedMake = normalizeVehicleValue(make);
      const selectedModel = normalizeVehicleValue(model);
      const rule = rules.find((entry) =>
        normalizeVehicleValue(entry.make) === selectedMake &&
        normalizeVehicleValue(entry.model) === selectedModel &&
        year >= Number(entry.from) &&
        year <= Number(entry.to)
      );

      if (rule) {
        const status = normalizedCompatibilityStatus(rule.status, rule.battery);
        const copy = compatibilityCopyFor(status);
        const visualStatus = status === 'verified'
          ? 'verified'
          : status === 'incompatible'
            ? 'incompatible'
            : 'untested';
        showResult(
          visualStatus,
          copy.lead,
          copy.message,
          rule.battery ? `Listed key-fob battery: ${rule.battery}` : ''
        );
        return;
      }

      const makeEntry = data.makes.find((entry) => entry.name === make);
      const modelEntry = makeEntry?.models.find((entry) => entry.name === model && year >= Number(entry.from) && year <= Number(entry.to));
      if (modelEntry) {
        const copy = compatibilityCopyFor('unknown');
        showResult('untested', copy.lead, copy.message, `${year} ${make} ${model}`);
      } else {
        const copy = compatibilityCopyFor('unlisted');
        showResult('untested', copy.lead, copy.message);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initializeReviews();
    initializeReviewForm();
    initializeProductGallery();
    initializeProductCarousel();
    initializeCompatibilityChecker();
    initializeVehicleRequestForm();

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
        const compatibilitySection = document.getElementById('compatibility');
        compatibilitySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          document.querySelector('[data-vehicle-year]')?.focus({ preventScroll: true });
        }, 650);
      });
    });

    ensureCartUI();
    renderCart();
  });
})();
