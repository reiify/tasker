<template>
  <q-page class="q-pa-md board-container">
    <div class="flex items-center q-mb-lg">
      <div class="text-h5">Моя доска</div>
      <q-btn
        color="primary"
        icon="add"
        label="Добавить список"
        @click="createNewList"
        class="q-ml-md"
      />
      <div class="row items-center filters">
        <q-input
          v-model="searchQuery"
          label="Поиск по названию"
          clearable
          dense
          outlined
          debounce="300"
        />
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          label="Статус"
          name="status"
          for="status"
          dense
          outlined
          clearable
          emit-value
          map-options
        />
        <q-input v-model="dateFilter" label="Дата" type="date" clearable dense outlined>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="dateFilter" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
    </div>

    <div class="board-lists row no-wrap" ref="boardRef" style="gap: 16px">
      <ListComponent
        v-for="list in sortedLists"
        :key="list.id"
        :listId="list.id"
        :searchQuery="searchQuery"
        :statusFilter="statusFilter"
        :dateFilter="dateFilter"
        @moveList="handleMoveList"
        class="list-item"
      >
        <q-card-section>
          <q-input
            v-model="newListName"
            label="Название списка"
            dense
            autofocus
            @keyup.enter="saveNewList"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey" @click="cancelNewList" />
          <q-btn
            flat
            label="Сохранить"
            color="primary"
            @click="saveNewList"
            :disable="!newListName"
          />
        </q-card-actions>
      </ListComponent>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ListComponent from 'src/components/ListComponent.vue';
import { useBoardStore } from 'src/stores/boardStore';

type PanEvent = {
  evt?: Event;
  touch?: boolean;
  mouse?: boolean;
  position?: { top?: number; left?: number };
  direction?: 'up' | 'right' | 'down' | 'left';
  isFirst?: boolean;
  isFinal?: boolean;
  duration?: number;
  distance?: { x?: number; y?: number };
  offset?: { x?: number; y?: number };
  delta?: { x?: number; y?: number };
};

const boardStore = useBoardStore();
const boardRef = ref<HTMLElement | null>(null);

const showNewListForm = ref(false);
const newListName = ref('');

const sortedLists = computed(() => boardStore.getSortedLists);

const searchQuery = ref('');
const statusFilter = ref<'todo' | 'in-progress' | 'done' | null>(null);
const dateFilter = ref<string | null>(null);

const statusOptions = [
  { label: 'Не начато', value: 'todo' },
  { label: 'В процессе', value: 'in-progress' },
  { label: 'Выполнено', value: 'done' },
];

onMounted(() => {
  if (boardStore.lists.length === 0) {
    initializeBoard();
  }
});

function initializeBoard() {
  const todayListId = boardStore.createList('Сегодня');
  const thisWeekListId = boardStore.createList('На этой недели');
  const laterListId = boardStore.createList('Позже');

  boardStore.createCard(todayListId, 'Изучить Vue.js');
  boardStore.createCard(todayListId, 'Изучить Quasar Framework');
  boardStore.createCard(thisWeekListId, 'Разработать клон Trello');
  boardStore.createCard(laterListId, 'Настроить проект');

  boardStore.reorderCardsInList(todayListId);
  boardStore.reorderCardsInList(thisWeekListId);
  boardStore.reorderCardsInList(laterListId);
}

function createNewList() {
  showNewListForm.value = true;
  newListName.value = '';
}

function saveNewList() {
  if (!newListName.value) return;

  boardStore.createList(newListName.value);
  showNewListForm.value = false;
  newListName.value = '';
}

function cancelNewList() {
  showNewListForm.value = false;
  newListName.value = '';
}

function handleMoveList({ listId, event }: { listId: number; event: PanEvent }) {
  const lists = boardStore.lists;
  const currentList = lists.find((l) => l.id === listId);
  if (!currentList) return;

  const listElements = document.querySelectorAll('.list-item');
  const listPositions = Array.from(listElements).map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      center: rect.left + rect.width / 2,
    };
  });

  const mouseX = event.position?.left || 0;
  let closestIndex = 0;
  let minDistance = Number.MAX_VALUE;

  listPositions.forEach((pos, index) => {
    const distance = Math.abs(pos.center - mouseX);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  boardStore.moveList(listId, Math.max(0, Math.min(closestIndex, lists.length - 1)));
}
</script>

<style scoped lang="scss">
.board-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.board-lists {
  overflow-x: auto;
  padding-bottom: 16px;
  flex: 1;
}

.list-item {
  flex: 0 0 auto;
}

.new-list-form {
  width: 280px;
  min-width: 280px;
}

.filters {
  gap: 12px;
  padding: 12px 0;
  @media (min-width: 1024px) {
    padding-left: 12px;
  }
}
</style>
