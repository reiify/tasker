export interface Todo {
  id: number;
  creator: string;
  title: string;
  description?: string;
  status: 'completed' | 'wip' | 'notStarted';
  deadline?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
