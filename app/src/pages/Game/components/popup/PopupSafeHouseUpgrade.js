import Phaser from 'phaser';

import Popup from './Popup';
import UpgradeAssetButton from '../button/UpgradeAssetButton';
import PopupProcessing from './PopupProcessing';
import PopupConfirm, { icon1Gap } from './PopupConfirm';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import {
  estimateNumberOfBuildingCanBuy,
  calculateNextBuildingBuyPriceBatch,
  calculateUpgradeBuildingPrice,
} from '../../../../utils/formulas';
import { customFormat, formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const DEFAULT_QUANTITY = 1;
const INTERVAL = 100;
const largeBlackExtraBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
};
const smallBrownBold = { fontSize: fontSizes.small, color: colors.brown, fontFamily: fontFamilies.bold };

class PopupSafeHouseUpgrade extends Popup {
  gas = 0;
  numberOfBuildings = 0;
  building = {};
  networth = 0;
  networthIncrease = 0;
  balance = 0;
  xTokenBalance = 0;
  basePrice = 0;
  maxPerBatch = 10;
  targetDailyPurchase = 1;
  targetPrice = 0;
  salesLastPeriod = 0;
  quantity = DEFAULT_QUANTITY;
  onCompleted;
  isSimulator = false;
  purchaseToken = 'GREED'; // 'xGREED' || 'GREED'

