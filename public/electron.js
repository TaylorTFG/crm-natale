const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Variabili globali
let mainWindow;
const userDataPath = app.getPath('userData');
console.log('Cartella dati utente:', userDataPath);

// Assicura che la cartella dati esista
const dataFolderPath = path.join(userDataPath, 'data');
if (!fs.existsSync(dataFolderPath)) {
  fs.mkdirSync(dataFolderPath, { recursive: true });
  console.log('Cartella dati creata:', dataFolderPath);
}

// Crea la finestra principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Carica l'URL dell'app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Apri DevTools in ambiente di sviluppo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Gestisci la chiusura della finestra
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Quando Electron ha finito l'inizializzazione
app.whenReady().then(() => {
  createWindow();

  // Su macOS, ricrea la finestra quando l'icona nel dock viene cliccata
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Chiudi l'app quando tutte le finestre sono chiuse (eccetto su macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Gestori IPC per la comunicazione con il renderer

// Carica i dati
ipcMain.handle('load-data', async (event, dataType) => {
  try {
    console.log(`Caricamento dati: ${dataType}`);
    // In fase iniziale, restituisci array vuoto per testing
    return { success: true, data: [] };
  } catch (error) {
    console.error(`Errore durante il caricamento dei dati ${dataType}:`, error);
    return { success: false, error: error.message };
  }
});

// Salva i dati
ipcMain.handle('save-data', async (event, { dataType, data }) => {
  try {
    console.log(`Salvataggio dati: ${dataType}`);
    // In fase iniziale, simula successo per testing
    return { success: true };
  } catch (error) {
    console.error(`Errore durante il salvataggio dei dati ${dataType}:`, error);
    return { success: false, error: error.message };
  }
});

// Importa dati da Excel
ipcMain.handle('import-excel', async (event, { dataType }) => {
  try {
    console.log(`Avvio importazione Excel per: ${dataType}`);
    
    // Apri il file dialog per selezionare il file Excel
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Seleziona file Excel',
      filters: [
        { name: 'Excel', extensions: ['xlsx', 'xls'] }
      ],
      properties: ['openFile']
    });
    
    if (canceled || filePaths.length === 0) {
      console.log('Importazione annullata dall\'utente');
      return { success: false, message: 'Importazione annullata' };
    }
    
    const filePath = filePaths[0];
    console.log(`Inizio importazione Excel: ${filePath}`);
    
    // Qui utilizzeresti excelImporter.importFile se fosse completamente implementato
    // Per ora, ritorna un messaggio di successo simulato
    return { 
      success: true, 
      message: `File ${path.basename(filePath)} selezionato con successo`,
      data: []
    };
  } catch (error) {
    console.error(`Errore durante l'importazione Excel:`, error);
    return { 
      success: false, 
      message: `Errore durante l'importazione: ${error.message}`
    };
  }
});