import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Icon,
  Flex,
  Text,
  Input,
  IconButton,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";

import { IIntegration } from "@multiplayer/types";
import { IListRes } from "shared/models/interfaces";
import LabelGroup from "shared/components/LabelGroup";
import PageLoading from "shared/components/PageLoading";
import WorkspaceUserName from "shared/components/WorkspaceUserName";
import { getIntegrations, getRepositories } from "shared/services/git.service";
import { integrationTypes } from "shared/configs/git.configs";
import { ArrowLeftIcon, SearchIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";

const FormFieldIntegration = ({ registerFn }) => {
  const [integration, setIntegration] = useState<IIntegration>(null);

  return (
    <Box position="relative" mx="-6" h="full" overflow="hidden">
      <Flex
        inset="0"
        position="absolute"
        flexDirection="column"
        transition="transform .3s"
        style={{ transform: `translateX(${!integration ? 0 : "-100%"})` }}
      >
        <LabelGroup mb="4" px="6" label="Select integration" />
        <Integrations setIntegration={setIntegration} registerFn={registerFn} />
      </Flex>
      <Flex
        inset="0"
        position="absolute"
        flexDirection="column"
        transition="transform .3s"
        style={{ transform: `translateX(${integration ? 0 : "100%"})` }}
      >
        <LabelGroup mb="2" px="6" label="Select repository">
          <IconButton
            size="sm"
            variant="base"
            aria-label="close"
            onClick={() => setIntegration(null)}
            icon={<Icon color="muted" as={ArrowLeftIcon} />}
          />
        </LabelGroup>
        <Repositories integration={integration} registerFn={registerFn} />
      </Flex>
    </Box>
  );
};

const Integrations = ({ setIntegration, registerFn }) => {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IListRes<IIntegration>>({
    data: [],
    cursor: { total: 0, skip: 0, limit: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      const res = await getIntegrations({ skip: null, limit: 100 });
      setLoading(false);
      setIntegrations(res);
    };
    fetchData();
  }, []);

  return (
    <Box flex="1" py="1px" px="6" minH="0" overflow="auto">
      {loading && (
        <Box py="20">
          <PageLoading />
        </Box>
      )}
      {integrations.data.map((item) => (
        <Box
          mb="2"
          as="label"
          display="block"
          cursor="pointer"
          onClick={() => setIntegration(item)}
          key={item._id}
          __css={{
            "input:checked + div": {
              borderColor: "brand.500",
              outline: "1px solid",
              outlineColor: "brand.500",
            },
          }}
        >
          <Input
            hidden
            type="radio"
            value={item._id}
            name="integration"
            {...registerFn("integration")}
          />
          <Flex
            px="4"
            py="2"
            gap="2"
            flex="1"
            bg="bg.surface"
            border="1px solid"
            borderRadius="base"
            alignItems="center"
            borderColor={"border.tertiary"}
          >
            <Icon
              boxSize="8"
              color="muted"
              as={integrationTypes[item.type].icon}
            />
            <Box flex="1" minW="0">
              <Text>{integrationTypes[item.type].label}</Text>
              <Text color="muted">
                <WorkspaceUserName user={item.workspaceUser} />
              </Text>
            </Box>
          </Flex>
        </Box>
      ))}
    </Box>
  );
};
const Repositories = ({ integration, registerFn }) => {
  const message = useMessage();
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const perPage = 50;
    const fetchData = async (page) => {
      try {
        const res = await getRepositories(integration._id, { page, perPage });
        setRepos((prev) => [...prev, ...res.data]);
        setLoading(false);
        if (res.data.length === perPage) {
          fetchData(page + 1);
        }
      } catch (error) {
        message.handleError(error);
      }
      setLoading(false);
    };

    if (integration) {
      setRepos([]);
      setLoading(true);
      fetchData(1);
    }
  }, [integration, message]);

  const list = useMemo(
    () =>
      repos.filter((repo) =>
        repo.fullName.toLowerCase().includes(query.toLowerCase())
      ),
    [repos, query]
  );

  return (
    <>
      {!loading && repos.length && (
        <InputGroup mb="2" mx="6" w="auto">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="muted" />
          </InputLeftElement>
          <Input
            type="search"
            value={query}
            borderRadius="full"
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      )}

      <Box flex="1" py="1px" px="6" minH="0" overflow="auto">
        {loading && (
          <Box py="20">
            <PageLoading />
          </Box>
        )}
        {integration &&
          list.map((item) => (
            <Box
              mb="2"
              as="label"
              display="block"
              cursor="pointer"
              key={item._id}
              __css={{
                "input:checked + div": {
                  borderColor: "brand.500",
                  outline: "1px solid",
                  outlineColor: "brand.500",
                },
              }}
            >
              <Input
                hidden
                type="radio"
                value={item._id}
                name="repository"
                {...registerFn("repository")}
              />
              <Flex
                px="4"
                h="12"
                gap="2"
                flex="1"
                bg="bg.surface"
                border="1px solid"
                borderRadius="base"
                alignItems="center"
                borderColor={"border.tertiary"}
              >
                <Icon
                  boxSize="6"
                  color="muted"
                  as={integrationTypes[integration.type].icon}
                />
                <Box flex="1" minW="0">
                  <Text>{item.fullName}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
      </Box>
    </>
  );
};

export default FormFieldIntegration;
