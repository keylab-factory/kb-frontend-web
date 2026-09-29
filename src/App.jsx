import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Builder from './pages/Builder.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import Market from './pages/Market.jsx';
import LayoutGuide from './pages/LayoutGuide.jsx';
import NotFound from './pages/NotFound.jsx';
import Account from './pages/Account.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  // Cuerpo con llaves: en navegadores recientes scrollTo() devuelve una Promise,
  // y un efecto que devuelve algo distinto de una función hace fallar a React.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/armar" element={<Builder />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:id" element={<OrderConfirmation />} />
          <Route path="/comparador" element={<Market />} />
          <Route path="/layouts" element={<LayoutGuide />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
