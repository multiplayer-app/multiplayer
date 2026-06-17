import { Image } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";

import EmptyScreen from "shared/components/EmptyScreen";
import PageLoading from "shared/components/PageLoading";
import DebounceSearch from "shared/components/DebounceSearch";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import EmptyEnvironments from "assets/images/emptyStates/environments-empty-list.png";

import { useFlows } from "shared/providers/FlowsContext";

import FlowItem from "./FlowItem";

interface FlowsProps {}

const Flows = (props: FlowsProps) => {
  const [loading, setLoading] = useState(false);
  const { workspaceId, projectId, path: flowId } = useParams();
  const [params, setParams] = useState({ skip: 0, limit: 50 });
  const { flows, getData } = useFlows();

  const getFlows = useCallback(async () => {
    try {
      setLoading(true);
      await getData(params);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [workspaceId, projectId, params]);

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > flows.cursor.total) {
      return;
    }
    setParams((prevParams) => ({
      ...prevParams,
      skip: prevParams.skip + prevParams.limit,
    }));
  };

  const setQuery = (query: string) => {
    setParams((prevParams) => ({
      ...prevParams,
      skip: 0,
      name: query || null,
    }));
  };

  useEffect(() => {
    getFlows();
  }, [getFlows]);

  return (
    <>
      <DebounceSearch onSearch={setQuery} inputGroupProps={{ mb: 0 }} />
      {!flows.data.length ? (
        loading ? (
          <PageLoading />
        ) : (
          <EmptyScreen
            title="You don't have a flow yet!"
            description="All flows will appear here."
            icon={<Image mb="2" w="180px" src={EmptyEnvironments} />}
          />
        )
      ) : (
        <InfiniteScrollBox
          pl="4"
          mt="3"
          mx="-4"
          mb="-4"
          flex="1"
          pr="3.5"
          isLoading={loading}
          onScrollEnd={handleScrollEnd}
        >
          {flows.data.map((flow) => (
            <FlowItem
              data={flow}
              key={flow._id}
              isActive={flowId === flow.id}
            />
          ))}
        </InfiniteScrollBox>
      )}
    </>
  );
};
export default Flows;
