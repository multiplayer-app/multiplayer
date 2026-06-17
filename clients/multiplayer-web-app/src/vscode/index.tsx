import "./api-config-proxy";

import { memo } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";

// Import multiplayer-web-app's theme
import theme from "./theme";

import { AuthProvider } from "shared/providers/AuthContext";
import { SocketProvider } from "shared/providers/SocketContext";
import { BillingProvider } from "shared/providers/BillingContext";
import { AnalyticsProvider } from "shared/providers/AnalyticsContext";
import { WorkspaceProvider } from "shared/providers/WorkspaceContext";
import { ConnectionProvider } from "shared/providers/ConnectionContext";
import { OnboardingProvider } from "shared/providers/OnboardingContext";
import { AlertDialogProvider } from "shared/providers/AlertDialogContext";
import { PermissionsProvider } from "shared/providers/PermissionsContext";
import { GeneralModalsProvider } from "shared/providers/GeneralModalsContext";
import ProjectProviders from "pages/Workspace/Project/ProjectProviders";

import reportWebVitals from "../reportWebVitals";

import { useVsCode, VsCodeProvider } from "./VsCodeContext";

import "../styles/index.scss";
import Debugger from "pages/Workspace/Project/Debugger";
import Issues from "pages/Workspace/Project/Issues";

const VsCodePage = () => {
  const { state } = useVsCode();
  return (
    <Router>{state.currentPage === "issue" ? <Issues /> : <Debugger />}</Router>
  );
};

const MemoizedVsCodePage = memo(VsCodePage);

// Render function that can be called multiple times
const renderApp = () => {
  const container = document.getElementById("root");
  if (container) {
    // Clear existing content
    container.innerHTML = "";

    const root = createRoot(container);
    root.render(
      <ChakraProvider theme={theme}>
        <VsCodeProvider>
          <SocketProvider>
            <ConnectionProvider>
              <AnalyticsProvider>
                <GeneralModalsProvider>
                  <AuthProvider>
                    <BillingProvider>
                      <OnboardingProvider>
                        <WorkspaceProvider>
                          <PermissionsProvider>
                            <AlertDialogProvider>
                              <ProjectProviders>
                                <MemoizedVsCodePage />
                              </ProjectProviders>
                            </AlertDialogProvider>
                          </PermissionsProvider>
                        </WorkspaceProvider>
                      </OnboardingProvider>
                    </BillingProvider>
                  </AuthProvider>
                </GeneralModalsProvider>
              </AnalyticsProvider>
            </ConnectionProvider>
          </SocketProvider>
        </VsCodeProvider>
      </ChakraProvider>
    );
  }
};

// Initial render
renderApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
