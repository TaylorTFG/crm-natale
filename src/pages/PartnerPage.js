import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import UploadIcon from '@mui/icons-material/Upload';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';

const PartnerPage = () => {
  // Stato per i dati dei partner
  const [partner, setPartner] = useState([]);
  const [filteredPartner, setFilteredPartner] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per la ricerca e i filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLocalita, setFiltroLocalita] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroGrappa, setFiltroGrappa] = useState('');
  const [filtroConsegna, setFiltroConsegna] = useState('');
  const [filtroGLS, setFiltroGLS] = useState('');
  
  // Lista delle località e province per i filtri
  const [localitaList, setLocalitaList] = useState([]);
  const [provinciaList, setProvinciaList] = useState([]);
  
  // Stato per il dialog di modifica/aggiunta
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    azienda: '',
    indirizzo: '',
    civico: '',
    cap: '',
    localita: '',
    provincia: '',
    telefono: '',
    email: '',
    note: '',
    tipologia: '',
    grappa: '',
    extraAltro: '',
    consegnaSpedizione: '',
    gls: ''
  });
  
  // Stato per la selezione multipla
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Stato per il menu delle azioni di gruppo
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  
  // Stato per i dialoghi delle azioni di gruppo
  const [openAssegnaRegaloDialog, setOpenAssegnaRegaloDialog] = useState(false);
  const [openAssegnaConsegnaDialog, setOpenAssegnaConsegnaDialog] = useState(false);
  const [openAssegnaGLSDialog, setOpenAssegnaGLSDialog] = useState(false);
  const [valoreDaAssegnare, setValoreDaAssegnare] = useState('');
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Stato per le impostazioni
  const [settings, setSettings] = useState({
    regaloCorrente: 'Grappa',
    annoCorrente: new Date().getFullYear(),
    consegnatari: []
  });
  
  // Carica i dati all'avvio
  useEffect(() => {
    Promise.all([
      loadPartner(),
      loadSettings()
    ]);
  }, []);
  
  // Carica le impostazioni
  const loadSettings = async () => {
    try {
      const result = await window.api.loadSettings();
      
      if (result.success && result.data) {
        setSettings({
          regaloCorrente: result.data.regaloCorrente || 'Grappa',
          annoCorrente: result.data.annoCorrente || new Date().getFullYear(),
          consegnatari: Array.isArray(result.data.consegnatari) ? result.data.consegnatari : []
        });
        console.log('Impostazioni caricate:', result.data);
      } else {
        console.error('Errore nel caricamento delle impostazioni:', result.error);
        // Mantieni i valori iniziali in caso di errore
      }
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni:', error);
    }
  };
  
  // Filtra i partner quando cambiano i filtri
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filtroLocalita, filtroProvincia, filtroGrappa, filtroConsegna, filtroGLS, partner]);
  
  // Calcola le opzioni dei filtri quando cambiano i partner
  useEffect(() => {
    if (partner.length > 0) {
      // Estrai le località uniche
      const localita = [...new Set(partner
        .filter(p => p.localita)
        .map(p => p.localita))]
        .sort();
      
      // Estrai le province uniche
      const province = [...new Set(partner
        .filter(p => p.provincia)
        .map(p => p.provincia))]
        .sort();
      
      setLocalitaList(localita);
      setProvinciaList(province);
    }
  }, [partner]);
  
  // Carica i partner dal backend
  const loadPartner = async () => {
    try {
      setLoading(true);
      const result = await window.api.loadData('partner');
      
      if (result.success) {
        // Ordina i partner per nome
        const sortedData = result.data.sort((a, b) => 
          a.nome && b.nome ? a.nome.localeCompare(b.nome) : 0
        );
        
        setPartner(sortedData);
        setFilteredPartner(sortedData);
        console.log(`Caricati ${result.data.length} partner`);
      } else {
        console.error('Errore nel caricamento dei partner:', result.error);
        showSnackbar('Errore nel caricamento dei partner', 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento dei partner:', error);
      showSnackbar('Errore nel caricamento dei partner', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Applica i filtri
  const applyFilters = () => {
    let filtered = [...partner];
    
    // Applica filtro ricerca
    if (searchTerm.trim() !== '') {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.nome && item.nome.toLowerCase().includes(lowercasedFilter)) ||
          (item.azienda && item.azienda.toLowerCase().includes(lowercasedFilter)) ||
          (item.localita && item.localita.toLowerCase().includes(lowercasedFilter)) ||
          (item.tipologia && item.tipologia.toLowerCase().includes(lowercasedFilter))
        );
      });
    }
    
    // Applica filtro località
    if (filtroLocalita !== '') {
      filtered = filtered.filter(item => item.localita === filtroLocalita);
    }
    
    // Applica filtro provincia
    if (filtroProvincia !== '') {
      filtered = filtered.filter(item => item.provincia === filtroProvincia);
    }
    
    // Applica filtro grappa
    if (filtroGrappa !== '') {
      const value = filtroGrappa === 'si' ? '1' : '';
      filtered = filtered.filter(item => 
        item.grappa === value || 
        item.grappa === (value === '1' ? 1 : '') || 
        item.grappa === (value === '1' ? true : false)
      );
    }
    
    // Applica filtro consegna
    if (filtroConsegna !== '') {
      // Se "Non assegnato", filtra per consegna vuota
      if (filtroConsegna === 'non_assegnato') {
        filtered = filtered.filter(item => !item.consegnaSpedizione);
      } else {
        filtered = filtered.filter(item => item.consegnaSpedizione === filtroConsegna);
      }
    }
    
    // Applica filtro GLS
    if (filtroGLS !== '') {
      const value = filtroGLS === 'si' ? '1' : '';
      filtered = filtered.filter(item => 
        item.gls === value || 
        item.gls === (value === '1' ? 1 : '') || 
        item.gls === (value === '1' ? true : false)
      );
    }
    
    setFilteredPartner(filtered);
    
    // Resetta la selezione quando cambiano i filtri
    setSelected([]);
    setSelectAll(false);
    
    // Reimposta la pagina a 0
    setPage(0);
  };
  
  // Importa dati da Excel
  const handleImportExcel = async () => {
    try {
      setLoading(true);
      showSnackbar('Importazione in corso...', 'info');
      
      const result = await window.api.importExcel('partner');
      
      if (result.success) {
        setPartner(result.data);
        showSnackbar(`Importazione completata: ${result.data?.length || 0} partner`, 'success');
      } else {
        showSnackbar(`Errore nell'importazione: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      showSnackbar('Errore durante l\'importazione', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione paginazione
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Non resettiamo la selezione quando si cambia pagina
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Gestione form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestione checkbox per grappa e GLS
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? '1' : ''
    }));
  };
  
  // Apri dialog per nuovo partner
  const handleAddPartner = () => {
    setCurrentPartner(null);
    setFormData({
      nome: '',
      azienda: '',
      indirizzo: '',
      civico: '',
      cap: '',
      localita: '',
      provincia: '',
      telefono: '',
      email: '',
      note: '',
      tipologia: '',
      grappa: '',
      extraAltro: '',
      consegnaSpedizione: '',
      gls: ''
    });
    setOpenDialog(true);
  };
  
  // Apri dialog per modifica partner
  const handleEditPartner = (partner) => {
    setCurrentPartner(partner);
    setFormData({
      nome: partner.nome || '',
      azienda: partner.azienda || '',
      indirizzo: partner.indirizzo || '',
      civico: partner.civico || '',
      cap: partner.cap || '',
      localita: partner.localita || '',
      provincia: partner.provincia || '',
      telefono: partner.telefono || '',
      email: partner.email || '',
      note: partner.note || '',
      tipologia: partner.tipologia || '',
      grappa: partner.grappa || '',
      extraAltro: partner.extraAltro || '',
      consegnaSpedizione: partner.consegnaSpedizione || '',
      gls: partner.gls || ''
    });
    setOpenDialog(true);
  };
  
  // Chiudi dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Salva partner
  const handleSavePartner = async () => {
    // Validazione basica
    if (!formData.nome) {
      showSnackbar('Il nome è obbligatorio', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      let updatedPartner;
      
      if (currentPartner) {
        // Aggiornamento partner esistente
        const updatedItem = {
          ...currentPartner,
          ...formData,
          lastUpdate: Date.now()
        };
        
        updatedPartner = partner.map(p => 
          p.id === currentPartner.id ? updatedItem : p
        );
        
        showSnackbar('Partner aggiornato con successo', 'success');
      } else {
        // Nuovo partner
        const newPartner = {
          ...formData,
          id: Date.now(),
          tipo: 'partner',
          eliminato: false,
          createdAt: Date.now()
        };
        
        updatedPartner = [...partner, newPartner];
        showSnackbar('Partner creato con successo', 'success');
      }
      
      // Aggiorna lo stato
      setPartner(updatedPartner);
      
      // Salva nel backend
      await window.api.saveData('partner', updatedPartner);
      
      // Chiudi dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showSnackbar('Errore durante il salvataggio', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina partner
  const handleDeletePartner = async (partner) => {
    if (window.confirm(`Sei sicuro di voler eliminare il partner "${partner.nome}"?`)) {
      try {
        setLoading(true);
        
        // Sposta il partner negli eliminati
        const result = await window.api.moveToEliminati('partner', partner.id);
        
        if (result.success) {
          // Aggiorna lo stato locale
          setPartner(prev => prev.filter(p => p.id !== partner.id));
          
          showSnackbar('Partner eliminato con successo', 'success');
        } else {
          console.error('Errore durante l\'eliminazione:', result.error);
          showSnackbar('Errore durante l\'eliminazione', 'error');
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        showSnackbar('Errore durante l\'eliminazione', 'error');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Gestione selezione
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // Seleziona tutti gli elementi filtrati nella pagina corrente
      const currentPageIds = filteredPartner
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(item => item.id);
      
      setSelected(currentPageIds);
    } else {
      // Deseleziona tutti
      setSelected([]);
    }
  };
  
  const handleSelectAllFiltered = () => {
    if (selected.length === filteredPartner.length) {
      // Se sono già selezionati tutti, deseleziona
      setSelected([]);
      setSelectAll(false);
    } else {
      // Altrimenti seleziona tutti i filtrati
      const allFilteredIds = filteredPartner.map(item => item.id);
      setSelected(allFilteredIds);
      setSelectAll(true);
    }
  };
  
  const handleSelectItem = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      // Aggiungi alla selezione
      newSelected = [...selected, id];
    } else {
      // Rimuovi dalla selezione
      newSelected = selected.filter(itemId => itemId !== id);
    }
    
    setSelected(newSelected);
  };
  
  const isSelected = (id) => selected.includes(id);
  
  // Gestione menu azioni di gruppo
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  // Azioni di gruppo
  const handleAssegnaRegalo = () => {
    setValoreDaAssegnare('1');
    setOpenAssegnaRegaloDialog(true);
    handleCloseMenu();
  };
  
  const handleAssegnaConsegna = () => {
    setValoreDaAssegnare('');
    setOpenAssegnaConsegnaDialog(true);
    handleCloseMenu();
  };
  
  const handleAssegnaGLS = () => {
    setValoreDaAssegnare('1');
    setOpenAssegnaGLSDialog(true);
    handleCloseMenu();
  };
  
  // Funzione per l'eliminazione multipla
  const handleBulkDelete = () => {
    if (selected.length === 0) {
      showSnackbar('Nessun elemento selezionato', 'warning');
      return;
    }
    
    if (window.confirm(`Sei sicuro di voler eliminare ${selected.length} ${selected.length === 1 ? 'partner' : 'partner'}? Questa azione non può essere annullata immediatamente.`)) {
      handleDeleteBulk();
    }
    
    handleCloseMenu();
  };

  // Funzione per eseguire l'eliminazione multipla
  const handleDeleteBulk = async () => {
    try {
      setLoading(true);
      
      // Crea una copia dell'array partner
      let updatedPartner = [...partner];
      let successCount = 0;
      
      // Elimina ogni partner selezionato
      for (const id of selected) {
        try {
          // Sposta il partner negli eliminati
          const result = await window.api.moveToEliminati('partner', id);
          
          if (result.success) {
            // Rimuovi il partner dall'array
            updatedPartner = updatedPartner.filter(p => p.id !== id);
            successCount++;
          } else {
            console.error(`Errore durante l'eliminazione del partner con ID ${id}:`, result.error);
          }
        } catch (error) {
          console.error(`Errore durante l'eliminazione del partner con ID ${id}:`, error);
        }
      }
      
      // Aggiorna lo stato
      setPartner(updatedPartner);
      
      // Resetta la selezione
      setSelected([]);
      setSelectAll(false);
      
      showSnackbar(`Eliminati con successo ${successCount} ${successCount === 1 ? 'partner' : 'partner'}`, 'success');
    } catch (error) {
      console.error('Errore durante l\'eliminazione multipla:', error);
      showSnackbar('Errore durante l\'eliminazione multipla', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Esegui azione di gruppo
  const handleBulkUpdate = async (propertyName, propertyValue) => {
    if (selected.length === 0) {
      showSnackbar('Nessun elemento selezionato', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await window.api.updateBulk('partner', selected, propertyName, propertyValue);
      
      if (result.success) {
        // Aggiorna lo stato locale
        setPartner(result.data);
        
        showSnackbar(`Aggiornamento completato: ${selected.length} elementi`, 'success');
        
        // Chiudi i dialoghi
        setOpenAssegnaRegaloDialog(false);
        setOpenAssegnaConsegnaDialog(false);
        setOpenAssegnaGLSDialog(false);
        
        // Resetta la selezione
        setSelected([]);
        setSelectAll(false);
      } else {
        console.error('Errore durante l\'aggiornamento:', result.error);
        showSnackbar('Errore durante l\'aggiornamento', 'error');
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error);
      showSnackbar('Errore durante l\'aggiornamento', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setFiltroLocalita('');
    setFiltroProvincia('');
    setFiltroGrappa('');
    setFiltroConsegna('');
    setFiltroGLS('');
  };
  
  // Mostra notifica
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Chiudi notifica
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Partner</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportExcel}
            disabled={loading}
          >
            Importa Excel
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPartner}
            disabled={loading}
            color="secondary"
          >
            Nuovo Partner
          </Button>
        </Box>
      </Box>
      
      {/* Filtri e Ricerca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' }, 
          gap: 2,
          alignItems: 'center',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Cerca per nome, azienda, località o tipologia..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
          
          <FormControl size="small" fullWidth>
            <InputLabel>Località</InputLabel>
            <Select
              value={filtroLocalita}
              label="Località"
              onChange={(e) => setFiltroLocalita(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {localitaList.map(localita => (
                <MenuItem key={localita} value={localita}>{localita}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" fullWidth>
            <InputLabel>Provincia</InputLabel>
            <Select
              value={filtroProvincia}
              label="Provincia"
              onChange={(e) => setFiltroProvincia(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {provinciaList.map(provincia => (
                <MenuItem key={provincia} value={provincia}>{provincia}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr auto' }, 
          gap: 2,
          alignItems: 'center'
        }}>
          <FormControl size="small" fullWidth>
            <InputLabel>{settings.regaloCorrente || 'Regalo'}</InputLabel>
            <Select
              value={filtroGrappa}
              label={settings.regaloCorrente || 'Regalo'}
              onChange={(e) => setFiltroGrappa(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="si">Con regalo</MenuItem>
              <MenuItem value="no">Senza regalo</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" fullWidth>
            <InputLabel>Consegna</InputLabel>
            <Select
              value={filtroConsegna}
              label="Consegna"
              onChange={(e) => setFiltroConsegna(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              <MenuItem value="non_assegnato">Non assegnato</MenuItem>
              {(settings.consegnatari || []).map(consegnatario => (
                <MenuItem key={consegnatario} value={consegnatario}>{consegnatario}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" fullWidth>
            <InputLabel>GLS</InputLabel>
            <Select
              value={filtroGLS}
              label="GLS"
              onChange={(e) => setFiltroGLS(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              <MenuItem value="si">Da spedire</MenuItem>
              <MenuItem value="no">Non da spedire</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={resetFilters}
          >
            Reset Filtri
          </Button>
        </Box>
      </Paper>
      
      {/* Azioni di gruppo */}
      {selected.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography>
            {selected.length} {selected.length === 1 ? 'elemento selezionato' : 'elementi selezionati'}
          </Typography>
          
          <Button
            variant="contained"
            size="small"
            onClick={handleOpenMenu}
          >
            Azioni di gruppo
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleAssegnaRegalo}>
              <ListItemIcon>
                <CardGiftcardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Assegna Regalo</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleBulkDelete}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Elimina Selezionati</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleAssegnaConsegna}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Assegna Consegnatario</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleAssegnaGLS}>
              <ListItemIcon>
                <LocalShippingIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Assegna Spedizione GLS</ListItemText>
            </MenuItem>
          </Menu>
          
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={handleSelectAllFiltered}
          >
            {selected.length === filteredPartner.length ? 'Deseleziona tutti' : 'Seleziona tutti filtrati'}
          </Button>
        </Box>
      )}
      
      {/* Tabella Partner */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        inputProps={{ 'aria-label': 'select all' }}
                      />
                    </TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Azienda</TableCell>
                    <TableCell>Tipologia</TableCell>
                    <TableCell>Indirizzo</TableCell>
                    <TableCell>CAP</TableCell>
                    <TableCell>Località</TableCell>
                    <TableCell>Prov.</TableCell>
                    <TableCell>{settings.regaloCorrente || 'Regalo'}</TableCell>
                    <TableCell>Extra</TableCell>
                    <TableCell>Consegna</TableCell>
                    <TableCell>GLS</TableCell>
                    <TableCell align="center">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {filteredPartner.length > 0 ? (
                    filteredPartner
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item) => {
                        const isItemSelected = isSelected(item.id);
                        
                        return (
                          <TableRow 
                            key={item.id}
                            hover
                            selected={isItemSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isItemSelected}
                                onChange={() => handleSelectItem(item.id)}
                                inputProps={{ 'aria-labelledby': `partner-${item.id}` }}
                              />
                            </TableCell>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>{item.azienda}</TableCell>
                            <TableCell>
                              {item.tipologia ? (
                                <Chip 
                                  color="secondary" 
                                  size="small" 
                                  label={item.tipologia} 
                                />
                              ) : ''}
                            </TableCell>
                            <TableCell>
                              {item.indirizzo} {item.civico ? item.civico : ''}
                            </TableCell>
                            <TableCell>{item.cap}</TableCell>
                            <TableCell>{item.localita}</TableCell>
                            <TableCell>{item.provincia}</TableCell>
                            <TableCell>
                              {item.grappa === '1' || item.grappa === 1 || item.grappa === true ? (
                                <Chip 
                                  label="Sì" 
                                  color="success" 
                                  size="small" 
                                />
                              ) : ''}
                            </TableCell>
                            <TableCell>
                              {item.extraAltro ? (
                                <Tooltip title={item.extraAltro}>
                                  <Chip 
                                    label="Sì" 
                                    color="info" 
                                    size="small" 
                                  />
                                </Tooltip>
                              ) : ''}
                            </TableCell>
                            <TableCell>
                              {item.consegnaSpedizione ? (
                                <Tooltip title={item.consegnaSpedizione}>
                                  <Chip 
                                    label={item.consegnaSpedizione} 
                                    color="primary" 
                                    size="small" 
                                  />
                                </Tooltip>
                              ) : ''}
                            </TableCell>
                            <TableCell>
                              {item.gls === '1' || item.gls === 1 || item.gls === true ? (
                                <Chip 
                                  label="Sì" 
                                  color="secondary" 
                                  size="small" 
                                />
                              ) : ''}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Modifica">
                                <IconButton 
                                  color="primary"
                                  onClick={() => handleEditPartner(item)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Elimina">
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDeletePartner(item)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} align="center">
                        Nessun partner trovato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredPartner.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Righe per pagina:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Dialog per aggiunta/modifica */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentPartner ? 'Modifica Partner' : 'Nuovo Partner'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome *"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                fullWidth
                required
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Azienda"
                name="azienda"
                value={formData.azienda}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Tipologia"
                name="tipologia"
                value={formData.tipologia}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                placeholder="Es: Fornitore, Consulente, Collaboratore"
              />
            </Grid>
            
            <Grid item xs={8} md={4}>
              <TextField
                label="Indirizzo"
                name="indirizzo"
                value={formData.indirizzo}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                placeholder="Via/Piazza"
              />
            </Grid>
            
            <Grid item xs={4} md={2}>
              <TextField
                label="N. Civico"
                name="civico"
                value={formData.civico}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={4} md={2}>
              <TextField
                label="CAP"
                name="cap"
                value={formData.cap}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={8} md={4}>
              <TextField
                label="Località"
                name="localita"
                value={formData.localita}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={4} md={2}>
              <TextField
                label="Provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={8} md={5}>
              <TextField
                label="Telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            
            <Grid item xs={12} md={5}>
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                type="email"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Gestione Regali e Spedizioni</Divider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.grappa === '1' || formData.grappa === 1 || formData.grappa === true}
                    onChange={handleCheckboxChange}
                    name="grappa"
                  />
                }
                label={settings.regaloCorrente || 'Regalo'}
              />
            </Grid>
            
            <Grid item xs={12} md={9}>
              <TextField
                label="Extra/Altro regalo"
                name="extraAltro"
                value={formData.extraAltro}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                placeholder="Descrizione di un eventuale regalo extra o alternativo"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Consegna/Spedizione</InputLabel>
                <Select
                  value={formData.consegnaSpedizione}
                  label="Consegna/Spedizione"
                  name="consegnaSpedizione"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Non assegnato</MenuItem>
                  {(settings.consegnatari || []).map(consegnatario => (
                    <MenuItem key={consegnatario} value={consegnatario}>{consegnatario}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.gls === '1' || formData.gls === 1 || formData.gls === true}
                    onChange={handleCheckboxChange}
                    name="gls"
                  />
                }
                label="Spedizione GLS"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePartner}
            disabled={loading}
            color="secondary"
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per assegnare regalo */}
      <Dialog open={openAssegnaRegaloDialog} onClose={() => setOpenAssegnaRegaloDialog(false)}>
        <DialogTitle>
          Assegna {settings.regaloCorrente || 'Regalo'}
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vuoi assegnare {settings.regaloCorrente || 'il regalo'} a {selected.length} {selected.length === 1 ? 'partner' : 'partner'}?
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenAssegnaRegaloDialog(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={() => handleBulkUpdate('grappa', valoreDaAssegnare)}
            disabled={loading}
            color="success"
          >
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per assegnare consegnatario */}
      <Dialog open={openAssegnaConsegnaDialog} onClose={() => setOpenAssegnaConsegnaDialog(false)}>
        <DialogTitle>
          Assegna Consegnatario
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Seleziona il consegnatario per {selected.length} {selected.length === 1 ? 'partner' : 'partner'}:
          </Typography>
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Consegnatario</InputLabel>
            <Select
              value={valoreDaAssegnare}
              label="Consegnatario"
              onChange={(e) => setValoreDaAssegnare(e.target.value)}
            >
              <MenuItem value="">Non assegnato</MenuItem>
              {(settings.consegnatari || []).map(consegnatario => (
                <MenuItem key={consegnatario} value={consegnatario}>{consegnatario}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenAssegnaConsegnaDialog(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={() => handleBulkUpdate('consegnaSpedizione', valoreDaAssegnare)}
            disabled={loading}
          >
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per assegnare GLS */}
      <Dialog open={openAssegnaGLSDialog} onClose={() => setOpenAssegnaGLSDialog(false)}>
        <DialogTitle>
          Assegna Spedizione GLS
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vuoi assegnare la spedizione GLS a {selected.length} {selected.length === 1 ? 'partner' : 'partner'}?
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenAssegnaGLSDialog(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={() => handleBulkUpdate('gls', valoreDaAssegnare)}
            disabled={loading}
            color="secondary"
          >
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PartnerPage;