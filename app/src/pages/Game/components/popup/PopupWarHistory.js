import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const rowHeight = 139;
const smallBlackBoldCenter = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.extraBold,
  align: 'center',
};
class PopupWarHistory extends Popup {
  data = [];
  listY = height / 2 - 660;
  items = [];

  constructor(scene) {
    super(scene, 'popup-war-history', { title: 'Daily History & Outcomes' });
    this.scene = scene;

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => this.close(),
      'Back',
      { sound: 'close', fontSize: '82px' }
    );
    this.add(this.backBtn);

    this.timeText = scene.add.text(width / 2 + 100, this.popup.y + this.popup.height / 2 - 225, '0h 00m', {
      fontSize: '50px',
      color: '#29000B',
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.timeText);

    this.listContainer = scene.add.image(width / 2, this.listY, 'container-super-large').setOrigin(0.5, 0);
    this.add(this.listContainer);
    this.contentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    scene.game.events.on('update-next-war-time', ({ time }) => {
      const now = Date.now();
      const diffInMins = (time - now) / (60 * 1000);
      const hours = Math.floor(diffInMins / 60);
      const mins = Math.floor(diffInMins % 60);

      const timeText = `${hours}h ${mins.toString().padStart(2, '0')}m`;
      this.timeText.text = timeText;
    });

    scene.game.events.on('update-war-history', (data) => {
      this.data = data;
      this.updateList();
    });

    scene.game.events.emit('request-next-war-time');
    scene.game.events.emit('request-war-history');
  }

  updateList() {
    if (!this.data.length) return;

    this.items.map((item) => {
      this.contentContainer.remove(item);
      item.destroy();
    });

    this.items = [];
    for (let i = 0; i < this.data.length; i++) {
      const y = i * rowHeight;
      if (i % 2 === 1) {
        const bg = this.scene.add.image(this.popup.width / 2 - 90, y, 'row-container').setOrigin(0.5, 0);
        this.items.push(bg);
      }
      const { id, warSnapshotId, date, totalTokenReward, machinesLost, gainedReputation } = this.data[i];
      const dateText = this.scene.add
        .text(this.popup.width * 0.07, y + rowHeight / 2, date, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const prefix = totalTokenReward > 0 ? '+' : '-';
      const color = totalTokenReward > 0 ? colors.black : '#7C2828';
      const totalTokenRewardText = this.scene.add
        .text(this.popup.width * 0.23, y + rowHeight / 2, `${prefix}${formatter.format(totalTokenReward || 0)}`, {
          ...smallBlackBoldCenter,
          color,
        })
        .setOrigin(0.5, 0.5);
      const gainReputationText = this.scene.add
        .text(
          this.popup.width * 0.39,
          y + rowHeight / 2,
          `+${formatter.format(gainedReputation || 0)}`,
          smallBlackBoldCenter
        )
        .setOrigin(0.5, 0.5);

      const viewBtn = new Button(
        this.scene,
        this.popup.width * 0.75,
        y + rowHeight / 2,
        'icon-search-contained',
        'icon-search-contained',
        () => {
          this.loading = false;
          this.scene.popupWarHistoryDetail?.updateWarIds({ warSnapshotId, warResultId: id });
          this.close();
          this.scene.popupWarHistoryDetail?.open();
        },
        { fontSize: '36px', sound: 'open' }
      );

      this.items.push(dateText, totalTokenRewardText, gainReputationText, viewBtn);

      if (machinesLost && machinesLost > 0) {
        const machinesLostText = this.scene.add
          .text(this.popup.width * 0.52, y + rowHeight / 2, `-${machinesLost || 0}`, {
            ...smallBlackBoldCenter,
            color: '#E93D45',
          })
          .setOrigin(0.5, 0.5);
        const machinesLostIcon = this.scene.add
          .image(this.popup.width * 0.52 + machinesLostText.width / 2 + 45, y + rowHeight / 2, 'icon-gangster-mini')
          .setOrigin(0.5, 0.5);

        this.items.push(machinesLostText, machinesLostIcon);
      } else {
        const machineNoLostText = this.scene.add
          .text(this.popup.width * 0.52 + 40, y + rowHeight / 2, `-`, smallBlackBoldCenter)
          .setOrigin(0.5, 0.5);
        this.items.push(machineNoLostText);
      }
    }
    this.contentContainer.add(this.items);

    const contentContainerHeight = this.data.length * rowHeight;
    this.contentContainer.setSize(0, contentContainerHeight);
    if (this.table) {
      this.remove(this.table);
      this.table.destroy(true);
      this.table = null;
    }

    const tableHeight = this.listContainer.height;
    const visibleRatio = tableHeight / contentContainerHeight;
    this.thumb = this.scene.rexUI.add
      .roundRectangle({
        height: visibleRatio < 1 ? tableHeight * visibleRatio : 0,
        radius: 13,
        color: 0xe3d6c7,
      })
      .setVisible(false);

    this.table = new ScrollablePanel(this.scene, {
      x: width / 2,
      y: this.listY + tableHeight / 2,
      width: this.listContainer.width,
      height: tableHeight,
      scrollMode: 'y',
      background: this.scene.rexUI.add.roundRectangle({ radius: 10 }),
      panel: { child: this.contentContainer, mask: { padding: 1 } },
      slider: { thumb: this.thumb },
      mouseWheelScroller: { focus: true, speed: 0.3 },
      space: { left: 20, right: 20, top: 20, bottom: 20, panel: 20, header: 10, footer: 10 },
    }).layout();
    if (this.data.length <= 9 || !this.visible) {
      this.table.setMouseWheelScrollerEnable(false);
      this.table.setScrollerEnable(false);
    } else {
      this.table.setMouseWheelScrollerEnable(true);
      this.table.setScrollerEnable(true);
    }
    this.add(this.table);

    this.table.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.thumb.visible) return;
      this.thumb.setVisible(true);
    });
  }

  onOpen() {
    if (this.table) {
      // this.table.setMouseWheelScrollerEnable(true);
    }
    this.scene.game.events.emit('request-next-war-time');
    this.scene.game.events.emit('request-war-history');
  }

  cleanup() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(false);
      this.table.setScrollerEnable(false);
      this.thumb?.setVisible(false);
    }
  }
}

export default PopupWarHistory;
