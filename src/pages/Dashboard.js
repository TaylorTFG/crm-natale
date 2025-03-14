import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';

const Dashboard = () => {
  const [clientiCount, setClientiCount] = useState(0);
  const [partnerCount, setPartnerCount] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carica i dati al montaggio del componente
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carica clienti
        const clientiResult = await window.api.loadData('clienti');
        if (clientiResult.success) {
          setClientiCount(clientiResult.data.length);
          
          // Prendi gli ultimi 5 clienti
          const recentClienti = clientiResult.data
            .sort((a, b) => b.id - a.id)
            .slice(0, 5)
            .map(cliente => ({
              ...cliente,
              tipo: 'cliente'
            }));
            
          // Carica partner
          const partnerResult = await window.api.loadData('partner');
          if (partnerResult.success) {
            setPartnerCount(partnerResult.data.length);
            
            // Prendi gli ultimi 5 partner
            const recentPartner = partnerResult.data
              .sort((a, b) => b.id - a.id)
              .slice(0, 5)
              .map(partner => ({
                ...partner,
                tipo: 'partner'
              }));
              
            // Combina e ordina per ID (più recenti prima)
            const combined = [...recentClienti, ...recentPartner]
              .sort((a, b) => b.id - a.id)
              .slice(0, 5);
              
            setRecentItems(combined);
          }
        }
      } catch (error) {
        console.error('Errore durante il caricamento dei dati:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Card Conteggio Clienti */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 200,
                backgroundColor: '#e3f2fd'
              }}
            >
              <Box display="flex" alignItems="center">
                <PeopleIcon fontSize="large" sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="h5" component="div">
                  Clienti
                </Typography>
              </Box>
              
              <Typography variant="h3" component="div" sx={{ my: 2, textAlign: 'center' }}>
                {clientiCount}
              </Typography>
              
              <Button 
                variant="contained" 
                href="/clienti"
                sx={{ mt: 'auto' }}
              >
                Gestisci Clienti
              </Button>
            </Paper>
          </Grid>
          
          {/* Card Conteggio Partner */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 200,
                backgroundColor: '#fce4ec'
              }}
            >
              <Box display="flex" alignItems="center">
                <BusinessIcon fontSize="large" sx={{ mr: 1, color: '#d81b60' }} />
                <Typography variant="h5" component="div">
                  Partner
                </Typography>
              </Box>
              
              <Typography variant="h3" component="div" sx={{ my: 2, textAlign: 'center' }}>
                {partnerCount}
              </Typography>
              
              <Button 
                variant="contained" 
                href="/partner"
                color="secondary"
                sx={{ mt: 'auto' }}
              >
                Gestisci Partner
              </Button>
            </Paper>
          </Grid>
          
          {/* Lista Elementi Recenti */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Elementi Recenti
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {recentItems.length > 0 ? (
                <List>
                  {recentItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem button component="a" href={`/${item.tipo === 'partner' ? 'partner' : 'clienti'}`}>
                        <ListItemText 
                          primary={item.nome} 
                          secondary={`${item.azienda || ''} - ${item.tipo === 'partner' ? 'Partner' : 'Cliente'}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Nessun elemento recente da visualizzare
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
