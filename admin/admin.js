(() => {
  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const adminKeyInput = document.getElementById("adminKey");
  const loginStatus = document.getElementById("loginStatus");
  const dashboardStatus = document.getElementById("dashboardStatus");
  const reviewList = document.getElementById("reviewList");
  const vehicleRequestList = document.getElementById("vehicleRequestList");
  const refreshButton = document.getElementById("refreshButton");
  const logoutButton = document.getElementById("logoutButton");

  const escapeHTML = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const dateText = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value || "") : date.toLocaleString("en-CA");
  };

  const getKey = () => sessionStorage.getItem("lokeyAdminApiKey") || "";

  async function api(path, options = {}) {
    const key = getKey();
    const response = await fetch(path, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  }

  function renderReviews(reviews) {
    if (!reviews.length) {
      reviewList.innerHTML = '<div class="empty">No pending reviews.</div>';
      return;
    }

    reviewList.innerHTML = reviews.map((review) => `
      <article class="review-admin-card" data-review-id="${Number(review.id)}">
        <div class="review-meta">
          <span class="review-stars">${"★".repeat(Number(review.rating) || 0)}${"☆".repeat(5 - (Number(review.rating) || 0))}</span>
          <strong>${escapeHTML(review.name)}</strong>
          <span>${escapeHTML(review.country)}</span>
          <span>${escapeHTML(dateText(review.created_at))}</span>
        </div>
        <h3>${escapeHTML(review.title)}</h3>
        <blockquote>${escapeHTML(review.body)}</blockquote>
        <div class="review-private">
          <span><strong>Order:</strong> ${escapeHTML(review.order_number || "Not provided")}</span>
          <span><strong>Email:</strong> ${escapeHTML(review.purchase_email || "Not provided")}</span>
        </div>
        <div class="review-actions">
          <button class="approve" data-action="approve" type="button">Approve</button>
          <button class="approve-verified" data-action="approve-verified" type="button">Approve + verified</button>
          <button class="reject" data-action="reject" type="button">Reject</button>
        </div>
      </article>
    `).join("");
  }

  function renderVehicleRequests(requests) {
    vehicleRequestList.innerHTML = requests.length
      ? requests.map((request) => `
          <tr>
            <td>${escapeHTML(dateText(request.submitted_at))}</td>
            <td>${escapeHTML(request.year)}</td>
            <td>${escapeHTML(request.make)}</td>
            <td>${escapeHTML(request.model)}</td>
            <td>${escapeHTML(request.status)}</td>
          </tr>
        `).join("")
      : '<tr><td colspan="5">No vehicle requests yet.</td></tr>';
  }

  async function loadDashboard() {
    dashboardStatus.textContent = "Loading…";
    try {
      const [reviewResult, vehicleResult] = await Promise.all([
        api("/api/admin/reviews?status=pending"),
        api("/api/admin/vehicle-requests"),
      ]);
      renderReviews(reviewResult.reviews || []);
      renderVehicleRequests(vehicleResult.requests || []);
      dashboardStatus.textContent = "";
      loginCard.hidden = true;
      dashboard.hidden = false;
      logoutButton.hidden = false;
    } catch (error) {
      dashboardStatus.textContent = error.message;
      loginStatus.textContent = error.message;
      loginCard.hidden = false;
      dashboard.hidden = true;
      logoutButton.hidden = true;
      throw error;
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Checking…";
    sessionStorage.setItem("lokeyAdminApiKey", adminKeyInput.value.trim());
    try {
      await loadDashboard();
      loginStatus.textContent = "";
      adminKeyInput.value = "";
    } catch {
      sessionStorage.removeItem("lokeyAdminApiKey");
    }
  });

  refreshButton.addEventListener("click", () => loadDashboard().catch(() => {}));

  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("lokeyAdminApiKey");
    dashboard.hidden = true;
    loginCard.hidden = false;
    logoutButton.hidden = true;
    loginStatus.textContent = "Admin key removed from this browser session.";
  });

  reviewList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    const card = button?.closest("[data-review-id]");
    if (!button || !card) return;

    const id = Number(card.dataset.reviewId);
    const action = button.dataset.action;
    button.disabled = true;
    dashboardStatus.textContent = "Saving…";

    try {
      if (action === "reject") {
        await api(`/api/admin/reviews/${id}/reject`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      } else {
        await api(`/api/admin/reviews/${id}/approve`, {
          method: "POST",
          body: JSON.stringify({ verified: action === "approve-verified" }),
        });
      }
      card.remove();
      if (!reviewList.querySelector("[data-review-id]")) {
        reviewList.innerHTML = '<div class="empty">No pending reviews.</div>';
      }
      dashboardStatus.textContent = action === "reject" ? "Review rejected." : "Review approved.";
    } catch (error) {
      dashboardStatus.textContent = error.message;
      button.disabled = false;
    }
  });

  if (getKey()) loadDashboard().catch(() => {});
})();
