import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  const toggleCartDrawer = () => setIsCartDrawerOpen((prev) => !prev);
  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  const toggleSearch = () => setIsSearchOpen((prev) => !prev);
  const closeSearch = () => setIsSearchOpen(false);

  return (
    <UIContext.Provider
      value={{
        isMobileNavOpen,
        toggleMobileNav,
        closeMobileNav,
        isCartDrawerOpen,
        toggleCartDrawer,
        openCartDrawer,
        closeCartDrawer,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        toggleSearch,
        closeSearch,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

