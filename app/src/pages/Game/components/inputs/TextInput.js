import Phaser from 'phaser';

class TextInput extends Phaser.GameObjects.Container {
  // UI
  fontSize = '60px';
  textBeginningX = 0;
  maxDisplayedCharacters = 0;

  // state
  isFocused = false;
  value = '';

  constructor(
    scene,
    x,
    y,
    {
      color = '#29000b',
      fontSize = '60px',
      placeholder = '',
      icon,
      valueRegex = /.*/,
      characterRegex = /./,
      maxDisplayedCharacters = 0, // currently hardcoding this
    } = {}
  ) {
    super(scene, 0, 0);
    scene.input.keyboard.createCursorKeys();
    this.maxDisplayedCharacters = maxDisplayedCharacters;

    this.container = scene.add.image(x, y, 'text-input').setOrigin(0.5, 0.5);
    this.container.setInteractive();
    this.add(this.container);

    const textStyle = { fontSize, color, fontFamily: 'WixMadeforDisplayBold' };
    const inputStartX = this.container.width * 0.15;
    this.textBeginningX = inputStartX;

    // icon
    if (icon) {
      const iconXPadding = this.container.width * 0.05;
      const iconMarginRight = this.container.width * 0.1;
      this.icon = scene.add.image(inputStartX + iconXPadding, y, icon);
      this.add(this.icon);
      this.textBeginningX = inputStartX + iconXPadding + iconMarginRight;
    }

    // placeholder
    if (placeholder.length) {
      this.placeholder = scene.add
        .text(this.textBeginningX, y, placeholder, { ...textStyle, color: '#c7c7c7' })
        .setOrigin(0, 0.5);
      this.add(this.placeholder);
    }
    this.displayedString = scene.add.text(this.textBeginningX, y, '', textStyle).setOrigin(0, 0.5);
    this.add(this.displayedString);

    // blinking cursor
    this.formCursor = scene.add
      .text(this.textBeginningX + this.displayedString.width, y, '|', textStyle)
      .setOrigin(0, 0.5);
    this.formCursor.setAlpha(0);

    this.cursorTween = scene.tweens.add({
      targets: this.formCursor,
      alpha: 1,
      duration: 300,
      hold: 600,
      yoyo: true,
      repeat: -1,
      paused: true,
    });
    this.add(this.formCursor);

    // on focus
    this.container.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (!this.isFocused) {
        // isEnteringName is used to turn on and off the recording of key strokes.
        this.isFocused = true;
        this.updateDisplayedString();

        // Add blinking cursor
        this.formCursor.setAlpha(0);
        this.cursorTween.resume();

        // Activate the on-screen keyboard for mobile devices
        if (isMobileDevice()) {
          this.hiddenDomInput.focus();
        }

        // blur() must be called after a short delay to ensure that the pointerup
        // event that called this focus function doesn't inadvertently call it as well.
        this.scene.time.delayedCall(200, () => {
          this.blur();
        });
      }
    });

    if (isMobileDevice()) {
      this.hiddenDomInput = document.createElement('input');
      this.hiddenDomInput.style.position = 'absolute';
      this.hiddenDomInput.style.opacity = '0';
      this.hiddenDomInput.style.zIndex = '-1';
      document.body.appendChild(this.hiddenDomInput);

      this.hiddenDomInput.addEventListener('input', (event) => {
        console.log('event.target.value', event.target.value);
        if (event.target.value && !event.target.value.match(valueRegex)) {
          // prevents adding value
          this.hiddenDomInput.value = this.value;
          return;
        }

        this.updateValue(event.target.value, false);
      });

      // this.hiddenDomInput.addEventListener('focus', function() {
      //     this.hiddenDomInput.scrollIntoView({ behavior: 'smooth' });
      // });
    }

    scene.input.keyboard.on('keydown', (event) => {
      if (this.isFocused) {
        // Implement backspace
        if (event.keyCode === 8 && this.value.length > 0) {
          this.updateValue(this.value.slice(0, -1), false);
        } else if (
          event.key.length === 1 &&
          event.key.match(characterRegex) &&
          (this.value + event.key).match(valueRegex)
        ) {
          this.updateValue(this.value + event.key, false);
        }
        // Gently informs the player that its time to stop typing
        // else if (this.value.length === maxNameLength) {
        //   scene.cameras.main.shake(30, 0.001, false);
        // }
      }
    });
  }

  blur() {
    this.scene.input.off('pointerup');
    this.scene.input.once('pointerup', () => {
      if (this.isFocused) {
        let delayTime = 0;

        // Reset form if it's empty
        if (!this.value) {
          this.value = '';
          delayTime = 100; // Gives Update() time to update the name field before !this.isFocused.
        }

        // Deactivates typing
        this.scene.time.delayedCall(delayTime, () => {
          this.isFocused = false;
          this.updateDisplayedString();
        });

        // Remove cursor
        this.formCursor.setAlpha(0);
        this.cursorTween.pause();

        // Deactivate the on-screen keyboard for mobile devices
        if (isMobileDevice()) {
          this.hiddenDomInput.blur();
        }
      }
    });
  }

  updateDisplayedString() {
    if (this.maxDisplayedCharacters && this.value.length > this.maxDisplayedCharacters) {
      const displayedString = this.isFocused
        ? this.value.slice(-this.maxDisplayedCharacters)
        : `${this.value.slice(0, this.maxDisplayedCharacters - 2)}...`;

      this.displayedString.text = displayedString;
    } else this.displayedString.text = this.value;

    // updates cursor position
    if (this.isFocused) this.formCursor.x = this.textBeginningX + this.displayedString.width;
  }

  updateValue(newValue, isCalledFromOutside = true) {
    this.value = newValue;
    if (isCalledFromOutside) this.hiddenDomInput.value = newValue;
    this.updateDisplayedString();

    // placeholder style
    if (this.placeholder) {
      if (newValue.length) this.placeholder.setVisible(false);
      else this.placeholder.setVisible(true);
    }
  }
}

const isMobileDevice = () => true;

export default TextInput;