import { ScrollablePanel } from 'phaser3-rex-plugins/templates/ui/ui-components.js';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontSizes, fontFamilies } from '../../../../utils/styles';
import { formatter, customFormat } from '../../../../utils/numbers';
import { formatUsername } from '../../../../utils/strings';

const { width, height } = configs;

const NUMBER_OF_TOP_ATTACKERS = 5;

const MAX_USERNAME_LENGTH = 12;

class PopupWarHistoryDetail extends Popup {
  data = null;
  warSnapshotId = null;
  warResultId = null;
  items = [];

  constructor(scene) {
    super(scene, 'popup-large', { title: 'Overview' });
    this.scene = scene;
    this.listY = height / 2 - this.popup.height / 2 + 270;

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        scene.popupWarHistory?.open();
      },
      'Back',
      { sound: 'close', fontSize: '82px' }
    );
    this.add(this.backBtn);

    this.titleText = scene.add
      .text(width / 2, height / 2 - this.popup.height / 2 + 170, 'Raid/Defend Result', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0.5, 0.5);
    this.add(this.titleText);

    this.listContainer = scene.add.image(width / 2, this.listY, 'container-super-large').setOrigin(0.5, 0);
    this.add(this.listContainer);
    this.contentContainer = scene.add.container().setSize(this.popup.width * 0.8, 0);

    scene.game.events.on('update-war-history-detail', (data) => {
      this.data = data;
      this.updateContent();
    });
  }

  updateWarIds({ warSnapshotId, warResultId }) {
    this.warSnapshotId = warSnapshotId;
    this.warResultId = warResultId;
    this.scene.game.events.emit('request-war-history-detail', { warSnapshotId, warResultId });
  }

  updateContent() {
    if (!this.data) return;

    this.items.map((item) => {
      this.contentContainer.remove(item);
      item.destroy();
    });

    this.items = [];

    const {
      defendUnits,
      defendResults,
      tokenStolen,
      attackResults,
      attackUnits,
      tokenEarnFromAttacking,
      gainedReputation,
      tokenEarnFromEarning,
      machinesLost,
    } = this.data;

    let y = 80;
    const earnIcon = this.scene.add.image(this.popup.width * 0.2, y, 'icon-coin-small').setOrigin(0, 0.5);
    const earnTitle = this.scene.add
      .text(this.popup.width * 0.2 + earnIcon.width / 2 + 50, y, 'Earn Details', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    y += 150;

    const earnItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const earnItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'icon-coin-small').setOrigin(0.5, 0.5);
    const earnItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + earnItemIcon.width / 2 + 30,
        y,
        `$GANG Earned: ${customFormat(tokenEarnFromEarning || 0, 1)}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 200;

    const defendIcon = this.scene.add.image(this.popup.width * 0.2, y, 'guard').setOrigin(0, 0.5);
    const defendTitle = this.scene.add
      .text(this.popup.width * 0.2 + defendIcon.width / 2 + 50, y, 'Defend Details', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    y += 150;

    const defendUnitsItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const defendUnitsItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'guard').setOrigin(0.5, 0.5);
    const defendUnitsItemText = this.scene.add
      .text(this.popup.width * 0.13 + defendUnitsItemIcon.width / 2 + 30, y, `Your Defense: ${defendUnits || 0}`, {
        fontSize: '50px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    y += 165;

    const totalAttackUnits = (defendResults || []).reduce((total, item) => total + item.attackUnits, 0);
    const totalAttackItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const totalAttackItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'gun').setOrigin(0.5, 0.5);
    const totalAttackItemText = this.scene.add
      .text(this.popup.width * 0.13 + totalAttackItemIcon.width / 2 + 30, y, `Total Attack: ${totalAttackUnits}`, {
        fontSize: '50px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    y += 165;

    const tokenStolenItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const tokenStolenItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'icon-coin-small').setOrigin(0.5, 0.5);
    const tokenStolenItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + tokenStolenItemIcon.width / 2 + 30,
        y,
        `$GANG Lost: ${customFormat(tokenStolen || 0, 1)}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const topAttackerItemContainerTop = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border-top')
      .setOrigin(0.5, 0.5);
    const topAttackerItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'man').setOrigin(0.5, 0.5);
    const topAttackerItemText = this.scene.add
      .text(this.popup.width * 0.13 + tokenStolenItemIcon.width / 2 + 30, y, `Top Raiders:`, {
        fontSize: '50px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);

    const attackers = (defendResults || [])
      .sort((user1, user2) => user2.attackUnits - user1.attackUnits)
      .slice(0, NUMBER_OF_TOP_ATTACKERS)
      .map((user) => ({ username: user.userUsername, attackUnits: user.attackUnits }));
    y += 131;

    const attackerTexts = [];
    attackers.map((attacker, index) => {
      const topAttackerItemContainerItem = this.scene.add
        .image(
          this.popup.width / 2 - 90,
          y,
          index === attackers.length - 1 ? 'container-border-bottom' : 'container-border-middle'
        )
        .setOrigin(0.5, 0.5);

      const attackerRankText = this.scene.add
        .text(this.popup.width * 0.12, y, `${index + 1}`, {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        })
        .setOrigin(0, 0.5);

      const attackerUsernameText = this.scene.add
        .text(
          this.popup.width * 0.12 + 50,
          y,
          `${formatUsername({ username: attacker.username, MAX_USERNAME_LENGTH })}`,
          {
            fontSize: '50px',
            color: colors.black,
            fontFamily: fontFamilies.bold,
          }
        )
        .setOrigin(0, 0.5);

      const attackerAttackUnitsIcon = this.scene.add
        .image(this.popup.width * 0.7, y, 'mini-gangster-2')
        .setOrigin(0.5, 0.5);

      const attackerAttackUnitsText = this.scene.add
        .text(
          this.popup.width * 0.8 - attackerAttackUnitsIcon.width / 2 - 130,
          y,
          `${formatter.format(attacker.attackUnits)}`,
          {
            fontSize: '50px',
            color: colors.black,
            fontFamily: fontFamilies.bold,
          }
        )
        .setOrigin(1, 0.5);

      attackerTexts.push(
        topAttackerItemContainerItem,
        attackerRankText,
        attackerUsernameText,
        attackerAttackUnitsIcon,
        attackerAttackUnitsText
      );

      if (index < attackers.length - 1) {
        y += 131;
      }
    });

    if (!attackers.length) {
      const bottomAttackerItemContainerItem = this.scene.add
        .image(this.popup.width / 2 - 90, y, 'container-border-bottom')
        .setOrigin(0.5, 0.5);
      attackerTexts.push(bottomAttackerItemContainerItem);
    }

    y += 165;

    const gangsterKilledItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const gangsterKilledItemIcon = this.scene.add
      .image(this.popup.width * 0.13, y, 'mini-gangster-2')
      .setOrigin(0.5, 0.5);
    const gangsterKilledItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + gangsterKilledItemIcon.width / 2 + 30,
        y,
        `Gangsters Killed: ${defendResults.reduce((result, item) => result + item.machinesLost || 0, 0)}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);

    y += 200;

    const attackIcon = this.scene.add.image(this.popup.width * 0.2, y, 'gun').setOrigin(0, 0.5);
    const attackTitle = this.scene.add
      .text(this.popup.width * 0.2 + attackIcon.width / 2 + 50, y, 'Raid Details', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    y += 150;

    const attackTargetItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const attackTargetItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'man').setOrigin(0.5, 0.5);
    const attackTargetItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + attackTargetItemIcon.width / 2 + 30,
        y,
        `${formatUsername({ username: attackResults?.[0]?.userUsername || '', MAX_USERNAME_LENGTH })}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const targetDefenseItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const targetDefenseItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'guard').setOrigin(0.5, 0.5);
    const targetDefenseItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + targetDefenseItemIcon.width / 2 + 30,
        y,
        `Target Defense: ${formatter.format(attackResults?.[0]?.defendUnits || 0)}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const totalAttackContributionUnits = attackResults[0]
      ? Math.round((attackResults[0]?.attackUnits || 0) / (attackResults[0]?.attackContribution || 1))
      : 0;

    const attackUnitsItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const attackUnitsItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'gun').setOrigin(0.5, 0.5);
    const attackUnitsItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + attackUnitsItemIcon.width / 2 + 30,
        y,
        `Total Attack: ${totalAttackContributionUnits}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const attackContributionItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const attackContributionItemIcon = this.scene.add.image(this.popup.width * 0.13, y, 'percent').setOrigin(0.5, 0.5);
    const attackContributionItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + attackContributionItemIcon.width / 2 + 30,
        y,
        `Atk Contribution: ${Math.round((attackResults?.[0]?.attackContribution || 0) * 100)}%`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const tokenEarnedFromAttackingItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const tokenEarnedFromAttackingItemIcon = this.scene.add
      .image(this.popup.width * 0.13, y, 'icon-coin-small')
      .setOrigin(0.5, 0.5);
    const tokenEarnedFromAttackingItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + tokenEarnedFromAttackingItemIcon.width / 2 + 30,
        y,
        `$GANG Stolen: ${customFormat(tokenEarnFromAttacking || 0, 1)}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const reputationGainedItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const reputationGainedItemIcon = this.scene.add
      .image(this.popup.width * 0.13, y, 'icon-star-medium')
      .setOrigin(0.5, 0.5);
    const reputationGainedItemText = this.scene.add
      .text(
        this.popup.width * 0.13 + reputationGainedItemIcon.width / 2 + 30,
        y,
        `Reputation Gained: ${formatter.format(gainedReputation || 0)}`,
        {
          fontSize: '50px',
          color: colors.black,
          fontFamily: fontFamilies.bold,
        }
      )
      .setOrigin(0, 0.5);
    y += 165;

    const machinesLostItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const machinesLostItemIcon = this.scene.add
      .image(this.popup.width * 0.13, y, 'mini-gangster-2')
      .setOrigin(0.5, 0.5);
    const machinesLostItemText = this.scene.add
      .text(this.popup.width * 0.13 + earnItemIcon.width / 2 + 30, y, `Gangsters Lost: ${machinesLost || 0}`, {
        fontSize: '50px',
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    y += 200;

    this.items.push(
      earnIcon,
      earnTitle,
      earnItemContainer,
      earnItemIcon,
      earnItemText,
      defendIcon,
      defendTitle,
      defendUnitsItemContainer,
      defendUnitsItemIcon,
      defendUnitsItemText,
      totalAttackItemContainer,
      totalAttackItemIcon,
      totalAttackItemText,
      tokenStolenItemContainer,
      tokenStolenItemIcon,
      tokenStolenItemText,
      topAttackerItemContainerTop,
      topAttackerItemIcon,
      topAttackerItemText,
      ...attackerTexts,
      gangsterKilledItemContainer,
      gangsterKilledItemIcon,
      gangsterKilledItemText,
      attackIcon,
      attackTitle,
      attackTargetItemContainer,
      attackTargetItemIcon,
      attackTargetItemText,
      targetDefenseItemContainer,
      targetDefenseItemIcon,
      targetDefenseItemText,
      attackUnitsItemContainer,
      attackUnitsItemIcon,
      attackUnitsItemText,
      attackContributionItemContainer,
      attackContributionItemIcon,
      attackContributionItemText,
      tokenEarnedFromAttackingItemContainer,
      tokenEarnedFromAttackingItemIcon,
      tokenEarnedFromAttackingItemText,
      reputationGainedItemContainer,
      reputationGainedItemIcon,
      reputationGainedItemText,
      machinesLostItemContainer,
      machinesLostItemIcon,
      machinesLostItemText
    );
    this.contentContainer.add(this.items);

    const contentContainerHeight = y;
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

    this.add(this.table);
    if (!this.visible) {
      this.table.setMouseWheelScrollerEnable(false);
      this.table.setScrollerEnable(false);
    }

    this.table.on('scroll', (e) => {
      // console.log('scroll', e.t); // e.t === scrolled percentage
      if (this.thumb.visible) return;
      this.thumb.setVisible(true);
    });
  }

  onOpen() {
    if (this.table) {
      // this.table.setMouseWheelScrollerEnable(true);
      // this.table.setScrollerEnable(true)
    }
  }

  cleanup() {
    if (this.table) {
      this.table.setMouseWheelScrollerEnable(false);
      this.table.setScrollerEnable(false);
      this.thumb?.setVisible(false);
    }
  }
}

export default PopupWarHistoryDetail;
