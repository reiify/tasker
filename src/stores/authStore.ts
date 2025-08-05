import { defineStore } from 'pinia';

interface User {
  email: string;
  name: string;
  password: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    users: [] as User[],
    currentUser: null as User | null,

    // для демо
    defaultUser: {
      email: 'admin@example.com',
      name: 'admin',
      password: '12345678',
    } as User,
  }),

  actions: {
    registerUser(user: User) {
      this.users.push(user);
      this.currentUser = user;
      this.isAuthenticated = true;

      console.log('Пользователь зарегистрирован:', user);
      console.log('Все пользователи:', this.users);

      return true;
    },

    loginUser(loginIdentifier: string, password: string) {
      if (
        (loginIdentifier === this.defaultUser.email || loginIdentifier === this.defaultUser.name) &&
        password === this.defaultUser.password
      ) {
        this.currentUser = this.defaultUser;
        this.isAuthenticated = true;

        console.log('Вход выполнен с учетной записью по умолчанию');

        return true;
      }

      const user = this.users.find(
        (u) => u.email === loginIdentifier || u.name === loginIdentifier,
      );

      if (user && user.password === password) {
        this.currentUser = user;
        this.isAuthenticated = true;

        console.log('Вход выполнен:', user);

        return true;
      }

      return false;
    },

    logoutUser() {
      this.currentUser = null;
      this.isAuthenticated = false;

      console.log('Выход выполнен');

      return true;
    },
  },
});
