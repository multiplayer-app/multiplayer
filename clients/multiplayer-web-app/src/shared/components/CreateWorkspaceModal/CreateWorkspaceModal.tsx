import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  Modal,
  Flex,
  Image,
  Stack,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  FormLabel,
  Textarea,
  FormControl,
  Select,
} from "@chakra-ui/react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import useMessage from "shared/hooks/useMessage";
import FormField from "shared/components/FormField";
import MultiSelect from "shared/components/MultiSelect";
import sidebarPreview from "assets/images/team-modal-preview.png";
import membersPreview from "assets/images/members-preview.svg";
import * as WorkspaceService from "shared/services/workspace.service";
import { useAuth } from "shared/providers/AuthContext";
import { PostHogEvents, Steps } from "shared/models/enums";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import Visibility from "shared/components/Visibility";

interface IFormData {
  [Steps.workspace]: Record<string, any>;
  [Steps.team]: Record<string, any>;
  [Steps.member]: Record<string, any>;
}

const initialFormData: IFormData = {
  [Steps.workspace]: {},
  [Steps.team]: {},
  [Steps.member]: {},
};

const stepSequence: Steps[] = [Steps.workspace, Steps.team, Steps.member];

const CreateWorkspaceModal = ({
  isOpen,
  isClosable,
  onClose,
}: {
  isOpen: boolean;
  isClosable: boolean;
  onClose: (response: any) => void;
}) => {
  const [currentStep, setCurrentStep] = useState(Steps.workspace);
  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = (step: Steps, payload: unknown) => {
    const next = { ...formData, [step]: payload };
    setFormData(next);
    if (step === Steps.member) {
      onClose(next);
      return;
    }
    setCurrentStep(stepSequence[stepSequence.indexOf(currentStep) + 1]);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setCurrentStep(Steps.workspace);
  };

  const RenderStep = ({
    step,
    index,
    formData,
    onSubmit,
  }: {
    step: Steps;
    index: number;
    formData: IFormData;
    onSubmit: (step: Steps, payload: unknown) => void;
  }) => {
    switch (step) {
      case Steps.workspace:
        return <SetupWorkspace onSubmit={onSubmit} index={index} />;
      case Steps.team:
        return (
          <SetupTeam formData={formData} onSubmit={onSubmit} index={index} />
        );
      case Steps.member:
        return (
          <InviteMembers
            formData={formData}
            onSubmit={onSubmit}
            index={index}
          />
        );
    }
  };

  return (
    <Modal
      size="4xl"
      isOpen={isOpen}
      onCloseComplete={handleReset}
      onClose={() => onClose(formData)}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent flexDirection="row">
        {isClosable && <ModalCloseButton color="muted" zIndex="2" />}
        <RenderStep
          index={stepSequence.indexOf(currentStep) + 1}
          step={currentStep}
          formData={formData}
          onSubmit={handleSubmit}
        />
      </ModalContent>
    </Modal>
  );
};

const SetupWorkspace = ({
  onSubmit,
  index,
}: {
  onSubmit: (step: Steps, payload: unknown) => void;
  index: number;
}) => {
  const { updateSessions } = useAuth();
  const { trackEvent } = useAnalytics();
  const message = useMessage();
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schemas[Steps.workspace]),
    defaultValues: { name: "" },
  });

  const val = watch();

  const onValidSubmit = async (values) => {
    try {
      const name = values.name.trim();
      const body = {
        name,
        handle: `${name.replace(/\s/g, "-").toLowerCase()}`,
      };
      const res = await WorkspaceService.createWorkspace(body);
      await updateSessions();

      trackEvent(PostHogEvents.CREATE_WORKSPACE, {
        workspaceName: name,
        actionSource: "Workspace -> Create workspace",
      });

      onSubmit(Steps.workspace, res);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <>
      <Stack
        flex="1"
        as="form"
        noValidate
        spacing={0}
        onSubmit={handleSubmit(onValidSubmit)}
      >
        <ModalHeader>
          <Text fontSize="sm" color="muted">
            {index}/{stepSequence.length}
          </Text>
          Welcome to Multiplayer!
        </ModalHeader>

        <ModalBody>
          <Text color="muted" mt="8" mb="12">
            We have automatically created a default workspace for you. You may
            change the name, or create another workspace later.
          </Text>
          <FormField
            mb="12"
            name="name"
            label="Workspace name"
            placeholder="Enter workspace name"
            inputProps={{ autoFocus: true }}
            errors={errors}
            registerFn={register}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            w="full"
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
          >
            Continue
          </Button>
        </ModalFooter>
      </Stack>
      <Visibility hideBelow="md">
        <SidePreview workspace={val.name} />
      </Visibility>
    </>
  );
};

