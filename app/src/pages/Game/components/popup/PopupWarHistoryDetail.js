import Phaser from 'phaser';
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
const sectionTitleStyle = { fontSize: '50px', color: colors.brown, fontFamily: fontFamilies.bold };
const itemTitleStyle = { fontSize: '50px', color: colors.black, fontFamily: fontFamilies.bold };
const itemContentStyle = { fontSize: '50px', color: colors.black, fontFamily: fontFamilies.extraBold };

class PopupWarHistoryDetail extends Popup {
  data = null;
  warSnapshotId = null;
  warResultId = null;
  items = [];
  avatars = {};

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
      .text(width / 2, height / 2 - this.popup.height / 2 + 170, 'Raid/Defend Result:', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
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
    const iconX = this.popup.width * 0.13;
    const titleX = iconX + 60;
    const contentX = this.listContainer.width * 0.83;
    const centerX = this.listContainer.width / 2;
    const earnTitle = this.scene.add.text(centerX, y, 'Earn Details:', sectionTitleStyle).setOrigin(0.5, 0.5);
    y += 150;

    const earnItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const earnItemIcon = this.scene.add.image(iconX, y, 'icon-coin-small').setOrigin(0.5, 0.5);
    const earnItemText = this.scene.add.text(titleX, y, `GANG Earned:`, itemTitleStyle).setOrigin(0, 0.5);
    const earnItemContent = this.scene.add
      .text(contentX, y, customFormat(tokenEarnFromEarning || 0, 1), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const reputationGainedItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const reputationGainedItemIcon = this.scene.add.image(iconX, y, 'icon-star-medium').setOrigin(0.5, 0.5);
    const reputationGainedItemText = this.scene.add
      .text(titleX, y, `Reputation Earned:`, itemTitleStyle)
      .setOrigin(0, 0.5);
    const reputationGainedItemContent = this.scene.add
      .text(contentX, y, formatter.format(gainedReputation || 0), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 200;

    const defendTitle = this.scene.add.text(centerX, y, 'Defend Details:', sectionTitleStyle).setOrigin(0.5, 0.5);
    y += 150;

    const defendUnitsItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const defendUnitsItemIcon = this.scene.add.image(iconX, y, 'guard').setOrigin(0.5, 0.5);
    const defendUnitsItemText = this.scene.add.text(titleX, y, `Your Defense:`, itemTitleStyle).setOrigin(0, 0.5);
    const defendUnitsItemContent = this.scene.add
      .text(contentX, y, (defendUnits || 0).toLocaleString(), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const totalAttackUnits = (defendResults || []).reduce((total, item) => total + item.attackUnits, 0);
    const totalAttackItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const totalAttackItemIcon = this.scene.add.image(iconX, y, 'gun').setOrigin(0.5, 0.5);
    const totalAttackItemText = this.scene.add.text(titleX, y, `Total Attack:`, itemTitleStyle).setOrigin(0, 0.5);
    const totalAttackItemContent = this.scene.add
      .text(contentX, y, totalAttackUnits.toLocaleString(), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const tokenStolenItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const tokenStolenItemIcon = this.scene.add.image(iconX, y, 'icon-coin-small').setOrigin(0.5, 0.5);
    const tokenStolenItemText = this.scene.add.text(titleX, y, `GANG Lost:`, itemTitleStyle).setOrigin(0, 0.5);
    const tokenStolenItemContent = this.scene.add
      .text(contentX, y, customFormat(tokenStolen || 0, 1), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const topAttackerItemContainerTop = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border-top')
      .setOrigin(0.5, 0.5);
    const topAttackerItemIcon = this.scene.add.image(iconX, y, 'man').setOrigin(0.5, 0.5);
    const topAttackerItemText = this.scene.add.text(titleX, y, `Top Raiders:`, itemTitleStyle).setOrigin(0, 0.5);

    const attackers = (defendResults || [])
      .sort((user1, user2) => user2.attackUnits - user1.attackUnits)
      .slice(0, NUMBER_OF_TOP_ATTACKERS)
      .map((user) => ({ username: user.userUsername, attackUnits: user.attackUnits, avatar: user.avatar }));
    y += 120;

    const attackerTexts = [];
    this.avatars = {};
    const attackersLeftMargin = this.listContainer.width * 0.22;
    const attackersRightMargin = this.listContainer.width * 0.78;
    const avatarSize = 72;
    let attackerX = attackersLeftMargin;
    attackers.forEach((attacker, index) => {
      const topAttackerItemContainerItem = this.scene.add
        .image(
          this.popup.width / 2 - 90,
          y,
          index === attackers.length - 1 ? 'container-border-bottom' : 'container-border-middle'
        )
        .setOrigin(0.5, 0.5);

      const avatar = this.scene.add.rexCircleMaskImage(attackerX, y, 'avatar').setOrigin(0.5, 0.5);

      const attackerUsernameText = this.scene.add
        .text(
          attackerX + avatarSize / 2 + 20,
          y,
          `${formatUsername({ username: attacker.username, MAX_USERNAME_LENGTH: 20 })}`,
          {
            ...itemTitleStyle,
            fontSize: fontSizes.small,
          }
        )
        .setOrigin(0, 0.5);
      this.avatars[attacker.username] = avatar;

      const attackerEndX = attackerUsernameText.x + attackerUsernameText.width;
      const hasOverflowed = attackerEndX > attackersRightMargin;
      const stillHasMoreAttackers = index < attackers.length - 1;
      if (hasOverflowed) {
        // move to next row & reset x
        attackerX = attackersLeftMargin;
        y += 120;
        // update latest item's position
        avatar.x = attackerX;
        attackerUsernameText.x = attackerX + avatarSize / 2 + 20;
        avatar.y = y;
        attackerUsernameText.y = y;
        topAttackerItemContainerItem.y = y;
        attackerTexts.push(topAttackerItemContainerItem, avatar, attackerUsernameText);
      } else if (index > 0) {
        topAttackerItemContainerItem.destroy();
        attackerTexts.push(avatar, attackerUsernameText);
      } else {
        attackerTexts.push(topAttackerItemContainerItem, avatar, attackerUsernameText);
      }

      if (stillHasMoreAttackers) {
        // update x for next item
        attackerX = attackerUsernameText.x + attackerUsernameText.width + 70;
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
    const gangsterKilledItemIcon = this.scene.add.image(iconX, y, 'mini-gangster-2').setOrigin(0.5, 0.5);
    const gangsterKilledItemText = this.scene.add
      .text(titleX, y, `Gangsters Killed:`, itemTitleStyle)
      .setOrigin(0, 0.5);
    const gangsterKilledItemContent = this.scene.add
      .text(
        contentX,
        y,
        `${defendResults.reduce((result, item) => result + item.machinesLost || 0, 0)}`,
        itemContentStyle
      )
      .setOrigin(1, 0.5);

    y += 200;

    const attackTitle = this.scene.add.text(centerX, y, 'Raid Details:', sectionTitleStyle).setOrigin(0.5, 0.5);
    y += 150;

    const attackTargetItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const attackTargetItemIcon = this.scene.add.image(iconX, y, 'man').setOrigin(0.5, 0.5);
    const attackTargetItemText = this.scene.add
      .text(
        titleX,
        y,
        `${formatUsername({ username: attackResults?.[0]?.userUsername || '', MAX_USERNAME_LENGTH })}`,
        itemTitleStyle
      )
      .setOrigin(0, 0.5);
    y += 165;

    const targetDefenseItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const targetDefenseItemIcon = this.scene.add.image(iconX, y, 'guard').setOrigin(0.5, 0.5);
    const targetDefenseItemText = this.scene.add.text(titleX, y, `Target Defense:`, itemTitleStyle).setOrigin(0, 0.5);
    const targetDefenseItemContent = this.scene.add
      .text(contentX, y, formatter.format(attackResults?.[0]?.defendUnits || 0), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const totalAttackContributionUnits = attackResults[0]
      ? Math.round((attackResults[0]?.attackUnits || 0) / (attackResults[0]?.attackContribution || 1))
      : 0;

    const attackUnitsItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const attackUnitsItemIcon = this.scene.add.image(iconX, y, 'gun').setOrigin(0.5, 0.5);
    const attackUnitsItemText = this.scene.add.text(titleX, y, `Total Attack:`, itemTitleStyle).setOrigin(0, 0.5);
    const attackUnitsItemContent = this.scene.add
      .text(contentX, y, totalAttackContributionUnits.toLocaleString(), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const attackContributionItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const attackContributionItemIcon = this.scene.add.image(iconX, y, 'percent').setOrigin(0.5, 0.5);
    const attackContributionItemText = this.scene.add
      .text(titleX, y, `Atk Contribution:`, itemTitleStyle)
      .setOrigin(0, 0.5);
    const attackContributionItemContent = this.scene.add
      .text(contentX, y, `${Math.round((attackResults?.[0]?.attackContribution || 0) * 100)}%`, itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const tokenEarnedFromAttackingItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const tokenEarnedFromAttackingItemIcon = this.scene.add.image(iconX, y, 'icon-coin-small').setOrigin(0.5, 0.5);
    const tokenEarnedFromAttackingItemText = this.scene.add
      .text(titleX, y, `GANG Stolen:`, itemTitleStyle)
      .setOrigin(0, 0.5);
    const tokenEarnedFromAttackingItemContent = this.scene.add
      .text(contentX, y, customFormat(tokenEarnFromAttacking || 0, 1), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 165;

    const machinesLostItemContainer = this.scene.add
      .image(this.popup.width / 2 - 90, y, 'container-border')
      .setOrigin(0.5, 0.5);
    const machinesLostItemIcon = this.scene.add.image(iconX, y, 'mini-gangster-2').setOrigin(0.5, 0.5);
    const machinesLostItemText = this.scene.add.text(titleX, y, `Gangsters Lost:`, itemTitleStyle).setOrigin(0, 0.5);
    const machinesLostItemContent = this.scene.add
      .text(contentX, y, (machinesLost || 0).toLocaleString(), itemContentStyle)
      .setOrigin(1, 0.5);
    y += 200;

    this.items.push(
      earnTitle,
      earnItemContainer,
      earnItemIcon,
      earnItemText,
      earnItemContent,
      defendTitle,
      defendUnitsItemContainer,
      defendUnitsItemIcon,
      defendUnitsItemText,
      defendUnitsItemContent,
      totalAttackItemContainer,
      totalAttackItemIcon,
      totalAttackItemText,
      totalAttackItemContent,
      tokenStolenItemContainer,
      tokenStolenItemIcon,
      tokenStolenItemText,
      tokenStolenItemContent,
      topAttackerItemContainerTop,
      topAttackerItemIcon,
      topAttackerItemText,
      ...attackerTexts,
      gangsterKilledItemContainer,
      gangsterKilledItemIcon,
      gangsterKilledItemText,
      gangsterKilledItemContent,
      attackTitle,
      attackTargetItemContainer,
      attackTargetItemIcon,
      attackTargetItemText,
      targetDefenseItemContainer,
      targetDefenseItemIcon,
      targetDefenseItemText,
      targetDefenseItemContent,
      attackUnitsItemContainer,
      attackUnitsItemIcon,
      attackUnitsItemText,
      attackUnitsItemContent,
      attackContributionItemContainer,
      attackContributionItemIcon,
      attackContributionItemText,
      attackContributionItemContent,
      tokenEarnedFromAttackingItemContainer,
      tokenEarnedFromAttackingItemIcon,
      tokenEarnedFromAttackingItemText,
      tokenEarnedFromAttackingItemContent,
      reputationGainedItemContainer,
      reputationGainedItemIcon,
      reputationGainedItemText,
      reputationGainedItemContent,
      machinesLostItemContainer,
      machinesLostItemIcon,
      machinesLostItemText,
      machinesLostItemContent
    );
    this.contentContainer.add(this.items);
    // load avatars
    let loader = new Phaser.Loader.LoaderPlugin(this.scene);
    let textureManager = new Phaser.Textures.TextureManager(this.scene.game);
    attackers.forEach(({ username, avatar }) => {
      // ask the LoaderPlugin to load the texture
      if (!textureManager.exists(`${username}-avatar`)) loader.image(`${username}-avatar`, avatar);
    });

    loader.once(Phaser.Loader.Events.COMPLETE, () =>
      Object.keys(this.avatars).forEach((username) => {
        const avatar = this.avatars[username];
        avatar.setTexture(`${username}-avatar`);
        avatar.setDisplaySize(avatarSize, avatarSize);
      })
    );
    loader.start();

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
