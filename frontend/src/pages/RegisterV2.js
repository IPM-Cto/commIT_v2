// 📝 Register Page - Versione Ristrutturata
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Business,
  Store,
  PersonAdd,
} from '@mui/icons-material';

const RegisterV2 = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    
    // Provider fields
    business_name: '',
    service_category: '',
    description: '',
    vat_number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const steps = ['Tipo Account', 'Informazioni Base', 'Dettagli', 'Conferma'];

  // ==================== HANDLERS ====================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength
    if (name === 'password') {
      const strength = AuthService.getPasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    setSubmitError('');
  };

  const handleUserTypeChange = (event, newType) => {
    if (newType !== null) {
      setUserType(newType);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Email
      if (!formData.email) {
        newErrors.email = 'Email richiesta';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email non valida';
      }

      // Password
      if (!formData.password) {
        newErrors.password = 'Password richiesta';
      } else {
        const validation = AuthService.validatePassword(formData.password);
        if (!validation.isValid) {
          newErrors.password = validation.errors[0];
        }
      }

      // Confirm Password
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Conferma password richiesta';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Le password non corrispondono';
      }
    }

    if (step === 2) {
      // Full Name
      if (!formData.full_name) {
        newErrors.full_name = 'Nome completo richiesto';
      }

      // Phone
      if (formData.phone && !/^[\+]?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Numero di telefono non valido';
      }

      // Provider-specific
      if (userType === 'provider') {
        if (!formData.business_name) {
          newErrors.business_name = 'Nome attività richiesto';
        }
        if (!formData.service_category) {
          newErrors.service_category = 'Categoria richiesta';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      return;
    }

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        user_type: userType,
        phone: formData.phone || null,
      };

      // Add provider-specific fields
      if (userType === 'provider') {
        registrationData.business_name = formData.business_name;
        registrationData.service_category = formData.service_category;
        registrationData.description = formData.description;
        registrationData.vat_number = formData.vat_number;
      }

      const result = await register(registrationData);

      if (result.success) {
        // Registration successful
        if (userType === 'customer') {
          navigate('/dashboard/customer');
        } else if (userType === 'provider') {
          navigate('/dashboard/provider');
        }
      } else {
        setSubmitError(result.error || 'Errore durante la registrazione');
        setActiveStep(1); // Torna al primo step
      }
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitError('Errore durante la registrazione. Riprova.');
      setActiveStep(1);
    }
  };

  // ==================== RENDER STEPS ====================

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Step 1: User Type Selection
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Che tipo di account vuoi creare?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Scegli il tipo di account più adatto alle tue esigenze
            </Typography>

            <ToggleButtonGroup
              value={userType}
              exclusive
              onChange={handleUserTypeChange}
              sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}
            >
              <ToggleButton
                value="customer"
                sx={{
                  flex: 1,
                  py: 3,
                  flexDirection: 'column',
                  gap: 1,
                  border: '2px solid',
                  borderColor: userType === 'customer' ? '#667eea' : '#e0e0e0',
                  bgcolor: userType === 'customer' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                }}
              >
                <Person sx={{ fontSize: 40 }} />
                <Typography variant="h6">Cliente</Typography>
                <Typography variant="body2" color="text.secondary">
                  Prenota servizi e gestisci le tue prenotazioni
                </Typography>
              </ToggleButton>

              <ToggleButton
                value="provider"
                sx={{
                  flex: 1,
                  py: 3,
                  flexDirection: 'column',
                  gap: 1,
                  border: '2px solid',
                  borderColor: userType === 'provider' ? '#667eea' : '#e0e0e0',
                  bgcolor: userType === 'provider' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                }}
              >
                <Store sx={{ fontSize: 40 }} />
                <Typography variant="h6">Provider</Typography>
                <Typography variant="body2" color="text.secondary">
                  Offri i tuoi servizi e gestisci la tua attività
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        );

      case 1:
        // Step 2: Email & Password
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Crea il tuo account
            </Typography>

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Forza password:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor:
                        passwordStrength < 40
                          ? '#f44336'
                          : passwordStrength < 70
                          ? '#ff9800'
                          : '#4caf50',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {passwordStrength < 40
                    ? 'Debole'
                    : passwordStrength < 70
                    ? 'Media'
                    : 'Forte'}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Conferma Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );

      case 2:
        // Step 3: Personal/Business Info
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {userType === 'customer' ? 'Informazioni Personali' : 'Informazioni Attività'}
            </Typography>

            <TextField
              fullWidth
              label="Nome Completo"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              error={!!errors.full_name}
              helperText={errors.full_name}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Telefono"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading}
              placeholder="+39 333 123 4567"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {userType === 'provider' && (
              <>
                <TextField
                  fullWidth
                  label="Nome Attività"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  error={!!errors.business_name}
                  helperText={errors.business_name}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  select
                  label="Categoria Servizio"
                  name="service_category"
                  value={formData.service_category}
                  onChange={handleChange}
                  error={!!errors.service_category}
                  helperText={errors.service_category}
                  disabled={loading}
                  SelectProps={{ native: true }}
                  sx={{ mb: 2 }}
                >
                  <option value="">Seleziona categoria</option>
                  <option value="restaurant">Ristorante</option>
                  <option value="beauty">Bellezza</option>
                  <option value="health">Salute</option>
                  <option value="professional">Professionale</option>
                  <option value="home_services">Servizi Casa</option>
                  <option value="shop">Negozio</option>
                  <option value="other">Altro</option>
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descrizione"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Descrivi brevemente la tua attività..."
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Partita IVA (opzionale)"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="IT12345678901"
                />
              </>
            )}
          </Box>
        );

      case 3:
        // Step 4: Confirmation
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Conferma i tuoi dati
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Tipo Account
              </Typography>
              <Chip
                label={userType === 'customer' ? 'Cliente' : 'Provider'}
                color="primary"
                sx={{ mt: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{formData.email}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Nome Completo
              </Typography>
              <Typography variant="body1">{formData.full_name}</Typography>
            </Box>

            {formData.phone && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Telefono
                </Typography>
                <Typography variant="body1">{formData.phone}</Typography>
              </Box>
            )}

            {userType === 'provider' && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nome Attività
                  </Typography>
                  <Typography variant="body1">{formData.business_name}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Categoria
                  </Typography>
                  <Typography variant="body1">{formData.service_category}</Typography>
                </Box>
              </>
            )}

            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // ==================== MAIN RENDER ====================

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700, color: '#667eea' }}
            >
              commIT
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Crea il tuo account
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={loading}>
                Indietro
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Avanti
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {loading ? 'Registrazione...' : 'Conferma'}
              </Button>
            )}
          </Box>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Hai già un account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Accedi
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterV2;
