import moment from 'moment';

import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { SimpleModeSwitch, getHourlyDisplayedLabels, getPriceChartConfig } from './PopupGoonPrice';
import { calculateNextBuildingBuyPriceBatch } from '../../../../utils/formulas';
import { formatter } from '../../../../utils/numbers';

const { width, height } = configs;
const MILLIS_PER_HOUR = 60 * 60 * 1000;
class PopupSafehousePrice extends Popup {
  timeMode = '1d';
  priceData = [];
  chartY = height / 2;
  chartContainerWidth = 0;
  chartContainerHeight = 0;
  chartWidth = 0;
  ticks = [];

  constructor(scene) {
    super(scene, 'popup-medium', { title: 'Safehouse Price', titleIcon: 'icon-ribbon-chart' });
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
    this.xAxis = scene.add.container().setSize(this.chartWidth, 0);
    this.add(this.xAxis);
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
    this.safehouse = scene.add.image(
      leftMargin + this.popup.displayWidth * 0.175,
      titleY + this.popup.displayHeight * 0.06,
      'icon-safehouse-upgrade-fail'
    );
    this.add(this.titleContainer);
    this.add(this.current);
    this.add(this.currentPrice);
    this.add(this.coin);
    this.add(this.safehouse);
    this.drawXAxis();

    this.modeSwitch = new SimpleModeSwitch(scene, width / 2, modeSwitchY, {
      modeOne: {
        title: '1 day',
        onClick: () => {
          this.timeMode = '1d';
          this.drawXAxis();
          this.remove(this.chart);
          this.chart.destroy();
          scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
        },
      },
      modeTwo: {
        title: '5 days',
        onClick: () => {
          this.timeMode = '5d';
          this.drawXAxis();
          this.remove(this.chart);
          this.chart.destroy();
          scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
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
        scene.popupSafeHouseUpgrade?.open();
      },
      'Back',
      { fontSize: '82px', sound: 'close' }
    );
    this.add(this.backBtn);

    scene.game.events.on('update-buildings', ({ basePrice, targetDailyPurchase, targetPrice, salesLastPeriod }) => {
      const estimatedPrice = calculateNextBuildingBuyPriceBatch(
        salesLastPeriod,
        targetDailyPurchase,
        targetPrice,
        basePrice,
        1
      ).total;

      this.currentPrice.text = formatter.format(estimatedPrice);
      this.coin.x = this.currentPrice.x + this.currentPrice.width + 20;
    });

    scene.game.events.on('update-house-price', (data) => {
      console.log('updatelist safehouse', Date.now(), data);
      this.priceData = data;
      this.updateChart();
    });
  }

  onOpen() {
    this.drawXAxis();
    // this.scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
    this.scene.game.events.emit('request-buildings');
  }

  updateChart() {
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
    console.log('this.chart.chart.scales.y', this.chart.chart);
    const chartPaddingHorizontal = this.chart.chart.scales.y.width;
    this.chartWidth = this.chartContainerWidth - chartPaddingHorizontal + 2;
    this.listContainer.x = width / 2 - chartPaddingHorizontal / 2;
    this.listContainer.setDisplaySize(this.chartWidth, this.chartHeight);
  }

  drawXAxis() {
    this.ticks.map((item) => {
      this.xAxis.remove(item);
      item.destroy();
    });

    this.ticks = [];
    const labels =
      this.timeMode === '1d'
        ? ['00:00', '06:00', '12:00', '18:00']
        : [...Array(5).keys()].map((i) =>
            moment()
              .subtract(4 - i, 'days')
              .set('hour', 0)
              .set('minute', 0)
              .format('D/M')
          );

    const now = moment(); // 16h45?
    const sectionDuration = this.timeMode === '1d' ? 6 : 24;
    const startTime = now.subtract(this.timeMode === '1d' ? 1 : 4, 'day');
    const sectionLength = this.chartWidth / labels.length;
    const displayedLabels = this.timeMode === '1d' ? getHourlyDisplayedLabels({ now, labels }) : labels;

    const chartLeftMargin = width / 2 - this.chartWidth / 2;
    const y = this.chartY + this.chartHeight / 2;

    const firstTickMoment =
      this.timeMode === '1d'
        ? startTime
            .set('hour', Number(displayedLabels[0].split(':')[0]))
            .set('minute', Number(displayedLabels[0].split(':')[1]))
        : startTime.set('hour', 0).set('minute', 0);
    const timeDiffRatio =
      (startTime.get('millisecond') - firstTickMoment.get('millisecond')) / (MILLIS_PER_HOUR * sectionDuration);
    for (let [index, label] of displayedLabels.entries()) {
      const x = sectionLength * index + timeDiffRatio * sectionLength;
      const text = this.scene.add
        .text(chartLeftMargin + x, y, label, {
          fontSize: 40,
          fontFamily: 'WixMadeforDisplayBold',
          color: colors.brown,
        })
        .setOrigin(0.5, 0);
      this.xAxis.add(text);
      this.ticks.push(text);
    }
  }
}

export default PopupSafehousePrice;
