/**
 * ==========================================================
 * APP.JS - Main Application Orchestrator & Initializer
 * ==========================================================
 */

import { AuthService } from './auth.js';
import { ApiService } from './apiService.js';
import { StatCardsModule } from './statCards.js';
import { GridEngine } from './gridEngine.js';

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = AuthService.getCurrentUser();

  // 1. Cek Sesi Login
  if (!currentUser) {
    showLoginModal();
    return;
  }

  // 2. Render Header & Role Info
  renderAppShell(currentUser);

  // 3. Ambil Data dari Google Sheets & Inisialisasi Grid
  try {
    showLoading(true);
    const data = await ApiService.fetchData();
    
    // Inisialisasi Stat Cards
    StatCardsModule.updateMetrics(data);

    // Inisialisasi AG-Grid
    GridEngine.initGrid("myGrid", data);

    showLoading(false);
  } catch (error) {
    showLoading(false);
    showErrorNotification("Gagal memuat data aplikasi: " + error.message);
  }

  // 4. Bind Tombol Tambah Baris & Logout
  const btnAdd = document.getElementById("btn-add-row");
  if (btnAdd) {
    if (AuthService.isHeadArea()) {
      btnAdd.style.display = "none"; // Sembunyikan untuk Head Area
    } else {
      btnAdd.addEventListener("click", () => GridEngine.addNewRow());
    }
  }

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => AuthService.logout());
  }
});

function showLoginModal() {
  const modalHtml = `
    <div id="login-modal" class="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-700">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-red-700 uppercase tracking-wide">Bank Daily Unit Reporting</h2>
          <p class="text-xs text-slate-500 mt-1">Silakan pilih hak akses peran Anda untuk masuk ke sistem.</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Pilih Peran (Role)</label>
            <select id="select-role" class="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none">
              <option value="HEAD_AREA">Head Area (Admin - Monitor 17 Unit)</option>
              <option value="MUH">Kepala Unit / MUH (Input & Edit Data)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Pengguna / Unit</label>
            <input type="text" id="input-username" placeholder="Contoh: Achmad Akbar / Unit Cikarang" class="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none" />
          </div>
          <button id="btn-submit-login" class="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-md">
            Masuk ke Dasbor
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById("btn-submit-login").addEventListener("click", () => {
    const role = document.getElementById("select-role").value;
    const username = document.getElementById("input-username").value.trim();
    
    AuthService.login(role, username);
    document.getElementById("login-modal").remove();
    window.location.reload();
  });
}

function renderAppShell(user) {
  const userInfoEl = document.getElementById("user-info-display");
  if (userInfoEl) {
    userInfoEl.innerText = `${user.username} (${user.role === 'HEAD_AREA' ? 'Head Area' : 'Kepala Unit'})`;
  }
}

function showLoading(isLoading) {
  const loader = document.getElementById("app-loader");
  if (loader) {
    loader.style.display = isLoading ? "flex" : "none";
  }
}

function showErrorNotification(msg) {
  const container = document.getElementById("notification-container");
  if (container) {
    container.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-xs" role="alert">${msg}</div>`;
  }
}
