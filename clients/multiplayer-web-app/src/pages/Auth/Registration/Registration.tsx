import { Text, Stack, Button, Heading, Link } from "@chakra-ui/react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation, useNavigate } from "react-router-dom";

import AuthBox from "shared/components/AuthBox";
import { ArrowRightIcon } from "shared/icons";

import * as AuthService from "shared/services/auth.service";
import useMessage from "shared/hooks/useMessage";
import { useRedirect } from "shared/hooks/useRedirect";
import FormField from "shared/components/FormField";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const Registration = () => {
  const message = useMessage();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { getRedirect, clearRedirect } = useRedirect();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      email: state?.email || "",
      refUser: state?.refUser || undefined,
    },
  });

  const onSubmit = async (values: {
    email: string;
    refUser: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      await AuthService.signUp(values);
      trackEvent(PostHogEvents.SIGN_UP, {
        email: values.email,
        refUser: values.refUser,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      const redirectTo = getRedirect();

      if (state?.invitation && redirectTo) {
        clearRedirect();
        navigate(redirectTo);
      } else {
        navigate("/auth/check-email", {
          state: {
            title: "Check your email!",
            messages: [
              `We've sent an email confirmation link to ${values.email}. `,
              // "This link will be valid for the next 15 minutes.",
            ],
            actionType: "registration",
            email: values.email,
          },
        });
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <AuthBox>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack alignItems="center" textAlign="center" spacing="4" mb="12">
          <Heading as="h5" size="md">
            Welcome to Multiplayer
          </Heading>
          <Text maxW="240px" mx="auto" color="muted" fontSize="md">
            Also, hey, it’s nice to know you!
          </Text>
        </Stack>
        <Stack minH="170" spacing="4" pb="6">
          <FormField
            name="email"
            type="email"
            label="Your email address"
            placeholder="you@example.com"
            errors={errors}
            registerFn={register}
          />

          <FormField
            name="firstName"
            label="First name"
            placeholder="Enter your first name"
            errors={errors}
            registerFn={register}
          />

          <FormField
            name="lastName"
            label="Last name"
            placeholder="Enter your last name"
            errors={errors}
            registerFn={register}
          />

          <FormField
            name="password"
            type="password"
            label="Choose a password"
            placeholder="Enter your password"
            errors={errors}
            registerFn={register}
          />
        </Stack>
        <Text mb="4" fontSize="sm" color="muted" textAlign="center">
          By continuing, you agree to Multiplayer’s{" "}
          <Link
            fontWeight="bold"
            href="https://www.multiplayer.app/privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            fontWeight="bold"
            href="https://www.multiplayer.app/terms-of-service/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </Link>
        </Text>
        <Button
          w="100%"
          type="submit"
          size="lg"
          variant="light"
          isLoading={isSubmitting}
          rightIcon={<ArrowRightIcon />}
        >
          Sign Up
        </Button>
      </form>
    </AuthBox>
  );
};

const schema = yup
  .object({
    email: yup
      .string()
      .email("Please enter valid email address.")
      .required("This field is required"),
    firstName: yup.string().trim().required("This field is required"),
    lastName: yup.string().trim().required("This field is required"),
    password: yup
      .string()
      .required("This field is required")
      .min(12, "Password must be at least 12 characters long"),
    refUser: yup.string(),
  })
  .required();

export default Registration;
