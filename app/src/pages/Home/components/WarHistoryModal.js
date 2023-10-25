import { Box, Dialog, Typography, Button } from '@mui/material';

const WarHistoryModal = ({ open, onClose }) => {
  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 1, backgroundColor: 'transparent', boxShadow: 'none' },
      }}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" flexDirection="column" bgcolor="white" borderRadius={1}>
          <Box py={1} sx={{ borderBottom: '1px solid #555' }}>
            <Typography fontSize={20} fontWeight={600} align="center">
              Daily History & Outcomes
            </Typography>
          </Box>
          <Box p={2} display="flex" flexDirection="column" gap={2}>
            <Box display="flex" flexDirection="column">
              <Typography fontSize={14}>Past History</Typography>
              <table style={{ borderCollapse: 'collapse' }}>
                <tr>
                  <th>
                    <Typography fontSize={12}>Date</Typography>
                  </th>
                  <th>
                    <Typography fontSize={12}>Your vote</Typography>
                  </th>
                  <th>
                    <Typography fontSize={12}>Vote %</Typography>
                  </th>
                  <th>
                    <Typography fontSize={12}>Outcome</Typography>
                  </th>
                </tr>
                {history.map((row) => (
                  <tr key={row.date} style={{ backgroundColor: '#d9d9d9', borderTop: '2px solid white' }}>
                    <td style={{ padding: 4 }}>
                      <Typography fontSize={12}>{row.date}</Typography>
                    </td>
                    <td>
                      <Typography fontSize={12} textAlign="center">
                        {row.isWarEnabled ? 'War' : 'Peace'}
                      </Typography>
                    </td>
                    <td>
                      <Typography fontSize={12}>{row.voteRatio * 100}%</Typography>
                    </td>
                    <td style={{ padding: 4 }}>
                      <Typography fontSize={12} textAlign="right" sx={{ mr: row.outcome ? 0 : 3 }}>
                        {row.outcome ?? '-'}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </table>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography fontSize={14}>Potential Outcomes</Typography>
              <Box display="flex" gap={0.5} bgcolor="#d9d9d9">
                <Box
                  flex={1}
                  height="100%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1}
                  gap={0.5}>
                  <Typography fontSize={12}>&lt;40% War</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography fontSize={22} fontWeight="bold">
                      2x
                    </Typography>
                    <img src="/images/icons/coin.png" alt="coin" width={20} height={20} />
                  </Box>
                  <Typography fontSize={12}>from last 24h</Typography>
                </Box>
                <Box
                  flex={1}
                  height="100%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1}
                  gap={0.5}>
                  <Typography fontSize={12}>&gt;60% War</Typography>
                  <Box display="flex" alignItems="center">
                    <img src="/images/goon.png" alt="" width={32} style={{ transform: 'scaleX(-1)' }} />
                    <img src="/images/gangster.png" alt="" width={30} />
                  </Box>
                  <Typography fontSize={12}>10% die</Typography>
                </Box>
                <Box
                  flex={1}
                  height="100%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1}
                  gap={0.5}>
                  <Typography fontSize={12}>40-60% War</Typography>
                  <img src="/images/icons/shield.png" alt="" width={30} />
                  <Typography fontSize={12}>Nothing</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={2} bgcolor="white" borderRadius={2}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Button variant="outlined" onClick={onClose} sx={{ color: 'black', textTransform: 'none' }}>
              Back
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

const history = [
  { date: '14/10', isWarEnabled: true, voteRatio: 0.51, outcome: null },
  { date: '13/10', isWarEnabled: true, voteRatio: 0.61, outcome: '-1 gangster, -2 goons' },
  { date: '12/10', isWarEnabled: true, voteRatio: 0.65, outcome: '-1 goon' },
  { date: '11/10', isWarEnabled: false, voteRatio: 0.4, outcome: null },
  { date: '10/10', isWarEnabled: false, voteRatio: 0.2, outcome: null },
  { date: '09/10', isWarEnabled: false, voteRatio: 0.9, outcome: null },
  { date: '08/10', isWarEnabled: true, voteRatio: 0.3, outcome: '+188K $FIAT' },
  { date: '07/10', isWarEnabled: true, voteRatio: 0.3, outcome: '+172K $FIAT' },
];

export default WarHistoryModal;
