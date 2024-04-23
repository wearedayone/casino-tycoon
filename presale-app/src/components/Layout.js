import { Box } from '@mui/material';

import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex={1}>{children}</Box>
      <Footer />
    </Box>
  );
};

export default Layout;
