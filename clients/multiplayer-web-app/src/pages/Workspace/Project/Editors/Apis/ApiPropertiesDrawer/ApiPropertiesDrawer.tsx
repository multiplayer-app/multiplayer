import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Flex,
  Text,
  Button,
  FormLabel,
  FormControl,
  Input,
  Icon,
  Box,
  Link,
  Stack,
} from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";

import TagInput from "shared/components/TagInput";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import { useApis } from "shared/providers/ApisContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { InfoCircleIcon } from "shared/icons";

const ApiPropertiesDrawer = () => {
  const { apiPropertiesDrawerDisclosure } = useApis();
  const { openAlertDialog } = useAlertDialog();
  const { path: entityId } = useParams();
  const { onEntityDelete, onEntityUpdate, entity } = useEntities();
  const [tags, setTags] = useState([]);

  const onTagsChanged = async (tags: string[]) => {
    onEntityUpdate(entityId, {
      tags: tags.map((t) => {
        return typeof t === "string" ? { value: t } : t;
      }),
    });
  };

  useEffect(() => {
    if (entity?.tags) {
      setTags(entity.tags.map((i) => i.value));
    }
  }, [entity]);

  const handleDelete = async () => {
    const result = await openAlertDialog({
      title: "Delete",
      description: "Are you sure you want to delete this API?",
    });

    if (result) {
      onEntityDelete(entityId, EntityType.API);
    }
  };

  const onNameChanged = async (e) => {
    const newName = e.target.value.trim();
    if (!!newName && newName !== entity.key) {
      onEntityUpdate(entityId, {
        key: newName,
      });
    }
  };

  return (
    <Drawer isOpen={true}>
      <DrawerContent
        height="auto"
        onClose={apiPropertiesDrawerDisclosure.onClose}
      >
        <Flex direction="column" flex="1" minH="0">
          <Flex
            px="4"
            py="2"
            gap="4"
            minH="14"
            alignItems="center"
            justifyContent="space-between"
            position="sticky"
            top="0"
          >
            <Text flex="1" fontSize="lg" fontWeight="medium">
              API information
            </Text>
          </Flex>
          <Flex
            direction="column"
            w="100%"
            flex="1"
            minH="0"
            p="4"
            justifyContent="space-between"
          >
            <Flex gap="4" direction="column" mb="6">
              <Flex color="muted">
                <Icon as={InfoCircleIcon} mr="4px" color="brand.500"></Icon>
                <Box fontWeight="500" color="brand.500">
                  Information
                </Box>
              </Flex>
              <FormControl>
                <FormLabel>API name</FormLabel>
                <Input
                  placeholder="Enter a flow name..."
                  defaultValue={entity?.key}
                  onBlur={onNameChanged}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tags</FormLabel>
                <TagInput
                  autoFocus={false}
                  onChange={onTagsChanged}
                  value={tags}
                />
              </FormControl>
              {entity?.sourceUri && (
                <FormControl>
                  <FormLabel>URL</FormLabel>
                  <Link href={entity?.sourceUri} isExternal color="brand.500">
                    {entity?.sourceUri}
                  </Link>
                </FormControl>
              )}
              {entity?.metadata && (
                <Stack spacing={2}>
                  {Object.entries(entity.metadata).map(([key, value]) => (
                    <Box key={key} p={2} bg="bg.subtle" borderRadius="md">
                      <Text
                        fontWeight="bold"
                        textTransform="capitalize"
                        as="span"
                      >
                        {key}:&nbsp;
                      </Text>
                      <Text as="span">{value}</Text>
                    </Box>
                  ))}
                </Stack>
              )}
            </Flex>
            <Flex
              p="4"
              borderTop="1px solid"
              borderColor="border.primary"
              justifyContent="flex-end"
            >
              <Button variant="danger" onClick={handleDelete}>
                Delete API
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </DrawerContent>
    </Drawer>
  );
};

export default ApiPropertiesDrawer;
