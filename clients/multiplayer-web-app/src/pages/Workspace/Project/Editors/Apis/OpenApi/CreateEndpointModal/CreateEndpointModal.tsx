import {
  Menu,
  Modal,
  Button,
  MenuList,
  MenuItem,
  ModalBody,
  MenuButton,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  UseDisclosureReturn,
  Icon,
  Flex,
  Text,
  Switch,
} from "@chakra-ui/react";
import * as yup from "yup";
import { OpenAPIV3 } from "openapi-types";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import Method from "../../../../../../../shared/components/Endpoint/Method";
import { useOpenApi } from "shared/providers/OpenApiContext";
import { ChevronDownIcon } from "shared/icons";
import FormField from "shared/components/FormField";
import { useEffect, useState } from "react";

interface CreateEndpointModalProps {
  disclosure: UseDisclosureReturn;
  targetCollection: string;
  onSubmit?: any;
}

const CreateEndpointModal = ({
  onSubmit,
  disclosure,
  targetCollection,
}: CreateEndpointModalProps) => {
  const { collections } = useOpenApi();
  const [hasCollection, setHasCollection] = useState(false);

  const {
    watch,
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues: {
      tag: null,
      path: "",
      method: OpenAPIV3.HttpMethods.GET,
    },
  });

  const onValidSubmit = (values) => {
    return onSubmit(values);
  };

  useEffect(() => {
    if (disclosure.isOpen) {
      setHasCollection(!!targetCollection);
    }
    setValue("tag", targetCollection);
  }, [disclosure.isOpen, targetCollection]);

  useEffect(() => {
    if (!hasCollection) {
      setValue("tag", null);
    }
  }, [hasCollection]);

  const { method, tag } = watch();

  return (
    <Modal
      size="4xl"
      isCentered
      onCloseComplete={reset}
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onValidSubmit)} noValidate>
        <ModalHeader>Add a new method</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex mb="6">
            <Menu>
              <MenuButton
                px="2"
                gap="6"
                as={Button}
                borderRight="0"
                variant="outline"
                borderEndRadius="0"
                rightIcon={<Icon color="muted" as={ChevronDownIcon} />}
              >
                <Method name={method} />
              </MenuButton>
              <MenuList minW="24">
                {Object.entries(OpenAPIV3.HttpMethods).map(([key, value]) => (
                  <MenuItem key={key} onClick={() => setValue("method", value)}>
                    <Method name={value} badge={false} />
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <FormField
              name="path"
              fontFamily="JetBrains Mono, sans-serif"
              placeholder="Enter URL or past text"
              errors={errors}
              registerFn={register}
              inputProps={{
                borderStartRadius: 0,
              }}
            />
          </Flex>
          <Text color="muted" mb="2">
            Options
          </Text>
          <Flex gap="4" alignItems="center">
            <Switch
              colorScheme="brand"
              isChecked={hasCollection}
              onChange={(e) => setHasCollection(e.target.checked)}
            />
            <Text mr="auto">Add to a collection</Text>
            <Menu>
              <MenuButton
                as={Button}
                variant="outline"
                isDisabled={!hasCollection}
                rightIcon={<Icon color="muted" as={ChevronDownIcon} />}
              >
                {tag || "Select collection / folder"}
              </MenuButton>
              <MenuList>
                {Object.values(collections).map(
                  ({ name, isDefault, isDeleted }) =>
                    isDefault || isDeleted ? null : (
                      <MenuItem
                        key={name}
                        onClick={() => setValue("tag", name)}
                      >
                        {name}
                      </MenuItem>
                    )
                )}
              </MenuList>
            </Menu>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" isLoading={isSubmitting}>
            Add method
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const schema = yup
  .object({
    tag: yup.string().nullable(),
    method: yup.string().required("This field is required"),
    path: yup.string().trim().required("This field is required"),
  })
  .required();
export default CreateEndpointModal;
