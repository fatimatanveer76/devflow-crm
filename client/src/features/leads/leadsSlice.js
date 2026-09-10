import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import leadsApi from '../../api/leadsApi';

/**
 * Async Thunks
 */

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await leadsApi.listLeads(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch leads.');
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'leads/fetchLeadById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await leadsApi.getLeadById(id);
      return response.data.lead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch lead details.');
    }
  }
);

export const createNewLead = createAsyncThunk(
  'leads/createNewLead',
  async (data, { rejectWithValue }) => {
    try {
      const response = await leadsApi.createLead(data);
      return response.data.lead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create lead.');
    }
  }
);

export const updateExistingLead = createAsyncThunk(
  'leads/updateExistingLead',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await leadsApi.updateLead(id, data);
      return response.data.lead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update lead.');
    }
  }
);

export const changeLeadStatus = createAsyncThunk(
  'leads/changeLeadStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await leadsApi.updateStatus(id, status);
      return response.data.lead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update lead status.');
    }
  }
);

export const assignLeadUser = createAsyncThunk(
  'leads/assignLeadUser',
  async ({ id, assigned_user_id }, { rejectWithValue }) => {
    try {
      const response = await leadsApi.assignLead(id, assigned_user_id);
      return response.data.lead;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to assign lead.');
    }
  }
);

export const removeLead = createAsyncThunk(
  'leads/removeLead',
  async (id, { rejectWithValue }) => {
    try {
      await leadsApi.deleteLead(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete lead.');
    }
  }
);

/**
 * Slice
 */
const initialState = {
  leads: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  selectedLead: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  actionError: null,
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearLeadsError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearSelectedLead: (state) => {
      state.selectedLead = null;
    },
  },
  extraReducers: (builder) => {
    // fetchLeads
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leads = action.payload.leads;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchLeadById
    builder
      .addCase(fetchLeadById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedLead = action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createNewLead
    builder
      .addCase(createNewLead.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(createNewLead.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.leads.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createNewLead.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // updateExistingLead
    builder
      .addCase(updateExistingLead.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(updateExistingLead.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.leads.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.leads[idx] = action.payload;
        if (state.selectedLead?.id === action.payload.id) {
          state.selectedLead = action.payload;
        }
      })
      .addCase(updateExistingLead.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // changeLeadStatus
    builder
      .addCase(changeLeadStatus.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeLeadStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.leads.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.leads[idx] = action.payload;
        if (state.selectedLead?.id === action.payload.id) {
          state.selectedLead = action.payload;
        }
      })
      .addCase(changeLeadStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // assignLeadUser
    builder
      .addCase(assignLeadUser.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(assignLeadUser.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.leads.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.leads[idx] = action.payload;
        if (state.selectedLead?.id === action.payload.id) {
          state.selectedLead = action.payload;
        }
      })
      .addCase(assignLeadUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // removeLead
    builder
      .addCase(removeLead.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(removeLead.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.leads = state.leads.filter((l) => l.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedLead?.id === action.payload) {
          state.selectedLead = null;
        }
      })
      .addCase(removeLead.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearLeadsError, clearSelectedLead } = leadsSlice.actions;

// Selectors
export const selectLeads = (state) => state.leads.leads;
export const selectLeadsTotal = (state) => state.leads.total;
export const selectLeadsPage = (state) => state.leads.page;
export const selectLeadsLimit = (state) => state.leads.limit;
export const selectLeadsTotalPages = (state) => state.leads.totalPages;
export const selectSelectedLead = (state) => state.leads.selectedLead;
export const selectLeadsLoading = (state) => state.leads.isLoading;
export const selectLeadsActionLoading = (state) => state.leads.isActionLoading;
export const selectLeadsError = (state) => state.leads.error;
export const selectLeadsActionError = (state) => state.leads.actionError;

export default leadsSlice.reducer;
