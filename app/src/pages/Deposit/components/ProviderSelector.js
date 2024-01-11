import { Box, Typography, alpha } from '@mui/material';

const providers = [
  { name: 'Metamask', icon: '/images/wallet-metamask.png', providerName: 'MetaMask' },
  { name: 'Coinbase', icon: '/images/wallet-coinbase.png', providerName: 'CoinbaseWallet' },
];

const ProviderSelector = ({ open, setOpen, connectWallet }) => {
  if (!open) return null;

  return (
    <Box
      bgcolor={alpha('#000', 0.4)}
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-end"
      onClick={() => setOpen(false)}>
      <Box
        bgcolor="white"
        p={2}
        sx={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        display="flex"
        flexDirection="column"
        gap={2}
        onClick={(e) => e.stopPropagation()}>
        <Typography fontSize={24} color="#29000B" fontFamily="WixMadeforDisplayBold" align="center">
          Connect your wallet
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          {providers.map((provider) => (
            <Box
              key={provider.name}
              position="relative"
              display="flex"
              justifyContent="center"
              sx={{ '& .container-img': { width: 400, maxWidth: '100%' } }}
              onClick={() => {
                connectWallet({ providerName: provider.providerName });
                setOpen(false);
              }}>
              <img className="container-img" src="/images/container-deposit.png" alt="container" />
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
                alignItems="center"
                gap={1}>
                <Box
                  height="100%"
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
                  <img src={provider.icon} alt="coint" />
                </Box>
                <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
                  <Typography
                    fontSize={{ xs: 16, sm: 24, md: 32 }}
                    fontWeight={700}
                    fontFamily="WixMadeforDisplayBold"
                    color="#29000B">
                    {provider.name}
                  </Typography>
                </Box>
                <Box>
                  <img src="/images/right-arrow-1.png" alt="arrow" width={20} />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ProviderSelector;
