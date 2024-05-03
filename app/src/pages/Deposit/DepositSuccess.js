import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import environments from '../../utils/environments';

const { LAYER_1_NETWORK_ID } = environments;

const DepositSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mouseDown, setMouseDown] = useState(false);

  const txnHash = searchParams.get('txnHash');

  const openTxnHash = () => window.open(`https://${ETHERSCAN_PREFIX[LAYER_1_NETWORK_ID]}etherscan.io/tx/${txnHash}`);

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
          width: 440,
          maxWidth: '100vw',
        },
      }}>
      <img
        className="eth-img"
        src="https://res.cloudinary.com/gangsterarena/image/upload/v1714389918/images/eth_deposit_success.png"
        alt="deposit"
      />
      <Box py={5} width="70vw" display="flex" flexDirection="column" gap={1}>
        <Typography
          fontSize={{ sx: '32px', md: '48px', lg: '60px', xl: '72px' }}
          fontWeight={800}
          fontFamily="WixMadeforDisplayExtraBold"
          align="center">
          Deposit ETH Success{' '}
        </Typography>
        <Typography
          fontSize={{ sx: '24px', md: '32px', lg: '48px', xl: '60px' }}
          fontWeight={700}
          fontFamily="WixMadeforDisplayBold"
          align="center">
          Deposit may take a while to process.
        </Typography>
      </Box>
      <Box
        alignSelf="center"
        pb={5}
        display="flex"
        justifyContent="center"
        gap={1}
        sx={{ cursor: 'pointer' }}
        onClick={openTxnHash}>
        <Typography
          color="#2C010B"
          fontSize={14}
          fontFamily="WixMadeforDisplayBold"
          align="center"
          sx={{ textDecoration: 'underline' }}>
          View transaction
        </Typography>
        <img src="/images/open-link.png" alt="link" width={16} />
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
        <Box position="absolute" top="45%" left="50%" sx={{ transform: 'translate(-50%, -50%)' }}>
          <Typography
            fontSize="24px"
            fontWeight={700}
            color="white"
            fontFamily="WixMadeforDisplayBold"
            sx={{ userSelect: 'none' }}
            onClick={() => navigate('/')}>
            Okay
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const ETHERSCAN_PREFIX = {
  1: '',
  5: 'goerli.',
  11155111: 'sepolia.',
};

export default DepositSuccess;
