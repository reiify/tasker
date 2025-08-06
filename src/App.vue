<template>
  <router-view />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onMounted } from 'vue';

const $q = useQuasar();
const localTheme = localStorage.getItem('theme');

const theme = () => {
  if (localTheme === 'dark') {
    return true;
  } else if (localTheme === 'light') {
    return false;
  } else {
    return 'auto';
  }
};

onMounted(() => {
  $q.dark.set(theme());
});
</script>
