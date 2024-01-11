import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { getByCode } from '../../services/user.service';
import { formatter } from '../../utils/numbers';
import useEthereum from '../../hooks/useEthereum';
import ProviderSelector from './components/ProviderSelector';

const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-6)}`;

const numberValueRegex = /[\d]+(\.\d+)?/;

const DepositUser = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account, balance, isAuthenticating, connectWallet, deposit, isDepositing, setIsDepositing } = useEthereum();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mouseDown, setMouseDown] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [open, setOpen] = useState(false);

  const code = searchParams.get('code');

  useEffect(() => {
    getUser();
  }, [code]);

  const getUser = async (noLoading) => {
    !noLoading && setLoading(true);
    try {
      const res = await getByCode(code);
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
    !noLoading && setLoading(false);
  };

  const depositEth = async () => {
    if (isDepositing) return;
    setIsDepositing(true);
    try {
      if (!numberValueRegex.test(`${amount}`)) throw new Error('Invalid amount');
      const receipt = await deposit({ address: user.address, amount });
      if (receipt.status === 1) {
        navigate(`/deposit/success?txnHash=${receipt.transactionHash}`);
      } else {
        throw new Error('Something wrong');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
    setIsDepositing(false);
  };

  return (
    <Box
      minHeight="100vh"
      bgcolor="#FBF3E6"
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={3}
      sx={{
        '& .eth-img': {
          width: 300,
          maxWidth: '70vw',
        },
      }}
      onMouseUp={() => setMouseDown(false)}>
      <img className="eth-img" src="/images/eth_deposit.png" alt="deposit" />
      <Box width="70vw">
        <Typography
          fontSize={{ sx: '24px', md: '32px', lg: '48px', xl: '60px' }}
          fontWeight={700}
          fontFamily="WixMadeforDisplayBold"
          align="center">
          Deposit ETH in your GangsterArena Wallet, you’ll need ETH to buy Gangsters
        </Typography>
      </Box>
      <Box
        py={5}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        sx={{
          '& img': {
            width: '600px',
            maxWidth: '85vw',
          },
        }}>
        {loading || !user ? (
          <Typography fontSize={24} fontFamily="WixMadeforDisplayBold" color="#29000B">
            Loading...
          </Typography>
        ) : (
          <>
            <Box position="relative">
              <img src="/images/container-deposit.png" alt="container" />
              <Box
                p={1}
                px={2}
                pb={1.5}
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                display="flex"
                gap={1}>
                <Box
                  borderRadius="50%"
                  overflow="hidden"
                  sx={{
                    '& img': {
                      display: 'block',
                      height: '100%',
                      width: 'auto',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    },
                  }}>
                  <img src={user.avatarURL} alt="avatar" />
                </Box>
                <Box display="flex" flexDirection="column" justifyContent="center">
                  <Typography
                    fontSize={{ xs: 16, sm: 24, md: 32 }}
                    fontWeight={700}
                    fontFamily="WixMadeforDisplayBold"
                    color="#29000B">
                    @{user.username}
                  </Typography>
                  <Typography
                    fontSize={{ xs: 16, sm: 24, md: 32 }}
                    fontWeight={700}
                    fontFamily="WixMadeforDisplayBold"
                    color="#7C2828">
                    {formatAddress(user.address)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box position="relative">
              <img src="/images/container-deposit.png" alt="container" />
              <Box
                p={1}
                px={2}
                pb={1.5}
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                display="flex"
                gap={1}>
                <Box
                  borderRadius="50%"
                  overflow="hidden"
                  sx={{
                    '& img': {
                      display: 'block',
                      height: '100%',
                      width: 'auto',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    },
                  }}>
                  <img src="/images/eth-coin.png" alt="coint" />
                </Box>
                <Box display="flex" flexDirection="column" justifyContent="center">
                  <Typography
                    fontSize={{ xs: 16, sm: 24, md: 32 }}
                    fontWeight={700}
                    fontFamily="WixMadeforDisplayBold"
                    color="#29000B">
                    From Ethereum Mainnet
                  </Typography>
                  <Typography
                    fontSize={{ xs: 16, sm: 24, md: 32 }}
                    fontWeight={700}
                    fontFamily="WixMadeforDisplayBold"
                    color="#7C2828">
                    {account ? formatAddress(account) : 'Connect wallet'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
      <Box pb={5} width="600px" maxWidth="85vw">
        <Box display="flex" flexDirection="column" gap={1}>
          <Box
            bgcolor="white"
            borderRadius={2}
            border="1px solid #DDB790"
            p={1}
            display="flex"
            alignItems="center"
            gap={2}>
            <Box
              flex={1}
              sx={{
                '& input': {
                  bgcolor: 'transparent',
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'WixMadeforDisplayBold',
                  fontWeight: 700,
                  fontSize: 24,
                },
              }}>
              <input
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isAuthenticating || isDepositing}
              />
            </Box>
            <Button
              variant="contained"
              sx={{
                aspectRatio: '259/124',
                borderRadius: 2,
                border: '1px solid #0004A0',
                boxShadow: 'none',
                bgcolor: '#104DFD',
                textTransform: 'none',
                '&:focus': {
                  boxShadow: 'none',
                  bgcolor: '#104DFD',
                },
              }}
              onClick={() => !isDepositing && setAmount(Number(formatter.format(balance)))}>
              Max
            </Button>
          </Box>
          <Box display="flex" justifyContent="flex-end">
            <Typography color="#7C2828" fontFamily="WixMadeforDisplayBold" fontSize={14}>
              Your wallet balance: {formatter.format(balance)} ETH
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        alignSelf="center"
        position="relative"
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => setMouseDown(false)}>
        <Box width="200px" sx={{ '& img': { width: '100%' } }}>
          <img
            draggable={false}
            src={mouseDown ? '/images/button-blue-med-pressed.png' : '/images/button-blue-med.png'}
            alt="button"
          />
        </Box>
        <Box width="100%" position="absolute" top="45%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
          <Typography
            fontSize="20px"
            fontWeight={700}
            color="white"
            fontFamily="WixMadeforDisplayBold"
            align="center"
            sx={{ userSelect: 'none' }}
            onClick={() => (account ? depositEth() : setOpen(true))}>
            {account ? (isDepositing ? 'Processing...' : 'Deposit') : 'Connect wallet'}
          </Typography>
        </Box>
      </Box>
      <Box
        mt={-2}
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          '& img': {
            width: 24,
            cursor: 'pointer',
          },
        }}>
        <Typography color="#7C2828" fontSize={14} fontFamily="WixMadeforDisplayBold" align="center">
          GangsterArena Wallet Balance: {formatter.format(user?.ETHBalance)} ETH
        </Typography>
        <img src="/images/button-refresh.png" alt="reload" onClick={() => getUser(true)} />
      </Box>
      <ProviderSelector open={open} setOpen={setOpen} connectWallet={connectWallet} />
    </Box>
  );
};

export default DepositUser;
