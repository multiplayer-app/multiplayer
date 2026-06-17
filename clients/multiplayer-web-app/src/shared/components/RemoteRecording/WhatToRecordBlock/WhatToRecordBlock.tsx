import { Controller } from "react-hook-form";
import {
  Box,
  Checkbox,
  Flex,
  HStack,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";

const WhatToRecordBlock = ({
  control,
  watch,
  basePath,
}: {
  control: any;
  watch: any;
  basePath?: string;
}) => {
  const frontendLogsPath = basePath
    ? `${basePath}.recordingOptions.frontend.logs`
    : "recordingOptions.frontend.logs";
  const backendLogsPath = basePath
    ? `${basePath}.recordingOptions.backend.logs`
    : "recordingOptions.backend.logs";
  const frontendLogs = watch(frontendLogsPath);
  const backendLogs = watch(backendLogsPath);

  const getFieldPath = (fieldName: string) => {
    return basePath ? `${basePath}.${fieldName}` : fieldName;
  };
  return (
    <Box>
      <Text fontWeight="semibold" color="body" mb={1}>
        What to record
      </Text>
      <Text fontSize="sm" color="muted" mb={6}>
        Select what you want to record for these users
      </Text>

      <Flex gap={2}>
        <Box width="50%">
          <Text color="body" mb={3} fontWeight={500}>
            Frontend
          </Text>
          <Stack spacing={3}>
            <Controller
              name={getFieldPath("recordingOptions.frontend.screens")}
              control={control}
              render={({ field }) => (
                <Checkbox
                  size="sm"
                  isChecked={field.value}
                  onChange={field.onChange}
                >
                  Screens
                </Checkbox>
              )}
            />
            <Controller
              name={getFieldPath("recordingOptions.frontend.traces")}
              control={control}
              render={({ field }) => (
                <Checkbox
                  size="sm"
                  isChecked={field.value}
                  onChange={field.onChange}
                >
                  Traces
                </Checkbox>
              )}
            />
            <HStack>
              <Controller
                name={getFieldPath("recordingOptions.frontend.logs")}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    size="sm"
                    isChecked={field.value}
                    onChange={field.onChange}
                  >
                    Logs
                  </Checkbox>
                )}
              />

              <Controller
                name={getFieldPath("recordingOptions.frontend.logLevel")}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="xs"
                    width="100px"
                    border="1px solid"
                    borderRadius="8px"
                    borderColor="border.primary"
                    onChange={field.onChange}
                    isDisabled={!frontendLogs}
                  >
                    <option value="info">info</option>
                    <option value="debug">debug</option>
                    <option value="warn">warn</option>
                    <option value="error">error</option>
                  </Select>
                )}
              />
            </HStack>
            <Controller
              name={getFieldPath("recordingOptions.frontend.content")}
              control={control}
              render={({ field }) => (
                <Checkbox
                  size="sm"
                  isChecked={field.value}
                  onChange={field.onChange}
                >
                  Content
                </Checkbox>
              )}
            />
          </Stack>
        </Box>
        <Box width="50%">
          <Text color="body" mb={3} fontWeight={500}>
            Backend
          </Text>
          <Stack spacing={3}>
            <Controller
              name={getFieldPath("recordingOptions.backend.traces")}
              control={control}
              render={({ field }) => (
                <Checkbox
                  size="sm"
                  isChecked={field.value}
                  onChange={field.onChange}
                >
                  Traces
                </Checkbox>
              )}
            />
            <HStack>
              <Controller
                name={getFieldPath("recordingOptions.backend.logs")}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    size="sm"
                    isChecked={field.value}
                    onChange={field.onChange}
                  >
                    Logs
                  </Checkbox>
                )}
              />

              <Controller
                name={getFieldPath("recordingOptions.backend.logLevel")}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="xs"
                    width="100px"
                    border="1px solid"
                    borderRadius="8px"
                    borderColor="border.primary"
                    onChange={field.onChange}
                    isDisabled={!backendLogs}
                  >
                    <option value="info">info</option>
                    <option value="debug">debug</option>
                    <option value="warn">warn</option>
                    <option value="error">error</option>
                  </Select>
                )}
              />
            </HStack>
            <Controller
              name={getFieldPath("recordingOptions.backend.content")}
              control={control}
              render={({ field }) => (
                <Checkbox
                  size="sm"
                  isChecked={field.value}
                  onChange={field.onChange}
                >
                  Content
                </Checkbox>
              )}
            />
          </Stack>
        </Box>
      </Flex>
    </Box>
  );
};

export default WhatToRecordBlock;
