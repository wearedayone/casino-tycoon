import { Box } from '@mui/material';

import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <Box bgcolor="#1a0c31" height="100vh" overflow="auto" sx={{ scrollBehavior: 'smooth' }}>
      <Box
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        sx={{
          backgroundImage: 'url(/images/background.png)',
          backgroundSize: '100% auto',
          backgroundRepeat: 'no-repeat',
        }}>
        <Header />
        <Box pt="80px" flex={1} display="flex" flexDirection="column">
          {children}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
