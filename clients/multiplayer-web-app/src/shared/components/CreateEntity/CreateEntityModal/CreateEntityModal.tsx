import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useCallback, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";

import useMessage from "shared/hooks/useMessage";
import FormField from "shared/components/FormField";
import { IEntityFormConfig } from "shared/models/interfaces";
import { useEntities } from "shared/providers/EntitiesContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { EntityCategories, EntityFormFieldType } from "shared/models/enums";

import FormFieldRadio from "./CustomFields/FormFieldRadio";
import FormFieldIntegration from "./CustomFields/FormFieldIntegration";
import useSlugifiedName from "shared/hooks/useSlugifiedName";
import AddApi from "shared/components/AddApi";
import SelectDropdown from "shared/components/SelectDropdown";
import { useProject } from "shared/providers/ProjectContext";
import PlatformSetup from "shared/components/PlatformCreation/PlatformSetup";
import Visibility from "shared/components/Visibility";

const CreateEntityModal = ({
  disclosure,
  configs,
  type,
  onCreateComplete,
}: {
  disclosure: UseDisclosureReturn;
  configs: IEntityFormConfig;
  type?: EntityCategories;
  onCreateComplete?: (entityId: string, entityType: string) => void;
}) => (
  <Modal
    isOpen={disclosure.isOpen}
    onClose={disclosure.onClose}
    blockScrollOnMount={false}
    size={type === EntityCategories.PLATFORM ? "5xl" : "4xl"}
  >
    <ModalOverlay />
    <ModalContent flexDirection="row">
      <CreateEntityModalContent
        type={type}
        configs={configs}
        onClose={disclosure.onClose}
        onCreateComplete={onCreateComplete}
      />
    </ModalContent>
  </Modal>
);

const CreateEntityModalContent = ({
  type,
  configs,
  onClose,
  onCreateComplete,
}: {
  type: EntityCategories;
  configs: IEntityFormConfig;
  onClose: () => void;
  onCreateComplete?: (entityId: string, entityType: string) => void;
}) => {
  const message = useMessage();
  const { navigate } = useProject();
  const { trackEvent } = useAnalytics();
  const { onEntityCreate } = useEntities();
  const [preview, setPreview] = useState(configs.preview);
  const [entityName, setEntityName] = useState("");

  const { slugifiedName, setSlugifiedName, handleSpaces, caretPosition } =
    useSlugifiedName(entityName, (val) => {
      setEntityName(val);
      setValue("key", val, { shouldValidate: true });
    });

  const isPlatformEntity = type === EntityCategories.PLATFORM;
  const isAPI = type === EntityCategories.SOURCE;

  const schema = useMemo(
    () =>
      yup
        .object(
          configs.fields.reduce((acc, field) => {
            acc[field.name] = field.validation;
            return acc;
          }, {} as Record<string, any>)
        )
        .required(),
    [configs.fields]
  );

  const {
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    shouldFocusError: false,
    defaultValues: null,
  });

  useEffect(() => {
    if (configs.preview) setPreview(configs.preview);
    configs.fields.forEach((field) => {
      setValue(field.name, field.defaultValue);
    });
  }, [configs, setValue]);

  const handleEntityRedirect = useCallback(
    (entityId: string, entityType: string) => {
      if (onCreateComplete) {
        onCreateComplete(entityId, entityType);
      } else {
        navigate(`entity/${entityType}/${entityId}`);
      }
      onClose();
    },
    [navigate, onCreateComplete, onClose]
  );

  const onSubmit = useCallback(
    async (values: any) => {
      try {
        const res = await onEntityCreate(values);
        trackEvent(`Create ${values.type}`, {
          name: values.key,
          projectId: res.project,
          projectBranchId: res.projectBranch,
          actionSource: "Project -> Create entity modal",
        });
        handleEntityRedirect(res.entityId, res.type);
      } catch (error) {
        message.handleError(error);
      }
    },
    [
      navigate,
      onClose,
      onEntityCreate,
      trackEvent,
      handleEntityRedirect,
      message,
    ]
  );

  const renderField = (field: any) => {
    switch (field.type) {
      case EntityFormFieldType.TEXT:
        return (
          <FormField
            key={field.name}
            mb="12"
            errors={errors}
            name={field.name}
            label={field.label}
            hint={field.hint}
            caretPosition={caretPosition}
            registerFn={register}
            onKeyDown={handleSpaces}
            onChange={(e: any) => setSlugifiedName(e.target.value)}
            placeholder={field.placeholder}
            inputProps={{
              autoFocus: true,
              value: slugifiedName,
              id: "entity-name-field",
            }}
          />
        );
      case EntityFormFieldType.RADIO:
        return (
          <FormFieldRadio
            key={field.name}
            name={field.name}
            label={field.label}
            registerFn={register}
            setPreview={setPreview}
            options={field.options}
          />
        );
      case EntityFormFieldType.REPO:
        return <FormFieldIntegration key={field.name} registerFn={register} />;
      case EntityFormFieldType.DROPDOWN:
        return (
          <FormControl key={field.name}>
            <FormLabel fontWeight={500} mb={1}>
              {field.label}
            </FormLabel>
            <SelectDropdown
              value={watch(field.name)}
              onChange={(opt) => setValue(field.name, opt.value)}
              options={field.options?.map(({ label, value }) => ({
                label,
                value,
              }))}
              buttonProps={{ width: "100%" }}
              leftChild={<Icon as={field.icon} mr="8px" height={4} />}
            />
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack
        flex="1"
        as="form"
        noValidate
        spacing={0}
        onSubmit={handleSubmit(onSubmit)}
      >
        <ModalHeader {...configs.headerProps} borderTopRadius={16}>
          {configs.title}
          {configs.description && (
            <Text fontWeight="normal" color="muted" fontSize="sm" my={4}>
              {configs.description}
            </Text>
          )}
        </ModalHeader>
        <ModalCloseButton color="muted" zIndex="2" />
        <ModalBody pb="0">
          {isPlatformEntity ? (
            <PlatformSetup
              onPlatformSubmit={(id) => handleEntityRedirect(id, "platform")}
            />
          ) : isAPI ? (
            <AddApi
              selectComponents={true}
              onClose={(id) => handleEntityRedirect(id, "api")}
            />
          ) : (
            <Box {...configs.fieldProps}>{configs.fields.map(renderField)}</Box>
          )}
        </ModalBody>
        {!!configs.fields.length && (
          <ModalFooter>
            <Button
              w="full"
              type="submit"
              colorScheme="blue"
              isDisabled={!isValid}
              isLoading={isSubmitting}
              {...configs.buttonProps}
            >
              {configs.button}
            </Button>
          </ModalFooter>
        )}
      </Stack>

      {preview && (
        <Visibility hideBelow="md">
          <Flex
            w="400px"
            minH="515px"
            bg="bg.surface"
            borderEndRadius="3xl"
            position="relative"
            userSelect="none"
            pointerEvents="none"
            alignItems="flex-end"
            justifyContent="flex-end"
          >
            <Image src={preview} w="336px" borderBottomRightRadius="3xl" />
          </Flex>
        </Visibility>
      )}
    </>
  );
};

export default CreateEntityModal;
