/**
 * ==========================================================
 * AUTH.JS - Authentikasi Kredensial Email & Password
 * ==========================================================
 */

import { ApiService } from './apiService.js';

export const AuthService = {
  CURRENT_USER_KEY: "BANK_APP_CURRENT_USER",
  BANK_SETTINGS_KEY: "BANK_APP_SETTINGS",

  getCurrentUser: function() {
    const data = localStorage.getItem(this.CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  getBankSettings: function() {
    const data = localStorage.getItem(this.BANK_SETTINGS_KEY);
    return data ? JSON.parse(data) : { bank_name: "BANK DAILY UNIT REPORTING", kcp_info: "Enterprise Portal" };
  },

  saveBankSettingsLocal: function(settings) {
    localStorage.setItem(this.BANK_SETTINGS_KEY, JSON.stringify(settings));
  },

  loginWithCredentials: async function(email, password) {
    const authResult = await ApiService.login(email, password);
    if (authResult.success) {
      const userSession = {
        role: authResult.user.role,
        username: authResult.user.username,
        email: authResult.user.email,
        lokasi: authResult.user.lokasi,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userSession));
      if (authResult.settings) {
        this.saveBankSettingsLocal(authResult.settings);
      }
      return userSession;
    }
  },

  logout: function() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    window.location.reload();
  },

  isHeadArea: function() {
    const user = this.getCurrentUser();
    return user && user.role === "HEAD_AREA";
  }
};
