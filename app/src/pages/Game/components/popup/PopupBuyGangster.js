import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const sliderWidth = 500;

class PopupBuyGangster extends Popup {
  balance = 0;
  basePrice = 0;
  quantity = 0;
  slideValue = 0;

  constructor(scene) {
    super(scene, 'popup-buy-gangster', { ribbon: 'ribbon-buy-gangster' });

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
        scene.game.events.emit('buy-gangster', { quantity: this.quantity });
      },
      'Buy',
      { sound: 'buy' }
    );
    this.add(this.upgradeBtn);

    this.numberOfMachinesText = scene.add.text(this.popup.x + 370, this.popup.y - 595, '0', {
      fontSize: '76px',
      color: '#29000B',
      fontFamily: 'WixMadeforDisplayExtraBold',
    });
    this.add(this.numberOfMachinesText);

    this.rateText = scene.add
      .text(this.popup.x + 320, this.popup.y - 265, '0', {
        fontSize: '60px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0);
    this.add(this.rateText);

    this.networthText = scene.add
      .text(this.popup.x + 380, this.popup.y - 80, '0', {
        fontSize: '60px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0);
    this.add(this.networthText);

    this.infoIcon = scene.add.image(this.popup.x + 40, this.popup.y + 290, 'button-info').setOrigin(0.5, 0.5);
    this.add(this.infoIcon);

    this.bonusText = scene.add
      .text(this.popup.x + 90, this.popup.y + 325, '0', {
        fontSize: '60px',
        color: '#29000B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0, 0.5);
    this.add(this.bonusText);

    this.bonusCoin = scene.add
      .image(this.bonusText.x + this.bonusText.width + 50, this.popup.y + 325, 'coin')
      .setOrigin(0.5, 0.5);
    this.add(this.bonusCoin);

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
          const estimatedMaxPurchase = this.balance && this.basePrice ? Math.floor(this.balance / this.basePrice) : 0;
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

            const estimatedPrice = quantity * this.basePrice;

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

    this.coin = scene.add.image(this.priceText.x + this.priceText.width + 40, sliderY, 'eth-coin').setOrigin(0, 0.5);
    this.add(this.coin);

    this.gangsterSound = scene.sound.add('gangster', { loop: false });

    scene.game.events.on(
      'update-machines',
      ({ numberOfMachines, networth, balance, basePrice, dailyReward, bonus }) => {
        this.balance = balance;
        this.basePrice = basePrice;
        this.numberOfMachinesText.text = `${numberOfMachines}`;
        this.networthText.text = `${networth}`;
        this.rateText.text = `${formatter.format(numberOfMachines * dailyReward)}`;
        this.bonusText.text = `${formatter.format(bonus)}`;
        this.bonusCoin.x = this.bonusText.x + this.bonusText.width + 50;
      }
    );

    scene.game.events.on('buy-gangster-completed', () => {
      this.loading = false;
      this.upgradeBtn.updateText('Upgrade');
      this.slider.value = 0;
      this.gangsterSound.play();
    });

    scene.game.events.emit('request-machines');
  }
}

export default PopupBuyGangster;
