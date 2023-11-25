import Popup from './Popup';
import PopupBuyProcessing from './PopupBuyProcessing';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { estimateNumberOfBuildingCanBuy, calculateNextBuildingBuyPriceBatch } from '../../../../utils/formulas';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const sliderWidth = 500;
const largeBlackExtraBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
};

class PopupSafeHouseUpgrade extends Popup {
  numberOfBuildings = 0;
  networth = 0;
  networthIncrease = 0;
  balance = 0;
  sold = 0;
  basePrice = 0;
  priceStep = 0;
  quantity = 0;
  slideValue = 0;

  constructor(scene) {
    super(scene, 'popup-safehouse-upgrade', { ribbon: 'ribbon-safehouse-upgrade' });

    this.upgradeBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (!this.quantity) return;
        this.popupBuyProcessing = new PopupBuyProcessing(scene, {
          sound: 'house',
          buyCompletedEvent: 'upgrade-safehouse-completed',
          buyCompletedIcon: 'icon-safehouse-upgrade-done',
          buyingText: `Upgrading Safehouse`,
        });
        scene.add.existing(this.popupBuyProcessing);
        this.close();

        scene.game.events.emit('upgrade-safehouse', { quantity: this.quantity });
      },
      'Upgrade',
      { sound: 'buy' }
    );
    this.add(this.upgradeBtn);

    this.numberOfBuildingsText = scene.add.text(this.popup.x + 390, this.popup.y - 535, '0', {
      fontSize: fontSizes.extraLarge,
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfBuildingsText);

    this.networthText = scene.add.text(this.popup.x + 380, this.popup.y - 20, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 60, '+0', {
        fontSize: fontSizes.small,
        color: colors.green,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

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
          const estimatedMaxPurchase = estimateNumberOfBuildingCanBuy(
            this.sold,
            this.balance,
            this.basePrice,
            this.priceStep
          );
          const maxPurchase = Math.min(25, estimatedMaxPurchase);

          if (maxPurchase === 0) {
            if (this.slider) {
              this.slider.value = 0;
              this.slideValue = 0;
              return;
            }
          }

          this.slideValue = value;

          if (this.sliderThumb) {
            const increaseX = value * sliderWidth - value * 70;
            this.sliderThumb.x = sliderThumbX + increaseX;
            this.sliderThumbText.x = sliderThumbX + increaseX;

            const quantity = Math.floor(value * maxPurchase);
            this.sliderThumbText.text = `+${quantity}`;
            this.quantity = quantity;
            this.numberOfBuildingsText.text = `${this.numberOfBuildings + quantity}`;

            const increasedNetworth = this.networthIncrease * quantity;
            this.networthText.text = `${this.networth + increasedNetworth}`;
            this.networthIncreaseText.text = `+${increasedNetworth}`;

            const estimatedPrice = calculateNextBuildingBuyPriceBatch(
              this.sold,
              quantity,
              this.basePrice,
              this.priceStep
            ).total;

            this.priceText.text = `${formatter.format(estimatedPrice)}`;
            this.coin.x = this.priceText.x + this.priceText.width + 20;
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
    this.sliderThumbText = scene.add.text(sliderThumbX, sliderY - 85, `+0`, largeBlackExtraBold).setOrigin(0.5, 0.5);
    this.add(this.sliderThumb);
    this.add(this.sliderThumbText);

    this.priceText = scene.add
      .text(
        this.popup.x - this.popup.width / 2 + 170 + this.qtyText.width + sliderWidth,
        sliderY,
        '0',
        largeBlackExtraBold
      )
      .setOrigin(0, 0.5);
    this.add(this.priceText);

    this.coin = scene.add.image(this.priceText.x + this.priceText.width + 40, sliderY, 'coin2').setOrigin(0, 0.5);
    this.add(this.coin);

    scene.game.events.on(
      'update-buildings',
      ({ numberOfBuildings, networth, balance, sold, basePrice, priceStep, networthIncrease }) => {
        this.balance = balance;
        this.sold = sold;
        this.basePrice = basePrice;
        this.priceStep = priceStep;
        this.numberOfBuildings = numberOfBuildings;
        this.networth = networth;
        this.networthIncrease = networthIncrease;

        this.numberOfBuildingsText.text = `${numberOfBuildings}`;
        this.networthText.text = `${networth}`;
      }
    );

    scene.game.events.emit('request-buildings');
  }
}

export default PopupSafeHouseUpgrade;
