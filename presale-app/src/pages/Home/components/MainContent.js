import { Box, Typography } from '@mui/material';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

import Phase from './Phase';
import useAppContext from '../../../contexts/useAppContext';

const links = [
  { img: '/images/discord.png', url: 'https://discord.gg/nVyGcEPVmj' },
  { img: '/images/x.png', url: 'https://twitter.com/gguncharted' },
  { img: '/images/web.png', url: 'https://uncharted.gg' },
];

const MainContent = () => {
  const {
    phaseState: { phases, updatePhaseStatus },
  } = useAppContext();

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Box display="flex" alignItems="center" gap={3} sx={{ '& img': { cursor: 'pointer' } }}>
        {links.map((link) => (
          <img key={link.img} src={link.img} alt="link" onClick={() => window.open(link.url)} />
        ))}
      </Box>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography fontSize={{ xs: 32, md: 48, xl: 56 }} fontWeight={500} color="white">
            Gangster NFT Presale
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Typography color="white" fontSize={{ xs: 16, sm: 20 }}>
              Gangsters are the core unit in Gangster Arena
            </Typography>
            <Typography color="white" fontSize={{ xs: 16, sm: 20 }}>
              They passively generate the $GANG token and are used to compete in gang wars and leaderboard rewards.
            </Typography>
            <Typography color="white" fontSize={{ xs: 16, sm: 20 }}>
              The ONLY way to generate $GANG when Gangster Arena 2 begins will be to own a Gangster.
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={{ xs: 12, sm: 14 }} fontWeight={700} color="white">
            Read more
          </Typography>
          <ArrowRightAltIcon sx={{ color: '#904AFF' }} />
        </Box>
      </Box>
      <Box py={2} display="flex" flexDirection="column" gap={2}>
        {phases.map((phase) => (
          <Phase
            key={phase.id}
            text={phase.name}
            status={phase.status}
            amount={phase.totalSupply}
            sold={phase.sold}
            price={phase.priceInEth}
            ethPrice={3000}
            startTimeUnix={phase.startTime}
            endTimeUnix={phase.endTime}
            maxQuantity={phase.maxPerWallet}
            updatePhaseStatus={updatePhaseStatus}
          />
        ))}
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={{ xs: 24, md: 32, xl: 40 }} fontWeight={500} color="white">
            More
          </Typography>
          <Typography
            fontSize={{ xs: 24, md: 32, xl: 40 }}
            fontWeight={500}
            sx={{
              background: 'linear-gradient(to right, #904AFF 0%, #67D7F9 100%);',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            Information
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Typography fontSize={{ xs: 16, sm: 20 }} color="white">
            Gangster Arena 2 is an idle risk-to-earn game available on mobile. Play as a mob boss and expand your gang.
            Earn passive rewards and climb the leaderboards. Battle it out in PVP mind games, both in gang wars and out
            in the marketplace.
          </Typography>
          <Typography fontSize={{ xs: 16, sm: 20 }} color="white">
            Gangsters are an uncapped supply NFT that is required to play Gangster Arena 2. Gangsters cost $GANG, and
            the only way to generate $GANG when the game begins is to own one of the pre-sold Gangsters.
          </Typography>
          <Typography fontSize={{ xs: 16, sm: 20 }} color="white">
            For more information please visit our Twitter and Discord.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MainContent;
