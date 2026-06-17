import { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Button,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { IGitRepository } from "@multiplayer/types";

import useMessage from "shared/hooks/useMessage";
import { createGitPublicRepositoryBranch } from "shared/services/git.service";
import { InfoCircleIcon, NetworkIcon } from "shared/icons";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";

interface PublicRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (res: IGitRepository) => void;
}

const PublicRepositoryModal = ({
  isOpen,
  onClose,
  onUpdate,
}: PublicRepositoryModalProps) => {
  const message = useMessage();
  const { projectId } = useParams();
  const { trackEvent } = useAnalytics();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues: { url: "" },
  });

  const onValidSubmit = async ({ url }) => {
    try {
      const res = await createGitPublicRepositoryBranch(projectId, { url });

      trackEvent(PostHogEvents.CONNECT_TO_PUBLIC_REPO, {
        projectId,
        url,
        actionSource: "Project -> Repositories",
      });
      onUpdate(res);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Modal
      size="4xl"
      isOpen={isOpen}
      onClose={onClose}
      blockScrollOnMount={false}
    >
      <ModalOverlay />
      <ModalContent flexDirection="row">
        <Stack
          flex="1"
          as="form"
          noValidate
          onSubmit={handleSubmit(onValidSubmit)}
          spacing={0}
        >
          <ModalHeader
            backgroundColor="bg.surface"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            mb={6}
          >
            <Text mb={6}>Connect to a public repository</Text>
            <Text
              color="muted"
              fontSize="sm"
              fontWeight="normal"
              maxWidth="336px"
            >
              Paste a URL of a public git repository below to use it in your
              project
            </Text>
          </ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" />
          <ModalBody py={0}>
            <InputGroup
              borderColor="border.tertiary"
              boxShadow="0px 1px 2px 0px rgba(0, 0, 0, 0.05)"
            >
              <InputLeftElement
                pointerEvents="none"
                children={<Icon as={NetworkIcon} color="muted" />}
              ></InputLeftElement>
              <Input
                placeholder="https://github.com/username/repository"
                {...register("url")}
              ></Input>
              <InputRightElement
                children={
                  errors.url && (
                    <Tooltip label={errors.url.message as ReactNode}>
                      <Icon as={InfoCircleIcon} color="red.500" />
                    </Tooltip>
                  )
                }
              />
            </InputGroup>
          </ModalBody>
          <ModalFooter pt={6}>
            <Button
              w="268px"
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
            >
              Connect
            </Button>
          </ModalFooter>
        </Stack>
      </ModalContent>
    </Modal>
  );
};

const schema = yup
  .object({
    url: yup.string().url("Enter valid url").required("This field is required"),
  })
  .required();

export default PublicRepositoryModal;
