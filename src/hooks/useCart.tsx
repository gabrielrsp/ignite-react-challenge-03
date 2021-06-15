import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => Promise<void>;
  decrementProduct: ({ productId, amount }: UpdateProductAmount) => void;

}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updatedCart.push(newProduct)
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const cartCopy = [...cart]

      const productFound = cartCopy.find(product => product.id === productId)

      if (productFound) {

        const cartFiltered = cartCopy.filter(product => product.id !== productId)

        setCart(cartFiltered)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartFiltered))
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const decrementProduct = (productInfo: UpdateProductAmount) => {
    try {

      const updatedCart = [...cart]

      const productFound = updatedCart.find(product => product.id === productInfo.productId)

      const currentAmount = productFound?.amount


      if (currentAmount && currentAmount > 1) {

        if (productFound && currentAmount) {

          const indexProductFound = cart.indexOf(productFound)

          updatedCart[indexProductFound] = { ...productFound, amount: currentAmount - 1 }
        }

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };


  const updateProductAmount = async (productInfo: UpdateProductAmount) => {
    try {

      const updatedCart = [...cart]

      const productFound = updatedCart.find(product => product.id === productInfo.productId)

      const currentAmount = productFound?.amount  //qtd atual

      //INCREMENT
      if (productFound && currentAmount && productInfo.amount > currentAmount) {

        const stock = await api.get(`/stock/${productInfo.productId}`);

        const stockAmount = stock.data.amount;

        if (stockAmount >= productInfo.amount) {
          const indexProductFound = cart.indexOf(productFound)

          updatedCart[indexProductFound] = { ...productFound, amount: productInfo.amount }

          setCart(updatedCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

        } else{
          toast.error('Quantidade solicitada fora de estoque');
        }

      }

      //DECREMENT
      else if (productFound && currentAmount && productInfo.amount > 0) {

        const indexProductFound = cart.indexOf(productFound)

        updatedCart[indexProductFound] = { ...productFound, amount: productInfo.amount }

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }
      else {
        toast.error('Erro na alteração de quantidade do produto');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };


  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, decrementProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
