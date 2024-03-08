import Phaser from 'phaser';
import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';
import { getOrdinalSuffix } from '../../../../utils/strings';

const { width, height } = configs;
const rowHeight = 84;
const avatarSize = 0.18;
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
  isUserActive = false;
  numberOfRows = 0;
  rewardTexts = [];
  items = [];
  avatars = {};

  constructor(scene, { isSimulator, onClose, onClickRank, onClickReputation } = {}) {
    super(scene, 'popup-extra-large', { title: 'Season Leaderboard', noCloseBtn: true });

    this.onCloseCallback = onClose;
    this.isSimulator = isSimulator;
    const events = {
      updateSeason: isSimulator ? 'simulator-update-season' : 'update-season',
      updateLeaderboard: isSimulator ? 'simulator-update-leaderboard' : 'update-leaderboard',
      updateSeasonCountdown: isSimulator ? 'simulator-update-season-countdown' : 'update-season-countdown',
      openLeaderboardModal: isSimulator ? 'simulator-open-leaderboard-modal' : 'open-leaderboard-modal',
      closeLeaderboardModal: isSimulator ? 'simulator-close-leaderboard-modal' : 'close-leaderboard-modal',
    };
    this.events = events;

    const leftMargin = this.popup.x - this.popup.width / 2;
    const paddedX = leftMargin + this.popup.width * 0.1;
    const startingY = this.popup.y - this.popup.height / 2;
    const gameEndsY = startingY + 150;
    const endTimeExtensionY = gameEndsY + 90;
    this.prizePoolContainerY = endTimeExtensionY + 180;
    const reputationY = this.prizePoolContainerY + 210;
    const leaderboardHeaderY = reputationY + 140;
    this.leaderboardY = leaderboardHeaderY + 80;

    this.gameEndsIn = scene.add.text(width / 2 - 40, gameEndsY, 'GAME ENDS IN: ', largeBlackExtraBold).setOrigin(1, 0);
    this.clockIcon = scene.add.image(width / 2 - 40, gameEndsY, 'icon-clock').setOrigin(0, 0);
    this.gameEndTime = scene.add.text(
      width / 2 + this.popup.width * 0.03,
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
      .image(width / 2, this.prizePoolContainerY, 'text-container-outlined')
      .setOrigin(0.5, 0.5);
    const totalPrizePool = scene.add
      .text(paddedX, this.prizePoolContainerY, 'Total Prize Pool', largeBlackExtraBold)
      .setOrigin(0, 0.5);
    const infoButton = new Button(
      scene,
      width / 2 + 20,
      this.prizePoolContainerY - 20,
      'button-info',
      'button-info-pressed',
      () => {
        if (isSimulator) return;
        this.close();
        scene.popupPrizePool.open();
      },
      { sound: 'open' }
    );
    this.prizePool = scene.add
      .text(width - paddedX - 140, this.prizePoolContainerY, '0.00', largeBlackExtraBold)
      .setOrigin(1, 0.5);
    const ethIcon = scene.add.image(width - paddedX, this.prizePoolContainerY, 'icon-eth').setOrigin(1, 0.5);
    this.add(prizePoolContainer);
    this.add(totalPrizePool);
    this.add(infoButton);
    this.add(this.prizePool);
    this.add(ethIcon);

    this.modeSwitch = new ModeSwitch(scene, width / 2, reputationY, {
      modeOne: {
        title: 'Ranking',
        onClick: () => {
          this.buttonBack.setX(width / 2);
          this.buttonRetire.setVisible(false);
          this.rewardTexts.forEach((component, index) => {
            component.text = this.rankRewards[index];
          });
          this.playerReward.text = `~${formatter.format(this.userRankingReward)}`;
          if (isSimulator) onClickRank();
        },
      },
      modeTwo: {
        title: 'Reputation',
        onClick: () => {
          this.buttonBack.setX(width / 2 - this.popup.width * 0.23);
          this.buttonRetire.setVisible((true && !this.isEnded) || isSimulator);
          this.rewardTexts.forEach((component, index) => {
            component.text = this.reputationRewards[index];
          });
          this.playerReward.text = `~${formatter.format(this.userReputationReward)}`;
          if (isSimulator) onClickReputation();
        },
      },
    });
    this.add(this.modeSwitch);

    const rank = scene.add.text(paddedX, leaderboardHeaderY, 'Rank', smallBrownBold);
    const name = scene.add.text(leftMargin + this.popup.width * 0.3, leaderboardHeaderY, 'Name', smallBrownBold);
    const reputation = scene.add.text(
      leftMargin + this.popup.width * 0.55,
      leaderboardHeaderY,
      'Reputation',
      smallBrownBold
    );
    const ethRewards = scene.add.text(leftMargin + this.popup.width * 0.77, leaderboardHeaderY - 30, 'ETH\nRewards', {
      ...smallBrownBold,
      align: 'center',
    });
    this.add(rank);
    this.add(name);
    this.add(reputation);
    this.add(ethRewards);

    this.leaderboardContainer = scene.add.image(width / 2, this.leaderboardY, 'container-large').setOrigin(0.5, 0);
    this.add(this.leaderboardContainer);

    this.crownGold = scene.add
      .image(0, rowHeight / 2, 'icon-crown-gold')
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.crownSilver = scene.add
      .image(0, rowHeight + rowHeight / 2, 'icon-crown-silver')
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.crownCopper = scene.add
      .image(0, rowHeight * 2 + rowHeight / 2, 'icon-crown-copper')
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.contentContainer = scene.add
      .container()
      .add([this.crownGold, this.crownSilver, this.crownCopper])
      .setSize(200, 0);

    const playerRankY = this.leaderboardY + this.leaderboardContainer.height;
    const playerOriginY = 2;
    this.playerRankContainer = scene.add.image(width / 2, playerRankY, 'player-rank-container').setOrigin(0.52, 1.2);
    this.playerRank = scene.add
      .text(paddedX + this.popup.width * 0.06, playerRankY, '', { ...smallBrownExtraBold, align: 'center' })
      .setOrigin(0.5, playerOriginY);
    this.playerUsername = scene.add
      .text(paddedX + this.popup.width * 0.18, playerRankY, 'YOU', smallBrownExtraBold)
      .setOrigin(0, playerOriginY);
    this.playerNetworth = scene.add
      .text(paddedX + this.popup.width * 0.52, playerRankY, '', { ...smallBrownExtraBold, align: 'right' })
      .setOrigin(0.5, playerOriginY);
    this.playerStar = scene.add
      .image(paddedX + this.popup.width * 0.52, playerRankY, 'icon-star')
      .setOrigin(0, playerOriginY);
    this.playerReward = scene.add
      .text(paddedX + this.popup.width * 0.73, playerRankY, '', { ...smallBrownExtraBold, align: 'center' })
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
      () => {
        this.close();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.buttonBack);

    this.buttonRetire = new TextButton(
      scene,
      width / 2 + this.popup.width * 0.23,
      height / 2 + this.popup.height / 2 - 20,
      'button-green',
      'button-green-pressed',
      () => {
        this.close();
        scene.popupRetire.open();
      },
      'Retire',
      { fontSize: '82px', sound: 'open' }
    ).setVisible(false);
    this.add(this.buttonRetire);

    this.nextSeason = scene.add
      .text(width / 2, height / 2 + this.popup.height / 2 - 80, 'Next season will begin soon', {
        fontSize: fontSizes.large,
        color: colors.brown,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.add(this.nextSeason);

    scene.game.events.on(events.updateSeason, (data) => this.updateValues(data));
    scene.game.events.on(events.updateLeaderboard, (data) => this.updateLeaderboard(data));
    scene.game.events.on(events.updateSeasonCountdown, (string) => (this.gameEndTime.text = string));
    scene.game.events.on('update-active-status', ({ active }) => {
      this.buttonRetire.setDisabledState(!active || isSimulator);
    });
    scene.game.events.emit('request-active-status');
  }

  onOpen() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(true);
    }
    this.scene.game.events.emit(this.events?.openLeaderboardModal || '');
  }

  cleanup() {
    this.onCloseCallback?.();
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(false);
      this.leaderboardThumb?.setVisible(false);
    }
    this.scene.game.events.emit(this.events?.closeLeaderboardModal || '');
  }

  updateValues(season) {
    const { name, timeStepInMinutes, prizePool, isEnded } = season;

    this.isEnded = isEnded;
    this.updateEndedState();
    const title = this.isEnded ? `${name} Ended` : `${name} Leaderboard`;
    this.setTitle(title);
    this.endTimeExtension.text = `Every Gangster purchased increases time by ${timeStepInMinutes} minute${
      timeStepInMinutes > 1 ? 's' : ''
    }`;
    this.prizePool.text = formatter.format(prizePool);
  }

  updateEndedState() {
    this.gameEndsIn.setVisible(!this.isEnded);
    this.clockIcon.setVisible(!this.isEnded);
    this.gameEndTime.setVisible(!this.isEnded);
    this.endTimeExtension.setVisible(!this.isEnded);
    this.buttonBack.setVisible(!this.isEnded);
    this.buttonRetire.setVisible(!this.isEnded && this.modeSwitch.mode === 'Reputation');
    if (this.isEnded) {
      if (!this.isSimulator) {
        this.remove(this.buttonBack);
        this.remove(this.buttonRetire);
      }
      let topText;
      let bottomText;
      let textAlign;
      let textOriginX;
      let bottomTextOriginY;

      if (this.isUserActive) {
        topText = 'You finished at';
        bottomText = 'with';
        textAlign = 'right';
        textOriginX = 1;
        bottomTextOriginY = -0.12;
      } else {
        topText = 'You did not qualify for the';
        bottomText = 'leaderboard this season.';
        textAlign = 'center';
        textOriginX = 0.5;
        bottomTextOriginY = 0.2;
      }

      this.youFinished.text = topText;
      this.with.text = bottomText;

      this.youFinished.setStyle({ ...mediumBlackBoldRight, align: textAlign });
      this.youFinished.setOrigin(textOriginX, -0.13);
      this.with.setStyle({ ...mediumBlackBoldRight, align: textAlign });
      this.with.setOrigin(textOriginX, bottomTextOriginY);
    } else {
      this.add(this.buttonBack);
      this.add(this.buttonRetire);
    }

    this.youFinished.setVisible(this.isEnded);
    this.finishedAt.setVisible(this.isEnded && this.isUserActive);
    this.with.setVisible(this.isEnded);
    this.finishedReward.setVisible(this.isEnded && this.isUserActive);
    this.ethIcon.setVisible(this.isEnded && this.isUserActive);
    this.nextSeason.setVisible(this.isEnded && !this.isSimulator);
  }

  updateLeaderboard(leaderboard) {
    if (!leaderboard.length) return;
    const activeLeaderboard = leaderboard.filter((item) => item.active);
    this.users = activeLeaderboard;
    this.rankRewards = activeLeaderboard.map(({ rankReward }) => `~${formatter.format(rankReward)}`);
    this.reputationRewards = activeLeaderboard.map(({ reputationReward }) => `~${formatter.format(reputationReward)}`);
    this.crownGold.setVisible(activeLeaderboard.length >= 1);
    this.crownSilver.setVisible(activeLeaderboard.length >= 2);
    this.crownCopper.setVisible(activeLeaderboard.length >= 3);
    this.items.map((item) => {
      this.contentContainer.remove(item);
      item.destroy();
    });

    this.items = [];
    this.rewardTexts = [];
    this.avatars = {};
    const isRankingMode = this.modeSwitch.mode === 'Ranking';
    const firstNetworthText = this.scene.add
      .text(this.popup.width * 0.52, rowHeight / 2, this.users[0].networth.toLocaleString(), {
        ...smallBlackBold,
        align: 'right',
      })
      .setOrigin(0.5, 0.5);
    for (let i = 0; i < this.users.length; i++) {
      const y = i * rowHeight;
      const { rank, username, networth } = this.users[i];
      const rankText = this.scene.add
        .text(this.popup.width * 0.06, y + rowHeight / 2, `${rank}`, { ...smallBlackBold, align: 'center' })
        .setOrigin(0.5, 0.5);

      const usernameText = this.scene.add
        .text(this.popup.width * 0.18, y + rowHeight / 2, formatUsername({ username }), smallBlackBold)
        .setOrigin(0, 0.5);
      const avatar = this.scene.add
        .rexCircleMaskImage(usernameText.x - 90, y + rowHeight / 2, 'avatar')
        .setOrigin(0, 0.5)
        .setDisplaySize(avatarSize, avatarSize);
      const networthText =
        i === 0
          ? firstNetworthText
          : this.scene.add
              .text(firstNetworthText.x + firstNetworthText.width / 2, y + rowHeight / 2, networth.toLocaleString(), {
                ...smallBlackBold,
                align: 'right',
              })
              .setOrigin(1, 0.5);
      const star = this.scene.add
        .image(firstNetworthText.x + firstNetworthText.width / 2 + 10, y + rowHeight / 2, 'icon-star')
        .setOrigin(0, 0.5);

      const rewardText = this.scene.add
        .text(
          this.popup.width * 0.73,
          y + rowHeight / 2,
          isRankingMode ? this.rankRewards[i] : this.reputationRewards[i],
          { ...smallBlackBold, align: 'center' }
        )
        .setOrigin(0.5, 0.5);

      this.rewardTexts.push(rewardText);
      this.avatars[username] = avatar;
      this.items.push(avatar, rankText, usernameText, networthText, star, rewardText);
    }
    this.contentContainer.add(this.items);

    // load avatar
    let loader = new Phaser.Loader.LoaderPlugin(this.scene);
    let textureManager = new Phaser.Textures.TextureManager(this.scene.game);
    activeLeaderboard.forEach(({ username, avatarURL }) => {
      // ask the LoaderPlugin to load the texture
      if (!textureManager.exists(`${username}-avatar`)) loader.image(`${username}-avatar`, avatarURL);
    });
    loader.once(Phaser.Loader.Events.COMPLETE, () =>
      Object.keys(this.avatars).forEach((username) => {
        const avatar = this.avatars[username];
        avatar.setTexture(`${username}-avatar`);
      })
    );
    loader.start();

    const userRecord = leaderboard.find(({ isUser }) => isUser);
    this.isUserActive = userRecord.active;
    this.updateEndedState();

    this.userRankingReward = userRecord.rankReward;
    this.userReputationReward = userRecord.reputationReward;
    this.playerRank.text = userRecord.rank.toLocaleString();
    this.playerNetworth.text = userRecord.networth;
    this.playerStar.x = this.playerNetworth.x + this.playerNetworth.width / 2 + 10;
    this.playerReward.text = `~${formatter.format(isRankingMode ? this.userRankingReward : this.userReputationReward)}`;
    this.finishedAt.text = `${userRecord.rank.toLocaleString()}${getOrdinalSuffix(userRecord.rank)} place`;
    this.finishedReward.text = formatter.format(userRecord.rankReward);

    if (this.numberOfRows === activeLeaderboard.length) return;
    this.numberOfRows = activeLeaderboard.length;

    // redraw table if numberOfRows changed
    const contentContainerHeight = this.users.length * rowHeight;
    this.contentContainer.setSize(200, contentContainerHeight);
    if (this.table) {
      this.remove(this.table);
      this.table.destroy(true);
      this.table = null;
    }

    const tableHeight = this.leaderboardContainer.height - this.playerRankContainer.height;
    const visibleRatio = tableHeight / this.contentContainer.height;
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
      mouseWheelScroller: { focus: true, speed: 0.3 },
      space: { left: 50, right: 40, top: 40, bottom: 40, panel: 20, header: 10, footer: 10 },
    }).layout();
    if (activeLeaderboard.length <= 10) {
      this.table.setMouseWheelScrollerEnable(false);
    } else {
      this.table.setMouseWheelScrollerEnable(true);
    }
    this.add(this.table);

    this.table.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.leaderboardThumb.visible) return;
      this.leaderboardThumb.setVisible(true);
    });
  }
}

