/**
 * ==========================================================
 * APP.JS - Main Application Orchestrator & User CRUD Manager
 * ==========================================================
 */

import { AuthService } from './auth.js';
import { ApiService } from './apiService.js';
import { StatCardsModule } from './statCards.js';
import { GridEngine } from './gridEngine.js';

let cachedUsersList = [];

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = AuthService.getCurrentUser();
  const bankSettings = AuthService.getBankSettings();

  updateBankHeader(bankSettings);

  if (!currentUser) {
    showLoginModal();
    return;
  }

  if (AuthService.isHeadArea()) {
    const btnSet = document.getElementById("btn-open-settings");
    if (btnSet) {
      btnSet.classList.remove("hidden");
      btnSet.addEventListener("click", () => openSettingsModal());
    }
  }

  renderAppShell(currentUser);

  try {
    showLoading(true);
    const result = await ApiService.fetchData();
    
    if (result.settings) {
      AuthService.saveBankSettingsLocal(result.settings);
      updateBankHeader(result.settings);
    }

    if (result.users) {
      cachedUsersList = result.users;
    }

    StatCardsModule.updateMetrics(result.data);
    GridEngine.initGrid("myGrid", result.data);
    showLoading(false);
  } catch (error) {
    showLoading(false);
    console.error("Gagal memuat data aplikasi:", error);
  }

  bindButtons();
});

function showLoginModal() {
  const settings = AuthService.getBankSettings();
  const modalHtml = `
    <div id="login-modal" class="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-700">
        <div class="text-center mb-6">
          <h2 class="text-lg font-bold text-red-700 uppercase tracking-wide">${settings.bank_name || 'BANK DAILY UNIT REPORTING'}</h2>
          <p class="text-xs text-slate-500 mt-1">Masukkan Email & Password Perbankan Anda untuk masuk.</p>
        </div>
        <form id="form-login" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email Perbankan</label>
            <input type="email" id="login-email" required placeholder="bebeng@k2c.com" class="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Password Login</label>
            <input type="password" id="login-password" required placeholder="••••••••" class="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none" />
          </div>
          <button type="submit" class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-md cursor-pointer">
            Masuk ke Portal
          </button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      showLoading(true);
      await AuthService.loginWithCredentials(email, password);
      window.location.reload();
    } catch (err) {
      showLoading(false);
      alert("Gagal Login: " + err.message);
    }
  });
}

function updateBankHeader(settings) {
  if (!settings) return;
  const elName = document.getElementById("header-bank-name");
  const elKcp = document.getElementById("header-kcp-info");
  if (elName) elName.innerText = settings.bank_name || "BANK DAILY UNIT REPORTING";
  if (elKcp) elKcp.innerText = settings.kcp_info || "Enterprise Reporting Portal";
}

async function openSettingsModal() {
  const modal = document.getElementById("modal-settings");
  const settings = AuthService.getBankSettings();
  
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("set-bank-name").value = settings.bank_name || "";
    document.getElementById("set-kcp-info").value = settings.kcp_info || "";
    document.getElementById("set-head-email").value = settings.head_email || "";
    document.getElementById("set-head-password").value = settings.head_password || "";
  }

  // Load ulang daftar user terbaru dari server
  try {
    const res = await ApiService.fetchData();
    if (res.users) cachedUsersList = res.users;
    renderUserTable(cachedUsersList);
  } catch (e) {
    renderUserTable(cachedUsersList);
  }

  document.getElementById("btn-close-settings").onclick = () => {
    modal.classList.add("hidden");
    resetUserForm();
  };

  document.getElementById("form-bank-settings").onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      bank_name: document.getElementById("set-bank-name").value,
      kcp_info: document.getElementById("set-kcp-info").value,
      head_email: document.getElementById("set-head-email").value,
      head_password: document.getElementById("set-head-password").value,
      head_name: AuthService.getCurrentUser().username
    };

    try {
      showLoading(true);
      await ApiService.saveSettings(payload);
      AuthService.saveBankSettingsLocal(payload);
      alert("Profil Bank berhasil diperbarui!");
      window.location.reload();
    } catch (err) {
      showLoading(false);
      alert("Gagal menyimpan pengaturan: " + err.message);
    }
  };

  document.getElementById("form-user-unit").onsubmit = async (e) => {
    e.preventDefault();
    const sheetRow = document.getElementById("user-sheet-row").value;
    const payload = {
      sheet_row: sheetRow ? parseInt(sheetRow) : null,
      username: document.getElementById("user-name").value,
      email: document.getElementById("user-email").value,
      password: document.getElementById("user-password").value,
      lokasi: document.getElementById("user-lokasi").value,
      role: "MUH"
    };

    try {
      showLoading(true);
      if (sheetRow) {
        // Mode Update
        await ApiService.updateUser(payload);
        alert(`User Unit ${payload.email} berhasil diperbarui!`);
      } else {
        // Mode Tambah Baru
        await ApiService.addUser(payload);
        alert(`User Unit ${payload.email} berhasil didaftarkan!`);
      }

      resetUserForm();
      const res = await ApiService.fetchData();
      if (res.users) cachedUsersList = res.users;
      renderUserTable(cachedUsersList);
      showLoading(false);
    } catch (err) {
      showLoading(false);
      alert("Gagal memproses user: " + err.message);
    }
  };

  document.getElementById("btn-cancel-edit-user").onclick = () => resetUserForm();
}

function renderUserTable(users) {
  const tbody = document.getElementById("user-table-body");
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada user unit terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="p-2.5 font-bold ${u.role === 'HEAD_AREA' ? 'text-red-700' : 'text-slate-700'}">${u.role}</td>
      <td class="p-2.5 font-semibold text-slate-800">${u.username}</td>
      <td class="p-2.5 text-slate-600 font-mono">${u.email}</td>
      <td class="p-2.5 text-slate-600">${u.lokasi}</td>
      <td class="p-2.5 text-center">
        ${u.role === 'HEAD_AREA' ? '<span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">Admin Utama</span>' : `
          <div class="flex items-center justify-center space-x-1">
            <button onclick="window.editUserUnit('${u.sheet_row}')" class="bg-amber-100 hover:bg-amber-600 text-amber-800 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer">
              Edit
            </button>
            <button onclick="window.deleteUserUnit('${u.sheet_row}', '${u.email}')" class="bg-red-100 hover:bg-red-700 text-red-700 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer">
              Hapus
            </button>
          </div>
        `}
      </td>
    </tr>
  `).join("");
}

