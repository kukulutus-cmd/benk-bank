/**
 * ==========================================================
 * APP.JS - Main Orchestrator, Auto-Archive Engine & Tab Switcher
 * ==========================================================
 */

import { AuthService } from './auth.js';
import { ApiService } from './apiService.js';
import { StatCardsModule } from './statCards.js';
import { GridEngine } from './gridEngine.js';

let allMasterData = [];
let currentMonthData = [];
let historicalData = [];
let cachedUsersList = [];

let activeTab = "DASHBOARD"; // "DASHBOARD" | "LAPORAN"
let lastDataRowCount = 0;
let isFirstLoad = true;

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
    const onlineWidget = document.getElementById("online-units-container");
    if (onlineWidget) onlineWidget.classList.remove("hidden");
  }

  renderAppShell(currentUser);

  // Bind Tab Switching & Filter Dynamic
  bindTabNavigation();

  // Load awal data
  await loadInitialAppData();

  // Jalankan Loops Background
  startHeartbeatLoop(currentUser);
  startRealtimeDataPolling(currentUser);

  bindButtons();
});

async function loadInitialAppData() {
  try {
    showLoading(true);
    const result = await ApiService.fetchData();
    
    updateSignalStatus(true, result.pingMs || 100);

    if (result.settings) {
      AuthService.saveBankSettingsLocal(result.settings);
      updateBankHeader(result.settings);
    }

    if (result.users) {
      cachedUsersList = result.users;
      renderOnlineUnitsWidget(cachedUsersList);
      populateMuhDropdownOptions(cachedUsersList);
    }

    allMasterData = Array.isArray(result.data) ? result.data : [];
    processDataByPeriode(allMasterData);

    const initialDisplayData = (activeTab === "DASHBOARD") ? currentMonthData : historicalData;
    lastDataRowCount = initialDisplayData.length;

    StatCardsModule.updateMetrics(initialDisplayData);
    GridEngine.initGrid("myGrid", initialDisplayData);
    
    isFirstLoad = false;
  } catch (error) {
    updateSignalStatus(false, 0);
    console.error("Gagal memuat data aplikasi:", error);
  } finally {
    showLoading(false);
  }
}

/**
 * PEMISAHAN AUTOMATIS DATA BULAN BERJALAN VS HISTORICAL LAPORAN
 */
function processDataByPeriode(data) {
  const now = new Date();
  const currentMonthStr = `${now.getMonth() + 1}/${now.getFullYear()}`;

  currentMonthData = [];
  historicalData = [];

  const periodeSet = new Set();

  data.forEach(item => {
    const itemPeriode = item.periode_bulan ? item.periode_bulan.toString().trim() : currentMonthStr;
    periodeSet.add(itemPeriode);

    if (itemPeriode === currentMonthStr) {
      currentMonthData.push(item);
    } else {
      historicalData.push(item);
    }
  });

  populatePeriodeDropdownOptions(Array.from(periodeSet));
}

/**
 * NAVIGASI TAB DASHBOARD (BULAN INI) VS LAPORAN HISTORICAL
 */
function bindTabNavigation() {
  const tabDashboard = document.getElementById("tab-dashboard");
  const tabLaporan = document.getElementById("tab-laporan");
  const wrapperPeriodeFilter = document.getElementById("wrapper-filter-periode");
  const btnAddRow = document.getElementById("btn-add-row");
  const filterPeriodeSelect = document.getElementById("filter-periode-bulan");

  if (tabDashboard && tabLaporan) {
    tabDashboard.addEventListener("click", () => {
      activeTab = "DASHBOARD";
      
      // Styling Tab Active
      tabDashboard.className = "py-2.5 px-5 font-bold text-xs rounded-t-lg bg-red-700 text-white border-b-2 border-red-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all";
      tabLaporan.className = "py-2.5 px-5 font-bold text-xs rounded-t-lg bg-white text-slate-600 hover:bg-slate-200 border-b-2 border-transparent flex items-center gap-2 cursor-pointer transition-all";

      if (wrapperPeriodeFilter) wrapperPeriodeFilter.classList.add("hidden");
      if (btnAddRow && !AuthService.isHeadArea()) btnAddRow.style.display = "flex";

      switchGridData(currentMonthData);
    });

    tabLaporan.addEventListener("click", () => {
      activeTab = "LAPORAN";

      // Styling Tab Active
      tabLaporan.className = "py-2.5 px-5 font-bold text-xs rounded-t-lg bg-red-700 text-white border-b-2 border-red-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all";
      tabDashboard.className = "py-2.5 px-5 font-bold text-xs rounded-t-lg bg-white text-slate-600 hover:bg-slate-200 border-b-2 border-transparent flex items-center gap-2 cursor-pointer transition-all";

      if (wrapperPeriodeFilter) wrapperPeriodeFilter.classList.remove("hidden");
      if (btnAddRow) btnAddRow.style.display = "none"; // Modus Laporan Read-Only untuk entri baru

      switchGridData(historicalData);
    });
  }

  if (filterPeriodeSelect) {
    filterPeriodeSelect.addEventListener("change", (e) => {
      const selectedPeriode = e.target.value;
      if (selectedPeriode === "ALL" || !selectedPeriode) {
        switchGridData(historicalData);
      } else {
        const filteredByPeriode = historicalData.filter(d => d.periode_bulan === selectedPeriode);
        switchGridData(filteredByPeriode);
      }
    });
  }
}

