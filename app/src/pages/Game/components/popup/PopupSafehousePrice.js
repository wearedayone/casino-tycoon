import Popup from './Popup';
import TextButton from '../button/TextButton';
import configs from '../../configs/configs';
import { colors, fontFamilies, fontSizes } from '../../../../utils/styles';
import { SimpleModeSwitch, getPriceChartConfig } from './PopupGoonPrice';
import { calculateNextBuildingBuyPriceBatch } from '../../../../utils/formulas';

const { width, height } = configs;
class PopupSafehousePrice extends Popup {
  timeMode = '1d';
  priceData = [];
  chartY = height / 2;
  chartContainerWidth = 0;
  chartContainerHeight = 0;
  chartWidth = 0;

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

    this.modeSwitch = new SimpleModeSwitch(scene, width / 2, modeSwitchY, {
      modeOne: {
        title: '1 day',
        onClick: () => {
          this.timeMode = '1d';
          scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
        },
      },
      modeTwo: {
        title: '5 days',
        onClick: () => {
          // this.timeMode = '5d';
          // scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
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

    scene.game.events.on('update-buildings', ({ basePrice, targetDailyPurchase, targetPrice, salesLastPeriod }) => {
      const estimatedPrice = calculateNextBuildingBuyPriceBatch(
        salesLastPeriod,
        targetDailyPurchase,
        targetPrice,
        basePrice,
        1
      ).total;

      this.currentPrice.text = estimatedPrice.toLocaleString();
      this.coin.x = this.currentPrice.x + this.currentPrice.width + 20;
    });

    scene.game.events.on('update-safehouse-price', (data) => {
      console.log('updatelist safehouse', Date.now(), data);
      this.priceData = data;
      if (this.visible) {
        this.updateList();
      }
    });

    scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
  }

  onOpen() {
    this.scene.game.events.emit('request-house-price', { timeMode: this.timeMode });
    this.scene.game.events.emit('request-buildings');
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

export default PopupSafehousePrice;
