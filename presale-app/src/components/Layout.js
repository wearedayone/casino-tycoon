import { Box } from '@mui/material';

import Header from './Header2';
import Footer from './Footer';
import CollapsedMenuXs from './CollapsedMenuXs';

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
        <Box flex={1} display="flex" flexDirection="column">
          {children}
        </Box>
        <Footer />
      </Box>
      <CollapsedMenuXs />
    </Box>
  );
};

export default Layout;