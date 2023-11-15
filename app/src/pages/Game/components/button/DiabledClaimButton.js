import Button from './Button';

const formatTimeDigit = (digit) => (digit < 10 ? `0${digit}` : `${digit}`);

class DisabledClaimButton extends Button {
  interval;

  constructor(scene, x, y) {
    super(scene, x, y, 'button-blue', 'button-blue', () => {});

    this.text = scene.add
      .text(0, -40, 'Claimed', {
        fontSize: '82px',
        color: '#5895fd',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);

    this.countdownText = scene.add
      .text(0, 35, '', {
        fontSize: '60px',
        color: '#fff',
        fontFamily: 'WixMadeforDisplayExtraBold',
      })
      .setOrigin(0.5, 0.5);
    this.countdownText.setStroke('#0004A0', 3);

    this.add(this.text);
    this.add(this.countdownText);

    scene.game.events.on('update-claim-time', ({ claimGapInSeconds, lastClaimTime }) => {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      if (!claimGapInSeconds || !lastClaimTime) return;
      this.interval = setInterval(() => {
        const nextClaimTime = lastClaimTime + claimGapInSeconds * 1000;
        const now = Date.now();

        if (now >= nextClaimTime) {
          clearInterval(this.interval);
          this.countdownText.text = `00:00:00`;
          scene.game.events.emit('update-claimable-status', { claimable: true });
        } else {
          const diffInSeconds = (nextClaimTime - now) / 1000;
          const hours = Math.floor(diffInSeconds / 3600);
          const mins = Math.floor((diffInSeconds % 3600) / 60);
          const seconds = Math.round(diffInSeconds % 60);
          const time = `${formatTimeDigit(hours)}:${formatTimeDigit(mins)}:${formatTimeDigit(seconds)}`;
          this.countdownText.text = time;
        }
      }, 1000);
    });
    scene.game.events.emit('request-claim-time');
  }
}

export default DisabledClaimButton;