const SetupTeam = ({
  onSubmit,
  formData,
  index,
}: {
  onSubmit: (step: Steps, payload: unknown) => void;
  formData: IFormData;
  index: number;
}) => {
  const message = useMessage();
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schemas[Steps.team]),
    defaultValues: { name: "" },
  });

  const val = watch();

  const onValidSubmit = async (values) => {
    try {
      const name = values.name.trim();
      const body = { name };
      const res = await WorkspaceService.createTeam(formData.workspace._id, body);
      onSubmit(Steps.team, res);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <>
      <Stack
        flex="1"
        as="form"
        noValidate
        spacing={0}
        onSubmit={handleSubmit(onValidSubmit)}
      >
        <ModalHeader>
          <Text fontSize="sm" color="muted">
            {index}/{stepSequence.length}
          </Text>
          Set-up your first team
        </ModalHeader>

        <ModalBody>
          <Text color="muted" mt="8" mb="12">
            You now get to name your first team.
          </Text>
          <FormField
            mb="12"
            name="name"
            label="Team name"
            inputProps={{ autoFocus: true }}
            placeholder="Enter team name"
            errors={errors}
            registerFn={register}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            w="full"
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting}
          >
            Continue
          </Button>
        </ModalFooter>
      </Stack>

      <Visibility hideBelow="md">
        <SidePreview team={val.name} workspace={formData.workspace.name} />
      </Visibility>
    </>
  );
};

