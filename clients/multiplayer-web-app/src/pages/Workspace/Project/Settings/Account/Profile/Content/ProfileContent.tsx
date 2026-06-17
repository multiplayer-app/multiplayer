import * as yup from "yup";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Flex,
  Text,
  Input,
  Select,
  Avatar,
  Button,
  FormLabel,
  InputGroup,
  FormControl,
  InputRightElement,
} from "@chakra-ui/react";

import FileInput from "shared/components/FileInput";
import FormField from "shared/components/FormField";
import LabelGroup from "shared/components/LabelGroup";
import { CursorClickColorIcon, LockIcon } from "shared/icons";

import useMessage from "shared/hooks/useMessage";
import { useAuth } from "shared/providers/AuthContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import {
  updateWorkspaceUser,
  updateWorkspaceUserAvatar,
} from "shared/services/user.service";

const ProfileContent = ({ data }) => {
  const { user: currentUser } = useAuth();
  const { getWorkspaceUser } = useWorkspace();
  const { color, iconUrl, firstName, timezone } = data;
  const { workspaceId } = useParams();
  const message = useMessage();
  const { register, formState } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: data,
  });

  const handleAvatarChange = async (file: Blob) => {
    try {
      await updateWorkspaceUserAvatar(workspaceId, file);
      getWorkspaceUser(workspaceId);
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleUserInfoChange = async (event) => {
    const { name, value } = event.target;
    const trimmedValue = value.trim();
    if (
      formState.errors[name] ||
      data[name] === trimmedValue ||
      (!data[name] && !trimmedValue)
    ) {
      return;
    }
    try {
      await updateWorkspaceUser(workspaceId, {
        [name]: trimmedValue,
      });
      getWorkspaceUser(workspaceId);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <>
      <Box mb="8">
        <LabelGroup
          mb="4"
          label="Profile picture"
          description="Manage your Multiplayer profile."
        />
        <Flex gap="4">
          <Avatar size="m" bg={color} src={iconUrl} name={firstName} />
          <Button
            w="163px"
            as={FileInput}
            variant="light"
            onUpload={handleAvatarChange}
          >
            Change avatar
          </Button>
        </Flex>
      </Box>
      <FormControl mb="8">
        <FormLabel>Email</FormLabel>
        <InputGroup>
          <Input type="text" defaultValue={currentUser.primaryEmail} readOnly />
          <InputRightElement color="muted" children={<LockIcon />} />
        </InputGroup>
      </FormControl>
      <Flex gap="4" mb="8">
        <FormField
          name="firstName"
          label="First name"
          placeholder="Enter your first name"
          registerFn={register}
          errors={formState.errors}
          onBlur={handleUserInfoChange}
        />
        <FormField
          name="lastName"
          label="Last name"
          placeholder="Enter your last name"
          registerFn={register}
          errors={formState.errors}
          onBlur={handleUserInfoChange}
        />
      </Flex>
      <FormField
        mb="8"
        name="username"
        label="Username"
        placeholder="Enter your username"
        registerFn={register}
        errors={formState.errors}
        onBlur={handleUserInfoChange}
      >
        <Text color="muted" mt="2">
          Pick your nickname or however you want to be called in Multiplayer.
        </Text>
      </FormField>
      <FormField
        mb="8"
        maxW="400px"
        name="color"
        label="Presence Color"
        placeholder="Define the color"
        registerFn={register}
        errors={formState.errors}
        leftElement={<CursorClickColorIcon color={color} />}
        onBlur={handleUserInfoChange}
      >
        <Text color="muted" mt="2">
          Your cursor and actions will be highlighted with this color. Nice one!
        </Text>
      </FormField>
      <FormControl mb="8" maxW="400px">
        <FormLabel>Preferred Timezone</FormLabel>
        <Select defaultValue={timezone}>
          <option>America/New_York</option>
        </Select>
      </FormControl>
    </>
  );
};

const schema = yup
  .object({
    email: yup.string().trim().required("This field is required"),
    firstName: yup.string().trim().required("This field is required"),
    lastName: yup.string().trim().required("This field is required"),
    username: yup.string().trim().required("This field is required"),
    color: yup.string().trim().required("This field is required"),
    timeZone: yup.string().required("This field is required"),
  })
  .required();

export default ProfileContent;
