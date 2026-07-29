/**
 * ==========================================================
 * GRIDENGINE.JS - AG-Grid Engine & Checkbox Event Capture
 * ==========================================================
 */

import { ApiService } from './apiService.js';
import { AuthService } from './auth.js';
import { StatCardsModule } from './statCards.js';

export const GridEngine = {
  gridApi: null,

  initGrid: function(containerId, initialData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isHeadArea = AuthService.isHeadArea();

    const columnDefs = [
      { 
        headerName: "NO", 
        valueGetter: "node.rowIndex + 1", 
        minWidth: 35,
        maxWidth: 45, 
        pinned: 'left', 
        editable: false,
        cellClass: 'bg-slate-100 font-bold text-slate-600 text-center'
      },
      { headerName: "NAMA SENTRA", field: "nama_sentra", minWidth: 80, editable: !isHeadArea },
      { headerName: "NAMA MUH", field: "nama_muh", minWidth: 70, editable: !isHeadArea },
      { headerName: "NAMA SM", field: "nama_sm", minWidth: 70, editable: !isHeadArea },
      { headerName: "NAMA DEBITUR", field: "nama_debitur", minWidth: 100, editable: !isHeadArea, cellClass: 'font-bold text-red-700' },
      { headerName: "BIDANG USAHA", field: "bidang_usaha", minWidth: 80, editable: !isHeadArea },
      { headerName: "NO TABUNGAN", field: "no_tabungan", minWidth: 80, editable: !isHeadArea },
      { headerName: "NO PINJAMAN", field: "no_pinjaman", minWidth: 80, editable: !isHeadArea },
      { 
        headerName: "LINE PROSES", 
        field: "line_proses", 
        minWidth: 70, 
        editable: !isHeadArea,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['SM', 'BOOKING', 'REJECT', 'KC', 'RBM'] }
      },
      { 
        headerName: "PLAFON", 
        field: "plafon", 
        minWidth: 80, 
        editable: !isHeadArea,
        valueFormatter: params => {
          if (!params.value) return "0";
          return new Intl.NumberFormat("id-ID").format(params.value);
        }
      },
      { 
        headerName: "NETT BOOKING", 
        field: "nett_booking", 
        minWidth: 80, 
        editable: !isHeadArea,
        valueFormatter: params => {
          if (!params.value) return "0";
          return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(params.value);
        }
      },
      { headerName: "TGL CAIR", field: "tgl_cair", minWidth: 75, editable: !isHeadArea },
      { headerName: "Periode Bulan", field: "periode_bulan", minWidth: 65, editable: !isHeadArea },
      
      // CHECKBOX COLUMNS DENGAN PARSER BOOLEAN PRESISI
      { headerName: "QRIS", field: "qris", minWidth: 45, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "JAKONE ABANK", field: "jakone_abank", minWidth: 65, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "JAKONE MOBILE", field: "jakone_mobile", minWidth: 65, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "EDC", field: "edc", minWidth: 45, editable: !isHeadArea, cellEditor: 'agCheckboxCellEditor', cellRenderer: 'agCheckboxCellRenderer' },
      { headerName: "KETERANGAN", field: "keterangan", minWidth: 90, editable: !isHeadArea }
    ];

    if (!isHeadArea) {
      columnDefs.push({
        headerName: "AKSI",
        minWidth: 50,
        maxWidth: 60,
        pinned: 'right',
        editable: false,
        cellRenderer: (params) => {
          const btn = document.createElement("button");
          btn.innerHTML = "✕";
          btn.title = "Hapus Baris Ini";
          btn.className = "bg-red-100 hover:bg-red-700 text-red-700 hover:text-white font-bold px-2 py-0.5 rounded transition-colors text-xs cursor-pointer mx-auto block";
          
          btn.addEventListener("click", () => {
            this.deleteRow(params.data, params.node);
          });
          
          return btn;
        }
      });
    }

    const gridOptions = {
      columnDefs: columnDefs,
      rowData: initialData || [],
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        editable: !isHeadArea,
        flex: 1,
        wrapHeaderText: true,
        autoHeaderHeight: true
      },
      rowSelection: 'single',
      animateRows: true,
      onGridReady: (params) => {
        params.api.sizeColumnsToFit();
      },
      onGridSizeChanged: (params) => {
        params.api.sizeColumnsToFit();
      },
      onCellValueChanged: async (event) => {
        const updatedRow = event.data;
        
        const statusEl = document.getElementById("sync-status");
        if (statusEl) {
          statusEl.innerText = "💾 Menyimpan...";
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
      qris: false,
      jakone_abank: false,
      jakone_mobile: false,
      edc: false,
      keterangan: "Baru"
    };

    this.gridApi.applyTransaction({ add: [newRow] });

    const statusEl = document.getElementById("sync-status");
    if (statusEl) {
      statusEl.innerText = "💾 Menyimpan...";
      statusEl.className = "text-amber-600 font-semibold text-xs";
    }

    const allRows = [];
    this.gridApi.forEachNode(node => allRows.push(node.data));
    StatCardsModule.updateMetrics(allRows);

    try {
      const res = await ApiService.saveRow(newRow);
      if (res && res.row_index) {
        newRow.row_index = res.row_index;
      }
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
  },

  deleteRow: async function(rowData, node) {
    if (!confirm("Apakah Anda yakin ingin menghapus baris debitur ini?")) return;

    this.gridApi.applyTransaction({ remove: [rowData] });

    const statusEl = document.getElementById("sync-status");
    if (statusEl) {
      statusEl.innerText = "🗑️ Menghapus baris...";
      statusEl.className = "text-amber-600 font-semibold text-xs";
    }

    const allRows = [];
    this.gridApi.forEachNode(n => allRows.push(n.data));
    StatCardsModule.updateMetrics(allRows);

    try {
      if (rowData.row_index) {
        await ApiService.deleteRow(rowData.row_index);
      }
      if (statusEl) {
        statusEl.innerText = "✓ Baris Berhasil Dihapus!";
        statusEl.className = "text-green-600 font-semibold text-xs";
      }
    } catch (error) {
      console.error("Gagal menghapus baris di server:", error);
      if (statusEl) {
        statusEl.innerText = "⚠️ Gagal Hapus di Server";
        statusEl.className = "text-red-600 font-semibold text-xs";
      }
    }
  }
};
