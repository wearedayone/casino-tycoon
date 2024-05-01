import { useState, useRef, useEffect } from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import QueryBuilderOutlinedIcon from '@mui/icons-material/QueryBuilderOutlined';
import ArrowDropUpOutlinedIcon from '@mui/icons-material/ArrowDropUpOutlined';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';

const formatTimeNumber = (number) => (number > 9 ? `${number}` : `0${number}`);

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

const PhaseDesktop = ({ text, status, amount, sold, price, ethPrice, endTimeUnix, maxQuantity }) => {
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState(null);
  const interval = useRef();

  const increaseQuantity = () => setQuantity(Math.min(quantity + 1, maxQuantity));
  const decreaseQuantity = () => setQuantity(Math.max(quantity - 1, 1));

  const countdown = () => {
    const now = Date.now();
    const diff = endTimeUnix - now;
    if (diff <= 0) {
      setTimeLeft({
        h: `00`,
        m: `00`,
        s: `00`,
      });
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

  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    if (endTimeUnix) {
      interval.current = setInterval(countdown, 1000);
    }
  }, [endTimeUnix]);

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
                clipPath: 'polygon(85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%, 0 0)',
              }}>
              <Typography fontSize={{ xs: 12, lg: 16 }} fontWeight={300} color="white" textTransform="uppercase">
                ended
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );

  const { up, down, color, btnColor, btnText, btnHoverColor } = desktopStatuses[status] || {};

  return (
    <Box>
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
                  Time left:
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
                  {price ? `${price} ETH` : `Free`}
                </Typography>
                {!!(price && ethPrice) && (
                  <Typography fontSize={{ xs: 12, md: 14, lg: 16 }} fontWeight={300} color="#FFFFFF50">
                    ({price * ethPrice}$)
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
                clipPath: 'polygon(85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%, 0 0)',
                ...(btnHoverColor ? { '&:hover': { bgcolor: btnHoverColor } } : {}),
              }}>
              <Typography fontSize={{ xs: 12, lg: 16 }} fontWeight={300} color="white" textTransform="uppercase">
                {btnText}
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

const PhaseMobile = ({ text, status, amount, sold, price, ethPrice, endTimeUnix, maxQuantity }) => {
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState(null);
  const interval = useRef();

  const increaseQuantity = () => setQuantity(Math.min(quantity + 1, maxQuantity));
  const decreaseQuantity = () => setQuantity(Math.max(quantity - 1, 1));

  const countdown = () => {
    const now = Date.now();
    const diff = endTimeUnix - now;
    if (diff <= 0) {
      setTimeLeft({
        h: `00`,
        m: `00`,
        s: `00`,
      });
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

  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    if (endTimeUnix) {
      interval.current = setInterval(countdown, 1000);
    }
  }, [endTimeUnix]);

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
                clipPath: 'polygon(85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%, 0 0)',
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

  const { up, middle, down, color, btnColor, btnText, btnHoverColor } = mobileStatuses[status] || {};

  return (
    <Box>
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
                  {price ? `${price} ETH` : `Free`}
                </Typography>
                {!!(price && ethPrice) && (
                  <Typography fontSize={{ xs: 16, sm: 24, md: 32 }} fontWeight={300} color="#FFFFFF50">
                    ({price * ethPrice}$)
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
                clipPath: 'polygon(85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%, 0 0)',
                ...(btnHoverColor ? { '&:hover': { bgcolor: btnHoverColor } } : {}),
              }}>
              <Typography
                fontSize={{ xs: 16, sm: 24, md: 32 }}
                fontWeight={300}
                color="white"
                textTransform="uppercase">
                {btnText}
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

const Phase = ({ text, status, amount, sold, price, ethPrice, endTimeUnix, maxQuantity }) => {
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  if (isSmall) return <PhaseMobile {...{ text, status, amount, sold, price, ethPrice, endTimeUnix, maxQuantity }} />;

  return <PhaseDesktop {...{ text, status, amount, sold, price, ethPrice, endTimeUnix, maxQuantity }} />;
};

export default Phase;
