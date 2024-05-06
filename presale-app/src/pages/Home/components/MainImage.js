import { Box } from '@mui/material';

const MainImage = () => {
  return (
    <Box sx={{ '& img': { width: '100%' } }}>
      <img src="/images/main.png" alt="main" />
    </Box>
  );
};

export default MainImage;