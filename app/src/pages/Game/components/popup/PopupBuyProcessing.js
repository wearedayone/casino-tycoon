import Popup from './Popup';
import configs from '../../configs/configs';
import { colors, fontFamilies } from '../../../../utils/styles';

const { width } = configs;

class PopupBuyProcessing extends Popup {
  constructor(scene, { sound, buyCompletedEvent, buyCompletedIcon, buyingText }) {
    super(scene, 'popup-small', { title: 'Almost done', openOnCreate: true });

    const startingY = this.popup.y - this.popup.height / 2;
    const iconY = startingY + 320;
    const titleY = iconY + 160;
    const descriptionY = titleY + 320;

    this.loading = true;
    this.doneSound = scene.sound.add(sound, { loop: false });
    this.icon = scene.add.image(width / 2, iconY, 'icon-loading');
    this.iconDone = scene.add.image(width / 2, iconY, buyCompletedIcon);
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
      .text(width / 2, descriptionY, `${buyingText}.\nPlease, wait.`, {
        fontSize: '52px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0.5);

    this.add(this.icon);
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

    scene.game.events.on(buyCompletedEvent, () => {
      this.loading = false;
      this.setTitle('Success');
      this.title.text = 'All done!';
      this.description.text = 'Your reputation & earnings \n are updated';
      this.doneSound.play();

      // icons
      this.loadingAnimation.stop();
      this.icon.setVisible(false);
      this.add(this.iconDone);
    });
  }
}

export default PopupBuyProcessing;
