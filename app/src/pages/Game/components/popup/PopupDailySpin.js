import Phaser from 'phaser';
import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import PopupTxnError from './PopupTxnError';
import SpinButton from '../button/SpinButton';
import configs from '../../configs/configs';
import { fontFamilies } from '../../../../utils/styles';
import { randomNumberInRange, formatTimeDigit } from '../../../../utils/numbers';

const { width, height } = configs;

const SPIN_ITEM_WIDTH = 560;
const SPIN_ITEM_HEIGHT = 634;
const SPIN_CONTAINER_WIDTH = 1195;
const SPIN_CONTAINER_HEIGHT = 900;
const SPIN_ITEM_GAP = 40;

class SpinItem extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type, value) {
    super(scene, 0, 0);

    const iconImg = type === 'house' ? 'spin-house' : 'spin-point';
    const text = type === 'house' ? `Safehouse x${value}` : `$GANG x${value}`;
    this.container = scene.add.sprite(x, y, 'spin-item').setOrigin(0.5, 0.5);
    this.icon = scene.add.image(x, y - 60, iconImg).setOrigin(0.5, 0.5);
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
  destinationIndex = null;
  preDestinationIndex = null;
  randomDistanceFromCenter = 0;
  spinXStep = 30;
  interval = null;

  constructor(scene) {
    super(scene, 'popup-spin', { title: 'Daily Spin' });

    this.spinSound = scene.sound.add('spin-sound', { loop: true });

    this.spinIncrementText = scene.add
      .text(this.popup.x, this.popup.y + this.popup.height / 2 - 330, '+1 spin in 00h00m00s', {
        fontSize: '72px',
        fontFamily: fontFamilies.extraBold,
        color: '#30030B',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.spinIncrementText);

    this.numberOfSpinsText = scene.add
      .text(this.popup.x, this.popup.y + this.popup.height / 2 - 220, '+1 spin in 00h00m00s', {
        fontSize: '48px',
        fontFamily: fontFamilies.bold,
        color: '#7D2E00',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfSpinsText);

    scene.game.events.on('update-spin-rewards', ({ spinRewards, spinPrice }) => {
      if (this.loading) return;
      this.spinRewards = spinRewards;
      this.spinPrice = spinPrice;
      this.numberOfRewards = spinRewards.length;

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

      this.spinItems = [spinRewards.at(-1), ...spinRewards, spinRewards[0], spinRewards[1]].map((item, index) => {
        const spinItem = new SpinItem(
          scene,
          SPIN_ITEM_WIDTH * (index + 1) + 40 * (index + 1),
          SPIN_CONTAINER_HEIGHT / 2 - 130,
          item.type,
          item.value
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
          if (!this.numberOfSpins) return;
          this.loading = true;
          this.spinButton?.setDisabledState(true);
          scene.game.events.emit('start-spin');
          this.spinSound.play();
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
        .image(width / 2, this.popup.y - this.popup.height / 2 + 160, 'arrow-spin-down')
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
      scene.game.events.emit('stop-spin');
      this.spinSound.stop();
      this.loading = false;
      this.destinationIndex = null;
      this.preDestinationIndex = null;
      this.randomDistanceFromCenter = 0;
      this.spinXStep = 30;
      this.popupTxnCompleted = new PopupTxnError({
        scene,
        code,
        description: message,
      });
      scene.add.existing(this.popupTxnCompleted);
      this.close();
    });

    scene.game.events.on('spin-result', ({ preDestinationIndex }) => {
      this.randomDistanceFromCenter = randomNumberInRange(-SPIN_ITEM_WIDTH / 2 + 50, SPIN_ITEM_WIDTH / 2 - 50);
      this.preDestinationIndex = preDestinationIndex;
    });

    scene.game.events.on('continue-spin', () => {
      if (!this.contentContainer) return;
      if (this.preDestinationIndex || this.preDestinationIndex === 0) {
        const preDestinationX =
          this.maxContainerX -
          this.preDestinationIndex * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP) +
          this.randomDistanceFromCenter;

        const diff = preDestinationX - this.contentContainer.x;
        if (diff > (this.numberOfRewards / 2) * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP)) {
          this.spinXStep = Math.max(this.spinXStep - 0.3, 5);
          if (Math.max(this.spinXStep, 5) === 5) {
            this.destinationIndex = this.preDestinationIndex;
          }
        }
      } else {
        this.spinXStep = Math.min(this.spinXStep + 1, 100);
      }
      this.contentContainer.x -= Math.round(this.spinXStep);

      if (this.contentContainer.x < this.minContainerX) {
        this.contentContainer.x += this.numberOfRewards * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP);
      }

      if (this.destinationIndex !== null) {
        const destinationX =
          this.maxContainerX -
          this.destinationIndex * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP) +
          this.randomDistanceFromCenter;

        if (
          this.contentContainer.x <= destinationX &&
          Math.abs(this.contentContainer.x - destinationX) < SPIN_ITEM_WIDTH / 2
        ) {
          const reward = this.spinRewards[this.destinationIndex];
          this.spinItems[this.destinationIndex + 1]?.container?.setTexture('spin-item-active');
          this.spinSound.stop();
          this.destinationIndex = null;
          this.preDestinationIndex = null;
          this.randomDistanceFromCenter = 0;
          this.spinXStep = 30;
          scene.game.events.emit('stop-spin', reward);
        }
      }
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

  resetSpinItemCard() {
    if (this.spinItems?.length) {
      this.spinItems.map((item) => item.container?.setTexture('spin-item'));
    }
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
