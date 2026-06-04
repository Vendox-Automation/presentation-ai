"use client";

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PyramidHeightContextValue = {
  maxShapeHeight: number | null;
  registerItemHeight: (itemKey: string, height: number) => void;
  unregisterItemHeight: (itemKey: string) => void;
};

const PyramidHeightContext = createContext<PyramidHeightContextValue>({
  maxShapeHeight: null,
  registerItemHeight: () => {},
  unregisterItemHeight: () => {},
});

export function PyramidHeightProvider({ children }: { children: ReactNode }) {
  const [itemHeights, setItemHeights] = useState<Map<string, number>>(
    () => new Map(),
  );

  const registerItemHeight = useCallback((itemKey: string, height: number) => {
    setItemHeights((currentHeights) => {
      if (currentHeights.get(itemKey) === height) return currentHeights;

      const nextHeights = new Map(currentHeights);
      nextHeights.set(itemKey, height);
      return nextHeights;
    });
  }, []);

  const unregisterItemHeight = useCallback((itemKey: string) => {
    setItemHeights((currentHeights) => {
      if (!currentHeights.has(itemKey)) return currentHeights;

      const nextHeights = new Map(currentHeights);
      nextHeights.delete(itemKey);
      return nextHeights;
    });
  }, []);

  const maxShapeHeight = useMemo(() => {
    if (itemHeights.size === 0) return null;
    return Math.max(...itemHeights.values());
  }, [itemHeights]);

  const value = useMemo(
    () => ({
      maxShapeHeight,
      registerItemHeight,
      unregisterItemHeight,
    }),
    [maxShapeHeight, registerItemHeight, unregisterItemHeight],
  );

  return (
    <PyramidHeightContext.Provider value={value}>
      {children}
    </PyramidHeightContext.Provider>
  );
}

export function usePyramidHeight() {
  return use(PyramidHeightContext);
}
