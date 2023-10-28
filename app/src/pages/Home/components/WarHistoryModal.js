import { useEffect, useState } from 'react';
import { Box, Dialog, Typography, Button } from '@mui/material';

import { getWarHistory } from '../../../services/user.service';

const WarHistoryModal = ({ open, onClose }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (open) getWarHistory().then((res) => setHistory(res.data));
  }, [open]);

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
                <thead>
                  <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
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
                </thead>
                {history.length ? (
                  <tbody style={{ display: 'block', maxHeight: '30vh', overflowY: 'scroll' }}>
                    {history.map((row) => (
                      <tr
                        key={row.date}
                        style={{
                          display: 'table',
                          width: '100%',
                          backgroundColor: '#d9d9d9',
                          borderTop: '2px solid white',
                          tableLayout: 'fixed',
                        }}>
                        <td style={{ padding: 4 }}>
                          <Typography fontSize={12}>{`${new Date(row.createdAt).getDate()}/${
                            new Date(row.createdAt).getMonth() + 1
                          }`}</Typography>
                        </td>
                        <td>
                          <Typography fontSize={12} textAlign="center">
                            {row.isWarEnabled ? 'War' : 'Peace'}
                          </Typography>
                        </td>
                        <td>
                          <Typography fontSize={12} textAlign="center">
                            {Math.round(row.voteRatio * 100)}%
                          </Typography>
                        </td>
                        <td style={{ padding: 4 }}>
                          <Typography fontSize={12} textAlign="right" sx={{ mr: row.outcome ? 0 : 3 }}>
                            {row.outcome ?? '-'}
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <Box width="100%" bgcolor="#d9d9d9" p={1}>
                    <Typography fontSize={12} textAlign="center">
                      No data.
                    </Typography>
                  </Box>
                )}
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

export default WarHistoryModal;
