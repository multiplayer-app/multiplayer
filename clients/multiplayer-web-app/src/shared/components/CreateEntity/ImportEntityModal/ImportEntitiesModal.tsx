import { useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Flex,
  FormLabel,
  Icon,
  Image,
  Input,
  Link,
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
import {
  ComponentType,
  EntityType,
  UNKNOWN_X,
  UNKNOWN_Y,
} from "@multiplayer/types";
import papa from "papaparse";
import { NavLink } from "react-router-dom";
import { DownloadIcon } from "@chakra-ui/icons";

import Tag from "shared/components/Tag";
import Table from "shared/components/Table";
import { InfoOutlineIcon } from "shared/icons";
import { getSlugifiedName } from "shared/utils";
import useMessage from "shared/hooks/useMessage";
import NodeIcon from "shared/components/NodeIcon";
import { SortingDirection } from "shared/models/enums";
import DisplayTags from "shared/components/DisplayTags";
import PageLoading from "shared/components/PageLoading";
import { useVersion } from "shared/providers/VersionContext";
import SlugifiedInput from "shared/components/SlugifiedInput";
import { useEntities } from "shared/providers/EntitiesContext";
import { IProjectConfig, ITableSorting } from "shared/models/interfaces";
import {
  createEntitiesBulk,
  createEntitiesBulkAI,
  updateEntitiesBulk,
} from "shared/services/version.service";

import {
  transformComponentToCreate,
  transformComponentToUpdate,
  typeConverters,
} from "./import.helpers";
import confetti from "assets/images/confetti.svg";
import successIcon from "assets/images/success-icon.svg";

const ImportEntitiesModal = ({
  isOpen,
  configs,
  onClose,
}: {
  isOpen: boolean;
  configs: IProjectConfig;
  onClose: () => void;
}) => {
  const message = useMessage();
  const importConfigs = configs.import;
  const fileInputRef = useRef<HTMLInputElement>();
  const { onEntityImport, entityAliasesMap } = useEntities();

  const [uploading, setUploading] = useState(false);
  const [importedEntities, setImportedEntities] = useState<any>(null);

  const validateFileTypes = useCallback(
    ({ type }: File) => {
      return importConfigs.input.accept.includes(type);
    },
    [importConfigs.input.accept]
  );

  const handleFilesUpload = async (file: File) => {
    if (!file) return;

    switch (configs.entityType) {
      case EntityType.NOTEBOOK:
        const formData = new FormData();

        formData.append("file", file);
        formData.append("type", configs.entityType);
        formData.append("key", getSlugifiedName(file.name));

        setUploading(true);

        try {
          const res = await onEntityImport(formData);
          setImportedEntities(res);
        } catch (error) {
          message.handleError(error);
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
        return;
      case EntityType.PLATFORM_COMPONENT:
      case EntityType.PLATFORM:
        setUploading(true);
        papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            try {
              const { data } = results;

              if (data.length === 0) {
                throw new Error("CSV should contain at least one data row.");
              }

              const components = data.reduce(
                (acc, row: any) => {
                  if (!row.name || !typeConverters.name(row.name)) {
                    throw new Error(
                      'A "name" column is required and each row should have a non-empty value for name.'
                    );
                  }

                  const shouldUpdate = getExistingComponent(row.name);

                  const component: any = {
                    key: typeConverters.name(row.name),
                  };

                  if (!!row.scope) {
                    component.visibility = typeConverters.scope(
                      row.scope,
                      row.name
                    );
                  }

                  Object.keys(row).forEach((key) => {
                    if (key !== "name" && !!row[key]) {
                      component[key] = typeConverters[key]
                        ? typeConverters[key](row[key], row.name)
                        : row[key];
                    }
                  });

                  if (shouldUpdate) {
                    acc.toUpdate.push({
                      ...component,
                      entityId: shouldUpdate.entityId,
                    });
                  } else {
                    acc.toCreate.push(component);
                  }

                  return acc;
                },
                {
                  toUpdate: [],
                  toCreate: [],
                }
              );

              setImportedEntities(components);
              setUploading(false);
            } catch (error) {
              message.handleError(
                error instanceof Error
                  ? error
                  : { message: "Invalid CSV format" }
              );
              setUploading(false);
              closeModal();
            }
          },
          error: (error: any) => {
            message.handleError({
              message: `CSV parsing error: ${error.message}`,
            });
            setUploading(false);
            closeModal();
          },
        });
        return;
      default:
        return;
    }
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileTypes(file)) {
      message.handleError({
        message: `We currently do not support the ${file.type} file extension. Please retry with a valid format.`,
      });
    } else {
      await handleFilesUpload(file);
    }
  };

  const getExistingComponent = (name: string) => {
    if (entityAliasesMap.has(name)) {
      const entity = entityAliasesMap.get(name);
      return entity.type === EntityType.PLATFORM_COMPONENT ? entity : null;
    } else return null;
  };

  const closeModal = () => {
    onClose();
    setImportedEntities(null);
  };

  return (
    <Modal
      isCentered
      size="4xl"
      isOpen={isOpen}
      onClose={closeModal}
      blockScrollOnMount={false}
    >
      <ModalOverlay />
      <ModalContent flexDirection="row" maxW="950px" borderRadius="24px">
        {importedEntities ? (
          <ImportedEntityContent
            configs={configs}
            closeModal={closeModal}
            importedData={importedEntities}
          />
        ) : (
          <Stack flex="1" spacing={0}>
            <ModalHeader bg="bg.surface" borderTopRadius="24px" pt="6">
              {importConfigs.modal.title}
              {importConfigs.modal.description && (
                <Text mt="2" fontSize="sm" color="muted" fontWeight="400">
                  {importConfigs.modal.description}
                </Text>
              )}
              <ModalCloseButton color="muted" zIndex="2" />
            </ModalHeader>
            <ModalBody p="6" position="relative">
              <Flex
                gap="4"
                as="label"
                py="77px"
                borderRadius="lg"
                cursor="pointer"
                direction="column"
                alignItems="center"
                textAlign="center"
                border="dashed 2px"
                borderColor="border.secondary"
                position="relative"
              >
                <Icon
                  as={DownloadIcon}
                  borderRadius={8}
                  padding={3}
                  width={12}
                  height={12}
                  backgroundColor="bg.subtle"
                  color="subtle"
                />
                <Text fontSize="lg" fontWeight="medium">
                  {importConfigs.input.title}
                </Text>
                <Text color="muted">{importConfigs.input.description}</Text>
                <Input
                  h="auto"
                  inset="0"
                  type="file"
                  position="absolute"
                  visibility="hidden"
                  ref={fileInputRef}
                  isDisabled={uploading}
                  onChange={handleFileInputChange}
                  accept={importConfigs.input.accept.join(", ")}
                />
              </Flex>
              {uploading && <PageLoading bg="whiteAlpha.800" zIndex="2" />}
            </ModalBody>
            {importConfigs.modal.learnMore && (
              <ModalFooter justifyContent="flex-start" pt="0">
                <Button
                  as={Link}
                  target="_blank"
                  variant="light"
                  textDecoration="none"
                  _hover={{ textDecoration: "none" }}
                  href={importConfigs.modal.learnMore.url}
                  {...(importConfigs.modal.learnMore.download && {
                    download: importConfigs.modal.learnMore.download,
                  })}
                >
                  {importConfigs.modal.learnMore.text}
                </Button>
              </ModalFooter>
            )}
          </Stack>
        )}
      </ModalContent>
    </Modal>
  );
};

