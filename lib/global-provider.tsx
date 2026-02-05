import { Children, createContext, ReactNode, useContext } from "react";
import { useAppwrite } from "./useAppwrite";
import { getCurrentUser } from "./appwite";

interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
}

interface GlobalContexType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  refetch: (newParm?: Record<string, string | number>) => Promise<void>;
}

const GlobalContext = createContext<GlobalContexType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: user,
    loading,
    refetch,
  } = useAppwrite({
    fn: getCurrentUser,
  });

  const isLoggedIn = !!user;
  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        user: user as User | null,
        loading,
        refetch: (newParm?: Record<string, string | number>) =>
          refetch(newParm || {}),
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const userGlobalContext = (): GlobalContexType => {
  const context = useContext(GlobalContext);

  if (!context) {
    throw new Error("userGlobalContext must be used within a GlobalProvider");
  }

  return context;
};

export default GlobalProvider;
