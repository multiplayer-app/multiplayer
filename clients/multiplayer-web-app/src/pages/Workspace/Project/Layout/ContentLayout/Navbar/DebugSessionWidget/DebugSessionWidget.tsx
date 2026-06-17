import { Box } from "@chakra-ui/react";
import { memo, useRef, useEffect } from "react";
import SessionDebugger from "@multiplayer-app/session-recorder-react";
import NavbarNavItem from "../NavbarNavItem";
import { useMouseEvent } from "shared/hooks/useMouseEvent";

interface DebugSessionWidgetProps {
  isExpanded: boolean;
}

const DebugSessionWidget = memo(({ isExpanded }: DebugSessionWidgetProps) => {
  const { triggerMouseDownEvent, triggerMouseUpEvent } = useMouseEvent();
  const containerRef = useRef<HTMLDivElement>(null);
  const btn = SessionDebugger.sessionWidgetButtonElement;

  const onTriggerMouseDown = (e) => {
    e.preventDefault();
    triggerMouseDownEvent(btn);
  };

  const onTriggerMouseUp = (e) => {
    e.preventDefault();
    triggerMouseUpEvent(btn);
  };

  useEffect(() => {
    if (btn) {
      const isLeftSide = btn.classList.contains("button-leftside");
      if (!isLeftSide) {
        btn.classList.add("button-leftside");
      }
      btn.classList.add(`no-draggable`, !isExpanded && "no-tooltip");
      containerRef.current?.append(btn);

      return () => {
        btn.classList.remove("no-draggable", "no-tooltip");
        if (!isLeftSide) {
          btn.classList.remove("button-leftside");
        }
        const mpRoot = document.querySelector("mp-root");
        if (mpRoot) {
          const shadowRoot = mpRoot.shadowRoot;
          if (shadowRoot) {
            shadowRoot.append(btn);
          } else {
            mpRoot.append(btn);
          }
        } else {
          document.body.append(btn);
        }
      };
    }
  }, [isExpanded, btn]);

  return (
    <NavbarNavItem
      mb="1"
      label="Record a bug"
      isExpanded={isExpanded}
      icon={
        <Box
          ref={containerRef}
          className="mp-sidebar-session-button-wrapper rr-ignore"
          __css={{
            button: {
              color: "muted",
              padding: "2",
              backgroundColor: "bg.subtle",
              borderColor: "border.secondary",
            },
          }}
        />
      }
      _hover={{ textDecoration: "none" }}
      labelProps={{
        onMouseDown: onTriggerMouseDown,
        onMouseUp: onTriggerMouseUp,
        onClick: (e) => e.stopPropagation(),
      }}
    />
  );
});

export default DebugSessionWidget;
