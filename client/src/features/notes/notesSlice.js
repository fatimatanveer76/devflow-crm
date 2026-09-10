import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notesApi from '../../api/notesApi';

export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notesApi.listNotes(params);
      return response.data.notes;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch notes.');
    }
  }
);

export const createNewNote = createAsyncThunk(
  'notes/createNewNote',
  async (data, { rejectWithValue }) => {
    try {
      const response = await notesApi.createNote(data);
      return response.data.note;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add note.');
    }
  }
);

export const updateExistingNote = createAsyncThunk(
  'notes/updateExistingNote',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await notesApi.updateNote(id, data);
      return response.data.note;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update note.');
    }
  }
);

export const removeNote = createAsyncThunk(
  'notes/removeNote',
  async (id, { rejectWithValue }) => {
    try {
      await notesApi.deleteNote(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete note.');
    }
  }
);

const initialState = {
  notes: [],
  isLoading: false,
  isActionLoading: false,
  error: null,
  actionError: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearNotesError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createNewNote.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(createNewNote.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.notes.unshift(action.payload);
      })
      .addCase(createNewNote.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload;
      })
      .addCase(removeNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter((n) => n.id !== action.payload);
      });
  },
});

export const { clearNotesError } = notesSlice.actions;

export const selectNotes = (state) => state.notes.notes;
export const selectNotesLoading = (state) => state.notes.isLoading;
export const selectNotesActionLoading = (state) => state.notes.isActionLoading;
export const selectNotesError = (state) => state.notes.error;

export default notesSlice.reducer;
