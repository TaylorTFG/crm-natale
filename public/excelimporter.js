const XLSX = require('xlsx');
const path = require('path');

/**
 * Classe per la gestione dell'importazione da Excel
 */
class ExcelImporter {
  /**
   * Importa dati da un file Excel
   * @param {string} filePath - Percorso del file Excel
   * @param {string} dataType - Tipo di dati da importare (clienti/partner)
   * @returns {Promise<Object>} - Risultato dell'importazione
   * @param {Object} row - Riga di dati da normalizzare
   * @param {string} dataType - Tipo di dati (clienti/partner)
   * @returns {Object} - Dati normalizzati
   */

  async importFile(filePath, dataType) {
    try {
      console.log(`Inizio importazione Excel: ${filePath} per ${dataType}`);
      console.log(`Percorso file: ${filePath}`);
      console.log(`Tipo dati: ${dataType}`);
      
      // Leggi il file Excel
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });
      
      console.log(`File Excel letto con successo`);
      console.log(`Fogli disponibili: ${workbook.SheetNames.join(', ')}`);
      
      // Determina da quale foglio importare in base al dataType
      let sheetName;
      
      if (dataType === 'clienti' && workbook.SheetNames.includes('Clienti')) {
        sheetName = 'Clienti';
      } else if (dataType === 'partner' && workbook.SheetNames.includes('Partner')) {
        sheetName = 'Partner';
      } else if (dataType === 'clienti' && workbook.SheetNames.includes('clienti')) {
        sheetName = 'clienti';
      } else if (dataType === 'partner' && workbook.SheetNames.includes('partner')) {
        sheetName = 'partner';
      } else {
        // Se il foglio specifico non esiste, usa il primo foglio
        sheetName = workbook.SheetNames[0];
        console.log(`Foglio specifico "${dataType}" non trovato, uso il primo foglio: ${sheetName}`);
      }
      
      console.log(`Foglio selezionato: ${sheetName}`);

      // Ottieni il foglio di lavoro
      const worksheet = workbook.Sheets[sheetName];
      
      // Stampa la struttura del foglio per debug
      console.log('Intervallo foglio:', worksheet['!ref']);

      // Converti in JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      console.log(`Righe Excel da importare: ${jsonData.length}`);
      
      // Log delle prime 3 righe per debug
    if (jsonData.length > 0) {
      console.log('Prime 3 righe esempio:');
      for (let i = 0; i < Math.min(3, jsonData.length); i++) {
        console.log(`Riga ${i+1}:`, JSON.stringify(jsonData[i], null, 2));
      }
    }
      // Normalizza i dati
      console.log('Inizio normalizzazione dati...');
      const normalizedData = jsonData.map((row, index) => {
        // Normalizza i nomi delle colonne e i valori
        const normalizedRow = this.normalizeRowData(row, dataType);
        
        // Aggiungi un ID univoco se non esiste
        if (!normalizedRow.id) {
          normalizedRow.id = Date.now() + index;
        }
        
        // Log per le prime 3 righe normalizzate
        if (index < 3) {
        console.log(`Riga ${index+1} normalizzata:`, JSON.stringify(normalizedRow, null, 2));
        }

        return normalizedRow;
      });
      
      console.log(`Normalizzazione completata: ${normalizedData.length} record`);
      
       // Verifica delle chiavi utilizzate
    if (normalizedData.length > 0) {
      const keys = Object.keys(normalizedData[0]);
      console.log('Chiavi nel primo record normalizzato:', keys.join(', '));
    }
    
    console.log(`===== FINE IMPORTAZIONE EXCEL =====`);
    
