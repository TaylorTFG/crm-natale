const fs = require('fs');
const path = require('path');

/**
 * Gestisce il caricamento e il salvataggio dei dati
 */
class DataManager {
  /**
   * Carica i dati da un file JSON
   * @param {string} dataType - Tipo di dati da caricare (clienti/partner/settings/eliminati)
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @param {boolean} includeEliminati - Se includere i record eliminati
   * @returns {Promise<Object>} - Dati caricati
   */
  
  async loadData(dataType, dataFolderPath, includeEliminati = false) {
    try {
      console.log(`===== CARICAMENTO DATI =====`);
      console.log(`Tipo: ${dataType}, includeEliminati: ${includeEliminati}`);
      
      const filePath = path.join(dataFolderPath, `${dataType}.json`);
      console.log(`Percorso file: ${filePath}`);
      
      // Se il file non esiste, restituisci un array vuoto
      if (!fs.existsSync(filePath)) {
        console.log(`File ${filePath} non trovato. Restituisco array vuoto.`);
        return { success: true, data: [] };
      }
      
// Leggi il file
const data = await fs.promises.readFile(filePath, 'utf8');
console.log(`File letto correttamente, lunghezza dati: ${data.length} bytes`);

// Se il file è vuoto, restituisci un array vuoto
if (!data.trim()) {
  console.log(`File ${filePath} è vuoto. Restituisco array vuoto.`);
  return { success: true, data: [] };
}

try {
  let parsedData = JSON.parse(data);
  console.log(`Dati JSON parsati correttamente, ${Array.isArray(parsedData) ? parsedData.length : 0} record`);
  
  // Assicurati che sia un array
  if (!Array.isArray(parsedData)) {
    console.log(`I dati non sono un array. Converto in array.`);
    parsedData = [parsedData];
  }
  
  // Debug: stampa i primi 3 record
  if (parsedData.length > 0) {
    console.log('Esempio primi 3 record:');
    for (let i = 0; i < Math.min(3, parsedData.length); i++) {
      console.log(`Record ${i+1}:`, JSON.stringify(parsedData[i], null, 2));
    }
  }
  
  // Controlla per record eliminati
  const eliminatiCount = parsedData.filter(item => item.eliminato).length;
  console.log(`Record con eliminato=true: ${eliminatiCount}`);
  
  // Se non dobbiamo includere gli eliminati e non stiamo caricando gli eliminati,
  // filtra gli elementi con eliminato = true
  if (!includeEliminati && dataType !== 'eliminati') {
    const originalLength = parsedData.length;
    parsedData = parsedData.filter(item => !item.eliminato);
    console.log(`Filtrati record eliminati: ${originalLength} -> ${parsedData.length}`);
  }
  
  console.log(`Dati caricati da ${filePath}: ${parsedData.length} record`);
  console.log(`===== FINE CARICAMENTO DATI =====`);
  return { success: true, data: parsedData };
} catch (parseError) {
  console.error(`Errore nel parsing JSON:`, parseError);
  console.log(`Contenuto del file:`, data);
  return { success: false, error: `Errore nel parsing JSON: ${parseError.message}` };
}
} catch (error) {
console.error(`Errore durante il caricamento dei dati ${dataType}:`, error);
console.log(`===== ERRORE CARICAMENTO DATI =====`);
return { success: false, error: error.message };
}
}
  
