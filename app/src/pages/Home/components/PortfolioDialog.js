import { Box, Dialog, Typography, Button, Grid } from '@mui/material';
import { CopyIcon } from '../../../components/Icons';

const PortfolioDialog = ({ open, setOpenUpdate, user }) => {
  console.log('PortfolioDialog', { user });
  const onCopyAddress = () => {
    navigator.clipboard.writeText(user?.wallet?.address);
  };
  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open ?? false}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 1 },
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" style={{ backgroundColor: 'white' }} borderRadius={1}>
          <Box style={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Portfolio
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" p={2} gap={2}>
            <Box display="flex" gap={1}>
              <Box display={'flex'} flexDirection={'column'} justifyContent={'center'} justifyItems={'center'}>
                <Typography fontSize={14} align="left">
                  My Wallet:{' '}
                </Typography>
              </Box>
              <Button variant="text" color="info" onClick={() => onCopyAddress(false)}>
                <Typography fontSize={14} style={{ color: 'grey' }}>
                  {user?.wallet?.address && user?.wallet?.address.length > 6
                    ? user?.wallet?.address.substring(0, 6) +
                      '...' +
                      user?.wallet?.address.substring(user?.wallet?.address.length - 6)
                    : ''}
                </Typography>
                <CopyIcon sx={{ fontSize: 14, ml: 1 }} />
              </Button>
            </Box>
            <Box px={1} py={2} style={{ border: '1px solid #555', borderRadius: '8px' }}>
              <Typography fontSize={14} align="center">
                Total portfolio value
              </Typography>
              <Typography fontSize={20} fontWeight={700} align="center">
                2.145 ETH
              </Typography>
              <Grid container>
                <Grid xs={2} item>
                  <img src="/images/icons/ethereum.png" alt="Balance" width={'50%'} />
                </Grid>
                <Grid xs={7} item>
                  Balance
                </Grid>
                <Grid xs={3} item>
                  <Typography fontSize={14} align="right">
                    0.510 ETH
                  </Typography>
                </Grid>
                <Grid xs={2} item>
                  <img src="/images/icons/coin.png" alt="Balance" width={'50%'} />
                </Grid>
                <Grid xs={7} item>
                  <Typography fontSize={14} align="left">
                    100K CHIPS
                  </Typography>
                </Grid>
                <Grid xs={3} item>
                  <Typography fontSize={14} align="right">
                    0.134 ETH
                  </Typography>
                </Grid>
                <Grid xs={2} item>
                  <img src="/images/icons/slot-machine.png" alt="Balance" width={'50%'} />
                </Grid>
                <Grid xs={7} item>
                  <Typography fontSize={14} align="left">
                    15 Machine NFTs
                  </Typography>
                </Grid>
                <Grid xs={3} item>
                  <Typography fontSize={14} align="right">
                    0.240 ETH
                  </Typography>
                </Grid>
                <Grid xs={2} item>
                  <img src="/images/icons/crown_1.png" alt="Balance" width={'50%'} />
                </Grid>
                <Grid xs={7} item>
                  <Typography fontSize={14} align="left">
                    Networth Rank Rewards
                  </Typography>
                </Grid>
                <Grid xs={3} item>
                  <Typography fontSize={14} align="right">
                    0.150 ETH
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} style={{ backgroundColor: 'white' }} borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" color="info" onClick={() => setOpenUpdate(false)}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PortfolioDialog;
