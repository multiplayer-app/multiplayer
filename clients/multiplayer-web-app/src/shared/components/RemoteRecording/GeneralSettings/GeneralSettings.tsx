import { Controller } from "react-hook-form";
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import FormField from "shared/components/FormField";
import SamplingRateInput from "shared/components/RemoteRecording/SamplingRateInput";
import WhatToRecordBlock from "shared/components/RemoteRecording/WhatToRecordBlock";

const GeneralSettings = ({ form }) => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  return (
    <VStack spacing={6} align="stretch" px="2">
      {/* Enable Conditional Recording Section */}
      <Flex gap={4}>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <Switch
              isChecked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              colorScheme="brand"
              size="md"
            />
          )}
        />
        <Text fontSize="sm" fontWeight="medium">
          Enable Conditional Recording
        </Text>
      </Flex>

      {/* Sampling Rate Section */}
      <Box>
        <HStack justify="space-between" align="flex-start" mb={3}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Sampling Rate
            </Text>
            <Text fontSize="sm" color="muted">
              Percentage of sessions to record
            </Text>
          </Box>

          <SamplingRateInput control={control} name="samplingRate" />
        </HStack>

        <Controller
          control={control}
          name="samplingRate"
          render={({ field }) => (
            <Slider
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={100}
              step={1}
              colorScheme="brand"
              mb={2}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          )}
        />

        <HStack justify="space-between">
          <Text fontSize="xs" fontWeight={600} color="neutral">
            0%
          </Text>
          <Text fontSize="xs" fontWeight={600} color="neutral">
            100%
          </Text>
        </HStack>
      </Box>

      {/* Max Conditional Recording Sessions Section */}
      <HStack align="flex-start" mb={4} spacing={6}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={3}>
            Max Conditional Recording Sessions
          </Text>
          <Controller
            control={control}
            name="maxRecordingSessionsEnabled"
            render={({ field }) => (
              <Switch
                isChecked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                colorScheme="brand"
                size="md"
              />
            )}
          />
        </Box>

        <Controller
          control={control}
          name="maxRecordingSessionsEnabled"
          render={({ field: { value } }) =>
            value ? (
              <Box flex={1}>
                <Text color="subtle" fontSize="sm" fontWeight="medium" mb={1}>
                  Enter a value for the maximum recording sessions per day
                </Text>
                <FormField
                  name="maxRemoteSessionRecordings"
                  type="number"
                  label=""
                  placeholder="Enter maximum sessions"
                  errors={errors}
                  registerFn={register}
                  inputProps={{ min: 1, max: 10000 }}
                />
              </Box>
            ) : null
          }
        />
      </HStack>

      {/* Start conditions */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Start conditions
        </Text>
        <Flex gap={4}>
          <Controller
            control={control}
            name="startConditions.startOnError"
            render={({ field }) => (
              <Switch
                isChecked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                colorScheme="brand"
                size="md"
              />
            )}
          />
          <Text fontSize="sm" fontWeight="medium">
            Auto-start on error
          </Text>
        </Flex>
      </Box>

      {/* Stop conditions blocks */}
      <Box>
        <Box mb={4}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Stop conditions
          </Text>
          <Text fontSize="sm" color="muted">
            Define idle time and max time to be included with your telemetry
            data
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
            <FormControl>
              <FormLabel fontSize="sm">Idle time (seconds)</FormLabel>
              <Input
                type="number"
                min={0}
                placeholder="0"
                {...register("stopConditions.idleTime")}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Max time (minutes)</FormLabel>
              <Input
                type="number"
                min={0}
                placeholder="0"
                {...register("stopConditions.maxTime")}
              />
            </FormControl>
          </HStack>
        </Box>
      </Box>

      {/* What to record block */}
      <WhatToRecordBlock control={control} watch={watch} />
    </VStack>
  );
};

export default GeneralSettings;
