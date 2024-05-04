import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useMediaQuery } from '@mui/material';
import QueryBuilderOutlinedIcon from '@mui/icons-material/QueryBuilderOutlined';
import ArrowDropUpOutlinedIcon from '@mui/icons-material/ArrowDropUpOutlined';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import { useSnackbar } from 'notistack';

import { getSignatureMint } from '../../../services/wallet.service';
import useAppContext from '../../../contexts/useAppContext';

const formatTimeNumber = (number) => (number > 9 ? `${number}` : `0${number}`);
const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 4 });

const handleError = (err) => {
  if (err.message === 'The user rejected the request') {
    return { code: '4001', message: 'The user rejected\nthe request' };
  } else {
    const message = err.message;
    const code = err.code?.toString();
    console.log({ message, code });

    if (message === 'Network Error') {
      return { code: '12002', message: 'Network Error' };
    }

    if (message.includes('replacement fee too low')) return { code: '4001', message: 'Replacement fee\ntoo low' };

    if (message.includes('Transaction reverted without a reason string'))
      return { code: '4001', message: 'Transaction reverted' };

    if (message.includes('Request failed with status code 422')) return { code: '4001', message: 'Request failed' };

    if (message.includes('invalid address or ENS name')) return { code: '4001', message: 'Invalid address\nor ENS' };

    if (message.includes('User exited before wallet could be connected'))
      return { code: '4001', message: 'User exited' };

    if (message.includes('transaction failed')) return { code: '4001', message: 'Transaction failed' };

    if (message.includes('missing response')) return { code: '4001', message: 'Missing response' };

    if (message.includes('Cannot redefine property: ethereum'))
      return { code: '4001', message: 'Cannot redefine\nethereum' };

    if (message.includes('insufficient funds for intrinsic transaction cost'))
      return { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient ETH' };

    if (code === 'UNPREDICTABLE_GAS_LIMIT' || code === '-32603') {
      if (err?.error?.data?.message && err.error?.data?.message.includes('execution reverted:')) {
        const error = err.error?.data?.message.replace('execution reverted: ', '');
        return { code: 'UNPREDICTABLE_GAS_LIMIT', message: error || 'INSUFFICIENT GAS' };
      }

      return { code: 'UNPREDICTABLE_GAS_LIMIT', message: 'INSUFFICIENT GAS' };
    }

    if (code === 'INSUFFICIENT_FUNDS') return { code: 'INSUFFICIENT_FUNDS', message: 'INSUFFICIENT ETH' };

    if (code === 'INVALID_ARGUMENT') return { code: 'INVALID_ARGUMENT', message: 'INVALID ARGUMENT' };

    if (code === 'NETWORK_ERROR') return { code: 'NETWORK_ERROR', message: 'Network Error' };

    return { code: '4001', message: 'Something is wrong' };
  }
};

const desktopStatuses = {
  active: {
    up: '/images/container-active-up-desktop.png',
    down: '/images/container-active-down-desktop.png',
    color: '#67D7F9',
    btnText: 'buy now',
    btnColor: '#68ABC4',
    btnHoverColor: '#5B96AC',
  },
  cs: {
    up: '/images/container-cs-up-desktop.png',
    down: '/images/container-cs-down-desktop.png',
    color: '#AE85FF',
    btnText: 'coming soon',
    btnColor: '#AE85FF',
  },
  login: {
    up: '/images/container-login-up-desktop.png',
    down: '/images/container-login-down-desktop.png',
    color: '#904AFF',
    btnText: 'sign in',
    btnColor: '#904AFF',
    btnHoverColor: '#7B1EE3',
  },
  invalid: {
    up: '/images/container-invalid-up-desktop.png',
    down: '/images/container-invalid-down-desktop.png',
    color: '#8667A9',
    btnText: 'not eligible',
    btnColor: '#55169C',
  },
};

const mobileStatuses = {
  active: {
    up: '/images/container-active-up-mobile.png',
    middle: '/images/container-active-middle-mobile.png',
    down: '/images/container-active-down-mobile.png',
    color: '#67D7F9',
    btnText: 'buy now',
    btnColor: '#68ABC4',
    btnHoverColor: '#5B96AC',
  },
  cs: {
    up: '/images/container-cs-up-mobile.png',
    middle: '/images/container-cs-middle-mobile.png',
    down: '/images/container-cs-down-mobile.png',
    color: '#AE85FF',
    btnText: 'coming soon',
    btnColor: '#AE85FF',
  },
  login: {
    up: '/images/container-login-up-mobile.png',
    middle: '/images/container-login-middle-mobile.png',
    down: '/images/container-login-down-mobile.png',
    color: '#904AFF',
    btnText: 'sign in',
    btnColor: '#904AFF',
    btnHoverColor: '#7B1EE3',
  },
  invalid: {
    up: '/images/container-invalid-up-mobile.png',
    middle: '/images/container-invalid-middle-mobile.png',
    down: '/images/container-invalid-down-mobile.png',
    color: '#8667A9',
    btnText: 'not eligible',
    btnColor: '#55169C',
  },
};

const usePhaseLogic = ({ phase, updatePhaseStatus, statuses, minted }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState(null);
  const interval = useRef();
  const [minting, setMinting] = useState(false);
  const {
    smartContractState: { mint },
  } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();

  const {
    name: text,
    status,
    totalSupply: amount,
    sold,
    priceInEth: price,
    startTime: startTimeUnix,
    endTime: endTimeUnix,
    maxPerWallet: maxQuantity,
  } = phase;

  const maxUserQuantity = Math.max(maxQuantity - minted, 0);

  const increaseQuantity = () => setQuantity(Math.min(quantity + 1, maxUserQuantity));
  const decreaseQuantity = () => setQuantity(Math.max(quantity - 1, 1));

  const countdown = () => {
    const now = Date.now();
    const diff = status === 'cs' ? startTimeUnix - now : endTimeUnix - now;
    if (diff <= 0) {
      setTimeLeft({
        h: `00`,
        m: `00`,
        s: `00`,
      });
      updatePhaseStatus();
    } else {
      const diffInSeconds = diff / 1000;
      const h = Math.floor(diffInSeconds / 3600);
      const m = Math.floor((diffInSeconds % 3600) / 60);
      const s = Math.floor(diffInSeconds % 60);
      setTimeLeft({
        h: formatTimeNumber(h),
        m: formatTimeNumber(m),
        s: formatTimeNumber(s),
      });
    }
  };

  const btnOnClick = async () => {
    if (!['active', 'login'].includes(status)) return;
    if (status === 'login') {
      navigate('/login');
      return;
    }
    if (minting) return;
    setMinting(true);
    try {
      const res = await getSignatureMint({ phaseId: phase.id, amount: quantity });
      const { signature, value } = res.data;
      console.log({ phaseId: phase.id, amount: quantity, signature, value });
      const receipt = await mint({ phaseId: phase.id, amount: quantity, signature, value });
      if (receipt.status !== 1) throw new Error('Something wrong');
      enqueueSnackbar('Mint successfully', { variant: 'success' });
    } catch (err) {
      console.error(err);
      const { message } = handleError(err);
      enqueueSnackbar(message, { variant: 'error' });
    }
    setMinting(false);
  };

  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    if (status !== 'end') {
      interval.current = setInterval(countdown, 1000);
    } else {
      if (interval.current) {
        clearInterval(interval.current);
      }
    }
  }, [status, endTimeUnix, startTimeUnix]);

  const { up, middle, down, color, btnColor, btnText, btnHoverColor } = statuses[status] || {};

  return {
    text,
    status,
    amount,
    sold,
    price,
    maxQuantity,
    quantity,
    timeLeft,
    increaseQuantity,
    decreaseQuantity,
    up,
    middle,
    down,
    color,
    btnColor,
    btnText,
    btnHoverColor,
    btnOnClick,
    minting,
  };
};

