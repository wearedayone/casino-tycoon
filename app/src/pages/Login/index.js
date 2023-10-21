import { Box, Typography, Button } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';

const Login = () => {
  const { login } = usePrivy();

  return (
    <Box
      minHeight="100vh"
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="flex-end"
      gap={4}
    >
      <Typography fontSize={64} fontWeight={600} align="center" lineHeight={1}>
        GANGSTER ARENA
      </Typography>
      <Typography fontSize={18} fontWeight={600} align="center">
        Work your way to be the top Godfather!
      </Typography>
      <Button fullWidth variant="contained" onClick={login}>
        Login
      </Button>
      <Typography
        fontSize={14}
        fontWeight={600}
        align="center"
        sx={{ cursor: 'pointer' }}
      >
        {'Check out our privacy policy -->'}
      </Typography>
    </Box>
  );
};

export default Login;
