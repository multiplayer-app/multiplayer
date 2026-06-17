import { Box, Text, Stack, Heading, Button } from "@chakra-ui/react";
import AuthBox from "shared/components/AuthBox";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRightIcon } from "shared/icons";

import * as AuthService from "shared/services/auth.service";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import FormField from "shared/components/FormField";
import useMessage from "shared/hooks/useMessage";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ shouldFocusError: false, resolver: yupResolver(schema) });
  const message = useMessage();

  const onSubmit = (values: { email: string }) => {
    return new Promise<void>(async (resolve) => {
      try {
        await AuthService.forgotPassword(values);
        navigate("/auth/check-email", {
          state: {
            title: "Check your email!",
            messages: [
              `We’ve sent an email recovery link to ${values.email}. `,
              // "This link will be valid for the next 15 minutes.",
            ],
          },
        });
      } catch (error) {
        message.handleError(error);
      }
      resolve();
    });
  };

  return (
    <AuthBox>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack alignItems="center" textAlign="center" spacing="4" mb="12">
          <Heading as="h5" size="md">
            Reset your password
          </Heading>
          <Text maxW="250px" mx="auto" color="muted" fontSize="md">
            Enter your email and check your inbox afterwards.
          </Text>
        </Stack>
        <Box minH="170">
          <FormField
            name="email"
            type="email"
            label="Your email address"
            placeholder="you@example.com"
            errors={errors}
            registerFn={register}
          />
        </Box>
        <Button
          w="100%"
          type="submit"
          size="lg"
          variant="light"
          isLoading={isSubmitting}
          rightIcon={<ArrowRightIcon />}
        >
          Reset Password
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
  })
  .required();

export default ForgotPassword;
