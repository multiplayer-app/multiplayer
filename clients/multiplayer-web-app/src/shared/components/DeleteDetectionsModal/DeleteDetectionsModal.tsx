import {
  Button,
  Flex,
  Modal,
  Text,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UseDisclosureReturn,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import { SystemCatalogTabTypes } from "shared/models/enums";
import { RadarDetectionSource } from "@multiplayer/types";

enum Deletable {
  "detectable",
  "entity",
}

const TabTypeToCollectionNameMap = {
  [SystemCatalogTabTypes.Components]: ["component", "components"],
  [SystemCatalogTabTypes.APIs]: ["API", "APIs"],
  [SystemCatalogTabTypes.Dependencies]: ["dependency", "dependencies"],
  [SystemCatalogTabTypes.Flows]: ["flow", "flows"],
  [SystemCatalogTabTypes.Platforms]: ["platform", "platforms"],
  [SystemCatalogTabTypes.Environments]: ["environment", "environments"],
};

const DeleteDetectionsModal = ({
  hasDetections,
  disclosure,
  onDelete,
  count,
  isAll,
  type,
}: {
  count: number;
  isAll: boolean;
  hasDetections: boolean;
  type: SystemCatalogTabTypes;
  disclosure: UseDisclosureReturn;
  onDelete: (type: "detectable" | "entity", sign?: number) => void;
}) => {
  const deletableType = [
    SystemCatalogTabTypes.Components,
    SystemCatalogTabTypes.APIs,
    SystemCatalogTabTypes.Dependencies,
  ].includes(type)
    ? Deletable.detectable
    : Deletable.entity;

  const typeToMessageMap = {
    [Deletable.entity]: (
      <>
        Are you sure you want to delete{" "}
        <b>{isAll ? "all (" + count + ")" : count}</b>{" "}
        {TabTypeToCollectionNameMap[type][count === 1 ? 0 : 1]}?
      </>
    ),
    [Deletable.detectable]: (
      <>
        You are about to remove <b>{isAll ? "all (" + count + ")" : count}</b>{" "}
        {TabTypeToCollectionNameMap[type][count === 1 ? 0 : 1]}. Choose how you
        would like to proceed.
      </>
    ),
  };

  return (
    <Modal
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent borderRadius="24px">
        <ModalHeader bg="bg.surface" borderRadius="24px 24px 0 0">
          Deleting {TabTypeToCollectionNameMap[type][count === 1 ? 0 : 1]}
        </ModalHeader>
        <ModalCloseButton color="muted" zIndex="2" m="3" />
        <ModalBody color="muted">
          {typeToMessageMap[deletableType]}
          {deletableType === Deletable.detectable && (
            <>
              <Divider mt="4" />
              <Text mt="2">
                <b>Note:</b> a detection is the OpenTelemetry data of your
                system, "detection + {TabTypeToCollectionNameMap[type][1]}"
                deletes both that and the documented entity.
              </Text>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {deletableType === Deletable.detectable ? (
            <Flex w="100%" gap="4">
              <Tooltip
                openDelay={300}
                placement="top"
                variant="light"
                label={hasDetections ? "" : "No detections were selected"}
              >
                <Button
                  variant="light"
                  isDisabled={!hasDetections}
                  onClick={() => {
                    onDelete("detectable", RadarDetectionSource.RADAR);
                    disclosure.onClose();
                  }}
                >
                  Delete detections only
                </Button>
              </Tooltip>
              <Button
                flex="1"
                variant="danger"
                onClick={() => {
                  onDelete("detectable", RadarDetectionSource.SYNCED);
                  disclosure.onClose();
                }}
              >
                Delete detections + {TabTypeToCollectionNameMap[type][1]}
              </Button>
            </Flex>
          ) : (
            <>
              <Button
                onClick={() => {
                  onDelete("entity");
                }}
              >
                Delete
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteDetectionsModal;
