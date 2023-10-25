import { Box, Dialog, Typography, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const ReputationModal = ({ open, onBack }) => {
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
              <Typography fontSize={24}>Reputation</Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography fontSize={14}>
                You will need Reputation to win the game. The higher the Reputation, the higher the prizes allocation to
                you. Game rankings are based on Reputation.
              </Typography>
              <Typography fontSize={14}>
                To increase reputation Upgrade your Safehouse (high rep), buy Gangsters (med rep) or buy Goons (low rep)
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

export default ReputationModal;
