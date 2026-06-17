import { useMemo } from "react";
import {
  Box,
  Icon,
  Flex,
  Modal,
  Stack,
  Button,
  Select,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  UseDisclosureReturn,
  FormControl,
  FormLabel,
  Text,
} from "@chakra-ui/react";

import * as yup from "yup";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import useMessage from "shared/hooks/useMessage";
import LabelGroup from "shared/components/LabelGroup";
import SlugifiedInput from "shared/components/SlugifiedInput";

import {
  ProjectBranchStatus,
  ProjectBranchType,
  IProjectBranch,
} from "@multiplayer/types";
import { CheckVerifiedIcon } from "shared/icons";
import {
  createProjectBranch,
  updateBranch,
} from "shared/services/version.service";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";

const BranchModal = ({
  target,
  disclosure,
  defaultBranchId,
  onComplete,
}: {
  target?: IProjectBranch;
  defaultBranchId: string;
  disclosure: UseDisclosureReturn;
  onComplete: (arg: IProjectBranch) => void;
}) => {
  const defaultValues = useMemo(
    () =>
      target
        ? { name: target.name, type: target.type }
        : { name: "", type: ProjectBranchType.FEATURE },
    [target]
  );
  const {
    reset,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues,
  });

  const message = useMessage();
  const { trackEvent } = useAnalytics();

  const onSubmit = async (values: {
    name: string;
    type: ProjectBranchType;
  }) => {
    try {
      const { name, type } = values;
      const res = await (target
        ? updateBranch(target._id, {
            name,
            type,
            status: target.status,
            archived: target.archived,
          })
        : createProjectBranch({
            name,
            type,
            status: ProjectBranchStatus.DRAFT,
            parentProjectBranch: defaultBranchId,
          }));

      if (!target) {
        trackEvent(PostHogEvents.CREATE_BRANCH, {
          parentProjectBranch: defaultBranchId,
          projectId: res.project,
          type,
          name,
          actionSource: "Project -> Create branch",
        });
      }

      onComplete(res);
      disclosure.onClose();
    } catch (error) {
      message.handleError(error);
    }
  };

  const config = target
    ? { title: "Update design branch", button: "Update" }
    : { title: "Create a design branch", button: "Create" };

  return (
    <Modal
      size="4xl"
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
      onCloseComplete={() => reset(defaultValues)}
    >
      <ModalOverlay />
      <ModalContent flexDirection="row">
        <Stack
          flex="1"
          as="form"
          noValidate
          spacing={0}
          onSubmit={handleSubmit(onSubmit)}
        >
          <ModalHeader>{config.title}</ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" />
          <ModalBody>
            <FormControl mb="12" isInvalid={!!errors.name}>
              <FormLabel>Branch name</FormLabel>
              <SlugifiedInput
                autoFocus={true}
                placeholder="Enter a branch name"
                value={watch("name")}
                onBlur={() => trigger("name")}
                onChange={(value) => setValue("name", value)}
              />
              {errors.name && (
                <Text mt="2" color="red.500" fontSize="xs">
                  {errors.name.message}
                </Text>
              )}
              <Text fontSize="xs" mt="1" color="muted">
                The name may contain only lowercase letters, numbers or dashes.
                Must start with a letter only. E.g. 'feature-branch',
                'bugfix-v1'.
              </Text>
            </FormControl>
            <Box>
              <LabelGroup mb="4" label="Branch type" optional />
              <Select name="type" {...register("type")}>
                <option value={ProjectBranchType.FEATURE}>Feature</option>
                <option value={ProjectBranchType.CHANGE}>Change</option>
                <option value={ProjectBranchType.BUGFIX}>Bugfix</option>
              </Select>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              w="full"
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
            >
              {config.button}
            </Button>
          </ModalFooter>
        </Stack>
        <Flex
          w="400px"
          bg="bg.surface"
          minH="515px"
          userSelect="none"
          alignItems="center"
          position="relative"
          pointerEvents="none"
          borderEndRadius="3xl"
          justifyContent="center"
        >
          <Icon boxSize="120px" color="bg.muted" as={CheckVerifiedIcon} />
        </Flex>
      </ModalContent>
    </Modal>
  );
};

const schema = yup
  .object({
    name: yup
      .string()
      .required("This field is required")
      .max(255, "Branch name must be at most 255 characters")
      .matches(
        /^[a-z][a-z0-9-]*$/,
        "Branch name may contain only lowercase letters, numbers or dashes. Must start with a letter only."
      ),
    type: yup.string(),
  })
  .required();

export default BranchModal;
