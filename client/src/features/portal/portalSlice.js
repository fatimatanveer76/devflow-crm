import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import portalApi from '../../api/portalApi';

/**
 * Async Thunks
 */

export const fetchPortalDashboard = createAsyncThunk(
  'portal/fetchPortalDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portalApi.getDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch portal dashboard.');
    }
  }
);

export const fetchPortalProjects = createAsyncThunk(
  'portal/fetchPortalProjects',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await portalApi.getProjects(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch portal projects.');
    }
  }
);

export const fetchPortalProjectById = createAsyncThunk(
  'portal/fetchPortalProjectById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await portalApi.getProjectById(id);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch project details.');
    }
  }
);

export const fetchPortalRequirements = createAsyncThunk(
  'portal/fetchPortalRequirements',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await portalApi.getRequirements(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch approved requirements.');
    }
  }
);

export const fetchPortalRequirementById = createAsyncThunk(
  'portal/fetchPortalRequirementById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await portalApi.getRequirementById(id);
      return response.data.requirement;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch specification details.');
    }
  }
);

export const fetchPortalProfile = createAsyncThunk(
  'portal/fetchPortalProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portalApi.getProfile();
      return response.data.profile;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch client profile.');
    }
  }
);

export const updatePortalProfile = createAsyncThunk(
  'portal/updatePortalProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await portalApi.updateProfile(data);
      return response.data.profile;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update profile.');
    }
  }
);

/**
 * Slice Definition
 */
const initialState = {
  metrics: {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    approvedRequirements: 0,
    publishedRequirements: 0,
  },
  recentProjects: [],
  recentActivities: [],
  projects: [],
  projectsTotal: 0,
  projectsPage: 1,
  projectsTotalPages: 1,
  activeProject: null,
  requirements: [],
  requirementsTotal: 0,
  requirementsPage: 1,
  requirementsTotalPages: 1,
  activeRequirement: null,
  profile: null,
  loading: false,
  actionLoading: false,
  error: null,
};

export const portalSlice = createSlice({
  name: 'portal',
  initialState,
  reducers: {
    clearActiveProject: (state) => {
      state.activeProject = null;
    },
    clearActiveRequirement: (state) => {
      state.activeRequirement = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchPortalDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortalDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload.metrics || initialState.metrics;
        state.recentProjects = action.payload.recentProjects || [];
        state.recentActivities = action.payload.recentActivities || [];
        if (action.payload.clientProfile) {
          state.profile = action.payload.clientProfile;
        }
      })
      .addCase(fetchPortalDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Projects
      .addCase(fetchPortalProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortalProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects || [];
        state.projectsTotal = action.payload.total || 0;
        state.projectsPage = action.payload.page || 1;
        state.projectsTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchPortalProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Project detail
      .addCase(fetchPortalProjectById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchPortalProjectById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeProject = action.payload;
      })
      .addCase(fetchPortalProjectById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Requirements
      .addCase(fetchPortalRequirements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortalRequirements.fulfilled, (state, action) => {
        state.loading = false;
        state.requirements = action.payload.requirements || [];
        state.requirementsTotal = action.payload.total || 0;
        state.requirementsPage = action.payload.page || 1;
        state.requirementsTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchPortalRequirements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Requirement detail
      .addCase(fetchPortalRequirementById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchPortalRequirementById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeRequirement = action.payload;
      })
      .addCase(fetchPortalRequirementById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Profile
      .addCase(fetchPortalProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updatePortalProfile.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updatePortalProfile.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.profile = action.payload;
      })
      .addCase(updatePortalProfile.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearActiveProject, clearActiveRequirement, clearError } = portalSlice.actions;

// Selectors
export const selectPortalMetrics = (state) => state.portal.metrics;
export const selectPortalRecentProjects = (state) => state.portal.recentProjects;
export const selectPortalRecentActivities = (state) => state.portal.recentActivities;
export const selectPortalProjects = (state) => state.portal.projects;
export const selectPortalProjectsTotal = (state) => state.portal.projectsTotal;
export const selectPortalActiveProject = (state) => state.portal.activeProject;
export const selectPortalRequirements = (state) => state.portal.requirements;
export const selectPortalRequirementsTotal = (state) => state.portal.requirementsTotal;
export const selectPortalActiveRequirement = (state) => state.portal.activeRequirement;
export const selectPortalProfile = (state) => state.portal.profile;
export const selectPortalLoading = (state) => state.portal.loading;
export const selectPortalActionLoading = (state) => state.portal.actionLoading;
export const selectPortalError = (state) => state.portal.error;

export default portalSlice.reducer;
