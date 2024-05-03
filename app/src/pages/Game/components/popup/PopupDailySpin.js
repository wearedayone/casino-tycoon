import Phaser from 'phaser';
import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import PopupTxnConfirm from './PopupConfirm';
import PopupTxnError from './PopupTxnError';
import SpinButton from '../button/SpinButton';
import configs from '../../configs/configs';
import { fontFamilies } from '../../../../utils/styles';
import { randomNumberInRange, formatTimeDigit, formatter } from '../../../../utils/numbers';

const { width, height } = configs;

const SPIN_ITEM_WIDTH = 560;
const SPIN_ITEM_HEIGHT = 656;
const SPIN_CONTAINER_WIDTH = 1195;
const SPIN_CONTAINER_HEIGHT = 900;
const SPIN_ITEM_GAP = 40;
const ALPHA = 0.5;
const SPIN_DURATION = 6000;
const SPIN_IN = 500;
const SPIN_OUT = 4000;

class SpinItem extends Phaser.GameObjects.Container {
  constructor(scene, x, y, item) {
    super(scene, 0, 0);

    const { type, value, iconImg, containerImg } = item;
    console.log({ type, value, iconImg, containerImg });
    this.containerImg = containerImg;

    const text = type === 'house' ? `Safehouse x${value}` : `$GREED x${value}`;
    this.container = scene.add.sprite(x, y, containerImg).setOrigin(0.5, 0.5);
    this.icon = scene.add.image(x, y - 60, iconImg).setOrigin(0.5, 0.5);
    this.icon.displayWidth = this.container.width * 0.8;
    this.icon.scaleY = this.icon.scaleX;
    this.text = scene.add
      .text(x, y + 190, text, { fontSize: 64, fontFamily: fontFamilies.extraBold })
      .setOrigin(0.5, 0.5);
    this.text.setStroke('#9E0A2E', 15);

    this.add(this.container);
    this.add(this.icon);
    this.add(this.text);
  }
}

class PopupDailySpin extends Popup {
  spinRewards = [];
  spinPrice = 0;
  ETHBalance = 0;
  tokenBalance = 0;
  numberOfRewards = 0;
  minContainerX = 0;
  maxContainerX = 0;
  numberOfSpins = 0;
  nextSpinIncrementTime = null;
  spinIncrementStep = 0;
  maxSpin = 0;
  interval = null;

