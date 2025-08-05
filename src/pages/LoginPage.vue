<template>
  <q-card-section>
    <h6 class="text-h6 q-ma-none">Войти</h6>

    <q-form class="flex column q-mt-md" style="gap: 8px">
      <q-input
        standout="bg-primary text-white"
        clearable
        name="loginIdentifier"
        for="loginIdentifier"
        label="E-mail или имя пользователя"
        type="text"
        placeholder="Введите e-mail или имя пользователя"
        v-model="loginIdentifier"
        :rules="[(val) => !!val || 'Поле обязательно для заполнения']"
        lazy-rules
      />

      <q-input
        standout="bg-primary text-white"
        clearable
        name="password"
        for="password"
        label="Пароль"
        :type="isPassword ? 'password' : 'text'"
        placeholder="Введите пароль"
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

      <q-btn
        type="submit"
        @click.prevent="login"
        color="primary"
        text-color="white"
        padding="12px"
        unelevated
        push
        :ripple="false"
      >
        Войти
      </q-btn>

      <router-link to="/auth/register" class="text-dark" style="text-decoration: none">
        Нет аккаунта?
        <span class="text-primary cursor-pointer">Создать аккаунт</span>
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
const router = useRouter();
const authStore = useAuthStore();

const isPassword = ref(true);

const loginIdentifier = ref('');
const password = ref('');

const login = async () => {
  if (!loginIdentifier.value || !password.value) {
    $q.notify({
      color: 'negative',
      message: 'Пожалуйста, заполните все поля',
      icon: 'warning',
    });
    return;
  }

  const result = authStore.loginUser(loginIdentifier.value, password.value);

  if (result) {
    $q.notify({
      color: 'positive',
      message: 'Вы успешно вошли!',
      icon: 'check_circle',
    });

    loginIdentifier.value = '';
    password.value = '';

    await router.push('/');
  } else {
    $q.notify({
      color: 'negative',
      message: 'Неверный логин или пароль',
      icon: 'error',
    });
  }
};
</script>
