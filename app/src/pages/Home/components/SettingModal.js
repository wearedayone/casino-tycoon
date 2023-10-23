import { useState } from 'react';
import { Box, Dialog, Typography, Button, Divider } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';

import { CopyIcon } from '../../../components/Icons';
import SettingModalDepositETH from './SettingModalDepositETH';
import SettingModalWithdrawETH from './SettingModalWithdrawETH';
import SettingModalSwap from './SettingModalSwap';
import SettingModalDepositNFT from './SettingModalDepositNFT';
import SettingModalWithdrawNFT from './SettingModalWithdrawNFT';
import RoundedButton from './RoundedButton';
import useUserWallet from '../../../hooks/useUserWallet';
import useUserStore from '../../../stores/user.store';

const SettingModal = ({ open, setOpenUpdate }) => {
  const [mode, setMode] = useState('menu');
  const { logout } = usePrivy();
  const embeddedWallet = useUserWallet();
  const profile = useUserStore((state) => state.profile);

  const onCopyAddress = () => {
    navigator.clipboard.writeText(embeddedWallet?.address);
  };

  const btns1 = [
    {
      text: 'Deposit ETH',
      onClick: () => setMode('deposit-eth'),
    },
    {
      text: 'Withdraw ETH',
      onClick: () => setMode('withdraw-eth'),
    },
    {
      text: 'Swap',
      onClick: () => setMode('swap'),
    },
  ];

  const btns2 = [
    {
      text: 'Deposit NFT',
      onClick: () => setMode('deposit-nft'),
    },
    {
      text: 'Withdraw NFT',
      onClick: () => setMode('withdraw-nft'),
    },
  ];

  const exportWallet = () => {};

  if (!profile) return null;

  if (mode === 'deposit-eth') return <SettingModalDepositETH open onBack={() => setMode('menu')} />;
  if (mode === 'withdraw-eth') return <SettingModalWithdrawETH open onBack={() => setMode('menu')} />;
  if (mode === 'swap') return <SettingModalSwap open onBack={() => setMode('menu')} />;
  if (mode === 'deposit-nft') return <SettingModalDepositNFT open onBack={() => setMode('menu')} />;
  if (mode === 'withdraw-nft') return <SettingModalWithdrawNFT open onBack={() => setMode('menu')} />;

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
              Settings
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={1}
              sx={{
                '& img': {
                  display: 'block',
                  width: 50,
                  aspectRatio: '1/1',
                  borderRadius: '50%',
                },
              }}>
              <img src={profile.avatarURL} alt="avatar" />
              <Typography fontSize={14} fontWeight={600} align="center">
                {profile.username}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box display="flex" flexDirection="column" justifyContent="center" justifyItems="center">
                  <Typography fontSize={14} fontWeight={600}>
                    My Wallet:
                  </Typography>
                </Box>
                <Button variant="text" color="info" onClick={() => onCopyAddress(false)} sx={{ py: 0 }}>
                  <Typography fontSize={14} color="grey">
                    {embeddedWallet?.address && embeddedWallet?.address.length > 6
                      ? embeddedWallet?.address.substring(0, 6) +
                        '...' +
                        embeddedWallet?.address.substring(embeddedWallet?.address.length - 6)
                      : ''}
                  </Typography>
                  <CopyIcon sx={{ fontSize: 14, ml: 1 }} />
                </Button>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <RoundedButton label="Export Wallet" onClick={exportWallet} />
              <RoundedButton label="Logout" onClick={logout} />
            </Box>
            <Divider />
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" justifyContent="space-between" gap={1}>
                {btns1.map((item) => (
                  <RoundedButton
                    key={item.text}
                    label={item.text}
                    onClick={item.onClick}
                    sx={{ fontSize: 10, textTransform: 'none' }}
                  />
                ))}
              </Box>
              <Box display="flex" justifyContent="space-between" gap={1}>
                {btns2.map((item) => (
                  <RoundedButton
                    key={item.text}
                    label={item.text}
                    onClick={item.onClick}
                    sx={{ fontSize: 10, textTransform: 'none', flex: 1 }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              onClick={() => setOpenUpdate(null)}
              sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SettingModal;
