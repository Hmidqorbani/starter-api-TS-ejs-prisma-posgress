// admin.js — AJAX برای پنل ادمین (کاربران و تنظیمات)
(function () {
  "use strict";

  const API_PREFIX = "/api/v1/example-admin";
  const CRUD_PREFIX = "/api/v1/example-crud";

  // ============ Users ============
  const roleSelects = document.querySelectorAll(".role-select");
  const activeToggles = document.querySelectorAll(".active-toggle");

  async function updateUserRole(userId, role) {
    try {
      const res = await fetch(`${API_PREFIX}/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "خطا در تغییر نقش");
      return true;
    } catch (err) {
      console.error("❌ خطا در updateUserRole:", err);
      return false;
    }
  }

  async function updateUserActive(userId, isActive) {
    try {
      const res = await fetch(`${API_PREFIX}/users/${userId}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "خطا در تغییر وضعیت");
      return true;
    } catch (err) {
      console.error("❌ خطا در updateUserActive:", err);
      return false;
    }
  }

  function showToast(message, type = "error") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `alert alert-${type === "error" ? "error" : "success"}`;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "20px";
    toast.style.zIndex = "2000";
    toast.style.minWidth = "280px";
    toast.style.boxShadow = "var(--shadow-lg)";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Event delegation for role changes
  document.addEventListener("change", async (e) => {
    if (e.target.matches(".role-select")) {
      const userId = e.target.dataset.userId;
      const role = e.target.value;
      const ok = await updateUserRole(userId, role);
      if (!ok) {
        showToast("خطا در تغییر نقش. لطفاً دوباره تلاش کنید.", "error");
        // Revert select
        e.target.value = role === "user" ? "admin" : "user";
      } else {
        showToast("نقش با موفقیت تغییر کرد.", "success");
      }
    }

    if (e.target.matches(".active-toggle")) {
      const userId = e.target.dataset.userId;
      const isActive = e.target.checked;
      const ok = await updateUserActive(userId, isActive);
      if (!ok) {
        showToast("خطا در تغییر وضعیت. لطفاً دوباره تلاش کنید.", "error");
        e.target.checked = !isActive;
      } else {
        // Update status indicator
        const indicator = e.target.closest("tr").querySelector(".status-indicator");
        if (indicator) {
          indicator.className = `status-indicator ${isActive ? "active" : "inactive"}`;
        }
        showToast("وضعیت با موفقیت تغییر کرد.", "success");
      }
    }
  });

  // ============ Settings ============
  const addSettingBtn = document.getElementById("add-setting-btn");
  const settingModal = document.getElementById("setting-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelModalBtn = document.getElementById("cancel-modal");
  const settingForm = document.getElementById("setting-form");
  const modalTitle = document.getElementById("modal-title");
  const settingsTbody = document.getElementById("settings-tbody");

  let editingSettingId = null;

  function openModal(setting = null) {
    editingSettingId = setting?.id || null;
    modalTitle.textContent = setting ? "✏️ ویرایش تنظیمات" : "➕ افزودن تنظیمات جدید";
    settingForm.reset();
    document.getElementById("setting-id").value = setting?.id || "";
    document.getElementById("setting-key").value = setting?.key || "";
    document.getElementById("setting-value").value = setting?.value || "";
    document.getElementById("setting-desc").value = setting?.description || "";
    document.getElementById("setting-key").disabled = !!setting; // key editable only on create
    settingModal.style.display = "flex";
    document.getElementById("setting-key").focus();
  }

  function closeModal() {
    settingModal.style.display = "none";
    editingSettingId = null;
  }

  async function saveSetting(formData) {
    const isEdit = !!editingSettingId;
    const url = isEdit ? `${CRUD_PREFIX}/${editingSettingId}` : CRUD_PREFIX;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "خطا در ذخیره");
      return data.data;
    } catch (err) {
      console.error("❌ خطا در saveSetting:", err);
      throw err;
    }
  }

  async function deleteSetting(id) {
    try {
      const res = await fetch(`${CRUD_PREFIX}/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "خطا در حذف");
      return true;
    } catch (err) {
      console.error("❌ خطا در deleteSetting:", err);
      return false;
    }
  }

  function renderSettingRow(setting, index) {
    const tr = document.createElement("tr");
    tr.dataset.settingId = setting.id;
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><code>${escapeHtml(setting.key)}</code></td>
      <td><input type="text" class="input setting-value" value="${escapeHtml(setting.value)}" data-setting-id="${setting.id}"></td>
      <td><input type="text" class="input setting-desc" value="${escapeHtml(setting.description || "")}" data-setting-id="${setting.id}"></td>
      <td>
        <button type="button" class="btn btn-ghost btn-sm save-setting" data-setting-id="${setting.id}">💾 ذخیره</button>
        <button type="button" class="btn btn-danger btn-sm delete-setting" data-setting-id="${setting.id}">🗑️ حذف</button>
      </td>
    `;
    return tr;
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

  // Event listeners for settings
  if (addSettingBtn) {
    addSettingBtn.addEventListener("click", () => openModal());
  }
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
  if (settingModal) {
    settingModal.addEventListener("click", (e) => {
      if (e.target === settingModal) closeModal();
    });
  }

  if (settingForm) {
    settingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = {
        key: document.getElementById("setting-key").value.trim(),
        value: document.getElementById("setting-value").value,
        description: document.getElementById("setting-desc").value.trim(),
      };
      if (!formData.key) {
        showToast("کلید الزامی است.", "error");
        return;
      }

      const submitBtn = settingForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ در حال ذخیره...";

      try {
        const saved = await saveSetting(formData);
        closeModal();
        showToast(editingSettingId ? "تنظیمات با موفقیت آپدیت شد." : "تنظیمات با موفقیت افزوده شد.", "success");

        if (!editingSettingId) {
          // Add new row
          const index = settingsTbody ? settingsTbody.children.length : 0;
          const newRow = renderSettingRow({ ...saved, id: saved.id }, index);
          if (settingsTbody) settingsTbody.appendChild(newRow);
        } else {
          // Update existing row
          const row = settingsTbody?.querySelector(`tr[data-setting-id="${editingSettingId}"]`);
          if (row) {
            row.querySelector("td:nth-child(2)").innerHTML = `<code>${escapeHtml(saved.key)}</code>`;
            row.querySelector(".setting-value").value = saved.value;
            row.querySelector(".setting-desc").value = saved.description || "";
          }
        }
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "ذخیره";
      }
    });
  }

  // Delegate save/delete for inline setting rows
  if (settingsTbody) {
    settingsTbody.addEventListener("click", async (e) => {
      const saveBtn = e.target.closest(".save-setting");
      const deleteBtn = e.target.closest(".delete-setting");

      if (saveBtn) {
        const id = saveBtn.dataset.settingId;
        const row = saveBtn.closest("tr");
        const value = row.querySelector(".setting-value").value;
        const description = row.querySelector(".setting-desc").value;

        saveBtn.disabled = true;
        saveBtn.textContent = "⏳";

        try {
          const res = await fetch(`${CRUD_PREFIX}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ value, description }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error?.message || "خطا در ذخیره");
          showToast("تنظیمات با موفقیت آپدیت شد.", "success");
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = "💾 ذخیره";
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.settingId;
        if (!confirm("آیا از حذف این تنظیمات مطمئن هستید؟")) return;

        deleteBtn.disabled = true;
        deleteBtn.textContent = "⏳";

        const ok = await deleteSetting(id);
        if (ok) {
          const row = deleteBtn.closest("tr");
          row.remove();
          showToast("تنظیمات حذف شد.", "success");
          // Re-index rows
          if (settingsTbody) {
            [...settingsTbody.children].forEach((r, i) => {
              r.cells[0].textContent = i + 1;
            });
          }
        } else {
          showToast("خطا در حذف تنظیمات.", "error");
          deleteBtn.disabled = false;
          deleteBtn.textContent = "🗑️ حذف";
        }
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && settingModal?.style.display === "flex") {
      closeModal();
    }
  });
})();