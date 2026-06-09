import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { MerchantLayout } from '../layouts/MerchantLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthGuard } from '../features/auth/AuthGuard';
import { LoginPage } from '../features/auth/LoginPage';

// Lazy-loaded pages
const CustomerHome = React.lazy(() => import('../features/customer/home/HomePage'));
const CustomerSearch = React.lazy(() => import('../features/customer/search/SearchPage'));
const RestaurantDetail = React.lazy(() => import('../features/customer/restaurant/RestaurantDetailPage'));
const CustomerCheckout = React.lazy(() => import('../features/customer/checkout/CheckoutPage'));
const OrderTracking = React.lazy(() => import('../features/customer/order/OrderTrackingPage'));
const OrderHistory = React.lazy(() => import('../features/customer/order/OrderHistoryPage'));
const CustomerProfile = React.lazy(() => import('../features/customer/profile/ProfilePage'));
const CustomerVouchers = React.lazy(() => import('../features/customer/voucher/VoucherListPage'));
const CustomerFavorites = React.lazy(() => import('../features/customer/profile/FavoritesPage'));
const ReviewPage = React.lazy(() => import('../features/customer/review/ReviewPage'));

const MerchantDashboard = React.lazy(() => import('../features/merchant/reports/MerchantDashboard'));
const MerchantOrders = React.lazy(() => import('../features/merchant/orders/OrderInbox'));
const MerchantHandover = React.lazy(() => import('../features/merchant/handover/HandoverPage'));
const MenuManager = React.lazy(() => import('../features/merchant/menu/MenuManagerPage'));
const MerchantInventory = React.lazy(() => import('../features/merchant/inventory/InventoryPage'));
const MerchantPromotions = React.lazy(() => import('../features/merchant/promotions/PromotionPage'));
const MerchantReviews = React.lazy(() => import('../features/merchant/reviews/MerchantReviewsPage'));
const MerchantProfile = React.lazy(() => import('../features/merchant/profile/MerchantProfilePage'));
const MerchantRegister = React.lazy(() => import('../features/merchant/onboarding/RegisterPage'));

const AdminDashboard = React.lazy(() => import('../features/admin/analytics/BIDashboard'));
const AdminUsers = React.lazy(() => import('../features/admin/users/UserManagement'));
const AdminMerchants = React.lazy(() => import('../features/admin/merchants/MerchantManagement'));
const AdminDrivers = React.lazy(() => import('../features/admin/drivers/DriverManagement'));
const AdminPricing = React.lazy(() => import('../features/admin/pricing/PricingConfigPage'));
const AdminPromotions = React.lazy(() => import('../features/admin/promotions/PromotionManagement'));
const AdminOrders = React.lazy(() => import('../features/admin/orders/OrderMonitor'));
const AdminReviews = React.lazy(() => import('../features/admin/reviews/ReviewModeration'));


const AdminAudit = React.lazy(() => import('../features/admin/audit/AuditLogPage'));

const NotFound = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
    <h1 style={{ fontSize: 72, fontWeight: 700, color: 'var(--primary)', margin: 0 }}>404</h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Trang bạn tìm không tồn tại</p>
    <a href="/customer" style={{ color: 'var(--primary)', fontWeight: 500 }}>Về trang chủ</a>
  </div>
);

const Unauthorized = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
    <h1 style={{ fontSize: 48, fontWeight: 700, color: 'var(--danger)', margin: 0 }}>403</h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Bạn không có quyền truy cập trang này</p>
    <a href="/customer" style={{ color: 'var(--primary)', fontWeight: 500 }}>Về trang chủ</a>
  </div>
);

const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
    <Spin size="large" />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/customer" replace />} />

          {/* Auth pages */}
          <Route path="/customer/login" element={<LoginPage role="customer" />} />
          <Route path="/merchant/login" element={<LoginPage role="merchant" />} />
          <Route path="/admin/login" element={<LoginPage role="admin" />} />
          <Route path="/merchant/register" element={<React.Suspense fallback={<Loading />}><MerchantRegister /></React.Suspense>} />

          {/* Customer */}
          <Route path="/customer" element={<AuthGuard requiredRole="customer"><CustomerLayout /></AuthGuard>}>
            <Route index element={<CustomerHome />} />
            <Route path="search" element={<CustomerSearch />} />
            <Route path="restaurant/:id" element={<RestaurantDetail />} />
            <Route path="checkout" element={<CustomerCheckout />} />
            <Route path="order/:id" element={<OrderTracking />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="vouchers" element={<CustomerVouchers />} />
            <Route path="favorites" element={<CustomerFavorites />} />
            <Route path="review/:orderId" element={<ReviewPage />} />
          </Route>

          {/* Merchant */}
          <Route path="/merchant" element={<AuthGuard requiredRole="merchant"><MerchantLayout /></AuthGuard>}>
            <Route index element={<MerchantDashboard />} />
            <Route path="orders" element={<MerchantOrders />} />
            <Route path="handover" element={<MerchantHandover />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="inventory" element={<MerchantInventory />} />
            <Route path="promotions" element={<MerchantPromotions />} />
            <Route path="reviews" element={<MerchantReviews />} />
            <Route path="profile" element={<MerchantProfile />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AuthGuard requiredRole="admin"><AdminLayout /></AuthGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="merchants" element={<AdminMerchants />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="campaigns" element={<AdminPromotions />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviews />} />


            <Route path="audit" element={<AdminAudit />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};
