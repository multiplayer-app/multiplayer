import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Text, Stack, Button, Heading } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "shared/providers/AuthContext";
import useMessage from "shared/hooks/useMessage";
import { useRedirect } from "shared/hooks/useRedirect";
import AuthBox from "shared/components/AuthBox";
import FormField from "shared/components/FormField";
import * as AuthService from "shared/services/auth.service";
import { ArrowRightIcon } from "shared/icons";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const Login = () => {
  const message = useMessage();
  const { signIn } = useAuth();
  const { navigateToRedirect } = useRedirect();
  const { trackEvent, identifyPosthogUser } = useAnalytics();

  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues: { password: "", email: location.state?.email || "" },
  });

  const onSubmit = async (values: { email: string; password: string }) => {
    try {
      await AuthService.signIn(values);
      const user = await signIn(values.email);
      const { _id, firstName, lastName, primaryEmail } = user;

      trackEvent(PostHogEvents.SIGN_IN, {
        _id,
        lastName,
        firstName,
        primaryEmail,
        email: primaryEmail,
      });

      identifyPosthogUser({
        id: _id,
        lastName,
        firstName,
        email: primaryEmail,
        signInMethod: "emailLogin",
      });

      navigateToRedirect("/");
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <>
      <AuthBox>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack alignItems="center" textAlign="center" spacing="4" mb="12">
            <Heading as="h5" size="md">
              Welcome back
            </Heading>
            <Text maxW="224px" mx="auto" color="muted" fontSize="md">
              We'll create an account if you don't have one already.
            </Text>
          </Stack>

          <Stack minH="170" spacing="4">
            <FormField
              name="email"
              type="email"
              label="Your email address"
              placeholder="you@example.com"
              errors={errors}
              registerFn={register}
            />
            <FormField
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              errors={errors}
              registerFn={register}
            />
          </Stack>
          <Button
            w="100%"
            type="submit"
            size="lg"
            variant="light"
            isLoading={isSubmitting}
            rightIcon={<ArrowRightIcon />}
          >
            Sign In
          </Button>
        </form>
      </AuthBox>
      <Link to="/auth/forgot-password">Forgot password?</Link>
    </>
  );
};

const schema = yup
  .object({
    email: yup
      .string()
      .email("Please enter valid email address.")
      .required("This field is required"),
    password: yup.string().required("This field is required"),
  })
  .required();

export default Login;
