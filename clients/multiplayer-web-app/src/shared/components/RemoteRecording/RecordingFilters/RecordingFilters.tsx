import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import FormField from "shared/components/FormField";
import StartFilterBlock from "shared/components/RemoteRecording/StartFilterBlock";
import SamplingRateInput from "shared/components/RemoteRecording/SamplingRateInput";
import WhatToRecordBlock from "shared/components/RemoteRecording/WhatToRecordBlock";
import { EntityEnvironmentIcon, TrashIcon } from "shared/icons";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { WarningIcon } from "@chakra-ui/icons";

const RecordingFilters = ({
  form,
  onDelete,
  handleAddFilter,
  onSelectedFilterIndexChange,
  updateFilterEnabledState,
  containerRef,
  generalSettingsEnabled,
}) => {
  const {
    register,
    control,
    watch,
    formState: { errors },
    getValues,
    setValue,
    setFocus,
  } = form;

  const filters = watch("filters") || [];
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number | null>(
    filters.length > 0 ? 0 : null
  );
  const { openAlertDialog } = useAlertDialog();

  // Show sidebar only if there are filters with names (or existing filters with _id)
  const storedFilters = useMemo(() => filters.filter((f) => f._id), [filters]);
  const shouldShowSidebar = useMemo(
    () => storedFilters.length > 0,
    [storedFilters]
  );

  useEffect(() => {
    if (
      filters.length > 0 &&
      (selectedFilterIndex === null || selectedFilterIndex >= filters.length)
    ) {
      // If there are filters with names, select the first one with a name
      // Otherwise, select the first filter (newly added without name)
      const firstNamedIndex = filters.findIndex(
        (f) => f._id || (f.name && f.name.trim() !== "")
      );
      setSelectedFilterIndex(firstNamedIndex >= 0 ? firstNamedIndex : 0);
    } else if (filters.length === 0) {
      setSelectedFilterIndex(null);
    }
  }, [filters.length, selectedFilterIndex]);

  useEffect(() => {
    if (typeof onSelectedFilterIndexChange === "function") {
      onSelectedFilterIndexChange(selectedFilterIndex);
    }
  }, [selectedFilterIndex, onSelectedFilterIndexChange]);

  const onFilterDelete = useCallback(
    async (filter) => {
      const result = await openAlertDialog(
        {
          title: "Deleting Filter",
          description: "Are you sure you want to delete this filter?",
        },
        containerRef
      );
      if (result) {
        if (filter._id) {
          await onDelete(filter._id);
        }

        const currentFilters = getValues("filters") || [];
        const updatedFilters = currentFilters.filter(
          (f) => f._id !== filter._id
        );
        setValue("filters", updatedFilters);

        if (updatedFilters.length === 0) {
          setSelectedFilterIndex(null);
        } else if (
          selectedFilterIndex !== null &&
          selectedFilterIndex >= updatedFilters.length
        ) {
          setSelectedFilterIndex(updatedFilters.length - 1);
        }
      }
    },
    [
      getValues,
      onDelete,
      openAlertDialog,
      selectedFilterIndex,
      setValue,
      setSelectedFilterIndex,
    ]
  );

  const handleAddFilterClick = useCallback(() => {
    handleAddFilter();

    const currentFilters = getValues("filters") || [];
    setSelectedFilterIndex(currentFilters.length - 1);
  }, [getValues, handleAddFilter, setSelectedFilterIndex]);

  const selectedFilter = useMemo(() => {
    return selectedFilterIndex !== null ? filters[selectedFilterIndex] : null;
  }, [selectedFilterIndex, filters]);

  useEffect(() => {
    if (selectedFilterIndex === null) return;
    const current = filters[selectedFilterIndex];
    if (!current) return;

    if (!current.name || current.name.trim() === "") {
      setFocus(`filters.${selectedFilterIndex}.name`);
    }
  }, [selectedFilterIndex, filters, setFocus]);

  const getFieldPath = useCallback(
    (fieldName: string) => {
      if (selectedFilterIndex === null) return fieldName;
      return `filters[${selectedFilterIndex}].${fieldName}` as any;
    },
    [selectedFilterIndex]
  );

  const selectedFilterErrors =
    selectedFilterIndex !== null && (errors as any)?.filters
      ? (errors as any).filters[selectedFilterIndex]
      : undefined;

  const getFieldError = useCallback(
    (fieldPath: string) => {
      if (!selectedFilterErrors) return undefined;

      return fieldPath.split(".").reduce<any>((acc, segment) => {
        if (!acc) return undefined;
        const key = Number.isNaN(Number(segment)) ? segment : Number(segment);
        return acc?.[key];
      }, selectedFilterErrors);
    },
    [selectedFilterErrors]
  );

  const samplingRateError = getFieldError("samplingRate");
  const stopIdleTimeError = getFieldError("conditions.stop.idleTime");
  const stopMaxTimeError = getFieldError("conditions.stop.maxTime");

  return (
    <>
      {filters?.length ? (
        <>
          {shouldShowSidebar && (
            <Box
              w="250px"
              minW="250px"
              h="full"
              position="sticky"
              top={0}
              left={0}
              color="body"
              px={4}
            >
              <Flex
                justifyContent="space-between"
                gap={2}
                alignItems="center"
                mb={6}
              >
                <Text fontSize="sm" fontWeight={500}>
                  Filters
                </Text>
                <Button
                  variant="outline"
                  color="subtle"
                  size="sm"
                  fontWeight={600}
                  isDisabled={filters.length !== storedFilters.length}
                  onClick={handleAddFilterClick}
                >
                  Add filter
                </Button>
              </Flex>

              {storedFilters.map((filter) => {
                const actualIndex = filters.findIndex(
                  (f) => f._id === filter._id
                );
                return (
                  <Flex
                    minHeight={8}
                    borderRadius={8}
                    p={2}
                    cursor="pointer"
                    alignItems="center"
                    key={actualIndex}
                    mb={3}
                    bg={
                      selectedFilterIndex === actualIndex
                        ? "bg.subtle"
                        : "unset"
                    }
                    onClick={() => {
                      setSelectedFilterIndex(actualIndex);
                      if (storedFilters.length < filters.length) {
                        const currentFilters = getValues("filters") || [];
                        const updatedFilters = currentFilters.filter(
                          (filter) => !!filter._id
                        );
                        setValue("filters", updatedFilters);
                      }
                    }}
                    justifyContent="space-between"
                    gap={2}
                  >
                    <Flex alignItems="center" gap={2} flex={1}>
                      <Icon as={EntityEnvironmentIcon} mr={2} />
                      <Text fontSize="sm" fontWeight={500}>
                        {filter.name || "Unnamed Filter"}
                      </Text>
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        ml="auto"
                      >
                        <Switch
                          size="sm"
                          colorScheme="brand"
                          isChecked={filter.enabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateFilterEnabledState(
                              actualIndex,
                              e.target.checked
                            );
                          }}
                        />
                      </Box>
                    </Flex>
                    <Icon
                      as={TrashIcon}
                      color="muted"
                      boxSize={4}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterDelete(filter);
                      }}
                    />
                  </Flex>
                );
              })}
            </Box>
          )}
          {selectedFilter && (
            <VStack
              key={selectedFilterIndex ?? "new-filter"}
              spacing={6}
              align="stretch"
              borderLeft={shouldShowSidebar ? "1px solid" : "unset"}
              borderColor="border.primary"
              w={shouldShowSidebar ? "calc(100% - 250px)" : "100%"}
              px={4}
            >
              {!generalSettingsEnabled && (
                <Text color="orange.400" fontWeight="medium" fontSize="sm">
                  <WarningIcon mr={2} />
                  Filters require Enable Conditional Recording to be enabled in
                  Global Settings
                </Text>
              )}
              <Box
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.primary"
                borderRadius="16px"
                p={4}
              >
                <Flex mb={4} gap={8}>
                  {/* Enable Conditional Recording Section */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={3}>
                      Enabled
                    </Text>
                    <Controller
                      control={control}
                      name={getFieldPath("enabled")}
                      render={({ field }) => (
                        <Switch
                          isChecked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          colorScheme="brand"
                          size="md"
                          mb="10px"
                        />
                      )}
                    />
                  </Box>
                  {/* Filter name */}
                  <FormField
                    name={getFieldPath("name")}
                    label="Filter Name"
                    placeholder="Enter a name for this filter"
                    errors={errors}
                    registerFn={register}
                  />
                </Flex>
                {/* Filter description */}
                <FormField
                  mb={4}
                  name={getFieldPath("description")}
                  label="Description"
                  placeholder="Enter a description for this filter"
                  errors={errors}
                  registerFn={register}
                />
                {/* Sampling Rate Section */}
                <Box mb={2}>
                  <HStack justify="space-between" align="flex-start" mb={3}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Sampling Rate
                      </Text>
                      <Text fontSize="sm" color="muted">
                        Percentage of sessions to record
                      </Text>
                    </Box>

                    <SamplingRateInput
                      control={control}
                      name={getFieldPath("samplingRate")}
                    />
                  </HStack>

                  <FormControl isInvalid={!!samplingRateError}>
                    <Controller
                      control={control}
                      name={getFieldPath("samplingRate")}
                      render={({ field }) => (
                        <Slider
                          value={field.value}
                          onChange={field.onChange}
                          min={0}
                          max={100}
                          step={1}
                          colorScheme="brand"
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      )}
                    />

                    <HStack justify="space-between" mt={2}>
                      <Text fontSize="xs" fontWeight={600} color="neutral">
                        0%
                      </Text>
                      <Text fontSize="xs" fontWeight={600} color="neutral">
                        100%
                      </Text>
                    </HStack>
                  </FormControl>
                </Box>
              </Box>

              <Divider opacity={1} borderBottomColor="border.secondary" />

              {/* Recording Mode */}
              <HStack justify="space-between" alignItems="flex-start">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Recording mode
                  </Text>
                  <Text fontSize="sm" color="muted">
                    Choose how recording starts for sessions.
                  </Text>
                </Box>

                <Controller
                  control={control}
                  name={getFieldPath("mode")}
                  render={({ field }) => (
                    <Select w="200px" borderRadius="6px" size="sm" {...field}>
                      <option value="CONTINUOUS">Continuous</option>
                      <option value="MANUAL">On Demand</option>
                    </Select>
                  )}
                />
              </HStack>

              {/* Start conditions blocks */}
              <Box>
                <Box mb={4}>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Start conditions
                  </Text>
                  <Text fontSize="sm" color="muted">
                    Define key-value pairs to be included with your telemetry
                    data
                  </Text>
                  <Text fontSize="sm" color="muted">
                    (Only items that meet all start conditions will show)
                  </Text>
                </Box>

                <StartFilterBlock
                  control={control}
                  register={register}
                  errors={errors}
                  basePath={
                    selectedFilterIndex !== null
                      ? `filters.${selectedFilterIndex}`
                      : undefined
                  }
                />
              </Box>

              {/* Stop conditions blocks */}
              <Box>
                <Box mb={4}>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Stop conditions
                  </Text>
                  <Text fontSize="sm" color="muted">
                    Define idle time and max time to be included with your
                    telemetry data
                  </Text>
                </Box>
                <Box
                  bg="bg.subtle"
                  border="0.5px solid"
                  borderColor="border.secondary"
                  borderRadius="16px"
                  p={4}
                >
                  <HStack align="stretch" spacing={4}>
                    <FormControl isInvalid={!!stopIdleTimeError}>
                      <FormLabel fontSize="sm">Idle time (seconds)</FormLabel>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...register(getFieldPath("conditions.stop.idleTime"))}
                      />
                    </FormControl>
                    <FormControl isInvalid={!!stopMaxTimeError}>
                      <FormLabel fontSize="sm">Max time (minutes)</FormLabel>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...register(getFieldPath("conditions.stop.maxTime"))}
                      />
                    </FormControl>
                  </HStack>
                </Box>
              </Box>

              {/* What to record block */}
              <WhatToRecordBlock
                control={control}
                watch={watch}
                basePath={
                  selectedFilterIndex !== null
                    ? `filters.${selectedFilterIndex}`
                    : undefined
                }
              />
            </VStack>
          )}
        </>
      ) : (
        <VStack
          spacing={4}
          align="center"
          justify="center"
          minH="400px"
          w="100%"
        >
          <Text fontSize="sm" color="muted" textAlign="center">
            No filters have been created yet.
          </Text>
          <Button
            variant="light"
            color="subtle"
            fontWeight={600}
            onClick={handleAddFilterClick}
          >
            Add a new filter
          </Button>
        </VStack>
      )}
    </>
  );
};

export default RecordingFilters;
