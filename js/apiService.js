/**
 * ==========================================================
 * APISERVICE.JS - HTTP Client (Passing User Context for Data Isolation)
 * ==========================================================
 */

import { APP_CONFIG } from './config.js';
import { AuthService } from './auth.js';

export const ApiService = {
  fetchData: async function() {
    try {
      const currentUser = AuthService.getCurrentUser();
      
      // Mengirimkan context user ke backend via POST
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
          action: "getData", 
          userContext: currentUser ? {
            role: currentUser.role,
            username: currentUser.username,
            email: currentUser.email
          } : null 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.status === "success") {
        return result;
      } else {
        throw new Error(result.message || "Gagal mengambil data dari server.");
      }
    } catch (error) {
      console.error("ApiService.fetchData Error:", error);
      throw error;
    }
  },

  login: async function(email, password) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "login", email: email, password: password })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Login gagal.");
      }
    } catch (error) {
      console.error("ApiService.login Error:", error);
      throw error;
    }
  },

  saveSettings: async function(settingsData) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "saveSettings", data: settingsData })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal menyimpan pengaturan.");
      }
    } catch (error) {
      console.error("ApiService.saveSettings Error:", error);
      throw error;
    }
  },

  addUser: async function(userData) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "addUser", data: userData })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal mendaftarkan user unit.");
      }
    } catch (error) {
      console.error("ApiService.addUser Error:", error);
      throw error;
    }
  },

  updateUser: async function(userData) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "updateUser", data: userData })
      });

      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal mengedit user unit.");
      }
    } catch (error) {
      console.error("ApiService.updateUser Error:", error);
      throw error;
    }
  },

  deleteUser: async function(sheetRow) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "deleteUser", sheetRow: sheetRow })
      });

      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal menghapus user unit.");
      }
    } catch (error) {
      console.error("ApiService.deleteUser Error:", error);
      throw error;
    }
  },

  saveRow: async function(rowData) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "save", data: rowData })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal menyimpan data ke server.");
      }
    } catch (error) {
      console.error("ApiService.saveRow Error:", error);
      throw error;
    }
  },

  deleteRow: async function(rowIndex) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", rowIndex: rowIndex })
      });

      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal menghapus baris dari server.");
      }
    } catch (error) {
      console.error("ApiService.deleteRow Error:", error);
      throw error;
    }
  }
};
