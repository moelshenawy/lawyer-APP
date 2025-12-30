import { createContext, useContext, useRef, useCallback } from "react";

const LocaleChangeContext = createContext();

export const useLocaleChange = () => {
  const context = useContext(LocaleChangeContext);
  if (!context) {
    throw new Error("useLocaleChange must be used within a LocaleChangeProvider");
  }
  return context;
};

export const LocaleChangeProvider = ({ children }) => {
  const refetchFunctions = useRef(new Set());

  const registerRefetch = useCallback((refetchFn) => {
    refetchFunctions.current.add(refetchFn);
    return () => {
      refetchFunctions.current.delete(refetchFn);
    };
  }, []);

  const triggerRefetchAll = useCallback(() => {
    refetchFunctions.current.forEach((refetchFn) => {
      try {
        refetchFn();
      } catch (error) {
        console.warn("Failed to trigger refetch:", error);
      }
    });
  }, []);

  const value = {
    registerRefetch,
    triggerRefetchAll,
  };

  return <LocaleChangeContext.Provider value={value}>{children}</LocaleChangeContext.Provider>;
};
