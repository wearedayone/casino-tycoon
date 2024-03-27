import Popup from './Popup';
import PopupBuyBonusInfo from './PopupBuyBonusInfo';
import PopupProcessing from './PopupProcessing';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
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
  basePrice = 0;
  unitPrice = 0;
  whitelistPrice = 0;
  daysElapsed = 0;
  quantity = DEFAULT_QUANTITY;
  maxQuantity = 10;
  isWhitelisted = false;
  whitelistAmountLeft = 0;
  referralDiscount = 0;
  mintFunction = 'mint';
  onCompleted;

  constructor(scene, { isSimulator, onCompleted } = {}) {
    super(scene, 'popup-buy-gangster', { title: 'Buy Gangsters', noCloseBtn: !!isSimulator });

    const events = {
      completed: isSimulator ? 'simulator-buy-gangster-completed' : 'buy-gangster-completed',
      buyGangster: isSimulator ? 'simulator-buy-gangster' : 'buy-gangster',
      gameEnded: isSimulator ? 'simulator-game-ended' : 'game-ended',
      updateMachines: isSimulator ? 'simulator-update-machines' : 'update-machines',
      requestMachines: isSimulator ? 'simulator-request-machines' : 'request-machines',
      updateBuyBonus: isSimulator ? 'simulator-update-buy-bonus' : 'update-buy-bonus',
      requestBuyBonus: isSimulator ? 'simulator-request-buy-bonus' : 'request-buy-bonus',
    };
    this.onCompleted = onCompleted;
    this.isSimulator = isSimulator;

    // child modals
    const popupBuyBonusInfo = new PopupBuyBonusInfo(scene, this, { isSimulator });
    scene.add.existing(popupBuyBonusInfo);
    this.popupBuyProcessing = new PopupProcessing(scene, {
      sound: 'gangster',
      completedEvent: events.completed,
      completedIcon: 'icon-gangster-buy-done',
      failedIcon: 'icon-gangster-buy-fail',
      description: '',
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
        if (isSimulator) this.quantity = 1;
        this.popupBuyProcessing.initLoading(
          `Hiring ${this.quantity} Gangster${this.quantity > 1 ? 's' : ''}.\nPlease, wait`
        );
        this.onCompleted = null;
        this.close();

        scene.game.events.emit(events.buyGangster, { quantity: this.quantity, mintFunction: this.mintFunction });
      },
      'Buy',
      { fontSize: '82px', sound: 'buy' }
    );
    this.add(this.upgradeBtn);

    this.numberOfMachinesText = scene.add.text(this.popup.x + 150, this.popup.y - this.popup.height / 2 + 170, '0', {
      fontSize: fontSizes.extraLarge,
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.numberOfMachinesText);

    const rateY = this.popup.y - 295;
    this.rateText = scene.add.text(this.popup.x + 320, rateY, '0', largeBlackExtraBold).setOrigin(1, 0);
    this.rateIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, rateY + 80, '+0 /d', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.rateText);
    this.add(this.rateIncreaseText);

    this.networthText = scene.add
      .text(this.popup.x + 380, this.popup.y - 110, '0', largeBlackExtraBold)
      .setOrigin(1, 0);
    this.networthIncreaseText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y - 30, '+0', smallGreenBold)
      .setOrigin(1, 0);
    this.add(this.networthText);
    this.add(this.networthIncreaseText);

    this.roiText = scene.add
      .text(this.popup.x + this.popup.width * 0.4, this.popup.y + 100, '+0%', {
        fontSize: fontSizes.large,
        color: colors.green,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    this.add(this.roiText);

    const infoButton = new Button(
      scene,
      width / 2 + 60,
      this.popup.y + 260,
      'button-info',
      'button-info-pressed',
      () => {
        if (isSimulator) return;
        this.close();
        popupBuyBonusInfo.open();
      },
      { sound: 'open' }
    );
    this.add(infoButton);

    this.bonusText = scene.add.text(this.popup.x + 110, this.popup.y + 295, '0', largeBlackExtraBold).setOrigin(0, 0.5);
    this.add(this.bonusText);

    this.bonusCoin = scene.add
      .image(this.bonusText.x + this.bonusText.width + 20, this.popup.y + 295, 'coin')
      .setOrigin(0, 0.5);
    this.add(this.bonusCoin);

    const counterY = this.popup.y + this.popup.height / 2 - 260;
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
        if (this.quantity < this.maxQuantity) {
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
            if (this.quantity < this.maxQuantity) {
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

    this.priceTextX = this.popup.x + (isSimulator ? 200 : 160);
    this.priceText = scene.add.text(this.priceTextX, counterY, '0', largeBlackExtraBold).setOrigin(0, 0.5);
    this.add(this.priceText);

    // WL & referral mint
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
      .text(this.priceTextX, counterY + 48, 'Insufficient ETH', {
        fontSize: fontSizes.small,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, -1)
      .setVisible(false);
    this.add(this.insufficientBalance);

    this.coin = scene.add
      .image(this.priceText.x + this.priceText.width + 40, counterY, 'eth-coin')
      .setOrigin(0, 0.5)
      .setVisible(!isSimulator);
    this.add(this.coin);

    scene.game.events.on(events.completed, () => {
      this.quantity = DEFAULT_QUANTITY;
      this.updateValues();
    });

    scene.game.events.on('update-gas-mint', ({ gas }) => {
      if (isNaN(gas)) return;

      this.gas = gas;
      this.estimatedMaxPurchase =
        this.balance && this.unitPrice ? Math.floor((this.balance - this.gas) / this.unitPrice) : 0;
      this.updateValues();
    });

    scene.game.events.on(events.gameEnded, () => {
      this.upgradeBtn.setDisabledState(true);
    });
    scene.game.events.on(events.updateBuyBonus, ({ daysElapsed }) => {
      this.daysElapsed = daysElapsed;
      this.updateValues();
    });
    scene.game.events.on(
      events.updateMachines,
      ({
        numberOfMachines,
        networth,
        balance,
        basePrice,
        whitelistPrice,
        maxPerBatch,
        dailyReward,
        reservePool,
        reservePoolReward,
        networthIncrease,
        tokenPrice,
        isWhitelisted,
        whitelistAmountLeft,
        hasInviteCode,
        referralDiscount,
      }) => {
        this.balance = balance;
        this.basePrice = basePrice;
        this.whitelistPrice = whitelistPrice;
        this.numberOfMachines = numberOfMachines;
        this.networth = networth;
        this.networthIncrease = networthIncrease;
        this.rateIncrease = dailyReward;
        this.tokenPrice = tokenPrice;
        this.reservePool = reservePool;
        this.reservePoolReward = reservePoolReward;
        this.isWhitelisted = isWhitelisted;
        this.whitelistAmountLeft = whitelistAmountLeft;
        this.referralDiscount = referralDiscount;
        this.mintFunction = isWhitelisted && whitelistAmountLeft ? 'mintWL' : hasInviteCode ? 'mintReferral' : 'mint';
        this.unitPrice =
          this.mintFunction === 'mintWL' ? this.whitelistPrice : this.basePrice * (1 - this.referralDiscount);

        this.numberOfMachinesText.text = numberOfMachines.toLocaleString();

        this.networthText.text = `${networth.toLocaleString()}`;
        this.rateText.text = `${formatter.format(numberOfMachines * dailyReward)}`;
        this.estimatedMaxPurchase = balance && this.unitPrice ? Math.floor((balance - this.gas) / this.unitPrice) : 0;
        this.maxQuantity =
          isWhitelisted && whitelistAmountLeft ? Math.min(whitelistAmountLeft, maxPerBatch) : maxPerBatch;
        this.updateValues();
      }
    );

    scene.game.events.emit(events.requestMachines);
    scene.game.events.emit(events.requestBuyBonus);
    scene.game.events.emit('request-gas-mint');
  }

  cleanup() {
    this.onCompleted?.();
  }

  updateValues() {
    if (this.isSimulator) {
      this.priceText.text = 'SAMPLE';
      this.gasPrice.text = '';
      return;
    }
    this.networthIncreaseText.text = `+${(this.networthIncrease * this.quantity).toLocaleString()}`;
    this.rateIncreaseText.text = `+${(this.rateIncrease * this.quantity).toLocaleString()} /d`;

    const estimatedPrice = this.quantity * this.unitPrice;
    const roi = estimatedPrice
      ? (((this.rateIncrease * this.quantity * this.tokenPrice) / estimatedPrice) * 100).toFixed(1)
      : 0;
    const bonus = Math.floor(this.daysElapsed * this.rateIncrease * this.quantity);

    this.quantityText.text = `${this.quantity}`;
    this.roiText.text = `${roi}%`;
    this.bonusText.text = `${formatter.format(bonus)}`;
    this.bonusCoin.x = this.bonusText.x + this.bonusText.width + 20;
    this.priceText.text = `${formatter.format(this.quantity * this.basePrice)}`;
    const discountNote =
      this.mintFunction === 'mintReferral'
        ? ` (-${this.referralDiscount * 100}%)`
        : this.mintFunction === 'mintWL'
        ? ' (WL)'
        : '';
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
    this.upgradeBtn.setDisabledState(this.scene?.isGameEnded || insufficientBalance);
  }
}

export default PopupBuyGangster;
