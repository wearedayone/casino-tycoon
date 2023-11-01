import { Button } from '@mui/material';

const RoundedButton = ({ label, sx, ...props }) => {
  return (
    <Button
      variant="outlined"
      {...props}
      sx={{ color: 'black', textTransform: 'none', borderColor: 'black', borderRadius: 2, ...sx }}>
      {label}
    </Button>
  );
};

export default RoundedButton;
