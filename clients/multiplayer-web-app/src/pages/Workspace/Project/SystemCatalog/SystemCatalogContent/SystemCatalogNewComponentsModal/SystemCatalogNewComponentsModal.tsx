import { useEffect, useState } from "react";
import {
  EntityType,
  ComponentType,
  RadarDetectionGroupType,
} from "@multiplayer/types";
import {
  Flex,
  Icon,
  Link,
  Text,
  Modal,
  Button,
  Tooltip,
  ModalBody,
  InputGroup,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  InputRightElement,
} from "@chakra-ui/react";
import { ExternalLinkIcon, InfoOutlineIcon } from "@chakra-ui/icons";

import { LinkIcon } from "shared/icons";
import Table from "shared/components/Table";
import EntityIcon from "shared/components/EntityIcon";
import { EntityCategories } from "shared/models/enums";
import SlugifiedInput from "shared/components/SlugifiedInput";
import { useEntities } from "shared/providers/EntitiesContext";
import SelectDropdown from "shared/components/SelectDropdown";
import {
  IRadarGroupInfo,
  RadarDetectionGroupTypeMap,
  RadarDetectionToComponentOwnerMap,
  RadarDetectionToComponentTypeMap,
} from "../../systemCatalog.config";

interface RadarNewComponentData {
  _id: string;
  name: string;
  type: string;
  objectType: EntityType;
  componentType?: ComponentType;
  linkedComponent: {
    newComponentName?: string;
    existingComponentId?: string;
  };
}

