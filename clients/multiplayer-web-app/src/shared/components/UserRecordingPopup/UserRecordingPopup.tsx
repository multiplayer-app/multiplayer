import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  RadioGroup,
  Stack,
  Radio,
  Input,
  HStack,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useParams } from "react-router-dom";
import {
  EndUserType,
  SessionRecordingNextRecordType,
} from "@multiplayer/types";
import { EndUserRecordingSettings } from "shared/models/interfaces";
import { useEffect, useMemo, useState } from "react";
import { useUsers } from "shared/providers/UsersContext";
import { useUser } from "shared/providers/UserContext";

interface IUserRecordingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: EndUserType;
  online?: boolean;
  selectedIds?: string[];
}

const schema = yup.object().shape({
  whenToRecord: yup
    .string()
    .oneOf(Object.values(SessionRecordingNextRecordType))
    .required(),
  timesActive: yup.number().when("whenToRecord", {
    is: SessionRecordingNextRecordType.N_TIMES_WHEN_ACTIVE,
    then: (schema) => schema.required("Required").min(1, "Must be at least 1"),
    otherwise: (schema) => schema.notRequired(),
  }),
  frontend: yup.boolean(),
  backend: yup.boolean(),
  logs: yup.boolean(),
  logLevel: yup
    .string()
    .oneOf(["debug", "info", "warn", "error"])
    .when("logs", {
      is: true,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  content: yup.boolean(),
});

type FormValues = {
  whenToRecord: SessionRecordingNextRecordType;
  timesActive?: number;
  frontend?: boolean;
  backend?: boolean;
  logs?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
  content?: boolean;
};

const UserRecordingPopup = ({
  isOpen,
  onClose,
  selectedIds,
  type,
  online,
}: IUserRecordingPopupProps) => {
  const { workspaceId, projectId, path } = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const { users, updateUsersRecordingSettings } = useUsers();
  const { user, refetchUser } = useUser();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isValid, isDirty },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      whenToRecord: SessionRecordingNextRecordType.ONCE_WHEN_ACTIVE,
      timesActive: 1,
      frontend: false,
      backend: false,
      logs: false,
      logLevel: "info",
      content: false,
    },
  });

  const usersList = useMemo(() => {
    if (path && user?.data) {
      return [user.data];
    }
    return users?.data;
  }, [path, users, user]);

  useEffect(() => {
    if (!usersList?.length) return;
    if (selectedIds?.length !== 1) return;

    const selectedUser = usersList.find((user) => user._id === selectedIds[0]);

    if (!selectedUser?.conditionalRecordingSettings) return;

    const { whenToRecord, sessionRecordingsLimit } =
      selectedUser.conditionalRecordingSettings;

    reset(
      {
        whenToRecord:
          whenToRecord || SessionRecordingNextRecordType.ONCE_WHEN_ACTIVE,
        timesActive: sessionRecordingsLimit || 1,
        frontend: false,
        backend: false,
        logs: false,
        logLevel: "info",
        content: false,
      },
      { keepDirty: false }
    );
  }, [users, selectedIds, reset, user, path]);

  const whenToRecord = watch("whenToRecord");

  const onPopupClose = () => {
    setIsSaving(false);
    reset();
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);

    const payload: EndUserRecordingSettings = {
      whenToRecord: data.whenToRecord,
      sessionRecordingsLimit:
        data.whenToRecord === SessionRecordingNextRecordType.N_TIMES_WHEN_ACTIVE
          ? data.timesActive
          : 0,
    };

    try {
      await updateUsersRecordingSettings(selectedIds, payload);

      if (path && refetchUser) {
        await refetchUser();
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="24px">
        <ModalHeader borderTopRadius="24px" bg="bg.surface" padding="24px">
          <VStack gap={4} alignItems="start">
            <Text>User recording</Text>
            {selectedIds.length > 1 && (
              <Text
                fontSize="12px"
                color="muted"
                fontWeight={500}
                backgroundColor="bg.subtle"
                borderRadius="6px"
                px="1"
              >
                {selectedIds.length}{" "}
                {type === EndUserType.USER ? "users" : "API clients"} selected
              </Text>
            )}
          </VStack>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          {/* WHEN TO RECORD */}
          <Box mb={6}>
            <Text fontWeight="semibold" color="body" mb={1}>
              When to record
            </Text>
            <Text fontSize="sm" color="muted" mb={3}>
              Pick how you want to record sessions for the selected users
            </Text>

            <Controller
              name="whenToRecord"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field}>
                  <Stack spacing={3}>
                    <Radio
                      size="sm"
                      colorScheme="brand"
                      value={SessionRecordingNextRecordType.NO_AUTO_START}
                    >
                      Manual only
                    </Radio>

                    <Radio
                      size="sm"
                      colorScheme="brand"
                      value={SessionRecordingNextRecordType.ONCE_WHEN_ACTIVE}
                    >
                      Only next time they’re active
                    </Radio>

                    <HStack align="center">
                      <Radio
                        size="sm"
                        colorScheme="brand"
                        value={
                          SessionRecordingNextRecordType.N_TIMES_WHEN_ACTIVE
                        }
                      >
                        The next
                      </Radio>
                      <Controller
                        name="timesActive"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            width="45px"
                            size="xs"
                            type="number"
                            border="1px solid"
                            borderRadius="8px"
                            borderColor="border.primary"
                            isDisabled={
                              whenToRecord !==
                              SessionRecordingNextRecordType.N_TIMES_WHEN_ACTIVE
                            }
                          />
                        )}
                      />
                      <Text color="body" fontSize="14px">
                        times they are active
                      </Text>
                    </HStack>

                    <Radio
                      size="sm"
                      colorScheme="brand"
                      value={SessionRecordingNextRecordType.ALWAYS_WHEN_ACTIVE}
                    >
                      Every time they are active
                    </Radio>
                  </Stack>
                </RadioGroup>
              )}
            />
          </Box>

          {/* WHAT TO RECORD */}
          {/*<Box>
            <Text fontWeight="semibold" color="body" mb={1}>
              What to record
            </Text>
            <Text fontSize="sm" color="muted" mb={3}>
              Select what you want to record for these users
            </Text>

            <Stack spacing={3}>
              <Controller
                name="frontend"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    size="sm"
                    isChecked={field.value}
                    onChange={field.onChange}
                  >
                    Frontend screens
                  </Checkbox>
                )}
              />

              <Controller
                name="backend"
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
                  name="logs"
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
                  name="logLevel"
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
                      isDisabled={!logs}
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
                name="content"
                control={control}
                render={({ field }) => (
                  <Checkbox size="sm" isChecked={field.value}>
                    Content
                  </Checkbox>
                )}
              />
            </Stack>
          </Box>*/}
        </ModalBody>

        <ModalFooter justifyContent="flex-end" p={6} gap={2}>
          <Button variant="outline" onClick={onPopupClose}>
            Cancel
          </Button>
          <Flex gap={2} alignItems="center">
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={isSaving}
              isDisabled={!isValid || !isDirty}
            >
              Save
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserRecordingPopup;
