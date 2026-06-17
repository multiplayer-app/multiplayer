import { useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import PageLoading from "shared/components/PageLoading";
import RemoteRecordingForm from "shared/components/RemoteRecording/RemoteRecordingForm";
import { FeatureFlag } from "@multiplayer/types";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useGlobalRecordingSettings } from "shared/hooks/useGlobalRecordingSettings";
import { useRemoteRecordingFilters } from "shared/hooks/useRemoteRecordingFilters";

const ObservabilityUpdateModal = ({
  disclosure,
  onCloseComplete,
}: {
  disclosure: UseDisclosureReturn;
  onCloseComplete: () => void;
}) => {
  const { hasFeature } = usePermissions();
  const { isOpen, onClose } = disclosure;
  const ref = useRef();
  const { workspaceId, projectId } = useParams();
  const { isLoading: isLoadingGlobal } = useGlobalRecordingSettings(
    workspaceId,
    projectId,
    isOpen
  );
  const { isLoading: isLoadingFilters } = useRemoteRecordingFilters(
    workspaceId,
    projectId,
    isOpen
  );
  const isLoading = isLoadingGlobal || isLoadingFilters;

  if (!hasFeature(FeatureFlag.CONDITIONAL_RECORDING)) {
    return null;
  }

  return (
    <Modal
      size="5xl"
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
    >
      <ModalOverlay />
      <ModalContent borderRadius="24px" ref={ref}>
        <ModalHeader borderTopRadius="24px" bg="bg.surface">
          Multiplayer Settings
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px={6} pb={6} pt={0}>
          {isLoading ? (
            <PageLoading my="4" position="relative" />
          ) : (
            <RemoteRecordingForm onDiscard={onClose} containerRef={ref} />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ObservabilityUpdateModal;
