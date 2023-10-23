import { Button } from '@mui/material';

const RoundedButton = ({ label, onClick, sx }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{ color: 'black', textTransform: 'none', borderColor: 'black', borderRadius: 8, ...sx }}>
      {label}
    </Button>
  );
};

export default RoundedButton;
