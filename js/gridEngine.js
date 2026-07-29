/**
 * ==========================================================
 * GRIDENGINE.JS - Presisi Layout & Flexible Column Fitting
 * ==========================================================
 */

import { ApiService } from './apiService.js';
import { AuthService } from './auth.js';
import { StatCardsModule } from './statCards.js';

export const GridEngine = {
  gridApi: null,

  /**
   * Menginisialisasi AG-Grid v31 dengan Auto Column Fitting
   */
  initGrid: function(containerId, initialData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isHeadArea = AuthService.isHeadArea();

    // Definisi 18 Kolom Presisi
    const columnDefs = [
      { 
        headerName: "NO", 
        valueGetter: "node.rowIndex + 1", 
        minWidth: 60,
        maxWidth: 80, 
        pinned: 'left', 
        editable: false,
        cellClass: 'bg-slate-100 font-bold text-slate-600 text-center'
      },
      { headerName: "NAMA SENTRA", field: "nama_sentra", minWidth: 130, editable: !isHeadArea },
      { headerName: "NAMA MUH", field: "nama_muh", minWidth: 120, editable: !isHeadArea },
      { headerName: "NAMA SM", field: "nama_sm", minWidth: 130, editable: !isHeadArea },
      { headerName: "NAMA DEBITUR", field: "nama_debitur", minWidth: 160, editable: !isHeadArea, cellClass: 'font-bold text-red-700' },
      { headerName: "BIDANG USAHA", field: "bidang_usaha", minWidth: 130, editable: !isHeadArea },
      { headerName: "NO TABUNGAN", field: "no_tabungan", minWidth: 130, editable: !isHeadArea },
      { headerName: "NO PINJAMAN", field: "no_pinjaman", minWidth: 130, editable: !isHeadArea },
      { 
        headerName: "LINE PROSES", 
        field: "line_proses", 
        minWidth: 120, 
        editable: !isHeadArea,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['SM', 'BOOKING', 'REJECT', 'KC', 'RBM'] }
      },
      { 
        headerName: "PLAFON (IDR)", 
        field: "plafon", 
        minWidth: 140, 
        editable: !isHeadArea,
        valueFormatter: params => {
          if (!params.value) return "Rp 0";
          return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(params.value);
        }
      },
      { 
        headerName: "NETT BOOKING", 
        field: "nett_booking", 
        minWidth: 140, 
        editable: !isHeadArea,
        valueFormatter: params => {
          if (!params.value) return "Rp 0";
          return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(params.value);
        }
      },
      { headerName: "TGL CAIR", field: "tgl_cair", minWidth: 120, editable: !isHeadArea },
      { headerName: "Periode Bulan", field: "periode_bulan", minWidth: 110, editable: !isHeadArea },
      { headerName: "QRIS", field: "qris", minWidth: 80, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "JAKONE ABANK", field: "jakone_abank", minWidth: 120, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "JAKONE MOBILE", field: "jakone_mobile", minWidth: 130, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "EDC", field: "edc", minWidth: 80, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "KETERANGAN", field: "keterangan", minWidth: 160, editable: !isHeadArea }
    ];

    const gridOptions = {
      columnDefs: columnDefs,
      rowData: initialData || [],
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        editable: !isHeadArea,
        flex: 1 // Membuat kolom mengisi ruang secara proporsional
      },
      rowSelection: 'single',
      animateRows: true,
      onGridReady: (params) => {
        // Otomatis merentangkan kolom agar presisi 100% mengisi lebar layar
        params.api.sizeColumnsToFit();
      },
      onGridSizeChanged: (params) => {
        params.api.sizeColumnsToFit();
      },
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
    this.gridApi = agGrid.createGrid(container, gridOptions);
  },

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
      row_index: null,
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

    this.gridApi.applyTransaction({ add: [newRow] });

    const statusEl = document.getElementById("sync-status");
    if (statusEl) {
      statusEl.innerText = "💾 Menyimpan baris baru...";
      statusEl.className = "text-amber-600 font-semibold text-xs";
    }

    const allRows = [];
    this.gridApi.forEachNode(node => allRows.push(node.data));
    StatCardsModule.updateMetrics(allRows);

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