const baseColumns = [
  {
    field: "key",
    name: "Name",
    sortable: true,
    component: ({ key, type, entityId }) => (
      <Flex
        py="1"
        w="100%"
        userSelect="none"
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex>
          <NodeIcon type={type} mr="8px" />
          <Flex>{key}</Flex>
        </Flex>
        {entityId && (
          <Tooltip label="This component already exists in your project, we will only update the fields imported from CSV">
            <Icon as={InfoOutlineIcon} color="orange.500"></Icon>
          </Tooltip>
        )}
      </Flex>
    ),
  },
  {
    field: "shortDescription",
    name: "Short description",
  },
  {
    field: "tags",
    name: "Tags",
    component: ({ tags }) => (
      <Flex gap="1" flexWrap="wrap" py="1">
        {tags?.map((tag: any) => {
          const { key, value } = tag;

          return (
            <Tag
              size="sm"
              key={key + value}
              name={`${key ? key + ":" : ""}${value}`}
            />
          );
        })}
      </Flex>
    ),
  },
];

const componentColumns = [
  ...baseColumns,
  {
    field: "aliases",
    name: "Aliases",
    component: ({ aliases }) => (
      <Flex gap="1" flexWrap="wrap" py="1">
        {aliases?.map((alias: any) => {
          return <Tag size="sm" key={alias} name={alias} />;
        })}
      </Flex>
    ),
  },
  {
    field: "owner",
    name: "Owner",
    component: ({ owner }) => <Text textTransform="capitalize">{owner}</Text>,
  },
  {
    field: "visibility",
    name: "Scope",
    component: ({ scope }) => <Text textTransform="capitalize">{scope}</Text>,
  },
];

