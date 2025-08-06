<template>
  <q-card-section>
    <h6 class="text-h6 q-ma-none">Создать аккаунт</h6>

    <q-form class="flex column q-mt-md" style="gap: 8px">
      <q-input
        standout="bg-primary text-white"
        clearable
        name="email"
        for="email"
        label="E-mail"
        type="email"
        placeholder="Введите e-mail"
        v-model="email"
        :rules="[
          (val, rules) => rules.email(val) || 'Пожалуйста, введите правильный адрес почты.',
          (val) => !authStore.checkEmailExists(val) || 'Пользователь с таким email уже существует',
        ]"
        lazy-rules
      />

      <q-input
        standout="bg-primary text-white"
        clearable
        name="name"
        for="name"
        label="Имя пользователя"
        type="text"
        placeholder="Введите имя пользователя (@username)"
        v-model="name"
        :rules="[
          (val) => !!val || 'Поле обязательно для заполнения',
          (val) =>
            /^[a-zA-Z0-9_]+$/.test(val) || 'Только латинские буквы, цифры и нижнее подчеркивание',
          (val) =>
            !authStore.checkUsernameExists(val) || 'Пользователь с таким именем уже существует',
        ]"
        lazy-rules
      />

      <q-input
        standout="bg-primary text-white"
        clearable
        name="password"
        for="password"
        label="Пароль"
        :type="isPassword ? 'password' : 'text'"
        placeholder="Придумайте пароль"
        v-model="password"
        :rules="[(val) => val.length >= 8 || 'Минимум 8 символов']"
        lazy-rules
      >
        <template v-slot:append>
          <q-icon
            :name="isPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="isPassword = !isPassword"
          />
        </template>
      </q-input>

      <q-input
        standout="bg-primary text-white"
        clearable
        name="confirmPassword"
        for="confirmPassword"
        label="Подтвердите пароль"
        :type="isPassword ? 'password' : 'text'"
        placeholder="Подтвердите пароль"
        v-model="confirmPassword"
        :rules="[(val) => val === password || 'Пароли не совпадают']"
        lazy-rules
      >
        <template v-slot:append>
          <q-icon
            :name="isPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="isPassword = !isPassword"
          />
        </template>
      </q-input>

      <q-btn
        type="submit"
        @click.prevent="register"
        color="primary"
        text-color="white"
        padding="12px"
        unelevated
        push
        :ripple="false"
      >
        Регистрация
      </q-btn>

      <router-link
        to="/auth/login"
        class="text-primary cursor-pointer"
        style="text-decoration: none"
      >
        Уже есть аккаунт? Войти
      </router-link>
    </q-form>
  </q-card-section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const authStore = useAuthStore();

const isPassword = ref(true);

const email = ref('');
const name = ref('');
const password = ref('');
const confirmPassword = ref('');

const router = useRouter();

const register = () => {
  if (!email.value || !name.value || !password.value || password.value !== confirmPassword.value) {
    $q.notify({
      color: 'negative',
      message: 'Пожалуйста, заполните все поля корректно',
      icon: 'warning',
    });

    return;
  }

  const user = {
    email: email.value,
    name: name.value,
    password: password.value,
  };

  const result = authStore.registerUser(user);

  if (result.success) {
    $q.notify({
      color: 'positive',
      message: 'Регистрация прошла успешно!',
      icon: 'check_circle',
    });

    email.value = '';
    name.value = '';
    password.value = '';
    confirmPassword.value = '';

    void router.push('/auth/login');
  } else {
    $q.notify({
      color: 'negative',
      message: result.error || 'Ошибка регистрации',
      icon: 'error',
    });
  }
};
</script>
