import { useState, useEffect, useMemo } from 'react';
import { faker } from '@faker-js/faker';
import * as Sentry from '@sentry/react';

import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';
import useSeasonCountdown from './useSeasonCountdown';
import { calculateHouseLevel } from '../utils/formulas';
import { completeTutorial } from '../services/user.service';
import { getNextWarSnapshotUnixTime } from '../services/gamePlay.service';

const useSimulatorGameListener = () => {
  const user = useUserStore((state) => state.profile);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  // console.log(activeSeason);
  // const [activeSeason, setActiveSeason] = useState({

  // })
  const market = useSystemStore((state) => state.market);
  const templates = useSystemStore((state) => state.templates);
  const [gameRef, setGameRef] = useState(null);
  const [balances, setBalances] = useState({ xTokenBalance: 10000, tokenBalance: 100000 });
  const [assets, setAssets] = useState({
    numberOfMachines: 0,
    numberOfWorkers: 0,
    numberOfBuildings: 0,
    networth: 0,
    warDeployment: {
      numberOfMachinesToEarn: 0,
      numberOfMachinesToAttack: 0,
      numberOfMachinesToDefend: 0,
      attackUserId: null,
      acttackUser: null,
    },
  });
  const [isLeaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const { isEnded, countdownString } = useSeasonCountdown({ open: isLeaderboardModalOpen });

  const leaderboardData = useMemo(() => {
    if (!user || !activeSeason?.prizePoolConfig) return [];

    const allUsers = [
      ...mockUsers,
      {
        avatarURL: user.avatarURL,
        id: faker.string.uuid(),
        networth: assets.networth,
        userId: user.id,
        username: user.username,
        isUser: true,
      },
    ].sort((user1, user2) => user2.networth - user1.networth);

    const rankingRewards = generateRankingRewards({
      totalPlayers: allUsers.length,
      rankPrizePool: activeSeason.rankPrizePool,
      prizePoolConfig: activeSeason?.prizePoolConfig,
    });

    const totalSqrtReputation = allUsers.reduce((sum, user) => sum + Math.floor(Math.sqrt(user.networth)), 0);
    return allUsers.map((user, index) => {
      return {
        ...user,
        rank: index + 1,
        rankReward: calculateRankReward(activeSeason.rankPrizePool, rankingRewards, index),
        reputationReward:
          (Math.floor(Math.sqrt(user.networth)) / totalSqrtReputation) * activeSeason.reputationPrizePool,
      };
    });
  }, [
    user,
    activeSeason?.rankPrizePool,
    activeSeason?.reputationPrizePool,
    assets?.networth,
    activeSeason?.prizePoolConfig,
  ]);

  const setupSimulatorGameListener = (game) => {
    setGameRef(game);

    game.events.on('simulator-end', () => {
      console.log('simulator-end');
      completeTutorial()
        .then(() => console.log('completed tutorial'))
        .catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });
      setGameRef(null);
    });

    game.events.on('simulator-request-ranking-rewards', () => {
      game.events.emit('simulator-update-ranking-rewards', { prizePoolConfig: activeSeason?.prizePoolConfig });
    });

    game.events.on('simulator-request-balances', () => {
      game.events.emit('simulator-update-balances', { ...balances, ETHBalance: user?.ETHBalance || 0 });
    });

    game.events.on('simulator-request-xtoken-balance', () => {
      game.events.emit('simulator-update-xtoken-balance', { balance: balances.xTokenBalance });
    });

    game.events.on('simulator-request-machines', () => {
      game.events.emit('simulator-update-machines', {
        numberOfMachines: assets.numberOfMachines,
        networth: assets.networth,
        balance: user?.ETHBalance || 0,
        level: 0,
        dailyReward: activeSeason?.machine?.dailyReward,
        earningRateIncrementPerLevel: activeSeason?.machine?.earningRateIncrementPerLevel,
        building: { level: 0, machineCapacity: activeSeason?.building?.initMachineCapacity },
        basePrice: activeSeason?.machine.basePrice || 0,
        basePriceWhitelist: activeSeason?.machine.basePrice || 0,
        maxPerBatch: activeSeason?.machine.maxPerBatch,
        dailyReward: activeSeason?.machine.dailyReward || 0,
        reservePool: activeSeason?.reservePool || 0,
        reservePoolReward: activeSeason?.reservePoolReward || 0,
        networthIncrease: activeSeason?.machine.networth,
        tokenPrice: market?.tokenPrice || 0,
        targetDailyPurchase: activeSeason?.machine.targetDailyPurchase,
        targetPrice: activeSeason?.machine.targetPrice,
        salesLastPeriod: 0,
      });
    });

    game.events.on('simulator-request-workers', () => {
      game.events.emit('simulator-update-workers', {
        numberOfWorkers: assets.numberOfWorkers,
        networth: assets.networth,
        balance: balances.tokenBalance,
        sold: assets.numberOfWorkers,
        basePrice: activeSeason?.worker.basePrice,
        maxPerBatch: activeSeason?.worker.maxPerBatch,
        targetDailyPurchase: activeSeason?.worker.targetDailyPurchase,
        targetPrice: activeSeason?.worker.targetPrice,
        salesLastPeriod: 0,
        dailyReward: activeSeason?.worker.dailyReward,
        networthIncrease: activeSeason?.worker.networth,
      });
    });

    game.events.on('simulator-request-buildings', () => {
      game.events.emit('simulator-update-buildings', {
        numberOfBuildings: assets.numberOfBuildings,
        networth: assets.networth,
        numberOfMachines: assets.numberOfMachines,
        building: { level: 0, machineCapacity: activeSeason?.building?.initMachineCapacity },
        machineCapacityIncrementPerLevel: activeSeason?.building?.machineCapacityIncrementPerLevel,
        balance: balances.tokenBalance,
        sold: assets.numberOfBuildings,
        basePrice: activeSeason?.building.basePrice,
        maxPerBatch: activeSeason?.building.maxPerBatch,
        targetDailyPurchase: activeSeason?.building.targetDailyPurchase,
        targetPrice: activeSeason?.building.targetPrice,
        salesLastPeriod: 0,
        networthIncrease: activeSeason?.building.networth,
      });
    });

    // reset assets & giveaway 1 goon
    game.events.on('simulator-reset-assets', () => {
      setAssets({
        numberOfMachines: 0,
        numberOfWorkers: 0,
        numberOfBuildings: 0,
        networth: 0,
        warDeployment: {
          numberOfMachinesToEarn: 0,
          numberOfMachinesToAttack: 0,
          numberOfMachinesToDefend: 0,
          attackUserId: null,
          acttackUser: null,
        },
      });
    });

    game.events.on('simulator-claim-completed', async ({ amount }) => {
      setBalances((prevState) => ({
        ...prevState,
        tokenBalance: prevState.tokenBalance + amount,
      }));
    });

    game.events.on('simulator-buy-gangster', async ({ quantity }) => {
      await delay(1000);
      setAssets((prevAssets) => ({
        ...prevAssets,
        numberOfMachines: prevAssets.numberOfMachines + quantity,
        networth: prevAssets.networth + quantity * activeSeason.machine.networth,
      }));
      game.events.emit('simulator-buy-gangster-completed', { txnHash: '', amount: quantity });
    });

    game.events.on('simulator-buy-goon', async ({ quantity, delayDuration = 1000, hideSuccessPopup = false }) => {
      await delay(delayDuration);
      setAssets((prevAssets) => ({
        ...prevAssets,
        numberOfWorkers: prevAssets.numberOfWorkers + quantity,
        networth: prevAssets.networth + quantity * activeSeason.worker.networth,
      }));
      if (!hideSuccessPopup) game.events.emit('simulator-buy-goon-completed', { txnHash: '', amount: quantity });
    });

    game.events.on('simulator-upgrade-safehouse', async ({ quantity }) => {
      await delay(1000);
      setAssets((prevAssets) => ({
        ...prevAssets,
        numberOfBuildings: prevAssets.numberOfBuildings + quantity,
        networth: prevAssets.networth + quantity * activeSeason.building.networth,
      }));
      game.events.emit('simulator-upgrade-safehouse-completed', { txnHash: '', amount: quantity });
    });

    game.events.on('simulator-request-workers-machines', () => {
      game.events.emit('simulator-update-workers-machines', {
        numberOfWorkers: assets.numberOfWorkers,
        numberOfMachines: assets.numberOfMachines,
      });
    });

    game.events.on('simulator-request-networth', () => {
      game.events.emit('simulator-update-networth', {
        networth: assets.networth,
        level: calculateHouseLevel(activeSeason?.houseLevels || [], assets.networth),
      });
    });

    game.events.on('simulator-open-leaderboard-modal', () => {
      setLeaderboardModalOpen(true);
      const { name, endTimeConfig, rankPrizePool, reputationPrizePool } = activeSeason || {};
      game.events.emit('simulator-update-season', {
        name,
        endTimeConfig,
        prizePool: rankPrizePool + reputationPrizePool,
        isEnded,
      });
    });

    game.events.on('simulator-close-leaderboard-modal', () => {
      setLeaderboardModalOpen(false);
    });

    game.events.on('simulator-request-rank', () => {
      const index = leaderboardData.findIndex((item) => item.isUser);
      if (index > -1) {
        const thisUser = leaderboardData[index];
        game.events.emit('simulator-update-rank', {
          rank: index + 1,
          reward: thisUser.rankReward + thisUser.reputationReward,
        });
      }
    });

    game.events.on('simulator-request-game-play', () => {
      game.events.emit('simulator-update-game-play', {
        numberOfMachines: assets.numberOfMachines,
        numberOfWorkers: assets.numberOfWorkers,
        numberOfBuildings: assets.numberOfBuildings,
        ...assets.warDeployment,
        ...activeSeason?.warConfig,
      });
    });

    game.events.on('simulator-request-u-point-reward', () => {
      game.events.emit('simulator-update-u-point-reward', { uPointReward: 0 });
    });

    game.events.on('simulator-request-twitter-share-template', () => {
      game.events.emit('simulator-update-twitter-share-template', {
        template: templates.twitterShareReferralCode,
        referralCode: user?.referralCode || '',
      });
    });

    game.events.on('simulator-request-next-war-time', () => {
      getNextWarSnapshotUnixTime()
        .then((res) => {
          game.events.emit('simulator-update-next-war-time', { time: res.data.time });
        })
        .catch((err) => {
          console.error(err);
          Sentry.captureException(err);
        });
    });

    game.events.on('simulator-request-war-die-chance', () => {
      game.events.emit('simulator-update-war-die-chance', { dieChance: activeSeason?.warConfig?.dieChance });
    });

    game.events.on('simulator-request-war-status', () => {
      game.events.emit('simulator-update-war-status', { war: false });
    });

    game.events.on('simulator-update-war-machines', () => {
      game.events.emit('simulator-update-war-machines-completed', {});
    });

    game.events.on('simulator-refresh-eth-balance', () => {
      game.events.emit('simulator-refresh-eth-balance-completed');
    });

    game.events.on('simulator-request-eth-balance', async () => {
      game.events.emit('simulator-update-eth-balance', { address: user.address, ETHBalance: user?.ETHBalance || 0 });
    });

    game.events.on('simulator-request-increment-time', () => {
      game.events.emit('simulator-update-increment-time', {
        timeIncrementInSeconds: activeSeason?.endTimeConfig?.timeIncrementInSeconds,
      });
    });

    game.events.on('simulator-request-decrement-time', () => {
      game.events.emit('simulator-update-decrement-time', {
        timeDecrementInSeconds: activeSeason?.endTimeConfig?.timeDecrementInSeconds,
      });
    });
  };

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-eth-balance', {
        address: user?.address || '',
        ETHBalance: user?.ETHBalance || 0,
      });
    }
  }, [user?.ETHBalance]);

  useEffect(() => {
    if (gameRef) {
      const index = leaderboardData.findIndex((item) => item.isUser);
      if (index > -1) {
        const thisUser = leaderboardData[index];
        gameRef.events.emit('simulator-update-rank', {
          rank: index + 1,
          reward: thisUser.rankReward + thisUser.reputationReward,
        });
      }
    }
  }, [leaderboardData]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-balances', { ...balances, ETHBalance: user?.ETHBalance || 0 });
      gameRef.events.emit('simulator-xbalance-token', { balance: balances.xTokenBalance });
    }
  }, [balances, user?.ETHBalance]);

  useEffect(() => {
    console.log('Change ', { activeSeason, gameRef });
    if (gameRef) {
      gameRef.events.emit('simulator-update-networth', {
        networth: assets.networth,
        level: calculateHouseLevel(activeSeason?.houseLevels || [], assets.networth),
      });
    }
  }, [assets?.networth]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-machines', {
        numberOfMachines: assets.numberOfMachines,
        networth: assets.networth,
        balance: user?.ETHBalance || 0,
        level: 0,
        dailyReward: activeSeason?.machine?.dailyReward,
        earningRateIncrementPerLevel: activeSeason?.machine?.earningRateIncrementPerLevel,
        building: { level: 0, machineCapacity: activeSeason?.building?.initMachineCapacity },
        basePrice: activeSeason?.machine.basePrice || 0,
        basePriceWhitelist: activeSeason?.machine.basePrice || 0,
        maxPerBatch: activeSeason?.machine.maxPerBatch || 0,
        dailyReward: activeSeason?.machine.dailyReward || 0,
        reservePool: 0,
        reservePoolReward: activeSeason?.reservePoolReward || 0,
        networthIncrease: activeSeason?.machine.networth,
        tokenPrice: market?.tokenPrice || 0,
        targetDailyPurchase: activeSeason?.machine.targetDailyPurchase,
        targetPrice: activeSeason?.machine.targetPrice,
        salesLastPeriod: 0,
      });
    }
  }, [assets, user?.ETHBalance, activeSeason, market]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-workers-machines', {
        numberOfWorkers: assets.numberOfWorkers,
        numberOfMachines: assets.numberOfMachines,
      });
    }
  }, [assets]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-workers', {
        numberOfWorkers: assets.numberOfWorkers,
        networth: assets.networth,
        balance: balances.tokenBalance,
        sold: assets.numberOfWorkers,
        basePrice: activeSeason?.worker.basePrice,
        maxPerBatch: activeSeason?.worker.maxPerBatch,
        targetDailyPurchase: activeSeason?.worker.targetDailyPurchase,
        targetPrice: activeSeason?.worker.targetPrice,
        salesLastPeriod: 0,
        dailyReward: activeSeason?.worker.dailyReward,
        networthIncrease: activeSeason?.worker.networth,
      });
    }
  }, [assets, balances, activeSeason]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-deposit-code', user?.code);
    }
  }, [user?.code]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-buildings', {
        numberOfBuildings: assets.numberOfBuildings,
        networth: assets.networth,
        numberOfMachines: assets.numberOfMachines,
        building: { level: 0, machineCapacity: activeSeason?.building?.initMachineCapacity },
        machineCapacityIncrementPerLevel: activeSeason?.building?.machineCapacityIncrementPerLevel,
        balance: balances.tokenBalance,
        sold: assets.numberOfBuildings,
        basePrice: activeSeason?.building.basePrice,
        maxPerBatch: activeSeason?.building.maxPerBatch,
        targetDailyPurchase: activeSeason?.building.targetDailyPurchase,
        targetPrice: activeSeason?.building.targetPrice,
        salesLastPeriod: 0,
        networthIncrease: activeSeason?.building.networth,
      });
    }
  }, [assets, balances, activeSeason]);

  useEffect(() => {
    if (isLeaderboardModalOpen) {
      const { name, endTimeConfig, rankPrizePool, reputationPrizePool } = activeSeason || {};
      gameRef &&
        gameRef.events.emit('simulator-update-season', {
          name,
          endTimeConfig,
          prizePool: rankPrizePool + reputationPrizePool,
          isEnded,
        });
    }
  }, [
    isLeaderboardModalOpen,
    activeSeason?.name,
    activeSeason?.endTimeConfig,
    activeSeason?.rankPrizePool,
    activeSeason?.reputationPrizePool,
    activeSeason?.machine?.networth,
    isEnded,
  ]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-season-countdown', countdownString);
    }
  }, [countdownString]);

  useEffect(() => {
    if (isLeaderboardModalOpen && gameRef) {
      gameRef.events.emit('simulator-update-leaderboard', leaderboardData || []);
    }
  }, [isLeaderboardModalOpen, leaderboardData]);

  useEffect(() => {
    if (isLeaderboardModalOpen && gameRef)
      gameRef.events.emit('simulator-update-ranking-rewards', { prizePoolConfig: activeSeason?.prizePoolConfig });
  }, [isLeaderboardModalOpen, activeSeason?.prizePoolConfig]);

  useEffect(() => {
    if (gameRef && activeSeason?.endTimeConfig?.timeIncrementInSeconds) {
      gameRef.events.emit('simulator-update-increment-time', {
        timeIncrementInSeconds: activeSeason?.endTimeConfig?.timeIncrementInSeconds,
      });
    }
  }, [activeSeason?.endTimeConfig?.timeIncrementInSeconds]);

  useEffect(() => {
    if (gameRef)
      gameRef.events.emit('simulator-update-twitter-share-template', {
        template: templates.twitterShareReferralCode,
        referralCode: user?.referralCode || '',
      });
  }, [templates.twitterShareReferralCode, user?.referralCode]);

  return { setupSimulatorGameListener };
};

