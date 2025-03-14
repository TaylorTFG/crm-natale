const { contextBridge, ipcRenderer } = require('electron');

// Esponi API sicure al processo di rendering
contextBridge.exposeInMainWorld('api', {
  // API per il caricamento dei dati
  loadData: (dataType) => ipcRenderer.invoke('load-data', dataType),
  
  // API per il salvataggio dei dati
  saveData: (dataType, data) => ipcRenderer.invoke('save-data', { dataType, data }),
  
  // API per l'importazione da Excel
  importExcel: (dataType) => ipcRenderer.invoke('import-excel', { dataType })
});

console.log('Preload script caricato correttamente');