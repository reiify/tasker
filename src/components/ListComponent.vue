<template>
  <q-card
    flat
    bordered
    class="column list-item"
    v-touch-pan.mouse.prevent="onListPan"
    :class="{ 'list-dragging': isListDragging }"
    :style="listDragStyle"
    :data-list-id="list?.id"
  >
    <q-item class="bg-primary" style="cursor: move">
      <q-item-section class="q-px-sm q-py-xs">
        <q-input
          v-model="listTitle"
          dense
          borderless
          dark
          class="text-white"
          @blur="updateListName"
        />
      </q-item-section>

      <q-item-section side>
        <q-btn icon="delete" flat round dense @click="deleteList" />
      </q-item-section>
    </q-item>

    <q-card-section
      class="column list-cards-container"
      :class="{ 'drop-target': isDropTarget }"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
    >
      <div v-if="listCards.length === 0" class="text-center text-grey q-py-md">Нет карточек</div>

      <CardComponent
        v-for="card in listCards"
        :key="card.id"
        :cardId="card.id"
        :listId="list?.id || 0"
        @moveCard="handleMoveCard"
      />
    </q-card-section>

    <q-card-section class="q-pa-sm">
      <q-input
        v-model="newCardTitle"
        placeholder="Название новой карточки"
        dense
        outlined
        class="q-mb-sm"
      />
      <q-btn
        color="primary"
        label="Добавить карточку"
        class="full-width"
        :disable="!newCardTitle.trim()"
        @click="addCard"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { date } from 'quasar';
import { useBoardStore } from '../stores/boardStore';
import CardComponent from './CardComponent.vue';

const props = defineProps<{
  listId: number;
  searchQuery?: string;
  statusFilter?: 'todo' | 'in-progress' | 'done' | null;
  dateFilter?: string | null;
}>();

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

const emit = defineEmits<{
  moveList: [{ listId: number; event: PanEvent }];
}>();

const boardStore = useBoardStore();
const list = computed(() => boardStore.getListById(props.listId));
const listCards = computed(() => {
  let cards = boardStore.getCardsByListId(props.listId).sort((a, b) => a.order - b.order);

  if (props.searchQuery && props.searchQuery.trim() !== '') {
    const q = props.searchQuery.trim().toLowerCase();
    cards = cards.filter((c) => c.title.toLowerCase().includes(q));
  }

  if (props.statusFilter) {
    cards = cards.filter((c) => c.status === props.statusFilter);
  }

  if (props.dateFilter && props.dateFilter.trim() !== '') {
    cards = cards.filter((c) => {
      if (!c.deadline) return false;
      const cardDate = date.formatDate(c.deadline, 'YYYY/MM/DD');
      return cardDate === props.dateFilter;
    });
  }

  return cards;
});

const listTitle = ref('');
const newCardTitle = ref('');
const isDropTarget = ref(false);

const isListDragging = ref(false);
const startPosition = { x: 0, y: 0 };
const dragPosition = ref({ x: 0, y: 0 });

const listDragStyle = computed(() => {
  if (!isListDragging.value) return {};
  return {
    transform: `translate(${dragPosition.value.x}px, ${dragPosition.value.y}px)`,
    opacity: '0.8',
    zIndex: '1000',
  };
});

if (list.value) {
  listTitle.value = list.value.name;
}

function updateListName() {
  if (list.value && listTitle.value.trim() !== '') {
    boardStore.updateList({
      id: list.value.id,
      name: listTitle.value.trim(),
    });
  } else if (list.value) {
    listTitle.value = list.value.name;
  }
}

function addCard() {
  if (newCardTitle.value.trim() !== '') {
    boardStore.createCard(props.listId, newCardTitle.value.trim());
    newCardTitle.value = '';
  }
}

function deleteList() {
  boardStore.deleteList(props.listId);
}

