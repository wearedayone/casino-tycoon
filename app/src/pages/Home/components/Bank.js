import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';

import IconButton from './IconButton';
import useUserStore from '../../../stores/user.store';
import { getRank } from '../../../services/user.service';
import QueryKeys from '../../../utils/queryKeys';

const Bank = ({ setOpeningModal }) => {
  const profile = useUserStore((state) => state.profile);
  const { status, data: rankData } = useQuery({
    queryFn: getRank,
    queryKey: [QueryKeys.Rank, profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 30 * 1000,
  });
  const [rankInfo, setRankInfo] = useState({
    rank: null,
    change: null,
  });

  useEffect(() => {
    if (rankData && rankData.data) {
      setRankInfo({
        rank: rankData.data.rank,
        change: rankInfo.rank ? (rankData.data.rank < rankInfo.rank ? 'up' : 'down') : null,
      });
    }
  }, [rankData]);

  return (
    <Box flex={1} display="flex" gap={2} sx={{ borderBottom: '1px solid #555' }}>
      <Box px={2} pt={4} width={80} display="flex" flexDirection="column" justifyContent="space-between">
        <Box display="flex" flexDirection="column" justifyContent="center" gap={3}>
          <IconButton
            Icon={<SettingsOutlinedIcon sx={{ fontSize: 24 }} />}
            onClick={() => setOpeningModal('SETTING')}
          />
          <IconButton
            Icon={<img src="/images/icons/gift-box.png" alt="gift" style={{ width: 20 }} />}
            onClick={() => {}}
          />
        </Box>
        <img src="/images/tree.png" alt="tree" maxWidth={80} maxHeight="100%" />
      </Box>
      <Box flex={1} display="flex" justifyContent="center" alignItems="flex-end" gap={2}>
        <img src="/images/bank.png" alt="bank" width={180} maxWidth="90%" maxHeight="100%" />
      </Box>
      <Box px={2} py={4} width={80} display="flex" flexDirection="column" gap={0}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <IconButton
            Icon={<LeaderboardOutlinedIcon sx={{ fontSize: 24 }} />}
            onClick={() => setOpeningModal('LEADERBOARD')}
          />
          <Box display="flex" justifyContent="center" alignItems="center" gap={0.25}>
            {rankInfo && <Typography>#{rankInfo.rank}</Typography>}
            {rankInfo.change && (
              <img src={`/images/icons/arrow-${rankInfo.change}.png`} width={12} style={{ marginBottom: 2 }} />
            )}
          </Box>
        </Box>
        <IconButton
          Icon={<TimelineOutlinedIcon sx={{ fontSize: 24 }} />}
          onClick={() => setOpeningModal('PORTFOLIO')}
        />
      </Box>
    </Box>
  );
};

export default Bank;
