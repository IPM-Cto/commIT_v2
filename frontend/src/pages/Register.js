import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Person,
  Business,
  Check,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithRedirect, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  
  const [activeStep, setActiveStep] = React.useState(0);
  const [userType, setUserType] = React.useState(searchParams.get('type') || 'customer');
  const [formData, setFormData] = React.useState({
    // Common data
    full_name: '',
    phone: '',
    
    // Customer data
    preferences: [],
    
    // Provider data
    business_name: '',
    service_category: '',
    description: '',
    vat_number: '',
    address: {
      street: '',
      city: '',
      postal_code: '',
      province: '',
    },
    services_offered: [],
  });
  
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const steps = ['Tipo Account', 'Dati Personali', 'Dettagli', 'Conferma'];

  const serviceCategories = [
    { value: 'restaurant', label: 'Ristorante/Bar' },
    { value: 'beauty', label: 'Bellezza/Benessere' },
    { value: 'health', label: 'Salute/Medicina' },
    { value: 'professional', label: 'Servizi Professionali' },
    { value: 'home_services', label: 'Servizi Casa' },
    { value: 'shop', label: 'Negozio' },
    { value: 'other', label: 'Altro' },
  ];

  React.useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.name || '',
      }));
    }
  }, [isAuthenticated, user]);

  const handleNext = () => {
    if (activeStep === 0 && !isAuthenticated) {
      loginWithRedirect({
        screen_hint: 'signup',
        appState: { returnTo: '/register', step: 1, userType }
      });
      return;
    }
    
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  /**
   * 🔥 SOLUZIONE 2B: HYBRID APPROACH
   * - Redirect immediato per UX veloce
   * - Verifica in background per sicurezza
   * - Auto-correzione se dati cambiano
   */
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await getAccessTokenSilently();
      
      const payload = {
        user_type: userType,
        full_name: formData.full_name,
        phone: formData.phone,
        ...(userType === 'provider' && {
          business_name: formData.business_name,
          service_category: formData.service_category,
          description: formData.description,
          vat_number: formData.vat_number,
          address: formData.address,
          services_offered: formData.services_offered,
        }),
        ...(userType === 'customer' && {
          preferences: formData.preferences,
        }),
      };

      console.log('📤 Step 1: Invio registrazione:', payload);

      // STEP 1: Registrazione
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success || response.data.user) {
        const userData = response.data.user;
        
        console.log('✅ Step 1 completato - Dati ricevuti:', userData);
        
        // STEP 2: Salva IMMEDIATAMENTE nel localStorage
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_type', userData.user_type);
        console.log('💾 Step 2: Dati salvati in localStorage');
        
        toast.success('Registrazione completata con successo!');
        
        // STEP 3: Redirect IMMEDIATO (per velocità UX)
        const targetRoute = userData.user_type === 'provider' 
          ? '/dashboard/provider' 
          : '/dashboard/customer';
        
        console.log('🎯 Step 3: Redirect immediato a', targetRoute);
        navigate(targetRoute, { replace: true });
        
        // STEP 4: Verifica in BACKGROUND (dopo redirect)
        // Questo non blocca l'UI ma assicura sincronizzazione
        setTimeout(async () => {
          try {
            console.log('📤 Step 4: Verifica in background...');
            
            const verifyResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            const verifiedData = verifyResponse.data;
            console.log('✅ Step 4: Dati verificati dal backend:', verifiedData);
            
            // Confronta dati
            const dataChanged = JSON.stringify(userData) !== JSON.stringify(verifiedData);
            
            if (dataChanged) {
              console.warn('⚠️ Dati utente aggiornati dal backend');
              
              // Aggiorna localStorage con dati verificati
              localStorage.setItem('user_data', JSON.stringify(verifiedData));
              localStorage.setItem('user_type', verifiedData.user_type);
              
              // Se user_type è cambiato, reindirizza
              if (userData.user_type !== verifiedData.user_type) {
                console.log('🔄 User type cambiato:', userData.user_type, '→', verifiedData.user_type);
                const newRoute = verifiedData.user_type === 'provider'
                  ? '/dashboard/provider'
                  : '/dashboard/customer';
                window.location.href = newRoute;
              } else {
                // Ricarica la pagina per aggiornare i dati
                console.log('🔄 Dati aggiornati, ricarico la pagina...');
                window.location.reload();
              }
            } else {
              console.log('✅ Dati sincronizzati correttamente');
            }
            
          } catch (err) {
            console.error('⚠️ Background verification fallita (non critico):', err);
            // Non mostrare errore all'utente, è silenzioso
            // L'app continua a funzionare con i dati iniziali
          }
        }, 2000); // Verifica dopo 2 secondi
        
      } else {
        throw new Error('Risposta non valida dal server');
      }
    } catch (err) {
      console.error('❌ Errore registrazione:', err);
      
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || 'Errore durante la registrazione';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Scegli il tipo di account
            </Typography>
            <RadioGroup
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <Paper sx={{ 
                p: 3, 
                mb: 2, 
                cursor: 'pointer', 
                border: userType === 'customer' ? '2px solid' : '1px solid', 
                borderColor: userType === 'customer' ? 'primary.main' : 'grey.300',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 3,
                }
              }}
              onClick={() => setUserType('customer')}
              >
                <FormControlLabel
                  value="customer"
                  control={<Radio />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Person />
                        <Typography variant="h6">Cliente</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Cerca e prenota servizi nella tua zona
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                cursor: 'pointer', 
                border: userType === 'provider' ? '2px solid' : '1px solid', 
                borderColor: userType === 'provider' ? 'primary.main' : 'grey.300',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 3,
                }
              }}
              onClick={() => setUserType('provider')}
              >
                <FormControlLabel
                  value="provider"
                  control={<Radio />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Business />
                        <Typography variant="h6">Provider</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Offri i tuoi servizi e gestisci prenotazioni
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Dati personali
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nome completo"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                helperText="Il nome che verrà mostrato nel tuo profilo"
              />
              <TextField
                fullWidth
                label="Telefono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 333 1234567"
                required
                helperText="Necessario per confermare le prenotazioni"
              />
            </Stack>
          </Box>
        );

      case 2:
        if (userType === 'customer') {
          return (
            <Box>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Preferenze
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Seleziona i servizi che ti interessano (opzionale)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['Ristoranti', 'Parrucchieri', 'Medici', 'Shopping', 'Casa', 'Sport'].map((pref) => (
                  <Chip
                    key={pref}
                    label={pref}
                    onClick={() => {
                      const prefs = formData.preferences;
                      if (prefs.includes(pref)) {
                        setFormData({
                          ...formData,
                          preferences: prefs.filter(p => p !== pref)
                        });
                      } else {
                        setFormData({
                          ...formData,
                          preferences: [...prefs, pref]
                        });
                      }
                    }}
                    color={formData.preferences.includes(pref) ? 'primary' : 'default'}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          );
        } else {
          return (
            <Box>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Dettagli attività
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Nome attività"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  required
                  helperText="Il nome pubblico della tua attività"
                />
                
                <FormControl fullWidth required>
                  <InputLabel>Categoria servizio</InputLabel>
                  <Select
                    value={formData.service_category}
                    onChange={(e) => setFormData({ ...formData, service_category: e.target.value })}
                    label="Categoria servizio"
                  >
                    {serviceCategories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descrizione attività"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  helperText="Descrivi i tuoi servizi in modo accattivante"
                />
                
                <TextField
                  fullWidth
                  label="Partita IVA (opzionale)"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  helperText="Inserisci la tua Partita IVA se ne hai una"
                />
                
                <Typography variant="h6">Indirizzo attività</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Via/Piazza"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Città"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="CAP"
                      value={formData.address.postal_code}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, postal_code: e.target.value }
                      })}
                      required
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Provincia"
                      value={formData.address.province}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, province: e.target.value }
                      })}
                      inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
                      required
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Box>
          );
        }

      case 3:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Riepilogo
            </Typography>
            
            <Stack spacing={2}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo account
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {userType === 'customer' ? '👤 Cliente' : '🏢 Provider'}
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nome
                </Typography>
                <Typography variant="body1">
                  {formData.full_name}
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Telefono
                </Typography>
                <Typography variant="body1">
                  {formData.phone}
                </Typography>
              </Paper>
              
              {userType === 'provider' && (
                <>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Attività
                    </Typography>
                    <Typography variant="body1">
                      {formData.business_name}
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Categoria
                    </Typography>
                    <Typography variant="body1">
                      {serviceCategories.find(c => c.value === formData.service_category)?.label || formData.service_category}
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Indirizzo
                    </Typography>
                    <Typography variant="body1">
                      {formData.address.street}, {formData.address.city} {formData.address.postal_code} ({formData.address.province})
                    </Typography>
                  </Paper>
                </>
              )}
              
              {userType === 'customer' && formData.preferences.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Preferenze
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {formData.preferences.map(pref => (
                      <Chip key={pref} label={pref} size="small" color="primary" />
                    ))}
                  </Stack>
                </Paper>
              )}
            </Stack>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              Cliccando su "Completa registrazione" accetti i nostri Termini di Servizio e la Privacy Policy
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/')} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Typography component="span" sx={{ color: 'white', ml: 1 }}>
            Torna alla home
          </Typography>
        </Box>
        
        <Paper elevation={24} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" align="center" sx={{ mb: 1, fontWeight: 600 }}>
            Registrati su commIT
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Completa la registrazione in pochi passaggi
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {renderStepContent()}

          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              size="large"
            >
              Indietro
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              size="large"
              endIcon={activeStep === steps.length - 1 ? <Check /> : <ArrowForward />}
            >
              {loading ? 'Caricamento...' : (activeStep === steps.length - 1 ? 'Completa registrazione' : 'Avanti')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
