import {
  Box,
  Flex,
  Text,
  Modal,
  Stack,
  Avatar,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { IProject } from "@multiplayer/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import * as yup from "yup";
import FormField from "shared/components/FormField";
import FileInput from "shared/components/FileInput";
import LabelGroup from "shared/components/LabelGroup";
import Visibility from "shared/components/Visibility";

const ProjectModal = ({
  onSubmit,
  disclosure,
  defaultValues,
}: {
  defaultValues?: IProject;
  disclosure: UseDisclosureReturn;
  onSubmit: (values, icon, cover) => Promise<void>;
}) => {
  const { isOpen, onClose } = disclosure;
  const [files, setFiles] = useState({ iconUrl: null, coverImageUrl: null });
  const { reset, register, watch, setValue, handleSubmit, formState } = useForm(
    {
      shouldFocusError: false,
      resolver: yupResolver(schema),
      defaultValues: { name: "", coverImageUrl: "", iconUrl: "" },
    }
  );

  useEffect(() => {
    if (isOpen && defaultValues) {
      setValue("name", defaultValues.name);
      setValue("iconUrl", defaultValues.iconUrl);
      setValue("coverImageUrl", defaultValues.coverImageUrl);
    }
  }, [defaultValues, isOpen]);

  const onValidSubmit = (values) => {
    return onSubmit(values, files.iconUrl, files.coverImageUrl);
  };

  const onFileChange = (name, file, result) => {
    setFiles((prev) => ({ ...prev, [name]: file }));
    setValue(name, result);
  };

  const resetAll = () => {
    setFiles({ iconUrl: null, coverImageUrl: null });
    reset();
  };

  const values = watch();
  return (
    <Modal
      size="4xl"
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={resetAll}
      closeOnOverlayClick={
        !(formState.isDirty || files.iconUrl || files.coverImageUrl)
      }
    >
      <ModalOverlay />
      <ModalContent flexDirection="row" alignItems="stretch">
        <Stack
          flex="1"
          as="form"
          noValidate
          spacing={0}
          onSubmit={handleSubmit(onValidSubmit)}
        >
          <ModalHeader>
            <Text fontSize="xs" color="muted">
              1/1
            </Text>
            {defaultValues ? "Update project" : "Create new project"}
          </ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" />
          <ModalBody>
            <FormField
              mb="4"
              name="name"
              label="Project name"
              placeholder="Enter project name"
              errors={formState.errors}
              registerFn={register}
            />
            {/* <FormField
                mb="6"
                name="version"
                label="Project version"
                placeholder="Enter project version"
                errors={formState.errors}
                registerFn={register}
              /> */}
            <Box mb="6">
              <LabelGroup
                mb="4"
                optional
                label="Project icon"
                description="Pick a project icon to reflect your project. Recommended size is 128 x 128px. Supported formats are JPG, PNG."
              />
              {!files.iconUrl ? (
                <Button
                  w="full"
                  as={FileInput}
                  variant="light"
                  onUpload={(file, result) =>
                    onFileChange("iconUrl", file, result)
                  }
                >
                  Upload icon
                </Button>
              ) : (
                <Button
                  w="full"
                  variant="light"
                  onClick={() => onFileChange("iconUrl", null, "")}
                >
                  Delete icon
                </Button>
              )}
            </Box>
            <Box mb="6">
              <LabelGroup
                mb="4"
                optional
                label="Cover image"
                description="Pick a project cover image to reflect your project. Supported formats are JPG, PNG."
              />
              {!files.coverImageUrl ? (
                <Button
                  w="full"
                  as={FileInput}
                  variant="light"
                  onUpload={(file, result) =>
                    onFileChange("coverImageUrl", file, result)
                  }
                >
                  Upload cover photo
                </Button>
              ) : (
                <Button
                  w="full"
                  variant="light"
                  onClick={() => onFileChange("coverImageUrl", null, "")}
                >
                  Delete cover photo
                </Button>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button
              w="full"
              type="submit"
              colorScheme="blue"
              isLoading={formState.isSubmitting}
            >
              {defaultValues ? "Update " : "Create"}
            </Button>
          </ModalFooter>
        </Stack>
        <Visibility hideBelow="md">
          <Box
            w="400px"
            minH="515px"
            bg="bg.surface"
            overflow="hidden"
            position="relative"
            borderEndRadius="3xl"
          >
            <Box
              top="30%"
              left="15%"
              w="400px"
              borderRadius="xl"
              border="solid 1px"
              position="absolute"
              borderColor="border.primary"
              boxShadow="lg"
            >
              <Box
                h="180px"
                bgSize="cover"
                borderTopRadius="xl"
                bgImg={values.coverImageUrl}
                bgColor={values.coverImageUrl ? "bg.subtle" : "bg.muted"}
              />
              <Flex flex="1" p="4" gap="4" alignItems="center">
                <Avatar
                  size="sm"
                  boxSize="8"
                  borderRadius="base"
                  name={values.name || " "}
                  src={values.iconUrl}
                />
                <Box flex="1">
                  {values.name ? (
                    <Text fontSize="sm" lineHeight="14px">
                      {values.name}
                    </Text>
                  ) : (
                    <Box
                      h="14px"
                      w="110px"
                      bg="bg.muted"
                      borderRadius="30px"
                    ></Box>
                  )}
                  <Box
                    mt="2"
                    h="14px"
                    w="70px"
                    bg="bg.muted"
                    borderRadius="30px"
                  ></Box>
                </Box>
              </Flex>
            </Box>
          </Box>
        </Visibility>
      </ModalContent>
    </Modal>
  );
};
const schema = yup
  .object({
    name: yup.string().trim().required("This field is required"),
    // version: yup.string().required("This field is required"),
    iconUrl: yup.string(),
    coverImageUrl: yup.string(),
  })
  .required();

export default ProjectModal;
