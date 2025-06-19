import type { AppUser } from '@/types';

export const appUsers: AppUser[] = [
  { id: 'user1', username: 'alpha', password: 'password1', displayName: 'Alpha Player' },
  { id: 'user2', username: 'bravo', password: 'password2', displayName: 'Bravo Player' },
  { id: 'user3', username: 'charlie', password: 'password3', displayName: 'Charlie Player' },
  { id: 'user4', username: 'delta', password: 'password4', displayName: 'Delta Player' },
  { id: 'user5', username: 'echo', password: 'password5', displayName: 'Echo Player' },
  { id: 'user6', username: 'foxtrot', password: 'password6', displayName: 'Foxtrot Player' },
  { id: 'user7', username: 'golf', password: 'password7', displayName: 'Golf Player' },
];

export const findUserByUsername = (username: string): AppUser | undefined => {
  return appUsers.find(user => user.username === username);
};

export const findUserById = (id: string): AppUser | undefined => {
  return appUsers.find(user => user.id === id);
};
