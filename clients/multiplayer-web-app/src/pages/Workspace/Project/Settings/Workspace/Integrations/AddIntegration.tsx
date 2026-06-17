import { useState } from "react";
import {
  Text,
  Icon,
  Flex,
  Modal,
  Stack,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  ModalCloseButton,
} from "@chakra-ui/react";

import { IntegrationIcon } from "shared/icons";
import LabelGroup from "shared/components/LabelGroup";
import { integrationTypes } from "shared/configs/git.configs";
import { ReactComponent as IntegrationLogo } from "assets/images/integration.svg";

import { useParams } from "react-router-dom";
import { IntegrationTypeEnum } from "@multiplayer/types";
import { IntegrationType } from "shared/models/enums";
import { config } from "../../../../../../config";

const AddIntegration = () => {
  const { workspaceId } = useParams();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [type, setType] = useState<IntegrationType>(IntegrationType.GITHUB);
  const apiBase = config.REACT_APP_API_BASE_URL;
  const gitPrefix = config.REACT_APP_GIT_PREFIX;
  const redirectUrl = window.location.origin + window.location.pathname;

  return (
    <>
      <Button onClick={onOpen} leftIcon={<IntegrationIcon />}>
        Add integration
      </Button>
      <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent flexDirection="row">
          <Stack flex="1" spacing={0}>
            <ModalHeader>
              Import your assets from existing repositories
            </ModalHeader>
            <ModalCloseButton color="muted" zIndex="2" />
            <ModalBody>
              <LabelGroup mb="4" label="Where do you want to import from?" />
              <Flex flexDirection="column" gap="4">
                {Object.keys(integrationTypes).map(
                  (key: IntegrationTypeEnum) => {
                    const { typeKey, label, icon } = integrationTypes[key];
                    return (
                      <Flex
                        key={typeKey}
                        p="4"
                        gap="4"
                        bg="bg.surface"
                        cursor="pointer"
                        border="1px solid"
                        borderRadius="base"
                        alignItems="center"
                        borderColor={
                          type === typeKey ? "brand.500" : "border.tertiary"
                        }
                        boxShadow={
                          type === typeKey
                            ? "0 0 0 1px var(--chakra-colors-brand-500);"
                            : null
                        }
                        onClick={() => setType(typeKey)}
                      >
                        <Icon boxSize="8" as={icon} />
                        <Text fontSize="md" fontWeight="medium">
                          {label}
                        </Text>
                      </Flex>
                    );
                  }
                )}
              </Flex>
            </ModalBody>
            <ModalFooter>
              <Button
                as="a"
                w="full"
                colorScheme="blue"
                href={`${apiBase}${gitPrefix}/integrations/${type.toLowerCase()}/auth?redirectUrl=${redirectUrl}&workspace=${workspaceId}`}
              >
                Continue
              </Button>
            </ModalFooter>
          </Stack>
          <Flex
            h="100%"
            w="400px"
            minH="515px"
            bg="bg.surface"
            borderEndRadius="3xl"
            alignItems="center"
            justifyContent="center"
          >
            <IntegrationLogo />
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddIntegration;
