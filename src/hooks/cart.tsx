import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        const newCart = products.map(item => ({
          ...item,
          quantity:
            item.id === productExists.id ? item.quantity + 1 : item.quantity,
        }));

        setProducts(newCart);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(newCart),
        );
      } else {
        const newCart = [...products, { ...product, quantity: 1 }];

        setProducts(newCart);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(newCart),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newCart = products.map(product => ({
        ...product,
        quantity: product.id === id ? product.quantity + 1 : product.quantity,
      }));

      setProducts(newCart);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(newCart),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productDecrement = products.find(product => product.id === id);

      if (productDecrement?.quantity === 1) {
        const newCart = products.filter(
          product => product.id !== productDecrement.id,
        );

        setProducts(newCart);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(newCart),
        );
      } else {
        const newCart = products.map(product => ({
          ...product,
          quantity: product.id === id ? product.quantity - 1 : product.quantity,
        }));

        setProducts(newCart);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(newCart),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