function onListPan(event: PanEvent) {
  if (event.evt) {
    const target = event.evt.target as HTMLElement;
    const isHeader = target.closest('.q-item') !== null;
    if (!isHeader) return;
  }

  if (event.isFirst) {
    isListDragging.value = true;
    startPosition.x = event.position?.left || 0;
    startPosition.y = event.position?.top || 0;
    dragPosition.value = { x: 0, y: 0 };

    document.body.classList.add('dragging-list');

    if (event.evt) {
      event.evt.stopPropagation();
    }
  } else if (isListDragging.value && event.position) {
    dragPosition.value.x = (event.position.left || 0) - startPosition.x;
    dragPosition.value.y = (event.position.top || 0) - startPosition.y;

    if (event.evt) {
      let mouseX = 0;

      if (event.evt instanceof MouseEvent) {
        mouseX = event.evt.clientX;
      } else if (event.evt instanceof TouchEvent) {
        mouseX = event.evt.touches?.[0]?.clientX || 0;
      }

      document.querySelectorAll('.list-insert-indicator').forEach((el) => {
        el.remove();
      });

      const listElements = document.querySelectorAll('.list-item');
      const listPositions = Array.from(listElements).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          element: el as HTMLElement,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          center: rect.left + rect.width / 2,
        };
      });

      let closestList: {
        element: HTMLElement;
        left: number;
        right: number;
        width: number;
        center: number;
      } | null = null;
      let minDistance = Number.MAX_VALUE;

      listPositions.forEach((pos) => {
        if (pos.element.getAttribute('data-list-id') === String(list.value?.id)) return;

        const distance = Math.abs(pos.center - mouseX);
        if (distance < minDistance) {
          minDistance = distance;
          closestList = pos;
        }
      });

      if (closestList) {
        const typedClosestList = closestList as {
          element: HTMLElement;
          left: number;
          right: number;
          width: number;
          center: number;
        };

        const insertBefore = mouseX < typedClosestList.center;
        const indicator = document.createElement('div');
        indicator.className = 'list-insert-indicator';

        const element = typedClosestList.element;
        const parent = element.parentNode as Node;

        if (insertBefore && parent) {
          parent.insertBefore(indicator, element);
        } else if (parent) {
          parent.insertBefore(indicator, element.nextSibling);
        }
      }
    }
  }

  if (event.isFinal && isListDragging.value) {
    isListDragging.value = false;
    dragPosition.value = { x: 0, y: 0 };

    document.body.classList.remove('dragging-list');

    document.querySelectorAll('.list-insert-indicator').forEach((el) => {
      el.remove();
    });

    if (list.value) {
      emit('moveList', {
        listId: list.value.id,
        event: event,
      });
    }
  }
}

