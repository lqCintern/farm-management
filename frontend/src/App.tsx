import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { routes } from "./constants";
import { Home } from "./pages/home";
import Shop from "./pages/shop";
import "./index.css";
import { Suspense, useState, useEffect } from "react";
import { Loader } from "./components/loader";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/login";
import ForgotPassword from "./pages/login/forgotPassword";
import ResetPassword from "./pages/login/resetPassword";
import Register from "./pages/register";
import Products from "./pages/products";
import ProductDetailPage from "./pages/products/[id]";
import CreateProductPage from "./pages/products/create";
import EditProductPage from "@/pages/products/edit";
import CartPage from "./pages/cart";
import FarmActivityPage from "./pages/farm_activities";
import Calendar from "./pages/Calendar";
import HarvestPage from "./pages/Harvest";
import ConversationPage from "./pages/Conversation";

const InitialLoader = ({ children }: any) => {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }
  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={routes.index} element={<MainLayout />}>
      <Route
        index
        path={routes.index}
        element={
          <Suspense fallback={<Loader />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path={routes.home.index}
        element={
          <Suspense fallback={<Loader />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path={routes.shop.index}
        element={
          <Suspense fallback={<Loader />}>
            <Shop />
          </Suspense>
        }
      />
      <Route
        path={routes.login.index}
        element={
          <Suspense fallback={<Loader />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path={routes.register.index}
        element={
          <Suspense fallback={<Loader />}>
            <Register />
          </Suspense>
        }
      />
      <Route
        path={routes.forgotPassword.index}
        element={
          <Suspense fallback={<Loader />}>
            <ForgotPassword />
          </Suspense>
        }
      />
      <Route
        path={routes.resetPassword.index}
        element={
          <Suspense fallback={<Loader />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path={routes.products.index}
        element={
          <Suspense fallback={<Loader />}>
            <Products />
          </Suspense>
        }
      />
      <Route
        path={routes.cart.index}
        element={
          <Suspense fallback={<Loader />}>
            <CartPage />
          </Suspense>
        }
      />
      <Route
        path={routes.products.create}
        element={
          <Suspense fallback={<Loader />}>
            <CreateProductPage />
          </Suspense>
        }
      />
      <Route
        path={routes.farm_activities.index}
        element={
          <Suspense fallback={<Loader />}>
            <FarmActivityPage />
          </Suspense>
        }
      />
      <Route
        path={routes.calendar.index}
        element={
          <Suspense fallback={<Loader />}>
            <Calendar />
          </Suspense>
        }
      />
      <Route
        path={routes.harvest.index}
        element={
          <Suspense fallback={<Loader />}>
            <HarvestPage />
          </Suspense>
        }
      />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/products/:id/edit" element={<EditProductPage />} />
      <Route path="/chat" element={<ConversationPage />} />
    </Route>
  )
);

function App() {
  return (
    <InitialLoader>
      <RouterProvider router={router} />
    </InitialLoader>
  );
}

export default App;
