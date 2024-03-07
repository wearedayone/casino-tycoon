import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

const buttonWidth = 506;
const largeBlackExtraBold = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
};
const btnGap = 50;
const INTERVAL = 100;

class PopupWarMachines extends Popup {
  initEarnUnits = 0;
  initAttackUnits = 0;
  initDefendUnits = 0;

  numberOfMachines = 0;
  earnUnits = 0;
  attackUnits = 0;
  defendUnits = 0;
  attackUser = null;
  workerBonusToken = 0;
  buildingBonus = 0;
  loading = false;

  constructor(scene, { isSimulator, onClickInfoButton, onClickClose } = {}) {
    super(scene, 'popup-war-machines', { title: 'Gang War' });
    this.scene = scene;
    this.onClickClose = onClickClose;

    const events = {
      requestNextWarTime: isSimulator ? 'simulator-request-next-war-time' : 'request-next-war-time',
      updateNextWarTime: isSimulator ? 'simulator-update-next-war-time' : 'update-next-war-time',
      requestGamePlay: isSimulator ? 'simulator-request-game-play' : 'request-game-play',
      updateWarMachines: isSimulator ? 'simulator-update-war-machines' : 'update-war-machines',
      updateWarMachinesCompleted: isSimulator
        ? 'simulator-update-war-machines-completed'
        : 'update-war-machines-completed',
      updateWarMachinesError: isSimulator ? 'simulator-update-war-machines-error' : 'update-war-machines-error',
      updateGamePlay: isSimulator ? 'simulator-update-game-play' : 'update-game-play',
    };
    this.events = events;

    const sliderWidth = this.popup.width * 0.5;

    this.backBtn = new TextButton(
      scene,
      width / 2 - buttonWidth / 2 - btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        scene.game.events.emit(events.updateWarMachines, {
          numberOfMachines: this.numberOfMachines,
          numberOfMachinesToEarn: this.earnUnits,
          numberOfMachinesToAttack: this.attackUnits,
          numberOfMachinesToDefend: this.defendUnits,
        });
        this.close();
        this.onClickClose?.();
      },
      'Back',
      { sound: 'close', fontSize: '82px' }
    );
    this.add(this.backBtn);

