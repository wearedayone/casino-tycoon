import Phaser from 'phaser';
import moment from 'moment';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { customFormat } from '../../../../utils/numbers';
import { calculateNextWorkerBuyPriceBatch } from '../../../../utils/formulas';

const { width, height } = configs;
const MILLIS_PER_HOUR = 60 * 60 * 1000;
class PopupGoonPrice extends Popup {
  timeMode = '1d';
  priceData = [];
  chartY = height / 2;
  chartContainerWidth = 0;
  chartContainerHeight = 0;
  chartWidth = 0;

  constructor(scene) {
    super(scene, 'popup-medium', { title: 'Goon Price', titleIcon: 'icon-ribbon-chart' });
    this.scene = scene;
    const leftMargin = width / 2 - this.popup.displayWidth / 2;
    const topMargin = height / 2 - this.popup.displayHeight / 2;
    const titleY = topMargin + this.popup.displayHeight * 0.12;
    this.chartContainerWidth = this.popup.displayWidth * 0.9;
    this.chartWidth = this.chartContainerWidth - 140;
    this.chartContainerHeight = this.popup.displayHeight * 0.5;
    const chartVerticalPadding = 60;
    this.chartHeight = this.chartContainerHeight - chartVerticalPadding;
    const modeSwitchY = this.chartY + this.chartContainerHeight / 2 + this.popup.displayHeight * 0.1;

    this.listContainer = scene.add
      .image(width / 2 - this.chartWidth * 0.02, this.chartY - chartVerticalPadding / 2, 'price-chart-frame')
      .setDisplaySize(this.chartWidth, this.chartHeight);
    this.add(this.listContainer);
    this.contentContainer = scene.add.container().setSize(this.popup.displayWidth * 0.8, 0);
    const config = getPriceChartConfig({
      data: this.priceData.map(({ value, createdAt }) => ({ x: createdAt, y: value })),
      timeMode: this.timeMode,
      chartHeight: this.chartHeight,
    });

    this.chart = scene.rexUI.add.chart(
      width / 2,
      this.chartY,
      this.chartContainerWidth,
      this.chartContainerHeight,
      config
    );
    this.add(this.chart);

    this.titleContainer = scene.add.image(
      width / 2,
      titleY + this.popup.displayHeight * 0.06,
      'price-chart-title-container'
    );
    this.current = scene.add
      .text(leftMargin + this.popup.displayWidth * 0.27, titleY, 'Current price:', {
        fontSize: fontSizes.large,
        color: colors.black,
        fontFamily: fontFamilies.bold,
      })
      .setOrigin(0, 0.5);
    this.currentPrice = scene.add
      .text(this.current.x + this.current.width + 20, titleY, '2,341', {
        fontSize: fontSizes.extraLarge,
        color: colors.black,
        fontFamily: fontFamilies.extraBold,
      })
      .setOrigin(0, 0.5);
    this.coin = scene.add.image(this.currentPrice.x + this.currentPrice.width + 20, titleY, 'coin2').setOrigin(0, 0.5);
    this.goon = scene.add.image(
      leftMargin + this.popup.displayWidth * 0.175,
      titleY + this.popup.displayHeight * 0.07,
      'icon-goon-buy-fail'
    );
    this.add(this.titleContainer);
    this.add(this.current);
    this.add(this.currentPrice);
    this.add(this.coin);
    this.add(this.goon);

    this.modeSwitch = new SimpleModeSwitch(scene, width / 2, modeSwitchY, {
      modeOne: {
        title: '1 day',
        onClick: () => {
          this.timeMode = '1d';
          scene.game.events.emit('request-goon-price', { timeMode: this.timeMode });
        },
      },
      modeTwo: {
        title: '5 days',
        onClick: () => {
          // this.timeMode = '5d';
          // scene.game.events.emit('request-goon-price', { timeMode: this.timeMode });
        },
      },
    });
    this.add(this.modeSwitch);

    this.backBtn = new TextButton(
      scene,
      width / 2,
      height / 2 + this.popup.displayHeight / 2 - 20,
      'button-blue',
      'button-blue-pressed',
      () => {
        this.close();
        scene.popupBuyGoon?.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.backBtn);

    scene.game.events.on('update-workers', ({ basePrice, targetDailyPurchase, targetPrice, salesLastPeriod }) => {
      const estimatedPrice = calculateNextWorkerBuyPriceBatch(
        salesLastPeriod,
        targetDailyPurchase,
        targetPrice,
        basePrice,
        1
      ).total;

      this.currentPrice.text = estimatedPrice.toLocaleString();
      this.coin.x = this.currentPrice.x + this.currentPrice.width + 20;
    });

    scene.game.events.on('update-goon-price', (data) => {
      console.log('updatelist goon', Date.now(), data);
      this.priceData = data;
      if (this.visible) {
        this.updateList();
      }
    });

    scene.game.events.emit('request-goon-price', { timeMode: this.timeMode });
  }

  onOpen() {
    this.scene.game.events.emit('request-goon-price', { timeMode: this.timeMode });
    this.scene.game.events.emit('request-workers');
  }

  updateList() {
    this.remove(this.chart);
    this.chart.destroy();

    const config = getPriceChartConfig({
      data: this.priceData.map(({ value, createdAt }) => ({ x: createdAt, y: value })),
      timeMode: this.timeMode,
      chartHeight: this.chartHeight,
    });
    this.chart = this.scene.rexUI.add.chart(
      width / 2,
      this.chartY,
      this.chartContainerWidth,
      this.chartContainerHeight,
      config
    );
    this.add(this.chart);
    console.log('this.chart.chart.scales.y', this.chart.chart.scales.y);
    const chartPaddingHorizontal = this.chart.chart.scales.y.width;
    this.chartWidth = this.chartContainerWidth - chartPaddingHorizontal;
    this.listContainer.x = width / 2 - chartPaddingHorizontal / 2;
    this.listContainer.setDisplaySize(this.chartWidth, this.chartHeight);
  }
}

export class SimpleModeSwitch extends Phaser.GameObjects.Container {
  mode = '';

