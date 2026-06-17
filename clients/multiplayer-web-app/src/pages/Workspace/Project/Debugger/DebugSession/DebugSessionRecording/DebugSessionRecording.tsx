import { Flex, Image } from "@chakra-ui/react";
import DebugSessionPlayer from "./DebugSessionPlayer";
import PageLoading from "shared/components/PageLoading";
import EmptyScreen from "shared/components/EmptyScreen";
import { useDebugSession } from "../DebugSessionContext";
import { useDebugSessionLayout } from "../DebugSessionLayoutContext";
import SessionsIcon from "assets/images/emptyStates/SystemCatalog-Sessions.png";

interface DebugSessionRecordingProps {}

const DebugSessionRecording = ({}: DebugSessionRecordingProps) => {
  const { eventsLoading, events, metadata } = useDebugSession();
  const { playerWrapper } = useDebugSessionLayout();

  if (!eventsLoading && events.length === 0) {
    return null;
  }

  return (
    <Flex
      ref={playerWrapper}
      w="full"
      flex="1"
      border="solid 1px"
      borderRadius="lg"
      direction="column"
      position="relative"
      borderColor="border.primary"
    >
      {eventsLoading ? (
        <PageLoading />
      ) : events.length > 0 ? (
        <DebugSessionPlayer events={events} metadata={metadata?.data} />
      ) : (
        <EmptyScreen
          title="No session recording available"
          description="There are no recording data for this session"
          icon={<Image mb="2" w="180px" maxW="70%" src={SessionsIcon} />}
        />
      )}
    </Flex>
  );
};

export default DebugSessionRecording;
