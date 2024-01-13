import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { estimateNumberOfWorkerCanBuy, calculateNextWorkerBuyPriceBatch } from '../../../../utils/formulas';
import { customFormat, formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const DEFAULT_QUANTITY = 1;
const MAX_QUANTITY = 25;
const INTERVAL = 100;
const largeBlackExtraBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
};
const smallGreenBold = { fontSize: fontSizes.small, color: colors.green, fontFamily: fontFamilies.bold };

class PopupBuyGoon extends Popup {
  gas = 0;
  numberOfWorkers = 0;
  networth = 0;
  networthIncrease = 0;
  rateIncrease = 0;
  balance = 0;
  basePrice = 0;
  targetDailyPurchase = 1;
  targetPrice = 0;
  salesLastPeriod = 0;
  quantity = DEFAULT_QUANTITY;
  estimatedMaxPurchase = 0;
  onCompleted;

  constructor(scene, { isSimulator, onCompleted } = {}) {
    super(scene, 'popup-buy-goon', { ribbon: 'ribbon-buy-goon' });

    this.scene = scene;
    const events = {
      completed: isSimulator ? 'simulator-buy-goon-completed' : 'buy-goon-completed',
      buyGoon: isSimulator ? 'simulator-buy-goon' : 'buy-goon',
      gameEnded: isSimulator ? 'simulator-game-ended' : 'game-ended',
      updateWorkers: isSimulator ? 'simulator-update-workers' : 'update-workers',
      requestWorkers: isSimulator ? 'simulator-request-workers' : 'request-workers',
      updatePriceWorkerBuilding: isSimulator
        ? 'simulator-update-price-worker-building'
        : 'update-price-worker-building',
    };
    this.events = events;
    this.onCompleted = onCompleted;

    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'minion',
      completedEvent: events.completed,
      completedIcon: 'icon-goon-buy-done',
      failedIcon: 'icon-goon-buy-fail',
      description: ``,
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
        this.popupBuyProcessing.initLoading(
          `Hiring ${this.quantity} Goon${this.quantity > 1 ? 's' : ''}.\nPlease, wait`
        );
        this.onCompleted = null;
        this.close();

        scene.game.events.emit(events.buyGoon, { quantity: this.quantity });
      },
      'Buy',
      { sound: 'buy', disabledImage: 'button-disabled' }
    );
    this.add(this.upgradeBtn);

    this.numberOfWorkersText = scene.add.text(this.popup.x + 320, this.popup.y - this.popup.height / 2 + 170, '0', {
      fontSize: '76px',
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfWorkersText);

    this.rateText = scene.add.text(this.popup.x + 320, this.popup.y - 265, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.rateIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y - 185, '+0 /d', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.rateText);
    this.add(this.rateIncreaseText);

    this.networthText = scene.add.text(this.popup.x + 380, this.popup.y - 80, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 0, '+0', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

    this.roiText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 120, '+0%', {
        fontSize: fontSizes.large,
        color: colors.green,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.add(this.roiText);

    const counterY = this.popup.y + this.popup.height / 2 - 280;
    const minusBtnX = this.popup.x - this.popup.width / 2 + 310;
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
    this.add(this.minusBtn);

    this.plusBtn = new TextButton(
      scene,
      minusBtnX + 350,
      counterY,
      'button-square',
      'button-square-pressed',
      () => {
        if (this.quantity < MAX_QUANTITY) {
          this.quantity++;
          this.updateValues();
        }
      },
      '+',
      {
        fontSize: '82px',
        sound: 'button-1',
        onHold: () => {
          if (this.interval) {
            clearInterval(this.interval);
          }
          this.interval = setInterval(() => {
            if (this.quantity < MAX_QUANTITY) {
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
      .setOrigin(0, -1);
    this.add(this.gasPrice);
    this.insufficientBalance = scene.add
      .text(priceTextX, counterY + 48, 'Insufficient $FIAT', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(false);
    this.add(this.insufficientBalance);

    this.coin = scene.add.image(this.priceText.x + this.priceText.width + 40, counterY, 'coin2').setOrigin(0, 0.5);
    this.add(this.coin);

    scene.game.events.on('update-gas-buy-goon', ({ gas }) => {
      if (isNaN(gas)) return;

      this.gas = gas;
      this.estimatedMaxPurchase = estimateNumberOfWorkerCanBuy(
        this.balance - this.gas,
        this.salesLastPeriod,
        this.targetDailyPurchase,
        this.targetPrice,
        this.basePrice
      );
      this.updateValues();
    });
    scene.game.events.on(events.completed, () => {
      this.quantity = DEFAULT_QUANTITY;
      this.updateValues();
    });

    scene.game.events.on(events.gameEnded, () => {
      this.upgradeBtn.setDisabledState(true);
    });
    scene.game.events.on(
      events.updateWorkers,
      ({
        numberOfWorkers,
        networth,
        balance,
        basePrice,
        targetDailyPurchase,
        targetPrice,
        salesLastPeriod,
        dailyReward,
        networthIncrease,
      }) => {
        this.balance = balance;
        this.basePrice = basePrice;
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
        this.estimatedMaxPurchase = estimateNumberOfWorkerCanBuy(
          balance - this.gas,
          salesLastPeriod,
          targetDailyPurchase,
          targetPrice,
          basePrice
        );
        this.updateValues();
      }
    );

    scene.game.events.emit(events.requestWorkers);
    scene.game.events.emit('request-gas-buy-goon');
  }

  onOpen() {
    this.scene.game.events.emit(this.events.updatePriceWorkerBuilding);
  }

  cleanup() {
    this.onCompleted?.();
  }

  updateValues() {
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;
    this.rateIncreaseText.text = `+${(this.rateIncrease * this.quantity).toLocaleString()} /d`;

    const estimatedPrice = calculateNextWorkerBuyPriceBatch(
      this.salesLastPeriod,
      this.targetDailyPurchase,
      this.targetPrice,
      this.basePrice,
      this.quantity
    ).total;
    const roi = estimatedPrice ? (((this.rateIncrease * this.quantity) / estimatedPrice) * 100).toFixed(1) : 0;

    this.quantityText.text = `${this.quantity}`;
    this.roiText.text = `${roi}%`;
    this.priceText.text = `${formatter.format(estimatedPrice)}`;
    const formattedGas = customFormat(this.gas, 4) === '0' ? '<0.0001' : customFormat(this.gas, 4);
    this.gasPrice.text = `+${formattedGas} ETH (gas)`;
    this.coin.x = this.priceText.x + this.priceText.width + 20;

    const insufficientBalance = this.quantity > this.estimatedMaxPurchase;
    this.insufficientBalance.setVisible(insufficientBalance);
    this.upgradeBtn.setDisabledState(this.scene?.isGameEnded || insufficientBalance);
  }
}

export default PopupBuyGoon;
