import Phaser from 'phaser';

import Popup from './Popup';
import PopupConfirm, { icon1Gap } from './PopupConfirm';
import PopupProcessing from './PopupProcessing';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { estimateNumberOfWorkerCanBuy, calculateNextWorkerBuyPriceBatch } from '../../../../utils/formulas';
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
const smallGreenBold = { fontSize: fontSizes.small, color: colors.green, fontFamily: fontFamilies.bold };

class PopupBuyGoon extends Popup {
  gas = 0;
  numberOfWorkers = 0;
  networth = 0;
  networthIncrease = 0;
  rateIncrease = 0;
  balance = 0;
  xTokenBalance = 0;
  basePrice = 0;
  maxPerBatch = 10;
  targetDailyPurchase = 1;
  targetPrice = 0;
  salesLastPeriod = 0;
  quantity = DEFAULT_QUANTITY;
  estimatedMaxPurchase = 0;
  onCompleted;
  isSimulator = false;
  purchaseToken = 'GREED'; // 'xGREED' || 'GREED'

  constructor(scene, { isSimulator, onCompleted } = {}) {
    super(scene, 'popup-buy-goon', { title: 'Buy Goons', noCloseBtn: !!isSimulator });

    this.scene = scene;
    const events = {
      completed: isSimulator ? 'simulator-buy-goon-completed' : 'buy-goon-completed',
      buyGoon: isSimulator ? 'simulator-buy-goon' : 'buy-goon',
      gameEnded: isSimulator ? 'simulator-game-ended' : 'game-ended',
      updateWorkers: isSimulator ? 'simulator-update-workers' : 'update-workers',
      requestWorkers: isSimulator ? 'simulator-request-workers' : 'request-workers',
      enableSalesTracking: isSimulator ? 'simulator-enable-worker-sales-tracking' : 'enable-worker-sales-tracking',
      disableSalesTracking: isSimulator ? 'simulator-disable-worker-sales-tracking' : 'disable-worker-sales-tracking',
      updateXTokenBalance: isSimulator ? 'simulator-update-xtoken-balance' : 'update-xtoken-balance',
    };
    this.events = events;
    this.onCompleted = onCompleted;
    this.isSimulator = isSimulator;
    const numberOfWorkersY = this.popup.y - this.popup.height / 2 + 170;
    const rateY = numberOfWorkersY + 340;
    const networthY = rateY + 180;
    const roiY = networthY + 200;
    const checkBoxY = roiY + 270;
    const leftCheckBoxX = this.popup.x - this.popup.width / 2 + 180;
    const rightCheckBoxX = this.popup.x + 70;
    const availableY = checkBoxY + 50;
    const counterY = this.popup.y + this.popup.height / 2 - 260;
    const minusBtnX = this.popup.x - this.popup.width / 2 + 320;

    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'minion',
      completedEvent: events.completed,
      completedIcon: 'icon-goon-buy-done',
      failedIcon: 'icon-goon-buy-fail',
      description: ``,
      onCompleted,
    });
    scene.add.existing(this.popupBuyProcessing);
    this.popupConfirm = new PopupConfirm(scene, this, {
      title: 'Buy Goons',
      action: 'buy',
      icon1: 'icon-goon-medium',
      icon2: 'icon-coin-small',
      onConfirm: () => {
        if (!this.quantity) return;
        this.popupBuyProcessing.initLoading(
          `Hiring ${this.quantity} Goon${this.quantity > 1 ? 's' : ''}.\nPlease, wait`
        );

        scene.game.events.emit(events.buyGoon, { quantity: this.quantity, token: this.purchaseToken });
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
            `Hiring ${this.quantity} Goon${this.quantity > 1 ? 's' : ''}.\nPlease, wait`
          );
          this.onCompleted = null;
          this.close();

          scene.game.events.emit(events.buyGoon, {
            quantity: this.quantity,
            token: this.purchaseToken,
          });
        } else {
          this.close();
          this.popupConfirm.open();
        }
      },
      'Buy',
      { fontSize: '82px', sound: 'buy', disabledImage: 'button-disabled' }
    );
    this.add(this.upgradeBtn);

    this.numberOfWorkersText = scene.add.text(this.popup.x + 60, numberOfWorkersY, '0', {
      fontSize: '76px',
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfWorkersText);

    this.rateText = scene.add.text(this.popup.x + 320, rateY, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.rateIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, rateY + 80, '+0 /d', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.rateText);
    this.add(this.rateIncreaseText);

    this.networthText = scene.add.text(this.popup.x + 380, networthY, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, networthY + 80, '+0', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

    this.roiText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, roiY, '+0%', {
        fontSize: fontSizes.large,
        color: colors.green,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.add(this.roiText);

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
          scene.popupGoonPrice?.open();
        },
        { sound: 'open' }
      );
      this.add(this.infoButton);
    }

    scene.game.events.on('update-gas-buy-goon', ({ gas }) => {
      if (isNaN(gas)) return;

      this.gas = gas;
      this.updateValues();
    });
    scene.game.events.on(events.completed, () => {
      this.quantity = DEFAULT_QUANTITY;
      this.updateValues();
    });

    scene.game.events.on(events.gameEnded, () => {
      this.upgradeBtn.setDisabledState(true);
    });

    scene.game.events.on(events.updateXTokenBalance, ({ balance }) => {
      this.xTokenBalance = balance;
      this.xgangAvailable.text = `Available: ${customFormat(balance || 0, 1)}`;
      if (this.purchaseToken === 'xGREED') this.updateValues();
    });

    scene.game.events.on(
      events.updateWorkers,
      ({
        numberOfWorkers,
        networth,
        balance,
        basePrice,
        maxPerBatch,
        targetDailyPurchase,
        targetPrice,
        salesLastPeriod,
        dailyReward,
        networthIncrease,
      }) => {
        this.balance = balance;
        this.tokenAvailable.text = `Available: ${customFormat(balance || 0, 1)}`;
        this.basePrice = basePrice;
        this.maxPerBatch = maxPerBatch;
        this.targetDailyPurchase = targetDailyPurchase;
        this.targetPrice = targetPrice;
        this.salesLastPeriod = salesLastPeriod;
        this.numberOfWorkers = numberOfWorkers;
        this.networth = networth;
        this.networthIncrease = networthIncrease;
        this.rateIncrease = dailyReward;

        this.numberOfWorkersText.text = numberOfWorkers.toLocaleString();
        this.networthText.text = `${networth.toLocaleString()}`;
        this.rateText.text = `${formatter.format(numberOfWorkers * dailyReward)}`;
        this.updateValues();
      }
    );

    scene.game.events.emit(events.requestWorkers);
    scene.game.events.emit('request-gas-buy-goon');
  }

  onOpen() {
    this.scene.game.events.emit(this.events.enableSalesTracking);
    if (!this.isSimulator)
      this.scene.game.events.emit('request-goon-price', { timeMode: this.scene.popupGoonPrice.timeMode });
  }

  cleanup() {
    this.onCompleted?.();
    console.log('popup buy goon cleanup');
    this.scene.game.events.emit(this.events.disableSalesTracking);
  }

  updateValues() {
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;
    this.rateIncreaseText.text = `+${(this.rateIncrease * this.quantity).toLocaleString()} /d`;

    this.estimatedMaxPurchase = estimateNumberOfWorkerCanBuy(
      this.balance,
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.maxPerBatch
    );
    this.xTokenMaxPurchase = estimateNumberOfWorkerCanBuy(
      this.xTokenBalance,
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.maxPerBatch
    );

    const estimatedPrice = calculateNextWorkerBuyPriceBatch(
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
    this.priceText.text = `${customFormat(estimatedPrice, 1)}`;
    const formattedGas = customFormat(this.gas, 4) === '0' ? '<0.0001' : customFormat(this.gas, 4);
    this.gasPrice.text = `+${formattedGas} ETH (gas)`;
    this.coin.x = this.priceText.x + this.priceText.width + 10;
    if (this.infoButton) this.infoButton.x = this.coin.x + this.coin.width + 30;

    const maxPurchase = this.purchaseToken === 'GREED' ? this.estimatedMaxPurchase : this.xTokenMaxPurchase;
    const insufficientBalance = this.quantity > maxPurchase;
    this.insufficientBalance.setVisible(insufficientBalance);
    this.upgradeBtn.setDisabledState(
      this.scene?.isGameEnded || (!this.scene?.isUserActive && !this.isSimulator) || insufficientBalance
    );
  }
}

export default PopupBuyGoon;
