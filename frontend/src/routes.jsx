import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import StorefrontLayout from './layouts/StorefrontLayout/StorefrontLayout';
import AccountLayout from './layouts/AccountLayout/AccountLayout';
import AdminLayout from './layouts/AdminLayout/AdminLayout';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import EmptyState from './components/common/Loading/EmptyState';

// Storefront Pages
import HomePage from './pages/storefront/HomePage/HomePage';
import WatchesPage from './pages/storefront/WatchesPage/WatchesPage';
import JewelleryPage from './pages/storefront/JewelleryPage/JewelleryPage';
import ProductDetailPage from './pages/storefront/ProductDetailPage/ProductDetailPage';
import SearchPage from './pages/storefront/SearchPage/SearchPage';
import CartPage from './pages/storefront/CartPage/CartPage';
import CheckoutPage from './pages/storefront/CheckoutPage/CheckoutPage';
import OrderTrackingPage from './pages/storefront/OrderTrackingPage/OrderTrackingPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage/LoginPage';
import RegisterPage from './pages/auth/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage/ResetPasswordPage';

// Account Pages
import AccountProfilePage from './pages/account/AccountProfilePage/AccountProfilePage';
import AccountOrdersPage from './pages/account/AccountOrdersPage/AccountOrdersPage';
import OrderDetailsPage from './pages/account/OrderDetailsPage/OrderDetailsPage';
import AddressManagementPage from './pages/account/AddressManagementPage/AddressManagementPage';
import ChangePasswordPage from './pages/account/ChangePasswordPage/ChangePasswordPage';
import WishlistPage from './pages/account/WishlistPage/WishlistPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage/AdminOrdersPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Customer Storefront Routes */}
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="watches" element={<WatchesPage />} />
        <Route path="jewellery" element={<JewelleryPage />} />
        <Route path="new-arrivals" element={<SearchPage />} />
        <Route path="catalog" element={<SearchPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="track-order" element={<OrderTrackingPage />} />
        <Route path="track-order/:orderNumber" element={<OrderTrackingPage />} />
        <Route path="about" element={<HomePage />} />

        {/* Customer Auth Pages */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Protected Customer Account Section */}
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountProfilePage />} />
          <Route path="orders" element={<AccountOrdersPage />} />
          <Route path="orders/:orderNumber" element={<OrderDetailsPage />} />
          <Route path="addresses" element={<AddressManagementPage />} />
          <Route path="security" element={<ChangePasswordPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
      </Route>

      {/* 2. Separate Admin Dashboard Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="inventory" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="shipping" element={<AdminOrdersPage />} />
        <Route path="reviews" element={<AdminDashboardPage />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route
        path="*"
        element={
          <StorefrontLayout>
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <EmptyState
                title="Page Introuvable"
                description="La page que vous recherchez n'existe pas ou a été déplacée."
                actionText="Retour à l'Accueil"
                actionTo="/"
              />
            </div>
          </StorefrontLayout>
        }
      />
    </Routes>
  );
}
