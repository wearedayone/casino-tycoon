import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { formatter } from '../../../../utils/numbers';
import { capitalize } from '../../../../utils/strings';

const { width, height } = configs;

const buttonWidth = 506;
const btnGap = 50;
const rowHeight = 139;
const smallBlackBoldCenter = {
  fontSize: fontSizes.small,
  color: colors.black,
  fontFamily: fontFamilies.bold,
  align: 'center',
};

const MAX_USERNAME_LENGTH = 7;
const formatUsername = ({ username }) => {
  const displayedUsername = username.slice(0, MAX_USERNAME_LENGTH);
  const ellipses = username.length > MAX_USERNAME_LENGTH ? '...' : '';

  return `@${displayedUsername}${ellipses}`;
};

class PopupWarAttackDetail extends Popup {
  loading = false;
  userId = null;
  user = null;
  gamePlay = null;
  warResults = null;
  resultListY = height / 2 - this.popup.height / 2 + 350;
  resultItems = [];
  earnItems = [];

  constructor(scene) {
    super(scene, 'popup-war-attack-detail', { title: 'Profile' });
    this.scene = scene;
    this.earnListY = this.resultListY + 550;

    this.backBtn = new TextButton(
      scene,
      width / 2 - buttonWidth / 2 - btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.loading = false;
        this.close();
        scene.popupWarAttack?.open();
      },
      'Back',
      { sound: 'close', fontSize: '82px' }
    );
    this.add(this.backBtn);

