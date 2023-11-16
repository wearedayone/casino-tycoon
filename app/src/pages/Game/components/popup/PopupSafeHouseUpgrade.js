import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import { estimateNumberOfBuildingCanBuy, calculateNextBuildingBuyPriceBatch } from '../../../../utils/formulas';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const sliderWidth = 500;

class PopupSafeHouseUpgrade extends Popup {
  balance = 0;
  sold = 0;
  basePrice = 0;
  priceStep = 0;
  quantity = 0;
  slideValue = 0;

  constructor(scene) {
    super(scene, 'popup-safehouse-upgrade', { ribbon: 'ribbon-safehouse-upgrade' });

    this.setVisible(false);

    this.upgradeBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (this.loading || !this.quantity) return;
        this.loading = true;
        this.upgradeBtn.updateText('Upgrading...');
        scene.game.events.emit('upgrade-safehouse', { quantity: this.quantity });
      },
      'Upgrade',
      { sound: 'buy' }
    );
    this.add(this.upgradeBtn);

    this.numberOfBuildingsText = scene.add.text(this.popup.x + 390, this.popup.y - 535, '0', {
      fontSize: '76px',
      color: '#29000B',
      fontFamily: 'WixMadeforDisplayExtraBold',
    });
    this.add(this.numberOfBuildingsText);

    this.networthText = scene.add
      .text(this.popup.x + 380, this.popup.y - 20, '0', {
        fontSize: '60px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0);
    this.add(this.networthText);

    const sliderY = this.popup.y + this.popup.height / 2 - 220;
    this.qtyText = scene.add
      .text(this.popup.x - this.popup.width / 2 + 150, sliderY, 'Qty:', {
        fontSize: '52px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayBold',
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

            const estimatedPrice = calculateNextBuildingBuyPriceBatch(
              this.sold,
              quantity,
              this.basePrice,
              this.priceStep
            ).total;

            this.priceText.text = `${formatter.format(estimatedPrice)}`;
            this.coin.x = this.priceText.x + this.priceText.width + 40;
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
      .text(sliderThumbX, sliderY - 85, `+0`, {
        fontSize: '60px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.sliderThumb);
    this.add(this.sliderThumbText);

    this.priceText = scene.add
      .text(this.popup.x - this.popup.width / 2 + 170 + this.qtyText.width + sliderWidth, sliderY, '0', {
        fontSize: '60px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0, 0.5);
    this.add(this.priceText);

    this.coin = scene.add.image(this.priceText.x + this.priceText.width + 40, sliderY, 'coin2').setOrigin(0, 0.5);
    this.add(this.coin);

    this.houseSound = scene.sound.add('house', { loop: false });

    scene.game.events.on('update-buildings', ({ numberOfBuildings, networth, balance, sold, basePrice, priceStep }) => {
      this.balance = balance;
      this.sold = sold;
      this.basePrice = basePrice;
      this.priceStep = priceStep;
      this.numberOfBuildingsText.text = `${numberOfBuildings}`;
      this.networthText.text = `${networth}`;
    });

    scene.game.events.on('upgrade-safehouse-completed', () => {
      this.loading = false;
      this.upgradeBtn.updateText('Upgrade');
      this.slider.value = 0;
      this.houseSound.play();
    });

    scene.game.events.emit('request-buildings');
  }
}

export default PopupSafeHouseUpgrade;
