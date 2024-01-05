import Popup from './Popup';
import PopupTxnCompleted from './PopupTxnCompleted';
import configs from '../../configs/configs';
import { colors, fontFamilies } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';
import PopupTxnError from './PopupTxnError';

const { width } = configs;

class PopupProcessing extends Popup {
  constructor(scene, { sound, completedEvent, completedIcon, description, failedIcon }) {
    super(scene, 'popup-small', { title: 'Almost done', openOnCreate: false });
    const startingY = this.popup.y - this.popup.height / 2;
    const iconY = startingY + 320;
    const titleY = iconY + 160;
    const descriptionY = titleY + 320;

    this.loading = true;
    if (sound) this.doneSound = scene.sound.add(sound, { loop: false });
    this.icon = scene.add.image(width / 2, iconY, 'icon-loading');
    this.iconDone = scene.add.image(width / 2, iconY, completedIcon);
    this.iconDone.setVisible(false);
    if (failedIcon) {
      this.iconFail = scene.add.image(width / 2, iconY, failedIcon);
      this.iconFail.setVisible(false);
      this.add(this.iconFail);
    }

    this.title = scene.add
      .text(width / 2, titleY, 'Processing...', {
        fontSize: '100px',
        color: colors.brown,
        fontFamily: fontFamilies.extraBold,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    const descriptionContainer = scene.add.image(width / 2, descriptionY, 'text-container');
    this.description = scene.add
      .text(width / 2, descriptionY, description, {
        fontSize: '52px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0.5);

    this.add(this.icon);
    this.add(this.iconDone);
    this.add(this.title);
    this.add(descriptionContainer);
    this.add(this.description);

    this.loadingAnimation = scene.tweens.add({
      targets: this.icon,
      rotation: Math.PI * 2, // full circle
      duration: 3000,
      repeat: -1, // infinite
      ease: 'Cubic.out',
    });
    this.loadingAnimation.play();

    scene.game.events.on(completedEvent, (data) => {
      const status = data?.status;
      const message = data?.message;
      const title = data?.title;
      const txnHash = data?.txnHash;
      const action = data?.action;
      const iconError = data?.iconError;
      const code = data?.code;
      this.loading = false;
      // icons
      this.loadingAnimation.pause();
      this.icon.setVisible(false);

      if (status === 'failed') {
        this.popupTxnCompleted = new PopupTxnError({
          scene,
          code,
          icon: iconError,
          title,
          description: message,
          action: action,
          txnHash: txnHash,
        });
        scene.add.existing(this.popupTxnCompleted);
        this.close();
      } else {
        this.setTitle('Success');
        this.title.text = 'All done!';
        this.description.text = 'Your reputation & earnings \n are updated';
        this.doneSound?.play();
        this.iconDone.setVisible(true);
        const hasTxnHashEvents = [
          'buy-gangster-completed',
          'deposit-nft-completed',
          'withdraw-token-completed',
          'withdraw-eth-completed',
          'withdraw-nft-completed',
          'retire-completed',
        ];

        if (!hasTxnHashEvents.includes(completedEvent)) return;
        const { txnHash, amount } = data;
        let title = '',
          desc = '';

        switch (completedEvent) {
          case 'buy-gangster-completed':
            title = `${amount.toLocaleString()} Gangster${amount > 1 ? 's' : ''}`;
            desc = 'Gangsters hired successfully.';
            break;
          case 'deposit-nft-completed':
            title = `${amount.toLocaleString()} NFT${amount > 1 ? 's' : ''}`;
            desc = 'Staking completed.';
            break;
          case 'withdraw-token-completed':
            title = `${amount.toLocaleString()} $FIAT`;
            desc = 'Withdraw completed.';
            break;
          case 'withdraw-eth-completed':
            title = `${formatter.format(amount)} ETH`;
            desc = 'Withdraw completed.';
            break;
          case 'withdraw-nft-completed':
            title = `${amount.toLocaleString()} NFT${amount > 1 ? 's' : ''}`;
            desc = 'Withdraw completed.';
            break;
          case 'retire-completed':
            title = '';
            desc = 'You have retired from the game.\nAll progress in game is deleted.';
            break;
        }

        this.popupTxnCompleted = new PopupTxnCompleted(scene, completedIcon, title, desc, txnHash);
        scene.add.existing(this.popupTxnCompleted);
        this.close();
      }
    });
  }

  initLoading(description) {
    console.log('init loading');
    this.loading = true;
    this.description.text = description;
    this.setTitle(`Processing`);
    this.title.text = 'Processing...';
    this.loadingAnimation.resume();
    this.icon.setVisible(true);
    this.iconDone.setVisible(false);
    if (this.iconFail) this.iconFail.setVisible(false);
    this.setVisible(true);
  }
}

export default PopupProcessing;
