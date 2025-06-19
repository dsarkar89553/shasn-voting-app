import type { AppUser } from '@/types';

export const appUsers: AppUser[] = [
  { id: 'user1', username: 'deep', password: '7478042391', displayName: 'Deep' },
  { id: 'user2', username: 'rupam', password: '7479296598', displayName: 'Antenna Babu' },
  { id: 'user3', username: 'biswa', password: '7001010937', displayName: 'Badshah Das' },
  { id: 'user4', username: 'papan', password: '9907464734', displayName: 'papan' },
  { id: 'user5', username: 'aritra', password: '7063602550', displayName: 'Dhopash' },
  { id: 'user6', username: 'niloy', password: '8116270439', displayName: 'Niloy' },
  { id: 'user7', username: 'bishal', password: '9382428466', displayName: 'Bishal' },
];

export const findUserByUsername = (username: string): AppUser | undefined => {
  return appUsers.find(user => user.username === username);
};

export const findUserById = (id: string): AppUser | undefined => {
  return appUsers.find(user => user.id === id);
};
