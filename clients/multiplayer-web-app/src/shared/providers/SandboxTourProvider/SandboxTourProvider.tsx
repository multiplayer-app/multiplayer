import { ReactNode, useEffect, useMemo, useState } from "react";
import { TourProvider, useTour } from "@reactour/tour";
import { Button, Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import {
  SANDBOX_TOUR_LS_ARMED_KEY,
  SANDBOX_TOUR_LS_COMPLETED_KEY,
} from "./constants";
import { CloseIcon } from "shared/icons";

const selectors = {
  step0AgentSession: '[data-tour="mp-sandbox-agent-session"]',
  step1RecordingView: '[data-tour="mp-sandbox-recording-view"]',
  step2SidebarNav: '[data-tour="mp-sandbox-sidebar-nav"]',
  step3GetStarted: '[data-tour="mp-sandbox-get-started-free"]',
} as const;

const markCompleted = () => {
  try {
    localStorage.setItem(SANDBOX_TOUR_LS_COMPLETED_KEY, "1");
    localStorage.removeItem(SANDBOX_TOUR_LS_ARMED_KEY);
  } catch {
    // ignore
  }
};

const SandboxTourStep = ({ copy }: { copy: string }) => {
  return (
    <Flex direction="column" gap="3" maxW="360px">
      <Text fontSize="sm" color="subtle" whiteSpace="pre-wrap">
        {copy}
      </Text>
    </Flex>
  );
};

const SandboxTourController = () => {
  const { isSandbox } = useProjectSandbox();
  const { setIsOpen, setCurrentStep } = useTour();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const getStartStep = () => {
      if (document.querySelector(selectors.step0AgentSession)) return 0;
      return null;
    };

    const canStart = () => {
      if (!isSandbox) return false;

      let armed = false;
      let completed = false;
      try {
        armed = localStorage.getItem(SANDBOX_TOUR_LS_ARMED_KEY) === "1";
        completed = localStorage.getItem(SANDBOX_TOUR_LS_COMPLETED_KEY) === "1";
      } catch {
        // ignore
      }
      if (!armed || completed) return false;

      const step = getStartStep();
      if (step === null) return false;
      try {
        localStorage.removeItem(SANDBOX_TOUR_LS_ARMED_KEY);
      } catch {
        // ignore
      }
      setCurrentStep(step);
      setIsOpen(true);
      trackEvent(PostHogEvents.SANDBOX_TOUR_OPENED, { startStep: step });
      return true;
    };

    if (canStart()) return;

    let observer: MutationObserver | null = null;
    let timeoutId: number | null = null;

    const observeUntilStart = () => {
      if (observer) observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);

      if (canStart()) return;

      observer = new MutationObserver(() => {
        if (canStart()) {
          observer?.disconnect();
          observer = null;
          if (timeoutId) window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      timeoutId = window.setTimeout(() => {
        observer?.disconnect();
        observer = null;
      }, 15000);
    };

    const onArmed = () => observeUntilStart();
    window.addEventListener("mp:sandboxTour:armed", onArmed as EventListener);

    return () => {
      window.removeEventListener(
        "mp:sandboxTour:armed",
        onArmed as EventListener,
      );
      observer?.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isSandbox, setIsOpen, setCurrentStep, trackEvent]);

  return null;
};

const CloseHandler = () => {
  const { setIsOpen } = useTour();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const handleCloseEvent = () => {
      trackEvent(PostHogEvents.SANDBOX_TOUR_CLOSED, {});
      setIsOpen(false);
    };

    window.addEventListener("mp:sandboxTour:close", handleCloseEvent);
    return () => {
      window.removeEventListener("mp:sandboxTour:close", handleCloseEvent);
    };
  }, [setIsOpen, trackEvent]);

  return null;
};

