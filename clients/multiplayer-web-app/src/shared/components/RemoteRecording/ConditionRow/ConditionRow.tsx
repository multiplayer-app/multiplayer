import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Controller, useController, useWatch } from "react-hook-form";
import {
  EndUserType,
  RemoteSessionRecordingConditionCompareOperator,
} from "@multiplayer/types";
import {
  Box,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Text,
} from "@chakra-ui/react";
import ConditionInputField from "shared/components/RemoteRecording/ConditionInputField";
import ConditionSelector from "shared/components/RemoteRecording/ConditionSelector";
import { TrashIcon } from "shared/icons";
import AttributeSelector from "shared/components/RemoteRecording/AttributeSelector";
import {
  RemoteRecordingResourceAttributes,
  RemoteRecordingUserAttributes,
} from "shared/models/enums";
import SelectDropdown from "shared/components/SelectDropdown";
import TagInput from "shared/components/TagInput";
import {
  EndUserTypesToNameMap,
  UserAttributesToNameMap,
} from "pages/Workspace/Project/Debugger/DebugSession/types";

interface ConditionRowProps {
  rowIndex: number;
  control: any;
  register: any;
  remove: (index: number) => void;
  fieldsLength: number;
  basePath?: string;
  errors?: any;
}

const ConditionRow = memo(
  ({
    rowIndex,
    control,
    register,
    remove,
    fieldsLength,
    basePath: basePathPrefix,
    errors,
  }: ConditionRowProps) => {
    const basePath = basePathPrefix 
      ? `${basePathPrefix}.conditions.start.${rowIndex}`
      : `conditions.start.${rowIndex}`;
    const conditionTypePath = `${basePath}.conditionType`;
    const attributeRootPath = `${basePath}.attributeRoot`;
    const showDeleteButton = fieldsLength > 1;
    const showAndDivider = fieldsLength > 0 && rowIndex !== fieldsLength - 1;

    const conditionType = useWatch({
      control,
      name: conditionTypePath,
    });

    const attributeType = useWatch({
      control,
      name: attributeRootPath,
    });
    const isUserAttributesSelected = useMemo(
      () => attributeType === RemoteRecordingResourceAttributes.USER_ATTRIBUTES,
      [attributeType]
    );
    const attributePath = `${basePath}.attributePath`;
    const attributePathType = useWatch({ control, name: attributePath });

    const { field: valueField } = useController({
      control,
      name: `${basePath}.value`,
    });

    const prevIsUserAttrSelectedRef = useRef(isUserAttributesSelected);
    const prevAttributePathRef = useRef(attributePathType);

    useEffect(() => {
      if (prevIsUserAttrSelectedRef.current !== isUserAttributesSelected) {
        valueField.onChange("");
        prevIsUserAttrSelectedRef.current = isUserAttributesSelected;
        prevAttributePathRef.current = attributePathType;
      }
    }, [isUserAttributesSelected, attributePathType, valueField]);

    useEffect(() => {
      if (
        isUserAttributesSelected &&
        prevAttributePathRef.current !== attributePathType
      ) {
        valueField.onChange("");
        prevAttributePathRef.current = attributePathType;
      }
    }, [attributePathType, isUserAttributesSelected, valueField]);

    const shouldHideValueField = useMemo(
      () =>
        conditionType ===
          RemoteSessionRecordingConditionCompareOperator.EXISTS ||
        conditionType ===
          RemoteSessionRecordingConditionCompareOperator.NOT_EXISTS,
      [conditionType]
    );

    const handleRemove = useCallback(
      () => remove(rowIndex),
      [remove, rowIndex]
    );

    return (
      <Box>
        <HStack
          align="end"
          justifyContent="space-between"
          flexWrap={{ base: "wrap", md: "nowrap" }}
          gap={3}
        >
          <AttributeSelector 
            register={register} 
            rowIndex={rowIndex} 
            basePath={basePathPrefix}
          />
          <Box
            w={{ base: "45%", md: "200px" }}
            flex={shouldHideValueField ? 1 : undefined}
          >
            {isUserAttributesSelected ? (
              <FormControl>
                <FormLabel
                  fontSize="sm"
                  color="subtle"
                  fontWeight="medium"
                  mb={1}
                >
                  Key
                </FormLabel>
                <Controller
                  name={attributePath}
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value}
                      onChange={(opt) => field.onChange(opt.value)}
                      options={Object.keys(RemoteRecordingUserAttributes).map(
                        (key) => ({
                          label:
                            UserAttributesToNameMap[
                              (RemoteRecordingUserAttributes as any)[key]
                            ],
                          value: (RemoteRecordingUserAttributes as any)[key],
                        })
                      )}
                      placeholder="Key"
                      buttonProps={{
                        height: "40px",
                        width: "100%",
                      }}
                    />
                  )}
                />
              </FormControl>
            ) : (
              <ConditionInputField
                register={register}
                rowIndex={rowIndex}
                name="attributePath"
                label="Key"
                basePath={basePathPrefix}
                errors={errors}
              />
            )}
          </Box>
          <Controller
            name={conditionTypePath}
            control={control}
            render={({ field }) => (
              <ConditionSelector
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {!shouldHideValueField && (
            <Box
              flex="1"
              maxW={{ base: "unset", md: "220px" }}
              w={{ base: "45%", md: "220px" }}
            >
              {isUserAttributesSelected &&
              attributePathType === RemoteRecordingUserAttributes.Type ? (
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    color="subtle"
                    fontWeight="medium"
                    mb={1}
                  >
                    Value
                  </FormLabel>
                  <Controller
                    name={`${basePath}.value`}
                    control={control}
                    render={({ field }) => (
                      <SelectDropdown
                        value={field.value}
                        onChange={(opt) => field.onChange(opt.value)}
                        options={Object.values(EndUserType).map((val) => ({
                          label: EndUserTypesToNameMap[val],
                          value: val,
                        }))}
                        placeholder="Value"
                        buttonProps={{
                          height: "40px",
                          width: "100%",
                        }}
                      />
                    )}
                  />
                </FormControl>
              ) : isUserAttributesSelected &&
                attributePathType === RemoteRecordingUserAttributes.Tags ? (
                <Controller
                  name={`${basePath}.value`}
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      value={
                        (field.value
                          ? String(field.value).split(",").filter(Boolean)
                          : []) as string[]
                      }
                      onChange={(val) => field.onChange(val.join(","))}
                      inputPlaceholder="Add tags..."
                      boxProps={{ w: "100%" }}
                    />
                  )}
                />
              ) : (
                <ConditionInputField
                  register={register}
                  rowIndex={rowIndex}
                  name="value"
                  label="Value"
                  basePath={basePathPrefix}
                  errors={errors}
                />
              )}
            </Box>
          )}
          {showDeleteButton && (
            <IconButton
              mb={1}
              aria-label="Delete condition"
              size="sm"
              variant="ghost"
              icon={<Icon as={TrashIcon} color="muted" boxSize={4} />}
              onClick={handleRemove}
            />
          )}
        </HStack>

        {showAndDivider && (
          <Flex alignItems="center" mt={4} mb={1} gap={3}>
            <Text fontWeight={600} fontSize="xs" color="muted">
              AND
            </Text>
            <Divider opacity={1} borderBottomColor="border.secondary" />
          </Flex>
        )}
      </Box>
    );
  }
);

export default ConditionRow;
