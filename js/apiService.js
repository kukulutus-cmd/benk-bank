/**
 * ==========================================================
 * APISERVICE.JS - Ultra Clean & Silent Network Engine
 * ==========================================================
 */

import { APP_CONFIG } from './config.js';
import { AuthService } from './auth.js';

export const ApiService = {
  fetchData: async function() {
    try {
      const currentUser = AuthService.getCurrentUser();
      const startTime = performance.now();

      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
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
      
      const pingMs = Math.round(performance.now() - startTime);
      const result = await response.json();

      if (result.status === "success") {
        const payloadData = result.data.data ? result.data : result;
        payloadData.pingMs = pingMs;
        return payloadData;
      } else {
        throw new Error(result.message || "Gagal mengambil data dari server.");
      }
    } catch (error) {
      console.warn("ApiService.fetchData Warning:", error.message);
      throw error;
    }
  },

  checkLicense: async function() {
    try {
      // Safe Timeout tanpa memicu AbortError di konsol browser
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ status: "ACTIVE", daysLeft: 30, message: "License Timeout Fallback" }), 5000)
      );

      const fetchPromise = (async () => {
        const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "checkLicense" })
        });
        const result = await response.json();
        return result.status === "success" ? result.data : { status: "ACTIVE", daysLeft: 30 };
      })();

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      return { status: "ACTIVE", daysLeft: 30, message: "Offline Status" };
    }
  },

  claimLicense: async function(serialKey) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
          action: "claimLicense", 
          serialKey: serialKey 
        })
      });
      
      const result = await response.json();
      if (result.status === "success") {
        return result.data;
      } else {
        throw new Error(result.message || "Gagal mengklaim Serial Key.");
      }
    } catch (error) {
      console.error("ApiService.claimLicense Error:", error);
      throw error;
    }
  },

  sendHeartbeat: async function(email) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "heartbeat", email: email })
      });
      
      const result = await response.json();
      return result.status === "success" ? result.data : null;
    } catch (e) {
      return null;
    }
  },

  login: async function(email, password) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
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
