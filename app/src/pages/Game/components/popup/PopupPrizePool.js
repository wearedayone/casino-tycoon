import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const rowHeight = 86.3;
const largeBlackExtraBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.extraBold };
const smallBrownBold = { fontSize: fontSizes.small, color: colors.brown, fontFamily: fontFamilies.bold };
const smallBlackBoldCenter = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'center',
};

class PopupPrizePool extends Popup {
  prizePool = 0;
  items = [];

  constructor(scene, parentModal) {
    super(scene, 'popup-extra-large', { title: 'Total Prize Pool', titleIcon: 'icon-info', noCloseBtn: true });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const prizePoolContainerY = startingY + 220;
    const tableHeaderY = prizePoolContainerY + 180;
    this.tableY = tableHeaderY + 50;

    const prizePoolContainer = scene.add
      .image(width / 2, prizePoolContainerY, 'text-container-outlined')
      .setOrigin(0.5, 0.5);
    const currentPrizePool = scene.add
      .text(paddedX, prizePoolContainerY, 'Current Prize Pool', largeBlackExtraBold)
      .setOrigin(0, 0.5);
    this.prizePoolText = scene.add
      .text(width - paddedX - 140, prizePoolContainerY, '0.00', largeBlackExtraBold)
      .setOrigin(1, 0.5);
    const ethIcon = scene.add.image(width - paddedX, prizePoolContainerY, 'icon-eth').setOrigin(1, 0.5);
    this.add(prizePoolContainer);
    this.add(currentPrizePool);
    this.add(this.prizePoolText);
    this.add(ethIcon);

    const rank = scene.add.text(leftMargin + this.popup.width * 0.17, tableHeaderY, 'Rank', smallBrownBold);
    const allocation = scene.add.text(
      leftMargin + this.popup.width * 0.4,
      tableHeaderY,
      'Allocation (%)',
      smallBrownBold
    );
    const shareOfPrize = scene.add.text(
      leftMargin + this.popup.width * 0.7,
      tableHeaderY,
      'Share of Prize',
      smallBrownBold
    );
    this.add(rank);
    this.add(allocation);
    this.add(shareOfPrize);

    this.contentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    const subtitleBgHeight = this.popup.height * 0.18;
    const subtitleY = (height + this.popup.height - subtitleBgHeight) / 2;
    const subtitleBg = scene.add
      .rectangle(width / 2, subtitleY, this.popup.width - 56, subtitleBgHeight, 0xf9cb73, 0.2)
      .setOrigin(0.5, 0.5);
    const subtitle = scene.add
      .text(width / 2, subtitleY, 'Players with higher reputation ranking\nwin a bigger share of reward.', {
        fontSize: '50px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
        align: 'center',
      })
      .setOrigin(0.5, 1);
    const bigger = scene.add
      .text(width / 2, subtitleY, 'bigger', {
        fontSize: '50px',
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1.3, 1);
    this.add(subtitleBg);
    this.add(subtitle);
    this.add(bigger);

    this.buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        parentModal.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);

    scene.game.events.on('update-season', (data) => this.updateValues(data));
    scene.game.events.on('update-ranking-rewards', (data) => this.updateRewardAllocation(data));
  }

  updateValues(season) {
    console.log('season', season);
    const { prizePool } = season;
    this.prizePool = prizePool;
    this.prizePoolText.text = formatter.format(prizePool);
  }

  updateRewardAllocation(rankingRewards) {
    console.log('rankingRewards', rankingRewards);
    const contentContainerHeight = rankingRewards.length * rowHeight;
    this.contentContainer.setSize(this.popup.width * 0.8, contentContainerHeight);
    if (this.table) this.remove(this.table);
    if (this.items.length) {
      for (let item of this.items) {
        this.remove(item);
      }
    }
    console.log('this.contentContainer', this.contentContainer);
    this.items = [];
    for (let i = 0; i < rankingRewards.length; i++) {
      const y = i * rowHeight;
      if (i % 2 === 0) {
        const bg = this.scene.rexUI.add
          .roundRectangle(this.popup.width / 2, y, this.popup.width, rowHeight, 11, 0xfffffa)
          .setOrigin(0.5, 0);
        this.items.push(bg);
      }
      const { rankStart, rankEnd, share } = rankingRewards[i];
      const rankText = rankStart === rankEnd ? rankStart : `${rankStart}-${rankEnd}`;
      const rank = this.scene.add.text(this.popup.width * 0.1, y, rankText, smallBlackBoldCenter).setOrigin(0.5, -0.5);
      const allocation = this.scene.add
        .text(this.popup.width * 0.4, y, `${(share * 100).toFixed(2)}%`, smallBlackBoldCenter)
        .setOrigin(0.5, -0.5);
      const ethReward = this.scene.add
        .text(this.popup.width * 0.7, y, formatter.format(share * this.prizePool), smallBlackBoldCenter)
        .setOrigin(0.5, -0.5);

      this.items.push(rank, allocation, ethReward);
    }
    this.contentContainer.add(this.items);

    const tableHeight = this.popup.height * 0.6;
    const visibleRatio = tableHeight / contentContainerHeight;
    this.leaderboardThumb = this.scene.rexUI.add
      .roundRectangle({
        height: visibleRatio < 1 ? tableHeight * visibleRatio : 0,
        radius: 13,
        color: 0xe3d6c7,
      })
      .setVisible(false);

    this.table = new ScrollablePanel(this.scene, {
      x: width / 2,
      y: this.tableY + tableHeight / 2,
      width: this.popup.width * 0.8,
      height: tableHeight,
      scrollMode: 'y',
      background: this.scene.rexUI.add.roundRectangle({ radius: 10 }),
      panel: { child: this.contentContainer, mask: { padding: 1 } },
      slider: { thumb: this.leaderboardThumb },
      mouseWheelScroller: { focus: false, speed: 0.3 },
      space: { left: 50, right: 40, top: 40, bottom: 40, panel: 20, header: 10, footer: 10 },
    }).layout();
    this.add(this.table);

    this.table.on('scroll', () => {
      if (this.leaderboardThumb.visible) return;
      this.leaderboardThumb.setVisible(true);
    });
  }
}

export default PopupPrizePool;
