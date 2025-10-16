import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: '"Happy Monkey", system-ui',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          padding: 4,
          backgroundColor: '#ffffff',
          border: '2px solid #000000',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            marginBottom: 3,
            textAlign: 'center',
            fontFamily: '"Happy Monkey", system-ui',
            color: '#000000',
          }}
        >
          Register for Vistora
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              marginBottom: 2,
              fontFamily: '"Happy Monkey", system-ui',
              border: '1px solid #000000',
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{
              marginBottom: 2,
              '& .MuiOutlinedInput-root': {
                fontFamily: '"Happy Monkey", system-ui',
                '& fieldset': {
                  borderColor: '#000000',
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: '"Happy Monkey", system-ui',
              },
            }}
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{
              marginBottom: 2,
              '& .MuiOutlinedInput-root': {
                fontFamily: '"Happy Monkey", system-ui',
                '& fieldset': {
                  borderColor: '#000000',
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: '"Happy Monkey", system-ui',
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Min 8 characters, 1 uppercase, 1 lowercase, 1 number"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#000000' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              marginBottom: 3,
              '& .MuiOutlinedInput-root': {
                fontFamily: '"Happy Monkey", system-ui',
                '& fieldset': {
                  borderColor: '#000000',
                },
              },
              '& .MuiInputLabel-root': {
                fontFamily: '"Happy Monkey", system-ui',
              },
              '& .MuiFormHelperText-root': {
                fontFamily: '"Happy Monkey", system-ui',
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#ff6600',
              color: '#ffffff',
              fontFamily: '"Happy Monkey", system-ui',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #000000',
              '&:hover': {
                backgroundColor: '#ff6600',
              },
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <Typography
          sx={{
            marginTop: 2,
            textAlign: 'center',
            fontFamily: '"Happy Monkey", system-ui',
            color: '#000000',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#ff6600',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};
