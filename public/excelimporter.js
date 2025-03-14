const XLSX = require('xlsx');

/**
 * Classe per la gestione dell'importazione da Excel
 */
class ExcelImporter {
  /**
   * Importa dati da un file Excel
   * @param {string} filePath - Percorso del file Excel
   * @param {string} dataType - Tipo di dati da importare (clienti/partner)
   * @returns {Promise<Object>} - Risultato dell'importazione
   */
  async importFile(filePath, dataType) {
    try {
      console.log(`Inizio importazione Excel: ${filePath} per ${dataType}`);
      
      // Leggi il file Excel
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });
      
      console.log(`File Excel letto con successo, fogli disponibili: ${workbook.SheetNames.join(', ')}`);
      
      // Determina da quale foglio importare in base al dataType
      let sheetName;
      
      if (dataType === 'clienti' && workbook.SheetNames.includes('clienti')) {
        sheetName = 'clienti';
      } else if (dataType === 'partner' && workbook.SheetNames.includes('partner')) {
        sheetName = 'partner';
      } else {
        // Se il foglio specifico non esiste, usa il primo foglio
        sheetName = workbook.SheetNames[0];
        console.log(`Foglio specifico "${dataType}" non trovato, uso il primo foglio: ${sheetName}`);
      }
      
      // Ottieni il foglio di lavoro
      const worksheet = workbook.Sheets[sheetName];
      
      // Converti in JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      console.log(`Righe Excel da importare: ${jsonData.length}`);
      
      // Log di esempio per debug
      if (jsonData.length > 0) {
        console.log('Esempio prima riga:', JSON.stringify(jsonData[0], null, 2));
      }
      
      // Normalizza i dati
      const normalizedData = jsonData.map((row, index) => {
        // Normalizza i nomi delle colonne e i valori
        const normalizedRow = this.normalizeRowData(row, dataType);
        
        // Aggiungi un ID univoco se non esiste
        normalizedRow.id = normalizedRow.id || Date.now() + index;
        
        return normalizedRow;
      });
      
      console.log(`Importazione completata: ${normalizedData.length} record`);
      
      return { 
        success: true, 
        message: `Importazione completata con successo: ${normalizedData.length} record`,
        data: normalizedData
      };
    } catch (error) {
      console.error(`Errore durante l'importazione Excel:`, error);
      return { 
        success: false, 
        message: `Errore durante l'importazione: ${error.message}`
      };
    }
  }
  
  /**
   * Normalizza i dati di una riga
   * @param {Object} row - Riga di dati da normalizzare
   * @param {string} dataType - Tipo di dati (clienti/partner)
   * @returns {Object} - Dati normalizzati
   */
  normalizeRowData(row, dataType) {
    // Crea un nuovo oggetto per i dati normalizzati
    const normalizedRow = {};
    
    // Mappa di corrispondenza per le chiavi (nomi colonne)
    const keyMapping = {
      // Mappatura per nomi comuni
      'nome': ['nome', 'nome persona', 'nominativo', 'nome_persona', 'nome cliente'],
      'azienda': ['azienda', 'nome azienda', 'società', 'ragione sociale', 'company'],
      'indirizzo': ['indirizzo', 'via', 'strada', 'address'],
      'cap': ['cap', 'codice postale', 'postal code', 'zip'],
      'localita': ['localita', 'località', 'comune', 'città', 'city'],
      'provincia': ['provincia', 'prov', 'province'],
      'telefono': ['telefono', 'tel', 'phone', 'cellulare'],
      'email': ['email', 'e-mail', 'mail', 'posta elettronica'],
      'note': ['note', 'annotazioni', 'commenti', 'notes']
    };
    
    // Per ogni proprietà nella riga originale
    for (const originalKey in row) {
      // Normalizza la chiave (minuscolo, senza spazi)
      const normalizedKey = originalKey.toLowerCase().trim();
      
      // Cerca la chiave corretta nella mappa
      let mappedKey = null;
      
      for (const key in keyMapping) {
        if (keyMapping[key].some(k => k === normalizedKey)) {
          mappedKey = key;
          break;
        }
      }
      
      // Se abbiamo trovato una corrispondenza, usa la chiave mappata
      // altrimenti usa la chiave normalizzata
      const finalKey = mappedKey || normalizedKey;
      
      // Aggiungi la proprietà all'oggetto normalizzato
      normalizedRow[finalKey] = row[originalKey];
    }
    
    // Aggiungi tipo di dato (cliente/partner)
    normalizedRow.tipo = dataType === 'partner' ? 'partner' : 'cliente';
    
    return normalizedRow;
  }
}

module.exports = new ExcelImporter();
