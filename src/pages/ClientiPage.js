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
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import SearchIcon from '@mui/icons-material/Search';

const ClientiPage = () => {
  // Stato per i dati dei clienti
  const [clienti, setClienti] = useState([]);
  const [filteredClienti, setFilteredClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per la ricerca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stato per il dialog di modifica/aggiunta
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    azienda: '',
    indirizzo: '',
    cap: '',
    localita: '',
    provincia: '',
    telefono: '',
    email: '',
    note: ''
  });
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Carica i dati all'avvio
  useEffect(() => {
    loadClienti();
  }, []);
  
  // Filtra i clienti quando cambia il termine di ricerca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClienti(clienti);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = clienti.filter(item => {
        return (
          (item.nome && item.nome.toLowerCase().includes(lowercasedFilter)) ||
          (item.azienda && item.azienda.toLowerCase().includes(lowercasedFilter)) ||
          (item.localita && item.localita.toLowerCase().includes(lowercasedFilter))
        );
      });
      setFilteredClienti(filtered);
    }
    setPage(0);
  }, [searchTerm, clienti]);
  
  // Carica i clienti dal backend
  const loadClienti = async () => {
    try {
      setLoading(true);
      const result = await window.api.loadData('clienti');
      
      if (result.success) {
        // Ordina i clienti per nome
        const sortedData = result.data.sort((a, b) => 
          a.nome && b.nome ? a.nome.localeCompare(b.nome) : 0
        );
        
        setClienti(sortedData);
        setFilteredClienti(sortedData);
        console.log(`Caricati ${result.data.length} clienti`);
      } else {
        console.error('Errore nel caricamento dei clienti:', result.error);
        showSnackbar('Errore nel caricamento dei clienti', 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento dei clienti:', error);
      showSnackbar('Errore nel caricamento dei clienti', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Importa dati da Excel
  const handleImportExcel = async () => {
    try {
      setLoading(true);
      showSnackbar('Importazione in corso...', 'info');
      
      const result = await window.api.importExcel('clienti');
      
      if (result.success) {
        showSnackbar(`Importazione completata: ${result.data?.length || 0} clienti`, 'success');
        loadClienti();
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
  
  // Apri dialog per nuovo cliente
  const handleAddCliente = () => {
    setCurrentCliente(null);
    setFormData({
      nome: '',
      azienda: '',
      indirizzo: '',
      cap: '',
      localita: '',
      provincia: '',
      telefono: '',
      email: '',
      note: ''
    });
    setOpenDialog(true);
  };
  
  // Apri dialog per modifica cliente
  const handleEditCliente = (cliente) => {
    setCurrentCliente(cliente);
    setFormData({
      nome: cliente.nome || '',
      azienda: cliente.azienda || '',
      indirizzo: cliente.indirizzo || '',
      cap: cliente.cap || '',
      localita: cliente.localita || '',
      provincia: cliente.provincia || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      note: cliente.note || ''
    });
    setOpenDialog(true);
  };
  
  // Chiudi dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Salva cliente
  const handleSaveCliente = async () => {
    // Validazione basica
    if (!formData.nome) {
      showSnackbar('Il nome è obbligatorio', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      let updatedClienti;
      
      if (currentCliente) {
        // Aggiornamento cliente esistente
        const updatedCliente = {
          ...currentCliente,
          ...formData,
          lastUpdate: Date.now()
        };
        
        updatedClienti = clienti.map(c => 
          c.id === currentCliente.id ? updatedCliente : c
        );
        
        showSnackbar('Cliente aggiornato con successo', 'success');
      } else {
        // Nuovo cliente
        const newCliente = {
          ...formData,
          id: Date.now(),
          tipo: 'cliente',
          createdAt: Date.now()
        };
        
        updatedClienti = [...clienti, newCliente];
        showSnackbar('Cliente creato con successo', 'success');
      }
      
      // Aggiorna lo stato
      setClienti(updatedClienti);
      
      // Salva nel backend
      await window.api.saveData('clienti', updatedClienti);
      
      // Chiudi dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showSnackbar('Errore durante il salvataggio', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina cliente
  const handleDeleteCliente = async (cliente) => {
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${cliente.nome}"?`)) {
      try {
        setLoading(true);
        
        // Filtra il cliente da eliminare
        const updatedClienti = clienti.filter(c => c.id !== cliente.id);
        
        // Aggiorna lo stato
        setClienti(updatedClienti);
        
        // Salva nel backend
        await window.api.saveData('clienti', updatedClienti);
        
        showSnackbar('Cliente eliminato con successo', 'success');
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
        <Typography variant="h4">Gestione Clienti</Typography>
        
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
            onClick={handleAddCliente}
            disabled={loading}
          >
            Nuovo Cliente
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
            placeholder="Cerca per nome, azienda o località..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
      </Paper>
      
      {/* Tabella Clienti */}
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
                <TableCell>Indirizzo</TableCell>
                <TableCell>N. Civico</TableCell>
                <TableCell>Località</TableCell>
                <TableCell>CAP</TableCell>
                <TableCell>Provincia</TableCell>
                <TableCell>Telefono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {filteredClienti.length > 0 ? (
                filteredClienti
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>{cliente.nome}</TableCell>
                      <TableCell>{cliente.azienda}</TableCell>
                      <TableCell>{cliente.localita}</TableCell>
                      <TableCell>{cliente.provincia}</TableCell>
                      <TableCell>{cliente.telefono}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Modifica">
                          <IconButton 
                            color="primary"
                            onClick={() => handleEditCliente(cliente)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Elimina">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteCliente(cliente)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {loading ? 'Caricamento...' : 'Nessun cliente trovato'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredClienti.length}
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
          {currentCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
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
              label="Indirizzo"
              name="indirizzo"
              value={formData.indirizzo}
              onChange={handleInputChange}
              fullWidth
              margin="dense"
              placeholder="Via/Piazza"
            />

            <TextField
              label="N. Civico"
              name="civico"
              value={formData.civico}
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
            onClick={handleSaveCliente}
            disabled={loading}
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

export default ClientiPage;
