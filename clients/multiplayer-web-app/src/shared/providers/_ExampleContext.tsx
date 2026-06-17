import { createContext, useContext } from "react";

interface IExampleContext {}

const ExampleContext = createContext<IExampleContext>(null);

export const ExampleProvider = ({ children }) => {
  return (
    <ExampleContext.Provider value={null}>{children}</ExampleContext.Provider>
  );
};

export function useExample() {
  const context = useContext(ExampleContext);
  if (context === null) {
    throw new Error("useExample must be used within ExampleProvider");
  }
  return context;
}
