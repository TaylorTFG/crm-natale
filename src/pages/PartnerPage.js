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
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';

const PartnerPage = () => {
  // Stato per i dati dei partner
  const [partner, setPartner] = useState([]);
  const [filteredPartner, setFilteredPartner] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per la ricerca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stato per il dialog di modifica/aggiunta
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    azienda: '',
    indirizzo: '',
    cap: '',
    localita: '',
    provincia: '',
    telefono: '',
    email: '',
    note: '',
    tipologia: ''
  });
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Carica i dati all'avvio
  useEffect(() => {
    loadPartner();
  }, []);
  
  // Filtra i partner quando cambia il termine di ricerca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPartner(partner);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = partner.filter(item => {
        return (
          (item.nome && item.nome.toLowerCase().includes(lowercasedFilter)) ||
          (item.azienda && item.azienda.toLowerCase().includes(lowercasedFilter)) ||
          (item.localita && item.localita.toLowerCase().includes(lowercasedFilter)) ||
          (item.tipologia && item.tipologia.toLowerCase().includes(lowercasedFilter))
        );
      });
      setFilteredPartner(filtered);
    }
    setPage(0);
  }, [searchTerm, partner]);
  
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
  
  // Importa dati da Excel
  const handleImportExcel = async () => {
    try {
      setLoading(true);
      showSnackbar('Importazione in corso...', 'info');
      
      const result = await window.api.importExcel('partner');
      
      if (result.success) {
        showSnackbar(`Importazione completata: ${result.data?.length || 0} partner`, 'success');
        loadPartner();
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
  
  // Apri dialog per nuovo partner
  const handleAddPartner = () => {
    setCurrentPartner(null);
    setFormData({
      nome: '',
      azienda: '',
      indirizzo: '',
      cap: '',
      localita: '',
      provincia: '',
      telefono: '',
      email: '',
      note: '',
      tipologia: ''
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
      cap: partner.cap || '',
      localita: partner.localita || '',
      provincia: partner.provincia || '',
      telefono: partner.telefono || '',
      email: partner.email || '',
      note: partner.note || '',
      tipologia: partner.tipologia || ''
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
        
        // Filtra il partner da eliminare
        const updatedPartner = filteredPartner.filter(p => p.id !== partner.id);
        
        // Aggiorna lo stato
        setPartner(updatedPartner);
        
        // Salva nel backend
        await window.api.saveData('partner', updatedPartner);
        
        showSnackbar('Partner eliminato con successo', 'success');
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        showSnackbar('Errore durante l\'eliminazione', 'error');
      } finally {
        setLoading(false);
      }
    }
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
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportExcel}
            sx={{ mr: 1 }}
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
      
      {/* Barra di ricerca */}
      <Paper sx={{ p: 2, mb: 3 }}>
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
      </Paper>
      
      {/* Tabella Partner */}
      <Paper>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Azienda</TableCell>
                <TableCell>Tipologia</TableCell>
                <TableCell>Località</TableCell>
                <TableCell>Provincia</TableCell>
                <TableCell>Telefono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {filteredPartner.length > 0 ? (
                filteredPartner
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>{partner.nome}</TableCell>
                      <TableCell>{partner.azienda}</TableCell>
                      <TableCell>
                        {partner.tipologia ? (
                          <Chip 
                            icon={<BusinessIcon />} 
                            label={partner.tipologia} 
                            size="small" 
                            color="secondary"
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell>{partner.localita}</TableCell>
                      <TableCell>{partner.provincia}</TableCell>
                      <TableCell>{partner.telefono}</TableCell>
                      <TableCell>{partner.email}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Modifica">
                          <IconButton 
                            color="primary"
                            onClick={() => handleEditPartner(partner)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Elimina">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeletePartner(partner)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {loading ? 'Caricamento...' : 'Nessun partner trovato'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredPartner.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
        />
      </Paper>
      
      {/* Dialog per aggiunta/modifica */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentPartner ? 'Modifica Partner' : 'Nuovo Partner'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, my: 2 }}>
            <TextField
              label="Nome *"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              fullWidth
              required
              margin="dense"
            />
            
            <TextField
              label="Azienda"
              name="azienda"
              value={formData.azienda}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
            
            <TextField
              label="Tipologia"
              name="tipologia"
              value={formData.tipologia}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              placeholder="Es: Fornitore, Consulente, Collaboratore"
            />
            
            <TextField
              label="Indirizzo"
              name="indirizzo"
              value={formData.indirizzo}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
            
            <TextField
              label="CAP"
              name="cap"
              value={formData.cap}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
            
            <TextField
              label="Località"
              name="localita"
              value={formData.localita}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
            
            <TextField
              label="Provincia"
              name="provincia"
              value={formData.provincia}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
            
            <TextField
              label="Telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
            />
            
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              type="email"
            />
            
            <TextField
              label="Note"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              multiline
              rows={3}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />
          </Box>
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
