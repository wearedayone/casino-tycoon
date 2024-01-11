import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;
const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };
class PopupPrizePool extends Popup {
  prizePool = 0;
  items = [];

  constructor(scene, { isSimulator } = {}) {
    super(scene, 'popup-small', { title: 'Rank Prize Pool', titleIcon: 'icon-info', noCloseBtn: true });

    const events = {
      requestRankingRewards: isSimulator ? 'simulator-request-ranking-rewards' : 'request-ranking-rewards',
      updateRankingRewards: isSimulator ? 'simulator-update-ranking-rewards' : 'update-ranking-rewards',
    };

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const firstParagraphY = startingY + 360;
    const secondParagraphY = firstParagraphY + 300;

    this.allocation = scene.add.text(
      paddedX,
      firstParagraphY,
      '--$ of ETH from buying\n$Gangsters goes into Prize Pool',
      largeBlackBold
    );
    this.rankRewardsPercent = scene.add.text(
      paddedX,
      secondParagraphY,
      'Top --% of players get paid when\ngame ends.',
      largeBlackBold
    );
    this.add(this.allocation);
    this.add(this.rankRewardsPercent);

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
      const { rankRewardsPercent } = prizePoolConfig;
      this.allocation.text = `${rankRewardsPercent * 100}% of ETH from buying\nGangsters goes into Prize Pool`;
      this.rankRewardsPercent.text = `Top ${
        prizePoolConfig.lowerRanksCutoffPercent * 100
      }% of players get paid when\ngame ends.`;
    });
    scene.game.events.emit(events.requestRankingRewards);
  }
}

export default PopupPrizePool;
