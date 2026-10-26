import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./Layout";
import Access from "./Access";
import Danger from "./Danger";
import ApiKeys from "./ApiKeys";
import OtelKeys from "./OtelKeys";
import General from "./General";
import Issues from "./Issues";
import TraceLinks from "./TraceLinks";

const Project = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<General />} />
        <Route path="access" element={<Access />} />
        <Route path="danger" element={<Danger />} />
        <Route path="issues" element={<Issues />} />
        <Route path="trace-links" element={<TraceLinks />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="otel-keys" element={<OtelKeys />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
};

export default Project;
