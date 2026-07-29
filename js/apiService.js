/**
 * ==========================================================
 * APISERVICE.JS - HTTP Client untuk komunikasi ke Google Apps Script
 * ==========================================================
 */

import { APP_CONFIG } from './config.js';

export const ApiService = {
  /**
   * Mengambil seluruh data dari Google Sheets melalui GAS doGet
   */
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
        return result.data;
      } else {
        throw new Error(result.message || "Gagal mengambil data dari server.");
      }
    } catch (error) {
      console.error("ApiService.fetchData Error:", error);
      throw error;
    }
  },

  /**
   * Menyimpan atau memperbarui data baris melalui GAS doPost
   */
  saveRow: async function(rowData) {
    try {
      const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // Mencegah preflight CORS issues di Apps Script
        },
        body: JSON.stringify(rowData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
  }
};
