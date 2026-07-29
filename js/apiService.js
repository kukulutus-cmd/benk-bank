/**
 * ==========================================================
 * APISERVICE.JS - HTTP Client (Settings & User Management Support)
 * ==========================================================
 */

import { APP_CONFIG } from './config.js';

export const ApiService = {
  fetchData: async function() {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "GET",
        redirect: "follow"
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
