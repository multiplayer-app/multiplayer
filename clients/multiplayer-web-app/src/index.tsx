import SessionRecorder from "@multiplayer-app/session-recorder-react";

import { config } from "./config";
import { Suspense } from "react";
import posthog from "posthog-js";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";

// Providers
import { VsCodeProvider } from "vscode/VsCodeContext";
import { AuthProvider } from "shared/providers/AuthContext";
import { SocketProvider } from "shared/providers/SocketContext";
import { BillingProvider } from "shared/providers/BillingContext";
import { AnalyticsProvider } from "shared/providers/AnalyticsContext";
import { OnboardingProvider } from "shared/providers/OnboardingContext";
import { ConnectionProvider } from "shared/providers/ConnectionContext";
import { GeneralModalsProvider } from "shared/providers/GeneralModalsContext";

import App from "./App";
import theme from "./theme";
import ErrorHandler from "./ErrorHandler";
import reportWebVitals from "./reportWebVitals";
import "./styles/index.scss";
import { NavigationTracker } from "NavigationTracker";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

if (config.REACT_APP_SESSION_DEBUGGER_KEY) {
  SessionRecorder.init({
    version: config.REACT_APP_SERVICE_VERSION,
    application: "multiplayer-web-app",
    environment: config.REACT_APP_PLATFORM_ENV,
    apiKey: config.REACT_APP_SESSION_DEBUGGER_KEY,
    ...(config.REACT_APP_SESSION_DEBUGGER_API_BASE_URL
      ? {
          apiBaseUrl: config.REACT_APP_SESSION_DEBUGGER_API_BASE_URL,
        }
      : {}),
    ...(config.REACT_APP_SESSION_DEBUGGER_EXPORTER_ENDPOINT
      ? {
          exporterEndpoint:
            config.REACT_APP_SESSION_DEBUGGER_EXPORTER_ENDPOINT,
        }
      : {}),
    recordCanvas: true,
    showWidget: true,
    ignoreUrls: [
      /posthog\.com.*/,
      /https:\/\/bam\.nr-data\.net\/.*/,
      /https:\/\/cdn\.jsdelivr\.net\/.*/,
      /https:\/\/pixel\.source\.app\/.*/,
    ],
    propagateTraceHeaderCorsUrls: new RegExp(
      `${config.REACT_APP_API_BASE_URL}\.*`,
      "i"
    ),
    sampleTraceRatio: 0.3,
    schemifyDocSpanPayload: true,
    masking: { isContentMaskingEnabled: false },
    showContinuousRecording: false,
  });
}

if (config.REACT_APP_POSTHOG_KEY) {
  posthog.init(config.REACT_APP_POSTHOG_KEY, {
    api_host: "https://app.posthog.com",
  });
}

root.render(
  // <React.StrictMode>
  // Temporary fix for this issue: Invariant failed: Cannot find droppable entry with id [board]
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <VsCodeProvider>
          <SocketProvider>
            <ConnectionProvider>
              <AnalyticsProvider>
                <GeneralModalsProvider>
                  <AuthProvider>
                    <BillingProvider>
                      <OnboardingProvider>
                        <ErrorHandler />
                        <NavigationTracker />
                        <Suspense>
                          <App />
                        </Suspense>
                      </OnboardingProvider>
                    </BillingProvider>
                  </AuthProvider>
                </GeneralModalsProvider>
              </AnalyticsProvider>
            </ConnectionProvider>
          </SocketProvider>
        </VsCodeProvider>
      </ChakraProvider>
    </BrowserRouter>
  </>

  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
