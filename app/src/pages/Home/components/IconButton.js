import { Box } from '@mui/material';

const IconButton = ({ Icon, onClick, sx = {}, disabled = false }) => {
  return (
    <Box
      width={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius={2}
      border="1px solid black"
      bgcolor="white"
      color={disabled ? 'grey' : 'black'}
      sx={{ aspectRatio: '1/1', ...sx }}
      onClick={disabled ? () => {} : onClick}>
      {Icon}
    </Box>
  );
};

export default IconButton;
