import Phaser from 'phaser';
import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import PopupTxnError from './PopupTxnError';
import SpinButton from '../button/SpinButton';
import configs from '../../configs/configs';
import { fontFamilies } from '../../../../utils/styles';

const { width, height } = configs;

const SPIN_ITEM_WIDTH = 560;
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
  destinationIndex = null;
  numberOfSpins = null;

  constructor(scene) {
    super(scene, 'popup-spin', { title: 'Daily Spin' });

    this.spinSound = scene.sound.add('spin-sound', { loop: true });

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

      this.spinItems = [spinRewards.at(-1), ...spinRewards, spinRewards[0]].map((item, index) => {
        const spinItem = new SpinItem(
          scene,
          SPIN_ITEM_WIDTH * (index + 1) + 40 * (index + 1),
          SPIN_CONTAINER_HEIGHT / 2,
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
        .image(width / 2, this.popup.y + this.popup.height / 2 - 190, 'arrow-spin-up')
        .setOrigin(0.5, 0.5);
      this.add(this.arrowUp);

      this.checkSpinButtonState();
    });

    scene.game.events.on('update-badge-number', ({ numberOfSpins }) => {
      this.numberOfSpins = numberOfSpins;
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
      this.popupTxnCompleted = new PopupTxnError({
        scene,
        code,
        description: message,
      });
      scene.add.existing(this.popupTxnCompleted);
      this.close();
    });

    scene.game.events.on('spin-result', ({ destinationIndex }) => {
      this.destinationIndex = destinationIndex;
    });

    scene.game.events.on('continue-spin', () => {
      if (!this.contentContainer) return;
      this.contentContainer.x -= 50;
      if (this.contentContainer.x < this.minContainerX) {
        this.contentContainer.x += this.numberOfRewards * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP);
      }

      if (this.destinationIndex !== null) {
        const destinationX = this.maxContainerX - this.destinationIndex * (SPIN_ITEM_WIDTH + SPIN_ITEM_GAP);
        if (
          this.contentContainer.x <= destinationX &&
          Math.abs(this.contentContainer.x - destinationX) < SPIN_ITEM_WIDTH / 2
        ) {
          const reward = this.spinRewards[this.destinationIndex];
          this.spinItems[this.destinationIndex + 1]?.container?.setTexture('spin-item-active');
          this.spinSound.stop();
          this.destinationIndex = null;
          scene.game.events.emit('stop-spin', reward);
        }
      }
    });

    scene.game.events.emit('request-spin-rewards');
    scene.game.events.emit('request-balances');
    scene.game.events.emit('request-badge-number');
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

  resetSpinPosition() {
    this.contentContainer && (this.contentContainer.x = this.maxContainerX);
  }

  resetSpinItemCard() {
    if (this.spinItems?.length) {
      this.spinItems.map((item) => item.container?.setTexture('spin-item'));
    }
  }
}

export default PopupDailySpin;
