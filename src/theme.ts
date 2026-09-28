// src/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1a73e8' },
    background: { default: '#f5f7fa' }, // soft gray, not stark white
  },
  shape: {
    borderRadius: 10, // rounder corners throughout — cards, buttons, inputs
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 }, // MUI defaults to ALL CAPS buttons — genuinely dated-looking
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }, // softer than MUI's harsh default shadow
      },
    },
  },
});