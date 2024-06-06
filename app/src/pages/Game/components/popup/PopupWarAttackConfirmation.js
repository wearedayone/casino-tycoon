import Popup from './Popup';
import TextButton from '../button/TextButton';
import { fontFamilies, fontSizes, colors } from '../../../../utils/styles';
import configs from '../../configs/configs';

const { width, height } = configs;

const buttonWidth = 506;
const btnGap = 50;

class PopupWarAttackConfirmation extends Popup {
  loading = false;
  attackUserId = null;

  constructor(scene) {
    super(scene, 'popup-war-attack-confirmation', { title: 'Confirmation' });

    this.backBtn = new TextButton(
      scene,
      width / 2 - buttonWidth / 2 - btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.loading = false;
        this.close();
        scene.popupWarAttack?.open();
      },
      'Back',
      { sound: 'close', fontSize: '82px' }
    );
    this.add(this.backBtn);

    this.confirmBtn = new TextButton(
      scene,
      width / 2 + buttonWidth / 2 + btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        if (this.loading) return;
        this.loading = true;
        scene.game.events.emit('update-war-attack', {
          attackUserId: this.attackUserId,
        });
      },
      'Confirm',
      { sound: 'button-1', fontSize: '82px' }
    );
    this.add(this.confirmBtn);

    this.usernameText = scene.add
      .text(width / 2 - 300, height / 2 - 160, '', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    this.add(this.usernameText);

    this.machineText = scene.add
      .text(width / 2 - 300, height / 2 + 220, '', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    this.add(this.machineText);

    scene.game.events.on('update-war-attack-completed', () => {
      this.loading = false;
      this.close();
    });
  }

  updateNumberOfMachines(numberOfMachines) {
    console.log('updateNumberOfMachines', { numberOfMachines });
    this.machineText.text = `${numberOfMachines} Gangsters`;
  }

  updateAttackUser({ id, username }) {
    console.log('updateAttackUser', { id, username });

    this.usernameText.text = username;
    this.attackUserId = id;
  }
}

export default PopupWarAttackConfirmation;
