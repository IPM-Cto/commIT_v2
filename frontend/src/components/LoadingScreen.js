import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: 'white',
              mb: 3 
            }} 
          />
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'white', 
              fontWeight: 700,
              mb: 1
            }}
          >
            commIT
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)' 
            }}
          >
            Caricamento in corso...
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;
