import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CalendarMonth,
  TrendingUp,
  Person,
  Settings,
  Logout,
  Star,
  AccessTime,
} from '@mui/icons-material';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProviderDashboard = () => {
  const { user, logout, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
  const [stats, setStats] = React.useState({
    todayBookings: 0,
    weekBookings: 0,
    monthRevenue: 0,
    rating: 0,
  });
  const [bookings, setBookings] = React.useState([]);
  const [providerData, setProviderData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      // Fetch provider details
      const meRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProviderData(meRes.data);
      
      // Fetch bookings
      const bookingsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/bookings?status=pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBookings(bookingsRes.data.bookings || []);
      
      // Calculate stats
      const today = new Date().toDateString();
      const todayBookings = bookingsRes.data.bookings.filter(
        b => new Date(b.booking_date).toDateString() === today
      ).length;
      
      setStats({
        todayBookings,
        weekBookings: bookingsRes.data.bookings.length,
        monthRevenue: 1250,
        rating: meRes.data?.rating || 4.5,
      });
      
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      const token = await getAccessTokenSilently();
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/bookings/${bookingId}/status`,
        { status: action },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success(`Prenotazione ${action === 'confirmed' ? 'confermata' : 'rifiutata'}`);
      fetchProviderData();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della prenotazione');
    }
  };

  const statsCards = [
    {
      title: 'Prenotazioni Oggi',
      value: stats.todayBookings,
      icon: <CalendarMonth />,
      color: '#2563eb',
      trend: '+12%',
    },
    {
      title: 'Prenotazioni Settimana',
      value: stats.weekBookings,
      icon: <TrendingUp />,
      color: '#10b981',
      trend: '+8%',
    },
    {
      title: 'Incasso Mensile',
      value: `€${stats.monthRevenue}`,
      icon: <TrendingUp />,
      color: '#f59e0b',
      trend: '+15%',
    },
    {
      title: 'Valutazione',
      value: stats.rating,
      icon: <Star />,
      color: '#fbbf24',
      trend: '⭐',
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 260,
          bgcolor: 'white',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            commIT Pro
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dashboard Provider
          </Typography>
        </Box>
        
        <List>
          <ListItem button selected>
            <ListItemIcon><TrendingUp /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => navigate('/bookings')}>
            <ListItemIcon><CalendarMonth /></ListItemIcon>
            <ListItemText primary="Prenotazioni" />
          </ListItem>
          <ListItem button onClick={() => navigate('/customers')}>
            <ListItemIcon><Person /></ListItemIcon>
            <ListItemText primary="Clienti" />
          </ListItem>
          <ListItem button onClick={() => navigate('/settings')}>
            <ListItemIcon><Settings /></ListItemIcon>
            <ListItemText primary="Impostazioni" />
          </ListItem>
          <Divider sx={{ my: 2 }} />
          <ListItem
            button
            onClick={() => logout({ returnTo: window.location.origin })}
          >
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Benvenuto, {providerData?.business_name}!
            </Typography>
            <Typography color="text.secondary">
              Ecco come sta andando la tua attività
            </Typography>
          </Box>
          <Avatar src={user?.picture} sx={{ width: 56, height: 56 }}>
            {user?.name?.[0]}
          </Avatar>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, my: 1 }}>
                        {stat.value}
                      </Typography>
                      <Chip
                        label={stat.trend}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                    <Avatar sx={{ bgcolor: `${stat.color}20` }}>
                      {React.cloneElement(stat.icon, { sx: { color: stat.color } })}
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pending Bookings */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Prenotazioni da Confermare
        </Typography>
        {bookings.length > 0 ? (
          <Grid container spacing={3}>
            {bookings.map((booking) => (
              <Grid item xs={12} md={6} key={booking._id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Typography variant="h6">
                        {booking.customer_name || 'Cliente'}
                      </Typography>
                      <Chip label="In attesa" color="warning" size="small" />
                    </Stack>
                    
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {booking.service_name}
                    </Typography>
                    
                    <Stack direction="row" spacing={3}>
                      <Stack direction="row" spacing={1}>
                        <CalendarMonth fontSize="small" />
                        <Typography variant="body2">
                          {new Date(booking.booking_date).toLocaleDateString('it-IT')}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <AccessTime fontSize="small" />
                        <Typography variant="body2">
                          {booking.booking_time}
                        </Typography>
                      </Stack>
                    </Stack>
                    
                    {booking.customer_note && (
                      <Paper sx={{ p: 1, mt: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="caption">
                          Note: {booking.customer_note}
                        </Typography>
                      </Paper>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleBookingAction(booking._id, 'confirmed')}
                    >
                      Conferma
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleBookingAction(booking._id, 'cancelled')}
                    >
                      Rifiuta
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nessuna prenotazione in attesa
            </Typography>
          </Paper>
        )}

        {/* Business Info */}
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Informazioni Attività
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nome Attività
                    </Typography>
                    <Typography>{providerData?.business_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Categoria
                    </Typography>
                    <Typography>{providerData?.service_category}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Indirizzo
                    </Typography>
                    <Typography>
                      {providerData?.address?.street}, {providerData?.address?.city}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Orari di Apertura
                </Typography>
                <Stack spacing={1}>
                  {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'].map((day) => (
                    <Stack key={day} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{day}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        09:00 - 19:00
                      </Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Sabato</Typography>
                    <Typography variant="body2" color="text.secondary">
                      09:00 - 13:00
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Domenica</Typography>
                    <Typography variant="body2" color="error">
                      Chiuso
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ProviderDashboard;
