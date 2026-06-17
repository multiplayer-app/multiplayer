import { useState } from "react";

import {
  Box,
  Text,
  Modal,
  Flex,
  Image,
  Stack,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Avatar,
} from "@chakra-ui/react";

import * as yup from "yup";
import * as WorkspaceService from "shared/services/workspace.service";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import FileInput from "shared/components/FileInput";
import LabelGroup from "shared/components/LabelGroup";
import FormField from "shared/components/FormField";
import useMessage from "shared/hooks/useMessage";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";

import preview from "assets/images/team-modal-preview.png";
import Visibility from "shared/components/Visibility";

const CreateTeamModal = ({ isOpen, onClose, workspaceId }) => {
  const {
    reset,
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues: { name: "", iconUrl: "" },
  });
  const val = watch();
  const message = useMessage();
  const { trackEvent } = useAnalytics();
  const [file, setFile] = useState(null);

  const onSubmit = async (values: { name: string; iconUrl: string }) => {
    try {
      const name = values.name.trim();
      const res = await WorkspaceService.createTeam(workspaceId, { name });

      trackEvent(PostHogEvents.CREATE_TEAM, {
        teamName: name,
        actionSource: "Settings -> Add team",
      });

      if (file) {
        await WorkspaceService.updateTeamIcon(workspaceId, res._id, file);
      }
      onClose(res._id);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Modal
      size="4xl"
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={reset}
      closeOnOverlayClick={isDirty}
    >
      <ModalOverlay />
      <ModalContent
        flexDirection={{ base: "column-reverse", md: "row" }}
        mt={{ base: 8, md: 16 }}
      >
        <Stack
          flex="1"
          as="form"
          noValidate
          spacing={0}
          onSubmit={handleSubmit(onSubmit)}
        >
          <ModalHeader>
            <Text fontSize="xs" color="muted">
              1/1
            </Text>
            Create a new team
          </ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" />
          <ModalBody>
            <FormField
              mb="12"
              name="name"
              label="Team name"
              placeholder="Enter team name"
              errors={errors}
              registerFn={register}
            />
            <Box>
              <LabelGroup
                mb="4"
                optional
                label="Team icon"
                description="Pick a team icon to reflect your team. Recommended size is 256 x 256px. "
              />
              <Button
                w="full"
                as={FileInput}
                variant="light"
                onUpload={(value, result) => {
                  setFile(value);
                  setValue("iconUrl", result);
                }}
              >
                Upload icon
              </Button>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              w="full"
              type="submit"
              isLoading={isSubmitting}
            >
              Create
            </Button>
          </ModalFooter>
        </Stack>
        <Visibility hideBelow="md">
          <Flex
            w="400px"
            minH="515px"
            h="100%"
            bg="bg.surface"
            borderEndRadius="3xl"
            position="relative"
            alignItems="flex-end"
            justifyContent="flex-end"
          >
            <Image src={preview} w="336px" borderBottomRightRadius="3xl" />
            <Flex
              w="240px"
              top="90px"
              left="80px"
              alignItems="center"
              position="absolute"
            >
              <Box
                mr="2"
                bg="brand.500"
                boxSize="30px"
                borderRadius="base"
              ></Box>
              <Box h="14px" w="85px" bg="bg.muted" borderRadius="30px"></Box>
            </Flex>
            <Flex
              left="80px"
              bottom="150px"
              width="260px"
              alignItems="center"
              position="absolute"
            >
              <Avatar
                mr="2"
                boxSize="8"
                borderRadius="base"
                name={val.name || " "}
                src={val.iconUrl}
              />
              {val.name ? (
                <Text noOfLines={2} flex="1">
                  {val.name}
                </Text>
              ) : (
                <Box h="14px" w="95px" bg="bg.muted" borderRadius="30px"></Box>
              )}
            </Flex>
          </Flex>
        </Visibility>
      </ModalContent>
    </Modal>
  );
};

const schema = yup
  .object({
    name: yup.string().required("This field is required"),
    iconUrl: yup.string(),
    icon: yup.string(),
  })
  .required();

export default CreateTeamModal;
