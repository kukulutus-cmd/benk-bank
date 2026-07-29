/**
 * ==========================================================
 * GRIDENGINE.JS - Konfigurasi AG-Grid 18 Kolom Presisi & Event Handler
 * ==========================================================
 */

import { ApiService } from './apiService.js';
import { AuthService } from './auth.js';
import { StatCardsModule } from './statCards.js';

export const GridEngine = {
  gridApi: null,
  gridColumnApi: null,

  /**
   * Menginisialisasi AG-Grid di dalam elemen kontainer HTML
   * @param {string} containerId - ID dari elemen div kontainer grid
   * @param {Array} initialData - Data awal baris
   */
  initGrid: function(containerId, initialData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isHeadArea = AuthService.isHeadArea();

    // Definisi 18 Kolom Presisi Sesuai Blueprint
    const columnDefs = [
      { headerName: "NO", field: "no", width: 70, pinned: 'left', editable: false },
      { headerName: "NAMA SENTRA", field: "nama_sentra", width: 140, editable: !isHeadArea },
      { headerName: "NAMA MUH", field: "nama_muh", width: 130, editable: !isHeadArea },
      { headerName: "NAMA SM", field: "nama_sm", width: 140, editable: !isHeadArea },
      { headerName: "NAMA DEBITUR", field: "nama_debitur", width: 160, editable: !isHeadArea, cellClass: 'font-bold text-red-700' },
      { headerName: "BIDANG USAHA", field: "bidang_usaha", width: 140, editable: !isHeadArea },
      { headerName: "NO TABUNGAN", field: "no_tabungan", width: 140, editable: !isHeadArea },
      { headerName: "NO PINJAMAN", field: "no_pinjaman", width: 140, editable: !isHeadArea },
      { 
        headerName: "LINE PROSES", 
        field: "line_proses", 
        width: 130, 
        editable: !isHeadArea,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['SM', 'BOOKING', 'REJECT', 'KC', 'RBM'] }
      },
      { 
        headerName: "PLAFON (IDR)", 
        field: "plafon", 
        width: 150, 
        editable: !isHeadArea,
        valueFormatter: params => {
          if (!params.value) return "Rp 0";
          return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(params.value);
        }
      },
      { 
        headerName: "NETT BOOKING", 
        field: "nett_booking", 
        width: 150, 
        editable: !isHeadArea,
        valueFormatter: params => {
          if (!params.value) return "Rp 0";
          return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(params.value);
        }
      },
      { headerName: "TGL CAIR", field: "tgl_cair", width: 120, editable: !isHeadArea },
      { headerName: "Periode Bulan", field: "periode_bulan", width: 120, editable: !isHeadArea },
      { headerName: "QRIS", field: "qris", width: 90, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "JAKONE ABANK", field: "jakone_abank", width: 130, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "JAKONE MOBILE", field: "jakone_mobile", width: 140, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "EDC", field: "edc", width: 90, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "KETERANGAN", field: "keterangan", width: 180, editable: !isHeadArea }
    ];

    const gridOptions = {
      columnDefs: columnDefs,
      rowData: initialData || [],
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        editable: !isHeadArea
      },
      rowSelection: 'single',
      animateRows: true,
      onCellValueChanged: async (event) => {
        const updatedRow = event.data;
        
        // Tampilkan indikator status saving
        const statusEl = document.getElementById("sync-status");
        if (statusEl) {
          statusEl.innerText = "💾 Menyimpan perubahan...";
          statusEl.className = "text-amber-600 font-semibold text-xs";
        }

        try {
          await ApiService.saveRow(updatedRow);
          
          if (statusEl) {
            statusEl.innerText = "✓ Tersimpan Realtime";
            statusEl.className = "text-green-600 font-semibold text-xs";
          }

          // Ambil seluruh data terbaru untuk memperbarui kalkulasi stat cards
          const allRows = [];
          event.api.forEachNode(node => allRows.push(node.data));
          StatCardsModule.updateMetrics(allRows);

        } catch (error) {
          console.error("Gagal menyimpan perubahan sel:", error);
          if (statusEl) {
            statusEl.innerText = "❌ Gagal Sinkronisasi";
            statusEl.className = "text-red-600 font-semibold text-xs";
          }
          alert("Gagal menyimpan perubahan ke server: " + error.message);
        }
      }
    };

    // Bersihkan kontainer lama jika ada, lalu inisialisasi AG-Grid baru
    container.innerHTML = "";
    new agGrid.Grid(container, gridOptions);
  },

  /**
   * Menambahkan baris kosong baru ke dalam grid untuk diisi oleh MUH
   */
  addNewRow: async function() {
    if (AuthService.isHeadArea()) {
      alert("Akses dibatasi: Akun Head Area berada dalam mode Read-Only.");
      return;
    }

    const user = AuthService.getCurrentUser();
    const newRow = {
      row_index: null, // Berarti baris baru (append)
      no: "",
      nama_sentra: "Sentra Baru",
      nama_muh: user ? user.username : "MUH",
      nama_sm: "",
      nama_debitur: "",
      bidang_usaha: "",
      no_tabungan: "",
      no_pinjaman: "",
      line_proses: "SM",
      plafon: 0,
      nett_booking: 0,
      tgl_cair: new Date().toISOString().split('T')[0],
      periode_bulan: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      qris: "",
      jakone_abank: "",
      jakone_mobile: "",
      edc: "",
      keterangan: "Baru"
    };

    try {
      const statusEl = document.getElementById("sync-status");
      if (statusEl) statusEl.innerText = "Menambahkan baris baru...";

      const res = await ApiService.saveRow(newRow);
      window.location.reload(); // Refresh untuk mengambil row_index asli dari database
    } catch (error) {
      alert("Gagal menambah baris: " + error.message);
    }
  }
};
