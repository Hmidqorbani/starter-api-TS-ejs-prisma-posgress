// dashboard.js — AJAX برای خواندن Settings در پنل کاربر
(function () {
  "use strict";

  const refreshBtn = document.getElementById("refresh-settings");
  const tableBody = document.querySelector("#settings-table tbody") || document.querySelector(".table tbody");

  async function fetchSettings() {
    try {
      const res = await fetch("/api/v1/example-crud/", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "خطا در دریافت تنظیمات");
      return data.data.items || [];
    } catch (err) {
      console.error("❌ خطا در fetchSettings:", err);
      return null;
    }
  }

  function renderSettings(settings) {
    if (!tableBody) return;
    if (!settings || settings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">هیچ تنظیماتی یافت نشد</td></tr>';
      return;
    }
    tableBody.innerHTML = settings
      .map(
        (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><code>${escapeHtml(s.key)}</code></td>
        <td>${escapeHtml(s.value)}</td>
        <td>${escapeHtml(s.description || "-")}</td>
      </tr>
    `
      )
      .join("");
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """)
      .replace(/'/g, "&#039;");
  }

  async function handleRefresh() {
    if (!refreshBtn) return;
    refreshBtn.disabled = true;
    refreshBtn.textContent = "⏳ در حال بارگذاری...";

    const settings = await fetchSettings();
    if (settings !== null) {
      renderSettings(settings);
    } else {
      alert("خطا در دریافت تنظیمات. لطفاً دوباره تلاش کنید.");
    }

    refreshBtn.disabled = false;
    refreshBtn.textContent = "🔄 بروزرسانی";
  }

  // Event listeners
  if (refreshBtn) {
    refreshBtn.addEventListener("click", handleRefresh);
  }

  // Initial load (optional - page already has data from SSR)
  // handleRefresh();
})();