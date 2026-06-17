import {
  Box,
  Text,
  Flex,
  Image,
  Button,
  Heading,
  Link,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import barcode from "assets/images/barcode.svg";

import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import FormField from "shared/components/FormField";
import useMessage from "shared/hooks/useMessage";
import { useAuth } from "shared/providers/AuthContext";
import { applyToken } from "shared/services/tokens.service";
import { useRedirect } from "shared/hooks/useRedirect";

import { ReactComponent as Logo } from "assets/images/logo.svg";
import { ReactComponent as LogoutIcon } from "assets/icons/logout.svg";
import { ReactComponent as LinkedinIcon } from "assets/icons/social-linkedin.svg";
import { ReactComponent as TwitterIcon } from "assets/icons/social-twitter.svg";
import { ReactComponent as DiscordIcon } from "assets/icons/social-discord.svg";

const VerifyInviteCode = () => {
  const message = useMessage();
  const navigate = useNavigate();
  const { user, updateSessions, signOut } = useAuth();
  const { getRedirect, clearRedirect } = useRedirect();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ token }) => {
    const redirectTo = getRedirect();
    try {
      await applyToken(token);

      if (redirectTo) {
        clearRedirect();
        navigate(redirectTo);
      }
      updateSessions();
    } catch (error) {
      message.handleError(error);
    }
  };

  const onCopy = () => {
    try {
      navigator.clipboard.writeText(
        window.location.origin + "/auth?refUser=" + user._id
      );
      message.success("Link successfully copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

  return (
    <Flex
      p="6"
      gap="6"
      w="full"
      h="full"
      alignItems="center"
      flexDirection="column"
      _before={{
        content: '""',
        pointerEvents: "none",
        position: "absolute",

        top: "50%",
        left: "32px",
        right: "32px",
        bottom: 0,
        background: "linear-gradient(90deg, #5047E5 0%, #1AE6F3 100%)",
        opacity: "0.5",
        filter: "blur(125px)",
      }}
    >
      <Flex
        w="full"
        flex="1"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        position="relative"
      >
        <Logo width="80" height="80" color="brand.500" />
        <Heading as="h1" size="lg" mt="2" mb="8" textAlign="center">
          Welcome to Multiplayer!
        </Heading>
        <Text
          color="muted"
          fontSize="sm"
          textAlign="center"
          mb={{ base: "10", md: "4" }}
        >
          We’re glad you’re here. <br />
          If you’ve just signed up, you’ll be receiving an email with more
          information shortly. <br />
          If you’ve received an invite code, enter it below to get started!
        </Text>

        <Flex
          w="full"
          h={{ base: "auto", md: "250px" }}
          my="auto"
          maxW="800px"
          alignItems="stretch"
          direction={{ base: "column", md: "row" }}
        >
          <Box
            bg="brand.500"
            borderStartRadius="3xl"
            padding="14px"
            w={{ base: "full", md: "44px" }}
            h={{ base: "44px", md: "auto" }}
            mb={{ base: "4", md: "0" }}
            position={{ base: "relative", md: "initial" }}
            sx={{
              "@media screen and (max-width: 768px)": {
                display: "none",
              },
            }}
          >
            <Image src={barcode} />
          </Box>
          <Box
            p="6"
            gap="4"
            flex="1"
            bg="bg.primary"
            display="flex"
            flexDir="column"
            borderEndRadius="3xl"
            borderStartRadius={{ base: "3xl", md: 0 }}
            mb={{ base: "4", md: "0" }}
            __css={{
              "@media screen and (min-width: 768px)": {
                maskRepeat: "repeat",
                maskSize: "100% 13px",
                maskImage: `radial-gradient(circle farthest-side at right 8px, transparent 4px, white 4px)`,
              },
            }}
          >
            <Flex
              color="muted"
              justifyContent="space-between"
              fontFamily="PP Neue Machina"
            >
              <Text>SINGLEPLAYER -&gt; MULTIPLAYER</Text>
              <Text
                sx={{
                  "@media screen and (max-width: 768px)": {
                    display: "none",
                  },
                }}
              >
                BOARDING PASS
              </Text>
            </Flex>
            <Box mb="auto">
              <Text
                maxW="280px"
                lineHeight="1.2"
                fontSize="xl"
                fontWeight="500"
                fontFamily="PP Neue Montreal"
              >
                Thank you for joining the waitlist.
              </Text>
            </Box>
            <Text color="muted" fontWeight="medium">
              If you have an invite code, enter it here.
            </Text>
            <Flex
              gap="4"
              as="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              direction={{ base: "column", md: "row" }}
            >
              <FormField
                flex="1"
                name="token"
                placeholder="MPX - 0000000"
                fontFamily="PP Neue Machina"
                errors={errors}
                registerFn={register}
              />
              <Button
                type="submit"
                flex={{ base: "none", md: "1" }}
                isLoading={isSubmitting}
              >
                Enter code
              </Button>
            </Flex>
          </Box>
          <Box
            p="6"
            gap="6"
            w={{ base: "100%", md: "260px" }}
            bg="bg.primary"
            display="flex"
            borderRadius="3xl"
            textAlign="center"
            flexDirection="column"
            __css={{
              "@media screen and (min-width: 768px)": {
                maskImage: `radial-gradient(circle farthest-side at 0 8px, transparent 4px, white 4px)`,
                maskSize: "100% 13px",
                maskRepeat: "repeat",
              },
            }}
          >
            <Text color="muted" fontFamily="PP Neue Machina">
              PRO TIP
            </Text>
            <Text
              fontSize="xl"
              lineHeight="1.2"
              fontWeight="500"
              fontFamily="PP Neue Montreal"
            >
              Refer a friend if you want to move up in the queue!
            </Text>
            <Button mt="auto" w="full" variant="light" onClick={onCopy}>
              Get your referral code
            </Button>
          </Box>
        </Flex>
      </Flex>

      <Flex
        gap="6"
        color="muted"
        alignItems="center"
        position="relative"
        flexDirection="column"
      >
        <Flex justifyContent="center" gap="8">
          <Link
            color="inherit"
            target="_blank"
            rel="noreferrer"
            href="https://www.multiplayer.app/about"
            _hover={{ textDecoration: "none" }}
          >
            About
          </Link>
          <Link
            color="inherit"
            target="_blank"
            rel="noreferrer"
            href="https://www.multiplayer.app/blog/"
            _hover={{ textDecoration: "none" }}
          >
            Blog
          </Link>
          <Link
            color="inherit"
            href="mailto:hello@multiplayer.app"
            _hover={{ textDecoration: "none" }}
          >
            Contact
          </Link>
        </Flex>
        <Flex justifyContent="center" gap="8">
          <Link
            color="inherit"
            target="_blank"
            rel="noreferrer"
            href="https://www.linkedin.com/company/multiplayer-app"
          >
            <LinkedinIcon />
          </Link>
          <Link
            color="inherit"
            target="_blank"
            rel="noreferrer"
            href="https://twitter.com/trymultiplayer"
          >
            <TwitterIcon />
          </Link>
          <Link
            color="inherit"
            target="_blank"
            rel="noreferrer"
            href="https://discord.gg/q9K3mDzfrx"
          >
            <DiscordIcon />
          </Link>
        </Flex>
        <Text>
          {new Date().getFullYear()} Multiplayer © All rights reserved.
        </Text>
      </Flex>
      <Button
        minH="10"
        variant="light"
        justifySelf="flex-end"
        leftIcon={<LogoutIcon />}
        onClick={() => signOut()}
      >
        Log out
      </Button>
    </Flex>
  );
};

const schema = yup
  .object({
    token: yup.string().required("This field is required"),
  })
  .required();

export default VerifyInviteCode;
