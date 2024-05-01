import { Box, Collapse, Typography, useMediaQuery } from '@mui/material';

import { menuLinks, socials } from '../utils/links';
import useAppContext from '../contexts/useAppContext';
import { MediumIcon, XIcon, DiscordIcon } from './Icons';

const CollapsedMenuXs = () => {
  const show = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const {
    menuState: { open: openMenu },
  } = useAppContext();

  if (!show) return null;

  return (
    <Collapse
      in={openMenu}
      sx={{
        position: 'fixed',
        top: '86px',
        left: 0,
      }}>
      <Box
        zIndex={9999}
        width="100vw"
        height="calc(100vh - 86px)"
        p={2}
        bgcolor="#1A0C31"
        display="flex"
        flexDirection="column"
        alignItems="center">
        <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4}>
          {menuLinks.map(({ name, url }) => (
            <Box
              key={name}
              onClick={() => window.open(url)}
              display="flex"
              alignItems="center"
              gap={1.5}
              sx={{ cursor: 'pointer' }}>
              {name === 'Token' ? (
                <video autoPlay playsInline loop muted style={{ width: '20px', height: '20px' }}>
                  <source src="/videos/coin-safari.mp4" type="video/mp4" />
                  <source src="/videos/coin-vp9.mp4" type="video/webp" />
                </video>
              ) : null}
              <Typography fontSize={24} fontWeight={300} color="white" textTransform="uppercase">
                {name}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box display="flex" alignItems="center" gap={4}>
          {socials?.map(({ name, url }) => (
            <Box key={`sub-${name}`} sx={{ cursor: 'pointer' }} onClick={() => window.open(url)}>
              {name === 'Medium' ? <MediumIcon /> : name === 'X' ? <XIcon width="20px" /> : <DiscordIcon />}
            </Box>
          ))}
        </Box>
      </Box>
    </Collapse>
  );
};

export default CollapsedMenuXs;
