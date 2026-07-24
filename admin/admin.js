(() => {
  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const adminKeyInput = document.getElementById("adminKey");
  const adminActorInput = document.getElementById("adminActor");
  const adminSession = document.getElementById("adminSession");
  const adminActorDisplay = document.getElementById("adminActorDisplay");
  const loginStatus = document.getElementById("loginStatus");
  const dashboardStatus = document.getElementById("dashboardStatus");
  const reviewList = document.getElementById("reviewList");
  const vehicleRequestList = document.getElementById("vehicleRequestList");
  const batteryChart = document.getElementById("batteryChart");
  const compatibilityForm = document.getElementById("compatibilityForm");
  const compatibilityYear = document.getElementById("compatibilityYear");
  const compatibilityMake = document.getElementById("compatibilityMake");
  const compatibilityModel = document.getElementById("compatibilityModel");
  const compatibilityStatus = document.getElementById("compatibilityStatus");
  const compatibilityBattery = document.getElementById("compatibilityBattery");
  const compatibilityBatteryChoices = document.getElementById("compatibilityBatteryChoices");
  const compatibilityStatusMessage = document.getElementById("compatibilityStatusMessage");
  const compatibilityRecordList = document.getElementById("compatibilityRecordList");
  const compatibilityRecordCount = document.getElementById("compatibilityRecordCount");
  const refreshButton = document.getElementById("refreshButton");
  const logoutButton = document.getElementById("logoutButton");
  const auditLogList = document.getElementById("auditLogList");
  const exportActions = document.getElementById("exportActions");
  const exportStatus = document.getElementById("exportStatus");

  let vehicleRequests = [];
  let compatibilityRecords = [];
  let compatibilityCatalogue = null;

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
  const getActor = () => sessionStorage.getItem("lokeyAdminActor") || "";

  async function api(path, options = {}) {
    const key = getKey();
    const response = await fetch(path, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
        "X-Admin-Actor": getActor(),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  }

  function renderMetrics(metrics = {}) {
    document.getElementById("cartEventCount").textContent = Number(metrics.addEvents || 0).toLocaleString("en-CA");
    document.getElementById("cartUnitCount").textContent = Number(metrics.unitsAdded || 0).toLocaleString("en-CA");
    document.getElementById("cart24hCount").textContent = Number(metrics.events24h || 0).toLocaleString("en-CA");
    document.getElementById("cart7dCount").textContent = Number(metrics.events7d || 0).toLocaleString("en-CA");
  }

  const actionLabel = (action) => ({
    "review.approved": "Review approved",
    "review.approved_verified": "Review approved + verified",
    "review.rejected": "Review rejected",
    "vehicle_request.deleted": "Vehicle request deleted",
    "compatibility.created": "Compatibility created",
    "compatibility.updated": "Compatibility updated",
    "compatibility.deleted": "Compatibility deleted",
  }[action] || String(action || "").replaceAll("_", " ").replaceAll(".", " · "));

  function renderAuditLog(entries) {
    auditLogList.innerHTML = entries.length
      ? entries.map((entry) => `
          <tr>
            <td>${escapeHTML(dateText(entry.created_at))}</td>
            <td><strong>${escapeHTML(entry.actor)}</strong></td>
            <td>${escapeHTML(actionLabel(entry.action))}</td>
            <td>${escapeHTML(`${entry.entity_type || "record"}${entry.entity_id ? ` #${entry.entity_id}` : ""}`)}</td>
            <td>${escapeHTML(entry.summary)}</td>
          </tr>
        `).join("")
      : '<tr><td colspan="5">No admin changes have been recorded yet.</td></tr>';
  }

  async function refreshAuditLog() {
    const result = await api("/api/admin/audit-log");
    renderAuditLog(result.entries || []);
  }

  async function downloadCsv(dataset, button) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing…";
    exportStatus.textContent = "";
    try {
      const response = await fetch(`/api/admin/export/${encodeURIComponent(dataset)}`, {
        headers: {
          Accept: "text/csv",
          Authorization: `Bearer ${getKey()}`,
          "X-Admin-Actor": getActor(),
        },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Export failed (${response.status}).`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `lokey-${dataset}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      exportStatus.textContent = `${filename} downloaded.`;
      exportStatus.classList.add("success");
    } catch (error) {
      exportStatus.textContent = error.message;
      exportStatus.classList.remove("success");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
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
        <p class="review-vehicle-admin">Vehicle: ${escapeHTML(review.vehicle || "Not provided")}</p>
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

  const batteryNames = (value) => {
    const text = String(value || "").trim();
    const matches = text.match(/\b(?:CR|BR|DL|ECR|LIR)\s*-?\s*\d{4}\b/gi) || [];
    const normalized = matches.map((item) => item.toUpperCase().replace(/[\s-]+/g, ""));
    if (normalized.length) return [...new Set(normalized)];
    if (text && !/^unknown$/i.test(text)) return [...new Set(text.split(/[,+/&]|\bor\b/gi).map((item) => item.trim()).filter(Boolean))];
    return [];
  };

  const allowedCompatibilityBatteries = new Set(["CR2016", "CR2025", "CR2032", "CR2450"]);

  const selectedCompatibilityBatteries = () => [...compatibilityBatteryChoices.querySelectorAll(".battery-choice[aria-pressed='true']")]
    .map((button) => button.dataset.batterySize)
    .filter((size) => allowedCompatibilityBatteries.has(size));

  function syncCompatibilityBatteryValue() {
    compatibilityBattery.value = selectedCompatibilityBatteries().join(" + ");
  }

  function setCompatibilityBatteries(values) {
    const selected = new Set((Array.isArray(values) ? values : batteryNames(values))
      .map((value) => String(value).toUpperCase().replace(/[\s-]+/g, ""))
      .filter((value) => allowedCompatibilityBatteries.has(value)));

    compatibilityBatteryChoices.querySelectorAll(".battery-choice").forEach((button) => {
      const active = selected.has(button.dataset.batterySize);
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-selected", active);
    });
    syncCompatibilityBatteryValue();
  }

  function renderBatteryChart(requests) {
    const counts = new Map();
    requests.forEach((request) => {
      batteryNames(request.battery_sizes).forEach((size) => {
        counts.set(size, (counts.get(size) || 0) + 1);
      });
    });

    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!entries.length) {
      batteryChart.innerHTML = '<div class="empty">No battery sizes have been recorded yet.</div>';
      return;
    }

    const max = Math.max(...entries.map(([, count]) => count), 1);
    batteryChart.innerHTML = entries.map(([size, count]) => `
      <div class="battery-bar-row">
        <span class="battery-bar-label">${escapeHTML(size)}</span>
        <div class="battery-bar-track" aria-label="${escapeHTML(size)}: ${count} requests">
          <div class="battery-bar-fill" style="width:${Math.max(4, (count / max) * 100)}%"></div>
        </div>
        <span class="battery-bar-count">${count}</span>
      </div>
    `).join("");
  }

  function renderVehicleRequests(requests) {
    vehicleRequests = requests;
    renderBatteryChart(requests);
    vehicleRequestList.innerHTML = requests.length
      ? requests.map((request) => `
          <tr data-vehicle-request-id="${Number(request.id)}">
            <td>${escapeHTML(dateText(request.submitted_at))}</td>
            <td>${escapeHTML(request.year)}</td>
            <td>${escapeHTML(request.make)}</td>
            <td>${escapeHTML(request.model)}</td>
            <td>${escapeHTML(request.battery_sizes || "Unknown")}</td>
            <td>${escapeHTML(request.status)}</td>
            <td>
              <div class="row-actions">
                <button class="row-action use" data-request-action="use" type="button">Use</button>
                <button class="row-action delete" data-request-action="delete" type="button">Delete</button>
              </div>
            </td>
          </tr>
        `).join("")
      : '<tr><td colspan="7">No vehicle requests yet.</td></tr>';
  }

  const statusLabel = (status) => ({
    verified: "Yes",
    compatible: "Probably",
    conditional: "Probably",
    incompatible: "No",
  }[status] || status);

  function renderCompatibilityRecords(records) {
    compatibilityRecords = records;
    compatibilityRecordCount.textContent = `${records.length} ${records.length === 1 ? "record" : "records"}`;
    compatibilityRecordList.innerHTML = records.length
      ? records.map((record) => `
          <tr data-compatibility-id="${Number(record.id)}">
            <td>${escapeHTML(`${record.year} ${record.make} ${record.model}`)}</td>
            <td>${escapeHTML(record.battery_sizes)}</td>
            <td><span class="status-badge status-${escapeHTML(record.status)}">${escapeHTML(statusLabel(record.status))}</span></td>
            <td>${escapeHTML(dateText(record.updated_at))}</td>
            <td><button class="row-action delete" data-compatibility-action="delete" type="button">Delete</button></td>
          </tr>
        `).join("")
      : '<tr><td colspan="5">No compatibility decisions saved yet.</td></tr>';
  }

  const fillSelect = (select, values, placeholder) => {
    select.innerHTML = `<option value="">${escapeHTML(placeholder)}</option>` +
      values.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
  };

  async function loadCompatibilityCatalogue() {
    if (compatibilityCatalogue) return compatibilityCatalogue;
    const response = await fetch("../compatibility-data.json", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Could not load the vehicle catalogue.");
    compatibilityCatalogue = await response.json();
    const years = Array.isArray(compatibilityCatalogue.years) ? compatibilityCatalogue.years.map(String) : [];
    fillSelect(compatibilityYear, years, "Select year");
    return compatibilityCatalogue;
  }

  const makesForYear = (year) => (compatibilityCatalogue?.makes || [])
    .filter((make) => make.models.some((model) => year >= Number(model.from) && year <= Number(model.to)))
    .map((make) => make.name)
    .sort((a, b) => a.localeCompare(b));

  const modelsFor = (year, makeName) => {
    const make = (compatibilityCatalogue?.makes || []).find((entry) => entry.name === makeName);
    if (!make) return [];
    return [...new Set(make.models
      .filter((model) => year >= Number(model.from) && year <= Number(model.to))
      .map((model) => model.name))]
      .sort((a, b) => a.localeCompare(b));
  };

  function populateMakes() {
    const year = Number(compatibilityYear.value);
    fillSelect(compatibilityMake, year ? makesForYear(year) : [], "Select make");
    fillSelect(compatibilityModel, [], "Select model");
    compatibilityMake.disabled = !year;
    compatibilityModel.disabled = true;
  }

  function populateModels() {
    const year = Number(compatibilityYear.value);
    const make = compatibilityMake.value;
    fillSelect(compatibilityModel, year && make ? modelsFor(year, make) : [], "Select model");
    compatibilityModel.disabled = !(year && make);
  }

  const ensureOption = (select, value) => {
    if (!value) return;
    if (![...select.options].some((option) => option.value === String(value))) {
      select.add(new Option(String(value), String(value)));
    }
  };

  async function useVehicleRequest(request) {
    await loadCompatibilityCatalogue();
    ensureOption(compatibilityYear, request.year);
    compatibilityYear.value = String(request.year);
    populateMakes();
    ensureOption(compatibilityMake, request.make);
    compatibilityMake.value = request.make;
    populateModels();
    ensureOption(compatibilityModel, request.model);
    compatibilityModel.value = request.model;
    setCompatibilityBatteries(request.battery_sizes || "");
    compatibilityStatus.value = "";
    compatibilityStatusMessage.textContent = "Vehicle request loaded. Choose Yes, Probably, or No.";
    compatibilityStatusMessage.classList.remove("success");
    document.getElementById("compatibilityManager").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadDashboard() {
    dashboardStatus.textContent = "Loading…";
    try {
      await loadCompatibilityCatalogue();
      const [reviewResult, vehicleResult, compatibilityResult, metricResult, auditResult] = await Promise.all([
        api("/api/admin/reviews?status=pending"),
        api("/api/admin/vehicle-requests"),
        api("/api/admin/compatibility"),
        api("/api/admin/cart-metrics"),
        api("/api/admin/audit-log"),
      ]);
      renderReviews(reviewResult.reviews || []);
      renderVehicleRequests(vehicleResult.requests || []);
      renderCompatibilityRecords(compatibilityResult.records || []);
      renderMetrics(metricResult.metrics || {});
      renderAuditLog(auditResult.entries || []);
      adminActorDisplay.textContent = `Signed in as ${getActor()}`;
      dashboardStatus.textContent = "";
      loginCard.hidden = true;
      dashboard.hidden = false;
      adminSession.hidden = false;
    } catch (error) {
      dashboardStatus.textContent = error.message;
      loginStatus.textContent = error.message;
      loginCard.hidden = false;
      dashboard.hidden = true;
      adminSession.hidden = true;
      throw error;
    }
  }

  compatibilityYear.addEventListener("change", populateMakes);
  compatibilityMake.addEventListener("change", populateModels);

  compatibilityBatteryChoices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-battery-size]");
    if (!button) return;
    const active = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-selected", active);
    syncCompatibilityBatteryValue();
    if (selectedCompatibilityBatteries().length) {
      compatibilityStatusMessage.textContent = "";
      compatibilityStatusMessage.classList.remove("success");
    }
  });

  compatibilityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!compatibilityForm.reportValidity()) return;
    const selectedBatteries = selectedCompatibilityBatteries();
    if (!selectedBatteries.length) {
      compatibilityStatusMessage.textContent = "Select at least one key-fob battery size.";
      compatibilityStatusMessage.classList.remove("success");
      compatibilityBatteryChoices.querySelector(".battery-choice")?.focus();
      return;
    }
    const submit = compatibilityForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    compatibilityStatusMessage.textContent = "Saving…";
    compatibilityStatusMessage.classList.remove("success");
    try {
      const result = await api("/api/admin/compatibility", {
        method: "POST",
        body: JSON.stringify({
          year: Number(compatibilityYear.value),
          make: compatibilityMake.value,
          model: compatibilityModel.value,
          status: compatibilityStatus.value,
          batterySizes: selectedBatteries.join(" + "),
        }),
      });
      const existingIndex = compatibilityRecords.findIndex((record) => Number(record.id) === Number(result.record.id));
      if (existingIndex >= 0) compatibilityRecords.splice(existingIndex, 1);
      compatibilityRecords.unshift(result.record);
      renderCompatibilityRecords(compatibilityRecords);
      compatibilityStatusMessage.textContent = result.message || "Compatibility decision saved.";
      compatibilityStatusMessage.classList.add("success");
      refreshAuditLog().catch(() => {});
    } catch (error) {
      compatibilityStatusMessage.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Checking…";
    sessionStorage.setItem("lokeyAdminApiKey", adminKeyInput.value.trim());
    sessionStorage.setItem("lokeyAdminActor", adminActorInput.value.trim());
    try {
      await loadDashboard();
      loginStatus.textContent = "";
      adminKeyInput.value = "";
    } catch {
      sessionStorage.removeItem("lokeyAdminApiKey");
      sessionStorage.removeItem("lokeyAdminActor");
    }
  });

  refreshButton.addEventListener("click", () => loadDashboard().catch(() => {}));

  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("lokeyAdminApiKey");
    sessionStorage.removeItem("lokeyAdminActor");
    dashboard.hidden = true;
    loginCard.hidden = false;
    adminSession.hidden = true;
    loginStatus.textContent = "Admin key and identity removed from this browser session.";
  });

  exportActions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-export]");
    if (!button) return;
    downloadCsv(button.dataset.export, button);
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
        await api(`/api/admin/reviews/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
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
      refreshAuditLog().catch(() => {});
    } catch (error) {
      dashboardStatus.textContent = error.message;
      button.disabled = false;
    }
  });

  vehicleRequestList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-request-action]");
    const row = button?.closest("[data-vehicle-request-id]");
    if (!button || !row) return;
    const id = Number(row.dataset.vehicleRequestId);
    const request = vehicleRequests.find((item) => Number(item.id) === id);
    if (!request) return;

    if (button.dataset.requestAction === "use") {
      useVehicleRequest(request).catch((error) => { dashboardStatus.textContent = error.message; });
      return;
    }

    if (!window.confirm(`Delete the request for ${request.year} ${request.make} ${request.model}?`)) return;
    button.disabled = true;
    try {
      await api(`/api/admin/vehicle-requests/${id}`, { method: "DELETE" });
      renderVehicleRequests(vehicleRequests.filter((item) => Number(item.id) !== id));
      dashboardStatus.textContent = "Vehicle request deleted.";
      refreshAuditLog().catch(() => {});
    } catch (error) {
      dashboardStatus.textContent = error.message;
      button.disabled = false;
    }
  });

  compatibilityRecordList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-compatibility-action='delete']");
    const row = button?.closest("[data-compatibility-id]");
    if (!button || !row) return;
    const id = Number(row.dataset.compatibilityId);
    const record = compatibilityRecords.find((item) => Number(item.id) === id);
    if (!window.confirm(`Delete the compatibility decision for ${record?.year || ""} ${record?.make || ""} ${record?.model || ""}?`)) return;
    button.disabled = true;
    try {
      await api(`/api/admin/compatibility/${id}`, { method: "DELETE" });
      renderCompatibilityRecords(compatibilityRecords.filter((item) => Number(item.id) !== id));
      compatibilityStatusMessage.textContent = "Compatibility decision deleted.";
      compatibilityStatusMessage.classList.add("success");
      refreshAuditLog().catch(() => {});
    } catch (error) {
      compatibilityStatusMessage.textContent = error.message;
      compatibilityStatusMessage.classList.remove("success");
      button.disabled = false;
    }
  });

  if (getKey() && getActor()) {
    loadDashboard().catch(() => {});
  } else {
    sessionStorage.removeItem("lokeyAdminApiKey");
    sessionStorage.removeItem("lokeyAdminActor");
  }
})();