    this.raidBtn = new TextButton(
      scene,
      width / 2 + buttonWidth / 2 + btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        if (this.loading || isSimulator) return;
        this.loading = true;
        scene.game.events.emit(events.updateWarMachines, {
          numberOfMachines: this.numberOfMachines,
          numberOfMachinesToEarn: this.earnUnits,
          numberOfMachinesToAttack: this.attackUnits,
          numberOfMachinesToDefend: this.defendUnits,
        });
      },
      'Go Raid',
      { sound: 'button-1', fontSize: '82px' }
    );
    this.add(this.raidBtn);

    this.infoBtn = scene.add
      .image(width / 2 + this.popup.width / 2 - 100, height / 2 - this.popup.height / 2 + 220, 'icon-info-blue')
      .setOrigin(0.5, 0.5);
    this.infoBtn.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.close();
      scene.popupWarExplain?.open();
      onClickInfoButton?.();
    });
    this.add(this.infoBtn);

    this.timeText = scene.add.text(width / 2 + 100, this.popup.y - this.popup.height / 2 + 298, '0h 00m', {
      fontSize: '50px',
      color: '#29000B',
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.timeText);

    const inputY = this.popup.y - this.popup.height / 2 + 650;
    const inputGap = 370;
    const sliderGap = inputGap + 15;
    const sliderY = inputY - 20;
    const sliderThumbX = this.popup.x - sliderWidth / 2 + 50;
    const minusBtnX = width / 2 - this.popup.width / 2 + 180;
    const addBtnX = width / 2 + this.popup.width / 2 - 180;

    const earnSliderBg = scene.rexUI.add.roundRectangle(width / 2, sliderY, sliderWidth, 30, 30, 0xd68d6a);
    this.add(earnSliderBg);
    const onChangeEarnQuantity = (value, _, slider) => {
      if (!slider) {
        slider = this.earnSlider;
        slider.setValue(value);
      }

      if (this.loading) {
        if (this.earnSlider) this.earnSlider.value = this.earnSlideValue;
        return;
      }
      const maxPurchase = this.numberOfMachines;

      if (maxPurchase === 0) {
        if (this.earnSlider) {
          this.earnSlider.value = 0;
          this.earnSlideValue = 0;
          if (this.earnSliderThumb) {
            this.earnSliderThumb.x = sliderThumbX;
            this.earnSliderThumbText.x = sliderThumbX;
          }
          return;
        }
      }

      const availableQuantity = this.numberOfMachines - this.defendUnits - this.attackUnits;
      const quantity = Math.round(value * maxPurchase);
      if (quantity > availableQuantity) return slider.setValue(availableQuantity / maxPurchase);

      this.earnSlideValue = value;

      if (this.earnSliderThumb) {
        const increaseX = value * sliderWidth - value * 70;
        this.earnSliderThumb.x = sliderThumbX + increaseX;
        this.earnSliderThumbText.x = sliderThumbX + increaseX;

        this.earnSliderThumbText.text = `+${quantity}`;
        this.earnUnits = quantity;
        this.updateValues();
      }
    };
    this.earnSlider = scene.rexUI.add
      .slider({
        x: width / 2,
        y: sliderY,
        width: sliderWidth,
        height: 40,
        orientation: 'x',
        track: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 70, 0xd68d6a, 0),
        thumb: scene.rexUI.add.roundRectangle(0, 0, 70, 70, 35, 0xffffff),
        indicator: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 30, 0x5ef736),
        valuechangeCallback: onChangeEarnQuantity,
        space: { top: 4, bottom: 4 },
        input: 'click', // 'drag'|'click'
      })
      .layout();
    this.add(this.earnSlider);

    this.earnSliderThumb = scene.add.image(sliderThumbX, sliderY + 35, 'slider-thumb').setOrigin(0.5, 1);
    this.earnSliderThumb.setDepth(5);
    this.earnSliderThumbText = scene.add
      .text(sliderThumbX, sliderY - 65, `+0`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.earnSliderThumb);
    this.add(this.earnSliderThumbText);

    this.machinesToEarnMinusBtn = new TextButton(
      scene,
      minusBtnX,
      inputY - 20,
      'button-square-small',
      'button-square-small-pressed',
      () => {
        if (this.earnUnits > 0) {
          this.earnUnits--;
          onChangeEarnQuantity(this.earnUnits / this.numberOfMachines);
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
            if (this.earnUnits > 0) {
              this.earnUnits--;
              onChangeEarnQuantity(this.earnUnits / this.numberOfMachines);
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
    this.add(this.machinesToEarnMinusBtn);

    this.machinesToEarnPlusBtn = new TextButton(
      scene,
      addBtnX,
      inputY - 20,
      'button-square-small',
      'button-square-small-pressed',
      () => {
        const max = this.numberOfMachines - this.attackUnits - this.defendUnits;
        if (this.earnUnits < max) {
          this.earnUnits++;
          onChangeEarnQuantity(this.earnUnits / this.numberOfMachines);
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
          const max = this.numberOfMachines - this.attackUnits - this.defendUnits;
          this.interval = setInterval(() => {
            if (this.earnUnits < max) {
              this.earnUnits++;
              onChangeEarnQuantity(this.earnUnits / this.numberOfMachines);
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
    this.add(this.machinesToEarnPlusBtn);

    this.workerBonusTokenText = scene.add
      .text(width / 2, inputY + 95, `Goon Bonus: ${formatter.format(this.workerBonusToken)} $FIAT`, {
        fontSize: '50px',
        color: '#7C2828',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.workerBonusTokenText);

    const defendSliderBg = scene.rexUI.add.roundRectangle(
      width / 2,
      sliderY + sliderGap,
      sliderWidth,
      30,
      30,
      0xd68d6a
    );
    this.add(defendSliderBg);
    const onChangeDefendQuantity = (value, _, slider) => {
      if (!slider) {
        slider = this.defendSlider;
        slider.setValue(value);
      }

      if (this.loading) {
        if (this.defendSlider) this.defendSlider.value = this.defendSlideValue;
        return;
      }
      const maxPurchase = this.numberOfMachines;

      if (maxPurchase === 0) {
        if (this.defendSlider) {
          this.defendSlider.value = 0;
          this.defendSlideValue = 0;
          if (this.defendSliderThumb) {
            this.defendSliderThumb.x = sliderThumbX;
            this.defendSliderThumbText.x = sliderThumbX;
          }
          return;
        }
      }

      const availableQuantity = this.numberOfMachines - this.earnUnits - this.attackUnits;
      const quantity = Math.round(value * maxPurchase);
      if (quantity > availableQuantity) return slider.setValue(availableQuantity / maxPurchase);

      this.defendSlideValue = value;

      if (this.defendSliderThumb) {
        const increaseX = value * sliderWidth - value * 70;
        this.defendSliderThumb.x = sliderThumbX + increaseX;
        this.defendSliderThumbText.x = sliderThumbX + increaseX;

        this.defendSliderThumbText.text = `+${quantity}`;
        this.defendUnits = quantity;
        this.updateValues();
      }
    };
    this.defendSlider = scene.rexUI.add
      .slider({
        x: width / 2,
        y: sliderY + sliderGap,
        width: sliderWidth,
        height: 40,
        orientation: 'x',

        track: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 70, 0xd68d6a, 0),
        thumb: scene.rexUI.add.roundRectangle(0, 0, 70, 70, 35, 0xffffff),
        indicator: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 30, 0x5ef736),

        valuechangeCallback: onChangeDefendQuantity,
        space: { top: 4, bottom: 4 },
        input: 'click', // 'drag'|'click'
      })
      .layout();
    this.add(this.defendSlider);

    this.defendSliderThumb = scene.add.image(sliderThumbX, sliderY + sliderGap + 35, 'slider-thumb').setOrigin(0.5, 1);
    this.defendSliderThumb.setDepth(5);
    this.defendSliderThumbText = scene.add
      .text(sliderThumbX, sliderY + sliderGap - 65, `+0`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.defendSliderThumb);
    this.add(this.defendSliderThumbText);

    this.machinesToDefendMinusBtn = new TextButton(
      scene,
      minusBtnX,
      inputY + inputGap,
      'button-square-small',
      'button-square-small-pressed',
      () => {
        if (this.defendUnits > 0) {
          this.defendUnits--;
          onChangeDefendQuantity(this.defendUnits / this.numberOfMachines);
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
            if (this.defendUnits > 0) {
              this.defendUnits--;
              onChangeDefendQuantity(this.defendUnits / this.numberOfMachines);
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
    this.add(this.machinesToDefendMinusBtn);

    this.machinesToDefendPlusBtn = new TextButton(
      scene,
      addBtnX,
      inputY + inputGap,
      'button-square-small',
      'button-square-small-pressed',
      () => {
        const max = this.numberOfMachines - this.attackUnits - this.earnUnits;
        if (this.defendUnits < max) {
          this.defendUnits++;
          onChangeDefendQuantity(this.defendUnits / this.numberOfMachines);
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
          const max = this.numberOfMachines - this.attackUnits - this.earnUnits;
          this.interval = setInterval(() => {
            if (this.defendUnits < max) {
              this.defendUnits++;
              onChangeDefendQuantity(this.defendUnits / this.numberOfMachines);
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
    this.add(this.machinesToDefendPlusBtn);

    this.buildingBonusText = scene.add
      .text(width / 2, inputY + inputGap + 115, `Safehouse Bonus: ${formatter.format(this.buildingBonus)}`, {
        fontSize: '50px',
        color: '#7C2828',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.buildingBonusText);

    const attackSliderBg = scene.rexUI.add.roundRectangle(
      width / 2,
      sliderY + 2 * sliderGap,
      sliderWidth,
      30,
      30,
      0xd68d6a
    );
    this.add(attackSliderBg);
    const onChangeAttackQuantity = (value, _, slider) => {
      if (!slider) {
        slider = this.attackSlider;
        slider.setValue(value);
      }

      if (this.loading) {
        if (this.attackSlider) this.attackSlider.value = this.attackSlideValue;
        return;
      }
      const maxPurchase = this.numberOfMachines;

      if (maxPurchase === 0) {
        if (this.attackSlider) {
          this.attackSlider.value = 0;
          this.attackSlideValue = 0;
          if (this.attackSliderThumb) {
            this.attackSliderThumb.x = sliderThumbX;
            this.attackSliderThumbText.x = sliderThumbX;
          }
          return;
        }
      }

      const availableQuantity = this.numberOfMachines - this.earnUnits - this.defendUnits;
      const quantity = Math.round(value * maxPurchase);
      if (quantity > availableQuantity) return slider.setValue(availableQuantity / maxPurchase);

      this.attackSlideValue = value;

      if (this.attackSliderThumb) {
        const increaseX = value * sliderWidth - value * 70;
        this.attackSliderThumb.x = sliderThumbX + increaseX;
        this.attackSliderThumbText.x = sliderThumbX + increaseX;

        this.attackSliderThumbText.text = `+${quantity}`;
        this.attackUnits = quantity;
        this.updateValues();
      }
    };
    this.attackSlider = scene.rexUI.add
      .slider({
        x: width / 2,
        y: sliderY + 2 * sliderGap,
        width: sliderWidth,
        height: 40,
        orientation: 'x',

        track: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 70, 0xd68d6a, 0),
        thumb: scene.rexUI.add.roundRectangle(0, 0, 70, 70, 35, 0xffffff),
        indicator: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 30, 0x5ef736),

        valuechangeCallback: onChangeAttackQuantity,
        space: { top: 4, bottom: 4 },
        input: 'click', // 'drag'|'click'
      })
      .layout();
    this.add(this.attackSlider);

    this.attackSliderThumb = scene.add
      .image(sliderThumbX, sliderY + 2 * sliderGap + 35, 'slider-thumb')
      .setOrigin(0.5, 1);
    this.attackSliderThumb.setDepth(5);
    this.attackSliderThumbText = scene.add
      .text(sliderThumbX, sliderY + 2 * sliderGap - 65, `+0`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.attackSliderThumb);
    this.add(this.attackSliderThumbText);

    this.machinesToAttackMinusBtn = new TextButton(
      scene,
      minusBtnX,
      inputY + 2 * inputGap,
      'button-square-small',
      'button-square-small-pressed',
      () => {
        if (this.attackUnits > 0) {
          this.attackUnits--;
          onChangeAttackQuantity(this.attackUnits / this.numberOfMachines);
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
            if (this.attackUnits > 0) {
              this.attackUnits--;
              onChangeAttackQuantity(this.attackUnits / this.numberOfMachines);
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
    this.add(this.machinesToAttackMinusBtn);

    this.machinesToAttackPlusBtn = new TextButton(
      scene,
      addBtnX,
      inputY + 2 * inputGap,
      'button-square-small',
      'button-square-small-pressed',
      () => {
        const max = this.numberOfMachines - this.defendUnits - this.earnUnits;
        if (this.attackUnits < max) {
          this.attackUnits++;
          onChangeAttackQuantity(this.attackUnits / this.numberOfMachines);
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
          const max = this.numberOfMachines - this.defendUnits - this.earnUnits;
          this.interval = setInterval(() => {
            if (this.attackUnits < max) {
              this.attackUnits++;
              onChangeAttackQuantity(this.attackUnits / this.numberOfMachines);
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
    this.add(this.machinesToAttackPlusBtn);

    this.numberOfMachinesText = scene.add
      .text(
        width / 2,
        inputY + 2 * inputGap + 200,
        `Unallocated Gangsters: ${this.numberOfMachines - this.earnUnits - this.attackUnits - this.defendUnits}`,
        {
          fontSize: '50px',
          color: '#7C2828',
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfMachinesText);

    this.attackUserText = scene.add
      .text(
        width / 2,
        this.numberOfMachinesText.y + 130,
        `Raid Player: ${this.attackUser ? `@${this.attackUser.username}` : 'nil'}`,
        {
          fontSize: '50px',
          color: '#7C2828',
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0.5, 0.5);
    this.add(this.attackUserText);

    scene.game.events.on(events.updateNextWarTime, ({ time }) => {
      const now = Date.now();
      const diffInMins = (time - now) / (60 * 1000);
      const hours = Math.floor(diffInMins / 60);
      const mins = Math.floor(diffInMins % 60);

      const timeText = `${hours}h ${mins.toString().padStart(2, '0')}m`;
      this.timeText.text = timeText;
    });

    scene.game.events.on(
      events.updateGamePlay,
      ({
        numberOfMachines,
        numberOfWorkers,
        numberOfBuildings,
        numberOfMachinesToEarn,
        numberOfMachinesToAttack,
        numberOfMachinesToDefend,
        attackUser,
        workerBonusMultiple,
        buildingBonusMultiple,
        tokenRewardPerEarner,
      }) => {
        this.initEarnUnits = numberOfMachinesToEarn;
        this.initAttackUnits = numberOfMachinesToAttack;
        this.initDefendUnits = numberOfMachinesToDefend;

        this.numberOfMachines = numberOfMachines;
        this.workerBonusToken = numberOfWorkers * (tokenRewardPerEarner || 0) * (workerBonusMultiple || 0);
        this.buildingBonus = numberOfBuildings * (buildingBonusMultiple || 0);
        this.earnUnits = numberOfMachinesToEarn;
        this.attackUnits = numberOfMachinesToAttack;
        this.defendUnits = numberOfMachinesToDefend;
        this.attackUser = attackUser;

        onChangeEarnQuantity(this.earnUnits / this.numberOfMachines);
        onChangeDefendQuantity(this.defendUnits / this.numberOfMachines);
        onChangeAttackQuantity(this.attackUnits / this.numberOfMachines);
        this.updateValues();
      }
    );

    scene.game.events.on(events.updateWarMachinesCompleted, ({ numberOfMachinesToAttack }) => {
      this.loading = false;
      if (this.visible) {
        this.close();
        if (!numberOfMachinesToAttack) return;
        scene.popupWarAttackConfirmation?.updateNumberOfMachines(numberOfMachinesToAttack);
        scene.popupWarAttack?.open();
      }
    });

    scene.game.events.on(events.updateWarMachinesError, () => {
      this.loading = false;
    });

    scene.game.events.emit(events.requestGamePlay);
    scene.game.events.emit(events.requestNextWarTime);
  }

  onOpen() {
    this.scene.game.events.emit(this.events.requestNextWarTime);
  }

  cleanup() {
    this.earnUnits = this.initEarnUnits;
    this.attackUnits = this.initAttackUnits;
    this.defendUnits = this.initDefendUnits;
    this.updateValues();
  }

  updateValues() {
    this.numberOfMachinesText.text = `Unallocated Gangsters: ${
      this.numberOfMachines - this.earnUnits - this.attackUnits - this.defendUnits
    }`;
    this.workerBonusTokenText.text = `Goon Bonus: ${formatter.format(this.workerBonusToken)} $FIAT`;
    this.buildingBonusText.text = `Safehouse Bonus: ${formatter.format(this.buildingBonus)}`;

    this.raidBtn.setDisabledState(!this.scene?.isUserActive);
    const isRaid = Boolean(this.attackUnits);
    this.raidBtn.updateText(isRaid ? 'Go Raid' : 'Confirm');
    const username = this.attackUser ? `@${this.attackUser.username}` : 'nil';
    this.attackUserText.text = `Raid Player: ${isRaid ? username : 'nil'}`;
  }
}

export default PopupWarMachines;
