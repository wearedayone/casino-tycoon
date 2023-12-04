const savedWindowHeight =
  localStorage.getItem('windowHeight') && !isNaN(+localStorage.getItem('windowHeight'))
    ? +localStorage.getItem('windowHeight')
    : null;

if (!savedWindowHeight) {
  localStorage.setItem('windowHeight', window.innerHeight);
}

const windowWidth = window.innerWidth;
const windowHeight = savedWindowHeight || window.innerHeight;

const width = windowWidth / windowHeight >= 1700 / 2796 ? 1700 : (windowWidth * 2796) / windowHeight;

const configs = {
  width: width,
  height: 2796,
  gangsterAnimation: {
    back: {
      start: { x: 150, y: 2000, scale: 0.4 },
      end: { x: width / 2 - 50, y: 880, scale: 0.15 },
      time: 3000,
    },
    front: {
      start: { x: width / 2 - 50, y: 880, scale: 0.15 },
      end: {
        x: width / 2 - 50,
        y: 2100,
        scale: 0.4,
      },
      time: 3000,
    },
  },
  goonAnimation: {
    back: {
      start: { x: width - 150, y: 2000, scale: 0.4 },
      end: { x: width / 2 + 50, y: 880, scale: 0.15 },
      time: 3000,
    },
    front: {
      start: { x: width / 2 + 50, y: 880, scale: 0.15 },
      end: {
        x: width / 2 + 50,
        y: 2100,
        scale: 0.4,
      },
      time: 3000,
    },
  },
};
export default configs;
