import { Box } from "@chakra-ui/react";
import { useRef, useEffect } from "react";

const NextPageTrigger = ({ onIntersect }) => {
  const lastY = useRef(0);
  const scrollParent = useRef<HTMLElement>();
  const triggerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentY = scrollParent.current?.scrollTop || 0;
          if (currentY > lastY.current) {
            onIntersect();
          }
          lastY.current = currentY;
        }
      });
    });
    observer.observe(triggerRef.current);
    scrollParent.current = getScrollParent(triggerRef.current);

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current);
      }
    };
  }, [onIntersect]);

  return <Box ref={triggerRef} h="1px"></Box>;
};

function getScrollParent(node) {
  if (node == null) {
    return null;
  }
  if (node.scrollHeight > node.clientHeight) {
    return node;
  } else {
    return getScrollParent(node.parentNode);
  }
}

export default NextPageTrigger;
