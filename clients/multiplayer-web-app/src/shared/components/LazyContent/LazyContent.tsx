import React, { Suspense } from "react";
import PageLoading from "../PageLoading";
import ErrorBoundary, {
  captureError,
  isChunkLoadError,
} from "../ErrorBoundary";

const LazyContent = ({ fallback = <PageLoading />, element }) => (
  <Suspense fallback={fallback}>
    <ErrorBoundary>{element}</ErrorBoundary>
  </Suspense>
);

export function lazyModule<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    importFn().catch((error: any) => {
      const isChunkError = isChunkLoadError(error);
      if (isChunkError) {
        throw error;
      }
      captureError(error);
      throw error;
    })
  );
}

export default LazyContent;
