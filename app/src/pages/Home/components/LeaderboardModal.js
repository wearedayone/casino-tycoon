import { useState } from 'react';
import { Box, Grid, Dialog, Typography, Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

import PointEarnedModal from './PointEarnedModal';
import ReputationModal from './ReputationModal';

const LeaderboardModal = ({ open, setOpenUpdate }) => {
  const [mode, setMode] = useState('leaderboard');
  const [tab, setTab] = useState('reputation'); // reputation | pointsEarned

  const tabs = [
    { text: 'Reputation', value: 'reputation' },
    { text: 'Points Earned', value: 'pointsEarned' },
  ];

  if (mode === 'pointsEarned') return <PointEarnedModal open onBack={() => setMode('leaderboard')} />;
  if (mode === 'reputation') return <ReputationModal open onBack={() => setMode('leaderboard')} />;

  const OverView =
    tab === 'reputation' ? (
      <Box
        height="60px"
        px={2}
        border="1px solid black"
        borderRadius={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between">
        <Typography fontWeight={600}>Total Prize Pool:</Typography>
        <Typography fontSize={20} sx={{ flexShrink: 0 }}>
          178.2 ETH
        </Typography>
      </Box>
    ) : (
      <Box
        height="60px"
        px={2}
        border="1px solid black"
        borderRadius={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between">
        <Typography fontWeight={600}>Points Earned This Seasion:</Typography>
        <Typography fontSize={20} sx={{ flexShrink: 0 }}>
          717 points
        </Typography>
      </Box>
    );

  const List = tab === 'reputation' ? <LeaderboardList /> : <PointsEarnedList />;

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      open={open}
      onClose={() => {}}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none', minWidth: window.innerWidth * 0.9 },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Leaderboard
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography fontSize={18} sx={{ '& span': { fontWeight: 600 } }}>
                <span>GAME ENDS IN:</span> 15d 12h 44m 05s
              </Typography>
              <Typography fontSize={14} fontStyle="italic" align="center">
                Every Gangster purchased increases time by 1 hour
              </Typography>
            </Box>
            {OverView}
            <Box display="flex" gap={1}>
              {tabs.map((item) => (
                <Box
                  key={item.value}
                  flex={1}
                  px={1}
                  py={0.5}
                  borderRadius={2}
                  bgcolor={item.value === tab ? '#504f4f' : '#d9d9d9'}
                  display="flex"
                  justifyContent="center"
                  gap={0.5}
                  sx={{ '& img': { alignSelf: 'flex-start' } }}
                  onClick={() => setTab(item.value)}>
                  <Typography align="center" color={item.value === tab ? 'white' : 'black'}>
                    {item.text}
                  </Typography>
                  <InfoIcon
                    sx={{ fontSize: 14, color: item.value === tab ? 'white' : 'black' }}
                    onClick={() => setMode(item.value)}
                  />
                </Box>
              ))}
            </Box>
            {List}
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              onClick={() => setOpenUpdate(null)}
              sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default LeaderboardModal;

const LeaderboardList = () => {
  const items = [
    {
      id: '1',
      username: 'jack.nguyensdadsdasadasd',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      reputation: 500,
      reward: 20,
    },
    {
      id: '2',
      username: 'ally.tran',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      reputation: 500,
      reward: 20,
    },
    {
      id: '3',
      username: 'brian.hoang',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      reputation: 500,
      reward: 20,
    },
    {
      id: '4',
      username: 'bernard.teo',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      reputation: 500,
      reward: 20,
    },
    {
      id: '5',
      username: 'jw',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      reputation: 500,
      reward: 20,
    },
    {
      id: '6',
      username: 'derek.lau',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      reputation: 500,
      reward: 20,
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Grid container spacing={0.5}>
        <Grid item xs={2}>
          <Box height="100%" display="flex" alignItems="center">
            <Typography fontSize={12}>Rank</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box height="100%" display="flex" alignItems="center">
            <Typography fontSize={12}>Name</Typography>
          </Box>
        </Grid>
        <Grid item xs={2}>
          <Box height="100%" display="flex" justifyContent="center" alignItems="center">
            <Typography fontSize={12}>Reputation</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box height="100%" display="flex" justifyContent="flex-end" alignItems="center">
            <Typography fontSize={12}>ETH Rewards</Typography>
          </Box>
        </Grid>
      </Grid>
      <Box maxHeight="200px" overflow="auto" display="flex" flexDirection="column" gap={1}>
        {items.map((item, index) => (
          <Grid key={item.id} container spacing={0.5}>
            <Grid item xs={2}>
              <Box height="100%" overflow="hidden" display="flex" alignItems="center" gap={0.5}>
                {index < 3 ? <img src="/images/icons/crown_2.png" alt="crown" width={14} /> : <Box width="14px" />}
                <Typography fontSize={12} fontWeight={600}>
                  {index + 1}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box
                height="100%"
                display="flex"
                alignItems="center"
                gap={0.5}
                overflow="hidden"
                sx={{
                  '& img': {
                    display: 'block',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    borderRadius: '50%',
                  },
                }}>
                <img src={item.avatarURL} alt="avatar" width={25} />
                <Typography fontSize={12}>{item.username}</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box height="100%" overflow="hidden" display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                <Typography fontSize={12}>{item.reputation}</Typography>
                <StarBorderRoundedIcon sx={{ fontSize: 12 }} />
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box height="100%" overflow="hidden" display="flex" justifyContent="flex-end" alignItems="center">
                <Typography fontSize={12}>~{item.reward}</Typography>
              </Box>
            </Grid>
          </Grid>
        ))}
      </Box>
    </Box>
  );
};

const PointsEarnedList = () => {
  const items = [
    {
      id: '1',
      username: 'jack.nguyensdadsdasadasd',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      pointsEarned: 500,
    },
    {
      id: '2',
      username: 'ally.tran',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      pointsEarned: 500,
    },
    {
      id: '3',
      username: 'brian.hoang',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      pointsEarned: 500,
    },
    {
      id: '4',
      username: 'bernard.teo',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      pointsEarned: 500,
    },
    {
      id: '5',
      username: 'jw',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      pointsEarned: 500,
    },
    {
      id: '6',
      username: 'derek.lau',
      avatarURL: 'https://placehold.co/400x400/1e90ff/FFF?text=R',
      pointsEarned: 500,
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Grid container spacing={0.5}>
        <Grid item xs={2}>
          <Box height="100%" display="flex" alignItems="center">
            <Typography fontSize={12}>Rank</Typography>
          </Box>
        </Grid>
        <Grid item xs={5}>
          <Box height="100%" display="flex" alignItems="center">
            <Typography fontSize={12}>Name</Typography>
          </Box>
        </Grid>
        <Grid item xs={5}>
          <Box height="100%" display="flex" justifyContent="flex-end" alignItems="center">
            <Typography fontSize={12}>Total points earned</Typography>
          </Box>
        </Grid>
      </Grid>
      <Box maxHeight="200px" overflow="auto" display="flex" flexDirection="column" gap={1}>
        {items.map((item, index) => (
          <Grid key={item.id} container spacing={0.5}>
            <Grid item xs={2}>
              <Box height="100%" overflow="hidden" display="flex" alignItems="center" gap={0.5}>
                {index < 3 ? <img src="/images/icons/crown_2.png" alt="crown" width={14} /> : <Box width="14px" />}
                <Typography fontSize={12} fontWeight={600}>
                  {index + 1}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={5}>
              <Box
                height="100%"
                display="flex"
                alignItems="center"
                gap={0.5}
                overflow="hidden"
                sx={{
                  '& img': {
                    display: 'block',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    borderRadius: '50%',
                  },
                }}>
                <img src={item.avatarURL} alt="avatar" width={25} />
                <Typography fontSize={12}>{item.username}</Typography>
              </Box>
            </Grid>
            <Grid item xs={5}>
              <Box
                height="100%"
                overflow="hidden"
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                gap={0.5}>
                <Typography fontSize={12}>{item.pointsEarned} points</Typography>
              </Box>
            </Grid>
          </Grid>
        ))}
      </Box>
    </Box>
  );
};
