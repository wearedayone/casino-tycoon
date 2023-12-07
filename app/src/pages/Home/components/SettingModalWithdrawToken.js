import { useState } from 'react';
import { Box, Dialog, Typography, Button, TextField, InputAdornment } from '@mui/material';
import { isAddress } from '@ethersproject/address';
import { useSnackbar } from 'notistack';
import LaunchIcon from '@mui/icons-material/Launch';

import RoundedButton from '../../../components/RoundedButton';
import useSmartContract from '../../../hooks/useSmartContract';
import { create, validate } from '../../../services/transaction.service';
import useUserStore from '../../../stores/user.store';
import environments from '../../../utils/environments';

const { NETWORK_ID } = environments;

const SettingModalWithdrawToken = ({ open, onBack }) => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txnHash, setTxnHash] = useState(null);
  const profile = useUserStore((state) => state.profile);
  const { withdrawToken } = useSmartContract();
  const { enqueueSnackbar } = useSnackbar();

  const { tokenBalance } = profile;

  const transfer = async () => {
    try {
      setIsLoading(true);
      const value = Number(amount);
      // const res = await create({ type: 'withdraw', token: 'FIAT', value, to: address });
      // const { id } = res.data;
      const receipt = await withdrawToken(address, value);
      // for test only
      // const receipt = { status: 1, transactionHash: 'test-txn-hash' };
      if (receipt.status === 1) {
        setTxnHash(receipt.transactionHash);
        // await validate({ transactionId: id, txnHash: receipt.transactionHash });
      }
      enqueueSnackbar('Transferred $FIAT successfully', { variant: 'success' });
    } catch (err) {
      err.message && enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      disablePortal
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              {txnHash ? 'Success' : 'Withdraw $FIAT'}{' '}
            </Typography>
          </Box>
          {txnHash ? (
            <Box height="312px" py={4} px={2} display="flex" flexDirection="column" alignItems="center" gap={3}>
              <img src="/images/icons/coin.png" alt="token" width={60} />
              <Typography textAlign="center">
                $FIAT Withdrawal Success! <br />
                Withdrawal may take a few minutes.
              </Typography>
              <Button
                component="a"
                href={`https://${BASESCAN_PREFIX[NETWORK_ID]}basescan.org/tx/${txnHash}`}
                target="_blank"
                rel="noreferrer noopener"
                endIcon={<LaunchIcon />}
                sx={{ textTransform: 'none' }}>
                View transaction
              </Button>
            </Box>
          ) : (
            <Box height="312px" p={2} display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography fontSize={14} align="center">
                Enter the amount to withdraw.
              </Typography>
              <img src="/images/icons/coin.png" alt="token" width={60} />
              <Box display="flex" flexDirection="column" gap={1}>
                <TextField
                  size="small"
                  sx={{ width: 200 }}
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button onClick={() => setAmount(tokenBalance)} size="small">
                          Max
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography fontSize={12} color="grey">
                  Your balance: {Number(tokenBalance).toLocaleString()} $FIAT
                </Typography>
              </Box>
              <TextField
                name="address"
                size="small"
                sx={{ width: 250 }}
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Base address only"
                onFocus={(e) => e.target.select()}
                InputLabelProps={{ shrink: true }}
              />
              <Box display="flex" justifyContent="center">
                <RoundedButton
                  label="Confirm"
                  onClick={transfer}
                  sx={{ fontSize: 10 }}
                  disabled={!isAddress(address) || !Number(amount) || Number(amount) > tokenBalance || isLoading}
                />
              </Box>
            </Box>
          )}
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              onClick={onBack}
              sx={{ color: 'black', textTransform: 'none' }}
              disabled={isLoading}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export const BASESCAN_PREFIX = {
  8453: '',
  84531: 'goerli.',
};

export default SettingModalWithdrawToken;