function handleMoveCard({ cardId, event }: { cardId: number; event: PanEvent }) {
  const card = boardStore.getCardById(cardId);
  if (!card || !list.value) return;

  if (card.listId === list.value.id) {
    const listCards = boardStore.getCardsByListId(list.value.id).sort((a, b) => a.order - b.order);

    if (listCards.length <= 1) return;

    if (event.evt) {
      let mouseY = 0;

      if (event.evt instanceof MouseEvent) {
        mouseY = event.evt.clientY;
      } else if (event.evt instanceof TouchEvent) {
        mouseY = event.evt.changedTouches?.[0]?.clientY || 0;
      }

      const cardElements = document.querySelectorAll('.card-item');
      const cardPositions = Array.from(cardElements).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          center: rect.top + rect.height / 2,
        };
      });

      let closestIndex = -1;
      let minDistance = Number.MAX_VALUE;

      cardPositions.forEach((pos) => {
        if (pos.element.contains(event.evt?.target as Node)) return;

        const cardId = parseInt(pos.element.getAttribute('data-card-id') || '0');
        const cardInList = listCards.find((c) => c.id === cardId);
        if (!cardInList) return;

        const distance = Math.abs(pos.center - mouseY);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = cardInList.order;
        }
      });

      if (closestIndex !== -1) {
        const cardPosition = cardPositions.find((pos) => {
          const posCardId = parseInt(pos.element.getAttribute('data-card-id') || '0');
          const posCard = listCards.find((c) => c.id === posCardId);
          return posCard && posCard.order === closestIndex;
        });

        if (cardPosition) {
          const insertBefore = mouseY < cardPosition.center;
          const newOrder = insertBefore ? closestIndex : closestIndex + 1;

          boardStore.moveCardInList(cardId, newOrder);
          console.log('Карточка перемещена внутри списка на позицию:', newOrder);
        }
      }
    }
    return;
  }

  if (event.evt) {
    let mouseY = 0;

    if (event.evt instanceof MouseEvent) {
      mouseY = event.evt.clientY;
    } else if (event.evt instanceof TouchEvent) {
      mouseY = event.evt.changedTouches?.[0]?.clientY || 0;
    }

    const listCards = boardStore.getCardsByListId(list.value.id).sort((a, b) => a.order - b.order);

    const listElement = document.querySelector(`.list-item[data-list-id="${list.value.id}"]`);
    if (!listElement) {
      boardStore.moveCard(cardId, list.value.id);
      console.log('Карточка перемещена в список:', list.value.id);
      return;
    }

    const cardElements = listElement.querySelectorAll('.card-item');

    if (cardElements.length === 0) {
      boardStore.moveCard(cardId, list.value.id);
      console.log('Карточка перемещена в пустой список:', list.value.id);
      return;
    }

    const cardPositions = Array.from(cardElements).map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        element: el,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        center: rect.top + rect.height / 2,
        cardId: parseInt(el.getAttribute('data-card-id') || '0'),
      };
    });

    let closestIndex = -1;
    let minDistance = Number.MAX_VALUE;

    cardPositions.forEach((pos) => {
      const cardInList = listCards.find((c) => c.id === pos.cardId);
      if (!cardInList) return;

      const distance = Math.abs(pos.center - mouseY);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = cardInList.order;
      }
    });

    boardStore.moveCard(cardId, list.value.id);

    if (closestIndex !== -1) {
      const cardPosition = cardPositions.find((pos) => {
        const posCard = listCards.find((c) => c.id === pos.cardId);
        return posCard && posCard.order === closestIndex;
      });

      if (cardPosition) {
        const insertBefore = mouseY < cardPosition.center;
        const newOrder = insertBefore ? closestIndex : closestIndex + 1;

        boardStore.moveCardInList(cardId, newOrder);
        console.log('Карточка перемещена в список на позицию:', newOrder);
      }
    }

    console.log('Карточка перемещена в список:', list.value.id);
  } else {
    boardStore.moveCard(cardId, list.value.id);
    console.log('Карточка перемещена в список:', list.value.id);
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  isDropTarget.value = true;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  if (event.target instanceof HTMLElement) {
    const container = event.target.closest('.list-cards-container');
    if (container) {
      const mouseY = event.clientY;
      const cardElements = container.querySelectorAll('.card-item');

      document.querySelectorAll('.card-insert-indicator').forEach((el) => el.remove());

      if (cardElements.length > 0) {
        let insertBefore = null;
        let minDistance = Number.MAX_VALUE;

        cardElements.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const distance = Math.abs(cardCenter - mouseY);

          if (distance < minDistance) {
            minDistance = distance;
            insertBefore = mouseY < cardCenter ? card : card.nextElementSibling;
          }
        });

        const indicator = document.createElement('div');
        indicator.className = 'card-insert-indicator';

        if (insertBefore) {
          container.insertBefore(indicator, insertBefore);
        } else {
          container.appendChild(indicator);
        }
      } else {
        const indicator = document.createElement('div');
        indicator.className = 'card-insert-indicator';
        container.appendChild(indicator);
      }
    }
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  isDropTarget.value = false;

  document.querySelectorAll('.card-insert-indicator').forEach((el) => el.remove());

  if (!event.dataTransfer || !list.value) return;

  try {
    const jsonData = event.dataTransfer.getData('application/json');
    if (!jsonData) return;

    const dragData = JSON.parse(jsonData);
    const cardId = dragData.cardId;
    const sourceListId = dragData.listId;

    if (!cardId) return;

    const card = boardStore.getCardById(cardId);
    if (!card) return;

    if (sourceListId === list.value.id) {
      const mouseY = event.clientY;
      const listCards = boardStore
        .getCardsByListId(list.value.id)
        .sort((a, b) => a.order - b.order);

      if (listCards.length <= 1) return;

      const cardElements = document.querySelectorAll(
        `.list-item[data-list-id="${list.value.id}"] .card-item`,
      );
      const cardPositions = Array.from(cardElements).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          element: el,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          center: rect.top + rect.height / 2,
          cardId: parseInt(el.getAttribute('data-card-id') || '0'),
        };
      });

      let closestIndex = -1;
      let minDistance = Number.MAX_VALUE;

      cardPositions.forEach((pos) => {
        if (pos.cardId === cardId) return;

        const cardInList = listCards.find((c) => c.id === pos.cardId);
        if (!cardInList) return;

        const distance = Math.abs(pos.center - mouseY);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = cardInList.order;
        }
      });

      if (closestIndex !== -1) {
        const cardPosition = cardPositions.find((pos) => {
          const posCard = listCards.find((c) => c.id === pos.cardId);
          return posCard && posCard.order === closestIndex;
        });

        if (cardPosition) {
          const insertBefore = mouseY < cardPosition.center;
          const newOrder = insertBefore ? closestIndex : closestIndex + 1;

          boardStore.moveCardInList(cardId, newOrder);
          console.log('Карточка перемещена внутри списка на позицию:', newOrder);
        }
      }
    } else {
      const mouseY = event.clientY;
      const listCards = boardStore
        .getCardsByListId(list.value.id)
        .sort((a, b) => a.order - b.order);

      boardStore.moveCard(cardId, list.value.id);

      if (listCards.length > 0) {
        const cardElements = document.querySelectorAll(
          `.list-item[data-list-id="${list.value.id}"] .card-item`,
        );

        if (cardElements.length > 0) {
          const cardPositions = Array.from(cardElements).map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              element: el,
              top: rect.top,
              bottom: rect.bottom,
              height: rect.height,
              center: rect.top + rect.height / 2,
              cardId: parseInt(el.getAttribute('data-card-id') || '0'),
            };
          });

          let closestIndex = -1;
          let minDistance = Number.MAX_VALUE;

          cardPositions.forEach((pos) => {
            if (pos.cardId === cardId) return;

            const cardInList = listCards.find((c) => c.id === pos.cardId);
            if (!cardInList) return;

            const distance = Math.abs(pos.center - mouseY);
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = cardInList.order;
            }
          });

          if (closestIndex !== -1) {
            const cardPosition = cardPositions.find((pos) => {
              const posCard = listCards.find((c) => c.id === pos.cardId);
              return posCard && posCard.order === closestIndex;
            });

            if (cardPosition) {
              const insertBefore = mouseY < cardPosition.center;
              const newOrder = insertBefore ? closestIndex : closestIndex + 1;

              boardStore.moveCardInList(cardId, newOrder);
              console.log('Карточка перемещена в список на позицию:', newOrder);
            }
          }
        }
      }

      console.log('Карточка перемещена в список:', list.value.id);
    }
  } catch (error) {
    console.error('Ошибка при обработке перетаскивания:', error);
  }
}
</script>

<style scoped lang="scss">
.list-cards-container {
  overflow-y: auto;
  flex: 1;
  padding: 8px;
  gap: 8px;
  min-height: 100px;
  max-height: 100%;
  position: relative;
}

.list-item {
  width: 280px;
  min-height: 100px;
  max-height: 100%;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.list-dragging {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

:global(.dragging-list) {
  cursor: grabbing !important;
}

:global(.list-insert-indicator) {
  width: 4px;
  height: 100%;
  background-color: #1976d2;
  margin: 0 4px;
  border-radius: 2px;
  animation: pulse 1.5s infinite;
}

:global(.card-insert-indicator) {
  height: 4px;
  width: 100%;
  background-color: #1976d2;
  margin: 4px 0;
  border-radius: 2px;
  animation: pulse 1.5s infinite;
  z-index: 10;
}

.drop-target {
  background-color: rgba(25, 118, 210, 0.1);
  border: 2px dashed #1976d2;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
