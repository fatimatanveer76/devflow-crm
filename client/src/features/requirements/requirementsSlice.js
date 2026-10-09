import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import requirementsApi from '../../api/requirementsApi';

/**
 * Async Thunks
 */

export const fetchRequirements = createAsyncThunk(
  'requirements/fetchRequirements',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.listRequirements(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch requirements.');
    }
  }
);

export const fetchRequirementById = createAsyncThunk(
  'requirements/fetchRequirementById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.getRequirementById(id);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch requirement details.');
    }
  }
);

export const createNewRequirement = createAsyncThunk(
  'requirements/createNewRequirement',
  async (data, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.createRequirement(data);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create requirement.');
    }
  }
);

export const updateExistingRequirement = createAsyncThunk(
  'requirements/updateExistingRequirement',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.updateRequirement(id, data);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update requirement.');
    }
  }
);

export const changeRequirementStatus = createAsyncThunk(
  'requirements/changeRequirementStatus',
  async ({ id, status, rejection_reason }, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.updateStatus(id, status, rejection_reason);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to transition requirement status.');
    }
  }
);

export const approveRequirementAction = createAsyncThunk(
  'requirements/approveRequirementAction',
  async (id, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.approveRequirement(id);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to approve requirement.');
    }
  }
);

export const rejectRequirementAction = createAsyncThunk(
  'requirements/rejectRequirementAction',
  async ({ id, rejection_reason }, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.rejectRequirement(id, rejection_reason);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to reject requirement.');
    }
  }
);

export const publishRequirementAction = createAsyncThunk(
  'requirements/publishRequirementAction',
  async (id, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.publishRequirement(id);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to publish requirement.');
    }
  }
);

export const removeRequirement = createAsyncThunk(
  'requirements/removeRequirement',
  async (id, { rejectWithValue }) => {
    try {
      await requirementsApi.deleteRequirement(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete requirement.');
    }
  }
);

export const fetchVersionHistory = createAsyncThunk(
  'requirements/fetchVersionHistory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await requirementsApi.getVersionHistory(id);
      return response.data.versions;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch version history.');
    }
  }
);

/**
 * Slice Definition
 */
const initialState = {
  requirements: [],
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 1,
  activeRequirement: null,
  versionHistory: [],
  loading: false,
  actionLoading: false,
  error: null,
  filters: {
    status: '',
    type: '',
    priority: '',
    project_id: '',
    deal_id: '',
    search: '',
  },
};

export const requirementsSlice = createSlice({
  name: 'requirements',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    clearFilters: (state) => {
      state.filters = { ...initialState.filters };
      state.page = 1;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    clearActiveRequirement: (state) => {
      state.activeRequirement = null;
      state.versionHistory = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRequirements
      .addCase(fetchRequirements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequirements.fulfilled, (state, action) => {
        state.loading = false;
        state.requirements = action.payload.requirements || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 25;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchRequirements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchRequirementById
      .addCase(fetchRequirementById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchRequirementById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeRequirement = action.payload;
        if (action.payload.versions) {
          state.versionHistory = action.payload.versions;
        }
      })
      .addCase(fetchRequirementById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // createNewRequirement
      .addCase(createNewRequirement.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createNewRequirement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.requirements.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createNewRequirement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // updateExistingRequirement
      .addCase(updateExistingRequirement.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateExistingRequirement.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.requirements.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requirements[index] = action.payload;
        }
        if (state.activeRequirement?.id === action.payload.id) {
          state.activeRequirement = {
            ...action.payload,
            versions: state.versionHistory,
          };
        }
      })
      .addCase(updateExistingRequirement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // changeRequirementStatus
      .addCase(changeRequirementStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(changeRequirementStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.requirements.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requirements[index] = action.payload;
        }
        if (state.activeRequirement?.id === action.payload.id) {
          state.activeRequirement = {
            ...action.payload,
            versions: state.versionHistory,
          };
        }
      })
      .addCase(changeRequirementStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // approveRequirementAction
      .addCase(approveRequirementAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(approveRequirementAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.requirements.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requirements[index] = action.payload;
        }
        if (state.activeRequirement?.id === action.payload.id) {
          state.activeRequirement = {
            ...action.payload,
            versions: state.versionHistory,
          };
        }
      })
      .addCase(approveRequirementAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // rejectRequirementAction
      .addCase(rejectRequirementAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(rejectRequirementAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.requirements.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requirements[index] = action.payload;
        }
        if (state.activeRequirement?.id === action.payload.id) {
          state.activeRequirement = {
            ...action.payload,
            versions: state.versionHistory,
          };
        }
      })
      .addCase(rejectRequirementAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // publishRequirementAction
      .addCase(publishRequirementAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(publishRequirementAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.requirements.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requirements[index] = action.payload;
        }
        if (state.activeRequirement?.id === action.payload.id) {
          state.activeRequirement = {
            ...action.payload,
            versions: state.versionHistory,
          };
        }
      })
      .addCase(publishRequirementAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // removeRequirement
      .addCase(removeRequirement.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(removeRequirement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.requirements = state.requirements.filter((r) => r.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.activeRequirement?.id === action.payload) {
          state.activeRequirement = null;
        }
      })
      .addCase(removeRequirement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // fetchVersionHistory
      .addCase(fetchVersionHistory.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchVersionHistory.fulfilled, (state, action) => {
        state.versionHistory = action.payload || [];
      })
      .addCase(fetchVersionHistory.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  clearActiveRequirement,
  clearError,
} = requirementsSlice.actions;

// Selectors
export const selectRequirements = (state) => state.requirements.requirements;
export const selectTotalRequirements = (state) => state.requirements.total;
export const selectActiveRequirement = (state) => state.requirements.activeRequirement;
export const selectVersionHistory = (state) => state.requirements.versionHistory;
export const selectRequirementsLoading = (state) => state.requirements.loading;
export const selectRequirementsActionLoading = (state) => state.requirements.actionLoading;
export const selectRequirementsError = (state) => state.requirements.error;
export const selectRequirementsFilters = (state) => state.requirements.filters;
export const selectRequirementsPagination = (state) => ({
  page: state.requirements.page,
  limit: state.requirements.limit,
  total: state.requirements.total,
  totalPages: state.requirements.totalPages,
});

export default requirementsSlice.reducer;
