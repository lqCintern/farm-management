import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store.ts";
import "./index.css";
import "./styles/blocCalendar.css";
import App from "./App.tsx";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
      <ToastContainer />
      <App />
    </Provider>
  );