const SystemCatalogNewComponentsModal = ({
  disclosure,
  onConfirm,
  data = [],
}: {
  disclosure: any;
  onConfirm: (newComponents: any[]) => void;
  data: IRadarGroupInfo[];
}) => {
  const { entities } = useEntities();
  const { isOpen, onClose } = disclosure;

  const [newComponents, setNewComponents] = useState<{
    [name: string]: RadarNewComponentData;
  }>({});

  const [selectedRows, setSelectedRows] = useState({});

  const onAllRowsSelect = (isSelected: boolean) => {
    const selection = isSelected
      ? Object.values(newComponents).reduce((acc, _, index) => {
          acc[index] = isSelected;
          return acc;
        }, {})
      : {};

    setSelectedRows(selection);
  };

  useEffect(() => {
    if (!isOpen) return;
    const newComps = data
      .sort((a, b) => a.componentName.localeCompare(b.componentName))
      .reduce((acc, item) => {
        acc[item.componentName] = {
          _id: item.componentName,
          name: item.componentName || item.environmentNames[0],
          type: "component",
          owner: RadarDetectionToComponentOwnerMap[item.type],
          objectType: RadarDetectionGroupTypeMap[item.type].entityType,
          linkedComponent: {
            existingComponentId: "",
            newComponentName: "",
          },
          ...(item.type !== RadarDetectionGroupType.ENVIRONMENT && {
            componentType: RadarDetectionToComponentTypeMap[item.type],
          }),
        };
        return acc;
      }, {});
    setNewComponents(newComps);
  }, [data, isOpen]);

  const existingComponents = entities[EntityCategories.COMPONENT]
    .map(({ key, entityId }) => ({
      label: key,
      value: entityId,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const existingEnvironments = entities[EntityCategories.ENVIRONMENT]
    .map(({ key, entityId }) => ({
      label: key,
      value: entityId,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const setExistingComponent = (event: any, name: string) => {
    setNewComponents((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        linkedComponent: {
          newComponentName: "",
          existingComponentId: event.value,
        },
      },
    }));
  };

  const setNewComponentName = (event: any, name: string) => {
    setNewComponents((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        linkedComponent: {
          newComponentName: event.target.value,
          existingComponentId: "",
        },
      },
    }));
  };

  const setNewComponentType = (name: string, type: string) => {
    setNewComponents((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        type,
        linkedComponent: {
          newComponentName: "",
          existingComponentId: "",
        },
      },
    }));
  };

  const columns = [
    {
      field: "name",
      name: "Detected component name",
      sortable: false,
      component: ({ name, objectType }) => (
        <Flex justifyContent="space-between" flex="1">
          <Flex gap="2">
            <EntityIcon name={objectType} />
            <Text>{name}</Text>
          </Flex>
          <Text>is</Text>
        </Flex>
      ),
    },
    {
      field: "type",
      name: "Type",
      sortable: false,
      width: "240px",
      component: ({ name, type, objectType }) => {
        return (
          <Flex
            px="1"
            py="1"
            my="1"
            gap="1"
            width="232px"
            borderRadius="20px"
            backgroundColor="bg.subtle"
            justifyContent="space-between"
          >
            <Flex
              background={type === "component" ? "bg.primary" : "bg.subtle"}
              color={type === "component" ? "body" : "muted"}
              py="1.5"
              px="3"
              gap="2"
              cursor="pointer"
              borderRadius="20px"
              width="136px"
              onClick={() => setNewComponentType(name, "component")}
            >
              <EntityIcon name={objectType} />
              <Text>
                {objectType === EntityType.ENVIRONMENT
                  ? "Environment"
                  : "Component"}
              </Text>
            </Flex>
            <Flex
              background={type === "alias" ? "bg.primary" : "bg.subtle"}
              color={type === "alias" ? "body" : "muted"}
              py="1.5"
              px="3"
              gap="2"
              cursor="pointer"
              borderRadius="20px"
              onClick={() => setNewComponentType(name, "alias")}
            >
              <LinkIcon />
              <Text>Alias</Text>
            </Flex>
          </Flex>
        );
      },
    },
    {
      field: "existingComponent",
      name: "",
      sortable: false,
      width: "270px",
      component: ({ name, type, objectType, linkedComponent }) => {
        return type === "alias" ? (
          <Flex alignItems="center" gap="2" w="full">
            <Text>of</Text>
            <SelectDropdown
              value={linkedComponent.existingComponentId}
              searchable={true}
              placeholder="Select existing"
              options={
                objectType === EntityType.ENVIRONMENT
                  ? existingEnvironments
                  : existingComponents
              }
              onChange={(event) => setExistingComponent(event, name)}
            />
          </Flex>
        ) : (
          <Flex alignItems="center" gap="2" w="full">
            <Text>as</Text>
            <InputGroup>
              <SlugifiedInput
                pr="8"
                w="full"
                key={`${name}-${type}`}
                placeholder={name}
                defaultValue={linkedComponent.newComponentName}
                onBlur={(event) => setNewComponentName(event, name)}
              />
              <InputRightElement
                children={
                  <Tooltip label="Type a new name and a new component will be created with the given name. The original name will be saved as an alias. You can leave this field empty.">
                    <Icon as={InfoOutlineIcon} color="muted" w="18px" />
                  </Tooltip>
                }
              ></InputRightElement>
            </InputGroup>
          </Flex>
        );
      },
    },
  ];

  const confirmComponentLinking = () => {
    const componentsToCreate = Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return Object.values(newComponents)[index];
      });

    onConfirm(componentsToCreate);
    onClose();
  };

  return (
    <Modal
      size="5xl"
      isOpen={isOpen}
      onClose={onClose}
      isCentered={true}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text mb="4" mt="1">
            We've detected {data.length} new components
          </Text>
          <Text color="muted" fontSize="sm" fontWeight="400">
            You can add them to your project by selecting them and clicking
            “Confirm”. If you see duplicate components,
            <br />
            rename them or designate them as an{" "}
            <Link
              href="https://www.multiplayer.app/docs/features/system-information/components/#add-a-component-alias"
              isExternal
              color="brand.500"
            >
              “alias” of an existing component.
              <ExternalLinkIcon h="12px" mb="4px" />
            </Link>
          </Text>
        </ModalHeader>
        <ModalCloseButton mt="1" />
        <ModalBody flexDirection="column" maxHeight="500px">
          <Table
            columns={columns}
            useRowSelection={true}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            onAllRowsSelect={onAllRowsSelect}
            data={Object.values(newComponents)}
            tableWrapperHeight="360px"
            noDataText="There are no new components."
          />
        </ModalBody>
        <ModalFooter justifyContent="end">
          <Button
            isDisabled={
              !Object.keys(selectedRows).filter((id) => !!selectedRows[id])
                .length
            }
            onClick={confirmComponentLinking}
          >
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SystemCatalogNewComponentsModal;
