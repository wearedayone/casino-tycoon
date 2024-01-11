import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

const Deposit = () => {
  const navigate = useNavigate();
  const [mouseDown, setMouseDown] = useState(false);
  const [code, setCode] = useState('');
  const inputRef = useRef([]);

  const onPaste = (e) => {
    // Stop data actually being pasted into div
    e.stopPropagation();
    e.preventDefault();

    // Get pasted data via clipboard API
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');

    setCode(`${pastedData}      `.slice(0, 6));
  };

  useEffect(() => {
    if (code.length === 6 && !code.split('').includes(' ')) {
      navigate(`/deposit/user?code=${code}`);
    }
  }, [code]);

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
      <Box py={5} display="flex" alignItems="center" justifyContent="center" gap={{ xs: 1, md: 2, lg: 4 }}>
        {Array(6)
          .fill('')
          .map((item, index) => (
            <Box
              key={index}
              width="140px"
              maxWidth="13vw"
              bgcolor="white"
              borderRadius={2}
              border="1px solid #DDB790"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                aspectRatio: '140/166',
                '& input': {
                  width: '100%',
                  height: '100%',
                  bgcolor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#29000B',
                  textAlign: 'center',
                },
              }}>
              <input
                ref={(node) => (inputRef.current[index] = node)}
                value={code[index] || ''}
                onChange={(e) => {
                  if (typeof +e.target.value !== 'number') return;
                  if (!e.target.value?.trim()) return;
                  if (e.target.value.trim().length > 1) {
                    inputRef.current[index + 1]?.focus();
                    return;
                  }
                  setCode((prevCode) => {
                    const digits = Array.from({ length: 6 }, (_, i) => prevCode[i] || ' ');
                    digits[index] = e.target.value?.trim() || ' ';
                    console.log(digits);
                    return digits.join('');
                  });
                  inputRef.current[index + 1]?.focus();
                }}
                onKeyUp={(e) => {
                  if (e.key === 'Backspace') {
                    setCode((prevCode) => {
                      const digits = Array.from({ length: 6 }, (_, i) => prevCode[i] || ' ');
                      digits[index] = ' ';
                      return digits.join('');
                    });
                    inputRef.current[index - 1]?.focus();
                  }
                }}
                onPaste={onPaste}
              />
            </Box>
          ))}
      </Box>
      <Box
        alignSelf="center"
        position="relative"
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => setMouseDown(false)}
        onClick={() => {
          if (code.length === 6 && !code.split('').includes(' ')) {
            navigate(`/deposit/user?code=${code}`);
          }
        }}>
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
            sx={{ userSelect: 'none' }}>
            Proceed
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Deposit;