window.editUserUnit = function(sheetRow) {
  const user = cachedUsersList.find(u => String(u.sheet_row) === String(sheetRow));
  if (!user) return;

  document.getElementById("user-sheet-row").value = user.sheet_row;
  document.getElementById("user-name").value = user.username;
  document.getElementById("user-email").value = user.email;
  document.getElementById("user-password").value = user.password;
  document.getElementById("user-lokasi").value = user.lokasi;

  document.getElementById("form-user-title").innerText = `Edit User Unit: ${user.username}`;
  document.getElementById("btn-submit-user").innerText = "Simpan Perubahan User";
  document.getElementById("btn-submit-user").className = "bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow cursor-pointer";
  document.getElementById("btn-cancel-edit-user").classList.remove("hidden");
};

window.deleteUserUnit = async function(sheetRow, email) {
  if (!confirm(`Apakah Anda yakin ingin menghapus user unit ${email}? User tidak akan bisa login lagi.`)) return;

  try {
    showLoading(true);
    await ApiService.deleteUser(sheetRow);
    alert(`User unit ${email} berhasil dihapus!`);
    
    const res = await ApiService.fetchData();
    if (res.users) cachedUsersList = res.users;
    renderUserTable(cachedUsersList);
    showLoading(false);
  } catch (err) {
    showLoading(false);
    alert("Gagal menghapus user: " + err.message);
  }
};

function resetUserForm() {
  document.getElementById("user-sheet-row").value = "";
  document.getElementById("user-name").value = "";
  document.getElementById("user-email").value = "";
  document.getElementById("user-password").value = "";
  document.getElementById("user-lokasi").value = "";

  document.getElementById("form-user-title").innerText = "2. Penambahan User Kepala Unit (MUH)";
  document.getElementById("btn-submit-user").innerText = "+ Daftarkan User Unit";
  document.getElementById("btn-submit-user").className = "bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow cursor-pointer";
  document.getElementById("btn-cancel-edit-user").classList.add("hidden");
}

function renderAppShell(user) {
  const userInfoEl = document.getElementById("user-info-display");
  if (userInfoEl) {
    userInfoEl.innerText = `${user.username} (${user.role === 'HEAD_AREA' ? 'Head Area' : 'Kepala Unit'})`;
  }
}

function bindButtons() {
  const btnAdd = document.getElementById("btn-add-row");
  if (btnAdd) {
    if (AuthService.isHeadArea()) {
      btnAdd.style.display = "none";
    } else {
      btnAdd.addEventListener("click", () => GridEngine.addNewRow());
    }
  }

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => AuthService.logout());
  }
}

function showLoading(isLoading) {
  const loader = document.getElementById("app-loader");
  if (loader) loader.style.display = isLoading ? "flex" : "none";
}
