import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { useWorkspace } from "shared/providers/WorkspaceContext";
import membersPreview from "assets/images/members-preview.svg";
import MultiSelect from "shared/components/MultiSelect";
import { usePermissions } from "shared/providers/PermissionsContext";

const ShareProjectModal = ({ disclosure, onSubmit, teamsWithAccess }) => {
  const { teams } = useWorkspace();
  const { projectRoles } = usePermissions();
  const [selectedTeams, setSelectedTeams] = useState([]);
  const { register, formState, setValue, handleSubmit } = useForm({
    resolver: yupResolver(
      yup
        .object({
          email: yup.string(),
          role: yup.string(),
        })
        .required()
    ),
    defaultValues: { email: "", role: null },
  });

  const roles = useMemo(() => Object.values(projectRoles), [projectRoles]);
  const defaultRole = useMemo(() => roles?.find((r) => r.default), [roles]);

  useEffect(() => {
    if (defaultRole) {
      setValue("role", defaultRole._id);
    }
  }, [defaultRole, setValue]);

  const handleSubmission = (data: { email: string; role: string }) => {
    const mergedData = { ...data, teams: selectedTeams };
    setSelectedTeams([]);
    onSubmit(mergedData);
    disclosure.onClose();
  };

  return (
    <Modal
      size="4xl"
      isCentered
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent
        as="form"
        noValidate
        onSubmit={handleSubmit(handleSubmission)}
        flexDirection={{ base: "column-reverse", md: "row" }}
        mt={{ base: 8, md: 16 }}
      >
        <Stack flex="1" spacing={0}>
          <ModalHeader>Share project</ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" />

          <ModalBody>
            <Text color="muted" mb="6">
              Invite members from this workspace by email or select teams to
              access this project.
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

            <Divider mb="4" />

            {!!teams.data?.length && (
              <FormControl>
                <FormLabel>
                  <Text as="span" color="subtle" fontSize="sm">
                    Share with teams
                  </Text>{" "}
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
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              w="full"
              type="submit"
              colorScheme="blue"
              isLoading={formState.isSubmitting}
            >
              Share
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
      </ModalContent>
    </Modal>
  );
};

export default ShareProjectModal;
