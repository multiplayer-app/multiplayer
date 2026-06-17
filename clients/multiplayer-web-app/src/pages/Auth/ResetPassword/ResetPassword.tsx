import * as yup from "yup";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation, useNavigate } from "react-router-dom";
import { Text, Stack, Button, Heading } from "@chakra-ui/react";

import AuthBox from "shared/components/AuthBox";
import FormField from "shared/components/FormField";
import { ArrowRightIcon } from "shared/icons";
import * as AuthService from "shared/services/auth.service";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    if (token) {
      setToken(token);
    } else {
      navigate("/auth/registration");
    }
  }, [navigate, location.search]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      await AuthService.setPassword({ password: values.password, token });
      navigate("/auth/login", { state: {} });
    } catch (error) {
      console.log(error);
    }
  };

  return (
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
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            errors={errors}
            registerFn={register}
          />
          <FormField
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Enter your password confirmation"
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
          Continue
        </Button>
      </form>
    </AuthBox>
  );
};

const schema = yup
  .object({
    password: yup.string().required("This field is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Your passwords don't match."),
  })
  .required();

export default ResetPassword;
