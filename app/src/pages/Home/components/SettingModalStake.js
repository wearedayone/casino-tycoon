import { useState, useEffect } from 'react';
import { Box, Dialog, Typography, Button } from '@mui/material';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSnackbar } from 'notistack';

import RoundedButton from '../../../components/RoundedButton';
import useUserStore from '../../../stores/user.store';
import useSmartContract from '../../../hooks/useSmartContract';
import environments from '../../../utils/environments';

const { NETWORK_ID } = environments;

const SettingModalStake = ({ open, onBack }) => {
  const { stakeNFT, getNFTBalance } = useSmartContract();
  const { enqueueSnackbar } = useSnackbar();
  const profile = useUserStore((state) => state.profile);
  const [address, setAddress] = useState(profile?.address);
  const [quantity, setQuantity] = useState(0);
  const [status, setStatus] = useState('idle');
  const [txnHash, setTxnHash] = useState(null);
  const [availableUnits, setAvailableUnits] = useState(0);

  const txnLink =
    NETWORK_ID === '8453'
      ? `https://basescan.org/tx/${txnHash || ''}`
      : `https://goerli.basescan.org/tx/${txnHash || ''}`;

  useEffect(() => {
    if (!open) {
      setStatus('idle');
    }
  }, [open]);

  useEffect(() => {
    getNFTBalance(profile?.address)
      .then((data) => setAvailableUnits(data))
      .catch((err) => console.error(err));
  }, []);

  const stake = async () => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      if (!address?.trim()) throw new Error('Please enter your address');
      if (quantity < 0 || quantity > availableUnits) throw new Error('Maximum number of gangsters reached');
      const receipt = await stakeNFT(address, quantity);
      if (receipt.status === 1) {
        // call server to validate txn hash  && create txn in firestore
        setTxnHash(receipt.transactionHash);
        setStatus('success');
      }
    } catch (err) {
      setStatus('idle');
      enqueueSnackbar(err.message, { variant: 'error' });
      console.error(err);
    }
  };

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
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Staking NFT
            </Typography>
          </Box>
          {status === 'success' ? (
            <Box p={2} display="flex" flexDirection="column" gap={2}>
              <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
                <img src="/images/smile-face.png" alt="smile-face" maxWidth={100} />
                <Box>
                  <Typography fontSize={14} align="center">
                    Staking Success!
                  </Typography>
                  <Typography fontSize={14} align="center">
                    Staking may take a few minutes.
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.5}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => window.open(txnLink)}>
                  <Typography fontSize={12}>View transaction</Typography>
                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box p={2} display="flex" flexDirection="column" gap={2}>
              <Typography fontSize={14} align="center">
                NFTs have to be staked to be used in the game.
              </Typography>
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <img src="/images/smile-face.png" alt="smile-face" maxWidth={100} />
                <Box width="150px" display="flex" alignItems="center" gap={1}>
                  <RemoveRoundedIcon
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  />
                  <input
                    value={quantity}
                    onChange={() => {}}
                    style={{
                      border: '1px solid black',
                      borderRadius: 4,
                      outline: 'none',
                      textAlign: 'center',
                      padding: 8,
                      flex: 1,
                      fontSize: 24,
                      minWidth: 0,
                    }}
                  />
                  <AddRoundedIcon
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setQuantity(Math.min(availableUnits, quantity + 1))}
                  />
                </Box>
                <Typography fontSize={12} fontStyle="italic" align="center">
                  Available units: 0
                </Typography>
              </Box>
              {/* <Input placeholder="Enter Address" value={address} onChange={(e) => setAddress(e.target.value)} /> */}
              <Box display="flex" justifyContent="center">
                <RoundedButton
                  disabled={status === 'loading'}
                  label={status === 'loading' ? 'Staking...' : 'Stake'}
                  onClick={stake}
                  sx={{ fontSize: 10 }}
                />
              </Box>
            </Box>
          )}
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

export default SettingModalStake;
