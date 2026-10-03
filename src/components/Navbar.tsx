import { AppBar, Avatar, Box, Toolbar, Typography } from '@mui/material'
import { useAuth } from '../context/authContext'

// Design system: elevation={0}, bottom border instead of a shadow — flat, not floating
export function Navbar() {
  const { email } = useAuth()

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: '#ffffff', color: 'text.primary', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
    >
      <Toolbar sx={{ height: 64, minHeight: 64, justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 20, color: 'text.primary' }}>PayFlow</Typography>
        {email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {email}
            </Typography>
            <Avatar sx={{ bgcolor: 'primary.main', color: '#ffffff', width: 32, height: 32, fontSize: 14 }}>
              {email[0].toUpperCase()}
            </Avatar>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
