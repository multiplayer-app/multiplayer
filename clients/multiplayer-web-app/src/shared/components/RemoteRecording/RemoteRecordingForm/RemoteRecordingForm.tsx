import { useCallback, useState } from "react";
import {
  Button,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { useGlobalRecordingSettings } from "shared/hooks/useGlobalRecordingSettings";
import { useRemoteRecordingFilters } from "shared/hooks/useRemoteRecordingFilters";
import { useParams } from "react-router-dom";
import GeneralSettings from "shared/components/RemoteRecording/GeneralSettings";
import RecordingFilters from "shared/components/RemoteRecording/RecordingFilters";
import { useWatch } from "react-hook-form";
import useMessage from "shared/hooks/useMessage";

enum RecordingSettingTabs {
  General,
  Filters,
}

const RemoteRecordingForm = ({ onDiscard, containerRef }) => {
  const { workspaceId, projectId } = useParams();
  const {
    form: generalSettingsForm,
    onSubmit: onGeneralSettingsSubmit,
    reset: onGeneralSettingsReset,
    isLoading: generalSettingsLoading,
  } = useGlobalRecordingSettings(workspaceId, projectId, true);
  const {
    form: filtersForm,
    onSubmit: onFiltersSubmit,
    onDelete: onFiltersDelete,
    reset: onFiltersReset,
    handleAddFilter,
    handleUpdateFilterEnabledState,
    isLoading: filtersLoading,
  } = useRemoteRecordingFilters(workspaceId, projectId, true);
  const [tabIndex, setTabIndex] = useState(RecordingSettingTabs.General);
  const message = useMessage();
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number | null>(
    null
  );

  const {
    formState: { isDirty: isGeneralSettingsDirty },
  } = generalSettingsForm;

  const {
    formState: { isDirty: isFiltersDirty },
  } = filtersForm;

  const onFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (tabIndex === RecordingSettingTabs.General) {
          await onGeneralSettingsSubmit(e);
        } else if (
          tabIndex === RecordingSettingTabs.Filters &&
          selectedFilterIndex !== null
        ) {
          await onFiltersSubmit(selectedFilterIndex)(e);
        }
      } catch (err) {
        message.handleError(err);
      }
    },
    [tabIndex, onGeneralSettingsSubmit, onFiltersSubmit, selectedFilterIndex]
  );

  const onFormDiscard = useCallback(() => {
    onGeneralSettingsReset();
    onFiltersReset();
    onDiscard();
  }, [onGeneralSettingsReset, onFiltersReset, onDiscard]);

  const filters = useWatch({
    control: filtersForm.control,
    name: "filters",
  });

  const generalSettingsEnabled = useWatch({
    control: generalSettingsForm.control,
    name: "enabled",
  });

  const hasStoredFilters = !!filters?.length;

  const shouldShowActions =
    tabIndex !== RecordingSettingTabs.Filters || hasStoredFilters;

  return (
    <form onSubmit={onFormSubmit}>
      <Tabs
        variant="enclosed"
        size="sm"
        colorScheme="brand"
        tabIndex={tabIndex}
        onChange={setTabIndex}
      >
        <TabList mb={4}>
          <Tab whiteSpace="nowrap">Global Settings</Tab>
          <Tab whiteSpace="nowrap">Filters</Tab>
        </TabList>
        <TabPanels maxHeight="60vh" overflowX="auto">
          <TabPanel p={0}>
            <GeneralSettings form={generalSettingsForm} />
          </TabPanel>
          <TabPanel p={0} display="flex" position="relative">
            <RecordingFilters
              form={filtersForm}
              containerRef={containerRef}
              onDelete={onFiltersDelete}
              handleAddFilter={handleAddFilter}
              onSelectedFilterIndexChange={setSelectedFilterIndex}
              generalSettingsEnabled={generalSettingsEnabled}
              updateFilterEnabledState={handleUpdateFilterEnabledState}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      {shouldShowActions && (
        <Flex justifyContent="flex-end" w="full" py={4} gap={4}>
          <Button
            variant="light"
            onClick={onFormDiscard}
            isDisabled={
              tabIndex === RecordingSettingTabs.General
                ? !isGeneralSettingsDirty
                : !isFiltersDirty
            }
          >
            Cancel
          </Button>

          <Button
            backgroundColor="brand.500"
            onClick={onFormSubmit}
            isDisabled={
              tabIndex === RecordingSettingTabs.General
                ? !isGeneralSettingsDirty
                : !isFiltersDirty
            }
            isLoading={
              tabIndex === RecordingSettingTabs.General
                ? generalSettingsLoading
                : filtersLoading
            }
          >
            Save
          </Button>
        </Flex>
      )}
    </form>
  );
};

export default RemoteRecordingForm;
