import MultiSelectFilter from "shared/components/MultiSelectFilter";
import { SEVERITY_OPTIONS } from "pages/Workspace/Project/Issues/Severity";
import DateRangePicker from "shared/components/DateRangePicker/DateRangePicker";
import { Flex } from "@chakra-ui/react";
import { ISSUE_STATUS_OPTIONS } from "shared/utils";
import { useMemo } from "react";

const UserIssueFilters = ({ filters, setFilters }) => {
  const onStatusChange = (selectionKey: string, newSelection: any[]) => {
    setFilters((prev: any) => {
      const newFilters = {
        ...prev,
        skip: 0,
      };
      delete newFilters.resolved;
      delete newFilters.archived;

      newSelection.forEach((status) => {
        if (status.value === "resolved") {
          newFilters.resolved = true;
        } else if (status.value === "archived") {
          newFilters.archived = true;
        }
      });
      return newFilters;
    });
  };

  const currentStatus = useMemo(() => {
    const status = [];
    if (filters.resolved === true) status.push(ISSUE_STATUS_OPTIONS.resolved);
    if (filters.archived === true) status.push(ISSUE_STATUS_OPTIONS.archived);
    return status;
  }, [filters]);

  const onSeverityChange = (selectionKey: string, newSelection: any[]) => {
    setFilters((prev: any) => ({
      ...prev,
      skip: 0,
      severity: newSelection,
    }));
  };

  const onDateRangeChange = (range: any) => {
    setFilters((prev: any) => ({
      ...prev,
      skip: 0,
      lastSeen: range,
    }));
  };

  return (
    <Flex gap="2" alignItems="center" py="2">
      <MultiSelectFilter
        options={Object.values(ISSUE_STATUS_OPTIONS)}
        selection={currentStatus}
        setSelection={onStatusChange}
        selectionKey="status"
        filterName="Status"
      />
      <MultiSelectFilter
        selectionMode="single"
        options={Object.values(SEVERITY_OPTIONS)}
        selection={filters.severity}
        setSelection={onSeverityChange}
        selectionKey="severity"
        filterName="Severity"
      />
      <DateRangePicker
        value={filters.lastSeen}
        onChange={onDateRangeChange}
        placeholder="Time range"
      />
    </Flex>
  );
};

export default UserIssueFilters;
