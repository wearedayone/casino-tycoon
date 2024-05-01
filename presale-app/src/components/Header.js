import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Menu, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import UnchartedLogo from './UnchartedLogo';
import CollapsedMenuSm from './CollapseMenuSm';
import { MediumIcon, XIcon, ChevronIcon, DiscordIcon } from './Icons';
import { externalLinks, links } from '../utils/links';
import useAppContext from '../contexts/useAppContext';

const Header = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    menuState: { open: openCollapsedMenu, setOpen: setOpenCollapseMenu },
    walletState: { address },
  } = useAppContext();
  const isSmall = useMediaQuery('(max-width: 1300px)');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box p={2} bgcolor="#1A0C31">
      <Box position="relative" display="flex" alignItems="center" justifyContent="space-between">
        <UnchartedLogo width={isSmall ? '123px' : '173px'} />
        <Box display="flex" alignItems="center" gap={isSmall ? 1.5 : 3}>
          {externalLinks.map((item) => (
            <Box
              key={item.name}
              onClick={() => window.open(item.url)}
              display={isSmall ? 'none' : 'flex'}
              alignItems="center"
              gap={1.5}
              sx={{ cursor: 'pointer' }}>
              <Typography fontWeight="300" color="white" textTransform="uppercase">
                {item.name}
              </Typography>
            </Box>
          ))}
          {!address && pathname !== '/login' && (
            <Box
              height="54px"
              px={isSmall ? 2 : 6}
              bgcolor="#904aff"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                clipPath: 'polygon(85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%, 0 0)',
                cursor: 'pointer',
                transition: 'all ease 0.3s',
                '&:hover': {
                  bgcolor: '#7b1fe4',
                },
              }}
              onClick={() => navigate('/login')}>
              <Typography fontWeight="300" color="white" textTransform="uppercase">
                login
              </Typography>
            </Box>
          )}
          {address && <Typography color="white">{`${address.slice(0, 4)}...${address.slice(-4)}`}</Typography>}
          {isSmall && (
            <Box
              sx={{
                cursor: 'pointer',
                clipPath:
                  'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(20px / 2), 100% calc(100% - 0px / 2), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 20px / 2), 0% calc(20px / 2))',
              }}
              onClick={() => {
                setOpenCollapseMenu(!openCollapsedMenu);
              }}>
              <Box
                width="54px"
                height="54px"
                bgcolor="#904aff"
                display="flex"
                alignItems="center"
                justifyContent="center">
                <Box
                  sx={{
                    clipPath:
                      'polygon(0px 0%, calc(100% - 20px) 0%, 100% calc(20px / 2), 100% calc(100% - 0px / 2), calc(100% - 20px) 100%, calc(20px) 100%, 0% calc(100% - 20px / 2), 0% calc(20px / 2))',
                  }}>
                  <Box
                    width="52px"
                    height="52px"
                    bgcolor="#1A0C31"
                    display="flex"
                    alignItems="center"
                    justifyContent="center">
                    {openCollapsedMenu ? (
                      <CloseIcon sx={{ color: '#904aff' }} />
                    ) : (
                      <MenuIcon sx={{ color: '#904aff' }} />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        <Box
          position="absolute"
          top={0}
          left="50%"
          height="100%"
          sx={{ transform: 'translateX(-50%)' }}
          display={isSmall ? 'none' : 'flex'}
          justifyContent="center"
          alignItems="center"
          gap={3}>
          {links.map(({ name, url, sublinks }) =>
            url ? (
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
            ) : (
              <Box key={name}>
                <Box
                  id={`${name}-basic-button`}
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{ cursor: 'pointer' }}
                  aria-controls={open ? 'basic-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleClick}>
                  <Typography fontWeight="300" color="white" textTransform="uppercase">
                    {name}
                  </Typography>
                  <ChevronIcon />
                </Box>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': `${name}-basic-button`,
                  }}
                  sx={{
                    ml: 5,
                    '& ul': {
                      p: 0,
                    },
                  }}>
                  <Box width="100%" bgcolor="#1A0C31">
                    <Box
                      p="18px"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={2}
                      border="1px solid #2a224e">
                      {sublinks?.map(({ name, url }) => (
                        <Box key={`sub-${name}`} sx={{ cursor: 'pointer' }} onClick={() => window.open(url)}>
                          {name === 'Medium' ? <MediumIcon /> : name === 'X' ? <XIcon width="20px" /> : <DiscordIcon />}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Menu>
              </Box>
            )
          )}
        </Box>
      </Box>
      <CollapsedMenuSm />
    </Box>
  );
};

export default Header;