  /**
   * Salva i dati in un file JSON
   * @param {string} dataType - Tipo di dati da salvare (clienti/partner/settings/eliminati)
   * @param {Array|Object} data - Dati da salvare
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  async saveData(dataType, data, dataFolderPath) {
    try {
      const filePath = path.join(dataFolderPath, `${dataType}.json`);
      
      // Salva i dati in formato JSON
      await fs.promises.writeFile(
        filePath, 
        JSON.stringify(data, null, 2), 
        'utf8'
      );
      
      console.log(`Dati salvati in ${filePath}: ${Array.isArray(data) ? data.length : 1} record`);
      return { success: true };
    } catch (error) {
      console.error(`Errore durante il salvataggio dei dati ${dataType}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Segna come eliminato un record e lo sposta negli eliminati
   * @param {string} dataType - Tipo di dati (clienti/partner)
   * @param {number|string} id - ID del record da eliminare
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  async moveToEliminati(dataType, id, dataFolderPath) {
    try {
      // Carica i dati attuali
      const { success, data, error } = await this.loadData(dataType, dataFolderPath, true);
      if (!success) {
        throw new Error(error);
      }
      
      // Trova l'indice del record da eliminare
      const index = data.findIndex(item => item.id === id);
      if (index === -1) {
        throw new Error(`Record con ID ${id} non trovato`);
      }
      
      // Segna il record come eliminato
      data[index].eliminato = true;
      data[index].eliminatoIl = Date.now();
      
      // Salva i dati aggiornati
      await this.saveData(dataType, data, dataFolderPath);
      
      // Carica gli eliminati
      const eliminatiResult = await this.loadData('eliminati', dataFolderPath);
      const eliminati = eliminatiResult.success ? eliminatiResult.data : [];
      
      // Aggiungi il record eliminato
      eliminati.push(data[index]);
      
      // Salva gli eliminati
      await this.saveData('eliminati', eliminati, dataFolderPath);
      
      return { success: true };
    } catch (error) {
      console.error(`Errore durante lo spostamento negli eliminati:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Ripristina un record eliminato
   * @param {number|string} id - ID del record da ripristinare
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  async restoreFromEliminati(id, dataFolderPath) {
    try {
      // Carica gli eliminati
      const { success, data, error } = await this.loadData('eliminati', dataFolderPath);
      if (!success) {
        throw new Error(error);
      }
      
      // Trova l'indice del record da ripristinare
      const index = data.findIndex(item => item.id === id);
      if (index === -1) {
        throw new Error(`Record con ID ${id} non trovato tra gli eliminati`);
      }
      
      // Copia il record da ripristinare
      const record = { ...data[index] };
      
      // Rimuovi il record dagli eliminati
      data.splice(index, 1);
      
      // Salva gli eliminati aggiornati
      await this.saveData('eliminati', data, dataFolderPath);
      
      // Rimuovi il flag eliminato
      record.eliminato = false;
      delete record.eliminatoIl;
      
      // Determina il tipo di dato (clienti/partner)
      const dataType = record.tipo;
      
      // Carica i dati correnti
      const currentResult = await this.loadData(dataType, dataFolderPath, true);
      const currentData = currentResult.success ? currentResult.data : [];
      
      // Controlla se il record esiste già
      const existingIndex = currentData.findIndex(item => item.id === id);
      
      if (existingIndex !== -1) {
        // Aggiorna il record esistente
        currentData[existingIndex] = record;
      } else {
        // Aggiungi il record
        currentData.push(record);
      }
      
      // Salva i dati aggiornati
      await this.saveData(dataType, currentData, dataFolderPath);
      
      return { success: true };
    } catch (error) {
      console.error(`Errore durante il ripristino dagli eliminati:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Carica le impostazioni del CRM
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<Object>} - Impostazioni
   */
  async loadSettings(dataFolderPath) {
    try {
      const { success, data, error } = await this.loadData('settings', dataFolderPath);
      
      if (!success) {
        throw new Error(error);
      }
      
      // Se non ci sono impostazioni, crea quelle predefinite
      if (!data || data.length === 0) {
        const defaultSettings = {
          regaloCorrente: 'Grappa',
          annoCorrente: new Date().getFullYear(),
          consegnatari: [
            'Andrea Gosganch',
            'Marco Crasnich',
            'Massimo Cendron',
            'Matteo Rocchetto'
          ]
        };
        
        // Salva le impostazioni predefinite
        await this.saveData('settings', defaultSettings, dataFolderPath);
        
        return { success: true, data: defaultSettings };
      }
      
      return { success: true, data: data };
    } catch (error) {
      console.error(`Errore durante il caricamento delle impostazioni:`, error);
      
      // In caso di errore, restituisci le impostazioni predefinite
      const defaultSettings = {
        regaloCorrente: 'Grappa',
        annoCorrente: new Date().getFullYear(),
        consegnatari: [
          'Andrea Gosganch',
          'Marco Crasnich',
          'Massimo Cendron',
          'Matteo Rocchetto'
        ]
      };
      
      return { success: true, data: defaultSettings };
    }
  }
  
  /**
   * Salva le impostazioni del CRM
   * @param {Object} settings - Impostazioni da salvare
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<Object>} - Risultato dell'operazione
   */
  async saveSettings(settings, dataFolderPath) {
    return await this.saveData('settings', settings, dataFolderPath);
  }
}

module.exports = new DataManager();
