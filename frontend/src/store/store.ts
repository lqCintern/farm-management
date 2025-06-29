import { configureStore } from "@reduxjs/toolkit";
import { cartReducer } from "./slice/cartSlice";
import { authReducer } from "./slice/userSlice";
import conversationReducer from "./slices/conversationSlice";

const store = configureStore({
	reducer: { 
		cartReducer, 
		authReducer, 
		conversations: conversationReducer 
	},
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
