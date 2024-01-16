import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import TextInput from '../inputs/TextInput';
import { formatter } from '../../../../utils/numbers';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';

const { width, height } = configs;

const rowHeight = 139;
const paginationBtnSize = 66;
const paginationBtnGap = 15;
const smallBlackBoldCenter = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'center',
};

const MAX_USERNAME_LENGTH = 10;
const formatUsername = ({ username }) => {
  const displayedUsername = username.slice(0, MAX_USERNAME_LENGTH);
  const ellipses = username.length > MAX_USERNAME_LENGTH ? '...' : '';

  return `@${displayedUsername}${ellipses}`;
};

class PopupWarAttack extends Popup {
  uid = null;
  loading = false;
  page = 0;
  limit = 50;
  search = '';
  totalPages = 10;
  users = [];
  listY = height / 2 - 530;
  items = [];
  paginations = [];

  constructor(scene) {
    super(scene, 'popup-war-attack', { title: 'Raid' });
    this.scene = scene;

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        scene.popupWarMachines?.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.backBtn);

    this.timeText = scene.add.text(width / 2 + 100, this.popup.y + this.popup.height / 2 - 225, '0h 00m', {
      fontSize: '50px',
      color: '#29000B',
      fontFamily: fontFamilies.extraBold,
    });
    this.add(this.timeText);

    this.searchInput = new TextInput(scene, width / 2, height / 2 - this.popup.height / 2 + 200, {
      inputImg: 'search-input',
      icon: 'icon-search',
      placeholder: 'Search user',
      fontSize: '40px',
      color: '#29000B',
      onChange: (value) => {
        this.search = value;
      },
      onBlur: () => this.reloadData(),
    });
    this.add(this.searchInput);

    this.listContainer = scene.add.image(width / 2, this.listY, 'container-large-3').setOrigin(0.5, 0);
    this.add(this.listContainer);
    this.contentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    scene.game.events.on('update-user-list-to-attack', ({ totalPages, users }) => {
      this.totalPages = totalPages;
      this.users = users;
      this.updateList();
      this.updatePagination();
      this.setLoading(false);
    });

    scene.game.events.on('update-next-war-time', ({ time }) => {
      const now = Date.now();
      const diffInMins = (time - now) / (60 * 1000);
      const hours = Math.floor(diffInMins / 60);
      const mins = Math.floor(diffInMins % 60);

      const timeText = `${hours}h ${mins.toString().padStart(2, '0')}m`;
      this.timeText.text = timeText;
    });

    scene.game.events.on('update-auth', ({ uid }) => {
      this.uid = uid;
      this.reloadData();
    });

