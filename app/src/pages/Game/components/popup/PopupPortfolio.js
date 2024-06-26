import Popup from './Popup';
import Button from '../button/Button';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;

const buttonWidth = 506;
const btnGap = 50;
const lineGap = 130;

class PopupPortfolio extends Popup {
  constructor(scene) {
    super(scene, 'popup-portfolio-with-reputation', { ribbon: 'ribbon-portfolio' });

    this.setVisible(false);

    this.backBtn = new TextButton(
      scene,
      width / 2 - buttonWidth / 2 - btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      this.close,
      'Back',
      { sound: 'close' }
    );
    this.add(this.backBtn);

    this.statisticBtn = new TextButton(
      scene,
      width / 2 + buttonWidth / 2 + btnGap / 2,
      height / 2 + this.popup.height / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        scene.popupStatistic.open();
      },
      'Statistic',
      { sound: 'button-1' }
    );
    this.add(this.statisticBtn);

    this.addressText = scene.add
      .text(this.popup.x - 160, this.popup.y - 590, '', {
        fontSize: '60px',
        color: '#7D2E00',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0, 0.5);
    this.add(this.addressText);

    this.copyBtn = this.buttonCopy = new Button(
      scene,
      this.addressText.x + this.addressText.width + 120,
      this.addressText.y,
      'button-copy',
      'button-copy-pressed',
      () => navigator.clipboard.writeText(this.address || ''),
      { sound: 'button-2' }
    );
    this.add(this.copyBtn);

    this.totalBalanceText = scene.add
      .text(this.popup.x + 10, this.popup.y - 320, '', {
        fontSize: '60px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.totalBalanceText);

    this.balanceText = scene.add
      .text(this.popup.x + 350, this.popup.y - 180, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.balanceText);

    this.tokenBalanceText = scene.add
      .text(this.popup.x - 330, this.balanceText.y + lineGap - 10, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(0, 0.5);
    this.add(this.tokenBalanceText);

    this.tokenValueText = scene.add
      .text(this.balanceText.x, this.tokenBalanceText.y, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.tokenValueText);

    this.numberOfMachinesText = scene.add
      .text(this.popup.x - 330, this.tokenBalanceText.y + lineGap, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(0, 0.5);
    this.add(this.numberOfMachinesText);

    this.machineValueText = scene.add
      .text(this.balanceText.x, this.numberOfMachinesText.y, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.machineValueText);

    this.rankRewardText = scene.add
      .text(this.balanceText.x, this.machineValueText.y + lineGap + 10, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.rankRewardText);
    this.reputationRewardText = scene.add
      .text(this.balanceText.x, this.machineValueText.y + lineGap * 2 + 20, '', {
        fontSize: '48px',
        color: '#30030B',
        fontFamily: 'WixMadeforDisplayBold',
      })
      .setOrigin(1, 0.5);
    this.add(this.reputationRewardText);

    scene.game.events.on(
      'update-portfolio',
      ({
        address,
        totalBalance,
        ETHBalance,
        tokenBalance,
        tokenValue,
        numberOfMachines,
        machineValue,
        rankReward,
        reputationReward,
      }) => {
        this.address = address;
        this.addressText.text = this.formatAddress(address);
        this.copyBtn.x = this.addressText.x + this.addressText.width + 120;
        this.totalBalanceText.text = formatter.format(totalBalance);
        this.balanceText.text = `~${formatter.format(ETHBalance)}`;
        this.tokenBalanceText.text = `${formatter.format(tokenBalance)}`;
        this.tokenValueText.text = `~${formatter.format(tokenValue)}`;
        this.numberOfMachinesText.text = `${numberOfMachines} Gangster NFTs`;
        this.machineValueText.text = `~${formatter.format(machineValue)}`;
        this.rankRewardText.text = `~${formatter.format(rankReward)}`;
        this.reputationRewardText.text = `~${formatter.format(reputationReward)}`;
      }
    );

    scene.game.events.emit('request-portfolio');
  }

  formatAddress(address) {
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  }
}

export default PopupPortfolio;
