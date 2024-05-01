import { Box, Typography, useMediaQuery, alpha } from '@mui/material';

import UnchartedLogo from './UnchartedLogo';

const FooterDesktop = () => {
  return (
    <Box
      py={4}
      px={2}
      bgcolor="#1A0C31"
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      sx={{ borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
      <UnchartedLogo width="120px" />
      <Box display="flex" alignItems="center" gap={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography color="#5f556f">Terms of Use</Typography>
          <Typography fontWeight={500} color="#5f556f">
            Privacy Policy
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography
            color="#fff"
            sx={{ cursor: 'pointer' }}
            onClick={() => window.open('mailto:contact@uncharted.gg')}>
            contact@uncharted.gg
          </Typography>
          <img src="/images/discord-gradient.png" alt="discord" />
          <img src="/images/x-gradient.png" alt="x" />
        </Box>
      </Box>
      <Box
        position="absolute"
        top={0}
        left="50%"
        height="100%"
        sx={{ transform: 'translateX(-50%)' }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={3}>
        <Typography color="#8c8499" align="center">
          © Copyright 2024 Uncharted
        </Typography>
      </Box>
    </Box>
  );
};

const FooterMobile = () => {
  return (
    <Box
      p={4}
      bgcolor="#1A0C31"
      position="relative"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2.5}
      sx={{ borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
      <UnchartedLogo width="148px" />
      <Box>
        <Typography color="#fff" sx={{ cursor: 'pointer' }} onClick={() => window.open('mailto:contact@uncharted.gg')}>
          contact@uncharted.gg
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={1.5}>
        <img src="/images/discord-gradient.png" alt="discord" />
        <img src="/images/x-gradient.png" alt="x" />
      </Box>
      <Box>
        <Typography color="#8c8499" align="center">
          © Copyright 2024 Uncharted
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={2}>
        <Typography color="#5f556f">Terms of Use</Typography>
        <Typography fontWeight={500} color="#5f556f">
          Privacy Policy
        </Typography>
      </Box>
    </Box>
  );
};

const Footer = () => {
  const isSmall = useMediaQuery('(max-width: 1300px)');

  if (isSmall) return <FooterMobile />;

  return <FooterDesktop />;
};

export default Footer;
