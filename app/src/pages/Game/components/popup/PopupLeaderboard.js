import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import PopupPrizePool from './PopupPrizePool';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';
import { getOrdinalSuffix } from '../../../../utils/strings';

const { width, height } = configs;
const rowHeight = 82;
const largeBlackExtraBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.extraBold };
const largeBlackBold = { fontSize: fontSizes.large, color: colors.black, fontFamily: fontFamilies.bold };
const mediumBlackBoldRight = {
  fontSize: fontSizes.medium,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'right',
};
const smallBrownExtraBold = { fontSize: fontSizes.small, color: colors.brown, fontFamily: fontFamilies.extraBold };
const smallBrownBold = { fontSize: fontSizes.small, color: colors.brown, fontFamily: fontFamilies.bold };
const smallBlackBold = { fontSize: fontSizes.small, color: colors.black, fontFamily: fontFamilies.bold };

class PopupLeaderboard extends Popup {
  isEnded = false;
  numberOfRows = 0;
  stars = [];

  constructor(scene) {
    super(scene, 'popup-extra-large', { title: 'Season Leaderboard', noCloseBtn: true });

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const gameEndsY = startingY + 150;
    const endTimeExtensionY = gameEndsY + 90;
    const prizePoolContainerY = endTimeExtensionY + 180;
    const reputationY = prizePoolContainerY + 210;
    const leaderboardHeaderY = reputationY + 140;
    this.leaderboardY = leaderboardHeaderY + 80;

    // child modals
    const popupPrizePool = new PopupPrizePool(scene, this);
    scene.add.existing(popupPrizePool);

    this.gameEndsIn = scene.add.text(width / 2, gameEndsY, 'GAME ENDS IN: ', largeBlackExtraBold).setOrigin(1, 0);
    this.clockIcon = scene.add.image(width / 2, gameEndsY, 'icon-clock').setOrigin(0, 0);
    this.gameEndTime = scene.add.text(
      width / 2 + this.popup.width * 0.07,
      gameEndsY,
      '--d --h --m --s',
      largeBlackExtraBold
    );
    this.endTimeExtension = scene.add
      .text(width / 2, endTimeExtensionY, 'Every Gangster purchased increases time by - hour', smallBrownBold)
      .setOrigin(0.5, 0);
    this.add(this.gameEndsIn);
    this.add(this.clockIcon);
    this.add(this.gameEndTime);
    this.add(this.endTimeExtension);

    this.youFinished = scene.add
      .text(width / 2, gameEndsY, `You finished at`, mediumBlackBoldRight)
      .setOrigin(1, -0.13)
      .setVisible(false);
    this.with = scene.add
      .text(width / 2, endTimeExtensionY, `with`, mediumBlackBoldRight)
      .setOrigin(1, -0.12)
      .setVisible(false);
    this.finishedAt = scene.add.text(width * 0.51, gameEndsY, '', largeBlackExtraBold).setVisible(false);
    this.finishedReward = scene.add.text(width * 0.51, endTimeExtensionY, '', largeBlackBold).setVisible(false);
    this.ethIcon = scene.add
      .image(width * 0.66, endTimeExtensionY, 'eth-coin')
      .setOrigin(0, 0)
      .setVisible(false);
    this.add(this.youFinished);
    this.add(this.with);
    this.add(this.finishedAt);
    this.add(this.finishedReward);
    this.add(this.ethIcon);

    const prizePoolContainer = scene.add
      .image(width / 2, prizePoolContainerY, 'text-container-outlined')
      .setOrigin(0.5, 0.5);
    const totalPrizePool = scene.add
      .text(paddedX, prizePoolContainerY, 'Total Prize Pool', largeBlackExtraBold)
      .setOrigin(0, 0.5);
    const infoButton = new Button(
      scene,
      width / 2 + 20,
      prizePoolContainerY - 20,
      'button-info',
      'button-info-pressed',
      () => {
        this.close();
        popupPrizePool.open();
      },
      { sound: 'open' }
    );
    this.prizePool = scene.add
      .text(width - paddedX - 140, prizePoolContainerY, '0.00', largeBlackExtraBold)
      .setOrigin(1, 0.5);
    const ethIcon = scene.add.image(width - paddedX, prizePoolContainerY, 'icon-eth').setOrigin(1, 0.5);
    this.add(prizePoolContainer);
    this.add(totalPrizePool);
    this.add(infoButton);
    this.add(this.prizePool);
    this.add(ethIcon);

    const reputationContainer = scene.add.image(width / 2, reputationY, 'text-container-large').setOrigin(0.5, 0.5);
    const reputationTitle = scene.add.text(width / 2, reputationY, 'Reputation', largeBlackBold).setOrigin(0.5, 0.5);
    this.add(reputationContainer);
    this.add(reputationTitle);

    const rank = scene.add.text(paddedX, leaderboardHeaderY, 'Rank', smallBrownBold);
    const name = scene.add.text(leftMargin + this.popup.width * 0.3, leaderboardHeaderY, 'Name', smallBrownBold);
    const reputation = scene.add.text(
      leftMargin + this.popup.width * 0.5,
      leaderboardHeaderY,
      'Reputation',
      smallBrownBold
    );
    const ethRewards = scene.add.text(
      leftMargin + this.popup.width * 0.7,
      leaderboardHeaderY,
      'ETH Rewards',
      smallBrownBold
    );
    this.add(rank);
    this.add(name);
    this.add(reputation);
    this.add(ethRewards);

    this.leaderboardContainer = scene.add.image(width / 2, this.leaderboardY, 'container-large').setOrigin(0.5, 0);
    this.add(this.leaderboardContainer);

    this.crownGold = scene.add.image(0, 0, 'icon-crown-gold').setOrigin(0, 0).setVisible(false);
    this.crownSilver = scene.add.image(0, rowHeight, 'icon-crown-silver').setOrigin(0, 0).setVisible(false);
    this.crownCopper = scene.add
      .image(0, rowHeight * 2, 'icon-crown-copper')
      .setOrigin(0, 0)
      .setVisible(false);
    this.rankNumbers = scene.add
      .text(this.popup.width * 0.06, 0, '', { ...smallBlackBold, align: 'center' })
      .setOrigin(0.5, 0);
    this.usernames = scene.add
      .text(this.popup.width * 0.25, 0, '', { ...smallBlackBold, align: 'center' })
      .setOrigin(0.5, 0);
    this.networths = scene.add.text(this.popup.width * 0.45, 0, '', { ...smallBlackBold, align: 'right' });
    this.ethRewards = scene.add
      .text(this.popup.width * 0.7, 0, '', { ...smallBlackBold, align: 'center' })
      .setOrigin(0.5, 0);
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

    const playerRankY = this.leaderboardY + this.leaderboardContainer.height;
    const playerOriginY = 2;
    this.playerRankContainer = scene.add.image(width / 2, playerRankY, 'player-rank-container').setOrigin(0.52, 1.2);
    this.playerRank = scene.add
      .text(paddedX + this.popup.width * 0.06, playerRankY, '', { ...smallBrownExtraBold, align: 'center' })
      .setOrigin(0.5, playerOriginY);
    this.playerUsername = scene.add
      .text(paddedX + this.popup.width * 0.25, playerRankY, 'YOU', { ...smallBrownExtraBold, align: 'center' })
      .setOrigin(0.5, playerOriginY);
    this.playerNetworth = scene.add
      .text(paddedX + this.popup.width * 0.45, playerRankY, '', { ...smallBrownExtraBold, align: 'right' })
      .setOrigin(0, playerOriginY);
    this.playerStar = scene.add
      .image(paddedX + this.popup.width * 0.52, playerRankY, 'icon-star')
      .setOrigin(0, playerOriginY);
    this.playerReward = scene.add
      .text(paddedX + this.popup.width * 0.7, playerRankY, '', { ...smallBrownExtraBold, align: 'center' })
      .setOrigin(0.5, playerOriginY);
    this.add(this.playerRankContainer);
    this.add(this.playerRank);
    this.add(this.playerUsername);
    this.add(this.playerStar);
    this.add(this.playerNetworth);
    this.add(this.playerReward);

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

    this.nextSeason = scene.add
      .text(width / 2, height / 2 + this.popup.height / 2 - 80, 'Next season will begin soon', {
        fontSize: fontSizes.large,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.add(this.nextSeason);

    scene.game.events.on('update-season', (data) => this.updateValues(data));
    scene.game.events.on('update-leaderboard', (data) => this.updateLeaderboard(data));
    scene.game.events.on('update-season-countdown', (string) => (this.gameEndTime.text = string));
  }

  onOpen() {
    this.scene.game.events.emit('open-leaderboard-modal');
  }

  cleanup() {
    this.scene.game.events.emit('close-leaderboard-modal');
  }

  updateValues(season) {
    console.log('season', season);
    const { name, timeStepInHours, prizePool, isEnded } = season;
    this.updateEndedState(isEnded);

    const title = this.isEnded ? `${name} Ended` : `${name} Leaderboard`;
    this.setTitle(title);
    this.endTimeExtension.text = `Every Gangster purchased increases time by ${timeStepInHours} hour`;
    this.prizePool.text = formatter.format(prizePool);
  }

  updateEndedState(isEnded) {
    if (this.isEnded === isEnded) return;
    this.isEnded = isEnded;

    this.gameEndsIn.setVisible(!isEnded);
    this.clockIcon.setVisible(!isEnded);
    this.gameEndTime.setVisible(!isEnded);
    this.endTimeExtension.setVisible(!isEnded);
    this.buttonBack.setVisible(!isEnded);
    if (isEnded) this.remove(this.buttonBack);
    else this.add(this.buttonBack);

    this.youFinished.setVisible(isEnded);
    this.finishedAt.setVisible(isEnded);
    this.with.setVisible(isEnded);
    this.finishedReward.setVisible(isEnded);
    this.ethIcon.setVisible(isEnded);
    this.nextSeason.setVisible(isEnded);
  }

  updateLeaderboard(leaderboard) {
    if (!leaderboard.length) return;

    this.crownGold.setVisible(leaderboard.length >= 1);
    this.crownSilver.setVisible(leaderboard.length >= 2);
    this.crownCopper.setVisible(leaderboard.length >= 3);
    this.rankNumbers.text = leaderboard.map(({ rank }) => rank).join('\n\n');
    this.usernames.text = leaderboard.map(formatUsername).join('\n\n');
    this.networths.text = leaderboard.map(({ networth }) => networth).join('\n\n');
    this.ethRewards.text = leaderboard.map(({ reward }) => `~${formatter.format(reward)}`).join('\n\n');

    const userRecord = leaderboard.find(({ isUser }) => isUser);
    this.playerRank.text = userRecord.rank.toLocaleString();
    this.playerNetworth.text = userRecord.networth;
    this.playerReward.text = `~${formatter.format(userRecord.reward)}`;
    this.finishedAt.text = `${userRecord.rank.toLocaleString()}${getOrdinalSuffix(userRecord.rank)} place`;
    this.finishedReward.text = formatter.format(userRecord.reward);

    if (this.numberOfRows === leaderboard.length) return;
    this.numberOfRows = leaderboard.length;

    // redraw table if numberOfRows changed
    this.contentContainer.setSize(200, this.rankNumbers.height);
    if (this.table) this.remove(this.table);
    if (this.stars.length) {
      for (let star of this.stars) {
        star.destroy();
        this.remove(star);
      }
    }

    this.stars = [];
    for (let i = 0; i < leaderboard.length; i++) {
      const y = i * rowHeight;
      const star = this.scene.add.image(this.popup.width * 0.52, y, 'icon-star').setOrigin(0, 0);
      this.stars.push(star);
    }
    this.contentContainer.add(this.stars);

    const tableHeight = this.leaderboardContainer.height - this.playerRankContainer.height;
    const visibleRatio = tableHeight / this.contentContainer.height;
    console.log({ tableHeight, contentContainerHeight: this.contentContainer.height, visibleRatio });
    this.leaderboardThumb = this.scene.rexUI.add
      .roundRectangle({
        height: visibleRatio < 1 ? tableHeight * visibleRatio : 0,
        radius: 13,
        color: 0xe3d6c7,
      })
      .setVisible(false);

    this.table = new ScrollablePanel(this.scene, {
      x: width / 2,
      y: this.leaderboardY + tableHeight / 2,
      width: this.leaderboardContainer.width,
      height: tableHeight,
      scrollMode: 'y',
      background: this.scene.rexUI.add.roundRectangle({ radius: 10 }),
      panel: { child: this.contentContainer, mask: { padding: 1 } },
      slider: { thumb: this.leaderboardThumb },
      mouseWheelScroller: { focus: false, speed: 0.3 },
      space: { left: 50, right: 40, top: 40, bottom: 40, panel: 20, header: 10, footer: 10 },
    }).layout();
    if (leaderboard.length <= 10) {
      this.table.setScrollerEnable(false);
    } else {
      this.table.setScrollerEnable(true);
    }
    this.add(this.table);

    this.table.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.leaderboardThumb.visible) return;
      this.leaderboardThumb.setVisible(true);
    });
  }
}

const MAX_USERNAME_LENGTH = 15;
const formatUsername = ({ username }) => {
  const displayedUsername = username.slice(0, MAX_USERNAME_LENGTH);
  const ellipses = username.length > MAX_USERNAME_LENGTH ? '...' : '';

  return `@${displayedUsername}${ellipses}`;
};

export default PopupLeaderboard;