export const SandboxTourProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { trackEvent } = useAnalytics();
  const [lastTrackedStep, setLastTrackedStep] = useState<number | null>(null);

  const maskOverlayColor = useColorModeValue(
    "rgba(0, 0, 0, 0.52)",
    "rgba(0, 0, 0, 0.72)",
  );
  const popoverShadow = useColorModeValue(
    "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)",
    "0 10px 15px -3px rgba(0, 0, 0, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.35)",
  );

  const tourStyles = useMemo(
    () => ({
      maskWrapper: (base: Record<string, unknown>) => ({
        ...base,
        color: maskOverlayColor,
      }),
      popover: (base: Record<string, unknown>) => ({
        ...base,
        borderRadius: 16,
        backgroundColor: "var(--chakra-colors-bg-surface)",
        color: "var(--chakra-colors-body)",
        borderWidth: "1px",
        borderStyle: "solid" as const,
        borderColor: "var(--chakra-colors-border-primary)",
        boxShadow: popoverShadow,
      }),
      controls: (base: Record<string, unknown>) => ({
        ...base,
        borderTopWidth: "1px",
        borderTopStyle: "solid" as const,
        borderTopColor: "var(--chakra-colors-border-primary)",
        backgroundColor: "var(--chakra-colors-bg-surface)",
      }),
      badge: (base: Record<string, unknown>) => ({
        ...base,
        backgroundColor: "var(--chakra-colors-brand-500)",
        color: "var(--chakra-colors-inverse)",
      }),
      close: (base: Record<string, unknown>) => ({
        ...base,
        color: "var(--chakra-colors-muted)",
      }),
    }),
    [maskOverlayColor, popoverShadow],
  );

  const steps = useMemo<any[]>(
    () => [
      {
        selector: selectors.step0AgentSession,
        position: "bottom",
        content: () => (
          <SandboxTourStep
            copy={
              "This is a resolved debugging agent session. Multiplayer runs in the background and catches issues as they happen. From there, the debugging agent handles everything: data gathering, triage, deduplication, coding agent prompting, PR creation, and user notification."
            }
          />
        ),
      },
      {
        selector: selectors.step1RecordingView,
        position: "left",
        content: () => (
          <SandboxTourStep
            copy={
              "For every bug the coding agent receives session-based, unsampled, full-stack runtime data. Frontend user actions are automatically correlated to backend traces, logs, and request/response content and headers from all components in your system."
            }
          />
        ),
      },
      {
        selector: selectors.step2SidebarNav,
        position: "right",
        content: () => (
          <SandboxTourStep
            copy={
              "Browse agent sessions, issues, and recordings. Multiplayer groups identical errors across sessions, scores them for fixability, and consolidates them into a targeted issue list."
            }
          />
        ),
      },
      {
        selector: selectors.step3GetStarted,
        position: (a, b) => {
          const providedTargetRect = a?.targetRect ?? a;
          const providedPopoverRect = a?.popoverRect ?? b;

          const targetEl = document.querySelector(
            selectors.step3GetStarted,
          ) as HTMLElement | null;
          const targetRect =
            providedTargetRect ?? targetEl?.getBoundingClientRect();
          const popoverRect = providedPopoverRect;

          if (!targetRect || !popoverRect) {
            return "bottom";
          }

          const offset = 10;
          const margin = 12;
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          let x = targetRect.left;
          x = Math.max(margin, Math.min(x, vw - popoverRect.width - margin));

          let y = targetRect.bottom + offset;
          y = Math.max(margin, Math.min(y, vh - popoverRect.height - margin));

          return [x, y];
        },
        content: () => (
          <SandboxTourStep
            copy={
              "Your coding agent is only as good as the data it uses. Give it what it needs. Get started today."
            }
          />
        ),
      },
    ],
    [],
  );

  const stepsLength = steps.length;
  const shouldShowCloseButton = currentStep === stepsLength - 1;

  useEffect(() => {
    if (currentStep !== lastTrackedStep) {
      trackEvent(PostHogEvents.SANDBOX_TOUR_STEP_VIEWED, {
        stepNumber: currentStep,
      });
      setLastTrackedStep(currentStep);

      if (currentStep === stepsLength - 1) {
        trackEvent(PostHogEvents.SANDBOX_TOUR_STEP_COMPLETED, {
          stepNumber: currentStep,
        });
      }
    }
  }, [currentStep, lastTrackedStep, stepsLength, trackEvent]);

  const NumberNavigation = ({ steps, currentStep, setCurrentStep }: any) => {
    return (
      <Flex w="full" align="center" justify="space-between" gap="2" py="1">
        <Button
          size="sm"
          isDisabled={currentStep <= 0}
          onClick={() => setCurrentStep((s: number) => Math.max(s - 1, 0))}
        >
          ←
        </Button>
        <Flex gap="1" flexWrap="wrap" justify="center" flex="1">
          {steps.map((_: any, idx: number) => (
            <Button
              key={idx}
              size="xs"
              minW="20px"
              px={0}
              variant={idx === currentStep ? "solid" : "ghost"}
              onClick={() => setCurrentStep(idx)}
            >
              {idx + 1}
            </Button>
          ))}
        </Flex>
        <Button
          size="sm"
          isDisabled={currentStep >= stepsLength - 1}
          onClick={() =>
            setCurrentStep((s: number) => Math.min(s + 1, stepsLength - 1))
          }
        >
          →
        </Button>
      </Flex>
    );
  };

  const handleClickClose = () => {
    if (currentStep < stepsLength - 1) {
      trackEvent(PostHogEvents.SANDBOX_TOUR_EXITED_EARLY, {
        stepNumber: currentStep,
        totalSteps: stepsLength,
      });
    }
    markCompleted();
    window.dispatchEvent(new CustomEvent("mp:sandboxTour:close"));
  };

  return (
    <TourProvider
      steps={steps}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      showCloseButton={shouldShowCloseButton}
      showDots={false}
      disableInteraction={false}
      onClickMask={() => {}}
      onClickClose={handleClickClose}
      components={{
        Navigation: NumberNavigation,
        Close: (props: any) => (
          <Button
            size="sm"
            p="2px"
            onClick={handleClickClose}
            position="absolute"
            top="10px"
            right="10px"
          >
            <Icon as={CloseIcon} />
          </Button>
        ),
      }}
      styles={tourStyles}
    >
      <CloseHandler />
      <SandboxTourController />
      {children}
    </TourProvider>
  );
};