  constructor(scene) {
    super(scene, 'popup-spin', { title: 'Spin to Win' });

    this.spinSound = scene.sound.add('spin-sound', { loop: false });

    this.spinIncrementText = scene.add
      .text(this.popup.x, this.popup.y + this.popup.height / 2 - 320, '+1 spin in 00h00m00s', {
        fontSize: '72px',
        fontFamily: fontFamilies.extraBold,
        color: '#30030B',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.spinIncrementText);

    this.numberOfSpinsContainer = scene.add
      .image(this.popup.x, this.popup.y + this.popup.height / 2 - 210, 'number-of-spin-container')
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfSpinsContainer);

    this.numberOfSpinsText = scene.add
      .text(this.popup.x, this.popup.y + this.popup.height / 2 - 210, '+1 spin in 00h00m00s', {
        fontSize: '48px',
        fontFamily: fontFamilies.bold,
        color: '#7D2E00',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfSpinsText);

    this.popupTxnConfirm = new PopupTxnConfirm(scene, this, {
      title: 'Spin',
      action: 'spin',
      icon1: '',
      icon2: 'icon-coin-small',
      onConfirm: () => {
        if (!this.numberOfSpins || this.loading) return;
        this.popupConfirm?.close();
        this.open();
        this.showPopupConfirmSpin();
      },
    });
    scene.add.existing(this.popupTxnConfirm);
    this.popupTxnConfirm.updateTextLeft(`Spin 1 time`);

    scene.game.events.on('update-spin-rewards', ({ spinRewards, spinPrice }) => {
      if (this.loading) return;
      this.spinRewards = spinRewards;
      this.spinPrice = spinPrice;
      this.numberOfRewards = spinRewards.length;

      this.popupTxnConfirm.updateTextRight(formatter.format(spinPrice.toPrecision(3)));

      this.maxContainerX = this.popup.x - this.popup.width / 2 - 1 * SPIN_ITEM_WIDTH - SPIN_ITEM_GAP;
      this.minContainerX = this.maxContainerX - this.numberOfRewards * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP);
      if (this.contentContainer) {
        this.spinItems.map((item) => {
          this.contentContainer.remove(item);
          item.destroy();
          this.contentContainer.destroy();
        });
      }
      if (this.table) {
        this.remove(this.table);
        this.table.destroy(true);
        this.table = null;
      }

      this.spinItems = [
        spinRewards.at(-1),
        ...spinRewards,
        ...spinRewards,
        ...spinRewards,
        spinRewards[0],
        spinRewards[1],
      ].map((item, index) => {
        console.log({ item });
        const spinItem = new SpinItem(
          scene,
          SPIN_ITEM_WIDTH * (index + 1) + 40 * (index + 1),
          SPIN_CONTAINER_HEIGHT / 2 - 110,
          item
        );

        return spinItem;
      });
      this.contentContainer = scene.add
        .container()
        .add(this.spinItems)
        .setSize(SPIN_ITEM_WIDTH * this.numberOfRewards + SPIN_ITEM_GAP * (this.numberOfRewards - 1), 0);

      this.table = new ScrollablePanel(this.scene, {
        x: width / 2,
        y: height / 2 - 65,
        width: SPIN_CONTAINER_WIDTH,
        height: SPIN_CONTAINER_HEIGHT,
        scrollMode: 'x',
        background: this.scene.rexUI.add.roundRectangle({ radius: 10 }),
        panel: { child: this.contentContainer, mask: { padding: 1 } },
        slider: {},
        mouseWheelScroller: { focus: true, speed: 0.3 },
        space: { left: 40, right: 40, top: 40, bottom: 40, header: 10, footer: 10 },
      }).layout();

      this.table.setMouseWheelScrollerEnable(false);
      this.table.setScrollerEnable(false);
      this.contentContainer.x = this.maxContainerX;
      this.add(this.table);

      if (this.spinButton) {
        this.remove(this.spinButton);
        this.spinButton.destroy();
      }

      this.spinButton = new SpinButton(scene, {
        x: width / 2,
        y: height / 2 + this.popup.height / 2 - 20,
        onClick: () => {
          if (!this.numberOfSpins || this.loading) return;
          this.close();
          this.popupTxnConfirm?.open();
          // this.showPopupConfirmSpin();
        },
        value: spinPrice,
      });
      this.spinButton.setDisabledState(true);
      this.add(this.spinButton);

      if (this.arrowDown) {
        this.remove(this.arrowDown);
        this.arrowDown.destroy();
      }
      this.arrowDown = scene.add
        .image(width / 2, this.popup.y - this.popup.height / 2 + 170, 'arrow-spin-down')
        .setOrigin(0.5, 0.5);
      this.add(this.arrowDown);

      if (this.arrowUp) {
        this.remove(this.arrowUp);
        this.arrowUp.destroy();
      }
      this.arrowUp = scene.add
        .image(width / 2, this.arrowDown.y + SPIN_ITEM_HEIGHT, 'arrow-spin-up')
        .setOrigin(0.5, 0.5);
      this.add(this.arrowUp);

      if (this.confirmation) {
        this.remove(this.confirmation);
        this.confirmation.destroy();
      }

      if (this.loadingIcon) {
        this.remove(this.loadingIcon);
        this.loadingIcon.destroy();
      }

      if (this.loadingAnimation) {
        this.loadingAnimation.remove();
      }

      this.confirmation = scene.add
        .image(this.popup.x, this.popup.y, 'spin-confirmation')
        .setOrigin(0.5, 0.5)
        .setVisible(false);
      this.add(this.confirmation);

      this.loadingIcon = scene.add
        .image(this.confirmation.x - this.confirmation.width / 2 + 130, this.confirmation.y - 10, 'icon-loading-small')
        .setOrigin(0.5, 0.5)
        .setVisible(false);
      this.add(this.loadingIcon);

      this.loadingAnimation = scene.tweens.add({
        targets: this.loadingIcon,
        rotation: Math.PI * 2, // full circle
        duration: 3000,
        repeat: -1, // infinite
        ease: 'Cubic.out',
      });

      this.checkSpinButtonState();
    });

    scene.game.events.on('update-badge-number', ({ numberOfSpins }) => {
      this.numberOfSpins = numberOfSpins;
      this.updateNumberOfSpinText();
      if (!this.loading) {
        this.checkSpinButtonState();
        this.resetSpinPosition();
      }
    });

    scene.game.events.on('update-balances', ({ ETHBalance, tokenBalance }) => {
      this.ETHBalance = ETHBalance;
      this.tokenBalance = tokenBalance;
      if (!this.loading) {
        this.checkSpinButtonState();
      }
    });

    scene.game.events.on('spin-error', ({ code, message }) => {
      this.spinSound.stop();
      this.loading = false;
      this.popupTxnCompleted = new PopupTxnError({
        scene,
        code,
        description: message,
      });
      scene.add.existing(this.popupTxnCompleted);
      this.hidePopupConfirmSpin();
      this.close();
      this.checkSpinButtonState();
    });

    scene.game.events.on('spin-result', ({ destinationIndex }) => {
      this.startSpinAnimation(destinationIndex);
    });

    scene.game.events.on('update-spin-config', ({ spinIncrementStep, maxSpin }) => {
      this.spinIncrementStep = spinIncrementStep;
      this.maxSpin = maxSpin;
      this.updateSpinIncrementText();
      this.updateNumberOfSpinText();
    });

    scene.game.events.on('update-next-spin-increment-time', ({ time }) => {
      console.log('update-next-spin-increment-time', time);
      this.nextSpinIncrementTime = time;
      if (this.interval) {
        clearInterval(this.interval);
      }
      this.interval = setInterval(() => {
        this.updateSpinIncrementText();
      }, 1000);
    });

    scene.game.events.emit('request-spin-rewards');
    scene.game.events.emit('request-balances');
    scene.game.events.emit('request-badge-number');
    scene.game.events.emit('request-spin-config');
    scene.game.events.emit('request-next-spin-increment-time');
  }

