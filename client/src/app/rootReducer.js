import { combineReducers } from '@reduxjs/toolkit';
import appReducer from '../features/app/appSlice';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice';
import leadsReducer from '../features/leads/leadsSlice';
import dealsReducer from '../features/deals/dealsSlice';
import projectsReducer from '../features/projects/projectsSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import notesReducer from '../features/notes/notesSlice';
import activitiesReducer from '../features/activities/activitiesSlice';

const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  users: usersReducer,
  leads: leadsReducer,
  deals: dealsReducer,
  projects: projectsReducer,
  tasks: tasksReducer,
  notes: notesReducer,
  activities: activitiesReducer,
});

export default rootReducer;
