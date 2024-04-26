import Phaser from 'phaser';

import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import PopupConfirm, { icon1Gap } from './PopupConfirm';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import UpgradeAssetButton from '../button/UpgradeAssetButton';
import configs from '../../configs/configs';
import { customFormat, formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import {
  calculateUpgradeMachinePrice,
  estimateNumberOfMachineCanBuy,
  calculateNextMachineBuyPriceBatch,
} from '../../../../utils/formulas';

const { width, height } = configs;
const DEFAULT_QUANTITY = 1;
const INTERVAL = 100;
const largeBlackExtraBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
};
const smallGreenBold = { fontSize: fontSizes.small, color: colors.green, fontFamily: fontFamilies.bold };

class PopupBuyGangster extends Popup {
  gas = 0;
  numberOfMachines = 0;
  networth = 0;
  networthIncrease = 0;
  rateIncrease = 0;
  reservePool = 0;
  reservePoolReward = 0;
  balance = 0;
  xTokenBalance = 0;
  basePrice = 0;
  unitPrice = 0;
  whitelistPrice = 0;
  quantity = DEFAULT_QUANTITY;
  maxQuantity = 10;
  isWhitelisted = false;
  whitelistAmountLeft = 0;
  mintFunction = 'mint';
  level = 0;
  building = {};
  targetDailyPurchase = 1;
  targetPrice = 0;
  salesLastPeriod = 0;
  onCompleted;

