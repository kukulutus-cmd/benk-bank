/**
 * ==========================================================
 * STATCARDS.JS - Modul Kalkulasi & Rendering Top Summary Metrics
 * ==========================================================
 */

export const StatCardsModule = {
  /**
   * Melakukan kalkulasi ulang dan memperbarui tampilan Stat Cards di UI
   * @param {Array} rowData - Seluruh data baris dari grid
   */
  updateMetrics: function(rowData) {
    if (!Array.isArray(rowData)) return;

    // 1. Total Berkas Debitur (Jumlah baris yang ada di grid)
    const totalBerkas = rowData.length;

    // 2. Total Nominal Plafon (Sum dari kolom plafon)
    const totalPlafon = rowData.reduce((acc, curr) => {
      const plafonNum = Number(curr.plafon) || 0;
      return acc + plafonNum;
    }, 0);

    // 3. Format Rupiah untuk Plafon
    const formattedPlafon = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(totalPlafon);

    // Update elemen DOM jika tersedia di HTML
    const elBerkas = document.getElementById("stat-total-berkas");
    const elPlafon = document.getElementById("stat-total-plafon");
    const elUnit = document.getElementById("stat-total-unit");

    if (elBerkas) elBerkas.innerText = `${totalBerkas} Debitur`;
    if (elPlafon) elPlafon.innerText = formattedPlafon;
    if (elUnit) elUnit.innerText = "17 Unit Aktif";
  }
};