  constructor(scene, x, y, { containerImg = 'tabs-container-simple', modeOne, modeTwo } = {}) {
    super(scene, 0, 0);
    this.mode = modeOne.title;
    const textStyle = {
      fontSize: fontSizes.extraLarge,
      color: '#ffffff',
      fontFamily: fontFamilies.extraBold,
      align: 'center',
    };
    const textStyleInactive = {
      fontSize: fontSizes.extraLarge,
      color: colors.brown,
      fontFamily: fontFamilies.extraBold,
      align: 'center',
    };

    this.container = scene.add.image(x, y, containerImg).setOrigin(0.5, 0.5);
    this.add(this.container);

    const buttonOffset = this.container.width / 4;
    this.btnOne = scene.add.image(x - buttonOffset, y, 'button-blue-med').setOrigin(0.5, 0.5);
    this.btnTwo = scene.add
      .image(x + buttonOffset, y, 'button-blue-med')
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.add(this.btnOne);
    this.add(this.btnTwo);

    this.textOne = scene.add
      .text(x - buttonOffset, y, modeOne.title, textStyle)
      .setStroke('#0004a0', 10)
      .setOrigin(0.5, 0.5);
    this.textOneInactive = scene.add
      .text(x - buttonOffset, y, modeOne.title, textStyleInactive)
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.textTwo = scene.add
      .text(x + buttonOffset, y, modeTwo.title, textStyle)
      .setStroke('#0004a0', 10)
      .setOrigin(0.5, 0.5)
      .setAlpha(0);
    this.textTwoInactive = scene.add.text(x + buttonOffset, y, modeTwo.title, textStyleInactive).setOrigin(0.5, 0.5);
    this.add(this.textOne);
    this.add(this.textOneInactive);
    this.add(this.textTwo);
    this.add(this.textTwoInactive);

    this.container
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer, localX, localY, event) => {
        const isModeOneClicked = localX <= this.container.width / 2;
        this.btnOne.setAlpha(Number(isModeOneClicked));
        this.textOne.setAlpha(Number(isModeOneClicked));
        this.textOneInactive.setAlpha(Number(!isModeOneClicked));
        this.btnTwo.setAlpha(Number(!isModeOneClicked));
        this.textTwo.setAlpha(Number(!isModeOneClicked));
        this.textTwoInactive.setAlpha(Number(isModeOneClicked));

        const newMode = isModeOneClicked ? modeOne : modeTwo;
        this.mode = newMode.title;
        newMode.onClick();
      });
  }
}

export default PopupGoonPrice;

export const getPriceChartConfig = ({ data, timeMode, chartHeight }) => {
  var canvas = document.getElementsByTagName('canvas').item(0);
  var ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
  gradient.addColorStop(0, 'rgba(255, 205, 156, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 205, 156, 1)');
  gradient.addColorStop(1, 'rgba(255, 227, 156, 0.1)');

  const ticksCount = timeMode === '1d' ? 4 : 5;

  return {
    type: 'line',
    data: {
      datasets: [
        {
          data,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#7D2E00',
          borderWidth: 4,
          cubicInterpolationMode: 'monotone', // smooth lines instead of zig-zags
          tension: 0.4, // smooth lines instead of zig-zags
        },
      ],
    },
    options: {
      elements: { point: { radius: 0 } }, // no visible points
      scales: {
        x: {
          type: 'linear',
          grace: 0,
          bounds: 'data',
          border: { display: false },
          ticks: {
            maxRotation: 0, // no rotating labels - only horizontal
            font: { size: 40, family: 'WixMadeforDisplayBold' },
            color: '#7D2E00',
            stepSize: timeMode === '1d' ? MILLIS_PER_HOUR * 6 : MILLIS_PER_HOUR * 24,
            count: ticksCount,
            autoSkip: true,
            maxTicksLimit: ticksCount,
            callback: (value) => {
              return moment(value).format(timeMode === '1d' ? 'HH:mm' : 'D/M');
            },
          },
          grid: { display: false }, // no vertial lines inside chart
        },
        y: {
          border: { display: false },
          ticks: {
            font: { size: 40, family: 'WixMadeforDisplayBold' },
            color: '#7D2E00',
            callback: (value) => customFormat(value, 1), // 5k, 10k, 15k instead of 5,000 10,000 15,000
          },
          position: 'right',
          beginAtZero: true,
          grid: { display: true },
        },
      },
      plugins: { legend: { display: false } },
    },
  };
};