    scene.game.events.emit('request-next-war-time');
    scene.game.events.emit('request-auth');
  }

  onOpen() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(true);
    }
    this.scene.game.events.emit('request-next-war-time');
  }

  cleanup() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(false);
    }
  }

  reloadData() {
    this.setLoading(true);
    this.scene.game.events.emit('request-user-list-to-attack', {
      page: this.page,
      limit: this.limit,
      search: this.search,
    });
  }

  changePage(newPage) {
    if (this.loading) return;
    if (newPage === undefined || newPage === null) return;
    if (newPage < 0 || newPage > this.totalPages + 1) return;
    if (this.page === newPage) return;

    this.page = newPage;
    this.updatePagination();
    this.reloadData();
  }

  setLoading(status) {
    this.loading = status;
    this.searchInput.setDisabled(status);
  }

  updateList() {
    if (!this.users.length) return;

    this.items.map((item) => {
      this.contentContainer.remove(item);
      item.destroy();
    });

    this.items = [];
    for (let i = 0; i < this.users.length; i++) {
      const y = i * rowHeight;
      if (i % 2 === 1) {
        const bg = this.scene.add.image(this.popup.width / 2 - 90, y, 'row-container').setOrigin(0.5, 0);
        this.items.push(bg);
      }
      const { id, rank, username, lastDayTokenReward, active } = this.users[i];
      const rankText = this.scene.add
        .text(this.popup.width * 0.05, y + rowHeight / 2, `${rank}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const usernameText = this.scene.add
        .text(this.popup.width * 0.2, y + rowHeight / 2, formatUsername({ username }), smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const lastDayTokenRewardText = this.scene.add
        .text(this.popup.width * 0.42, y + rowHeight / 2, formatter.format(lastDayTokenReward), smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);

      const profileBtn = new TextButton(
        this.scene,
        this.popup.width * 0.58,
        y + rowHeight / 2,
        'button-blue-small',
        'button-blue-small',
        () => {
          this.loading = false;
          this.close();
          this.scene.popupWarAttackDetail?.updateUserId(id);
          this.scene.popupWarAttackDetail?.open();
        },
        'Profile',
        { fontSize: '36px' }
      );

      this.items.push(rankText, usernameText, lastDayTokenRewardText, profileBtn);

      if (id !== this.uid && active) {
        const attackBtn = new TextButton(
          this.scene,
          this.popup.width * 0.58 + 200,
          y + rowHeight / 2,
          'button-blue-small',
          'button-blue-small',
          () => {
            this.loading = false;
            this.scene.popupWarAttackConfirmation?.updateAttackUser({ id, username });
            this.close();
            this.scene.popupWarAttackConfirmation?.open();
          },
          'Raid',
          { fontSize: '36px' }
        );

        this.items.push(attackBtn);
      }
    }
    this.contentContainer.add(this.items);

    const contentContainerHeight = this.users.length * rowHeight;
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
    if (this.users.length <= 7) {
      this.table.setScrollerEnable(false);
    } else {
      this.table.setScrollerEnable(true);
    }
    this.add(this.table);
    if (!this.visible) {
      this.table.setMouseWheelScrollerEnable(false);
    }

    this.table.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.thumb.visible) return;
      this.thumb.setVisible(true);
    });
  }

  updatePagination() {
    const pageBtns = [{ text: '1', page: 0 }];

    if (this.totalPages <= 5) {
      let count = 1;
      while (count < this.totalPages) {
        pageBtns.push({ text: `${count + 1}`, page: count });
        count++;
      }
    } else {
      if ([0, 1, this.totalPages - 2, this.totalPages - 1].includes(this.page)) {
        pageBtns.push(
          ...[
            { text: '2', page: 1 },
            { text: '...' },
            { text: `${this.totalPages - 1}`, page: this.totalPages - 2 },
            { text: `${this.totalPages}`, page: this.totalPages - 1 },
          ]
        );
      } else {
        pageBtns.push(
          ...[
            { text: '...' },
            { text: `${this.page + 1}`, page: this.page },
            { text: '...' },
            { text: `${this.totalPages}`, page: this.totalPages - 1 },
          ]
        );
      }
    }

    this.paginations.map((item) => {
      this.remove(item);
      item.destroy();
    });

    const canBack = this.page > 0;
    const canNext = this.page < this.totalPages - 1;

    const allPageBtns = [
      {
        text: '<',
        page: this.page - 1,
        color: canBack ? '#C4CDD5' : '#f2f2f2',
        img: canBack ? 'pagination' : 'pagination-disabled',
      },
      ...pageBtns.map((item) => ({
        ...item,
        color: this.page === item.page ? '#7C2828' : '#000000',
        img: this.page === item.page ? 'pagination-active' : 'pagination',
      })),
      {
        text: '>',
        page: this.page + 1,
        color: canNext ? '#C4CDD5' : '#f2f2f2',
        img: canNext ? 'pagination' : 'pagination-disabled',
      },
    ];

    const paginationY = this.listY + this.listContainer.height + 80;
    this.paginations = allPageBtns.reverse().map((item, index) => {
      const x = width / 2 + this.popup.width / 2 - 120 - index * (paginationBtnSize + paginationBtnGap);
      const btn = new TextButton(
        this.scene,
        x,
        paginationY,
        item.img,
        item.img,
        () => this.changePage(item.page),
        item.text,
        {
          fontSize: '31px',
          color: item.color,
        }
      );
      this.add(btn);
      return btn;
    });
  }
}

export default PopupWarAttack;
