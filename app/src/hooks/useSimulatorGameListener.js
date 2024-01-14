import { useState, useEffect, useMemo } from 'react';
import { faker } from '@faker-js/faker';
import * as Sentry from '@sentry/react';

import useSystemStore from '../stores/system.store';
import useUserStore from '../stores/user.store';
import useSeasonCountdown from './useSeasonCountdown';
import { calculateHouseLevel } from '../utils/formulas';
import { completeTutorial } from '../services/user.service';

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
}));

const useSimulatorGameListener = () => {
  const user = useUserStore((state) => state.profile);
  const activeSeason = useSystemStore((state) => state.activeSeason);
  // console.log(activeSeason);
  // const [activeSeason, setActiveSeason] = useState({

  // })
  const market = useSystemStore((state) => state.market);
  const [gameRef, setGameRef] = useState(null);
  const [balances, setBalances] = useState({ dailyMoney: 10000, ETHBalance: 100000, tokenBalance: 100000 });
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
    if (!user || !activeSeason?.rankingRewards) return [];

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

    const totalReputation = allUsers.reduce((sum, user) => sum + user.networth, 0);
    return allUsers.map((user, index) => {
      return {
        ...user,
        rank: index + 1,
        rankReward: calculateRankReward(activeSeason.rankPrizePool, activeSeason?.rankingRewards, index),
        reputationReward: (user.networth / totalReputation) * activeSeason.reputationPrizePool,
      };
    });
  }, [
    user,
    activeSeason?.rankPrizePool,
    activeSeason?.reputationPrizePool,
    assets?.networth,
    activeSeason?.rankingRewards,
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

    // game.events.on('simulator-request-buy-bonus', () => {
    //   game.events.emit('simulator-update-buy-bonus', {});
    // });

    game.events.on('simulator-request-balances', () => {
      game.events.emit('simulator-update-balances', balances);
    });

    game.events.on('simulator-request-machines', () => {
      game.events.emit('simulator-update-machines', {
        numberOfMachines: assets.numberOfMachines,
        networth: assets.networth,
        balance: balances.ETHBalance,
        basePrice: activeSeason?.machine.basePrice || 0,
        dailyReward: activeSeason?.machine.dailyReward || 0,
        reservePool: activeSeason?.reservePool || 0,
        reservePoolReward: activeSeason?.reservePoolReward || 0,
        networthIncrease: activeSeason?.machine.networth,
        tokenPrice: market?.tokenPrice || 0,
      });
    });

    game.events.on('simulator-request-workers', () => {
      game.events.emit('simulator-update-workers', {
        numberOfWorkers: assets.numberOfWorkers,
        networth: assets.networth,
        balance: balances.tokenBalance,
        sold: assets.numberOfWorkers,
        basePrice: activeSeason?.worker.basePrice,
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
        balance: balances.tokenBalance,
        sold: assets.numberOfBuildings,
        basePrice: activeSeason?.building.basePrice,
        targetDailyPurchase: activeSeason?.building.targetDailyPurchase,
        targetPrice: activeSeason?.building.targetPrice,
        salesLastPeriod: 0,
        networthIncrease: activeSeason?.building.networth,
      });
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

    game.events.on('simulator-buy-goon', async ({ quantity }) => {
      await delay(1000);
      setAssets((prevAssets) => ({
        ...prevAssets,
        numberOfWorkers: prevAssets.numberOfWorkers + quantity,
        networth: prevAssets.networth + quantity * activeSeason.worker.networth,
      }));
      game.events.emit('simulator-buy-goon-completed', { txnHash: '', amount: quantity });
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
      const { name, timeStepInHours, rankPrizePool, reputationPrizePool } = activeSeason || {};
      game.events.emit('simulator-update-season', {
        name,
        timeStepInHours,
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

    game.events.on('simulator-request-next-war-time', () => {
      game.events.emit('simulator-update-next-war-time', { time: Date.now() + 24 * 60 * 60 * 1000 });
    });

    game.events.on('simulator-request-war-die-chance', () => {
      game.events.emit('simulator-update-war-die-chance', { dieChance: activeSeason?.warConfig?.dieChance });
    });

    game.events.on('simulator-request-total-voters', () => {
      game.events.emit('simulator-update-total-voters', { count: leaderboardData.length });
    });

    game.events.on('simulator-request-war-status', () => {
      game.events.emit('simulator-update-war-status', { war: false });
    });

    game.events.on('simulator-update-war-machines', () => {
      game.events.emit('simulator-update-war-machines-completed');
    });

    game.events.on('simulator-refresh-eth-balance', () => {
      game.events.emit('simulator-refresh-eth-balance-completed');
    });

    game.events.on('simulator-request-eth-balance', async () => {
      game.events.emit('simulator-update-eth-balance', { address: user.address, ETHBalance: balances.ETHBalance });
    });
  };

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-eth-balance', { address: user.address, ETHBalance: balances.ETHBalance });
    }
  }, [balances.ETHBalance]);

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
      gameRef.events.emit('simulator-update-balances', balances);
    }
  }, [balances]);

  useEffect(() => {
    console.log('Change ', { activeSeason, gameRef });
    if (gameRef) {
      gameRef.events.emit('simulator-update-networth', {
        networth: assets.networth,
        level: calculateHouseLevel(activeSeason?.houseLevels || [], assets.networth),
      });
    }
  }, [assets?.networth, activeSeason?.houseLevels]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-machines', {
        numberOfMachines: assets.numberOfMachines,
        networth: assets.networth,
        balance: balances.ETHBalance,
        basePrice: activeSeason?.machine.basePrice || 0,
        dailyReward: activeSeason?.machine.dailyReward || 0,
        reservePool: 0,
        reservePoolReward: activeSeason?.reservePoolReward || 0,
        networthIncrease: activeSeason?.machine.networth,
        tokenPrice: market?.tokenPrice || 0,
      });
    }
  }, [assets, balances, activeSeason, market]);

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
      gameRef.events.emit('simulator-update-buildings', {
        numberOfBuildings: assets.numberOfBuildings,
        networth: assets.networth,
        balance: balances.tokenBalance,
        sold: assets.numberOfBuildings,
        basePrice: activeSeason?.building.basePrice,
        targetDailyPurchase: activeSeason?.building.targetDailyPurchase,
        targetPrice: activeSeason?.building.targetPrice,
        salesLastPeriod: 0,
        networthIncrease: activeSeason?.building.networth,
      });
    }
  }, [assets, balances, activeSeason]);

  useEffect(() => {
    if (isLeaderboardModalOpen) {
      const { name, timeStepInHours, rankPrizePool, reputationPrizePool } = activeSeason || {};
      gameRef &&
        gameRef.events.emit('simulator-update-season', {
          name,
          timeStepInHours,
          prizePool: rankPrizePool + reputationPrizePool,
          isEnded,
        });
    }
  }, [
    isLeaderboardModalOpen,
    activeSeason?.name,
    activeSeason?.timeStepInHours,
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
    if (gameRef) {
      gameRef.events.emit('simulator-update-buy-bonus', {
        reservePool: activeSeason?.reservePool || 0,
        reservePoolReward: activeSeason?.reservePoolReward || 0,
      });
    }
  }, [activeSeason?.reservePool, activeSeason?.reservePoolReward]);

  return { setupSimulatorGameListener };
};

export default useSimulatorGameListener;
