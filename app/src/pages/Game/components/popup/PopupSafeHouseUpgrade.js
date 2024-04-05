import Phaser from 'phaser';

import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { estimateNumberOfBuildingCanBuy, calculateNextBuildingBuyPriceBatch } from '../../../../utils/formulas';
import { customFormat } from '../../../../utils/numbers';
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
  networth = 0;
  networthIncrease = 0;
  balance = 0;
  basePrice = 0;
  maxPerBatch = 10;
  targetDailyPurchase = 1;
  targetPrice = 0;
  salesLastPeriod = 0;
  quantity = DEFAULT_QUANTITY;
  onCompleted;
  isSimulator = false;
  purchaseToken = 'FIAT'; // 'xGANG' || 'FIAT'

  constructor(scene, { isSimulator, onCompleted } = {}) {
    super(scene, 'popup-safehouse-upgrade', { title: 'Upgrade Safehouse', noCloseBtn: !!isSimulator });
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
    };
    this.events = events;
    this.onCompleted = onCompleted;
    this.isSimulator = isSimulator;
    const networthY = this.popup.y - 200;
    const checkBoxY = this.popup.y + 390;
    const leftCheckBoxX = this.popup.x - this.popup.width / 2 + 180;
    const rightCheckBoxX = this.popup.x + 70;
    const availableY = checkBoxY + 50;
    const counterY = this.popup.y + this.popup.height / 2 - 250;
    const minusBtnX = this.popup.x - this.popup.width / 2 + 320;

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
      this.purchaseToken = 'xGANG';
      if (this.coin) this.coin.setTexture('icon-xgang-small');
    });
    this.tokenUnchecked.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.xgangChecked.setVisible(false);
      this.tokenChecked.setVisible(true);
      this.purchaseToken = 'FIAT';
      if (this.coin) this.coin.setTexture('icon-coin-small');
    });

    this.xgangAvailable = scene.add.text(leftCheckBoxX + 140, availableY, 'Available: 0', smallBrownBold);
    this.tokenAvailable = scene.add.text(rightCheckBoxX + 140, availableY, 'Available: 0', smallBrownBold);
    this.add(this.xgangAvailable);
    this.add(this.tokenAvailable);

    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'house',
      completedEvent: events.completed,
      completedIcon: 'icon-safehouse-upgrade-done',
      failedIcon: 'icon-safehouse-upgrade-fail',
      description: `Upgrading Safehouse.\nPlease, wait`,
      onCompleted,
    });
    scene.add.existing(this.popupBuyProcessing);

    this.upgradeBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (!this.quantity) return;
        this.popupBuyProcessing.initLoading(`Upgrading Safehouse.\nPlease, wait`);
        this.onCompleted = null;
        this.close();

        scene.game.events.emit(events.upgradeHouse, { quantity: this.quantity });
      },
      'Upgrade',
      { fontSize: '82px', sound: 'buy' }
    );
    this.add(this.upgradeBtn);

    this.numberOfBuildingsText = scene.add.text(this.popup.x + 150, this.popup.y - this.popup.height / 2 + 170, '0', {
      fontSize: fontSizes.extraLarge,
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfBuildingsText);

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
      .text(priceTextX, counterY + 48, 'Insufficient $GANG', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(false);
    this.add(this.insufficientBalance);

    this.coin = scene.add
      .image(this.priceText.x + this.priceText.width + 10, counterY, 'icon-coin-small')
      .setOrigin(0, 0.5);
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
      this.upgradeBtn.setDisabledState(true);
    });
    scene.game.events.on('update-gas-upgrade-safehouse', ({ gas }) => {
      if (isNaN(gas)) return;

      this.gas = gas;
      this.estimatedMaxPurchase = estimateNumberOfBuildingCanBuy(
        this.balance - this.gas,
        this.salesLastPeriod,
        this.targetDailyPurchase,
        this.targetPrice,
        this.basePrice,
        this.maxPerBatch
      );
      this.updateValues();
    });

    scene.game.events.on(
      events.updateBuildings,
      ({
        numberOfBuildings,
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
        this.basePrice = basePrice;
        this.maxPerBatch = maxPerBatch;
        this.targetDailyPurchase = targetDailyPurchase;
        this.targetPrice = targetPrice;
        this.salesLastPeriod = salesLastPeriod;
        this.numberOfBuildings = numberOfBuildings;
        this.networth = networth;
        this.networthIncrease = networthIncrease;

        this.numberOfBuildingsText.text = numberOfBuildings.toLocaleString();
        this.networthText.text = `${networth.toLocaleString()}`;
        this.estimatedMaxPurchase = estimateNumberOfBuildingCanBuy(
          balance - this.gas,
          salesLastPeriod,
          targetDailyPurchase,
          targetPrice,
          basePrice,
          maxPerBatch
        );
        this.updateValues();
      }
    );

    scene.game.events.emit(events.requestBuildings);
    scene.game.events.emit('request-gas-upgrade-safehouse');
  }

  onOpen() {
    this.scene.game.events.emit(this.events.enableSalesTracking);
    if (!this.isSimulator)
      this.scene.game.events.emit('request-house-price', { timeMode: this.scene.popupSafehousePrice.timeMode });
  }

  cleanup() {
    this.onCompleted?.();
    this.scene.game.events.emit(this.events.disableSalesTracking);
  }

  updateValues() {
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;

    const estimatedPrice = calculateNextBuildingBuyPriceBatch(
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.quantity
    ).total;

    this.quantityText.text = `${this.quantity}`;
    this.priceText.text = `${customFormat(estimatedPrice, 1)}`;
    const formattedGas = customFormat(this.gas, 4) === '0' ? '<0.0001' : customFormat(this.gas, 4);
    this.gasPrice.text = `+${formattedGas} ETH (gas)`;
    this.coin.x = this.priceText.x + this.priceText.width + 10;
    if (this.infoButton) this.infoButton.x = this.coin.x + this.coin.width + 30;

    const insufficientBalance = this.quantity > this.estimatedMaxPurchase;
    this.insufficientBalance.setVisible(insufficientBalance);
    this.upgradeBtn.setDisabledState(
      this.scene?.isGameEnded || (!this.scene?.isUserActive && !this.isSimulator) || insufficientBalance
    );
  }
}

export default PopupSafeHouseUpgrade;
