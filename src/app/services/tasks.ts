import { Injectable, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';

type TaskPayload = {
  title: string;
  description: string;
  category: string;
  type: string;
  dueDate: string;
  due_date: string;
  priority: string;
  assignedTo: number[];
  assignedToNames: string[];
  subtasks: { subtaskText: string; completed: boolean }[];
  status: string;
};

type BoardTask = TaskPayload & {
  id: number;
  created_at: string;
  board_order?: number | null;
};

type TaskOrderMap = Record<string, number[]>;

const BOARD_STATUSES = ['todo', 'inProgress', 'awaitFeedback', 'done'];

@Injectable({
  providedIn: 'root',
})
export class Tasks {
  private readonly supabaseService = inject(Supabase);
  private readonly boardOrderStorageKey = 'join-board-task-order';
  supabase = this.supabaseService.supabase;
  private channel?: RealtimeChannel | undefined;
  private supportsBoardOrderColumn = false;
  readonly isLoading = signal(true);

  constructor() {
    this.getTasks();
    this.setupRealtimeSubscription();
  }

  setupRealtimeSubscription() {
    this.channel = this.supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Realtime change received:', payload);
          this.getTasks();
        }
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }


  demoTasks = signal<BoardTask[]>([]);

  async getTasks() {
    const { data: tasks, error } = await this.supabase.from('tasks').select('*');

    if (error) {
      console.error('Error loading tasks:', error);
      this.isLoading.set(false);
      return;
    }

    if (tasks) {
      this.supportsBoardOrderColumn =
        this.supportsBoardOrderColumn || tasks.some((task) => 'board_order' in task);
      this.demoTasks.set(this.applyBoardOrder(tasks as BoardTask[]));
    }

    this.isLoading.set(false);
  }

  async setTasks(demoData: TaskPayload) {
    const taskToCreate = this.supportsBoardOrderColumn
      ? { ...demoData, board_order: this.getNextBoardOrder(demoData.status) }
      : demoData;
    const { data, error } = await this.supabase.from('tasks').insert([taskToCreate]).select();

    if (error) {
      console.error('Error creating task:', error);
      return;
    }

    await this.getTasks();
  }

  async importTasks(tasks: TaskPayload[]) {
    const nextPositions = new Map<string, number>();
    const tasksToImport = tasks.map((task) => {
      if (!this.supportsBoardOrderColumn) return task;

      const position = nextPositions.get(task.status) ?? this.getNextBoardOrder(task.status);
      nextPositions.set(task.status, position + 1);

      return { ...task, board_order: position };
    });
    const { data, error } = await this.supabase.from('tasks').insert(tasksToImport).select();

    if (error) {
      console.error('Error importing tasks:', error);
      return { data: null, error };
    }

    await this.getTasks();
    return { data, error: null };
  }

  async deleteData(id: number) {
    await this.supabase.from('tasks').delete().eq('id', id).select();
  }

  async updateTasksStatus(id: number, newStatus: string) {
    const { error } = await this.supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.log('Error updating Task:', error);
      return;
    }

    await this.getTasks();
  }

  async moveTask(
    id: number,
    newStatus: string,
    newVisibleIndex: number,
    visibleTargetTasks: { id: number }[],
  ) {
    const task = this.demoTasks().find((taskItem) => taskItem.id === id);

    if (!task) return;

    const previousStatus = task.status;
    const affectedStatuses =
      previousStatus === newStatus ? [newStatus] : [previousStatus, newStatus];
    const sourceTasks = this.tasksInStatus(previousStatus).filter((taskItem) => taskItem.id !== id);
    const targetTasks =
      previousStatus === newStatus
        ? sourceTasks
        : this.tasksInStatus(newStatus).filter((taskItem) => taskItem.id !== id);
    const targetIds = visibleTargetTasks
      .map((taskItem) => taskItem.id)
      .filter((taskId) => taskId !== id);
    const insertIndex = this.getInsertIndex(targetTasks, targetIds, newVisibleIndex);

    targetTasks.splice(insertIndex, 0, { ...task, status: newStatus });

    const updatedColumns = new Map<string, BoardTask[]>([[newStatus, targetTasks]]);

    if (previousStatus !== newStatus) {
      updatedColumns.set(previousStatus, sourceTasks);
    }

    this.setBoardColumns(updatedColumns);
    this.storeBoardOrder();

    if (!this.supportsBoardOrderColumn) {
      if (previousStatus !== newStatus) {
        await this.updateTasksStatus(id, newStatus);
      }

      return;
    }

    await this.persistBoardOrder(affectedStatuses);
  }

  async getupdateTasks(
    id: number,
    demoData: TaskPayload
  ) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(demoData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating task:', error);
      return { data: null, error };
    }

    await this.getTasks();
    return { data, error: null };
  }

  private applyBoardOrder(tasks: BoardTask[]) {
    const storedOrder = this.getStoredBoardOrder();
    const sourceIndexes = new Map(tasks.map((task, index) => [task.id, index]));
    const knownTasks = BOARD_STATUSES.flatMap((status) =>
      tasks
        .filter((task) => task.status === status)
        .sort((a, b) => this.compareBoardOrder(a, b, storedOrder[status] || [], sourceIndexes)),
    );
    const unmatchedTasks = tasks.filter((task) => !BOARD_STATUSES.includes(task.status));

    return [...knownTasks, ...unmatchedTasks];
  }

  private compareBoardOrder(
    first: BoardTask,
    second: BoardTask,
    storedIds: number[],
    sourceIndexes: Map<number, number>,
  ) {
    const firstPosition = this.getPersistedPosition(first);
    const secondPosition = this.getPersistedPosition(second);

    if (firstPosition !== null || secondPosition !== null) {
      if (firstPosition === null) return 1;
      if (secondPosition === null) return -1;
      if (firstPosition !== secondPosition) return firstPosition - secondPosition;
    }

    const firstStoredIndex = storedIds.indexOf(first.id);
    const secondStoredIndex = storedIds.indexOf(second.id);

    if (firstStoredIndex !== -1 || secondStoredIndex !== -1) {
      if (firstStoredIndex === -1) return 1;
      if (secondStoredIndex === -1) return -1;
      return firstStoredIndex - secondStoredIndex;
    }

    return (sourceIndexes.get(first.id) ?? 0) - (sourceIndexes.get(second.id) ?? 0);
  }

  private getPersistedPosition(task: BoardTask) {
    return typeof task.board_order === 'number' && Number.isFinite(task.board_order)
      ? task.board_order
      : null;
  }

  private tasksInStatus(status: string) {
    return this.demoTasks().filter((task) => task.status === status);
  }

  private getNextBoardOrder(status: string) {
    const positions = this.tasksInStatus(status)
      .map((task) => this.getPersistedPosition(task))
      .filter((position): position is number => position !== null);

    return positions.length ? Math.max(...positions) + 1 : this.tasksInStatus(status).length;
  }

  private getInsertIndex(tasks: BoardTask[], visibleTaskIds: number[], visibleIndex: number) {
    const nextVisibleId = visibleTaskIds[visibleIndex];

    if (nextVisibleId !== undefined) {
      const nextTaskIndex = tasks.findIndex((task) => task.id === nextVisibleId);

      if (nextTaskIndex !== -1) return nextTaskIndex;
    }

    const lastVisibleId = visibleTaskIds[visibleTaskIds.length - 1];
    const lastTaskIndex = tasks.findIndex((task) => task.id === lastVisibleId);

    return lastTaskIndex === -1 ? tasks.length : lastTaskIndex + 1;
  }

  private setBoardColumns(updatedColumns: Map<string, BoardTask[]>) {
    const currentTasks = this.demoTasks();
    const orderedTasks = BOARD_STATUSES.flatMap(
      (status) => updatedColumns.get(status) ?? currentTasks.filter((task) => task.status === status),
    );
    const unmatchedTasks = currentTasks.filter((task) => !BOARD_STATUSES.includes(task.status));

    this.demoTasks.set([...orderedTasks, ...unmatchedTasks]);
  }

  private async persistBoardOrder(statuses: string[]) {
    const updates = statuses.flatMap((status) =>
      this.tasksInStatus(status).map((task, index) => ({
        id: task.id,
        status,
        board_order: index,
      })),
    );
    const results = await Promise.all(
      updates.map((task) =>
        this.supabase
          .from('tasks')
          .update({ status: task.status, board_order: task.board_order })
          .eq('id', task.id),
      ),
    );
    const failedUpdate = results.find((result) => result.error);

    if (failedUpdate?.error) {
      console.error('Error updating task order:', failedUpdate.error);
    }

    await this.getTasks();
  }

  private storeBoardOrder() {
    if (typeof localStorage === 'undefined') return;

    const boardOrder = Object.fromEntries(
      BOARD_STATUSES.map((status) => [
        status,
        this.tasksInStatus(status).map((task) => task.id),
      ]),
    );

    try {
      localStorage.setItem(this.boardOrderStorageKey, JSON.stringify(boardOrder));
    } catch {
      // Ordering is still persisted in Supabase when the board_order column is available.
    }
  }

  private getStoredBoardOrder(): TaskOrderMap {
    if (typeof localStorage === 'undefined') return {};

    try {
      const storedOrder: unknown = JSON.parse(
        localStorage.getItem(this.boardOrderStorageKey) || '{}',
      );

      if (typeof storedOrder !== 'object' || storedOrder === null) return {};

      const orderRecord = storedOrder as Record<string, unknown>;

      return Object.fromEntries(
        BOARD_STATUSES.map((status) => [
          status,
          Array.isArray(orderRecord[status])
            ? orderRecord[status].filter((id): id is number => typeof id === 'number')
            : [],
        ]),
      );
    } catch {
      return {};
    }
  }
}
