import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { estimateNumberOfBuildingCanBuy, calculateNextBuildingBuyPriceBatch } from '../../../../utils/formulas';
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

class PopupSafeHouseUpgrade extends Popup {
  gas = 0;
  numberOfBuildings = 0;
  networth = 0;
  networthIncrease = 0;
  balance = 0;
  sold = 0;
  basePrice = 0;
  priceStep = 0;
  quantity = DEFAULT_QUANTITY;

  constructor(scene, { isSimulator, onCompleted } = {}) {
    super(scene, 'popup-safehouse-upgrade', { ribbon: 'ribbon-safehouse-upgrade' });

    const events = {
      completed: isSimulator ? 'simulator-upgrade-safehouse-completed' : 'upgrade-safehouse-completed',
      upgradeHouse: isSimulator ? 'simulator-upgrade-safehouse' : 'upgrade-safehouse',
      gameEnded: isSimulator ? 'simulator-game-ended' : 'game-ended',
      updateBuildings: isSimulator ? 'simulator-update-buildings' : 'update-buildings',
      requestBuildings: isSimulator ? 'simulator-request-buildings' : 'request-buildings',
    };

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
        this.close();

        scene.game.events.emit(events.upgradeHouse, { quantity: this.quantity });
      },
      'Upgrade',
      { sound: 'buy', disabledImage: 'button-disabled' }
    );
    this.add(this.upgradeBtn);

    this.numberOfBuildingsText = scene.add.text(this.popup.x + 400, this.popup.y - this.popup.height / 2 + 170, '0', {
      fontSize: fontSizes.extraLarge,
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfBuildingsText);

    this.networthText = scene.add.text(this.popup.x + 380, this.popup.y - 80, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y, '+0', {
        fontSize: fontSizes.small,
        color: colors.green,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

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
        this.sold,
        this.balance - this.gas,
        this.basePrice,
        this.priceStep
      );
      this.updateValues();
    });

    scene.game.events.on(
      events.updateBuildings,
      ({ numberOfBuildings, networth, balance, sold, basePrice, priceStep, networthIncrease }) => {
        this.balance = balance;
        this.sold = sold;
        this.basePrice = basePrice;
        this.priceStep = priceStep;
        this.numberOfBuildings = numberOfBuildings;
        this.networth = networth;
        this.networthIncrease = networthIncrease;

        this.numberOfBuildingsText.text = numberOfBuildings.toLocaleString();
        this.networthText.text = `${networth.toLocaleString()}`;
        this.estimatedMaxPurchase = estimateNumberOfBuildingCanBuy(sold, balance - this.gas, basePrice, priceStep);
        this.updateValues();
      }
    );

    scene.game.events.emit(events.requestBuildings);
    scene.game.events.emit('request-gas-upgrade-safehouse');
  }

  updateValues() {
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;

    const estimatedPrice = calculateNextBuildingBuyPriceBatch(
      this.sold,
      this.quantity,
      this.basePrice,
      this.priceStep
    ).total;

    this.quantityText.text = this.quantity;
    this.priceText.text = `${formatter.format(estimatedPrice)}`;
    const formattedGas = customFormat(this.gas, 4) === '0' ? '<0.0001' : customFormat(this.gas, 4);
    this.gasPrice.text = `+${formattedGas} ETH (gas)`;
    this.coin.x = this.priceText.x + this.priceText.width + 20;

    const insufficientBalance = this.quantity > this.estimatedMaxPurchase;
    this.insufficientBalance.setVisible(insufficientBalance);
    this.upgradeBtn.setDisabledState(this.scene.isGameEnded || insufficientBalance);
  }
}

export default PopupSafeHouseUpgrade;
