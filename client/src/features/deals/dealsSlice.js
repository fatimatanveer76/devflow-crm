import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dealsApi from '../../api/dealsApi';

/**
 * Async Thunks
 */

export const fetchDeals = createAsyncThunk(
  'deals/fetchDeals',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await dealsApi.listDeals(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch deals.');
    }
  }
);

export const fetchDealById = createAsyncThunk(
  'deals/fetchDealById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await dealsApi.getDealById(id);
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch deal details.');
    }
  }
);

export const createNewDeal = createAsyncThunk(
  'deals/createNewDeal',
  async (data, { rejectWithValue }) => {
    try {
      const response = await dealsApi.createDeal(data);
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create deal.');
    }
  }
);

export const updateExistingDeal = createAsyncThunk(
  'deals/updateExistingDeal',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await dealsApi.updateDeal(id, data);
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update deal.');
    }
  }
);

export const changeDealStage = createAsyncThunk(
  'deals/changeDealStage',
  async ({ id, stage, probability }, { rejectWithValue }) => {
    try {
      const response = await dealsApi.updateStage(id, stage, probability);
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update deal stage.');
    }
  }
);

export const changeDealStatus = createAsyncThunk(
  'deals/changeDealStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await dealsApi.updateStatus(id, status);
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update deal status.');
    }
  }
);

export const assignDealUser = createAsyncThunk(
  'deals/assignDealUser',
  async ({ id, assigned_user_id }, { rejectWithValue }) => {
    try {
      const response = await dealsApi.assignDeal(id, assigned_user_id);
      return response.data.deal;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to assign deal.');
    }
  }
);

export const removeDeal = createAsyncThunk(
  'deals/removeDeal',
  async (id, { rejectWithValue }) => {
    try {
      await dealsApi.deleteDeal(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete deal.');
    }
  }
);

/**
 * Slice
 */
const initialState = {
  deals: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  summary: {
    totalPipelineValue: 0,
    openValue: 0,
    wonValue: 0,
    lostValue: 0,
    countByStage: {},
    totalDeals: 0,
  },
  selectedDeal: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  actionError: null,
};

const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {
    clearDealsError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearSelectedDeal: (state) => {
      state.selectedDeal = null;
    },
  },
  extraReducers: (builder) => {
    // fetchDeals
    builder
      .addCase(fetchDeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deals = action.payload.deals;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
        if (action.payload.summary) {
          state.summary = action.payload.summary;
        }
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchDealById
    builder
      .addCase(fetchDealById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDealById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedDeal = action.payload;
      })
      .addCase(fetchDealById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createNewDeal
    builder
      .addCase(createNewDeal.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(createNewDeal.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.deals.unshift(action.payload);
        state.total += 1;
        state.summary.totalPipelineValue += parseFloat(action.payload.value) || 0;
        if (action.payload.status === 'open') {
          state.summary.openValue += parseFloat(action.payload.value) || 0;
        }
      })
      .addCase(createNewDeal.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // updateExistingDeal
    builder
      .addCase(updateExistingDeal.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(updateExistingDeal.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.deals.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.deals[idx] = action.payload;
        if (state.selectedDeal?.id === action.payload.id) {
          state.selectedDeal = action.payload;
        }
      })
      .addCase(updateExistingDeal.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // changeDealStage
    builder
      .addCase(changeDealStage.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeDealStage.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.deals.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.deals[idx] = action.payload;
        if (state.selectedDeal?.id === action.payload.id) {
          state.selectedDeal = action.payload;
        }
      })
      .addCase(changeDealStage.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // changeDealStatus
    builder
      .addCase(changeDealStatus.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeDealStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.deals.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.deals[idx] = action.payload;
        if (state.selectedDeal?.id === action.payload.id) {
          state.selectedDeal = action.payload;
        }
      })
      .addCase(changeDealStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // assignDealUser
    builder
      .addCase(assignDealUser.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(assignDealUser.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.deals.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.deals[idx] = action.payload;
        if (state.selectedDeal?.id === action.payload.id) {
          state.selectedDeal = action.payload;
        }
      })
      .addCase(assignDealUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // removeDeal
    builder
      .addCase(removeDeal.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(removeDeal.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.deals = state.deals.filter((d) => d.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedDeal?.id === action.payload) {
          state.selectedDeal = null;
        }
      })
      .addCase(removeDeal.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearDealsError, clearSelectedDeal } = dealsSlice.actions;

// Selectors
export const selectDeals = (state) => state.deals.deals;
export const selectDealsTotal = (state) => state.deals.total;
export const selectDealsPage = (state) => state.deals.page;
export const selectDealsLimit = (state) => state.deals.limit;
export const selectDealsTotalPages = (state) => state.deals.totalPages;
export const selectDealsSummary = (state) => state.deals.summary;
export const selectSelectedDeal = (state) => state.deals.selectedDeal;
export const selectDealsLoading = (state) => state.deals.isLoading;
export const selectDealsActionLoading = (state) => state.deals.isActionLoading;
export const selectDealsError = (state) => state.deals.error;
export const selectDealsActionError = (state) => state.deals.actionError;

export default dealsSlice.reducer;
