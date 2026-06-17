import { useMemo, useState } from "react";
import {
  Flex,
  Text,
  Icon,
  Button,
  ModalBody,
  ModalHeader,
} from "@chakra-ui/react";
import { EntityType, Platform } from "@multiplayer/types";
import { DiffPatcher } from "@multiplayer/entity/dist/diff-patch";
import { EntityDiffPatch, PlatformTemplates } from "@multiplayer/entity";

import { ChevronLeftIcon } from "shared/icons";
import { StagedChange } from "shared/models/types";
import { EntityState } from "shared/models/interfaces";
import { useChangesContext } from "shared/providers/ChangesContext";
import { getCombinedPatch } from "shared/helpers/changes.helpers";
import { clone } from "shared/utils";

interface EntityPreviewProps {}

const EntityPreview = (props: EntityPreviewProps) => {
  const { preview, states, staged, setPreview } = useChangesContext();
  const state = states.get(preview);
  const stage = staged[preview];

  if (!preview) return null;
  return (
    <Flex
      h="full"
      inset="0"
      bg="bg.primary"
      position="absolute"
      direction="column"
      borderRadius="inherit"
    >
      <ModalHeader
        minH="20"
        gap="2"
        as={Flex}
        fontSize="lg"
        borderBottom="1px"
        alignItems="center"
        borderBottomColor="border.primary"
      >
        <Button
          size="sm"
          variant="base"
          leftIcon={<Icon as={ChevronLeftIcon} />}
          onClick={() => setPreview(null)}
        >
          Go back
        </Button>
      </ModalHeader>
      <ModalBody
        p="0"
        as={Flex}
        bg="bg.surface"
        overflow="auto"
        direction="column"
      >
        <PreviewEditor type={state.entityType} state={state} stage={stage} />
      </ModalBody>
    </Flex>
  );
};

const PreviewEditor = ({ type, stage, state }) => {
  const [isError, setIsError] = useState<boolean>(false);

  const content = useMemo(() => {
    const patcher = EntityDiffPatch.getDiffPatcher(type);
    try {
      switch (type) {
        case EntityType.PLATFORM:
          return getPlatformPreview(state, stage, patcher);
        default:
          return null;
      }
    } catch (error) {
      console.log(error);
      setIsError(true);
    }
  }, [type]);

  if (isError)
    return (
      <Text py="60" color="red.500" textAlign="center">
        Unable to preview merging results.
      </Text>
    );

  switch (type) {
    default:
      return <>Unsupported type</>;
  }
};

const getPlatformPreview = (
  state: EntityState,
  stage: StagedChange,
  patcher: DiffPatcher<string | object>
): Platform => {
  const patch = getCombinedPatch(state, stage);
  if (!Object.keys(patch).length) return state.initialContent;
  const contentClone = clone(state.initialContent || PlatformTemplates.empty());
  const [success, content] = patcher.applyPatch(contentClone, patch);
  return success ? (content as Platform) : PlatformTemplates.empty();
};

export default EntityPreview;
