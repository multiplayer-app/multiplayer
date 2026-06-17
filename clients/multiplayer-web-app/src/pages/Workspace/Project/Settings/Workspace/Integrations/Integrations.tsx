import { Outlet, Route, Routes, useParams } from "react-router-dom";

import Integration from "./Integration";
import IntegrationsList from "./IntegrationsList";
import { IntegrationsProvider } from "shared/providers/IntegrationsContext";

const Integrations = () => {
  return (
    <Routes>
      <Route element={<IntegrationsLayout />}>
        <Route index element={<IntegrationsList />} />
        <Route path={`:type/:integrationId`} element={<Integration />} />
      </Route>
    </Routes>
  );
};

const IntegrationsLayout = () => {
  const { projectId } = useParams();
  if (!projectId) {
    return (
      <IntegrationsProvider>
        <Outlet />
      </IntegrationsProvider>
    );
  }
  return <Outlet />;
};

export default Integrations;
