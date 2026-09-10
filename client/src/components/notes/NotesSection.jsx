import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotes,
  createNewNote,
  removeNote,
  selectNotes,
  selectNotesLoading,
  selectNotesActionLoading,
} from '../../features/notes/notesSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';

export const NotesSection = ({ entityType, entityId }) => {
  const dispatch = useDispatch();
  const notes = useSelector(selectNotes);
  const isLoading = useSelector(selectNotesLoading);
  const isActionLoading = useSelector(selectNotesActionLoading);
  const currentUser = useSelector(selectCurrentUser);

  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const filterKey = `${entityType}_id`;

  useEffect(() => {
    if (entityId) {
      dispatch(fetchNotes({ [filterKey]: entityId }));
    }
  }, [dispatch, entityId, filterKey]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter note content.');
      return;
    }
    setError('');
    const result = await dispatch(
      createNewNote({
        content: content.trim(),
        [filterKey]: entityId,
      })
    );
    if (!result.error) {
      setContent('');
    }
  };

  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      dispatch(removeNote(noteId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--brand-primary)' }}>
            notes
          </span>
          Notes ({notes.length})
        </h4>
      </div>

      {/* Add note box */}
      <form onSubmit={handleAddNote}>
        <div style={{ position: 'relative' }}>
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add an internal note or update..."
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              border: `1px solid ${error ? 'var(--status-danger)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {error && <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isActionLoading || !content.trim()}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              send
            </span>
            Add Note
          </button>
        </div>
      </form>

      {/* Notes list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          No notes recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
          {notes.map((note) => {
            const isAuthor = currentUser?.id === note.created_by_id;
            const canDelete = isAuthor || currentUser?.role === 'admin' || currentUser?.role === 'manager';

            return (
              <div
                key={note.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {note.creator?.name || note.creator?.email || 'System User'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {new Date(note.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Delete note"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {note.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
