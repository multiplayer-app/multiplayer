import { Box, Text, Stack, Button, Heading } from "@chakra-ui/react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { ArrowRightIcon } from "shared/icons";
import AuthBox from "shared/components/AuthBox";
import { useLocation, useNavigate } from "react-router-dom";
import * as AuthService from "shared/services/auth.service";
import FormField from "shared/components/FormField";

const CheckEmail = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values: { email: string }) => {
    try {
      await AuthService.getAuthType(values);
      navigate("/auth/login", { state: { ...values, ...state } });
    } catch (error) {
      navigate("/auth/registration", { state: { ...values, ...state } });
    }
  };

  return (
    <AuthBox>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack alignItems="center" textAlign="center" spacing="4" mb="12">
          <Heading as="h5" size="md">
            Welcome to Multiplayer
          </Heading>
          <Text maxW="224px" mx="auto" color="muted" fontSize="md">
            We'll create an account if you don't have one already.
          </Text>
        </Stack>
        <Box h="170">
          <FormField
            name="email"
            type="email"
            errors={errors}
            label="Your email address"
            placeholder="you@example.com"
            inputProps={{ autoFocus: true }}
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
          Continue
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

export default CheckEmail;
