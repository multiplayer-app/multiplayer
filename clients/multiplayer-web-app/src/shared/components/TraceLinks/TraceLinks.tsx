import { useContext, useMemo } from "react";
import { Button, Flex, FlexProps, Icon } from "@chakra-ui/react";
import { buildTraceLinks, getTraceLinkTarget } from "@multiplayer/util-shared";

import { ExternalLinkIcon } from "shared/icons";
import { ProjectContext } from "shared/providers/ProjectContext";

interface TraceLinksProps extends FlexProps {
  // A span as the platform stores it
  span?: {
    TraceId?: string;
    SpanId?: string;
    ServiceName?: string;
    Timestamp?: string | number | Date;
    ResourceAttributes?: Record<string, any>;
  };
}

// Opens the span's trace in the project's own tools (project settings, trace links)
const TraceLinks = ({ span, ...rest }: TraceLinksProps) => {
  // Read without useProject(): span views are also rendered outside a project
  const project = useContext(ProjectContext)?.project;

  const links = useMemo(
    () =>
      buildTraceLinks(
        project?.settings?.traceLinks,
        getTraceLinkTarget(span)
      ),
    [project?.settings?.traceLinks, span]
  );

  if (!links.length) return null;

  return (
    <Flex gap="2" flexWrap="wrap" {...rest}>
      {links.map(({ name, url }, index) => (
        <Button
          key={`${name}-${index}`}
          as="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          size="xs"
          variant="outline"
          rightIcon={<Icon as={ExternalLinkIcon} boxSize="3" />}
        >
          {name}
        </Button>
      ))}
    </Flex>
  );
};

export default TraceLinks;
