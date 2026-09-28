import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function LoginForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <Card sx={{ maxWidth: 340, mx: 'auto', mt: 10, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" align="center" gutterBottom sx={{ mb: 3 }}>
          Log in to PayFlow
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.2 }}>
            Log In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}