const PhaseDesktop = ({ phase, ethPrice, updatePhaseStatus, minted }) => {
  const {
    text,
    status,
    amount,
    sold,
    price,
    maxQuantity,
    quantity,
    timeLeft,
    increaseQuantity,
    decreaseQuantity,
    up,
    down,
    color,
    btnColor,
    btnText,
    btnHoverColor,
    btnOnClick,
    minting,
  } = usePhaseLogic({
    phase,
    updatePhaseStatus,
    statuses: desktopStatuses,
    minted,
  });

  if (status === 'end')
    return (
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography fontSize={{ xs: 20, md: 24 }} fontWeight={500} color="white">
          {text}
        </Typography>
        <Box position="relative" sx={{ '& img': { width: '100%' } }}>
          <img src="/images/container-end-down-desktop.png" alt="end" />
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            p={2}
            pt={1.5}
            display="flex"
            alignItems="center"
            justifyContent="space-between">
            <Typography fontSize={{ xs: 16, lg: 20, xl: 28 }} fontWeight={500} color="white">
              Sold out
            </Typography>
            <Typography fontSize={{ xs: 16, lg: 20, xl: 28 }} fontWeight={300} color="#8667A9">
              Amount sold: {sold}/{amount}
            </Typography>
            <Box
              height="48px"
              px={4}
              bgcolor="#55169C"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
              }}>
              <Typography fontSize={{ xs: 12, lg: 16 }} fontWeight={300} color="white" textTransform="uppercase">
                ended
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography fontSize={{ xs: 20, md: 24 }} fontWeight={500} color="white">
        {text}
      </Typography>
      <Box position="relative" sx={{ '& img': { width: '100%' } }}>
        <img src={up} alt="container" />
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          p={2}
          pt={1.5}
          display="flex"
          alignItems="center"
          justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <QueryBuilderOutlinedIcon sx={{ color }} />
            {timeLeft && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={{ xs: 16, lg: 20, xl: 24 }} fontWeight={300} color={color}>
                  {status === 'cs' ? 'Starts in:' : 'Time left:'}
                </Typography>
                <Typography fontSize={{ xs: 16, lg: 20, xl: 24 }} fontWeight={500} color={color}>
                  {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography
            fontSize={{ xs: 16, lg: 20, xl: 24 }}
            fontWeight={300}
            color={color}
            sx={{ '& span': { fontWeight: 500 } }}>
            Available amount: <span>{amount}</span>
          </Typography>
        </Box>
      </Box>
      <Box position="relative" sx={{ '& img': { width: '100%' } }}>
        <img src={down} alt="container" />
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          p={2}
          pt={1.5}
          display="flex"
          alignItems="center"
          justifyContent="space-between">
          <Box flex={1} display="flex" alignItems="center" gap={1} sx={{ '& img': { width: 45 } }}>
            <img src="/images/eth.png" alt="png" />
            <Box flex={1}>
              <Typography fontSize={{ xs: 12, md: 14, lg: 16 }} fontWeight={300} color="#FFFFFF80" lineHeight="16px">
                Price
              </Typography>
              <Box width="100%" display="flex" alignItems="flex-end" gap={0.5}>
                <Typography fontSize={{ xs: 16, md: 20, lg: 28 }} fontWeight={500} color="#fff" lineHeight="32px">
                  {price ? `${formatter.format(price * quantity)} ETH` : `Free`}
                </Typography>
                {!!(price && ethPrice) && (
                  <Typography fontSize={{ xs: 12, md: 14, lg: 16 }} fontWeight={300} color="#FFFFFF50">
                    ({(price * ethPrice).toFixed(2)}$)
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          {status === 'active' && (
            <Box display="flex" alignItems="center" gap={2} pr={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={{ xs: 16, lg: 20, xl: 24 }} fontWeight={300} color="#68ABC4">
                  Quantity:
                </Typography>
                <Box width={{ lg: '24px', xl: '28px' }}>
                  <Typography fontSize={{ xs: 20, lg: 24, xl: 28 }} fontWeight={500} color="#fff">
                    {quantity}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" flexDirection="column" gap={0.25}>
                <Box
                  width={{ lg: '24px', xl: '32px' }}
                  bgcolor="#68ABC4"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    aspectRatio: '1/1',
                    transition: 'all ease 0.3s',
                    cursor: 'pointer',
                    clipPath: 'polygon(75% 0, 100% 25%, 100% 99%, 0 100%, 0 0)',
                    '&:hover': { bgcolor: '#5B96AC' },
                  }}
                  onClick={increaseQuantity}>
                  <ArrowDropUpOutlinedIcon sx={{ color: '#fff' }} />
                </Box>
                <Box
                  width={{ lg: '24px', xl: '32px' }}
                  bgcolor="#68ABC4"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    aspectRatio: '1/1',
                    transition: 'all ease 0.3s',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#5B96AC' },
                  }}
                  onClick={decreaseQuantity}>
                  <ArrowDropDownOutlinedIcon sx={{ color: '#fff' }} />
                </Box>
              </Box>
            </Box>
          )}
          <Box height="100%" display="flex" flexDirection="column" justifyContent="center" gap={0.25}>
            <Box
              height="100%"
              maxHeight="56px"
              py={2}
              px={4}
              bgcolor={btnColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                transition: 'all ease 0.3s',
                cursor: btnHoverColor ? 'pointer' : 'default',
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
                ...(btnHoverColor ? { '&:hover': { bgcolor: btnHoverColor } } : {}),
              }}
              onClick={btnOnClick}>
              <Typography fontSize={{ xs: 12, lg: 16 }} fontWeight={300} color="white" textTransform="uppercase">
                {minting ? 'Minting...' : btnText}
              </Typography>
            </Box>
            {status === 'active' && (
              <Typography fontSize={{ lg: 8, xl: 12 }} fontWeight={300} color="#68ABC4">
                Maximum amount per wallet is {maxQuantity}.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const PhaseMobile = ({ phase, ethPrice, updatePhaseStatus, minted }) => {
  const {
    text,
    status,
    amount,
    sold,
    price,
    maxQuantity,
    quantity,
    timeLeft,
    increaseQuantity,
    decreaseQuantity,
    up,
    middle,
    down,
    color,
    btnColor,
    btnText,
    btnHoverColor,
    btnOnClick,
    minting,
  } = usePhaseLogic({
    phase,
    updatePhaseStatus,
    statuses: mobileStatuses,
    minted,
  });

  if (status === 'end')
    return (
      <Box display="flex" flexDirection="column" gap={{ sm: 0.5, md: 1.5 }}>
        <Typography fontSize={{ xs: 20, md: 24 }} fontWeight={500} color="white">
          {text}
        </Typography>
        <Box position="relative" sx={{ '& img': { width: '100%' } }}>
          <img src="/images/container-end-down-mobile.png" alt="end" />
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            p={2}
            pt={1.5}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={{ xs: 1.5, sm: 2 }}>
            <Typography fontSize={{ xs: 24, sm: 28, md: 32 }} fontWeight={500} color="white" align="center">
              Sold out
            </Typography>
            <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={300} color="#8667A9">
              Amount sold: {sold}/{amount}
            </Typography>
            <Box
              px={4}
              py={{ xs: 2, md: 3 }}
              bgcolor="#55169C"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
              }}>
              <Typography
                fontSize={{ xs: 16, sm: 24, md: 32 }}
                fontWeight={300}
                color="white"
                textTransform="uppercase">
                ended
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography fontSize={{ xs: 20, md: 24 }} fontWeight={500} color="white">
        {text}
      </Typography>
      <Box position="relative" sx={{ '& img': { width: '100%' } }}>
        <img src={up} alt="container" />
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          p={2}
          pt={1.5}
          display="flex"
          alignItems="center"
          justifyContent="center">
          <Box display="flex" alignItems="center" gap={1}>
            <QueryBuilderOutlinedIcon sx={{ color }} />
            {timeLeft && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={300} color={color}>
                  Time left:
                </Typography>
                <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={500} color={color}>
                  {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <Box position="relative" sx={{ '& img': { width: '100%' } }}>
        <img src={middle} alt="container" />
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          p={2}
          pt={1.5}
          display="flex"
          alignItems="center"
          justifyContent="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              fontSize={{ xs: 16, sm: 24, md: 32 }}
              fontWeight={300}
              color={color}
              sx={{ '& span': { fontWeight: 500 } }}>
              Available amount: <span>{amount}</span>
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box position="relative" sx={{ '& img': { width: '100%' } }}>
        <img src={down} alt="container" />
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          p={2}
          pt={1.5}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
            sx={{ '& img': { width: { xs: 45, sm: 60, md: 80 } } }}>
            <img src="/images/eth.png" alt="png" />
            <Box flex={1}>
              <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={300} color="#FFFFFF80">
                Price
              </Typography>
              <Box width="100%" display="flex" alignItems="flex-end" gap={0.5}>
                <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={500} color="#fff">
                  {price ? `${formatter.format(price * quantity)} ETH` : `Free`}
                </Typography>
                {!!(price && ethPrice) && (
                  <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={300} color="#FFFFFF50">
                    ({(price * ethPrice).toFixed(2)}$)
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          {status === 'active' && (
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={300} color="#68ABC4">
                  Quantity:
                </Typography>
                <Box width={{ xs: '24px', sm: '28px' }}>
                  <Typography fontSize={{ xs: 20, sm: 24, md: 32 }} fontWeight={500} color="#fff">
                    {quantity}
                  </Typography>
                </Box>
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                gap={2.5}
                sx={{ '& img': { width: { xs: 22, sm: 45, md: 60 } } }}>
                <img src="/images/arrow-up.png" alt="arrow-up" sx={{ cursor: 'pointer' }} onClick={increaseQuantity} />
                <img
                  src="/images/arrow-down.png"
                  alt="arrow-down"
                  sx={{ cursor: 'pointer' }}
                  onClick={decreaseQuantity}
                />
              </Box>
            </Box>
          )}
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={0.25}>
            <Box
              // maxHeight="56px"
              minWidth="130px"
              px={4}
              py={{ xs: 2, md: 3 }}
              bgcolor={btnColor}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                transition: 'all ease 0.3s',
                cursor: btnHoverColor ? 'pointer' : 'default',
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(10px), 100% calc(100% + 0px), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 10px), 0% calc(10px))',
                ...(btnHoverColor ? { '&:hover': { bgcolor: btnHoverColor } } : {}),
              }}
              onClick={btnOnClick}>
              <Typography
                fontSize={{ xs: 16, sm: 24, md: 32 }}
                fontWeight={300}
                color="white"
                textTransform="uppercase">
                {minting ? 'Minting...' : btnText}
              </Typography>
            </Box>
            {status === 'active' && (
              <Typography fontSize={{ xs: 12, sm: 20, md: 24 }} fontWeight={300} color="#68ABC4" sx={{ mt: 0.25 }}>
                Maximum amount per wallet is {maxQuantity}.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const Phase = ({ phase, updatePhaseStatus, ethPrice, minted }) => {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const Component = isSmall ? PhaseMobile : PhaseDesktop;

  return <Component {...{ phase, ethPrice, updatePhaseStatus, minted }} />;
};

export default Phase;
