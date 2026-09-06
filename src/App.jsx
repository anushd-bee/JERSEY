import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { StoreSettingsProvider } from './contexts/StoreSettingsContext';
import { PageLoader } from './components/Loading/Loading';

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Storefront pages — kept eager since they're the common path
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import Cart from './pages/Cart/Cart';

// Everything else is lazy-loaded so shoppers don't pay for admin/checkout code upfront
const Offer = lazy(() => import('./pages/Offer/Offer'));
const ProductDetails = lazy(() => import('./pages/ProductDetails/ProductDetails'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist/Wishlist'));
const Login = lazy(() => import('./pages/Login/Login'));
const Profile = lazy(() => import('./pages/Profile/Profile'));

// Admin — entirely lazy; regular shoppers never download any of this
const AdminLayout = lazy(() => import('./admin/Dashboard/Dashboard').then(m => ({ default: m.AdminLayout })));
const DashboardHome = lazy(() => import('./admin/Dashboard/Dashboard'));
const AdminProducts = lazy(() => import('./admin/Products/Products'));
const AdminOrders = lazy(() => import('./admin/Orders/Orders'));
const OrderDetail = lazy(() => import('./admin/Orders/OrderDetail'));
const AdminCategories = lazy(() => import('./admin/Categories/Categories'));
const AdminCustomers = lazy(() => import('./admin/Customers/Customers'));
const HomeCMS = lazy(() => import('./admin/HomeCMS/HomeCMS'));
const AdminSettings = lazy(() => import('./admin/Settings/Settings'));

/**
 * Redirects unauthenticated users to /login,
 * preserving the intended destination in `?redirect=` so the Login page
 * can bounce them back after a successful sign-in.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
}

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <StoreSettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Public Routes with Navbar/Footer */}
                <Route
                  path="/*"
                  element={
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/offer" element={<Offer />} />
                          <Route path="/product/:slug" element={<ProductDetails />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/login" element={<Login />} />

                          {/* Protected — requires authentication */}
                          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        </Routes>
                      </Suspense>
                    </MainLayout>
                  }
                />

                {/* Admin Routes — fully lazy-loaded */}
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminLayout />
                    </Suspense>
                  }
                >
                  <Route index element={<Suspense fallback={<PageLoader />}><DashboardHome /></Suspense>} />
                  <Route path="products" element={<Suspense fallback={<PageLoader />}><AdminProducts /></Suspense>} />
                  <Route path="orders" element={<Suspense fallback={<PageLoader />}><AdminOrders /></Suspense>} />
                  <Route path="orders/:orderId" element={<Suspense fallback={<PageLoader />}><OrderDetail /></Suspense>} />
                  <Route path="categories" element={<Suspense fallback={<PageLoader />}><AdminCategories /></Suspense>} />
                  <Route path="customers" element={<Suspense fallback={<PageLoader />}><AdminCustomers /></Suspense>} />
                  <Route path="home" element={<Suspense fallback={<PageLoader />}><HomeCMS /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
                </Route>
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </StoreSettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