  constructor(scene, { isSimulator, onCompleted, ...configs } = {}) {
    super(scene, 'popup-buy-gangster', { title: 'Buy Gangsters', ...configs });

    const events = {
      completed: isSimulator ? 'simulator-buy-gangster-completed' : 'buy-gangster-completed',
      buyGangster: isSimulator ? 'simulator-buy-gangster' : 'buy-gangster',
      gameEnded: isSimulator ? 'simulator-game-ended' : 'game-ended',
      updateMachines: isSimulator ? 'simulator-update-machines' : 'update-machines',
      requestMachines: isSimulator ? 'simulator-request-machines' : 'request-machines',
      requestIncrementTime: isSimulator ? 'simulator-request-increment-time' : 'request-increment-time',
      updateIncrementTime: isSimulator ? 'simulator-update-increment-time' : 'update-increment-time',
      upgradeGangsters: isSimulator ? 'simulator-upgrade-gangsters' : 'upgrade-gangsters',
      upgradeCompleted: isSimulator ? 'simulator-upgrade-gangsters-completed' : 'upgrade-gangsters-completed',
      updateXTokenBalance: isSimulator ? 'simulator-update-xtoken-balance' : 'update-xtoken-balance',
      enableSalesTracking: isSimulator ? 'simulator-enable-machine-sales-tracking' : 'enable-machine-sales-tracking',
      disableSalesTracking: isSimulator ? 'simulator-disable-machine-sales-tracking' : 'disable-machine-sales-tracking',
    };
    this.onCompleted = onCompleted;
    this.isSimulator = isSimulator;

    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'gangster',
      completedEvent: events.completed,
      completedIcon: 'icon-gangster-buy-done',
      failedIcon: 'icon-gangster-buy-fail',
      description: '',
      onCompleted,
    });
    scene.add.existing(this.popupBuyProcessing);

    this.upgradePopupBuyProcessing = new PopupProcessing(scene, {
      sound: 'gangster',
      completedEvent: events.upgradeCompleted,
      completedIcon: 'icon-gangster-buy-done',
      failedIcon: 'icon-gangster-buy-fail',
      description: '',
      onCompleted,
    });
    scene.add.existing(this.upgradePopupBuyProcessing);
    this.popupConfirm = new PopupConfirm(scene, this, {
      title: 'Buy Gangsters',
      action: 'buy',
      icon1: 'icon-gangster-medium',
      icon2: 'icon-coin-small',
      onConfirm: () => {
        if (!this.quantity) return;
        this.popupBuyProcessing.initLoading(
          `Hiring ${this.quantity} Gangster${this.quantity > 1 ? 's' : ''}.\nPlease, wait`
        );

        scene.game.events.emit(events.buyGangster, { quantity: this.quantity, mintFunction: this.mintFunction });
      },
    });
    scene.add.existing(this.popupConfirm);
    this.popupConfirm.updateTextLeft(`1${icon1Gap}unit`);

    this.upgradeBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (isSimulator) {
          this.quantity = 1;
          this.popupBuyProcessing.initLoading(
            `Hiring ${this.quantity} Gangster${this.quantity > 1 ? 's' : ''}.\nPlease, wait`
          );
          this.onCompleted = null;
          this.close();

          scene.game.events.emit(events.buyGangster, {
            quantity: this.quantity,
            mintFunction: this.mintFunction,
          });
        } else {
          this.close();
          this.popupConfirm.open();
        }
      },
      'Buy',
      { fontSize: '82px', sound: 'buy' }
    );
    this.add(this.upgradeBtn);

    this.numberOfMachinesTitle = scene.add
      .text(this.popup.x + 80, this.popup.y - this.popup.height / 2 + 195, 'Gangsters: ', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfMachinesTitle);

    this.numberOfMachinesText = scene.add
      .text(this.popup.x + 150, this.popup.y - this.popup.height / 2 + 195, '', {
        fontSize: fontSizes.extraLarge,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfMachinesText);

    this.capacityText = scene.add
      .text(this.popup.x + 105, this.popup.y - this.popup.height / 2 + 260, 'GANGSTER CAPACITY:', {
        fontSize: fontSizes.small,
        fontFamily: fontFamilies.extraBold,
        color: colors.brown,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.capacityText);

    this.levelText = scene.add
      .text(this.popup.x - 370, this.popup.y - this.popup.height / 2 + 455, '- LVL', {
        fontSize: '48px',
        fontFamily: fontFamilies.extraBold,
        color: '#B23F05',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.levelText);

    this.earningBonusText = scene.add
      .text(this.popup.x - 280, this.popup.y - this.popup.height / 2 + 580, '', {
        fontSize: '60px',
        fontFamily: fontFamilies.extraBold,
        color: '#fff',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.earningBonusText);

    this.upgradePriceButton = new UpgradeAssetButton(scene, {
      x: this.popup.x + 250,
      y: this.popup.y - 300,
      value: 0,
      onClick: () => {
        if (isSimulator) return;
        this.upgradePopupBuyProcessing.initLoading(`Upgrading gangsters to level ${this.level + 1}.\nPlease, wait`);
        this.onCompleted = null;
        this.close();

        scene.game.events.emit(events.upgradeGangsters, { amount: this.numberOfMachines });
      },
    });
    this.add(this.upgradePriceButton);

    const rateY = this.popup.y - 122;
    this.rateText = scene.add.text(this.popup.x + 320, rateY, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.rateIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, rateY + 80, '+0 /d', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.rateText);
    this.add(this.rateIncreaseText);

    this.networthText = scene.add.text(this.popup.x + 380, this.popup.y + 60, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 140, '+0', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

    this.roiText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 270, '+0%', {
        fontSize: fontSizes.large,
        color: colors.green,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.add(this.roiText);

    this.gameTimerText = scene.add
      .text(this.popup.x - 130, this.popup.y + 470, 'Game Timer:', {
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

    this.incrementTimeText = scene.add
      .text(this.clockIcon.x + this.clockIcon.width / 2 + 50, this.gameTimerText.y, '', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    this.add(this.incrementTimeText);

    const counterY = this.popup.y + this.popup.height / 2 - 260;
    const minusBtnX = this.popup.x - this.popup.width / 2 + 310;

    this.priceTextX = this.popup.x + (isSimulator ? 200 : 160);
    this.priceText = scene.add.text(this.priceTextX, counterY, '0', largeBlackExtraBold).setOrigin(0, 0.5);
    this.add(this.priceText);

    // WL mint
    this.alternativePrice = scene.add.text(this.priceTextX, counterY - 110, '0', largeBlackExtraBold).setVisible(false);
    this.priceStrikethrough = scene.add
      .rectangle(this.priceTextX + 20, counterY, this.priceText.width, 5, 0x29000b)
      .setVisible(false);
    this.add(this.alternativePrice);
    this.add(this.priceStrikethrough);

    this.gasPrice = scene.add
      .text(this.priceTextX, counterY, '+0 ETH (gas)', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1);
    this.add(this.gasPrice);
    this.insufficientBalance = scene.add
      .text(this.priceTextX, counterY + 48, 'Insufficient $GREED', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(false);
    this.add(this.insufficientBalance);

    this.coin = scene.add
      .image(this.priceText.x + this.priceText.width + 40, counterY, 'icon-coin-small')
      .setOrigin(0, 0.5)
      .setVisible(!isSimulator);
    this.add(this.coin);

    if (!isSimulator) {
      this.infoButton = new Button(
        scene,
        this.coin.x + this.coin.width + 50,
        counterY - 40,
        'button-info',
        'button-info-pressed',
        () => {
          if (isSimulator) return;
          this.close();
          scene.popupGangsterPrice?.open();
        },
        { sound: 'open' }
      );
      this.add(this.infoButton);
    }

    this.background = scene.add.rectangle(0, 0, width, height, 0x260343, 0.8).setOrigin(0, 0).setVisible(false);
    this.background
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer, localX, localY, event) => {
        // TODO: fix popup cannot be closed when click on backdrop over open button position
        // example: open settings popup -> click on backdrop where settings btn is
        this.hideWarning();
      });
    this.add(this.background);

    this.quantityPlane = scene.add.image(minusBtnX + 170, counterY, 'quantity-plane').setOrigin(0.5, 0.5);
    this.add(this.quantityPlane);

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
          this.checkQuantity();
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
              this.checkQuantity();
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
        if (this.quantity < this.maxQuantity) {
          this.quantity++;
          this.updateValues();
          this.checkQuantity();
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
            if (this.quantity < this.maxQuantity) {
              this.quantity++;
              this.updateValues();
              this.checkQuantity();
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

    this.popupWarningLimitGangster = scene.add
      .image(this.popup.x - 20, counterY, 'popup-warning-limit-gangster')
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.add(this.popupWarningLimitGangster);

    this.warningLevelText = scene.add
      .text(
        this.popupWarningLimitGangster.x - this.popupWarningLimitGangster.width / 2 + 165,
        this.popupWarningLimitGangster.y - 175,
        '',
        {
          fontSize: '48px',
          fontFamily: fontFamilies.extraBold,
          color: '#B23F05',
        }
      )
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.warningLevelText);

    const warningTextX = this.popup.x + 100;
    const warningTextGap = 50;
    this.warningText1 = scene.add
      .text(
        warningTextX,
        this.popupWarningLimitGangster.y - this.popupWarningLimitGangster.height / 2 - 120,
        'You will need to upgrade your',
        {
          fontSize: '40px',
          fontFamily: fontFamilies.bold,
          color: '#29000B',
        }
      )
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.warningText1);

    this.warningText2 = scene.add
      .text(warningTextX, this.warningText1.y + warningTextGap, 'Safehouse Level for excess', {
        fontSize: '40px',
        fontFamily: fontFamilies.bold,
        color: '#29000B',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.warningText2);

    this.warningText3 = scene.add
      .text(warningTextX, this.warningText2.y + warningTextGap, 'Gangsters (+0)', {
        fontSize: '40px',
        fontFamily: fontFamilies.bold,
        color: '#29000B',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.warningText3);

    this.warningText4 = scene.add
      .text(warningTextX, this.warningText3.y + warningTextGap, 'to earn $GREED', {
        fontSize: '40px',
        fontFamily: fontFamilies.bold,
        color: '#29000B',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false);
    this.add(this.warningText4);

    scene.game.events.on(events.completed, () => {
      this.quantity = DEFAULT_QUANTITY;
      this.updateValues();
    });

    scene.game.events.on('update-gas-mint', ({ gas }) => {
      if (isNaN(gas)) return;

      this.gas = gas;
      this.updateValues();
    });

    scene.game.events.on(events.gameEnded, () => {
      this.upgradeBtn.setDisabledState(true);
    });

    scene.game.events.on(events.updateXTokenBalance, (data) => {
      this.xTokenBalance = data.balance;
      this.updateUpgradePriceButton();
    });

    scene.game.events.on(
      events.updateMachines,
      ({
        numberOfMachines,
        networth,
        balance,
        maxPerBatch,
        level,
        earningRateIncrementPerLevel,
        building,
        dailyReward,
        reservePool,
        reservePoolReward,
        networthIncrease,
        isWhitelisted,
        whitelistAmountLeft,
        basePrice,
        basePriceWhitelist,
        targetDailyPurchase,
        targetPrice,
        salesLastPeriod,
      }) => {
        this.balance = balance;
        this.basePrice = basePrice;
        this.whitelistPrice = basePriceWhitelist;
        this.building = building;
        this.numberOfMachines = numberOfMachines;
        this.targetDailyPurchase = targetDailyPurchase;
        this.targetPrice = targetPrice;
        this.salesLastPeriod = salesLastPeriod;
        this.networth = networth;
        this.networthIncrease = networthIncrease;
        this.rateIncrease = dailyReward;
        this.reservePool = reservePool;
        this.reservePoolReward = reservePoolReward;
        this.isWhitelisted = isWhitelisted;
        this.whitelistAmountLeft = whitelistAmountLeft;
        this.mintFunction = isWhitelisted && whitelistAmountLeft ? 'mintWL' : 'mint';

        this.level = level;
        this.numberOfMachinesText.text = `${numberOfMachines.toLocaleString()}`;
        this.numberOfMachinesTitle.x = this.popup.x + 80 - this.numberOfMachinesText.width / 2 + 5;
        this.numberOfMachinesText.x =
          this.numberOfMachinesTitle.x +
          this.numberOfMachinesTitle.width / 2 +
          this.numberOfMachinesText.width / 2 +
          10;
        this.levelText.text = `${level} LVL`;
        this.earningBonusText.text = `+${((level + 1) * earningRateIncrementPerLevel * 100).toLocaleString('en', {
          maximumFractionDigits: 1,
        })}%`;

        this.capacityText.text = `GANGSTER CAPACITY: ${numberOfMachines}/${building?.machineCapacity}`;

        this.updateUpgradePriceButton();

        this.networthText.text = `${networth.toLocaleString()}`;
        this.rateText.text = `${formatter.format(numberOfMachines * dailyReward)}`;
        this.maxQuantity =
          isWhitelisted && whitelistAmountLeft ? Math.min(whitelistAmountLeft, maxPerBatch) : maxPerBatch;
        this.updateValues();
      }
    );

    scene.game.events.on(events.updateIncrementTime, ({ timeIncrementInSeconds }) => {
      this.incrementTimeText.text = `+${timeIncrementInSeconds}s`;
    });

    scene.game.events.emit(events.requestMachines);
    scene.game.events.emit(events.requestIncrementTime);
    scene.game.events.emit('request-gas-mint');

    this.scene = scene;
    this.events = events;
  }

  showWarning(overflowGangsters = 0) {
    this.background.setVisible(true);
    this.popupWarningLimitGangster.setVisible(true);
    this.warningLevelText.text = `${this.building?.level} LVL`;
    this.warningLevelText.setVisible(true);

    this.warningText3.text = `Gangsters (+${overflowGangsters})`;
    this.warningText1.setVisible(true);
    this.warningText2.setVisible(true);
    this.warningText3.setVisible(true);
    this.warningText4.setVisible(true);
  }

  hideWarning() {
    this.background.setVisible(false);
    this.popupWarningLimitGangster.setVisible(false);
    this.warningLevelText.setVisible(false);
    this.warningText1.setVisible(false);
    this.warningText2.setVisible(false);
    this.warningText3.setVisible(false);
    this.warningText4.setVisible(false);
  }

  checkQuantity() {
    const maxActiveMachines = this.building?.machineCapacity || 0;
    const overflowMachines = this.numberOfMachines + this.quantity - maxActiveMachines;
    if (overflowMachines > 0) {
      this.showWarning(overflowMachines);
    } else {
      this.hideWarning();
    }
  }

  updateUpgradePriceButton() {
    const price = calculateUpgradeMachinePrice(this.level);
    this.upgradePriceButton.updateValue(price);

    if (!this.numberOfMachines || price > this.xTokenBalance) {
      this.upgradePriceButton.setDisabledState(true);
    } else {
      this.upgradePriceButton.setDisabledState(false);
    }
  }

  onOpen() {
    this.scene.game.events.emit(this.events.enableSalesTracking);
    if (this.isSimulator) return;
  }

  cleanup() {
    this.onCompleted?.();
    this.scene.game.events.emit(this.events.disableSalesTracking);
  }

  updateValues() {
    if (this.isSimulator) {
      this.priceText.text = 'FREE';
      this.gasPrice.text = '';
      return;
    }

    this.unitPrice = this.mintFunction === 'mintWL' ? this.whitelistPrice : this.basePrice;
    this.estimatedMaxPurchase = this.balance && this.unitPrice ? Math.floor(this.balance / this.unitPrice) : 0;
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;
    this.rateIncreaseText.text = `+${(this.rateIncrease * this.quantity).toLocaleString()} /d`;

    this.estimatedMaxPurchase = estimateNumberOfMachineCanBuy(
      this.balance,
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.maxQuantity
    );

    const estimatedPrice = calculateNextMachineBuyPriceBatch(
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.quantity
    ).total;

    const roi = estimatedPrice ? (((this.rateIncrease * this.quantity) / estimatedPrice) * 100).toFixed(1) : 0;

    this.quantityText.text = `${this.quantity}`;
    this.popupConfirm.updateTextLeft(`${this.quantity}${icon1Gap}unit${this.quantity > 1 ? 's' : ''}`);
    this.popupConfirm.updateTextRight(formatter.format(estimatedPrice.toPrecision(3)));
    this.roiText.text = `${roi}%`;
    this.priceText.text = `${formatter.format(this.quantity * this.basePrice)}`;
    const discountNote = this.mintFunction === 'mintWL' ? ' (WL)' : '';
    this.alternativePrice.text = `${formatter.format(estimatedPrice)}${discountNote}`;
    this.priceStrikethrough.width = this.priceText.width;
    const formattedGas = customFormat(this.gas, 4) === '0' ? '<0.0001' : customFormat(this.gas, 4);
    this.gasPrice.text = `+${formattedGas} ETH (gas)`;
    this.coin.x = this.priceText.x + this.priceText.width + 20;

    const hasDifferentPrice = this.mintFunction !== 'mint';
    this.alternativePrice.setVisible(hasDifferentPrice);
    this.priceStrikethrough.setVisible(hasDifferentPrice);
    const insufficientBalance = this.quantity > this.estimatedMaxPurchase;
    this.insufficientBalance.setVisible(insufficientBalance);
    this.upgradeBtn.setDisabledState(this.scene?.isGameEnded || this.basePrice === 0 || insufficientBalance);
  }
}

export default PopupBuyGangster;
