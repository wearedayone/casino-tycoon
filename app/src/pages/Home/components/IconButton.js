import { Box } from '@mui/material';

const IconButton = ({ Icon, onClick, sx = {} }) => {
  return (
    <Box
      width={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius={2}
      border="1px solid black"
      bgcolor="white"
      sx={{ aspectRatio: '1/1', ...sx }}
      onClick={onClick}>
      {Icon}
    </Box>
  );
};

export default IconButton;
