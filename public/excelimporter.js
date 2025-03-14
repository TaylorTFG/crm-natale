const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

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
      console.log(`===== INIZIO IMPORTAZIONE EXCEL =====`);
      console.log(`Tipo dati: ${dataType}, File: ${filePath}`);
      
      // Stampa informazioni di debug sul file
      const fileStats = fs.statSync(filePath);
      console.log(`Dimensione file: ${fileStats.size} bytes`);
      console.log(`Ultima modifica: ${fileStats.mtime}`);
      
      // Leggi il file Excel con tutte le opzioni
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        dateNF: 'yyyy-mm-dd',
        cellStyles: true,
        cellNF: true,
        type: 'binary',
        raw: false
      });
      
      console.log(`File Excel letto con successo`);
      console.log(`Fogli disponibili: ${workbook.SheetNames.join(', ')}`);
      
      // Determina da quale foglio importare in base al dataType
      let sheetName = this.determineSheetName(workbook, dataType);
      console.log(`Foglio selezionato: ${sheetName}`);
      
      // Ottieni il foglio di lavoro
      const worksheet = workbook.Sheets[sheetName];
      
      // Debug: stampa la struttura del foglio
      console.log('Intervallo foglio:', worksheet['!ref']);
      
      // Debug: stampa alcune celle di esempio per capire la struttura
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      console.log(`Dimensioni foglio: ${range.e.r + 1} righe × ${range.e.c + 1} colonne`);
      
      // Stampa intestazioni (prima riga)
      let headers = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r, c: C})];
        headers.push(cell ? cell.v : '');
      }
      console.log('Intestazioni rilevate:', headers);
      
      // Converti in JSON con diverse impostazioni per gestire più formati
      console.log('Provo conversione con intestazioni automatiche...');
      let jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '', 
        raw: false,
        blankrows: false
      });
      
      // Se non ci sono dati o il formato non è quello previsto, prova altre strategie
      if (!jsonData.length || Object.keys(jsonData[0]).length <= 1) {
        console.log('Prima conversione senza risultati validi, provo con altre impostazioni...');
        
        // Prova senza intestazioni (assumendo che la prima riga sia dati)
        jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: '',
          raw: false,
          blankrows: false,
          header: 'A'  // Usa lettere come intestazioni
        });
        
        // Se ancora non funziona, prova a usare la prima riga come intestazioni
        if (!jsonData.length || Object.keys(jsonData[0]).length <= 1) {
          console.log('Seconda conversione fallita, provo con intestazioni esplicite...');
          
          // Crea intestazioni esplicite basate su ciò che sappiamo
          const explicitHeaders = this.createExplicitHeaders();
          
          jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: '',
            raw: false,
            blankrows: false,
            header: explicitHeaders
          });
        }
      }
      
      console.log(`Righe Excel da importare: ${jsonData.length}`);
      
      // Debug: stampa le intestazioni per verificare la struttura
      if (jsonData.length > 0) {
        console.log('Struttura dei dati:', Object.keys(jsonData[0]));
      }
      
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
      
      // Filtra i dati validi (rimuovi righe senza nome o con tutti i campi vuoti)
      const validData = normalizedData.filter(row => {
        // Conta i campi non vuoti
        const nonEmptyFields = Object.values(row).filter(val => 
          val !== undefined && val !== null && val !== ''
        ).length;
        
        // Richiedi almeno il nome o l'azienda e almeno 3 campi non vuoti in totale
        return (row.nome || row.azienda) && nonEmptyFields >= 3;
      });
      
      console.log(`Normalizzazione completata: ${validData.length} record validi su ${normalizedData.length} totali`);
      
      // Verifica delle chiavi utilizzate
      if (validData.length > 0) {
        const keys = Object.keys(validData[0]);
        console.log('Chiavi nel primo record normalizzato:', keys.join(', '));
      }
      
      console.log(`===== FINE IMPORTAZIONE EXCEL =====`);
      
      return { 
        success: true, 
        message: `Importazione completata con successo: ${validData.length} record validi su ${normalizedData.length} totali`,
        data: validData
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
   * Determina quale foglio usare in base al tipo di dati
   * @param {Object} workbook - Workbook Excel
   * @param {string} dataType - Tipo di dati (clienti/partner)
   * @returns {string} - Nome del foglio da usare
   */
  determineSheetName(workbook, dataType) {
    const sheetNames = workbook.SheetNames;
    
    // Array di possibili nomi di foglio in ordine di priorità
    const possibleNames = [
      dataType.charAt(0).toUpperCase() + dataType.slice(1), // "Clienti" o "Partner"
      dataType, // "clienti" o "partner"
      dataType + 'i', // "clienti" se dataType = "client"
      dataType.charAt(0).toUpperCase() + dataType.slice(1, -1) + 'i' // "Clienti" se dataType = "client"
    ];
    
    // Cerca un foglio con nome corrispondente
    for (const name of possibleNames) {
      if (sheetNames.includes(name)) {
        return name;
      }
    }
    
    // Cerca nomi che contengono il dataType
    for (const sheetName of sheetNames) {
      if (sheetName.toLowerCase().includes(dataType.toLowerCase())) {
        return sheetName;
      }
    }
    
    // Se non trova corrispondenze, usa il primo foglio
    return sheetNames[0];
  }
  
  /**
   * Crea un array di intestazioni esplicite per il foglio
   * @returns {Array} - Array di intestazioni
   */
  createExplicitHeaders() {
    return [
      'nome', 'azienda', 'indirizzo', 'civico', 'cap', 'localita', 'provincia',
      'telefono', 'email', 'note', 'grappa', 'extraAltro', 'consegnaSpedizione', 'gls'
    ];
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
    const normalizedRow = {
      tipo: dataType,
      eliminato: false,
      createdAt: Date.now()
    };
    
    // Mappa di corrispondenza per le chiavi (nomi colonne)
    // La chiave è il nome standardizzato, i valori sono possibili varianti
    const keyMapping = {
      // Mappatura per nomi comuni (minuscolo per facilitare il confronto)
      'nome': ['nome', 'nome persona', 'nominativo', 'nome_persona', 'nome cliente', 'nome e cognome', 'persona', 'referente', 'nome referente', 'cliente'],
      'azienda': ['azienda', 'nome azienda', 'società', 'ragione sociale', 'company', 'ditta', 'società cliente', 'societa', 'nome societa', 'società'],
      'indirizzo': ['indirizzo', 'via', 'strada', 'address', 'via/piazza', 'indirizzo stradale', 'via piazza', 'indirizzo spedizione'],
      'civico': ['civico', 'numero civico', 'n. civico', 'n.civico', 'n°', 'numero', 'numero indirizzo', 'n. civico', 'num', 'num.'],
      'cap': ['cap', 'codice postale', 'postal code', 'zip', 'codice avviamento postale', 'c.a.p.', 'c.a.p'],
      'localita': ['localita', 'località', 'comune', 'città', 'city', 'paese', 'town', 'citta', 'loc', 'loc.'],
      'provincia': ['provincia', 'prov', 'province', 'pr', 'pr.', 'sigla provincia', 'prov.', 'provincia sigla'],
      'telefono': ['telefono', 'tel', 'phone', 'cellulare', 'tel.', 'numero telefono', 'cell', 'numero cellulare', 'tel/cell', 'cell.'],
      'email': ['email', 'e-mail', 'mail', 'posta elettronica', 'indirizzo email', 'e mail', 'posta'],
      'note': ['note', 'annotazioni', 'commenti', 'notes', 'note aggiuntive', 'note cliente', 'commento'],
      'tipologia': ['tipologia', 'tipo partner', 'categoria', 'tipo cliente', 'tipo', 'category', 'gruppo'],
      'grappa': ['grappa', 'regalo grappa', 'omaggio grappa', 'regalo', 'gift', 'presente', 'omaggio', 'dono'],
      'extraAltro': ['extra/altro', 'extra', 'altro regalo', 'altro omaggio', 'extra regalo', 'regalo extra', 'altro', 'altri regali', 'extra/altri'],
      'consegnaSpedizione': ['consegna/spedizione', 'consegna', 'consegna a mano', 'incaricato consegna', 'consegnatario', 'deliverer', 'spedizione', 'incaricato', 'consegna spedizione'],
      'gls': ['gls', 'spedizione gls', 'corriere', 'spedizione', 'shipping', 'courier', 'corriere gls']
    };
    
    // Primi controlli specifici per risolvere problemi comuni
    
    // 1. Verifica se i campi hanno nomi Excel generici (A, B, C, ecc.)
    const hasGenericColumns = Object.keys(row).some(key => /^[A-Z]{1,2}$/.test(key));
    
    if (hasGenericColumns) {
      console.log('Rilevate colonne con nomi generici (A,B,C...)');
      
      // Basandoci sulla posizione comune in fogli Excel, mappiamo direttamente
      const columnOrder = ['nome', 'azienda', 'indirizzo', 'civico', 'cap', 'localita', 'provincia', 
                         'telefono', 'email', 'note', 'grappa', 'extraAltro', 'consegnaSpedizione', 'gls'];
      
      // Associa le colonne in ordine
      let colIndex = 0;
      for (const key of Object.keys(row).sort()) {
        if (/^[A-Z]{1,2}$/.test(key) && colIndex < columnOrder.length) {
          const value = row[key];
          if (value !== undefined && value !== null && value !== '') {
            normalizedRow[columnOrder[colIndex]] = this.normalizeValue(columnOrder[colIndex], value);
          }
          colIndex++;
        }
      }
      
      return normalizedRow;
    }
    
    // 2. Per tutti gli altri casi, analizziamo ogni campo
    for (const originalKey in row) {
      if (Object.prototype.hasOwnProperty.call(row, originalKey)) {
        const value = row[originalKey];
        
        // Salta valori vuoti
        if (value === '' || value === null || value === undefined) {
          continue;
        }
        
        // Normalizza la chiave (minuscolo, senza spazi o caratteri speciali)
        const normalizedKey = String(originalKey).toLowerCase()
          .trim()
          .replace(/[\/\-_.]/g, ' ')  // sostituisci caratteri speciali con spazi
          .replace(/\s+/g, ' ');      // riduci spazi multipli ad uno solo
        
        console.log(`Normalizzazione chiave: "${originalKey}" -> "${normalizedKey}"`);
        
        // Cerca la chiave corretta nella mappa
        let mappedKey = null;
        
        // 2.1 Cerca corrispondenza esatta
        for (const key in keyMapping) {
          if (keyMapping[key].includes(normalizedKey)) {
            mappedKey = key;
            break;
          }
        }
        
        // 2.2 Se non c'è corrispondenza esatta, cerca corrispondenze parziali
        if (!mappedKey) {
          for (const key in keyMapping) {
            for (const possibleKey of keyMapping[key]) {
              if (normalizedKey.includes(possibleKey) || possibleKey.includes(normalizedKey)) {
                mappedKey = key;
                break;
              }
            }
            if (mappedKey) break;
          }
        }
        
        // Usa la chiave mappata o, se non trovata, una versione semplificata della chiave originale
        const finalKey = mappedKey || normalizedKey.replace(/\s+/g, '_');
        console.log(`Mappatura chiave: "${normalizedKey}" -> "${finalKey}"`);
        
        // Normalizza il valore in base al tipo di campo
        normalizedRow[finalKey] = this.normalizeValue(finalKey, value);
      }
    }
    
    console.log('Riga normalizzata:', JSON.stringify(normalizedRow, null, 2));
    
    return normalizedRow;
  }
  
  /**
   * Normalizza un valore in base al tipo di campo
   * @param {string} fieldName - Nome del campo
   * @param {*} value - Valore da normalizzare
   * @returns {*} - Valore normalizzato
   */
  normalizeValue(fieldName, value) {
    // Gestione per campi booleani (grappa, gls)
    if (fieldName === 'grappa' || fieldName === 'gls') {
      return this.normalizeBoolean(value) ? '1' : '';
    }
    
    // Se è una data, converti in stringa ISO
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Per altri campi, assicurati che il valore sia una stringa
    return String(value).trim();
  }
  
  /**
   * Normalizza i valori booleani da vari formati
   * @param {*} value - Valore da normalizzare
   * @returns {boolean} - Valore booleano normalizzato
   */
  normalizeBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'number') {
      return value === 1;
    }
    
    if (typeof value === 'string') {
      const lowercaseValue = value.toLowerCase().trim();
      return lowercaseValue === '1' || 
             lowercaseValue === 'true' || 
             lowercaseValue === 'yes' || 
             lowercaseValue === 'sì' || 
             lowercaseValue === 'si' || 
             lowercaseValue === 'vero' ||
             lowercaseValue === 'x' ||
             lowercaseValue === '✓' ||
             lowercaseValue === '✔' ||
             lowercaseValue === '√';
    }
    
    return false;
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
        // Determina il nome destinatario (priorità all'azienda se presente)
        const nomeDestinatario = record.azienda && record.azienda.trim() !== '' 
          ? record.azienda 
          : record.nome;
          
        // Combina indirizzo e civico
        const indirizzo = `${record.indirizzo || ''} ${record.civico || ''}`.trim();
        
        return {
          'NOME DESTINATARIO': nomeDestinatario || '',
          'INDIRIZZO': indirizzo || '',
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
      
      // Imposta la larghezza delle colonne
      const colWidths = [
        { wch: 30 }, // NOME DESTINATARIO
        { wch: 40 }, // INDIRIZZO
        { wch: 20 }, // LOCALITA
        { wch: 5 },  // PROV
        { wch: 10 }, // CAP
        { wch: 20 }, // TIPO MERCE
        { wch: 5 },  // COLLI
        { wch: 30 }, // NOTE SPEDIZIONE
        { wch: 25 }, // RIFERIMENTO MITTENTE
        { wch: 15 }  // TELEFONO
      ];
      
      worksheet['!cols'] = colWidths;
      
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