const platformColumns = [
  ...baseColumns,
  {
    field: "dependsOn",
    name: "Dependencies",
    component: ({ dependsOn: dependencies }) => (
      <Flex gap="1" flexWrap="wrap" py="1">
        <DisplayTags tags={dependencies || []} visibleTagsCount={2} />
      </Flex>
    ),
  },
];

const ImportedEntityContent = ({ configs, importedData, closeModal }) => {
  const [sorting, setSorting] = useState<ITableSorting>(null);

  const componentsCount =
    importedData?.toCreate?.length + importedData?.toUpdate?.length;

  const componentsTableData = useMemo(() => {
    const combinedData = [...importedData.toUpdate, ...importedData.toCreate];
    if (sorting) {
      combinedData.sort((a, b) => {
        return sorting.direction.toString() === SortingDirection.ASC
          ? b.key.localeCompare(a.key)
          : a.key.localeCompare(b.key);
      });
    }

    return combinedData;
  }, [importedData, sorting]);

  switch (configs.entityType) {
    case EntityType.PLATFORM_COMPONENT:
      return (
        <ImportedComponentPreview
          sorting={sorting}
          setSorting={setSorting}
          closeModal={closeModal}
          importedData={importedData}
          componentsCount={componentsCount}
          componentsTableData={componentsTableData}
        />
      );
    case EntityType.PLATFORM:
      return (
        <ImportedPlatformPreview
          sorting={sorting}
          setSorting={setSorting}
          closeModal={closeModal}
          componentsCount={componentsCount}
          componentsTableData={componentsTableData}
        />
      );
    case EntityType.NOTEBOOK:
      return (
        <ImportedNoteBookPreview
          configs={configs}
          entity={importedData}
          closeModal={closeModal}
        />
      );
    default:
      return null;
  }
};

