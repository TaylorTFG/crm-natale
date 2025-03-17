const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Importa i moduli
const dataManager = require(path.join(__dirname, 'dataManager'));
const excelImporter = require(path.join(__dirname, 'excelImporter'));

// Variabili globali
let mainWindow;

// Ottieni il percorso dell'applicazione
const exePath = app.getAppPath();
console.log('Percorso app:', exePath);

// Usa una cartella 'data' nella stessa posizione dell'applicazione
const dataFolderPath = path.join(path.dirname(exePath), 'data');
console.log('Cartella dati:', dataFolderPath);

// Assicura che la cartella dati esista
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
ipcMain.handle('load-data', async (event, dataType, includeEliminati = false) => {
  try {
    console.log(`Caricamento dati: ${dataType}, includeEliminati: ${includeEliminati}`);
    return await dataManager.loadData(dataType, dataFolderPath, includeEliminati);
  } catch (error) {
    console.error(`Errore durante il caricamento dei dati ${dataType}:`, error);
    return { success: false, error: error.message };
  }
});

// Salva i dati
ipcMain.handle('save-data', async (event, { dataType, data }) => {
  try {
    console.log(`Salvataggio dati: ${dataType}`);
    return await dataManager.saveData(dataType, data, dataFolderPath);
  } catch (error) {
    console.error(`Errore durante il salvataggio dei dati ${dataType}:`, error);
    return { success: false, error: error.message };
  }
});

// Carica le impostazioni
ipcMain.handle('load-settings', async (event) => {
  try {
    console.log('Caricamento impostazioni');
    return await dataManager.loadSettings(dataFolderPath);
  } catch (error) {
    console.error('Errore durante il caricamento delle impostazioni:', error);
    return { success: false, error: error.message };
  }
});

// Salva le impostazioni
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    console.log('Salvataggio impostazioni');
    return await dataManager.saveSettings(settings, dataFolderPath);
  } catch (error) {
    console.error('Errore durante il salvataggio delle impostazioni:', error);
    return { success: false, error: error.message };
  }
});

// Sposta un record negli eliminati
ipcMain.handle('move-to-eliminati', async (event, { dataType, id }) => {
  try {
    console.log(`Spostamento negli eliminati: ${dataType}, ID: ${id}`);
    return await dataManager.moveToEliminati(dataType, id, dataFolderPath);
  } catch (error) {
    console.error('Errore durante lo spostamento negli eliminati:', error);
    return { success: false, error: error.message };
  }
});

// Ripristina un record dagli eliminati
ipcMain.handle('restore-from-eliminati', async (event, { id }) => {
  try {
    console.log(`Ripristino dagli eliminati, ID: ${id}`);
    return await dataManager.restoreFromEliminati(id, dataFolderPath);
  } catch (error) {
    console.error('Errore durante il ripristino dagli eliminati:', error);
    return { success: false, error: error.message };
  }
});

// Importa dati da Excel
ipcMain.handle('import-excel', async (event, { dataType }) => {
  try {
    console.log('================ INIZIO IMPORTAZIONE ================');
    console.log(`Avvio importazione Excel per: ${dataType}`);
    
    // Stampa anche tutti i file nella cartella dati
    const files = fs.readdirSync(dataFolderPath);
    console.log('File nella cartella dati:', files);
    
    // Se esiste il file clienti.json, stampa il suo contenuto
    const clientiPath = path.join(dataFolderPath, `${dataType}.json`);
    if (fs.existsSync(clientiPath)) {
      const clientiContent = fs.readFileSync(clientiPath, 'utf8');
      console.log(`Contenuto file ${dataType}.json:`, clientiContent);
    }
    
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
    console.log(`File Excel selezionato: ${filePath}`);
    
    // Procedi con l'importazione
    const result = await excelImporter.importFile(filePath, dataType);
    
    console.log('Risultato importazione:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`Dati importati con successo: ${result.data.length} record`);
      
      // Carica i dati esistenti
      const currentDataResult = await dataManager.loadData(dataType, dataFolderPath, true);
      
      console.log(`Risultato caricamento dati esistenti:`, JSON.stringify(currentDataResult, null, 2));
      
      if (!currentDataResult.success) {
        return { 
          success: false, 
          message: `Errore durante il caricamento dei dati esistenti: ${currentDataResult.error}`
        };
      }
      
      // Filtra per escludere i record eliminati
      let currentData = currentDataResult.data || [];
      console.log(`Dati esistenti prima del filtro: ${currentData.length} record`);
      
      // Filtra per mantenere solo i record non eliminati
      currentData = currentData.filter(item => !item.eliminato);
      console.log(`Dati esistenti dopo il filtro: ${currentData.length} record`);
      
      // Unisci i dati esistenti con quelli importati
      const updatedData = [...currentData];
      
      console.log(`Inizio unione dati: ${updatedData.length} record esistenti + ${result.data.length} importati`);
      
      let newRecords = 0;
      let updatedRecords = 0;
      
      for (const importedItem of result.data) {
        const existingIndex = updatedData.findIndex(item => 
          item.nome && importedItem.nome && 
          item.azienda && importedItem.azienda && 
          item.nome.toLowerCase() === importedItem.nome.toLowerCase() && 
          item.azienda.toLowerCase() === importedItem.azienda.toLowerCase()
        );
        
        if (existingIndex !== -1) {
          // Mantiene l'ID originale e altri campi rilevanti
          const originalId = updatedData[existingIndex].id;
          const eliminato = updatedData[existingIndex].eliminato || false;
          
          console.log(`Aggiornamento record esistente: ${importedItem.nome} - ${importedItem.azienda} (ID: ${originalId})`);
          
          // Aggiorna il record
          updatedData[existingIndex] = {
            ...updatedData[existingIndex],
            ...importedItem,
            id: originalId,
            eliminato: eliminato,
            lastUpdate: Date.now()
          };
          
          updatedRecords++;
        } else {
          // Aggiungi un nuovo record
          const newId = Date.now() + updatedData.length + newRecords;
          
          console.log(`Aggiunta nuovo record: ${importedItem.nome} - ${importedItem.azienda} (ID: ${newId})`);
          
          updatedData.push({
            ...importedItem,
            id: newId,
            eliminato: false,
            createdAt: Date.now()
          });
          
          newRecords++;
        }
      }
      
      console.log(`Dati aggiornati: ${updatedData.length} record totali (${newRecords} nuovi, ${updatedRecords} aggiornati)`);
      
      // Salva i dati aggiornati
      const saveResult = await dataManager.saveData(dataType, updatedData, dataFolderPath);
      
      console.log('Risultato salvataggio dati:', JSON.stringify(saveResult, null, 2));
      
      if (!saveResult.success) {
        return { 
          success: false, 
          message: `Errore durante il salvataggio dei dati: ${saveResult.error}`
        };
      }
      
      return { 
        success: true, 
        message: `Importazione completata con successo: ${newRecords} nuovi record, ${updatedRecords} record aggiornati`,
        data: updatedData.filter(item => !item.eliminato)
      };
    }
    
    return result;
  } catch (error) {
    console.error(`Errore durante l'importazione Excel:`, error);
    return { 
      success: false, 
      message: `Errore durante l'importazione: ${error.message}`
    };
  } finally {
    console.log('================ FINE IMPORTAZIONE ================');
  }
});