    this.attackBtn = new TextButton(
      scene,
      width / 2 + buttonWidth / 2 + btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        if (this.loading) return;
        this.loading = true;
        scene.game.events.emit('update-war-attack', {
          attackUserId: this.userId,
        });
      },
      'Raid',
      { sound: 'button-1', fontSize: '82px' }
    );
    this.add(this.attackBtn);

    this.usernameText = scene.add
      .text(width / 2, height / 2 - this.popup.height / 2 + 175, '', {
        fontSize: '80px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.usernameText);

    const numberOfAssetTextY = height / 2 + this.popup.height / 2 - 212;
    const numberOfAssetTextGap = 350;
    this.numberOfMachinesText = scene.add
      .text(width / 2 - numberOfAssetTextGap, numberOfAssetTextY, '', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfMachinesText);

    this.numberOfWorkersText = scene.add
      .text(width / 2, numberOfAssetTextY, '', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfWorkersText);

    this.numberOfBuildingsText = scene.add
      .text(width / 2 + numberOfAssetTextGap, numberOfAssetTextY, '', {
        fontSize: '56px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.numberOfBuildingsText);

    this.resultListContainer = scene.add.image(width / 2, this.resultListY, 'container-small').setOrigin(0.5, 0);
    this.add(this.resultListContainer);
    this.resultContentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    this.earnListContainer = scene.add.image(width / 2, this.earnListY, 'container-small').setOrigin(0.5, 0);
    this.add(this.earnListContainer);
    this.earnContentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    scene.game.events.on('update-user-to-attack-detail', ({ user, gamePlay, warResults }) => {
      this.user = user;
      this.gamePlay = gamePlay;
      this.warResults = warResults;
      this.updateDetail();
    });

    scene.game.events.on('update-war-attack-completed', () => {
      this.loading = false;
      this.close();
    });

    // this.updateUserId('did:privy:clonvt4x801zrjr0fecvjgh1a');
  }

  updateUserId(newUserId) {
    this.userId = newUserId;

    this.scene.game.events.emit('request-user-to-attack-detail', { userId: this.userId });
  }

  updateDetail() {
    if (!this.user || !this.gamePlay || !this.warResults) return;

    const { username } = this.user;
    this.usernameText.text = username;

    const { numberOfMachines, numberOfWorkers, numberOfBuildings } = this.gamePlay;
    this.numberOfMachinesText.text = `${formatter.format(numberOfMachines)}`;
    this.numberOfWorkersText.text = `${formatter.format(numberOfWorkers)}`;
    this.numberOfBuildingsText.text = `${formatter.format(numberOfBuildings)}`;

    // clear old items
    this.resultItems.map((item) => {
      this.resultContentContainer.remove(item);
      item.destroy();
    });

    this.earnItems.map((item) => {
      this.earnContentContainer.remove(item);
      item.destroy();
    });

    // format war results
    const formattedWarResults = this.warResults.map((item) => {
      const {
        date,
        attackResults,
        defendResults,
        tokenStolen,
        numberOfMachinesToEarn,
        numberOfMachinesToAttack,
        numberOfMachinesToDefend,
        tokenEarnFromEarning,
        tokenEarnFromAttacking,
      } = item;
      const outgoingResult = attackResults?.length ? capitalize(item.attackResults[0].result) : '-';
      const incomingResult = defendResults?.length
        ? tokenStolen > 0
          ? 'Lose'
          : defendResults.some((item) => item.result === 'win')
          ? 'Win'
          : 'Draw'
        : '-';

      return {
        date,
        outgoingResult,
        incomingResult,
        earnUnits: numberOfMachinesToEarn || 0,
        attackUnits: numberOfMachinesToAttack || 0,
        defendUnits: numberOfMachinesToDefend || 0,
        tokenEarned: (tokenEarnFromEarning || 0) + (tokenEarnFromAttacking || 0),
        tokenLoss: tokenStolen || 0,
        topAttacker: (defendResults || []).sort((user1, user2) => user2.attackUnits - user1.attackUnits)?.[0]
          ?.userUsername,
      };
    });

    this.resultItems = [];
    this.earnItems = [];
    for (let i = 0; i < formattedWarResults.length; i++) {
      const y = i * rowHeight;
      if (i % 2 === 1) {
        const bg1 = this.scene.add.image(this.popup.width / 2 - 90, y, 'row-container').setOrigin(0.5, 0);
        const bg2 = this.scene.add.image(this.popup.width / 2 - 90, y, 'row-container').setOrigin(0.5, 0);
        this.resultItems.push(bg1);
        this.earnItems.push(bg2);
      }

      const {
        date,
        outgoingResult,
        incomingResult,
        earnUnits,
        attackUnits,
        defendUnits,
        tokenEarned,
        tokenLoss,
        topAttacker,
      } = formattedWarResults[i];
      const dateText1 = this.scene.add
        .text(this.popup.width * 0.05, y + rowHeight / 2, `${date}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const dateText2 = this.scene.add
        .text(this.popup.width * 0.05, y + rowHeight / 2, `${date}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const outgoingResultText = this.scene.add
        .text(this.popup.width * 0.23, y + rowHeight / 2, outgoingResult, {
          ...smallBlackBoldCenter,
          color: outgoingResult === 'Lose' ? '#E93D45' : colors.black,
        })
        .setOrigin(0.5, 0.5);
      const incomingResultText = this.scene.add
        .text(this.popup.width * 0.42, y + rowHeight / 2, incomingResult, {
          ...smallBlackBoldCenter,
          color: incomingResult === 'Lose' ? '#E93D45' : colors.black,
        })
        .setOrigin(0.5, 0.5);
      const earnUnitsText = this.scene.add
        .text(this.popup.width * 0.55, y + rowHeight / 2, `${formatter.format(earnUnits)}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const attackUnitsText = this.scene.add
        .text(this.popup.width * 0.67, y + rowHeight / 2, `${formatter.format(attackUnits)}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const defendUnitsText = this.scene.add
        .text(this.popup.width * 0.77, y + rowHeight / 2, `${formatter.format(defendUnits)}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);

      const tokenEarnedText = this.scene.add
        .text(this.popup.width * 0.23, y + rowHeight / 2, `+${formatter.format(tokenEarned)}`, smallBlackBoldCenter)
        .setOrigin(0.5, 0.5);
      const tokenEarnedIcon = this.scene.add
        .image(this.popup.width * 0.23 + tokenEarnedText.width / 2 + 30, y + rowHeight / 2, 'coin3')
        .setOrigin(0.5, 0.5);

      const tokenLossText = this.scene.add
        .text(this.popup.width * 0.47, y + rowHeight / 2, `-${formatter.format(tokenLoss)}`, {
          ...smallBlackBoldCenter,
          color: '#7C2828',
        })
        .setOrigin(0.5, 0.5);
      const tokenLossIcon = this.scene.add
        .image(this.popup.width * 0.47 + tokenLossText.width / 2 + 30, y + rowHeight / 2, 'coin3')
        .setOrigin(0.5, 0.5);

      const topAttackerText = this.scene.add
        .text(
          this.popup.width * 0.75,
          y + rowHeight / 2,
          topAttacker ? `${formatUsername({ username: topAttacker })}` : '-',
          smallBlackBoldCenter
        )
        .setOrigin(0.5, 0.5);

      this.resultItems.push(
        dateText1,
        outgoingResultText,
        incomingResultText,
        earnUnitsText,
        attackUnitsText,
        defendUnitsText
      );

      this.earnItems.push(dateText2, tokenEarnedText, tokenEarnedIcon, tokenLossText, tokenLossIcon, topAttackerText);
    }
    this.resultContentContainer.add(this.resultItems);
    this.earnContentContainer.add(this.earnItems);

    const resultContentContainerHeight = formattedWarResults.length * rowHeight;
    this.resultContentContainer.setSize(0, resultContentContainerHeight);
    if (this.resultTable) {
      this.remove(this.resultTable);
      this.resultTable.destroy(true);
      this.resultTable = null;
    }

    const resultTableHeight = this.resultListContainer.height;
    const resultVisibleRatio = resultTableHeight / resultContentContainerHeight;
    this.resultThumb = this.scene.rexUI.add
      .roundRectangle({
        height: resultVisibleRatio < 1 ? resultTableHeight * resultVisibleRatio : 0,
        radius: 13,
        color: 0xe3d6c7,
      })
      .setVisible(false);

    this.resultTable = new ScrollablePanel(this.scene, {
      x: width / 2,
      y: this.resultListY + resultTableHeight / 2,
      width: this.resultListContainer.width,
      height: resultTableHeight,
      scrollMode: 'y',
      background: this.scene.rexUI.add.roundRectangle({ radius: 10 }),
      panel: { child: this.resultContentContainer, mask: { padding: 1 } },
      slider: { thumb: this.resultThumb },
      mouseWheelScroller: { focus: true, speed: 0.3 },
      space: { left: 20, right: 20, top: 20, bottom: 20, panel: 20, header: 10, footer: 10 },
    }).layout();
    if (formattedWarResults.length <= 3 || !this.visible) {
      this.resultTable.setMouseWheelScrollerEnable(false);
    } else {
      this.resultTable.setMouseWheelScrollerEnable(true);
    }
    this.add(this.resultTable);

    this.resultTable.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.resultThumb.visible) return;
      this.resultThumb.setVisible(true);
    });

    const earnContentContainerHeight = formattedWarResults.length * rowHeight;
    this.earnContentContainer.setSize(0, earnContentContainerHeight);
    if (this.earnTable) {
      this.remove(this.earnTable);
      this.earnTable.destroy(true);
      this.earnTable = null;
    }

    const earnTableHeight = this.earnListContainer.height;
    const earnVisibleRatio = earnTableHeight / earnContentContainerHeight;
    this.earnThumb = this.scene.rexUI.add
      .roundRectangle({
        height: earnVisibleRatio < 1 ? earnTableHeight * earnVisibleRatio : 0,
        radius: 13,
        color: 0xe3d6c7,
      })
      .setVisible(false);

    this.earnTable = new ScrollablePanel(this.scene, {
      x: width / 2,
      y: this.earnListY + earnTableHeight / 2,
      width: this.earnListContainer.width,
      height: earnTableHeight,
      scrollMode: 'y',
      background: this.scene.rexUI.add.roundRectangle({ radius: 10 }),
      panel: { child: this.earnContentContainer, mask: { padding: 1 } },
      slider: { thumb: this.earnThumb },
      mouseWheelScroller: { focus: true, speed: 0.3 },
      space: { left: 20, right: 20, top: 20, bottom: 20, panel: 20, header: 10, footer: 10 },
    }).layout();
    if (formattedWarResults.length <= 3 || !this.visible) {
      this.earnTable.setMouseWheelScrollerEnable(false);
    } else {
      this.earnTable.setMouseWheelScrollerEnable(true);
    }
    this.add(this.earnTable);

    this.earnTable.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.earnThumb.visible) return;
      this.earnThumb.setVisible(true);
    });
  }

  onOpen() {
    if (this.resultTable) {
      this.resultTable.setMouseWheelScrollerEnable(true);
    }
    if (this.earnTable) {
      this.earnTable.setMouseWheelScrollerEnable(true);
    }
  }

  cleanup() {
    if (this.resultTable) {
      this.resultTable.setMouseWheelScrollerEnable(false);
      this.resultThumb?.setVisible(false);
    }
    if (this.earnTable) {
      this.earnTable.setMouseWheelScrollerEnable(false);
      this.earnThumb?.setVisible(false);
    }
  }
}

export default PopupWarAttackDetail;
