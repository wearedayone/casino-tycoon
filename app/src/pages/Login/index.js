import { Box, Typography, Button } from '@mui/material';
import { grey } from '@mui/material/colors';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';

const Login = () => {
  const login = () => {
    window.setUserId?.('0x65355c36a566bdd9912118f35de2c94cef2dbcf4');
  };

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
        CASINO TYCOON
      </Typography>
      <Typography fontSize={18} fontWeight={600} align="center">
        Become the richest on the strip!
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box
          display="flex"
          alignItems="center"
          border={`1px solid ${grey[300]}`}
          borderRadius={2}
          overflow="hidden"
          pl={1}
          color={grey[500]}
          sx={{
            '& input': {
              flex: 1,
              px: 2,
              border: 'none',
              outline: 'none',
            },
          }}
        >
          <MailOutlineRoundedIcon />

          <input placeholder="your@email.com" />
          <Button
            variant="contained"
            color="inherit"
            sx={{
              borderRadius: 0,
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            }}
          >
            Submit
          </Button>
        </Box>
        <Typography fontSize={14} color={grey[500]}>
          Get started quickly with email
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Box flex={1} height="1px" bgcolor={grey[300]} />
          <Typography fontSize={14} color={grey[500]}>
            or
          </Typography>
          <Box flex={1} height="1px" bgcolor={grey[300]} />
        </Box>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          sx={{
            borderColor: grey[300],
            '& img': {
              height: 30,
            },
          }}
          onClick={login}
        >
          <img src="/images/icons/twitter.png" alt="twitter" />
        </Button>
      </Box>
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
