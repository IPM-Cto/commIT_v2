import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Divider,
  Stack,
  Alert,
  IconButton,
} from '@mui/material';
import { Google, ArrowBack } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const [error, setError] = React.useState('');

  const handleAuth0Login = async () => {
    try {
      await loginWithRedirect({
        appState: { returnTo: '/dashboard' }
      });
    } catch (err) {
      setError('Errore durante il login. Riprova.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
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
            Bentornato!
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Accedi per continuare su commIT
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={<Google />}
              onClick={handleAuth0Login}
              sx={{
                bgcolor: '#4285f4',
                '&:hover': { bgcolor: '#357ae8' },
              }}
            >
              Accedi con Google
            </Button>

            <Divider>oppure</Divider>

            <TextField
              fullWidth
              label="Email"
              type="email"
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
            />

            <Button
              fullWidth
              size="large"
              variant="contained"
              onClick={handleAuth0Login}
            >
              Accedi con Email
            </Button>

            <Typography variant="body2" align="center">
              Non hai un account?{' '}
              <Box
                component="span"
                onClick={() => navigate('/register')}
                sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 500 }}
              >
                Registrati
              </Box>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
