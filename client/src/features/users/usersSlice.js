import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import usersApi from '../../api/usersApi';

/**
 * Async Thunks
 */

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await usersApi.listUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch users.');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersApi.getUserById(id);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user.');
    }
  }
);

export const changeUserRole = createAsyncThunk(
  'users/changeUserRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const response = await usersApi.updateRole(id, role);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update role.');
    }
  }
);

export const changeUserStatus = createAsyncThunk(
  'users/changeUserStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await usersApi.updateStatus(id, isActive);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update status.');
    }
  }
);

export const removeUser = createAsyncThunk(
  'users/removeUser',
  async (id, { rejectWithValue }) => {
    try {
      await usersApi.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete user.');
    }
  }
);

/**
 * Slice
 */
const initialState = {
  users: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  selectedUser: null,
  isLoading: false,
  isActionLoading: false, // for role/status/delete operations
  error: null,
  actionError: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchUserById
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // changeUserRole — update in-place
    builder
      .addCase(changeUserRole.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeUserRole.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(changeUserRole.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // changeUserStatus — update in-place
    builder
      .addCase(changeUserStatus.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeUserStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(changeUserStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // removeUser — remove from list
    builder
      .addCase(removeUser.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearUsersError, clearSelectedUser } = usersSlice.actions;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUsersTotal = (state) => state.users.total;
export const selectUsersPage = (state) => state.users.page;
export const selectUsersTotalPages = (state) => state.users.totalPages;
export const selectSelectedUser = (state) => state.users.selectedUser;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersActionLoading = (state) => state.users.isActionLoading;
export const selectUsersError = (state) => state.users.error;
export const selectUsersActionError = (state) => state.users.actionError;

export default usersSlice.reducer;
