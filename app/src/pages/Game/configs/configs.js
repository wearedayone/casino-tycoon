const configs = {
  width: window.innerWidth / window.innerHeight >= 1700 / 2796 ? 1700 : (window.innerWidth * 2796) / window.innerHeight,
  height: 2796,
  gangsterAnimation: {
    back: {
      start: { x: 100, y: 2000, scale: 0.4 },
      end: { x: 645, y: 880, scale: 0.15 },
      time: 3000,
    },
    front: {
      start: { x: 645, y: 880, scale: 0.15 },
      end: {
        x: 645,
        y: 2100,
        scale: 0.4,
      },
      time: 3000,
    },
  },
  goonAnimation: {
    back: {
      start: { x: 1190, y: 2000, scale: 0.4 },
      end: { x: 645, y: 880, scale: 0.15 },
      time: 2000,
    },
    front: {
      start: { x: 645, y: 880, scale: 0.15 },
      end: {
        x: 645,
        y: 2100,
        scale: 0.4,
      },
      time: 2000,
    },
  },
};
export default configs;
