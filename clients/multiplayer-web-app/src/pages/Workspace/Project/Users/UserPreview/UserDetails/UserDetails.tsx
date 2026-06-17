import { Box, BoxProps, HStack, StackProps, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import MonoText from "shared/components/MonoText";
import { useUser } from "shared/providers/UserContext";
import { userTypesToNameMap } from "shared/utils";

const UserDetails = (props: StackProps) => {
  const { user } = useUser();
  return (
    <VStack p="4" gap="4" w="full" align="stretch" {...props}>
      <UserDetailsContent user={user} />
    </VStack>
  );
};

export const UserDetailsContent = ({ user }: { user: any }) => {
  const details = user?.data;
  return (
    <>
      {details?.attributes && (
        <>
          <DetailItem
            label="Organization:"
            value={details.attributes.orgName}
          />
          <DetailItem label="Email:" value={details.attributes.userEmail} />
          <DetailItem
            label="User ID:"
            value={details.attributes.userId || details.attributes.id}
          />
          <DetailItem label="Name:" value={details.attributes.name} />
          <DetailItem label="UserName:" value={details.attributes.userName} />
          <DetailItem
            label="Environment:"
            value={
              details.attributes.environment ||
              details.attributes.environmentSlug
            }
          />
          <DetailItem
            label="Type:"
            value={userTypesToNameMap[details.attributes.type]}
          />
        </>
      )}
    </>
  );
};

const DetailItem = ({
  label,
  value,
  ...rest
}: {
  label: string;
  value: ReactNode;
} & BoxProps) => {
  return (
    <HStack justify="space-between" gap="8" align="flex-start">
      <Box color="muted">{label}</Box>
      <MonoText
        flex="1"
        textAlign="right"
        wordBreak="break-word"
        whiteSpace="normal"
        {...rest}
      >
        {value || "n/a"}
      </MonoText>
    </HStack>
  );
};

export default UserDetails;
