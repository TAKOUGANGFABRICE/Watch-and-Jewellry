import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/navigation/Header/Header';
import Footer from '@/components/navigation/Footer/Footer';
import MobileNavDrawer from '@/components/navigation/MobileNavDrawer/MobileNavDrawer';
import CartDrawer from '@/components/navigation/CartDrawer/CartDrawer';
import SearchModal from '@/components/navigation/SearchModal/SearchModal';
import styles from './StorefrontLayout.module.css';

export default function StorefrontLayout() {
  return (
    <div className={styles.layout}>
      <Header />
      <MobileNavDrawer />
      <CartDrawer />
      <SearchModal />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
