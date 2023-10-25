import { Box, Dialog, Typography, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const PointEarnedModal = ({ open, onBack }) => {
  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <InfoIcon />
              <Typography fontSize={24}>Points Earned</Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography fontSize={14}>
                Points Earned this sessions shows you the points that you earn for the current session.
              </Typography>
              <Typography fontSize={14}>
                Points can be earn via ETH spend from buying of machines and $CHIPS spend from buying buildings or
                workers.
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" onClick={onBack} sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PointEarnedModal;
