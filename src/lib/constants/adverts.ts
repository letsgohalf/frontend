export interface AdvertItem {
  id: string;
  text: string;
  link?: string;
}

export const DEFAULT_ADVERTS: AdvertItem[] = [
  {
    id: '1',
    text: 'Join thousands of people splitting costs on LetsGoHalf',
    link: '/explore',
  },
  {
    id: '2',
    text: 'Verify your profile to unlock premium listings',
    link: '/settings',
  },
  {
    id: '3',
    text: 'New listings just posted — check them out!',
    link: '/explore',
  },
  {
    id: '4',
    text: 'Share your space, split the cost — post your first listing today',
    link: '/create',
  },
];
