import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Stack,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Restaurant,
  ContentCut,
  LocalHospital,
  ShoppingBag,
  Home,
  Build,
  SmartToy,
  Speed,
  Security,
  Star,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const services = [
    { icon: <Restaurant />, title: 'Ristoranti', description: 'Prenota il tuo tavolo' },
    { icon: <ContentCut />, title: 'Parrucchieri', description: 'Il tuo stile perfetto' },
    { icon: <LocalHospital />, title: 'Medici', description: 'Salute a portata di click' },
    { icon: <ShoppingBag />, title: 'Negozi', description: 'Shopping personalizzato' },
    { icon: <Home />, title: 'Casa', description: 'Servizi domestici' },
    { icon: <Build />, title: 'Professionisti', description: 'Esperti qualificati' },
  ];

  const features = [
    {
      icon: <SmartToy sx={{ fontSize: 40 }} />,
      title: 'AI Intelligente',
      description: 'Assistente AI che capisce le tue esigenze e suggerisce i servizi migliori',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Prenotazione Veloce',
      description: 'Prenota qualsiasi servizio in pochi click, senza chiamate',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Sicuro e Affidabile',
      description: 'Provider verificati e pagamenti sicuri per la tua tranquillità',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar position="fixed" color="transparent" elevation={0} sx={{ 
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.9)',
      }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
            commIT
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => navigate('/login')}>
              Accedi
            </Button>
            <Button variant="contained" onClick={() => navigate('/register')}>
              Registrati
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 15,
          pb: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
                Prenota servizi locali con un <Box component="span" sx={{ color: '#fbbf24' }}>click</Box>
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                L'assistente AI che trova e prenota i servizi migliori per te
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  onClick={() => loginWithRedirect({ screen_hint: 'signup' })}
                >
                  Inizia Gratis
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  sx={{ borderColor: 'white', color: 'white' }}
                  onClick={() => navigate('/register?type=provider')}
                >
                  Sono un Provider
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ mb: 6, fontWeight: 600 }}>
          Tutti i servizi che ami
        </Typography>
        
        <Grid container spacing={3}>
          {services.map((service, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Card sx={{ textAlign: 'center', cursor: 'pointer' }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.light', mx: 'auto', mb: 2 }}>
                    {service.icon}
                  </Avatar>
                  <Typography variant="h6">{service.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ mb: 6, fontWeight: 600 }}>
            Perché scegliere commIT?
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
            Inizia oggi, è gratis!
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Unisciti a migliaia di utenti soddisfatti
          </Typography>
          <Button
            size="large"
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main', px: 4 }}
            onClick={() => loginWithRedirect({ screen_hint: 'signup' })}
            endIcon={<ArrowForward />}
          >
            Registrati Ora
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
