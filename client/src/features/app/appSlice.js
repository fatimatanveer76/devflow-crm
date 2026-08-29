import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

/**
 * Async thunk to fetch system health status from the backend
 */
export const fetchSystemHealth = createAsyncThunk(
  'app/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/health');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to connect to backend server');
    }
  }
);

const initialState = {
  appName: 'DevFlow CRM',
  sidebarOpen: true,
  theme: 'dark',
  systemHealth: null,
  healthLoading: false,
  healthError: null,
  lastHealthCheck: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemHealth.pending, (state) => {
        state.healthLoading = true;
        state.healthError = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.healthLoading = false;
        state.systemHealth = action.payload;
        state.lastHealthCheck = new Date().toISOString();
        state.healthError = null;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.healthLoading = false;
        state.healthError = action.payload;
        state.lastHealthCheck = new Date().toISOString();
      });
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme } = appSlice.actions;

export const selectApp = (state) => state.app;
export const selectSystemHealth = (state) => state.app.systemHealth;
export const selectHealthLoading = (state) => state.app.healthLoading;
export const selectHealthError = (state) => state.app.healthError;

export default appSlice.reducer;
