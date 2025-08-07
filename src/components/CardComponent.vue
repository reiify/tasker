<template>
  <q-card
    bordered
    flat
    class="cursor-pointer card-item q-mb-sm"
    @click="openCardDialog"
    v-touch-pan.mouse.prevent="onPan"
    :class="{ 'card-dragging': isDragging }"
    :style="dragStyle"
    :data-card-id="card.id"
  >
    <q-card-section class="q-py-sm">
      <div class="text-subtitle2">{{ card.title }}</div>
      <div class="text-caption q-mt-xs" v-if="card.description">
        {{ truncatedDescription }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none q-pb-xs">
      <div class="row items-center justify-between">
        <q-chip size="sm" :color="statusColor" text-color="white" class="q-py-xs">
          {{ statusText }}
        </q-chip>

        <div v-if="card.deadline" class="text-caption">
          <q-icon name="event" size="xs" />
          {{ formattedDeadline }}
        </div>
      </div>
    </q-card-section>

    <q-dialog v-model="showDialog">
      <q-card class="column">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ card.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <div class="text-subtitle2 q-mb-sm">Описание</div>
              <q-input
                v-model="editedCard.description"
                type="textarea"
                autogrow
                outlined
                placeholder="Добавьте описание..."
              />

              <div class="text-subtitle2 q-mt-md q-mb-sm">Активность</div>
              <div class="text-caption">
                <p>Создано: {{ formattedCreatedAt }}</p>
                <p>Обновлено: {{ formattedUpdatedAt }}</p>
                <p>Автор: {{ card.createdBy }}</p>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <div class="text-subtitle2 q-mb-sm">Статус</div>
              <q-select
                v-model="editedCard.status"
                :options="statusOptions"
                outlined
                dense
                emit-value
                map-options
              />

              <div class="text-subtitle2 q-mt-md q-mb-sm">Срок</div>
              <q-input v-model="editedCard.deadline" outlined dense type="text">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="editedCard.deadline">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Закрыть" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <div class="text-subtitle2 q-mt-md q-mb-sm">Действия</div>
              <q-btn
                color="negative"
                label="Удалить карточку"
                class="full-width q-mb-sm"
                @click="deleteCard"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-mt-auto">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn label="Сохранить" color="primary" @click="saveCard" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { useBoardStore } from 'src/stores/boardStore';
import type { Card } from 'src/stores/boardStore';
import { computed, ref, reactive } from 'vue';
import { date } from 'quasar';

const props = defineProps({
  cardId: {
    type: Number,
    required: true,
  },
  listId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['moveCard']);

const boardStore = useBoardStore();
const showDialog = ref(false);

const isDragging = ref(false);
const dragPosition = reactive({ x: 0, y: 0 });
const startPosition = reactive({ x: 0, y: 0 });

const card = computed(() => {
  const foundCard = boardStore.getCardById(props.cardId);
  if (!foundCard) {
    return {
      id: -1,
      listId: props.listId,
      title: 'Карточка не найдена',
      description: '',
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
    } as Card;
  }
  return foundCard;
});

const editedCard = reactive({
  id: card.value.id,
  title: card.value.title,
  description: card.value.description || '',
  status: card.value.status,
  deadline: card.value.deadline ? date.formatDate(card.value.deadline, 'YYYY/MM/DD') : undefined,
  listId: card.value.listId,
});

const truncatedDescription = computed(() => {
  if (!card.value.description) return '';
  return card.value.description.length > 50
    ? card.value.description.substring(0, 50) + '...'
    : card.value.description;
});

const formattedDeadline = computed(() => {
  if (!card.value.deadline) return '';
  return date.formatDate(card.value.deadline, 'DD.MM.YYYY');
});

const formattedCreatedAt = computed(() => {
  return date.formatDate(card.value.createdAt, 'DD.MM.YYYY HH:mm');
});

const formattedUpdatedAt = computed(() => {
  return date.formatDate(card.value.updatedAt, 'DD.MM.YYYY HH:mm');
});

const statusText = computed(() => {
  switch (card.value.status) {
    case 'todo':
      return 'Не начато';
    case 'in-progress':
      return 'В процессе';
    case 'done':
      return 'Выполнено';
    default:
      return 'Неизвестно';
  }
});

const statusColor = computed(() => {
  switch (card.value.status) {
    case 'todo':
      return 'blue';
    case 'in-progress':
      return 'orange';
    case 'done':
      return 'green';
    default:
      return 'grey';
  }
});

const statusOptions = [
  { label: 'Не начато', value: 'todo' },
  { label: 'В процессе', value: 'in-progress' },
  { label: 'Выполнено', value: 'done' },
];

const dragStyle = computed(() => {
  if (!isDragging.value) return {};
  return {
    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
    opacity: '0.8',
    'z-index': 100,
  };
});

function openCardDialog() {
  Object.assign(editedCard, {
    id: card.value.id,
    title: card.value.title,
    description: card.value.description || '',
    status: card.value.status,
    deadline: card.value.deadline,
    listId: card.value.listId,
  });
  showDialog.value = true;
}

function saveCard() {
  const updateData: Partial<Card> & { id: number } = {
    id: card.value.id,
    title: editedCard.title,
    description: editedCard.description,
    status: editedCard.status,
    listId: editedCard.listId,
  };

  if (
    editedCard.deadline &&
    typeof editedCard.deadline === 'string' &&
    editedCard.deadline.trim() !== ''
  ) {
    updateData.deadline = new Date(editedCard.deadline);
  } else {
    updateData.deadline = null;
  }

  boardStore.updateCard(updateData);
}

function deleteCard() {
  boardStore.deleteCard(card.value.id);
  showDialog.value = false;
}

function onPan(event: {
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
}) {
  if (event.isFirst) {
    isDragging.value = true;
    startPosition.x = event.position?.left || 0;
    startPosition.y = event.position?.top || 0;
    dragPosition.x = 0;
    dragPosition.y = 0;

    document.body.classList.add('dragging-card');

    if (event.evt) {
      event.evt.stopPropagation();
    }
  } else if (isDragging.value && event.position) {
    dragPosition.x = (event.position.left || 0) - startPosition.x;
    dragPosition.y = (event.position.top || 0) - startPosition.y;

    if (event.evt) {
      let mouseX = 0;
      let mouseY = 0;

      if (event.evt instanceof MouseEvent) {
        mouseX = event.evt.clientX;
        mouseY = event.evt.clientY;
      } else if (event.evt instanceof TouchEvent) {
        mouseX = event.evt.touches?.[0]?.clientX || 0;
        mouseY = event.evt.touches?.[0]?.clientY || 0;
      }

      const elementsUnderCursor = document.elementsFromPoint(mouseX, mouseY);

      const listContainer = elementsUnderCursor.find((el) =>
        el.classList.contains('list-cards-container'),
      );

      document.querySelectorAll('.list-cards-container').forEach((el) => {
        el.classList.remove('drop-target');
      });

      if (listContainer) {
        listContainer.classList.add('drop-target');
      }
    }
  }

  if (event.isFinal && isDragging.value) {
    isDragging.value = false;
    dragPosition.x = 0;
    dragPosition.y = 0;

    document.body.classList.remove('dragging-card');

    document.querySelectorAll('.list-cards-container').forEach((el) => {
      el.classList.remove('drop-target');
    });

    if (event.evt) {
      let mouseX = 0;
      let mouseY = 0;

      if (event.evt instanceof MouseEvent) {
        mouseX = event.evt.clientX;
        mouseY = event.evt.clientY;
      } else if (event.evt instanceof TouchEvent) {
        mouseX = event.evt.changedTouches?.[0]?.clientX || 0;
        mouseY = event.evt.changedTouches?.[0]?.clientY || 0;
      }

      const elementsUnderCursor = document.elementsFromPoint(mouseX, mouseY);

      const listContainer = elementsUnderCursor.find((el) =>
        el.classList.contains('list-cards-container'),
      );

      if (listContainer) {
        const listComponent = listContainer.closest('.list-item');
        if (listComponent) {
          emit('moveCard', {
            cardId: card.value.id,
            event: event,
          });
        }
      }
    } else {
      emit('moveCard', {
        cardId: card.value.id,
        event: event,
      });
    }
  }
}
</script>

<style scoped lang="scss">
.card-item {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;
  z-index: 1;
}

.card-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card-dragging {
  position: relative;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  pointer-events: none;
}

:global(.dragging-card) {
  cursor: grabbing !important;
}

:global(.drop-target) {
  background-color: rgba(25, 118, 210, 0.1) !important;
  transition: background-color 0.2s ease;
}
</style>
