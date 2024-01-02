import Phaser from 'phaser';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import { fontFamilies } from '../../../../utils/styles';
import configs from '../../configs/configs';

const { width, height } = configs;

const buttonWidth = 506;
const btnGap = 50;
const INTERVAL = 100;

class PopupWarMachines extends Popup {
  numberOfMachines = 0;
  earnUnits = 0;
  attackUnits = 0;
  defendUnits = 0;
  attackUser = null;
  loading = false;

  constructor(scene) {
    super(scene, 'popup-war-machines', { title: 'Gang War' });

    this.scene = scene;

    this.backBtn = new TextButton(
      scene,
      width / 2 - buttonWidth / 2 - btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      this.close,
      'Back',
      { sound: 'close', fontSize: '82px' }
    );
    this.add(this.backBtn);

    this.nextBtn = new TextButton(
      scene,
      width / 2 + buttonWidth / 2 + btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        if (this.loading) return;
        this.loading = true;
        scene.game.events.emit('update-war-machines', {
          numberOfMachines: this.numberOfMachines,
          numberOfMachinesToEarn: this.earnUnits,
          numberOfMachinesToAttack: this.attackUnits,
          numberOfMachinesToDefend: this.defendUnits,
        });
      },
      'Next',
      { sound: 'button-1', fontSize: '82px' }
    );
    this.add(this.nextBtn);

    this.infoBtn = scene.add
      .image(width / 2 + 310, height / 2 - this.popup.height / 2 + 250, 'icon-info-blue')
      .setOrigin(0.5, 0.5);
    this.infoBtn.setInteractive().on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.close();
      scene.popupWarExplain?.open();
    });
    this.add(this.infoBtn);

    const inputY = this.popup.y - this.popup.height / 2 + 520;
    const inputGap = 270;

    this.machinesToEarnInput = scene.add.image(width / 2, inputY, 'text-input-small').setOrigin(0.5, 0.5);
    this.add(this.machinesToEarnInput);
    this.machinesToEarnUnitsText = scene.add
      .text(width / 2, inputY, `${this.earnUnits}`, {
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
      inputY,
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
      inputY,
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
      .text(width / 2, inputY + 2 * inputGap + 150, `Available Gangsters: ${this.numberOfMachines}`, {
        fontSize: '50px',
        color: '#7C2828',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfMachinesText);

    this.attackUserText = scene.add
      .text(
        width / 2,
        this.numberOfMachinesText.y + 200,
        `Raid user: ${this.attackUser ? `@${this.attackUser.username}` : 'null'}`,
        {
          fontSize: '50px',
          color: '#7C2828',
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0.5, 0.5);
    this.add(this.attackUserText);

    scene.game.events.on(
      'update-game-play',
      ({
        numberOfMachines,
        numberOfMachinesToEarn,
        numberOfMachinesToAttack,
        numberOfMachinesToDefend,
        attackUser,
      }) => {
        this.numberOfMachines = numberOfMachines;
        this.earnUnits = numberOfMachinesToEarn;
        this.attackUnits = numberOfMachinesToAttack;
        this.defendUnits = numberOfMachinesToDefend;
        this.attackUser = attackUser;
        this.updateValues();
      }
    );

    scene.game.events.on('update-war-machines-completed', () => {
      this.loading = false;
      if (this.visible) {
        this.close();
        scene.popupWarAttack?.open();
      }
    });

    scene.game.events.emit('request-game-play');
  }

  updateValues() {
    this.machinesToEarnUnitsText.text = `${this.earnUnits}`;
    this.machinesToAttackUnitsText.text = `${this.attackUnits}`;
    this.machinesToDefendUnitsText.text = `${this.defendUnits}`;
    this.numberOfMachinesText.text = `Available Gangsters: ${this.numberOfMachines}`;
    this.attackUserText.text = `Raid user: ${this.attackUser ? `@${this.attackUser.username}` : 'null'}`;
  }
}

export default PopupWarMachines;
