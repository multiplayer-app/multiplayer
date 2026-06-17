import { Button, Flex, Image, Text } from "@chakra-ui/react";
import { Component, ErrorInfo, PropsWithChildren, ReactElement } from "react";
import EmptySources from "assets/images/emptyStates/sources-empty-list.png";
import { useSharedGeneralModals } from "shared/providers/GeneralModalsContext";
import { useLocation } from "react-router-dom";
import SessionRecorder from "@multiplayer-app/session-recorder-react";

interface ErrorBoundaryManagerProps extends PropsWithChildren {
  fallback: ReactElement;
  pathName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error;
  errorInfo: any;
}

class ErrorBoundaryManager extends Component<
  ErrorBoundaryManagerProps,
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.pathName !== this.props.pathName && prevState.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isChunkError = isChunkLoadError(error);

    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo,
    });

    if (isChunkError && scheduleChunkLoadReload()) {
      return;
    }

    captureError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface ErrorBoundaryProps extends PropsWithChildren {
  ctaElement?: ReactElement;
}

const ErrorBoundary = ({ children, ctaElement }: ErrorBoundaryProps) => {
  const location = useLocation();
  return (
    <ErrorBoundaryManager
      pathName={location.pathname}
      fallback={<ErrorFallback ctaElement={ctaElement} />}
    >
      {children}
    </ErrorBoundaryManager>
  );
};

const ErrorFallback = ({ ctaElement }: { ctaElement?: ReactElement }) => {
  const { openContactModal } = useSharedGeneralModals();
  return (
    <Flex
      w="full"
      h="full"
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Image w="180px" src={EmptySources} mb="4" />
      <Text fontWeight="semibold" fontSize="xl" my="4">
        Oops! Something went wrong.
      </Text>
      <Text textAlign="center" color="muted" fontSize="sm" maxW="500px" mb="8">
        An unexpected error occurred, sorry about that. If this keeps happening,
        we’d appreciate it if you can get in touch with us.
      </Text>
      <Flex gap="4">
        <Button variant="light" onClick={openContactModal}>
          Contact us
        </Button>
        {ctaElement}
      </Flex>
    </Flex>
  );
};

const CHUNK_LOAD_RELOAD_KEY = "__chunk_reload__";

const getErrorName = (error: unknown) =>
  error instanceof Error ? error.name : undefined;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
};

export const isChunkLoadError = (error: unknown) => {
  const errorName = getErrorName(error);
  const errorMessage = getErrorMessage(error);

  return (
    errorName === "ChunkLoadError" ||
    errorMessage.includes("ChunkLoadError") ||
    errorMessage.includes("Loading chunk")
  );
};

const scheduleChunkLoadReload = () => {
  if (sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY)) {
    return false;
  }

  sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, "true");
  setTimeout(() => {
    window.location.reload();
  }, 1000);

  return true;
};

export const captureError = (error: unknown, errorInfo?: ErrorInfo) => {
  try {
    SessionRecorder.captureException(error, errorInfo);
  } catch (_e) {
    // no-op
  }
};

export default ErrorBoundary;
