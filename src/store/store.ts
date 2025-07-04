import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "../api/authApi";
import authReducer from "../services/authSlice";
import { tripApi } from "../api/tripApi";
import { usersApi } from "../api/usersApi";
import { requestsApi } from "../api/requestsApi";
import { carsApi } from "../api/carsApi";
import { reportApi } from "../api/reportApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tripApi.reducerPath]: tripApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [requestsApi.reducerPath]: requestsApi.reducer,
    [carsApi.reducerPath]: carsApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(tripApi.middleware)
      .concat(usersApi.middleware)
      .concat(requestsApi.middleware)
      .concat(carsApi.middleware)
      .concat(reportApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
