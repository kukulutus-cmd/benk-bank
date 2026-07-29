/**
 * ==========================================================
 * AUTH.JS - Modul Autentikasi & Manajemen Sesi Role
 * ==========================================================
 */

export const AuthService = {
  CURRENT_USER_KEY: "BANK_APP_CURRENT_USER",

  /**
   * Mengambil data user yang sedang login dari localStorage
   */
  getCurrentUser: function() {
    const data = localStorage.getItem(this.CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Menyimpan sesi login
   */
  login: function(role, username) {
    const sessionData = {
      role: role, // "HEAD_AREA" atau "MUH"
      username: username || (role === "HEAD_AREA" ? "ACHMAD AKBAR (Head Area)" : "Kepala Unit (MUH)"),
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(sessionData));
    return sessionData;
  },

  /**
   * Menghapus sesi login
   */
  logout: function() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    window.location.reload();
  },

  /**
   * Mengecek apakah user adalah Head Area (Read-Only Mode untuk pengeditan grid)
   */
  isHeadArea: function() {
    const user = this.getCurrentUser();
    return user && user.role === "HEAD_AREA";
  }
};