const ImportedPlatformPreview = ({
  componentsTableData,
  componentsCount,
  closeModal,
  setSorting,
  sorting,
}) => {
  const message = useMessage();
  const { currentBranchId } = useVersion();
  const [platformName, setPlatformName] = useState<string>("");

  const handlePlatformCreation = async () => {
    const payload = {
      name: platformName,
      components: componentsTableData.map(
        ({ key, type, dependsOn, tags, shortDescription }) => ({
          name: key,
          tags: tags || [],
          dependencies: dependsOn || [],
          type: type || ComponentType.GENERIC,
          position: { x: UNKNOWN_X, y: UNKNOWN_Y },
          metadata: shortDescription ? { shortDescription } : {},
        })
      ),
    };

    try {
      await createEntitiesBulkAI(currentBranchId, payload);
      closeModal();
      message.success("Platform is created successfully!");
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Stack flex="1" spacing={0}>
      <ModalHeader pt="6" bg="bg.surface" borderTopRadius="24px">
        Found {componentsCount} components in your file
        <Text mt="2" maxW="80%" fontSize="sm" color="muted" fontWeight="400">
          The following components will be added to your new platform with the
          dependencies specified. Please make sure to check everything before
          completing the import process.
        </Text>
        <ModalCloseButton color="muted" zIndex="2" />
      </ModalHeader>
      <ModalBody py="3">
        <FormLabel>Platform name</FormLabel>
        <SlugifiedInput
          mb="4"
          placeholder="Enter a name for your platform"
          value={platformName}
          onChange={setPlatformName}
        />
        <Table
          sorting={sorting}
          setSorting={setSorting}
          columns={platformColumns}
          data={componentsTableData}
          tableWrapperHeight="350px"
        />
      </ModalBody>
      <ModalFooter justifyContent="flex-end">
        <Button isDisabled={!platformName} onClick={handlePlatformCreation}>
          Confirm and create the platform
        </Button>
      </ModalFooter>
    </Stack>
  );
};

const ImportedComponentPreview = ({
  componentsTableData,
  componentsCount,
  importedData,
  closeModal,
  setSorting,
  sorting,
}) => {
  const message = useMessage();
  const { currentBranchId } = useVersion();
  const handleComponentsCreation = async () => {
    const componentsToCreate = importedData.toCreate.map(
      transformComponentToCreate
    );

    const componentsToUpdate = importedData.toUpdate.map(
      transformComponentToUpdate
    );

    try {
      if (componentsToCreate.length) {
        await createEntitiesBulk(currentBranchId, componentsToCreate);
      }

      if (componentsToUpdate.length) {
        await updateEntitiesBulk(currentBranchId, componentsToUpdate);
      }
      closeModal();
      message.success("Components created/updated successfully!");
    } catch (error) {
      message.handleError(error);
    }
  };
  return (
    <Stack flex="1" spacing={0}>
      <ModalHeader pt="6" bg="bg.surface" borderTopRadius="24px">
        Found {componentsCount} components in your file
        <Text mt="2" fontSize="sm" color="muted" fontWeight="400" maxW="80%">
          We've gone ahead and tried to fix some metadata in your components,
          like slugifying the names according to our naming rules. Please make
          sure to check everything before completing the import process.
        </Text>
        <ModalCloseButton color="muted" zIndex="2" />
      </ModalHeader>
      <ModalBody py="3">
        <Table
          sorting={sorting}
          setSorting={setSorting}
          columns={componentColumns}
          data={componentsTableData}
          tableWrapperHeight="350px"
        />
      </ModalBody>
      <ModalFooter justifyContent="flex-end">
        <Button onClick={handleComponentsCreation}>
          Confirm and create components
        </Button>
      </ModalFooter>
    </Stack>
  );
};

const ImportedNoteBookPreview = ({ entity, configs, closeModal }) => {
  return (
    <Flex
      gap="4"
      w="full"
      h="full"
      py="145px"
      textAlign="center"
      direction="column"
      alignItems="center"
      position="relative"
    >
      <Image src={confetti} position="absolute" w="full" top="0" />
      <Image src={successIcon} />
      <Text fontSize="lg" fontWeight="medium">
        {configs.import.modal.successMessage}
      </Text>
      <Text color="muted">
        We’ve created an “{entity.key}” notebook for you.{" "}
      </Text>
      <Flex gap="3">
        <Button
          as={NavLink}
          px="14"
          onClick={closeModal}
          to={`entity/${entity.type}/${entity.entityId}`}
        >
          Open the {entity.type}
        </Button>
        <Button onClick={closeModal} variant="light">
          Close
        </Button>
      </Flex>
    </Flex>
  );
};

export default ImportEntitiesModal;
