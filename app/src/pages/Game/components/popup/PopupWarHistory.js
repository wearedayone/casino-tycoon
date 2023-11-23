import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { customFormat } from '../../../../utils/numbers';

const { width, height } = configs;
const rowHeight = 86.3;
const smallBrownBold = { fontSize: fontSizes.small, color: colors.brown, fontFamily: fontFamilies.bold };
const smallBlackBoldCenter = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'center',
};

const iconWidth = 50;

class PopupWarHistory extends Popup {
  items = [];

  constructor(scene) {
    super(scene, 'popup-medium', { title: 'Daily History & Outcomes' });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const startingY = this.popup.y - this.popup.height / 2;
    const tableHeaderY = startingY + 130;
    this.tableY = tableHeaderY + 60;

    const date = scene.add.text(leftMargin + this.popup.width * 0.1, tableHeaderY, 'Date', smallBrownBold);
    const yourVote = scene.add.text(leftMargin + this.popup.width * 0.25, tableHeaderY, 'Your Vote', smallBrownBold);
    const votePercent = scene.add.text(leftMargin + this.popup.width * 0.45, tableHeaderY, 'Vote%', smallBrownBold);
    const shareOfPrize = scene.add.text(leftMargin + this.popup.width * 0.65, tableHeaderY, 'Outcome', smallBrownBold);
    this.add(date);
    this.add(yourVote);
    this.add(votePercent);
    this.add(shareOfPrize);

    this.tableContainer = scene.add.image(width / 2, this.tableY, 'container-large-2').setOrigin(0.5, 0);
    this.add(this.tableContainer);

    this.contentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    this.buttonBack = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => this.close(),
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);

    scene.game.events.on('update-war-history', (data) => this.updateTable(data));
  }

  onOpen() {
    this.scene.game.events.emit('request-war-history');
  }

  updateTable(data) {
    console.log('data', data);
    const contentContainerHeight = data.length * rowHeight;
    this.contentContainer.setSize(this.popup.width * 0.8, contentContainerHeight);
    if (this.table) this.remove(this.table);
    if (this.items.length) {
      for (let item of this.items) {
        this.remove(item);
      }
    }
    this.items = [];
    const outcomeX = this.popup.width * 0.65;
    const penaltyOutcomeOffset = this.popup.width * 0.065;

    for (let i = 0; i < data.length; i++) {
      const y = i * rowHeight;
      if (i % 2 !== 0) {
        const bg = this.scene.rexUI.add
          .roundRectangle(this.popup.width / 2, y, this.popup.width, rowHeight, 11, 0xfffffa)
          .setOrigin(0.5, 0);
        this.items.push(bg);
      }
      const { createdAt, isWarEnabled, voteRatio, bonus, penalty } = data[i];
      const createdAtDate = new Date(createdAt);
      const date = this.scene.add
        .text(
          this.popup.width * 0.05,
          y,
          `${createdAtDate.getDate()}/${createdAtDate.getMonth() + 1}`,
          smallBlackBoldCenter
        )
        .setOrigin(0.5, -0.5);
      const userVote = this.scene.add
        .text(this.popup.width * 0.23, y, isWarEnabled ? 'War' : 'Peace', smallBlackBoldCenter)
        .setOrigin(0.5, -0.5);
      const votePercent = this.scene.add
        .text(this.popup.width * 0.4, y, `${Math.round(voteRatio * 100)}%`, smallBlackBoldCenter)
        .setOrigin(0.5, -0.5);

      this.items.push(date, userVote, votePercent);

      if (bonus) {
        const userBonus = this.scene.add
          .text(outcomeX - iconWidth, y, `+${customFormat(bonus || 0, 1)}`, {
            ...smallBlackBoldCenter,
            fontFamily: fontFamilies.extraBold,
          })
          .setOrigin(0.5, -0.5);
        const coin = this.scene.add.image(outcomeX + userBonus.width / 2, y, 'icon-coin-mini').setOrigin(0.5, 0);

        this.items.push(userBonus, coin);
      } else if (penalty) {
        const hasTwoPenalties = penalty.gangster * penalty.goon > 0;
        const gangsterX = hasTwoPenalties ? outcomeX - penaltyOutcomeOffset : outcomeX;
        const goonX = hasTwoPenalties ? outcomeX + penaltyOutcomeOffset : outcomeX;

        if (penalty.gangster) {
          const userPenalty = this.scene.add
            .text(gangsterX - iconWidth, y, `-${penalty.gangster.toLocaleString()}`, smallBlackBoldCenter)
            .setOrigin(0.5, -0.5);
          const gangster = this.scene.add
            .image(gangsterX + userPenalty.width / 2, y, 'icon-gangster-mini')
            .setOrigin(0.5, 0);

          this.items.push(userPenalty, gangster);
        }
        if (penalty.goon) {
          const userPenalty = this.scene.add
            .text(goonX - iconWidth, y, `-${penalty.goon.toLocaleString()}`, smallBlackBoldCenter)
            .setOrigin(0.5, -0.5);

          const goon = this.scene.add.image(goonX + userPenalty.width / 2, y, 'icon-goon-mini').setOrigin(0.5, 0);
          this.items.push(userPenalty, goon);
        }
      }
    }
    this.contentContainer.add(this.items);

    const tableHeight = this.tableContainer.height;
    const visibleRatio = tableHeight / contentContainerHeight;
    this.tableScrollerThumb = this.scene.rexUI.add
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
      slider: { thumb: this.tableScrollerThumb },
      mouseWheelScroller: { focus: false, speed: 0.3 },
      space: { left: 30, right: 30, top: 30, bottom: 30, panel: 20, header: 10, footer: 10 },
    }).layout();
    this.add(this.table);

    this.table.on('scroll', () => {
      if (this.tableScrollerThumb.visible) return;
      this.tableScrollerThumb.setVisible(true);
    });
  }
}

export default PopupWarHistory;
