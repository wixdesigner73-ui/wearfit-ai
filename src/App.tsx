import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Header from './components/Header'
import Toast from './components/Toast'
import { StoreProvider } from './context/StoreContext'
import About from './pages/About'
import Cart from './pages/Cart'
import Contact from './pages/Contact'
import FittingRoom from './pages/FittingRoom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ProductDetail from './pages/ProductDetail'
import Shop from './pages/Shop'
import Wishlist from './pages/Wishlist'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  // HashRouter keeps routes working on GitHub Pages (static hosting, no server rewrites).
  return (
    <HashRouter>
      <StoreProvider>
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/men" element={<Shop key="men" gender="men" />} />
            <Route path="/women" element={<Shop key="women" gender="women" />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/fitting-room" element={<FittingRoom />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
        <Toast />
      </StoreProvider>
    </HashRouter>
  )
}
