import {
  ATTR_MULTIPLAYER_HTTP_REQUEST_BODY,
  ATTR_MULTIPLAYER_HTTP_REQUEST_HEADERS,
  ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY,
  ATTR_MULTIPLAYER_HTTP_RESPONSE_HEADERS,
} from "@multiplayer-app/session-recorder-react";
import { DebugSessionNodeType, ITraceData } from "@multiplayer/types";

import {
  Tabs,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Box,
} from "@chakra-ui/react";
import { safelyParseJSON } from "shared/utils";
import { useState, useMemo, useEffect } from "react";

import NoDataPage from "../NoDataPage";
import RequestResponseData from "../RequestResponseData";
import LazyContent, { lazyModule } from "../LazyContent";
import SessionNoData from "assets/images/emptyStates/SystemCatalog-Sessions.png";

const JSONView = lazyModule(() => import("shared/components/JSONView"));

const attributesPropertyMap = {
  [DebugSessionNodeType.Log]: "LogAttributes",
  [DebugSessionNodeType.Trace]: "SpanAttributes",
  [DebugSessionNodeType.Event]: "SpanAttributes",
};

const eventsPrefix = "Events.";
interface TraceNodeDetailsProps {
  type: DebugSessionNodeType;
  meta: ITraceData;
}

const TraceNodeDetails = ({ type, meta }: TraceNodeDetailsProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const nodeAttributes = meta[attributesPropertyMap[type]];

  const parsedAttributes = useMemo(() => {
    const { SpanAttributes, ResourceAttributes } = meta || {};

    let events;

    const matchedEntries = Object.entries(meta || {}).filter(([key, _]) =>
      key.startsWith(eventsPrefix)
    );

    events = matchedEntries?.reduce((acc, [key, value]) => {
      const newKey = key.replace(eventsPrefix, "");
      acc[newKey] = value;
      return acc;
    }, {});

    if (!SpanAttributes) {
      return {
        resource: safelyParseJSON(ResourceAttributes),
        events,
      };
    }

    return {
      requestHeaders: safelyParseJSON(
        SpanAttributes[ATTR_MULTIPLAYER_HTTP_REQUEST_HEADERS]
      ),
      responseHeaders: safelyParseJSON(
        SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_HEADERS]
      ),
      requestPayload: safelyParseJSON(
        SpanAttributes[ATTR_MULTIPLAYER_HTTP_REQUEST_BODY]
      ),
      responseBody: safelyParseJSON(
        SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY]
      ),
      hostName: SpanAttributes["http.host"],
      resource: safelyParseJSON(ResourceAttributes),
      events,
    };
  }, [meta]);

  useEffect(() => {
    setTabIndex(0);
  }, [meta]);

  return (
    <Tabs
      isLazy
      flex="1"
      minH="0"
      as={Flex}
      display="flex"
      flexDirection="column"
      onChange={setTabIndex}
      index={tabIndex}
    >
      <Box overflowX="auto" className="hidden-scrollbar">
        <TabList>
          <Tab>All</Tab>
          {(parsedAttributes?.requestHeaders ||
            parsedAttributes?.requestPayload) && <Tab>Request</Tab>}
          {(parsedAttributes?.responseHeaders ||
            parsedAttributes?.responseBody) && <Tab>Response</Tab>}
          <Tab>Span</Tab>
          {parsedAttributes?.resource && <Tab>Resource</Tab>}
          {parsedAttributes?.events && <Tab>Events</Tab>}
        </TabList>
      </Box>
      <TabPanels flex="1" minH="0" overflow="auto">
        <TabPanel height="full" as={Flex} direction="column" px={0} pb={0}>
          <LazyContent
            element={<JSONView data={meta} searchable={true} expandDepth={1} />}
          />
        </TabPanel>
        {(parsedAttributes?.requestHeaders ||
          parsedAttributes?.requestPayload) && (
          <TabPanel height="full" as={Flex} direction="column" px={0} pb={0}>
            <RequestResponseData
              body={parsedAttributes.requestPayload}
              headers={parsedAttributes.requestHeaders}
            />
          </TabPanel>
        )}
        {(parsedAttributes?.responseHeaders ||
          parsedAttributes?.responseBody) && (
          <TabPanel height="full" as={Flex} direction="column" px={0} pb={0}>
            <RequestResponseData
              body={parsedAttributes.responseBody}
              headers={parsedAttributes.responseHeaders}
            />
          </TabPanel>
        )}
        <TabPanel height="full" as={Flex} direction="column" px={0} pb={0}>
          {nodeAttributes ? (
            <LazyContent
              element={<JSONView data={nodeAttributes} searchable={true} />}
            />
          ) : (
            <NoDataPage imageSrc={SessionNoData} />
          )}
        </TabPanel>
        {parsedAttributes?.resource && (
          <TabPanel height="full" as={Flex} direction="column" px={0} pb={0}>
            <LazyContent
              element={
                <JSONView data={parsedAttributes.resource} searchable={true} />
              }
            />
          </TabPanel>
        )}
        {parsedAttributes?.events && (
          <TabPanel height="full" as={Flex} direction="column" px={0} pb={0}>
            <LazyContent
              element={
                <JSONView data={parsedAttributes?.events} searchable={true} />
              }
            />
          </TabPanel>
        )}
      </TabPanels>
    </Tabs>
  );
};

export default TraceNodeDetails;
