import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { fontFamilies, colors } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

const buttonWidth = 506;
const largeBlackExtraBold = {
  fontSize: '72px',
  color: '#30030B',
  fontFamily: fontFamilies.extraBold,
};
const btnGap = 50;
const INTERVAL = 100;

class PopupWarMachines extends Popup {
  initEarnUnits = 0;
  initAttackUnits = 0;
  initDefendUnits = 0;

  tokenRewardPerEarner = 0;
  numberOfMachines = 0;
  earnUnits = 0;
  attackUnits = 0;
  defendUnits = 0;
  attackUser = null;
  workerBonusToken = 0;
  buildingBonus = 0;
  totalEarn = 0;
  loading = false;

  constructor(scene, { isSimulator, onClickInfoButton, onClickClose } = {}) {
    super(scene, 'popup-war-machines', { title: 'Gang War' });
    this.scene = scene;
    this.onClickClose = onClickClose;

    const events = {
      requestGamePlay: isSimulator ? 'simulator-request-game-play' : 'request-game-play',
      updateWarMachines: isSimulator ? 'simulator-update-war-machines' : 'update-war-machines',
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

    const infoButton = new Button(
      scene,
      width / 2 + this.popup.width / 2 - 100,
      height / 2 - this.popup.height / 2 + 220,
      'button-info',
      'button-info-pressed',
      () => {
        this.close();
        scene.popupWarExplain?.open();
        onClickInfoButton?.();
      },
      { sound: 'open' }
    );
    this.add(infoButton);

    const input1Y = this.popup.y - this.popup.height / 2 + 670;
    const input2Y = input1Y + 325;
    const input3Y = input1Y + 635;
    const minusBtnX = width / 2 - this.popup.width / 2 + 180;
    const addBtnX = width / 2 - 30;

    this.machinesToEarnMinusBtn = new TextButton(
      scene,
      minusBtnX,
      input1Y,
      'button-square-tiny',
      'button-square-tiny-pressed',
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
      addBtnX,
      input1Y,
      'button-square-tiny',
      'button-square-tiny-pressed',
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

    this.machinesToDefendMinusBtn = new TextButton(
      scene,
      minusBtnX,
      input2Y,
      'button-square-tiny',
      'button-square-tiny-pressed',
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
      addBtnX,
      input2Y,
      'button-square-tiny',
      'button-square-tiny-pressed',
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

    this.machinesToAttackMinusBtn = new TextButton(
      scene,
      minusBtnX,
      input3Y,
      'button-square-tiny',
      'button-square-tiny-pressed',
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
      addBtnX,
      input3Y,
      'button-square-tiny',
      'button-square-tiny-pressed',
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
        height / 2 - this.popup.height / 2 + 300,
        `Available Gangsters: ${this.numberOfMachines - this.earnUnits - this.attackUnits - this.defendUnits}`,
        {
          fontSize: '48px',
          color: '#7D2E00',
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfMachinesText);

    this.attackUserText = scene.add
      .text(
        width / 2,
        this.numberOfMachinesText.y + 70,
        `Raid Player: ${this.attackUser ? `@${this.attackUser.username}` : 'nil'}`,
        {
          fontSize: '50px',
          color: '#7C2828',
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0.5, 0.5);
    this.add(this.attackUserText);

    this.earnUnitsText = scene.add
      .text((minusBtnX + addBtnX) / 2, input1Y, `0`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.earnUnitsText);

    this.defendUnitsText = scene.add
      .text((minusBtnX + addBtnX) / 2, input2Y, `0`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.defendUnitsText);

    this.attackUnitsText = scene.add
      .text((minusBtnX + addBtnX) / 2, input3Y, `0`, largeBlackExtraBold)
      .setOrigin(0.5, 0.5);
    this.add(this.attackUnitsText);

    this.totalBonusText = scene.add
      .text(this.popup.x + 260, input1Y - 30, ``, {
        fontSize: '64px',
        color: '#fff',
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    this.totalBonusText.setStroke(colors.brown, 12);
    this.add(this.totalBonusText);

    this.workerBonusText1 = scene.add
      .text(this.popup.x + 300, input1Y + 40, `Including +0 as`, {
        fontSize: '36px',
        color: '#7D2E00',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0);
    this.add(this.workerBonusText1);

    this.workerBonusText2 = scene.add
      .text(this.popup.x + 300, input1Y + 80, `Goon Bonus`, {
        fontSize: '36px',
        color: '#7D2E00',
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0);
    this.add(this.workerBonusText2);

    this.defendBonusText = scene.add
      .text(this.popup.x + 290, input2Y - 10, ``, {
        fontSize: '64px',
        color: '#fff',
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    this.defendBonusText.setStroke(colors.brown, 12);
    this.add(this.defendBonusText);

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
        this.tokenRewardPerEarner = tokenRewardPerEarner;

        this.numberOfMachines = numberOfMachines;
        this.workerBonusToken = numberOfWorkers * (tokenRewardPerEarner || 0) * (workerBonusMultiple || 0);
        this.totalEarn = numberOfMachinesToEarn * tokenRewardPerEarner + this.workerBonusToken;
        this.buildingBonus = numberOfBuildings * (buildingBonusMultiple || 0);
        this.earnUnits = numberOfMachinesToEarn;
        this.attackUnits = numberOfMachinesToAttack;
        this.defendUnits = numberOfMachinesToDefend;
        this.attackUser = attackUser;

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
  }

  onOpen() {}

  cleanup() {
    this.earnUnits = this.initEarnUnits;
    this.attackUnits = this.initAttackUnits;
    this.defendUnits = this.initDefendUnits;
    this.updateValues();
  }

  updateValues() {
    this.numberOfMachinesText.text = `Available Gangsters: ${
      this.numberOfMachines - this.earnUnits - this.attackUnits - this.defendUnits
    }`;

    this.earnUnitsText.text = `${this.earnUnits}`;
    this.defendUnitsText.text = `${this.defendUnits}`;
    this.attackUnitsText.text = `${this.attackUnits}`;

    this.totalBonusText.text = `+${formatter.format(
      this.earnUnits * this.tokenRewardPerEarner + this.workerBonusToken
    )}`;
    this.workerBonusText1.text = `Including +${formatter.format(this.workerBonusToken)} as`;
    this.defendBonusText.text = `+${formatter.format(this.buildingBonus)}`;

    this.raidBtn.setDisabledState(!this.scene?.isUserActive);
    const isRaid = Boolean(this.attackUnits);
    this.raidBtn.updateText(isRaid ? 'Go Raid' : 'Confirm');
    const username = this.attackUser ? `@${this.attackUser.username}` : 'nil';
    this.attackUserText.text = `Raid Player: ${isRaid ? username : 'nil'}`;
  }
}

export default PopupWarMachines;
