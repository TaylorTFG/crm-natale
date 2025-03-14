const fs = require('fs');
const path = require('path');

/**
 * Gestisce il caricamento e il salvataggio dei dati
 */
class DataManager {
  /**
   * Carica i dati da un file JSON
   * @param {string} dataType - Tipo di dati da caricare (clienti/partner)
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<Array>} - Dati caricati
   */
  async loadData(dataType, dataFolderPath) {
    try {
      const filePath = path.join(dataFolderPath, `${dataType}.json`);
      
      // Se il file non esiste, restituisci un array vuoto
      if (!fs.existsSync(filePath)) {
        console.log(`File ${filePath} non trovato. Restituisco array vuoto.`);
        return { success: true, data: [] };
      }
      
      // Leggi il file
      const data = await fs.promises.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(data);
      
      console.log(`Dati caricati da ${filePath}: ${parsedData.length} record`);
      return { success: true, data: parsedData };
    } catch (error) {
      console.error(`Errore durante il caricamento dei dati ${dataType}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Salva i dati in un file JSON
   * @param {string} dataType - Tipo di dati da salvare (clienti/partner)
   * @param {Array} data - Dati da salvare
   * @param {string} dataFolderPath - Percorso della cartella dati
   * @returns {Promise<void>}
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
      
      console.log(`Dati salvati in ${filePath}: ${data.length} record`);
      return { success: true };
    } catch (error) {
      console.error(`Errore durante il salvataggio dei dati ${dataType}:`, error);
      throw error;
    }
  }
}

module.exports = new DataManager();
