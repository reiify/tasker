<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="bg-transparent q-pa-sm">
      <q-toolbar>
        <q-space />
        <q-btn
          flat
          round
          :icon="isDarkTheme ? 'dark_mode' : 'light_mode'"
          @click="toggleTheme"
          :class="isDarkTheme ? 'text-white' : 'text-black'"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page padding class="flex flex-center">
        <q-card flat class="column text-center">
          <q-card-section>
            <h5 class="text-h5 text-weight-medium q-ma-xs">Tasker</h5>
            <span class="text-subtitle1">Personal Task Manager App</span>
          </q-card-section>

          <q-separator />

          <router-view />

          <q-separator />

          <q-card-section>
            <span class="text-caption text-weight-medium">
              Продолжая, Вы соглашаетесь с
              <span class="text-primary cursor-pointer" @click="terms = true"
                >Условиями пользования</span
              >
              и
              <span class="text-primary cursor-pointer" @click="agreement = true"
                >Политикой конфиденциальности</span
              >.
            </span>
          </q-card-section>

          <q-dialog v-model="terms">
            <q-card>
              <q-card-section>
                <h6 class="text-h6 q-my-xs">Условия пользования</h6>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <span v-for="(value, index) in Array(10).fill(lorem)" :key="index">
                  {{ value }}
                </span>
              </q-card-section>
            </q-card>
          </q-dialog>

          <q-dialog v-model="agreement">
            <q-card>
              <q-card-section>
                <h6 class="text-h6 q-my-xs">Политика конфиденциальности</h6>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <span v-for="(value, index) in Array(10).fill(lorem)" :key="index">
                  {{ value }}
                </span>
              </q-card-section>
            </q-card>
          </q-dialog>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';

const terms = ref(false);
const agreement = ref(false);

const lorem =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit facilis deleniti nam, consectetur architecto, dicta cumque dolores, laboriosam excepturi fugit dolorum.\n';

const $q = useQuasar();
const toggleTheme = () => {
  $q.dark.toggle();
  localStorage.setItem('theme', $q.dark.isActive ? 'dark' : 'light');
};
const isDarkTheme = ref($q.dark.isActive);

watch(
  () => $q.dark.isActive,
  (value) => {
    isDarkTheme.value = value;
  },
);
</script>
