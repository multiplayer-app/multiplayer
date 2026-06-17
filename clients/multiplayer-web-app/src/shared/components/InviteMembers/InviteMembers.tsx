import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import * as yup from "yup";

import membersPreview from "assets/images/members-preview.svg";
import MultiSelect from "shared/components/MultiSelect";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { usePermissions } from "shared/providers/PermissionsContext";

const InviteMembers = ({ onSubmit }) => {
  const { teams } = useWorkspace();
  const { workspaceRoles } = usePermissions();
  const [selectedTeams, setSelectedTeams] = useState([]);
  const { register, formState, setValue, handleSubmit } = useForm({
    resolver: yupResolver(
      yup
        .object({
          email: yup.string().required("This field is required"),
          role: yup.string().required("This field is required"),
        })
        .required()
    ),
    defaultValues: { email: "", role: null },
  });

  const handleSubmission = (data: { email: string; role: string }) => {
    const mergedData = { ...data, teams: selectedTeams };
    onSubmit(mergedData);
  };

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
    <Stack flexDirection={{ base: "column-reverse", md: "row" }}>
      <Stack
        as="form"
        flex="1"
        spacing={0}
        onSubmit={handleSubmit(handleSubmission)}
      >
        <ModalHeader>Invite to your workspace</ModalHeader>
        <ModalBody>
          <Text color="muted" mb="6">
            Invite as many people as you want by entering their email address
            into the next field.
          </Text>
          <FormControl isInvalid={!!formState.errors.email} mb="6">
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

          {teams.data?.length ? (
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
                searchable
                selection={selectedTeams}
                setSelection={setSelectedTeams}
                placeholder="Select teams..."
                options={teams.data.map((i) => ({
                  label: i.name,
                  value: i._id,
                }))}
              />
            </FormControl>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <Button
            w="full"
            type="submit"
            colorScheme="blue"
            isLoading={formState.isSubmitting}
          >
            Send invites
          </Button>
        </ModalFooter>
      </Stack>

      <Flex
        w={{ base: "100%", md: "400px" }}
        minH={{ base: "150px", md: "515px" }}
        h="100%"
        bg="bg.surface"
        borderEndRadius="3xl"
        borderTopRadius={{ base: "3xl", md: "unset" }}
        position="relative"
        alignItems="center"
        justifyContent="center"
      >
        <Image src={membersPreview} w={{ base: "100px", md: "336px" }} />
      </Flex>
    </Stack>
  );
};

export default InviteMembers;
