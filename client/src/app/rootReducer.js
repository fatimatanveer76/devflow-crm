import { combineReducers } from '@reduxjs/toolkit';
import appReducer from '../features/app/appSlice';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice';

const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  users: usersReducer,
});

export default rootReducer;
