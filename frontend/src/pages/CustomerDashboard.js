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
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Search,
  Notifications,
  Person,
  CalendarMonth,
  Favorite,
  History,
  Settings,
  Logout,
  Chat as ChatIcon,
  Restaurant,
  ContentCut,
  LocalHospital,
  ShoppingBag,
  Star,
  AccessTime,
  LocationOn,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Chat from '../components/Chat';

const CustomerDashboard = () => {
  const { user, logout, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [bookings, setBookings] = React.useState([]);
  const [recommendations, setRecommendations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      // Fetch bookings
      const bookingsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/bookings`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBookings(bookingsRes.data.bookings || []);
      
      // Fetch recommendations
      const recommendationsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/providers?limit=6`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRecommendations(recommendationsRes.data.providers || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const menuItems = [
    { icon: <CalendarMonth />, text: 'Le mie prenotazioni', path: '/bookings' },
    { icon: <Favorite />, text: 'Preferiti', path: '/favorites' },
    { icon: <History />, text: 'Cronologia', path: '/history' },
    { icon: <Person />, text: 'Profilo', path: '/profile' },
    { icon: <Settings />, text: 'Impostazioni', path: '/settings' },
  ];

  const quickCategories = [
    { icon: <Restaurant />, label: 'Ristoranti', color: '#ef4444' },
    { icon: <ContentCut />, label: 'Parrucchieri', color: '#f59e0b' },
    { icon: <LocalHospital />, label: 'Medici', color: '#10b981' },
    { icon: <ShoppingBag />, label: 'Shopping', color: '#8b5cf6' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              commIT
            </Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider />
            <ListItem
              button
              onClick={() => logout({ returnTo: window.location.origin })}
            >
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {/* Header */}
        <AppBar position="sticky" color="inherit" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Ciao {user?.name?.split(' ')[0] || 'Cliente'}! 👋
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              
              <IconButton onClick={() => navigate('/profile')}>
                <Avatar src={user?.picture} alt={user?.name}>
                  {user?.name?.[0]}
                </Avatar>
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Search Bar */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
              Cosa stai cercando oggi?
            </Typography>
            <TextField
              fullWidth
              placeholder="Cerca ristoranti, parrucchieri, servizi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                sx: { bgcolor: 'white', borderRadius: 2 },
              }}
            />
          </Paper>

          {/* Quick Categories */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {quickCategories.map((cat, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                  onClick={() => navigate(`/search?category=${cat.label.toLowerCase()}`)}
                >
                  <CardContent>
                    <Avatar
                      sx={{
                        bgcolor: cat.color,
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      {cat.icon}
                    </Avatar>
                    <Typography variant="body1">{cat.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Upcoming Bookings */}
          {bookings.length > 0 && (
            <>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Prossime Prenotazioni
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {bookings.slice(0, 3).map((booking) => (
                  <Grid item xs={12} md={4} key={booking._id}>
                    <Card>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                          <Chip
                            label={booking.status}
                            size="small"
                            color={
                              booking.status === 'confirmed' ? 'success' :
                              booking.status === 'pending' ? 'warning' : 'default'
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(booking.booking_date).toLocaleDateString('it-IT')}
                          </Typography>
                        </Stack>
                        
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {booking.service_name}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2">
                            {booking.booking_time}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" spacing={1}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {booking.provider_name}
                          </Typography>
                        </Stack>
                      </CardContent>
                      <CardActions>
                        <Button size="small">Dettagli</Button>
                        <Button size="small" color="error">Cancella</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* Recommendations */}
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Consigliati per te
          </Typography>
          <Grid container spacing={3}>
            {recommendations.map((provider) => (
              <Grid item xs={12} sm={6} md={4} key={provider._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {provider.business_name?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {provider.business_name}
                        </Typography>
                        <Chip
                          label={provider.service_category}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {provider.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Star sx={{ color: '#fbbf24', fontSize: 20 }} />
                      <Typography variant="body2">
                        {provider.rating || 0} ({provider.total_reviews || 0} recensioni)
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button size="small" variant="contained">
                      Prenota ora
                    </Button>
                    <Button size="small">
                      Info
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Chat FAB */}
      <IconButton
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: 'primary.main',
          color: 'white',
          width: 64,
          height: 64,
          '&:hover': { bgcolor: 'primary.dark' },
        }}
        onClick={() => setChatOpen(true)}
      >
        <ChatIcon />
      </IconButton>

      {/* Chat Dialog */}
      {chatOpen && (
        <Chat open={chatOpen} onClose={() => setChatOpen(false)} />
      )}
    </Box>
  );
};

export default CustomerDashboard;
