import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import activitiesApi from '../../api/activitiesApi';

export const fetchActivities = createAsyncThunk(
  'activities/fetchActivities',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await activitiesApi.listActivities(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch activities.');
    }
  }
);

const initialState = {
  activities: [],
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 1,
  isLoading: false,
  error: null,
};

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    clearActivitiesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload.activities;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearActivitiesError } = activitiesSlice.actions;

export const selectActivities = (state) => state.activities.activities;
export const selectActivitiesTotal = (state) => state.activities.total;
export const selectActivitiesLoading = (state) => state.activities.isLoading;
export const selectActivitiesError = (state) => state.activities.error;

export default activitiesSlice.reducer;
