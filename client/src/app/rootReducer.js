import { combineReducers } from '@reduxjs/toolkit';
import appReducer from '../features/app/appSlice';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice';
import leadsReducer from '../features/leads/leadsSlice';
import dealsReducer from '../features/deals/dealsSlice';

const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  users: usersReducer,
  leads: leadsReducer,
  deals: dealsReducer,
});

export default rootReducer;
