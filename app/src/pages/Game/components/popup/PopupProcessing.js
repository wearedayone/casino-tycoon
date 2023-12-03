import Popup from './Popup';
import PopupTxnCompleted from './PopupTxnCompleted';
import configs from '../../configs/configs';
import { colors, fontFamilies } from '../../../../utils/styles';

const { width } = configs;

class PopupProcessing extends Popup {
  constructor(scene, { sound, completedEvent, completedIcon, description }) {
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
      this.loading = false;
      this.setTitle('Success');
      this.title.text = 'All done!';
      this.description.text = 'Your reputation & earnings \n are updated';
      this.doneSound?.play();

      // icons
      this.loadingAnimation.pause();
      this.icon.setVisible(false);
      this.iconDone.setVisible(true);
      if (completedEvent === 'buy-gangster-completed') {
        const { txnHash, quantity } = data;
        this.popupTxnCompleted = new PopupTxnCompleted(
          scene,
          completedIcon,
          `${quantity.toLocaleString()} Gangster${quantity > 1 ? 's' : ''}`,
          'Gangsters hired successfully.',
          txnHash
        );
        scene.add.existing(this.popupTxnCompleted);
        this.close();
      }
      if (completedEvent === 'deposit-nft-completed') {
        const { txnHash, amount } = data;
        this.popupTxnCompleted = new PopupTxnCompleted(
          scene,
          completedIcon,
          `${amount.toLocaleString()} NFT${amount > 1 ? 's' : ''}`,
          'Staking completed.',
          txnHash
        );
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
    this.setVisible(true);
  }
}

export default PopupProcessing;
