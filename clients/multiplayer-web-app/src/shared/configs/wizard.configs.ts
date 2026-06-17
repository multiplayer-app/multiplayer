import {
  DebuggerWizardStepsEnum,
  ClientSetupMethod,
  BackendSetupStep,
  ProvidersEnum,
  WizzardLanguagesEnum,
  IDEType,
} from "shared/models/enums";

export const WIZARD_STEPS = [
  {
    value: DebuggerWizardStepsEnum.ClientSetupStep,
    title: "Client setup",
    subtitle: "Configure frontend recording",
  },
  {
    value: DebuggerWizardStepsEnum.BackendStep,
    title: "Backend setup",
    subtitle: "Add traces, logs and content",
  },
  {
    value: DebuggerWizardStepsEnum.SetupMCP,
    title: "MCP setup",
    subtitle: "Connect to your IDE",
  },
];

export const CLIENT_SETUP_METHODS = [
  {
    headerText: "JavaScript Client Library",
    label: "Recommended",
    value: ClientSetupMethod.ClientLibrary,
    isDisabled: false,
    description:
      "Framework-agnostic library with optional widget, for all types of web apps.",
    iconName: "JsLibrary",
  },
  {
    headerText: "Chrome browser extension",
    value: ClientSetupMethod.ChromeExtension,
    isDisabled: false,
    description:
      "Record full stack session recording through our browser extension.",
    iconName: "ChromeExtension",
  },
];

export const MOBILE_SETUP_METHODS = [
  {
    headerText: "React Native Client Library",
    value: ClientSetupMethod.Mobile,
    isDisabled: false,
    description: "A library designed for React Native applications",
    iconName: "CLIAppsIcon",
  },
];

export const BACKEND_SETUP_STEPS = [
  {
    title: "Route traces and logs to Multiplayer",
    description:
      "Choose between using the Multiplayer exporter or the OpenTelemetry Collector",
    value: BackendSetupStep.RootTraces,
  },
  {
    title: "Capture request/response and header content",
    description:
      "Choose between using Content-Capture Libraries or the Multiplayer Proxy",
    value: BackendSetupStep.CaptureRequestResponse,
  },
];

export const PROVIDER_METHODS = [
  {
    title: "OpenTelemetry",
    description: "Run collector; add collector config",
    iconName: "OpenTelemetry",
    diagramName: "OpenTelemetryDiagram",
    value: ProvidersEnum.OpenTelemetry,
  },
  {
    title: "Datadog",
    description: "add otel config to agents",
    iconName: "Datadog",
    diagramName: "DatadogDiagram",
    value: ProvidersEnum.Datadog,
  },
  {
    title: "Other Provider",
    description: "add otel config to agents",
    iconName: "OtherProvider",
    diagramName: "OtherProviderDiagram",
    value: ProvidersEnum.OtherProvider,
  },
  {
    title: "New Relic",
    description: "add otel config to agents",
    iconName: "NewRelic",
    diagramName: "NewRelicDiagram",
    value: ProvidersEnum.NewRelic,
  },
];

export const SUPPORTED_LANGUAGES = [
  { label: WizzardLanguagesEnum.NodeJs, value: WizzardLanguagesEnum.NodeJs },
  { label: WizzardLanguagesEnum.Go, value: WizzardLanguagesEnum.Go },
  { label: WizzardLanguagesEnum.Python, value: WizzardLanguagesEnum.Python },
  { label: WizzardLanguagesEnum.Ruby, value: WizzardLanguagesEnum.Ruby },
  { label: WizzardLanguagesEnum.DotNet, value: WizzardLanguagesEnum.DotNet },
  { label: WizzardLanguagesEnum.Java, value: WizzardLanguagesEnum.Java },
  { label: WizzardLanguagesEnum.PHP, value: WizzardLanguagesEnum.PHP },
  { label: WizzardLanguagesEnum.Rust, value: WizzardLanguagesEnum.Rust },
  { label: WizzardLanguagesEnum.Swift, value: WizzardLanguagesEnum.Swift },
  { label: WizzardLanguagesEnum.Generic, value: WizzardLanguagesEnum.Generic },
];

export const MCP_TYPES = [
  {
    name: "Cursor",
    iconName: "Cursor",
    value: IDEType.Cursor,
  },
  {
    name: "Visual Studio Code",
    iconName: "VisualStudio",
    value: IDEType.VisualStudio,
  },
  {
    name: "Claude Code",
    iconName: "Claude",
    value: IDEType.Claude,
  },
  {
    name: "Zed",
    iconName: "Zed",
    value: IDEType.Zed,
  },
  {
    name: "Copilot",
    iconName: "Copilot",
    value: IDEType.Copilot,
  },
  {
    name: "Windsurf",
    iconName: "Windsurf",
    value: IDEType.Windsurf,
  },
  {
    name: "Manual",
    iconName: "Generic",
    value: IDEType.Generic,
  },
];

export const DebuggerWizardStepNamesMap = {
  [DebuggerWizardStepsEnum.WelcomeStep]: "Welcome Step",
  [DebuggerWizardStepsEnum.ClientSetupStep]: "Client Setup Step",
  [DebuggerWizardStepsEnum.BackendStep]: "Backend Step",
  [DebuggerWizardStepsEnum.SetupMCP]: "Setup MCP Step",
};
