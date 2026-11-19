import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'farel_cart_items';
const FREE_SHIPPING_THRESHOLD = 150000; // 150,000 FCFA

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart items to localStorage', e);
    }
  }, [items]);

  const addItem = (product, variant = null, quantity = 1) => {
    const variantId = variant?.id || product.default_variant_id || product.id;
    const price = variant?.price || variant?.price_override || product.base_price || 0;
    const title = variant?.title || product.name;
    const image = variant?.image || product.primary_image || (product.images?.[0]?.image) || null;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.variantId === variantId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [
        ...prevItems,
        {
          variantId,
          productId: product.id,
          productName: product.name,
          brand: product.brand || 'FARÉL Atelier',
          title,
          price: Number(price),
          quantity,
          image,
          department: product.department_type,
        },
      ];
    });
  };

  const updateQuantity = (variantId, quantity) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (variantId) => {
    setItems((prevItems) => prevItems.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isFreeShipping,
        remainingForFreeShipping,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