// Esporta dati per GLS
ipcMain.handle('export-gls', async (event) => {
  try {
    console.log('Avvio esportazione GLS');
    
    // Carica clienti e partner
    const clientiResult = await dataManager.loadData('clienti', dataFolderPath);
    const partnerResult = await dataManager.loadData('partner', dataFolderPath);
    
    if (!clientiResult.success) {
      throw new Error(`Errore durante il caricamento dei clienti: ${clientiResult.error}`);
    }
    
    if (!partnerResult.success) {
      throw new Error(`Errore durante il caricamento dei partner: ${partnerResult.error}`);
    }
    
    // Unisci i dati
    const allData = [...clientiResult.data, ...partnerResult.data];
    
    // Filtra solo i record con GLS = 1
    const glsData = allData.filter(record => 
      record.gls && (record.gls === '1' || record.gls === 1 || record.gls === true)
    );
    
    if (glsData.length === 0) {
      return {
        success: false,
        message: 'Nessun record da esportare per GLS'
      };
    }
    
    // Genera il file Excel
    const excelBuffer = excelImporter.exportGLS(glsData);
    
    // Apri il dialog per salvare il file
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Salva file Excel per GLS',
      defaultPath: path.join(app.getPath('documents'), 'Spedizioni_GLS.xlsx'),
      filters: [
        { name: 'Excel', extensions: ['xlsx'] }
      ]
    });
    
    if (canceled || !filePath) {
      return {
        success: false,
        message: 'Esportazione annullata dall\'utente'
      };
    }
    
    // Scrivi il file
    await fs.promises.writeFile(filePath, excelBuffer);
    
    return {
      success: true,
      message: `Esportazione completata con successo: ${glsData.length} record`,
      filePath: filePath
    };
  } catch (error) {
    console.error(`Errore durante l'esportazione GLS:`, error);
    return { 
      success: false, 
      message: `Errore durante l'esportazione: ${error.message}`
    };
  }
});

// Aggiorna più record con la stessa proprietà
ipcMain.handle('update-bulk', async (event, { dataType, ids, propertyName, propertyValue }) => {
  try {
    console.log(`Aggiornamento bulk: ${dataType}, proprietà: ${propertyName}, valore: ${propertyValue}`);
    
    // Carica i dati
    const result = await dataManager.loadData(dataType, dataFolderPath, true);
    
    if (!result.success) {
      throw new Error(`Errore durante il caricamento dei dati: ${result.error}`);
    }
    
    // Aggiorna i record
    const updatedData = result.data.map(item => {
      if (ids.includes(item.id)) {
        return {
          ...item,
          [propertyName]: propertyValue,
          lastUpdate: Date.now()
        };
      }
      return item;
    });
    
    // Salva i dati aggiornati
    const saveResult = await dataManager.saveData(dataType, updatedData, dataFolderPath);
    
    if (!saveResult.success) {
      throw new Error(`Errore durante il salvataggio dei dati: ${saveResult.error}`);
    }
    
    return {
      success: true,
      message: `Aggiornamento completato con successo: ${ids.length} record`,
      data: updatedData.filter(item => !item.eliminato)
    };
  } catch (error) {
    console.error(`Errore durante l'aggiornamento bulk:`, error);
    return { 
      success: false, 
      message: `Errore durante l'aggiornamento: ${error.message}`
    };
  }
});