import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardApi from '../../api/dashboardApi';

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchDashboardSummary',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getSummary(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard metrics.');
    }
  }
);

const initialState = {
  data: null,
  dateRangeKey: 'all',
  startDate: null,
  endDate: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      const { rangeKey, startDate, endDate } = action.payload;
      state.dateRangeKey = rangeKey;
      state.startDate = startDate || null;
      state.endDate = endDate || null;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setDateRange, clearDashboardError } = dashboardSlice.actions;

export const selectDashboardData = (state) => state.dashboard.data;
export const selectDashboardLoading = (state) => state.dashboard.isLoading;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectDashboardDateRange = (state) => ({
  rangeKey: state.dashboard.dateRangeKey,
  startDate: state.dashboard.startDate,
  endDate: state.dashboard.endDate,
});
export const selectDashboardLastUpdated = (state) => state.dashboard.lastUpdated;

export default dashboardSlice.reducer;