    return { 
      success: true, 
      message: `Importazione completata con successo: ${normalizedData.length} record`,
      data: normalizedData
    };
  } catch (error) {
    console.error(`Errore durante l'importazione Excel:`, error);
    console.log(`===== ERRORE IMPORTAZIONE EXCEL =====`);
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
    console.log('Normalizzazione riga:', JSON.stringify(row, null, 2));
    // Crea un nuovo oggetto per i dati normalizzati
    const normalizedRow = {};
    
    // Mappa di corrispondenza per le chiavi (nomi colonne)
    const keyMapping = {
    // Mappatura per nomi comuni
    'nome': ['nome', 'nome persona', 'nominativo', 'nome_persona', 'nome cliente', 'nome e cognome'],
    'azienda': ['azienda', 'nome azienda', 'società', 'ragione sociale', 'company', 'ditta'],
    'indirizzo': ['indirizzo', 'via', 'strada', 'address', 'via/piazza'],
    'civico': ['civico', 'numero civico', 'n. civico', 'n.civico', 'n°', 'numero'],
    'cap': ['cap', 'codice postale', 'postal code', 'zip'],
    'localita': ['localita', 'località', 'comune', 'città', 'city'],
    'provincia': ['provincia', 'prov', 'province', 'pr', 'pr.'],
    'telefono': ['telefono', 'tel', 'phone', 'cellulare', 'tel.'],
    'email': ['email', 'e-mail', 'mail', 'posta elettronica'],
    'note': ['note', 'annotazioni', 'commenti', 'notes'],
    'tipologia': ['tipologia', 'tipo partner', 'categoria'],
    'grappa': ['grappa', 'regalo grappa', 'omaggio grappa'],
    'extraAltro': ['extra/altro', 'extra', 'altro regalo', 'altro omaggio'],
    'consegnaSpedizione': ['consegna/spedizione', 'consegna', 'consegna a mano', 'incaricato consegna'],
    'gls': ['gls', 'spedizione gls', 'corriere']
  };
    
    // Per ogni proprietà nella riga originale
    for (const originalKey in row) {
      if (Object.prototype.hasOwnProperty.call(row, originalKey)) {
        // Normalizza la chiave (minuscolo, senza spazi)
        const normalizedKey = originalKey.toLowerCase().trim();
        console.log(`Normalizzazione chiave: "${originalKey}" -> "${normalizedKey}"`);
        
        // Cerca la chiave corretta nella mappa
        let mappedKey = null;
        
        for (const key in keyMapping) {
          if (keyMapping[key].includes(normalizedKey)) {
            mappedKey = key;
            break;
          }
        }
        
        // Se abbiamo trovato una corrispondenza, usa la chiave mappata
        // altrimenti usa la chiave normalizzata
        const finalKey = mappedKey || normalizedKey;
        console.log(`Mappatura chiave: "${normalizedKey}" -> "${finalKey}"`);
        
        // Aggiungi la proprietà all'oggetto normalizzato
        normalizedRow[finalKey] = row[originalKey];
      }
    }
    
    // Aggiungi tipo di dato (cliente/partner)
    normalizedRow.tipo = dataType;
    console.log(`Tipo assegnato: ${dataType}`);
    
    // Imposta a false lo stato eliminato
    normalizedRow.eliminato = false;
    
    // Aggiungi data di creazione
    normalizedRow.createdAt = Date.now();

    console.log('Riga normalizzata:', JSON.stringify(normalizedRow, null, 2));
    
    return normalizedRow;
  }

  /**
   * Esporta dati per le spedizioni GLS
   * @param {Array} data - Array di clienti/partner
   * @returns {Buffer} - File Excel
   */
  exportGLS(data) {
    try {
      console.log(`Inizio esportazione dati per GLS: ${data.length} record`);
      
      // Filtra solo i record con GLS impostato
      const glsRecords = data.filter(record => 
        record.gls && (record.gls === '1' || record.gls === 1 || record.gls === true)
      );
      
      if (glsRecords.length === 0) {
        throw new Error('Nessun record da esportare per GLS');
      }
      
      console.log(`Record da esportare per GLS: ${glsRecords.length}`);
      
      // Formatta i dati secondo il template richiesto da GLS
      const formattedData = glsRecords.map(record => {
        return {
          'NOME DESTINATARIO': record.azienda ? record.azienda : record.nome,
          'INDIRIZZO': `${record.indirizzo || ''} ${record.civico || ''}`.trim(),
          'LOCALITA\'': record.localita || '',
          'PROV': record.provincia || '',
          'CAP': record.cap || '',
          'TIPO MERCE': 'OMAGGIO NATALIZIO',
          'COLLI': '1',
          'NOTE SPEDIZIONE': record.note || '',
          'RIFERIMENTO MITTENTE': record.nome || '',
          'TELEFONO': record.telefono || ''
        };
      });
      
      // Crea un nuovo workbook
      const workbook = XLSX.utils.book_new();
      
      // Crea un nuovo worksheet
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Aggiungi il worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Spedizioni GLS');
      
      // Esporta il workbook come buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      console.log('Esportazione GLS completata con successo');
      
      return excelBuffer;
    } catch (error) {
      console.error(`Errore durante l'esportazione GLS:`, error);
      throw error;
    }
  }
}

module.exports = new ExcelImporter();
