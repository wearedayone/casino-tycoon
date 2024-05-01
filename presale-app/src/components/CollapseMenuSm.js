import { Box, Collapse, Typography, useMediaQuery } from '@mui/material';

import { menuLinks, socials } from '../utils/links';
import useMenuStore from '../stores/menu.store';
import { MediumIcon, XIcon, DiscordIcon } from './Icons';

const CollapsedMenuSm = () => {
  const upSm = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const down1300 = useMediaQuery('(max-width: 1300px)');
  const openMenu = useMenuStore((state) => state.open);

  const show = upSm && down1300;

  if (!show) return null;

  return (
    <Collapse in={openMenu}>
      <Box p={2} display="flex" alignItems="flex-end">
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={2}>
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
              <Typography fontWeight="300" color="white" textTransform="uppercase">
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

export default CollapsedMenuSm;