  constructor(scene, { isSimulator, onCompleted, ...configs } = {}) {
    super(scene, 'popup-safehouse-upgrade', { title: 'Upgrade Safehouse', ...configs });
    this.scene = scene;
    const events = {
      completed: isSimulator ? 'simulator-upgrade-safehouse-completed' : 'upgrade-safehouse-completed',
      upgradeHouse: isSimulator ? 'simulator-upgrade-safehouse' : 'upgrade-safehouse',
      gameEnded: isSimulator ? 'simulator-game-ended' : 'game-ended',
      updateBuildings: isSimulator ? 'simulator-update-buildings' : 'update-buildings',
      requestBuildings: isSimulator ? 'simulator-request-buildings' : 'request-buildings',
      enableSalesTracking: isSimulator ? 'simulator-enable-building-sales-tracking' : 'enable-building-sales-tracking',
      disableSalesTracking: isSimulator
        ? 'simulator-disable-building-sales-tracking'
        : 'disable-building-sales-tracking',
      updateXTokenBalance: isSimulator ? 'simulator-update-xtoken-balance' : 'update-xtoken-balance',
      requestDecrementTime: isSimulator ? 'simulator-request-decrement-time' : 'request-decrement-time',
      updateDecrementTime: isSimulator ? 'simulator-update-decrement-time' : 'update-decrement-time',
      upgradeSafehouses: isSimulator ? 'simulator-upgrade-safehouses-level' : 'upgrade-safehouses-level',
      upgradeCompleted: isSimulator
        ? 'simulator-upgrade-safehouses-level-completed'
        : 'upgrade-safehouses-level-completed',
    };
    this.events = events;
    this.onCompleted = onCompleted;
    this.isSimulator = isSimulator;
    const networthY = this.popup.y - 55;
    const checkBoxY = this.popup.y + 510;
    const leftCheckBoxX = this.popup.x - this.popup.width / 2 + 180;
    const rightCheckBoxX = this.popup.x + 70;
    const availableY = checkBoxY + 50;
    const counterY = this.popup.y + this.popup.height / 2 - 260;
    const minusBtnX = this.popup.x - this.popup.width / 2 + 320;

    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'house',
      completedEvent: events.completed,
      completedIcon: 'icon-safehouse-upgrade-done',
      failedIcon: 'icon-safehouse-upgrade-fail',
      description: `Buying Safehouse.\nPlease, wait`,
      onCompleted,
    });
    scene.add.existing(this.popupBuyProcessing);
    this.popupConfirm = new PopupConfirm(scene, this, {
      title: 'Buy Safehouse',
      action: 'buy',
      icon1: 'icon-safehouse-medium',
      icon2: 'icon-coin-small',
      onConfirm: () => {
        if (!this.quantity) return;
        this.popupBuyProcessing.initLoading(`Buying Safehouse.\nPlease, wait`);

        scene.game.events.emit(events.upgradeHouse, { quantity: this.quantity, token: this.purchaseToken });
      },
    });
    scene.add.existing(this.popupConfirm);
    this.popupConfirm.updateTextLeft(`1${icon1Gap}unit`);

    this.xgangUnchecked = scene.add.image(leftCheckBoxX, checkBoxY, 'icon-checkbox-false');
    this.xgangChecked = scene.add.image(leftCheckBoxX, checkBoxY, 'icon-checkbox-true').setVisible(false);
    this.tokenUnchecked = scene.add.image(rightCheckBoxX, checkBoxY, 'icon-checkbox-false');
    this.tokenChecked = scene.add.image(rightCheckBoxX, checkBoxY, 'icon-checkbox-true');
    this.add(this.xgangUnchecked);
    this.add(this.xgangChecked);
    this.add(this.tokenUnchecked);
    this.add(this.tokenChecked);

    this.xgangUnchecked.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.xgangChecked.setVisible(true);
      this.tokenChecked.setVisible(false);
      this.purchaseToken = 'xGREED';
      this.popupConfirm.updateIconRight('icon-xgang-small');
      if (this.coin) this.coin.setTexture('icon-xgang-small');
      this.updateValues();
    });
    this.tokenUnchecked.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.xgangChecked.setVisible(false);
      this.tokenChecked.setVisible(true);
      this.purchaseToken = 'GREED';
      this.popupConfirm.updateIconRight('icon-coin-small');
      if (this.coin) this.coin.setTexture('icon-coin-small');
      this.updateValues();
    });

    this.xgangAvailable = scene.add.text(leftCheckBoxX + 140, availableY, 'Available: 0', smallBrownBold);
    this.tokenAvailable = scene.add.text(rightCheckBoxX + 140, availableY, 'Available: 0', smallBrownBold);
    this.add(this.xgangAvailable);
    this.add(this.tokenAvailable);

    this.upgradePopupBuyProcessing = new PopupProcessing(scene, {
      sound: 'gangster',
      completedEvent: events.upgradeCompleted,
      completedIcon: 'icon-safehouse-upgraded-level',
      failedIcon: 'icon-safehouse-upgrade-fail',
      description: '',
      onCompleted,
    });
    scene.add.existing(this.upgradePopupBuyProcessing);

    this.buyBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (isSimulator) {
          this.quantity = 1;
          this.popupBuyProcessing.initLoading(`Buying Safehouse.\nPlease, wait`);
          this.onCompleted = null;
          this.close();

          scene.game.events.emit(events.upgradeHouse, {
            quantity: this.quantity,
            token: this.purchaseToken,
          });
        } else {
          this.close();
          this.popupConfirm.open();
        }
      },
      'Buy',
      { fontSize: '82px', sound: 'buy' }
    );
    this.add(this.buyBtn);

    this.upgradePriceButton = new UpgradeAssetButton(scene, {
      x: this.popup.x + 250,
      y: this.popup.y - 415,
      value: 0,
      onClick: () => {
        if (isSimulator) return;
        this.upgradePopupBuyProcessing.initLoading(
          `Upgrading safehouses to level ${this.building?.level + 1}.\nPlease, wait`
        );
        this.onCompleted = null;
        this.close();

        scene.game.events.emit(events.upgradeSafehouses, {
          amount: this.numberOfBuildings,
          currentLevel: this.building?.level,
        });
      },
    });
    this.add(this.upgradePriceButton);

    this.levelTitle = scene.add
      .text(this.popup.x + 80, this.popup.y - this.popup.height / 2 + 215, 'Safehouses:', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.levelTitle);

    this.safehouseLevelText = scene.add
      .text(this.popup.x + 150, this.popup.y - this.popup.height / 2 + 215, '', {
        fontSize: fontSizes.extraLarge,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.safehouseLevelText);

    this.levelText = scene.add
      .text(this.popup.x - 385, this.popup.y - this.popup.height / 2 + 440, '- LVL', {
        fontSize: '48px',
        fontFamily: fontFamilies.extraBold,
        color: '#B23F05',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.levelText);

    this.currentCapacityText = scene.add
      .text(this.popup.x - 395, this.popup.y - this.popup.height / 2 + 615, '', {
        fontSize: '48px',
        fontFamily: fontFamilies.bold,
        color: '#FFF',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.currentCapacityText);

    this.nextLevelCapacityText = scene.add
      .text(this.popup.x - 155, this.popup.y - this.popup.height / 2 + 615, '', {
        fontSize: '48px',
        fontFamily: fontFamilies.bold,
        color: '#FFF',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.nextLevelCapacityText);

    this.networthText = scene.add.text(this.popup.x + 380, networthY, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, networthY + 80, '+0', {
        fontSize: fontSizes.small,
        color: colors.green,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

    this.gameTimerText = scene.add
      .text(this.popup.x - 130, this.popup.y + 355, 'Game Timer:', {
        fontSize: '52px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.gameTimerText);

    this.clockIcon = scene.add
      .image(this.gameTimerText.x + this.gameTimerText.width / 2 + 20, this.gameTimerText.y, 'icon-clock')
      .setOrigin(0, 0.5);
    this.add(this.clockIcon);

    this.decrementTimeText = scene.add
      .text(this.clockIcon.x + this.clockIcon.width / 2 + 50, this.gameTimerText.y, '', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    this.add(this.decrementTimeText);

    this.minusBtn = new TextButton(
      scene,
      minusBtnX,
      counterY,
      'button-square',
      'button-square-pressed',
      () => {
        if (this.quantity > DEFAULT_QUANTITY) {
          this.quantity--;
          this.updateValues();
        }
      },
      '-',
      {
        disabledImage: 'button-square-disabled',
        fontSize: '82px',
        sound: 'button-1',
        onHold: () => {
          if (this.interval) {
            clearInterval(this.interval);
          }
          this.interval = setInterval(() => {
            if (this.quantity > DEFAULT_QUANTITY) {
              this.quantity--;
              this.updateValues();
            }
          }, INTERVAL);
        },
        onRelease: () => {
          if (this.interval) {
            clearInterval(this.interval);
          }
        },
      }
    );
    this.minusBtn.setDisabledState(isSimulator);
    this.add(this.minusBtn);

    this.plusBtn = new TextButton(
      scene,
      minusBtnX + 350,
      counterY,
      'button-square',
      'button-square-pressed',
      () => {
        if (this.quantity < this.maxPerBatch) {
          this.quantity++;
          this.updateValues();
        }
      },
      '+',
      {
        disabledImage: 'button-square-disabled',
        fontSize: '82px',
        sound: 'button-1',
        onHold: () => {
          if (this.interval) {
            clearInterval(this.interval);
          }
          this.interval = setInterval(() => {
            if (this.quantity < this.maxPerBatch) {
              this.quantity++;
              this.updateValues();
            }
          }, INTERVAL);
        },
        onRelease: () => {
          if (this.interval) {
            clearInterval(this.interval);
          }
        },
      }
    );
    this.plusBtn.setDisabledState(isSimulator);
    this.add(this.plusBtn);

    this.quantityText = scene.add.text(minusBtnX + 170, counterY, this.quantity, {
      fontSize: '60px',
      fontFamily: fontFamilies.extraBold,
      color: '#7C2828',
    });
    this.quantityText.setOrigin(0.5, 0.5);
    this.add(this.quantityText);

    const priceTextX = this.popup.x + 160;
    this.priceText = scene.add.text(priceTextX, counterY, '0', largeBlackExtraBold).setOrigin(0, 0.5);
    this.add(this.priceText);
    this.gasPrice = scene.add
      .text(priceTextX, counterY, '+0 ETH (gas)', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(!isSimulator);
    this.add(this.gasPrice);
    this.insufficientBalance = scene.add
      .text(priceTextX, counterY + 48, 'Insufficient $GREED', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(false);
    this.add(this.insufficientBalance);

    this.coin = scene.add
      .image(this.priceText.x + this.priceText.width + 10, counterY, 'icon-coin-small')
      .setOrigin(0, 0.5)
      .setVisible(!isSimulator);
    this.add(this.coin);

    if (!isSimulator) {
      this.infoButton = new Button(
        scene,
        this.coin.x + this.coin.width + 30,
        counterY - 40,
        'button-info',
        'button-info-pressed',
        () => {
          if (isSimulator) return;
          this.close();
          this.scene.popupSafehousePrice?.open();
        },
        { sound: 'open' }
      );
      this.add(this.infoButton);
    }

    scene.game.events.on(events.completed, () => {
      this.quantity = DEFAULT_QUANTITY;
      this.updateValues();
    });

    scene.game.events.on(events.gameEnded, () => {
      this.buyBtn.setDisabledState(true);
    });
    scene.game.events.on('update-gas-upgrade-safehouse', ({ gas }) => {
      if (isNaN(gas)) return;

      this.gas = gas;
      this.updateValues();
    });

    scene.game.events.on(events.updateXTokenBalance, ({ balance }) => {
      this.xTokenBalance = balance;
      this.xgangAvailable.text = `Available: ${customFormat(balance || 0, 1)}`;
      if (this.purchaseToken === 'xGREED') this.updateValues();
    });

    scene.game.events.on(
      events.updateBuildings,
      ({
        numberOfBuildings,
        numberOfMachines,
        building,
        machineCapacityIncrementPerLevel,
        networth,
        balance,
        basePrice,
        maxPerBatch,
        targetDailyPurchase,
        targetPrice,
        salesLastPeriod,
        networthIncrease,
      }) => {
        this.balance = balance;
        this.tokenAvailable.text = `Available: ${customFormat(balance || 0, 1)}`;
        this.basePrice = basePrice;
        this.maxPerBatch = maxPerBatch;
        this.targetDailyPurchase = targetDailyPurchase;
        this.targetPrice = targetPrice;
        this.salesLastPeriod = salesLastPeriod;
        this.numberOfBuildings = numberOfBuildings;
        this.building = building;
        this.networth = networth;
        this.networthIncrease = networthIncrease;

        this.updateUpgradePriceButton();

        this.safehouseLevelText.text = `${building.level?.toLocaleString()}`;
        this.levelTitle.x = this.popup.x + 80 - this.safehouseLevelText.width / 2 + 5;
        this.levelText.text = `${building?.level} LVL`;

        this.safehouseLevelText.x =
          this.levelTitle.x + this.levelTitle.width / 2 + this.safehouseLevelText.width / 2 + 10;
        this.currentCapacityText.text = `${numberOfMachines}/${building.machineCapacity}`;
        this.nextLevelCapacityText.text = `${building.machineCapacity + machineCapacityIncrementPerLevel}`;

        this.networthText.text = `${networth.toLocaleString()}`;
        this.updateValues();
      }
    );

    scene.game.events.on(events.updateDecrementTime, ({ timeDecrementInSeconds }) => {
      this.decrementTimeText.text = `-${timeDecrementInSeconds}s`;
    });

    scene.game.events.on(events.updateXTokenBalance, (data) => {
      this.xTokenBalance = data.balance;
      this.updateUpgradePriceButton();
    });

    scene.game.events.emit(events.requestBuildings);
    scene.game.events.emit(events.requestDecrementTime);
    scene.game.events.emit('request-gas-upgrade-safehouse');
  }

  updateUpgradePriceButton() {
    const price = calculateUpgradeBuildingPrice(this.building?.level);
    this.upgradePriceButton.updateValue(price);

    if (price > this.xTokenBalance) {
      this.upgradePriceButton.setDisabledState(true);
    } else {
      this.upgradePriceButton.setDisabledState(false);
    }
  }

  onOpen() {
    this.scene.game.events.emit(this.events.enableSalesTracking);
    if (this.isSimulator) return;
    this.scene.game.events.emit('request-xtoken-balance');
    this.scene.game.events.emit('request-house-price', { timeMode: this.scene.popupSafehousePrice.timeMode });
  }

  cleanup() {
    this.onCompleted?.();
    this.scene.game.events.emit(this.events.disableSalesTracking);
  }

  updateValues() {
    if (this.isSimulator) {
      this.priceText.text = 'FREE';
      this.priceText.x = width / 2 + 200;
      return;
    }
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;

    this.estimatedMaxPurchase = estimateNumberOfBuildingCanBuy(
      this.balance,
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.maxPerBatch
    );
    this.xTokenMaxPurchase = estimateNumberOfBuildingCanBuy(
      this.xTokenBalance,
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.maxPerBatch
    );
    const estimatedPrice = calculateNextBuildingBuyPriceBatch(
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.quantity
    ).total;

    this.quantityText.text = `${this.quantity}`;
    this.popupConfirm.updateTextLeft(`${this.quantity}${icon1Gap}unit${this.quantity > 1 ? 's' : ''}`);
    this.popupConfirm.updateTextRight(formatter.format(estimatedPrice.toPrecision(3)));
    this.priceText.text = `${customFormat(estimatedPrice, 1)}`;
    const formattedGas = customFormat(this.gas, 4) === '0' ? '<0.0001' : customFormat(this.gas, 4);
    this.gasPrice.text = `+${formattedGas} ETH (gas)`;
    this.gasPrice.setVisible(this.purchaseToken === 'GREED');
    this.coin.x = this.priceText.x + this.priceText.width + 10;
    if (this.infoButton) this.infoButton.x = this.coin.x + this.coin.width + 30;

    const maxPurchase = this.purchaseToken === 'GREED' ? this.estimatedMaxPurchase : this.xTokenMaxPurchase;
    const insufficientBalance = this.quantity > maxPurchase;
    this.insufficientBalance.setVisible(insufficientBalance);
    this.buyBtn.setDisabledState(
      this.scene?.isGameEnded || (!this.scene?.isUserActive && !this.isSimulator) || insufficientBalance
    );
  }
}

export default PopupSafeHouseUpgrade;