function switchGridData(dataset) {
  if (GridEngine.gridApi) {
    GridEngine.gridApi.setGridOption('rowData', dataset);
    GridEngine.applyCustomFilters();
  }
  StatCardsModule.updateMetrics(dataset);
}

function populateMuhDropdownOptions(users) {
  const elMuh = document.getElementById("filter-muh");
  if (!elMuh || !Array.isArray(users)) return;

  const currentVal = elMuh.value;
  elMuh.innerHTML = `<option value="">Semua MUH</option>`;

  const muhUsers = users.filter(u => u.role === "MUH");
  muhUsers.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.username;
    opt.textContent = u.username;
    elMuh.appendChild(opt);
  });

  elMuh.value = currentVal;
}

function populatePeriodeDropdownOptions(periodes) {
  const elPeriode = document.getElementById("filter-periode-bulan");
  if (!elPeriode) return;

  const currentVal = elPeriode.value;
  elPeriode.innerHTML = `<option value="ALL">Semua Histori</option>`;

  periodes.sort().reverse().forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = `Periode ${p}`;
    elPeriode.appendChild(opt);
  });

  elPeriode.value = currentVal;
}

function startHeartbeatLoop(currentUser) {
  setInterval(async () => {
    if (!currentUser || !currentUser.email) return;
    try {
      const res = await ApiService.sendHeartbeat(currentUser.email);
      if (res && res.users) {
        cachedUsersList = res.users;
        renderOnlineUnitsWidget(cachedUsersList);
      }
    } catch (e) {
      // Non-blocking
    }
  }, 12000);
}

function startRealtimeDataPolling(currentUser) {
  setInterval(async () => {
    try {
      const result = await ApiService.fetchData();
      updateSignalStatus(true, result.pingMs || 80);

      if (result.users) {
        cachedUsersList = result.users;
        renderOnlineUnitsWidget(cachedUsersList);
      }

      if (Array.isArray(result.data)) {
        allMasterData = result.data;
        processDataByPeriode(allMasterData);

        const targetData = (activeTab === "DASHBOARD") ? currentMonthData : historicalData;
        const currentCount = targetData.length;

        if (!isFirstLoad && currentCount > lastDataRowCount && AuthService.isHeadArea()) {
          const newItemsCount = currentCount - lastDataRowCount;
          const newestItem = targetData[targetData.length - 1];
          
          showToastNotification(`🔔 Data Baru Masuk! (${newItemsCount} Debitur baru oleh ${newestItem.nama_muh || 'Unit'})`);
          switchGridData(targetData);
        }

        lastDataRowCount = currentCount;
      }
    } catch (err) {
      updateSignalStatus(false, 0);
    }
  }, 8000);
}

function updateSignalStatus(isOnline, pingMs) {
  const dot = document.getElementById("signal-dot");
  const text = document.getElementById("signal-text");
  
  if (!dot || !text) return;

  if (isOnline) {
    dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
    text.innerText = `Connected (${pingMs}ms)`;
  } else {
    dot.className = "w-2 h-2 rounded-full bg-red-400";
    text.innerText = "Offline / Disconnected";
  }
}

function renderOnlineUnitsWidget(users) {
  const container = document.getElementById("online-units-badges");
  if (!container || !Array.isArray(users)) return;

  const now = new Date().getTime();
  const onlineUsers = users.filter(u => {
    if (!u.last_active) return false;
    const lastActiveTime = new Date(u.last_active).getTime();
    return (now - lastActiveTime) < 45000;
  });

  if (onlineUsers.length === 0) {
    container.innerHTML = `<span class="text-red-300 text-[10px] italic">Tidak ada unit lain online</span>`;
    return;
  }

  container.innerHTML = onlineUsers.map(u => `
    <span class="bg-red-900 border border-red-500 text-white font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm" title="${u.email} (${u.lokasi})">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      ${u.username}
    </span>
  `).join("");
}

function showToastNotification(message) {
  if (!AuthService.isHeadArea()) return;

  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "pointer-events-auto bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border-l-4 border-emerald-500 text-xs font-semibold flex items-center gap-3 transition-all transform translate-y-2 opacity-0";
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white font-bold ml-2">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 50);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 6000);
}

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
        await ApiService.updateUser(payload);
        alert(`User Unit ${payload.email} berhasil diperbarui!`);
      } else {
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
