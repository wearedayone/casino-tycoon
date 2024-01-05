import Popup from './Popup';
import PopupProcessing from './PopupProcessing';
import TextButton from '../button/TextButton';
import Button from '../button/Button';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const largeBlackExtraBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.extraBold };
const largeBlackBoldCenter = {
  fontSize: fontSizes.large,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'center',
};
class PopupRetire extends Popup {
  originalPayout = 0;
  taxPercent = 0;

  constructor(scene) {
    super(scene, 'popup-small', { title: 'Retire From Game' });
    this.popupBuyProcessing = new PopupProcessing(scene, {
      completedEvent: 'retire-completed',
      completedIcon: 'icon-retire-done',
      failedIcon: 'icon-retire-fail',
      description: '',
    });
    scene.add.existing(this.popupBuyProcessing);

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const firstParagraphY = startingY + 220;
    const secondParagraphY = firstParagraphY + 280;
    const retirementRewardY = secondParagraphY + 200;
    const taxY = retirementRewardY + 150;

    this.description = scene.add.text(
      paddedX,
      firstParagraphY,
      'Are you sure you want to retire?\nYour units and NFTs will be burned.',
      largeBlackBoldCenter
    );
    this.estimatedRetirementRewards = scene.add.text(
      paddedX,
      secondParagraphY,
      'Estimated retirement rewards:',
      largeBlackBoldCenter
    );
    this.add(this.description);
    this.add(this.estimatedRetirementRewards);

    const prizePoolContainer = scene.add
      .image(width / 2, retirementRewardY, 'text-container-outlined')
      .setOrigin(0.5, 0.5);
    const currentPayout = scene.add
      .text(paddedX, retirementRewardY, 'Current Payout', largeBlackExtraBold)
      .setOrigin(0, 0.5);
    this.payout = scene.add
      .text(width - paddedX - 140, retirementRewardY, '0.00', largeBlackExtraBold)
      .setOrigin(1, 0.5);
    const ethIcon = scene.add.image(width - paddedX, retirementRewardY, 'icon-eth').setOrigin(1, 0.5);
    this.add(prizePoolContainer);
    this.add(currentPayout);
    this.add(this.payout);
    this.add(ethIcon);

    this.tax = scene.add
      .text(width / 2, taxY, 'Payout includes --% early retire tax', {
        fontSize: fontSizes.medium,
        color: colors.black,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    this.add(this.tax);

    this.buttonBack = new TextButton(
      scene,
      width / 2 - this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        scene.popupLeaderboard.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);
    this.buttonYes = new Button(
      scene,
      width / 2 + this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-yes',
      'button-yes-pressed',
      () => {
        this.popupBuyProcessing.initLoading(`Your payout will take\na few minutes to process`);
        this.close();

        scene.game.events.emit('init-retire');
      }
    );
    this.add(this.buttonYes);

    scene.game.events.on('update-leaderboard', (data) => {
      const userRecord = data.find(({ isUser }) => isUser);
      this.originalPayout = userRecord.reputationReward;
      this.calculatePayout();
    });
    scene.game.events.on('update-retire-data', ({ earlyRetirementTax }) => {
      this.taxPercent = earlyRetirementTax;
      this.tax.text = `Payout includes ${earlyRetirementTax * 100}% early retire tax`;
      this.calculatePayout();
    });
    scene.game.events.emit('request-retire-data');
  }

  calculatePayout() {
    const actualPayout = this.originalPayout * (1 - this.taxPercent);
    this.payout.text = formatter.format(actualPayout);
  }
}

export default PopupRetire;
