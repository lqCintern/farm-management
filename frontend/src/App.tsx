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
import FieldPage from "./pages/Field";
import ConversationPage from "./pages/Conversation";
import FieldForm from "@/components/Field/FieldForm";
import SupplyMarketplace from "@/components/farmer/SupplyMarketplace";
import SupplierDashboard from "@/components/supplier/SupplierDashboard";
import SupplyListingList from "@/components/supplier/SupplyListingList";
import PineappleCropFormPage  from "@/pages/PineappleCrop/PineappleCropForm";
import PineappleCropDetailPage  from "@/pages/PineappleCrop/PineappleCropDetail";
import PineappleCropActivities  from "@/pages/PineappleCrop/PineappleCropActivities";

import SupplyListingsManagement from "@/components/supplier/SupplyListingsManagement";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={routes.index} element={<MainLayout />}>
      <Route index path={routes.index} element={<Home />} />
      <Route path={routes.home.index} element={<Home />} />
      <Route path={routes.shop.index} element={<Shop />} />
      <Route path={routes.login.index} element={<Login />} />
      <Route path={routes.register.index} element={<Register />} />
      <Route path={routes.forgotPassword.index} element={<ForgotPassword />} />
      <Route path={routes.resetPassword.index} element={<ResetPassword />} />
      <Route path={routes.products.index} element={<Products />} />
      <Route path={routes.cart.index} element={<CartPage />} />
      <Route path={routes.products.create} element={<CreateProductPage />} />
      <Route
        path={routes.farm_activities.index}
        element={<FarmActivityPage />}
      />
      <Route path={routes.calendar.index} element={<Calendar />} />
      <Route path={routes.fields.index} element={<FieldPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/products/:id/edit" element={<EditProductPage />} />
      <Route path="/chat" element={<ConversationPage />} />
      <Route path="/fields/new" element={<FieldForm />} />
      <Route path="/fields/:id/edit" element={<FieldForm />} />
      <Route path="/supply-marketplace" element={<SupplyMarketplace />} />
      <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
      <Route
        path="/supplier/listings-management"
        element={<SupplyListingsManagement />}
      />
      <Route path="/supplier/listings" element={<SupplyListingList />} />
      <Route path="/pineapple" element={<PineappleCropFormPage />} />
      <Route path="/pineapple/:id" element={<PineappleCropDetailPage />} />
      <Route path="/pineapple/:id/activities" element={<PineappleCropActivities />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
