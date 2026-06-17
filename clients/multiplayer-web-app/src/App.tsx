import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "shared/providers/AuthContext";
import { config } from "./config";

import PageLoading from "shared/components/PageLoading";
import LazyContent, { lazyModule } from "shared/components/LazyContent";

import "./App.scss";

const Auth = lazyModule(() => import("pages/Auth"));
const Workspace = lazyModule(() => import("pages/Workspace"));

// Dev modules
const IconsList = lazyModule(() => import("pages/IconsList"));

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoading />;
  }
  return (
    <Routes>
      {!config.REACT_APP_IS_PRODUCTION && (
        <>
          <Route
            path="/icons"
            element={<LazyContent element={<IconsList />} />}
          />
        </>
      )}
      <Route path="/auth/*" element={<LazyContent element={<Auth />} />} />
      <Route path="/public/*" element={<VerifyRoute isPublic />} />
      <Route path="/*" element={<VerifyRoute />} />
    </Routes>
  );
};

const VerifyRoute = ({ isPublic }: { isPublic?: boolean }) => {
  const location = useLocation();
  const { authorized } = useAuth();

  if (!authorized && !isPublic) {
    return <Navigate to={`/auth${location.search}`} replace />;
  }

  return <LazyContent element={<Workspace />} />;
};

export default App;
