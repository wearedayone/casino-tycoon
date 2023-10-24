import { Box, Dialog, Typography, Button } from '@mui/material';

const BuyBonusModal = ({ open, onBack }) => {
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
            <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
              <img src="/images/icons/info.png" alt="info" width={50} />
              <Typography fontSize={24}>Buy Bonus</Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography fontSize={14}>
                $FIAT that are burn via upgrading Safehouses or purchasing of Goons are added into the buy bonus
              </Typography>
              <Typography fontSize={14}>
                When a player buys a Gangster, they will receive 1% of $FIAT from the buy bonus as a buy-in reward.
              </Typography>
              <Typography fontSize={14}>
                Players can choose whether to buy early or late based on the size of the reserve pool.
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

export default BuyBonusModal;
