import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies } from '../../../../utils/styles';

const { width, height } = configs;

class PopupWarExplain extends Popup {
  tokenRewardPerEarner = 0;
  earningStealPercent = 0;
  machinePercentLost = 0;

  constructor(scene, { onClickBackButton } = {}) {
    super(scene, 'popup-gang-war-explain', { ribbon: 'ribbon-gang-war-explain', noCloseBtn: true });
    this.onClickClose = onClickBackButton;

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        if (onClickBackButton) {
          onClickBackButton();
          return;
        }
        scene.popupWarMachines?.open();
      },
      'Back',
      { sound: 'close' }
    );
    this.add(this.backBtn);

    this.tokenRewardText = scene.add
      .text(width / 2 + 250, height / 2 - 384, `${this.tokenRewardPerEarner.toLocaleString()}`, {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 1);
    this.add(this.tokenRewardText);

    this.earningStealPercentText = scene.add
      .text(width / 2 + 290, height / 2 + 28, `${this.earningStealPercent.toLocaleString()}`, {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 1);
    this.add(this.earningStealPercentText);

    this.machinePercentLostText = scene.add
      .text(width / 2 + 280, height / 2 + 397, `${this.machinePercentLost * 100}%`, {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 1);
    this.add(this.machinePercentLostText);

    scene.game.events.on('update-war-config', ({ tokenRewardPerEarner, earningStealPercent, machinePercentLost }) => {
      this.tokenRewardPerEarner = tokenRewardPerEarner;
      this.earningStealPercent = earningStealPercent;
      this.machinePercentLost = machinePercentLost;
      this.updateValues();
    });

    scene.game.events.emit('request-war-config');
  }

  updateValues() {
    this.tokenRewardText.text = `${this.tokenRewardPerEarner.toLocaleString()}`;
    this.earningStealPercentText.text = `${this.earningStealPercent * 100}%`;
    this.machinePercentLostText.text = `${this.machinePercentLost * 100}%`;
  }
}

export default PopupWarExplain;
