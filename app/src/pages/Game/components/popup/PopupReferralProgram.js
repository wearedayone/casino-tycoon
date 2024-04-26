import Phaser from 'phaser';

import Popup from './Popup';
import Button from '../button/Button';
import { colors, fontFamilies } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const signUpLink = 'https://www.uncharted.gg';
const learnMoreLink = 'https://medium.com/@unchartedgg';

class PopupReferralProgram extends Popup {
  loading = false;
  uPoints = 0;
  template = '';
  referralCode = '';

  constructor(scene, { onOpen, ...configs }) {
    super(scene, 'popup-referral', { title: 'Referral Program', ...configs });
    this.onOpenCallback = onOpen;

    const btnY = this.popup.y + 670;
    this.signupBtn = new Button(
      scene,
      this.popup.x - 255,
      btnY,
      'button-referral-sign-up',
      'button-referral-sign-up-pressed',
      () => {
        window.open(signUpLink);
      },
      { sound: 'button-1' }
    );
    this.add(this.signupBtn);

    this.shareBtn = new Button(
      scene,
      this.popup.x + 220,
      btnY,
      'button-x-share',
      'button-x-share-pressed',
      () => {
        const text = this.template.replace('{referralCode}', this.referralCode.toUpperCase());
        const intentUrl = getTwitterIntentUrl({ text });
        window.open(intentUrl);
      },
      { sound: 'button-1' }
    );
    this.add(this.shareBtn);

    this.uPointText = scene.add
      .text(this.popup.x + 80, this.popup.y + 95, '', {
        fontSize: '72px',
        fontFamily: fontFamilies.extraBold,
        color: colors.black,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.uPointText);

    const learnMoreText = scene.add
      .text(this.popup.x, this.popup.y + this.popup.height / 2 - 135, 'Learn more', {
        fontSize: '48px',
        fontFamily: fontFamilies.bold,
        color: '#7d2e00',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        window.open(learnMoreLink);
      });
    this.add(learnMoreText);

    const underline = scene.add
      .rectangle(this.popup.x, learnMoreText.y + learnMoreText.height / 2 + 5, learnMoreText.width, 4, 0x7d2e00)
      .setOrigin(0.5, 0.5);
    this.add(underline);

    scene.game.events.on('update-u-point-reward', ({ uPointReward }) => {
      this.uPointText.text = formatter.format(uPointReward);
    });

    scene.game.events.on('update-twitter-share-template', ({ template, referralCode }) => {
      this.template = template;
      this.referralCode = referralCode;
      console.log('update-twitter-share-template', { template, referralCode });
    });

    scene.game.events.emit('request-u-point-reward');
    scene.game.events.emit('request-twitter-share-template');
  }

  onOpen() {
    this.onOpenCallback?.();
  }

  cleanup() {}
}

export default PopupReferralProgram;

const getTwitterIntentUrl = ({ text }) => {
  const intentUrl = new URL('https://twitter.com/intent/tweet');

  const encodedText = text.replace(/(\\n)/g, '\n'); // parse stringified \n into newline character
  intentUrl.searchParams.append('text', encodedText);

  return intentUrl;
};