export default useSimulatorGameListener;

// helpers
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateRankReward = (rankrizePool, rankingRewards, rankIndex) => {
  const totalPercentages = rankingRewards.reduce(
    (total, rankingReward) => total + rankingReward.share * (rankingReward.rankEnd - rankingReward.rankStart + 1),
    0
  );
  if (totalPercentages >= 100) throw new Error('Invalid ranking reward');

  const rank = rankIndex + 1;
  const rankingReward = rankingRewards.find((item) => item.rankStart <= rank && rank <= item.rankEnd);
  if (!rankingReward) return 0;

  return rankrizePool * rankingReward.share;
};

const mockUsers = Array.from({ length: 20 }, () => ({
  avatarURL: faker.internet.avatar(),
  id: faker.string.uuid(),
  networth: faker.number.int({ min: 0, max: 1000 }),
  userId: faker.string.uuid(),
  username: faker.internet.userName(),
  active: true,
}));

const generateRankingRewards = ({ totalPlayers, rankPrizePool, prizePoolConfig }) => {
  const {
    rewardScalingRatio,
    higherRanksCutoffPercent,
    lowerRanksCutoffPercent,
    minRewardHigherRanks,
    minRewardLowerRanks,
  } = prizePoolConfig;
  const totalPaidPlayersCount = Math.round(lowerRanksCutoffPercent * totalPlayers);
  const higherRanksPlayersCount = Math.round(higherRanksCutoffPercent * totalPlayers);
  const lowerRanksPlayersCount = totalPaidPlayersCount - higherRanksPlayersCount;
  const minRewardPercentHigherRanks = minRewardHigherRanks / rankPrizePool;
  const minRewardPercentLowerRanks = minRewardLowerRanks / rankPrizePool;

  const remainingRankPoolPercent =
    1 - (minRewardPercentHigherRanks * higherRanksPlayersCount + minRewardPercentLowerRanks * lowerRanksPlayersCount);

  let totalExtraRewardWeight = 0;
  let rankingRewards = [];
  for (let rank = 1; rank <= totalPaidPlayersCount; rank++) {
    const extraRewardWeight = Math.pow(rewardScalingRatio, totalPaidPlayersCount - rank);
    totalExtraRewardWeight += extraRewardWeight;

    rankingRewards.push({ rankStart: rank, rankEnd: rank, extraRewardWeight });
  }

  for (let player of rankingRewards) {
    const minRewardPercent =
      player.rankStart <= higherRanksPlayersCount ? minRewardPercentHigherRanks : minRewardPercentLowerRanks;
    const extraRewardPercent = (player.extraRewardWeight / totalExtraRewardWeight) * remainingRankPoolPercent;

    player.share = minRewardPercent + extraRewardPercent;
    player.prizeValue = rankPrizePool * player.share;
    delete player.extraRewardWeight;
  }

  return rankingRewards;
};
