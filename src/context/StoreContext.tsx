
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Store } from "../types";

interface StoreContextValue {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);

  const refreshStores = async () => {
    if (!window.api) return;
    const result = await window.api.stores.getAll();
    if (result.success && result.data) {
      setStores(result.data);
      if (!currentStore && result.data.length > 0) {
        setCurrentStore(result.data[0]);
      }
    }
  };

  useEffect(() => {
    refreshStores();
  }, []);

  return (
    <StoreContext.Provider value={{ stores, currentStore, setCurrentStore, refreshStores }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

