import { Box, Dialog, Typography, Button } from '@mui/material';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const StatisticsModal = ({ open, setOpenUpdate }) => {
  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={() => setOpenUpdate(null)}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              My Statistics
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography fontSize={14}>Ranking</Typography>
              <StatisticsItem
                renderIcon={() => <LeaderboardOutlinedIcon />}
                title="End game ranking"
                content="52/1,321"
              />
              <StatisticsItem
                renderIcon={() => <StarBorderIcon />}
                title="Gang reputation"
                content={
                  <>
                    41
                    <StarBorderIcon sx={{ fontSize: 12 }} />
                  </>
                }
              />
            </Box>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography fontSize={14}>Units Owned:</Typography>
              <StatisticsItem
                renderIcon={() => <img src="/images/gangster.png" alt="" width={20} />}
                title="Gangsters owned:"
                content="6 units"
              />
              <StatisticsItem
                renderIcon={() => <img src="/images/goon.png" alt="" width={20} />}
                title="Goons owned:"
                content="42 units"
              />
              <StatisticsItem
                renderIcon={() => <img src="/images/house.png" alt="" width={20} />}
                title="Safehouse upgrade:"
                content="17 upgrade"
              />
            </Box>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography fontSize={14}>Total Points</Typography>
              <StatisticsItem
                renderIcon={() => <LeaderboardOutlinedIcon />}
                title="Total points ranking:"
                content="52/1,321"
              />
              <StatisticsItem
                renderIcon={() => <LeaderboardOutlinedIcon />}
                title="Total points obtained:"
                content="12,321"
              />
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button
              variant="outlined"
              onClick={() => setOpenUpdate('LEADERBOARD')}
              sx={{ color: 'black', textTransform: 'none' }}>
              Back to Leaderboard
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

const StatisticsItem = ({ renderIcon, title, content }) => {
  return (
    <Box display="flex" alignItems="center" borderRadius={1} border="1px solid black" px={1} py={0.5} gap={2}>
      <Box width="20px">{renderIcon()}</Box>
      <Typography sx={{ flex: 1 }} fontSize={12}>
        {title}
      </Typography>
      <Typography fontSize={12}>{content}</Typography>
    </Box>
  );
};

export default StatisticsModal;
