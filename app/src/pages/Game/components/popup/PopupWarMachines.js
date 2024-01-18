import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import { fontFamilies } from '../../../../utils/styles';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

const buttonWidth = 506;
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
      updateWarMachinesCompleted: isSimulator
        ? 'simulator-update-war-machines-completed'
        : 'update-war-machines-completed',
      updateWarMachinesError: isSimulator ? 'simulator-update-war-machines-error' : 'update-war-machines-error',
      updateGamePlay: isSimulator ? 'simulator-update-game-play' : 'update-game-play',
    };
    this.events = events;

    this.backBtn = new TextButton(
      scene,
      width / 2 - buttonWidth / 2 - btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
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
        scene.game.events.emit('update-war-machines', {
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

    const inputY = this.popup.y - this.popup.height / 2 + 630;
    const inputGap = 370;

    this.machinesToEarnInput = scene.add.image(width / 2, inputY - 20, 'text-input-small').setOrigin(0.5, 0.5);
    this.add(this.machinesToEarnInput);
    this.machinesToEarnUnitsText = scene.add
      .text(width / 2, inputY - 20, `${this.earnUnits}`, {
        color: '#29000B',
        fontSize: '78px',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.machinesToEarnUnitsText);

    const minusBtnX = width / 2 - this.popup.width / 2 + 230;
    // const minusBtnX = 200;

    this.machinesToEarnMinusBtn = new TextButton(
      scene,
      minusBtnX,
      inputY - 20,
      'button-square',
      'button-square-pressed',
      () => {
        if (this.earnUnits > 0) {
          this.earnUnits--;
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
            if (this.earnUnits > 0) {
              this.earnUnits--;
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
    this.add(this.machinesToEarnMinusBtn);

    this.machinesToEarnPlusBtn = new TextButton(
      scene,
      minusBtnX + 740,
      inputY - 20,
      'button-square',
      'button-square-pressed',
      () => {
        const max = this.numberOfMachines - this.attackUnits - this.defendUnits;
        if (this.earnUnits < max) {
          this.earnUnits++;
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
          const max = this.numberOfMachines - this.attackUnits - this.defendUnits;
          this.interval = setInterval(() => {
            if (this.earnUnits < max) {
              this.earnUnits++;
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
    this.add(this.machinesToEarnPlusBtn);

    this.workerBonusTokenText = scene.add
      .text(width / 2, inputY + 95, `Goon Bonus: ${formatter.format(this.workerBonusToken)} $FIAT`, {
        fontSize: '50px',
        color: '#7C2828',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.workerBonusTokenText);

    this.machinesToDefendInput = scene.add.image(width / 2, inputY + inputGap, 'text-input-small').setOrigin(0.5, 0.5);
    this.add(this.machinesToDefendInput);
    this.machinesToDefendUnitsText = scene.add
      .text(width / 2, inputY + inputGap, `${this.defendUnits}`, {
        color: '#29000B',
        fontSize: '78px',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.machinesToDefendUnitsText);

    this.machinesToDefendMinusBtn = new TextButton(
      scene,
      minusBtnX,
      inputY + inputGap,
      'button-square',
      'button-square-pressed',
      () => {
        if (this.defendUnits > 0) {
          this.defendUnits--;
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
            if (this.defendUnits > 0) {
              this.defendUnits--;
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
    this.add(this.machinesToDefendMinusBtn);

    this.machinesToDefendPlusBtn = new TextButton(
      scene,
      minusBtnX + 740,
      inputY + inputGap,
      'button-square',
      'button-square-pressed',
      () => {
        const max = this.numberOfMachines - this.attackUnits - this.earnUnits;
        if (this.defendUnits < max) {
          this.defendUnits++;
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
          const max = this.numberOfMachines - this.attackUnits - this.earnUnits;
          this.interval = setInterval(() => {
            if (this.defendUnits < max) {
              this.defendUnits++;
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
    this.add(this.machinesToDefendPlusBtn);

    this.buildingBonusText = scene.add
      .text(width / 2, inputY + inputGap + 115, `Safehouse Bonus: ${formatter.format(this.buildingBonus)}`, {
        fontSize: '50px',
        color: '#7C2828',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.buildingBonusText);

    this.machinesToAttackInput = scene.add
      .image(width / 2, inputY + 2 * inputGap, 'text-input-small')
      .setOrigin(0.5, 0.5);
    this.add(this.machinesToAttackInput);
    this.machinesToAttackUnitsText = scene.add
      .text(width / 2, inputY + 2 * inputGap, `${this.attackUnits}`, {
        color: '#29000B',
        fontSize: '78px',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.machinesToAttackUnitsText);

    this.machinesToAttackMinusBtn = new TextButton(
      scene,
      minusBtnX,
      inputY + 2 * inputGap,
      'button-square',
      'button-square-pressed',
      () => {
        if (this.attackUnits > 0) {
          this.attackUnits--;
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
            if (this.attackUnits > 0) {
              this.attackUnits--;
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
    this.add(this.machinesToAttackMinusBtn);

    this.machinesToAttackPlusBtn = new TextButton(
      scene,
      minusBtnX + 740,
      inputY + 2 * inputGap,
      'button-square',
      'button-square-pressed',
      () => {
        const max = this.numberOfMachines - this.defendUnits - this.earnUnits;
        if (this.attackUnits < max) {
          this.attackUnits++;
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
          const max = this.numberOfMachines - this.defendUnits - this.earnUnits;
          this.interval = setInterval(() => {
            if (this.attackUnits < max) {
              this.attackUnits++;
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
        this.updateValues();
      }
    );

    scene.game.events.on(events.updateWarMachinesCompleted, () => {
      this.loading = false;
      if (this.visible) {
        scene.popupWarAttackConfirmation?.updateNumberOfMachines(this.attackUnits);
        this.close();
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
    this.machinesToEarnUnitsText.text = `${this.earnUnits}`;
    this.machinesToAttackUnitsText.text = `${this.attackUnits}`;
    this.machinesToDefendUnitsText.text = `${this.defendUnits}`;
    this.numberOfMachinesText.text = `Unallocated Gangsters: ${
      this.numberOfMachines - this.earnUnits - this.attackUnits - this.defendUnits
    }`;
    this.attackUserText.text = `Raid Player: ${this.attackUser ? `@${this.attackUser.username}` : 'nil'}`;
    this.workerBonusTokenText.text = `Goon Bonus: ${formatter.format(this.workerBonusToken)} $FIAT`;
    this.buildingBonusText.text = `Safehouse Bonus: ${formatter.format(this.buildingBonus)}`;

    this.raidBtn.setDisabledState(!this.scene?.isUserActive);
  }
}

export default PopupWarMachines;