const InviteMembers = ({
  onSubmit,
  formData,
  index,
}: {
  onSubmit: (step: Steps, payload: unknown) => void;
  formData: IFormData;
  index: number;
}) => {
  const message = useMessage();
  const { trackEvent } = useAnalytics();
  const { workspaceRoles } = usePermissions();
  const [selectedTeams, setSelectedTeams] = useState([
    { label: formData.team.name, value: formData.team._id },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, setValue, handleSubmit } = useForm({
    resolver: yupResolver(schemas[Steps.member]),
    defaultValues: { email: "", role: null },
  });

  const onValidSubmit = async (values) => {
    const emails = values.email
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    setIsLoading(true);

    if (emails.length) {
      try {
        const res = await WorkspaceService.inviteWorkspaceMembers(
          formData.workspace._id,
          {
            emails,
            teams: selectedTeams?.map((i) => i.value),
            role: values.role,
          }
        );

        trackEvent(PostHogEvents.INVITE_USERS, {
          emails,
          role: workspaceRoles && workspaceRoles[values.role]?.name,
          teams: selectedTeams?.map((i) => i.label),
          actionSource: "Workspace -> Create workspace",
        });
        onSubmit(Steps.member, res);
      } catch (error) {
        message.handleError(error);
      }
      setIsLoading(false);
    } else {
      onSubmit(Steps.member, null);
      setIsLoading(false);
    }
  };

  const teamsData = useMemo(
    () => [
      {
        label: formData.team.name,
        value: formData.team._id,
        disabled: true,
      },
    ],
    [formData.team._id, formData.team.name]
  );

  const roles = useMemo(
    () => Object.values(workspaceRoles).filter((r) => !r.workspaceOwner),
    [workspaceRoles]
  );
  const defaultRole = useMemo(() => roles?.find((r) => r.default), [roles]);

  useEffect(() => {
    if (defaultRole) {
      setValue("role", defaultRole._id);
    }
  }, [defaultRole, setValue]);

  return (
    <>
      <Stack
        flex="1"
        spacing={0}
        as="form"
        onSubmit={handleSubmit(onValidSubmit)}
      >
        <ModalHeader>
          <Text fontSize="sm" color="muted">
            {index}/{stepSequence.length}
          </Text>
          Invite your teammates
        </ModalHeader>
        <ModalBody>
          <Text color="muted" mt="5" mb="30px" fontSize="sm">
            Multiplayer is all about working together. Invite people to
            collaborate in the {formData.team.name} team you have just created.
          </Text>
          <FormControl mb="6">
            <FormLabel>Email</FormLabel>
            <Textarea
              pb={2.5}
              pt={2.5}
              rows={2}
              fontSize="sm"
              resize="none"
              placeholder="email@example.com, emailtwo@example.com"
              {...register("email")}
            />
          </FormControl>

          <FormControl mb="6">
            <FormLabel>Select role</FormLabel>
            <Select name="role" size="sm" {...register("role")}>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>
              <Text as="span" color="subtle" fontSize="sm">
                Add to team
              </Text>{" "}
              <Text as="span" color="muted" fontSize="sm">
                (optional)
              </Text>
            </FormLabel>
            <MultiSelect
              setSelection={setSelectedTeams}
              selection={selectedTeams}
              placeholder="Select teams..."
              options={teamsData}
              searchable
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            w="full"
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
          >
            Done
          </Button>
        </ModalFooter>
      </Stack>

      <Visibility hideBelow="md">
        <Flex
          w="400px"
          minH="515px"
          h="100%"
          bg="bg.surface"
          borderEndRadius="3xl"
          position="relative"
          alignItems="center"
          justifyContent="center"
        >
          <Image src={membersPreview} w="336px" />
        </Flex>
      </Visibility>
    </>
  );
};

const SidePreview = ({ team = "", workspace = "" }) => {
  return (
    <Flex
      w="400px"
      minH="515px"
      h="100%"
      bg="bg.surface"
      borderEndRadius="3xl"
      position="relative"
      alignItems="flex-end"
      justifyContent="flex-end"
    >
      <Image src={sidebarPreview} w="336px" borderBottomRightRadius="3xl" />
      <Flex
        w="240px"
        top="90px"
        left="80px"
        alignItems="center"
        position="absolute"
      >
        <Box mr="2" bg="brand.500" boxSize="30px" borderRadius="base"></Box>
        {workspace ? (
          <Text flex="1" noOfLines={2}>
            {workspace}
          </Text>
        ) : (
          <Box h="14px" w="85px" bg="bg.muted" borderRadius="30px"></Box>
        )}
      </Flex>
      <Flex
        w="240px"
        left="80px"
        bottom="150px"
        alignItems="center"
        position="absolute"
      >
        <Box mr="2" bg="bg.muted" boxSize="30px" borderRadius="base"></Box>
        {team ? (
          <Text flex="1" noOfLines={2}>
            {team}
          </Text>
        ) : (
          <Box h="14px" w="95px" bg="bg.muted" borderRadius="30px"></Box>
        )}
      </Flex>
    </Flex>
  );
};

const schemas = {
  [Steps.workspace]: yup
    .object({ name: yup.string().required("This field is required") })
    .required(),
  [Steps.team]: yup
    .object({ name: yup.string().required("This field is required") })
    .required(),
  [Steps.member]: yup
    .object({
      email: yup.string(),
      role: yup.string().when("email", {
        is: (value: string) => value && value.length > 0,
        then: (schema) => schema.required("This field is required"),
        otherwise: (schema) => schema,
      }),
    })
    .required(),
};

export default CreateWorkspaceModal;
