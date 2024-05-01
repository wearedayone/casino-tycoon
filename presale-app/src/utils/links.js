export const socials = [
  {
    name: 'Medium',
    url: 'https://medium.com/@unchartedgg',
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/nVyGcEPVmj',
  },
  {
    name: 'X',
    url: 'https://twitter.com/gguncharted',
  },
];

export const externalLinks = [
  {
    name: 'Launchpad',
    url: 'https://uncharted.gg',
  },
  {
    name: 'Rewards',
    url: 'https://uncharted.gg/dashboard/rewards',
  },
];

export const links = [
  {
    name: 'Games',
    url: 'https://uncharted.gg/#games',
  },
  {
    name: 'Token',
    url: 'https://uncharted.gg/#token',
  },
  {
    name: 'Backers',
    url: 'https://uncharted.gg/#backers',
  },
  {
    name: 'Work with us',
    url: 'https://uncharted.gg/#work-with-us',
  },
  {
    name: 'Learn more',
    sublinks: socials,
  },
];

export const menuLinks = [...links.slice(0, 4), ...externalLinks];
