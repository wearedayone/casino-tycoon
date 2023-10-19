import { Box } from '@mui/material';

const IconButton = ({ Icon, onClick }) => {
  return (
    <Box
      width={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius={2}
      border="1px solid black"
      sx={{ aspectRatio: '1/1' }}
      onClick={onClick}
    >
      {Icon}
    </Box>
  );
};

export default IconButton;
