import Phaser from 'phaser';

import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import Step8 from './Step8';
import Step9 from './Step9';
import Step10 from './Step10';
import Step11 from './Step11';
import Step12 from './Step12';
import Step13 from './Step13';
import Step14 from './Step14';
import Step15 from './Step15';
import Step16 from './Step16';
import configs from '../../configs/configs';

const { width, height } = configs;

class Tutorial extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);

    this.background = scene.add.rectangle(0, 0, width, height, 0x260343, 0.8).setOrigin(0, 0).setDepth(5);
    this.add(this.background);

    this.step1 = new Step1(scene, () => {
      this.step1.setVisible(false);
      this.step2.start();
    });
    this.add(this.step1);

    this.step2 = new Step2(scene, () => {
      this.step2.setVisible(false);
      this.step3.setVisible(true);
    });
    this.add(this.step2);

    this.step3 = new Step3(scene, () => {
      this.step3.setVisible(false);
      this.step4.setVisible(true);
    });
    this.add(this.step3);

    this.step4 = new Step4(scene, () => {
      this.step4.setVisible(false);
      this.step5.setVisible(true);
    });
    this.add(this.step4);

    this.step5 = new Step5(scene, () => {
      this.step5.setVisible(false);
      this.step6.setVisible(true);
    });
    this.add(this.step5);

    this.step6 = new Step6(scene, () => {
      this.step6.setVisible(false);
      this.step7.setVisible(true);
    });
    this.add(this.step6);

    this.step7 = new Step7(scene, () => {
      this.step7.setVisible(false);
      this.step8.setVisible(true);
    });
    this.add(this.step7);

    this.step8 = new Step8(scene, () => {
      this.step8.setVisible(false);
      this.step9.setVisible(true);
    });
    this.add(this.step8);

    this.step9 = new Step9(scene, () => {
      this.step9.setVisible(false);
      this.step10.setVisible(true);
    });
    this.add(this.step9);

    this.step10 = new Step10(scene, () => {
      this.step10.setVisible(false);
      this.step11.setVisible(true);
    });
    this.add(this.step10);

    this.step11 = new Step11(scene, () => {
      this.step11.setVisible(false);
      this.step12.setVisible(true);
    });
    this.add(this.step11);

    this.step12 = new Step12(scene, () => {
      this.step12.setVisible(false);
      this.step13.setVisible(true);
    });
    this.add(this.step12);

    this.step13 = new Step13(scene);
    this.add(this.step13);

    this.step14 = new Step14(scene);
    this.add(this.step14);

    this.step15 = new Step15(scene, () => {
      this.step15.setVisible(false);
      this.step16.setVisible(true);
      scene.game.events.emit('simulator-buy-goon', { quantity: 1, delayDuration: 0, hideSuccessPopup: true });
    });
    this.add(this.step15);

    this.step16 = new Step16(scene, () => {
      this.step16.setVisible(false);
      scene.game.events.emit('simulator-end');
      scene.scene.stop();
      scene.scene.start('MainScene', { isFromTutorial: true });
    });
    this.add(this.step16);

    this.step1.setVisible(true);
  }
}

export default Tutorial;