const MAX_USERNAME_LENGTH = 12;
const formatUsername = ({ username }) => {
  const displayedUsername = username.slice(0, MAX_USERNAME_LENGTH);
  const ellipses = username.length > MAX_USERNAME_LENGTH ? '...' : '';

  return `@${displayedUsername}${ellipses}`;
};

class ModeSwitch extends Phaser.GameObjects.Container {
  mode = '';

  constructor(scene, x, y, { containerImg = 'tabs-container', modeOne, modeTwo } = {}) {
    super(scene, 0, 0);
    this.mode = modeOne.title;
    const textStyle = { fontSize: '56px', color: '#ffffff', fontFamily: fontFamilies.bold, align: 'center' };

    this.container = scene.add.image(x, y, containerImg).setOrigin(0.5, 0.5);
    this.add(this.container);

    const buttonOffset = this.container.width / 4;
    this.btnOneInactive = scene.add.image(x - buttonOffset, y, 'button-blue-med-outlined').setOrigin(0.5, 0.5);
    this.btnOne = scene.add.image(x - buttonOffset, y, 'button-blue-med').setOrigin(0.5, 0.5);
    this.btnTwoInactive = scene.add.image(x + buttonOffset, y, 'button-blue-med-outlined').setOrigin(0.5, 0.5);
    this.btnTwo = scene.add
      .image(x + buttonOffset, y, 'button-blue-med')
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.add(this.btnOneInactive);
    this.add(this.btnOne);
    this.add(this.btnTwoInactive);
    this.add(this.btnTwo);

    this.textOne = scene.add
      .text(x - buttonOffset, y, modeOne.title, textStyle)
      .setStroke('#0004a0', 10)
      .setOrigin(0.5, 0.5);
    this.textTwo = scene.add
      .text(x + buttonOffset, y, modeTwo.title, textStyle)
      .setStroke('#0004a0', 10)
      .setOrigin(0.5, 0.5);
    this.add(this.textOne);
    this.add(this.textTwo);

    this.container
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer, localX, localY, event) => {
        const isModeOneClicked = localX <= this.container.width / 2;
        this.btnOne.setAlpha(Number(isModeOneClicked));
        this.btnTwo.setAlpha(Number(!isModeOneClicked));

        const newMode = isModeOneClicked ? modeOne : modeTwo;
        this.mode = newMode.title;
        newMode.onClick();
      });
  }
}

export default PopupLeaderboard;
