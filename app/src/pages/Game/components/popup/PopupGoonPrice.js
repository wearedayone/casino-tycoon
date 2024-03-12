import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const rowHeight = 90;
const smallBlackBoldCenter = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'center',
};
class PopupGoonPrice extends Popup {
  priceData = [];
  listY = height / 2 - 190;
  items = [];

  constructor(scene) {
    super(scene, 'popup-goon-price', { title: 'Goon Price', titleIcon: 'icon-info' });
    this.scene = scene;

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        scene.popupBuyGoon?.open();
      },
      'Back',
      { sound: 'close' }
    );
    this.add(this.backBtn);

    this.listContainer = scene.add.image(width / 2, this.listY, 'container-price').setOrigin(0.5, 0);
    this.add(this.listContainer);
    this.contentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    scene.game.events.on('update-goon-price', (data) => {
      this.priceData = data;
      if (this.visible) {
        this.updateList();
      }
    });

    scene.game.events.emit('request-goon-price');
  }

  updateList() {
    console.log('updatelist', this.priceData);
    if (!this.priceData.length) return;

    this.items.map((item) => {
      this.contentContainer.remove(item);
      item.destroy();
    });

    this.items = [];
    for (let i = 0; i < this.priceData.length; i++) {
      const y = i * rowHeight;
      const { date, value } = this.priceData[i];
      const dateText = this.scene.add
        .text(this.popup.width * 0.07, y + rowHeight / 2, date, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);

      const goonIcon = this.scene.add.image(this.popup.width * 0.2, y + rowHeight / 2, 'goon-mini').setOrigin(0.5, 0.5);
      const goonText = this.scene.add
        .text(this.popup.width * 0.2 + goonIcon.width + 50, y + rowHeight / 2, 'Goon', smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);

      const priceIcon = this.scene.add.image(this.popup.width * 0.75, y + rowHeight / 2, 'coin3').setOrigin(0.5, 0.5);
      const priceText = this.scene.add
        .text(
          this.popup.width * 0.75 - priceIcon.width,
          y + rowHeight / 2,
          `${formatter.format(value)}`,
          smallBlackBoldCenter
        )
        .setOrigin(1, 0.5);

      this.items.push(dateText, goonIcon, goonText, priceIcon, priceText);
    }
    this.contentContainer.add(this.items);

    const contentContainerHeight = this.priceData.length * rowHeight;
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
    if (this.priceData.length <= 7 || !this.visible) {
      this.table.setMouseWheelScrollerEnable(false);
    } else {
      this.table.setMouseWheelScrollerEnable(true);
    }
    this.add(this.table);
    console.log(this.table);

    this.table.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.thumb.visible) return;
      this.thumb.setVisible(true);
    });
  }

  onOpen() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(true);
    }
    this.scene.game.events.emit('request-goon-price');
  }

  cleanup() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(false);
      this.thumb?.setVisible(false);
    }
  }
}

export default PopupGoonPrice;
