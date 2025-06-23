import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: any | null;
  token: string | null;
  loggedIn: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loggedIn: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.loggedIn = !!action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.loggedIn = false;
    },
  },
});

export const { setUser, setToken, clearUser } = authSlice.actions;
export const authReducer = authSlice.reducer; 