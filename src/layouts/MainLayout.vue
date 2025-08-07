<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="q-px-md">
      <q-toolbar>
        <q-toolbar-title> Tasker </q-toolbar-title>

        <q-space />

        <q-avatar color="negative" text-color="white" class="cursor-pointer">
          <span class="non-selectable content-center">{{ useStore.currentUser?.name[0] }}</span>

          <q-menu anchor="bottom left" :offset="[0, 4]" auto-close class="no-shadow non-selectable">
            <q-list bordered class="rounded-borders">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="negative" text-color="white">
                    {{ useStore.currentUser?.name[0] }}
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label lines="1"> {{ useStore.currentUser?.name }} </q-item-label>
                  <q-item-label lines="1"> {{ useStore.currentUser?.email }} </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator inset />

              <q-item-label header>Тема</q-item-label>
              <q-item clickable @click="setTheme('light')">
                <q-item-section side>
                  <q-icon name="light_mode" />
                </q-item-section>

                <q-item-section>
                  <q-item-label lines="1"> Светлая тема </q-item-label>
                </q-item-section>

                <q-item-section side top v-if="currentTheme === false">
                  <q-icon name="check" right />
                </q-item-section>
              </q-item>

              <q-item clickable @click="setTheme('dark')">
                <q-item-section side>
                  <q-icon name="dark_mode" />
                </q-item-section>

                <q-item-section>
                  <q-item-label lines="1"> Тёмная тема </q-item-label>
                </q-item-section>

                <q-item-section side top v-if="currentTheme === true">
                  <q-icon name="check" right />
                </q-item-section>
              </q-item>

              <q-item clickable @click="setTheme('auto')">
                <q-item-section side>
                  <q-icon name="contrast" />
                </q-item-section>

                <q-item-section>
                  <q-item-label lines="1"> Как в системе </q-item-label>
                </q-item-section>

                <q-item-section side top v-if="currentTheme === 'auto'">
                  <q-icon name="check" right />
                </q-item-section>
              </q-item>

              <q-separator inset />

              <q-item clickable v-close-popup class="text-negative" @click="logout">
                <q-item-section side>
                  <q-icon color="negative" name="logout" />
                </q-item-section>

                <q-item-section>
                  <q-item-label> Выйти </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-avatar>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { watch, ref } from 'vue';
import { useAuthStore } from 'src/stores/authStore';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const currentTheme = ref($q.dark.mode);
const router = useRouter();

const useStore = useAuthStore();
const logout = () => {
  useStore.logoutUser();

  $q.notify({
    message: 'Вы вышли из системы',
    color: 'positive',
  });

  void router.push('/auth');
};

watch(
  () => $q.dark.mode,
  (val) => {
    currentTheme.value = val;
  },
);

const setTheme = (val: string) => {
  if (val === 'auto') {
    $q.dark.set(val);
    return;
  } else if (val === 'dark') {
    $q.dark.set(true);
    return;
  } else if (val === 'light') {
    $q.dark.set(false);
    return;
  }
  localStorage.setItem('theme', val);
};
</script>
