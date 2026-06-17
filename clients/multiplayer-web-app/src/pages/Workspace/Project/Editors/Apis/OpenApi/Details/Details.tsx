import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

import Requests from "./Requests";
import Endpoint from "../../../../../../../shared/components/Endpoint";
import Responses from "./Responses";
import Description from "./Description";

import { useOpenApi } from "shared/providers/OpenApiContext";
import EntityEmptyView from "shared/components/EntityEmptyView";
import Summary from "./Summary";
import SchemaTree from "../SchemaTree";
import { useAlertDialog } from "shared/providers/AlertDialogContext";

const Details = ({ isSplitView }) => {
  const containerRef = useRef<HTMLDivElement>();
  const { endpoint, schema } = useOpenApi();

  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, [endpoint?.path, endpoint?.method, schema?.name]);

  return (
    <Flex
      py="6"
      px={isSplitView ? 4 : 8}
      gap="8"
      flex="1"
      minH="0"
      overflow="auto"
      direction="column"
      ref={containerRef}
    >
      {endpoint ? (
        <MethodDetails endpoint={endpoint} />
      ) : schema ? (
        <SchemaDetails schema={schema} />
      ) : (
        <Flex flex="1">
          <EntityEmptyView
            title="Select an API method or create new one"
            description="Please select a method from the list to view detailed information, parameters, and examples. "
          />
        </Flex>
      )}
    </Flex>
  );
};

const SchemaDetails = ({ schema }) => {
  const { name, path, data } = schema;
  return (
    <>
      <Heading size="md">{name}</Heading>
      <Box>
        <SchemaTree schema={data} path={path} />
      </Box>
    </>
  );
};

const MethodDetails = ({ endpoint }) => {
  const { path, method, data } = endpoint;
  const { onMethodChange, deleteEndpoint } = useOpenApi();
  const { openAlertDialog } = useAlertDialog();

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Delete method",
    });

    if (result) {
      deleteEndpoint(path, method);
    }
  };

  return (
    <>
      <Endpoint path={path} method={method} />
      <Summary value={data.summary} />
      <Description
        value={data.description}
        onChange={(description) => onMethodChange({ description })}
      />
      <Requests data={data} key={path + "#Requests"} readonly={true} />
      <Responses
        data={data.responses}
        key={path + "#Responses"}
        readonly={true}
      />
      <Flex justifyContent="flex-end">
        <Button
          variant="danger"
          cursor="pointer"
          onClick={openConfirmationDialog}
        >
          Delete
        </Button>
      </Flex>
    </>
  );
};

export default Details;
