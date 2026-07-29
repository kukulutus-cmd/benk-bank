/**
 * ==========================================================
 * GRIDENGINE.JS - AG-Grid v31 Modern Engine & Instant Row Add
 * ==========================================================
 */

import { ApiService } from './apiService.js';
import { AuthService } from './auth.js';
import { StatCardsModule } from './statCards.js';

export const GridEngine = {
  gridApi: null,

  /**
   * Menginisialisasi AG-Grid v31 menggunakan createGrid
   */
  initGrid: function(containerId, initialData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isHeadArea = AuthService.isHeadArea();

    // Definisi 18 Kolom Presisi Sesuai Blueprint
    const columnDefs = [
      { 
        headerName: "NO", 
        valueGetter: "node.rowIndex + 1", 
        width: 70, 
        pinned: 'left', 
        editable: false,
        cellClass: 'bg-slate-100 font-bold text-slate-600 text-center'
      },
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

          const allRows = [];
          if (this.gridApi) {
            this.gridApi.forEachNode(node => allRows.push(node.data));
            StatCardsModule.updateMetrics(allRows);
          }

        } catch (error) {
          console.error("Gagal menyimpan perubahan sel:", error);
          if (statusEl) {
            statusEl.innerText = "❌ Gagal Sinkronisasi";
            statusEl.className = "text-red-600 font-semibold text-xs";
          }
        }
      }
    };

    container.innerHTML = "";
    // Menggunakan API AG-Grid v31 Terbaru (createGrid)
    this.gridApi = agGrid.createGrid(container, gridOptions);
  },

  /**
   * Menambahkan baris baru secara instan ke tabel tanpa refresh halaman
   */
  addNewRow: async function() {
    if (AuthService.isHeadArea()) {
      alert("Akses dibatasi: Akun Head Area berada dalam mode Read-Only.");
      return;
    }

    if (!this.gridApi) {
      alert("Tabel belum siap, silakan coba beberapa saat lagi.");
      return;
    }

    const user = AuthService.getCurrentUser();
    const newRow = {
      row_index: null, // Baris baru
      nama_sentra: "cikarang",
      nama_muh: user ? user.username : "AKBAR",
      nama_sm: "",
      nama_debitur: "",
      bidang_usaha: "-",
      no_tabungan: "-",
      no_pinjaman: "-",
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

    // 1. Tampilkan baris baru secara instan di tabel AG-Grid
    this.gridApi.applyTransaction({ add: [newRow] });

    // 2. Update status & kalkulasi Stat Cards
    const statusEl = document.getElementById("sync-status");
    if (statusEl) {
      statusEl.innerText = "💾 Menyimpan baris baru...";
      statusEl.className = "text-amber-600 font-semibold text-xs";
    }

    const allRows = [];
    this.gridApi.forEachNode(node => allRows.push(node.data));
    StatCardsModule.updateMetrics(allRows);

    // 3. Kirim data ke Google Sheets di background tanpa merefresh halaman
    try {
      await ApiService.saveRow(newRow);
      if (statusEl) {
        statusEl.innerText = "✓ Baris Baru Tersimpan!";
        statusEl.className = "text-green-600 font-semibold text-xs";
      }
    } catch (error) {
      console.error("Gagal menyimpan baris baru:", error);
      if (statusEl) {
        statusEl.innerText = "⚠️ Gagal Simpan ke Server";
        statusEl.className = "text-red-600 font-semibold text-xs";
      }
    }
  }
};
