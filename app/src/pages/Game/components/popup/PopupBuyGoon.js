import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { estimateNumberOfWorkerCanBuy, calculateNextWorkerBuyPriceBatch } from '../../../../utils/formulas';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const DEFAULT_QUANTITY = 1;
const sliderWidth = 500;
const largeBlackExtraBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
};
const smallGreenBold = { fontSize: fontSizes.small, color: colors.green, fontFamily: fontFamilies.bold };

class PopupBuyGoon extends Popup {
  numberOfWorkers = 0;
  networth = 0;
  networthIncrease = 0;
  rateIncrease = 0;
  balance = 0;
  sold = 0;
  basePrice = 0;
  priceStep = 0;
  quantity = DEFAULT_QUANTITY;
  slideValue = 0;
  estimatedMaxPurchase = 0;

  constructor(scene) {
    super(scene, 'popup-buy-goon', { ribbon: 'ribbon-buy-goon' });
    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'minion',
      completedEvent: 'buy-goon-completed',
      completedIcon: 'icon-goon-buy-done',
      description: ``,
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
        this.close();

        scene.game.events.emit('buy-goon', { quantity: this.quantity });
      },
      'Buy',
      { sound: 'buy', disabledImage: 'button-disabled' }
    );
    this.add(this.upgradeBtn);

    this.numberOfWorkersText = scene.add.text(this.popup.x + 320, this.popup.y - 535, '0', {
      fontSize: '76px',
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfWorkersText);

    this.rateText = scene.add.text(this.popup.x + 320, this.popup.y - 205, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.rateIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y - 125, '+0 /d', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.rateText);
    this.add(this.rateIncreaseText);

    this.networthText = scene.add.text(this.popup.x + 380, this.popup.y - 20, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 60, '+0', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

    this.roiText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 180, '+0%', {
        fontSize: fontSizes.large,
        color: colors.green,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.add(this.roiText);

    const sliderY = this.popup.y + this.popup.height / 2 - 220;
    this.qtyText = scene.add
      .text(this.popup.x - this.popup.width / 2 + 150, sliderY, 'Qty:', {
        fontSize: '52px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.qtyText);

    const sliderThumbX = this.popup.x - this.popup.width / 2 + 165 + this.qtyText.width;

    this.slider = scene.rexUI.add
      .slider({
        x: this.popup.x - this.popup.width / 2 + 130 + this.qtyText.width + sliderWidth / 2,
        y: sliderY,
        width: sliderWidth,
        height: 40,
        orientation: 'x',

        track: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 30, 0xd68d6a),
        thumb: scene.rexUI.add.roundRectangle(0, 0, 70, 70, 35, 0xffffff),
        indicator: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 30, 0x5ef736),

        valuechangeCallback: (value) => {
          if (this.loading) {
            if (this.slider) {
              this.slider.value = this.slideValue;
            }
            return;
          }
          this.estimatedMaxPurchase = estimateNumberOfWorkerCanBuy(
            this.sold,
            this.balance,
            this.basePrice,
            this.priceStep
          );
          const maxPurchase = Math.min(24, this.estimatedMaxPurchase);

          if (maxPurchase === 0) {
            if (this.slider) {
              this.slider.value = 0;
              this.slideValue = 0;
              if (this.sliderThumb) {
                this.sliderThumb.x = sliderThumbX;
                this.sliderThumbText.x = sliderThumbX;
              }
              return;
            }
          }

          this.slideValue = value;

          if (this.sliderThumb) {
            const increaseX = value * sliderWidth - value * 70;
            this.sliderThumb.x = sliderThumbX + increaseX;
            this.sliderThumbText.x = sliderThumbX + increaseX;

            const quantity = Math.floor(value * maxPurchase) + 1;
            this.sliderThumbText.text = `+${quantity}`;
            this.quantity = quantity;
            this.updateValues();
          }
        },
        space: {
          top: 4,
          bottom: 4,
        },
        input: 'click', // 'drag'|'click'
      })
      .layout();
    this.add(this.slider);

    this.sliderThumb = scene.add.image(sliderThumbX, sliderY + 35, 'slider-thumb').setOrigin(0.5, 1);
    this.sliderThumb.setDepth(5);
    this.sliderThumbText = scene.add
      .text(sliderThumbX, sliderY - 85, `+${DEFAULT_QUANTITY}`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.sliderThumb);
    this.add(this.sliderThumbText);

    const priceTextX = this.popup.x - this.popup.width / 2 + 170 + this.qtyText.width + sliderWidth;
    this.priceText = scene.add.text(priceTextX, sliderY, '0', largeBlackExtraBold).setOrigin(0, 0.5);
    this.add(this.priceText);
    this.insufficientBalance = scene.add
      .text(priceTextX, sliderY, 'Insufficient $FIAT', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(false);
    this.add(this.insufficientBalance);

    this.coin = scene.add.image(this.priceText.x + this.priceText.width + 40, sliderY, 'coin2').setOrigin(0, 0.5);
    this.add(this.coin);

    scene.game.events.on('buy-goon-completed', () => {
      if (this.slider) {
        this.slider.value = 0;
      }
    });

    scene.game.events.on('game-ended', () => {
      this.upgradeBtn.setDisabledState(true);
    });
    scene.game.events.on(
      'update-workers',
      ({ numberOfWorkers, networth, balance, sold, basePrice, priceStep, dailyReward, networthIncrease }) => {
        this.balance = balance;
        this.sold = sold;
        this.basePrice = basePrice;
        this.priceStep = priceStep;
        this.numberOfWorkers = numberOfWorkers;
        this.networth = networth;
        this.networthIncrease = networthIncrease;
        this.rateIncrease = dailyReward;

        this.numberOfWorkersText.text = numberOfWorkers.toLocaleString();
        this.networthText.text = `${networth.toLocaleString()}`;
        this.rateText.text = `${formatter.format(numberOfWorkers * dailyReward)}`;
        this.estimatedMaxPurchase = estimateNumberOfWorkerCanBuy(sold, balance, basePrice, priceStep);
        this.updateValues();
      }
    );

    scene.game.events.emit('request-workers');
  }

  updateValues() {
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;
    this.rateIncreaseText.text = `+${(this.rateIncrease * this.quantity).toLocaleString()} /d`;

    const estimatedPrice = calculateNextWorkerBuyPriceBatch(
      this.sold,
      this.quantity,
      this.basePrice,
      this.priceStep
    ).total;
    const roi = estimatedPrice ? (((this.rateIncrease * this.quantity) / estimatedPrice) * 100).toFixed(1) : 0;

    this.roiText.text = `${roi}%`;
    this.priceText.text = `${formatter.format(estimatedPrice)}`;
    this.coin.x = this.priceText.x + this.priceText.width + 20;

    this.insufficientBalance.setVisible(this.quantity > this.estimatedMaxPurchase);
    this.upgradeBtn.setDisabledState(this.scene.isGameEnded || this.quantity > this.estimatedMaxPurchase);
  }
}

export default PopupBuyGoon;
