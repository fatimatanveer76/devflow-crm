import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tasksApi from '../../api/tasksApi';

/**
 * Async Thunks
 */

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await tasksApi.listTasks(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch tasks.');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tasksApi.getTaskById(id);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch task details.');
    }
  }
);

export const createNewTask = createAsyncThunk(
  'tasks/createNewTask',
  async (data, { rejectWithValue }) => {
    try {
      const response = await tasksApi.createTask(data);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create task.');
    }
  }
);

export const updateExistingTask = createAsyncThunk(
  'tasks/updateExistingTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tasksApi.updateTask(id, data);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update task.');
    }
  }
);

export const changeTaskStatus = createAsyncThunk(
  'tasks/changeTaskStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await tasksApi.updateStatus(id, status);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update task status.');
    }
  }
);

export const assignTaskUser = createAsyncThunk(
  'tasks/assignTaskUser',
  async ({ id, assigned_user_id }, { rejectWithValue }) => {
    try {
      const response = await tasksApi.assignTask(id, assigned_user_id);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to assign task.');
    }
  }
);

export const removeTask = createAsyncThunk(
  'tasks/removeTask',
  async (id, { rejectWithValue }) => {
    try {
      await tasksApi.deleteTask(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete task.');
    }
  }
);

const initialState = {
  tasks: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  summary: {
    totalTasks: 0,
    countByStatus: {},
    countByPriority: {},
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
  selectedTask: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  actionError: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearSelectedTask: (state) => {
      state.selectedTask = null;
    },
  },
  extraReducers: (builder) => {
    // fetchTasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
        if (action.payload.summary) {
          state.summary = action.payload.summary;
        }
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchTaskById
    builder
      .addCase(fetchTaskById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createNewTask
    builder
      .addCase(createNewTask.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(createNewTask.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.tasks.unshift(action.payload);
        state.total += 1;
        state.summary.totalTasks += 1;
        if (action.payload.status === 'pending') state.summary.pendingTasks += 1;
        if (action.payload.status === 'in_progress') state.summary.inProgressTasks += 1;
      })
      .addCase(createNewTask.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // updateExistingTask
    builder
      .addCase(updateExistingTask.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(updateExistingTask.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.tasks[idx] = action.payload;
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(updateExistingTask.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // changeTaskStatus
    builder
      .addCase(changeTaskStatus.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeTaskStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.tasks[idx] = action.payload;
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(changeTaskStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // assignTaskUser
    builder
      .addCase(assignTaskUser.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(assignTaskUser.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.tasks[idx] = action.payload;
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(assignTaskUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // removeTask
    builder
      .addCase(removeTask.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null;
        }
      })
      .addCase(removeTask.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearTasksError, clearSelectedTask } = tasksSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasks;
export const selectTasksTotal = (state) => state.tasks.total;
export const selectTasksPage = (state) => state.tasks.page;
export const selectTasksLimit = (state) => state.tasks.limit;
export const selectTasksTotalPages = (state) => state.tasks.totalPages;
export const selectTasksSummary = (state) => state.tasks.summary;
export const selectSelectedTask = (state) => state.tasks.selectedTask;
export const selectTasksLoading = (state) => state.tasks.isLoading;
export const selectTasksActionLoading = (state) => state.tasks.isActionLoading;
export const selectTasksError = (state) => state.tasks.error;
export const selectTasksActionError = (state) => state.tasks.actionError;

export default tasksSlice.reducer;
