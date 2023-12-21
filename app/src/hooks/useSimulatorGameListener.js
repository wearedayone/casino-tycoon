import { useState, useEffect } from 'react';

import useSystemStore from '../stores/system.store';
import useSeasonCountdown from './useSeasonCountdown';
import { calculateHouseLevel } from '../utils/formulas';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const useSimulatorGameListener = ({ leaderboardData }) => {
  const activeSeason = useSystemStore((state) => state.activeSeason);
  // console.log(activeSeason);
  // const [activeSeason, setActiveSeason] = useState({

  // })
  const market = useSystemStore((state) => state.market);
  const [gameRef, setGameRef] = useState(null);
  const [balances, setBalances] = useState({ dailyMoney: 10000, ETHBalance: 100000, tokenBalance: 100000 });
  const [assets, setAssets] = useState({
    numberOfMachines: 1,
    numberOfWorkers: 1,
    numberOfBuildings: 0,
    networth: 0,
  });
  const [isLeaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const { isEnded, countdownString } = useSeasonCountdown({ open: isLeaderboardModalOpen });

  const setupSimulatorGameListener = (game) => {
    setGameRef(game);

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
        priceStep: activeSeason?.worker.priceStep,
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
        priceStep: activeSeason?.building.priceStep,
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
      const { name, timeStepInHours, prizePool } = activeSeason || {};
      game.events.emit('simulator-update-season', {
        name,
        timeStepInHours,
        prizePool,
        isEnded,
      });
    });

    game.events.on('simulator-close-leaderboard-modal', () => {
      setLeaderboardModalOpen(false);
    });
  };

  console.log(assets);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-balances', balances);
    }
  }, [balances]);

  useEffect(() => {
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
        priceStep: activeSeason?.worker.priceStep,
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
        priceStep: activeSeason?.building.priceStep,
        networthIncrease: activeSeason?.building.networth,
      });
    }
  }, [assets, balances, activeSeason]);

  useEffect(() => {
    if (isLeaderboardModalOpen) {
      const { name, timeStepInHours, prizePool } = activeSeason || {};
      gameRef &&
        gameRef.events.emit('simulator-update-season', {
          name,
          timeStepInHours,
          prizePool,
          isEnded,
        });
    }
  }, [
    isLeaderboardModalOpen,
    activeSeason?.name,
    activeSeason?.timeStepInHours,
    activeSeason?.prizePool,
    activeSeason?.machine?.networth,
    isEnded,
  ]);

  useEffect(() => {
    if (gameRef) {
      gameRef.events.emit('simulator-update-season-countdown', countdownString);
    }
  }, [countdownString]);

  useEffect(() => {
    console.log({ isLeaderboardModalOpen, gameRef, leaderboardData });
    if (isLeaderboardModalOpen && gameRef) {
      gameRef.events.emit('simulator-update-leaderboard', leaderboardData?.data || []);
    }
  }, [isLeaderboardModalOpen, leaderboardData?.data]);

  useEffect(() => {
    if (isLeaderboardModalOpen && gameRef)
      gameRef.events.emit('simulator-update-ranking-rewards', activeSeason?.rankingRewards || []);
  }, [isLeaderboardModalOpen, activeSeason?.rankingRewards]);

  return { setupSimulatorGameListener };
};

export default useSimulatorGameListener;
