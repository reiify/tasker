import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

const authStore = useAuthStore();

export interface List {
  id: number;
  name: string;
  order: number;
}

export interface Card {
  id: number;
  listId: number;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  deadline?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  order: number;
}

export const useBoardStore = defineStore('board', {
  state: () => ({
    lists: [] as List[],
    cards: [] as Card[],
    nextListId: 1,
    nextCardId: 1,
  }),

  getters: {
    getListById: (state) => (id: number) => {
      return state.lists.find((list) => list.id === id);
    },

    getCardById: (state) => (id: number) => {
      return state.cards.find((card) => card.id === id);
    },

    getCardsByListId: (state) => (listId: number) => {
      return state.cards.filter((card) => card.listId === listId);
    },

    getSortedLists: (state) => {
      return [...state.lists].sort((a, b) => a.order - b.order);
    },
  },

  actions: {
    createList(name: string) {
      const newList: List = {
        id: this.nextListId++,
        name,
        order: this.lists.length,
      };
      this.lists.push(newList);
      return newList.id;
    },

    createCard(listId: number, title: string) {
      const maxOrder = Math.max(
        0,
        ...this.cards.filter((card) => card.listId === listId).map((card) => card.order),
      );

      const newCard: Card = {
        id: this.nextCardId++,
        listId,
        title,
        description: '',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: authStore.currentUser?.name || 'unknown',
        order: maxOrder + 1,
      };
      this.cards.push(newCard);
      return newCard.id;
    },

    updateCard(updatedCard: Partial<Card> & { id: number }) {
      const index = this.cards.findIndex((c) => c.id === updatedCard.id);
      if (index !== -1 && this.cards[index]) {
        const currentCard = this.cards[index];

        const newCard = {
          ...currentCard,
          ...updatedCard,
          updatedAt: new Date(),
          title: updatedCard.title || currentCard.title,
          listId: updatedCard.listId || currentCard.listId,
          status: updatedCard.status || currentCard.status,
          createdAt: updatedCard.createdAt || currentCard.createdAt,
          createdBy: updatedCard.createdBy || currentCard.createdBy,
        };

        if ('deadline' in updatedCard) {
          newCard.deadline = updatedCard.deadline;
        }

        this.cards[index] = newCard;
        return true;
      }
      return false;
    },

    updateList(updatedList: Partial<List> & { id: number }) {
      const index = this.lists.findIndex((l) => l.id === updatedList.id);
      if (index !== -1 && this.lists[index]) {
        const currentList = this.lists[index];
        this.lists[index] = {
          ...currentList,
          ...updatedList,
          name: updatedList.name || currentList.name,
          order: updatedList.order !== undefined ? updatedList.order : currentList.order,
        };
        return true;
      }
      return false;
    },

    deleteCard(id: number) {
      const index = this.cards.findIndex((c) => c.id === id);
      if (index !== -1) {
        this.cards.splice(index, 1);
        return true;
      }
      return false;
    },

    deleteList(id: number) {
      const index = this.lists.findIndex((l) => l.id === id);
      if (index !== -1) {
        this.lists.splice(index, 1);

        this.cards = this.cards.filter((card) => card.listId !== id);

        this.lists.forEach((list, idx) => {
          list.order = idx;
        });

        return true;
      }
      return false;
    },

    moveList(id: number, newOrder: number) {
      const list = this.lists.find((l) => l.id === id);
      if (!list) return false;

      const oldOrder = list.order;
      if (oldOrder === newOrder) return true;

      this.lists.forEach((l) => {
        if (oldOrder < newOrder) {
          if (l.order > oldOrder && l.order <= newOrder) {
            l.order--;
          }
        } else {
          if (l.order < oldOrder && l.order >= newOrder) {
            l.order++;
          }
        }
      });

      list.order = newOrder;
      return true;
    },

    moveCard(cardId: number, newListId: number) {
      const card = this.cards.find((c) => c.id === cardId);
      if (!card) return false;

      if (card.listId === newListId) return true;

      const oldListId = card.listId;

      const maxOrder = Math.max(
        0,
        ...this.cards.filter((c) => c.listId === newListId).map((c) => c.order),
      );

      card.listId = newListId;
      card.order = maxOrder + 1;
      card.updatedAt = new Date();

      this.reorderCardsInList(oldListId);

      return true;
    },

    moveCardInList(cardId: number, newOrder: number) {
      const card = this.cards.find((c) => c.id === cardId);
      if (!card) return false;

      const listId = card.listId;
      const oldOrder = card.order;

      if (oldOrder === newOrder) return true;

      const listCards = this.cards
        .filter((c) => c.listId === listId)
        .sort((a, b) => a.order - b.order);

      newOrder = Math.max(0, Math.min(newOrder, listCards.length - 1));

      if (oldOrder < newOrder) {
        listCards.forEach((c) => {
          if (c.id !== card.id && c.order > oldOrder && c.order <= newOrder) {
            c.order--;
          }
        });
      } else {
        listCards.forEach((c) => {
          if (c.id !== card.id && c.order >= newOrder && c.order < oldOrder) {
            c.order++;
          }
        });
      }

      card.order = newOrder;
      card.updatedAt = new Date();

      return true;
    },

    reorderCardsInList(listId: number) {
      const listCards = this.cards
        .filter((c) => c.listId === listId)
        .sort((a, b) => a.order - b.order);

      listCards.forEach((card, index) => {
        card.order = index;
      });

      return true;
    },
  },
});
