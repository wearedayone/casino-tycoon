import { Box, Grid } from '@mui/material';

import Layout from '../../components/Layout';
import MainImage from './components/MainImage';
import MainContent from './components/MainContent';

const Home = () => {
  return (
    <Layout>
      <Box py={4} px={{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }}>
        <Grid container spacing={{ xs: 4, lg: 8 }}>
          <Grid item xs={12} lg={6}>
            <MainImage />
          </Grid>
          <Grid item xs={12} lg={6}>
            <MainContent />
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Home;
