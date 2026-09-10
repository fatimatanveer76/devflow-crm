import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectsApi from '../../api/projectsApi';

/**
 * Async Thunks
 */

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await projectsApi.listProjects(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch projects.');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectsApi.getProjectById(id);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch project details.');
    }
  }
);

export const createNewProject = createAsyncThunk(
  'projects/createNewProject',
  async (data, { rejectWithValue }) => {
    try {
      const response = await projectsApi.createProject(data);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create project.');
    }
  }
);

export const updateExistingProject = createAsyncThunk(
  'projects/updateExistingProject',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await projectsApi.updateProject(id, data);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update project.');
    }
  }
);

export const changeProjectStatus = createAsyncThunk(
  'projects/changeProjectStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await projectsApi.updateStatus(id, status);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update project status.');
    }
  }
);

export const assignProjectUser = createAsyncThunk(
  'projects/assignProjectUser',
  async ({ id, assigned_user_id }, { rejectWithValue }) => {
    try {
      const response = await projectsApi.assignProject(id, assigned_user_id);
      return response.data.project;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to assign project.');
    }
  }
);

export const removeProject = createAsyncThunk(
  'projects/removeProject',
  async (id, { rejectWithValue }) => {
    try {
      await projectsApi.deleteProject(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete project.');
    }
  }
);

/**
 * Slice
 */
const initialState = {
  projects: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  summary: {
    totalProjects: 0,
    totalBudget: 0,
    countByStatus: {},
    activeProjects: 0,
    completedProjects: 0,
  },
  selectedProject: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  actionError: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectsError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProjects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
        if (action.payload.summary) {
          state.summary = action.payload.summary;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchProjectById
    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createNewProject
    builder
      .addCase(createNewProject.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(createNewProject.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.projects.unshift(action.payload);
        state.total += 1;
        state.summary.totalProjects += 1;
        state.summary.totalBudget += parseFloat(action.payload.budget) || 0;
        if (action.payload.status === 'active') {
          state.summary.activeProjects += 1;
        }
      })
      .addCase(createNewProject.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // updateExistingProject
    builder
      .addCase(updateExistingProject.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(updateExistingProject.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.projects.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.projects[idx] = action.payload;
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateExistingProject.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // changeProjectStatus
    builder
      .addCase(changeProjectStatus.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(changeProjectStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.projects.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.projects[idx] = action.payload;
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(changeProjectStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // assignProjectUser
    builder
      .addCase(assignProjectUser.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(assignProjectUser.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const idx = state.projects.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.projects[idx] = action.payload;
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(assignProjectUser.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });

    // removeProject
    builder
      .addCase(removeProject.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(removeProject.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
      })
      .addCase(removeProject.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearProjectsError, clearSelectedProject } = projectsSlice.actions;

// Selectors
export const selectProjects = (state) => state.projects.projects;
export const selectProjectsTotal = (state) => state.projects.total;
export const selectProjectsPage = (state) => state.projects.page;
export const selectProjectsLimit = (state) => state.projects.limit;
export const selectProjectsTotalPages = (state) => state.projects.totalPages;
export const selectProjectsSummary = (state) => state.projects.summary;
export const selectSelectedProject = (state) => state.projects.selectedProject;
export const selectProjectsLoading = (state) => state.projects.isLoading;
export const selectProjectsActionLoading = (state) => state.projects.isActionLoading;
export const selectProjectsError = (state) => state.projects.error;
export const selectProjectsActionError = (state) => state.projects.actionError;

export default projectsSlice.reducer;
