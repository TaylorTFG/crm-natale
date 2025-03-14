const { contextBridge, ipcRenderer } = require('electron');

// Esponi API sicure al processo di rendering
contextBridge.exposeInMainWorld('api', {
  // API per il caricamento dei dati
  loadData: (dataType, includeEliminati = false) => 
    ipcRenderer.invoke('load-data', dataType, includeEliminati),
  
  // API per il salvataggio dei dati
  saveData: (dataType, data) => 
    ipcRenderer.invoke('save-data', { dataType, data }),
  
  // API per l'importazione da Excel
  importExcel: (dataType) => 
    ipcRenderer.invoke('import-excel', { dataType }),
  
  // API per l'esportazione per GLS
  exportGLS: () => 
    ipcRenderer.invoke('export-gls'),
  
  // API per le impostazioni
  loadSettings: () => 
    ipcRenderer.invoke('load-settings'),
  
  saveSettings: (settings) => 
    ipcRenderer.invoke('save-settings', settings),
  
  // API per la gestione degli eliminati
  moveToEliminati: (dataType, id) => 
    ipcRenderer.invoke('move-to-eliminati', { dataType, id }),
  
  restoreFromEliminati: (id) => 
    ipcRenderer.invoke('restore-from-eliminati', { id }),
  
  // API per aggiornamenti di gruppo
  updateBulk: (dataType, ids, propertyName, propertyValue) => 
    ipcRenderer.invoke('update-bulk', { dataType, ids, propertyName, propertyValue })
});

console.log('Preload script caricato correttamente');