  checkSpinButtonState() {
    let valid = true;
    if (!this.ETHBalance || !this.tokenBalance || this.tokenBalance < this.spinPrice) {
      valid = false;
    }
    if (!this.numberOfSpins) {
      valid = false;
    }

    this.spinButton?.setDisabledState(!valid);
  }

  showPopupConfirmSpin() {
    this.loading = true;
    this.spinButton?.setDisabledState(true);
    this.spinIncrementText?.setAlpha(ALPHA);
    this.numberOfSpinsContainer?.setAlpha(ALPHA);
    this.numberOfSpinsText?.setAlpha(ALPHA);
    this.arrowDown?.setAlpha(ALPHA);
    this.arrowUp?.setAlpha(ALPHA);
    this.spinItems?.map((item) => item?.setAlpha(ALPHA));
    this.confirmation?.setVisible(true);
    this.loadingIcon?.setVisible(true);
    this.loadingAnimation?.resume();
    this.scene.game.events.emit('start-spin');
  }

  hidePopupConfirmSpin() {
    this.spinIncrementText?.setAlpha(1);
    this.numberOfSpinsContainer?.setAlpha(1);
    this.numberOfSpinsText?.setAlpha(1);
    this.arrowDown?.setAlpha(1);
    this.arrowUp?.setAlpha(1);
    this.spinItems?.map((item) => item?.setAlpha(1));
    this.confirmation?.setVisible(false);
    this.loadingIcon?.setVisible(false);
    this.loadingAnimation?.pause();
  }

  startSpinAnimation(destinationIndex) {
    this.hidePopupConfirmSpin();

    const randomDistanceFromCenter = randomNumberInRange(-SPIN_ITEM_WIDTH / 2 + 50, SPIN_ITEM_WIDTH / 2 - 50);
    const reward = this.spinRewards[destinationIndex];

    const destinationX =
      this.maxContainerX -
      destinationIndex * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP) -
      2 * this.numberOfRewards * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP) +
      randomDistanceFromCenter;

    this.scene.tweens.add({
      targets: this.contentContainer,
      x: [this.maxContainerX, destinationX],
      duration: SPIN_DURATION,
      ease: 'Cubic.InOut',
      easeParams: [SPIN_IN, SPIN_OUT],
      onStart: () => {
        setTimeout(() => {
          this.spinSound.play();
        }, 100);
      },
      onComplete: () => {
        setTimeout(() => {
          this.loading = false;
          this.close();
          this.checkSpinButtonState();
          this.contentContainer.x = this.maxContainerX;
          this.scene.popupSpinReward?.showReward(reward);
        }, 2000);
      },
    });
  }

  updateSpinIncrementText() {
    if (!this.nextSpinIncrementTime) return;
    const now = Date.now();
    const diffInSeconds = (this.nextSpinIncrementTime - now) / 1000;

    if (diffInSeconds <= 0) {
      clearInterval(this.interval);
      this.interval = null;
      this.scene.game.events.emit('request-next-spin-increment-time');
      return;
    }

    const hours = Math.floor(diffInSeconds / 3600);
    const mins = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = Math.round(diffInSeconds % 60);
    this.spinIncrementText.text = `+${this.spinIncrementStep} spin${
      this.spinIncrementStep > 1 ? 's' : ''
    } in ${formatTimeDigit(hours)}h${formatTimeDigit(mins)}m${formatTimeDigit(seconds)}s`;
  }

  updateNumberOfSpinText() {
    this.numberOfSpinsText.text = `${this.numberOfSpins}/${this.maxSpin} left`;
  }

  resetSpinPosition() {
    this.contentContainer && (this.contentContainer.x = this.maxContainerX);
  }

  onOpen() {
    this.scene.game.events.emit('request-next-spin-increment-time');
  }

  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default PopupDailySpin;
