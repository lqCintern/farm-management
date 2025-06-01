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
import PineappleActivityTemplates from "./pages/PineappleActivityTemplates";
import ActivityTemplateDetail from "./pages/PineappleActivityTemplates/ActivityTemplateDetail";
import PineappleCrops from "./pages/PineappleCrop";

import OrderList from './pages/Orders/OrderList';
import OrderDetail from './pages/Orders/OrderDetail';

// Import Labor components
import LaborRequestList from "./pages/Labor/LaborRequestList";
import LaborRequestCreate from "./pages/Labor/LaborRequestCreate";
import LaborRequestDetail from "./pages/Labor/LaborRequestDetail";
import PublicRequestsList from "./pages/Labor/PublicRequestsList";

import Dashboard from '@/pages/Labor/Dashboard';
import FarmActivityDetail from '@/pages/FarmActivity/FarmActivityDetail';

// Import Labor Exchange components
import ExchangeSummary from "./pages/Labor/Exchange/ExchangeSummary";
import ExchangeDetail from "./pages/Labor/Exchange/ExchangeDetail";
import TransactionHistory from "./pages/Labor/Exchange/TransactionHistory";

// Import Labor Assignment components
import WorkerAssignments from "./pages/Labor/Assignment/WorkerAssignments";
import FarmAssignments from "./pages/Labor/Assignment/FarmAssignments"; // Thêm import này
import LaborAssignment from "./pages/Labor/Assignment/LaborAssignment";
import CreateAssignment from "./pages/Labor/Assignment/CreateAssignment";
import AssignmentStats from "./pages/Labor/Assignment/AssignmentStats";

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
      <Route path="/pineapple" element={<PineappleCrops />} />
      <Route path="/pineapple/new" element={<PineappleCropFormPage />} />
      <Route path="/pineapple/:id" element={<PineappleCropDetailPage />} />
      <Route path="/pineapple/:id/activities" element={<PineappleCropActivities />} />
      <Route path="/activity-templates" element={<PineappleActivityTemplates />} />
      <Route path="/activity-templates/:id" element={<ActivityTemplateDetail />} />

      {/* Orders */}
      <Route path="orders">
        <Route index element={<OrderList />} />
        <Route path=":id" element={<OrderDetail />} />
      </Route>
      
      {/* Labor Management */}
      <Route path="labor">
        <Route index element={<Dashboard />} />
        <Route path="requests" element={<LaborRequestList />} />
        <Route path="requests/create" element={<LaborRequestCreate />} />
        <Route path="requests/:id" element={<LaborRequestDetail />} />
        <Route path="public-requests" element={<PublicRequestsList />} />
        
        {/* Labor Exchange Routes */}
        <Route path="exchanges" element={<ExchangeSummary />} />
        <Route path="exchanges/:householdId" element={<ExchangeDetail />} />
        <Route path="exchanges/:householdId/history" element={<TransactionHistory />} />
        
        {/* Labor Assignment Routes */}
        <Route path="assignments" element={<WorkerAssignments />} />
        <Route path="farm-assignments" element={<FarmAssignments />} /> {/* Thêm route này */}
        <Route path="requests/:requestId/assign" element={<LaborAssignment />} />
        <Route path="requests/:requestId/create-assignment" element={<CreateAssignment />} />
        <Route path="assignment-stats" element={<AssignmentStats />} />
      </Route>

      {/* Farm Activity Routes */}
      <Route path="farm-activities">
        <Route path=":id" element={<FarmActivityDetail />} />
        {/* Thêm các route khác nếu cần */}
      </Route>

      {/* Các route khác... */}
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
