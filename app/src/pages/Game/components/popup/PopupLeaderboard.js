import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import PopupWithdraw from './PopupWithdraw';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs.json';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const rowHeight = 86.3;
const tableTextStyle = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  lineSpacing: 2,
};

class PopupLeaderboard extends Popup {
  numberOfRows = 0;
  stars = [];

  constructor(scene) {
    super(scene, 'popup-extra-large', { title: 'Season Leaderboard', noCloseBtn: true });

    const paddedX = width * 0.13;
    const startingY = this.popup.y - this.popup.height / 2;
    const gameEndsY = startingY + 150;
    const endTimeExtensionY = gameEndsY + 90;
    const prizePoolContainerY = endTimeExtensionY + 180;
    const reputationY = prizePoolContainerY + 210;
    const leaderboardHeaderY = reputationY + 140;
    this.leaderboardY = leaderboardHeaderY + 80;

    // child modals
    const popupWithdraw = new PopupWithdraw(scene, this);
    scene.add.existing(popupWithdraw);

    const gameEndsIn = scene.add
      .text(width / 2, gameEndsY, 'GAME ENDS IN: ', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0);
    const clockIcon = scene.add.image(width / 2, gameEndsY, 'icon-clock').setOrigin(0, 0);
    this.gameEndTime = scene.add.text(width * 0.57, gameEndsY, '--d --h --m --s', {
      fontSize: fontSizes.large,
      color: colors.black,
      fontFamily: fontFamilies.extraBold,
    });
    this.endTimeExtension = scene.add
      .text(width / 2, endTimeExtensionY, 'Every Gangster purchased increases time by - hour', {
        fontSize: fontSizes.small,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0);
    this.add(gameEndsIn);
    this.add(clockIcon);
    this.add(this.gameEndTime);
    this.add(this.endTimeExtension);

    const prizePoolContainer = scene.add
      .image(width / 2, prizePoolContainerY, 'text-container-outlined')
      .setOrigin(0.5, 0.5);
    const totalPrizePool = scene.add
      .text(paddedX, prizePoolContainerY, 'Total Prize Pool', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    const infoButton = new Button(
      scene,
      width / 2 + 20,
      prizePoolContainerY - 20,
      'button-info',
      'button-info-pressed',
      () => console.log('open info modal'),
      { sound: 'open' }
    );
    this.prizePool = scene.add
      .text(width - paddedX - 140, prizePoolContainerY, '0.00', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(1, 0.5);
    const ethIcon = scene.add.image(width - paddedX, prizePoolContainerY, 'icon-eth').setOrigin(1, 0.5);
    this.add(prizePoolContainer);
    this.add(totalPrizePool);
    this.add(infoButton);
    this.add(this.prizePool);
    this.add(ethIcon);

    const reputationContainer = scene.add.image(width / 2, reputationY, 'text-container-large').setOrigin(0.5, 0.5);
    const reputationTitle = scene.add
      .text(width / 2, reputationY, 'Reputation', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(reputationContainer);
    this.add(reputationTitle);

    const tableHeaderTextStyle = {
      fontSize: fontSizes.small,
      color: colors.brown,
      fontFamily: fontFamilies.bold,
    };
    const rank = scene.add.text(paddedX, leaderboardHeaderY, 'Rank', tableHeaderTextStyle);
    const name = scene.add.text(width * 0.33, leaderboardHeaderY, 'Name', tableHeaderTextStyle);
    const reputation = scene.add.text(width * 0.53, leaderboardHeaderY, 'Reputation', tableHeaderTextStyle);
    const ethRewards = scene.add.text(width * 0.72, leaderboardHeaderY, 'ETH Rewards', tableHeaderTextStyle);
    this.add(rank);
    this.add(name);
    this.add(reputation);
    this.add(ethRewards);

    this.leaderboardContainer = scene.add.image(width / 2, this.leaderboardY, 'container-large').setOrigin(0.5, 0);
    this.add(this.leaderboardContainer);

    this.crownGold = scene.add.image(0, 0, 'icon-crown-gold').setOrigin(0, 0);
    this.crownSilver = scene.add.image(0, rowHeight, 'icon-crown-silver').setOrigin(0, 0);
    this.crownCopper = scene.add.image(0, rowHeight * 2, 'icon-crown-copper').setOrigin(0, 0);
    this.rankNumbers = scene.add.text(width * 0.06, 0, '', { ...tableTextStyle, align: 'center' }).setOrigin(0.5, 0);
    this.usernames = scene.add.text(width * 0.25, 0, '', { ...tableTextStyle, align: 'center' }).setOrigin(0.5, 0);
    this.networths = scene.add.text(width * 0.45, 0, '', { ...tableTextStyle, align: 'right' });
    this.ethRewards = scene.add.text(width * 0.67, 0, '', { ...tableTextStyle, align: 'center' }).setOrigin(0.5, 0);
    this.contentContainer = scene.add
      .container()
      .add([
        this.crownGold,
        this.crownSilver,
        this.crownCopper,
        this.rankNumbers,
        this.usernames,
        this.networths,
        this.ethRewards,
      ])
      .setSize(200, this.rankNumbers.height);

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

    scene.game.events.on('update-season', (data) => this.updateValues(data));
    scene.game.events.on('update-leaderboard', (data) => this.updateLeaderboard(data));
    scene.game.events.on('update-season-countdown', (string) => (this.gameEndTime.text = string));
  }

  onOpen() {
    this.scene.game.events.emit('request-season');
  }

  cleanup() {
    this.scene.game.events.emit('close-leaderboard-modal');
  }

  updateValues(season) {
    console.log('season', season);
    const { name, timeStepInHours, prizePool } = season;
    this.setTitle(`${name} Leaderboard`);
    this.endTimeExtension.text = `Every Gangster purchased increases time by ${timeStepInHours} hour`;
    this.prizePool.text = formatter.format(prizePool);
  }
  updateLeaderboard(leaderboard) {
    console.log('leaderboard', leaderboard);
    const displayedLeaderboard = leaderboard.filter(({ reward }) => reward > 0);

    this.crownGold.setVisible(displayedLeaderboard.length >= 1);
    this.crownSilver.setVisible(displayedLeaderboard.length >= 2);
    this.crownCopper.setVisible(displayedLeaderboard.length >= 3);
    this.rankNumbers.text = displayedLeaderboard.map((_, index) => index + 1).join('\n\n');
    this.usernames.text = displayedLeaderboard.map(({ username }) => `@${username}`).join('\n\n');
    this.networths.text = displayedLeaderboard.map(({ networth }) => networth).join('\n\n');
    this.ethRewards.text = displayedLeaderboard.map(({ reward }) => `~${formatter.format(reward)}`).join('\n\n');

    if (this.numberOfRows === displayedLeaderboard.length) return;
    this.numberOfRows = displayedLeaderboard.length;

    // redraw table if numberOfRows changed
    this.contentContainer.setSize(200, this.rankNumbers.height);
    if (this.table) this.remove(this.table);
    if (this.stars.length) {
      for (let star of this.stars) {
        this.remove(star);
      }
    }

    this.stars = [];
    for (let i = 0; i < displayedLeaderboard.length; i++) {
      const y = i * rowHeight;
      const star = this.scene.add.image(width * 0.52, y, 'icon-star').setOrigin(0, 0);
      this.stars.push(star);
    }
    this.contentContainer.add(this.stars);

    const visibleRatio = this.leaderboardContainer.height / this.contentContainer.height;
    this.leaderboardThumb = this.scene.rexUI.add
      .roundRectangle({
        height: visibleRatio < 1 ? this.leaderboardContainer.height * visibleRatio : 0,
        radius: 13,
        color: 0xe3d6c7,
      })
      .setVisible(false);

    this.table = new ScrollablePanel(this.scene, {
      x: width / 2,
      y: this.leaderboardY + this.leaderboardContainer.height / 2,
      width: this.leaderboardContainer.width,
      height: this.leaderboardContainer.height,
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

export default PopupLeaderboard;
