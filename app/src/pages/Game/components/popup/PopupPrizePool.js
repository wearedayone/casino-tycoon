import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };
class PopupPrizePool extends Popup {
  constructor(scene, { isSimulator } = {}) {
    super(scene, 'popup-small', { title: 'Total Prize Pool', titleIcon: 'icon-info', noCloseBtn: true });

    const events = {
      requestRankingRewards: isSimulator ? 'simulator-request-ranking-rewards' : 'request-ranking-rewards',
      updateRankingRewards: isSimulator ? 'simulator-update-ranking-rewards' : 'update-ranking-rewards',
    };

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const firstParagraphY = startingY + 200;
    const secondParagraphY = firstParagraphY + 300;
    const thirdParagraphY = secondParagraphY + 300;

    this.rankPrizePool = scene.add.text(
      paddedX,
      firstParagraphY,
      '--$ of ETH from player spend\ngoes to the top --% players\nbased on rank.',
      largeBlackBold
    );
    this.reputationPrizePool = scene.add.text(
      paddedX,
      secondParagraphY,
      '--% of ETH from player spend\ngoes to all players based on\nreputation.',
      largeBlackBold
    );
    this.marketingFee = scene.add.text(
      paddedX,
      thirdParagraphY,
      '--% is used to buy and burn\n$FIAT tokens.',
      largeBlackBold
    );
    this.add(this.rankPrizePool);
    this.add(this.reputationPrizePool);
    this.add(this.marketingFee);

    this.buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (this.table) {
          this.table.setMouseWheelScrollerEnable(false);
        }
        this.close();
        scene.popupLeaderboard.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);

    scene.game.events.on(events.updateRankingRewards, ({ prizePoolConfig }) => {
      const { rankRewardsPercent, reputationRewardsPercent, lowerRanksCutoffPercent, marketingFee } = prizePoolConfig;
      this.rankPrizePool.text = `${rankRewardsPercent * 100}% of ETH from player spend\ngoes to the top ${
        lowerRanksCutoffPercent * 100
      }% players\nbased on rank.`;
      this.reputationPrizePool.text = `${
        reputationRewardsPercent * 100
      }% of ETH from player spend\ngoes to all players based on\nreputation.`;
      this.marketingFee.text = `${marketingFee * 100}% is used to buy and burn\n$FIAT tokens.`;
    });
    scene.game.events.emit(events.requestRankingRewards);
  }
}

export default PopupPrizePool;
