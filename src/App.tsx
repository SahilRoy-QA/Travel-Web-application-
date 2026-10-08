import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAUpdateToast } from './components/common/PWAUpdateToast';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ensureInitialSettings } from './services/dbInit';

// Public Customer Pages
import { HomePage } from './pages/HomePage';
import { HotelListingPage } from './pages/HotelListingPage';
import { HotelDetailPage } from './pages/HotelDetailPage';
import { PackageListingPage } from './pages/PackageListingPage';
import { PackageDetailPage } from './pages/PackageDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { CabBookingPage } from './pages/CabBookingPage';
import { CabLiveTripPage } from './pages/CabLiveTripPage';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { OfflineFallbackPage } from './pages/OfflineFallbackPage';
import { ThemePreviewPage } from './pages/dev/ThemePreviewPage';
import { BrandPreviewPage } from './pages/dev/BrandPreviewPage';

// Admin Panel Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSiteBuilder } from './pages/admin/AdminSiteBuilder';
import { AdminCarouselEditor } from './pages/admin/AdminCarouselEditor';
import { AdminHotels } from './pages/admin/AdminHotels';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminAgents } from './pages/admin/AdminAgents';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminOffers } from './pages/admin/AdminOffers';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminSettings } from './pages/admin/AdminSettings';

// Public Layout Wrapper with Header & Footer
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen w-full">
    <Header />
    <main className="flex-1 w-full">{children}</main>
    <Footer />
  </div>
);

export default function App() {
  useEffect(() => {
    // Initial bootstrap check for platform settings
    ensureInitialSettings();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <BrowserRouter>
            <ScrollToTop />
            <OfflineIndicator />
            <PWAUpdateToast />

            <Routes>
              {/* Public Customer App Routes */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/hotels" element={<PublicLayout><HotelListingPage /></PublicLayout>} />
              <Route path="/hotels/:id" element={<PublicLayout><HotelDetailPage /></PublicLayout>} />
              <Route path="/packages" element={<PublicLayout><PackageListingPage /></PublicLayout>} />
              <Route path="/packages/:id" element={<PublicLayout><PackageDetailPage /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
              <Route path="/cabs" element={<PublicLayout><CabBookingPage /></PublicLayout>} />
              <Route path="/cabs/trip/:id" element={<PublicLayout><CabLiveTripPage /></PublicLayout>} />
              <Route path="/book" element={<PublicLayout><BookingFlowPage /></PublicLayout>} />
              <Route path="/trips" element={<PublicLayout><MyTripsPage /></PublicLayout>} />
              <Route path="/wishlist" element={<PublicLayout><WishlistPage /></PublicLayout>} />
              <Route path="/profile" element={<PublicLayout><ProfilePage /></PublicLayout>} />
              <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
              <Route path="/offline" element={<OfflineFallbackPage />} />
              <Route path="/dev/theme-preview" element={<ThemePreviewPage />} />
              <Route path="/dev/brand" element={<BrandPreviewPage />} />

              {/* Secure Admin Panel Routes (/admin) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="site-builder" element={<AdminSiteBuilder />} />
                <Route path="carousel" element={<AdminCarouselEditor />} />
                <Route path="hotels" element={<AdminHotels />} />
                <Route path="packages" element={<AdminPackages />} />
                <Route path="agents" element={<AdminAgents />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<PublicLayout><HomePage /></PublicLayout>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  </ErrorBoundary>
  );
}
