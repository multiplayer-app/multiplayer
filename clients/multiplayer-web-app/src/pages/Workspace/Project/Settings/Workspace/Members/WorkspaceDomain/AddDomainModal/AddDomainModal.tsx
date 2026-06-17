import {
  Flex,
  Text,
  Stack,
  Modal,
  Button,
  HStack,
  PinInput,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  ModalContent,
  PinInputField,
  ModalCloseButton,
  Icon,
} from "@chakra-ui/react";
import * as yup from "yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import useMessage from "shared/hooks/useMessage";
import FormField from "shared/components/FormField";
import * as WorkspaceService from "shared/services/workspace.service";
import { ReactComponent as Ellipse } from "assets/images/ellipse.svg";

enum Steps {
  ADD = 1,
  CONFIRM = 2,
}

const AddDomainModal = ({ workspaceId, isOpen, onClose }) => {
  const [step, setStep] = useState(Steps.ADD);
  const [formValues, setFormValues] = useState({
    email: "",
    domain: "",
  });

  const handleSubmit = (
    stepNumber: Steps,
    payload: { domain: string; email: string }
  ) => {
    if (stepNumber === Steps.ADD) {
      setFormValues(payload);
      setStep(Steps.CONFIRM);
    } else {
      onClose(true);
      setStep(Steps.ADD);
    }
  };

  return (
    <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        flexDirection={{ base: "column-reverse", md: "row" }}
        mt={{ base: 8, md: 16 }}
      >
        <Stack flex="1" spacing={0}>
          <ModalHeader>
            <Text fontSize="xs" color="muted">
              VERIFY DOMAIN
            </Text>
            Verify the domain name
          </ModalHeader>

          <ModalCloseButton color="muted" zIndex="2" />
          {step === Steps.ADD ? (
            <AddDomain workspaceId={workspaceId} onComplete={handleSubmit} />
          ) : step === Steps.CONFIRM ? (
            <ConfirmCode
              formValues={formValues}
              workspaceId={workspaceId}
              onComplete={handleSubmit}
              setStep={setStep}
            />
          ) : null}
        </Stack>
        <Flex
          h="100%"
          w={{ base: "100%", md: "400px" }}
          minH={{ base: "150px", md: "515px" }}
          bg="bg.surface"
          borderEndRadius="3xl"
          borderTopRadius={{ base: "3xl", md: "unset" }}
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={Ellipse} boxSize={{ base: 100, md: 240 }} />
        </Flex>
      </ModalContent>
    </Modal>
  );
};

const AddDomain = ({ workspaceId, onComplete }) => {
  const message = useMessage();

  const { register, handleSubmit, formState } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
    defaultValues: { domain: "", email: "" },
  });

  const onSubmit = async (values) => {
    try {
      await WorkspaceService.addWorkspaceDomain(workspaceId, values);
      onComplete(Steps.ADD, values);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Stack
      flex="1"
      as="form"
      noValidate
      spacing={0}
      onSubmit={handleSubmit(onSubmit)}
    >
      <ModalBody>
        <Text mb="2" color="muted">
          Enter the domain name
        </Text>
        <FormField
          mb="12"
          name="domain"
          placeholder="example.com"
          registerFn={register}
          errors={formState.errors}
        />
        <Text mb="2" color="muted">
          Enter an email address that you have access to receive the 4-digit
          code to validate the domain.
        </Text>
        <FormField
          mb="12"
          name="email"
          placeholder="Enter the email address"
          registerFn={register}
          errors={formState.errors}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          w="full"
          type="submit"
          colorScheme="blue"
          isLoading={formState.isSubmitting}
        >
          Send email
        </Button>
      </ModalFooter>
    </Stack>
  );
};

const ConfirmCode = ({ workspaceId, onComplete, formValues, setStep }) => {
  const message = useMessage();
  const [code, setCode] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!code) return;
    setIsSubmitting(true);
    try {
      await WorkspaceService.confirmWorkspaceDomain(workspaceId, { code });
      onComplete(Steps.CONFIRM);
    } catch (error) {
      message.handleError(error);
    }
    setIsSubmitting(false);
  };

  const startCountdown = (): void => {
    setSeconds(30);

    const interval = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds > 1) {
          return prevSeconds - 1;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);
  };

  const resendCode = async () => {
    try {
      await WorkspaceService.addWorkspaceDomain(workspaceId, formValues);
      startCountdown();
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Stack flex="1" spacing={0}>
      <ModalBody>
        <Text color="muted">Enter the 4-digit code we just sent to</Text>
        <Text mb="2" color="body">
          {formValues?.email}.
        </Text>

        <HStack mb={14}>
          <PinInput size="lg" placeholder="" onComplete={setCode}>
            <PinInputField flex="1" fontSize="4xl" fontWeight="700" h="80px" />
            <PinInputField flex="1" fontSize="4xl" fontWeight="700" h="80px" />
            <PinInputField flex="1" fontSize="4xl" fontWeight="700" h="80px" />
            <PinInputField flex="1" fontSize="4xl" fontWeight="700" h="80px" />
          </PinInput>
        </HStack>
        {seconds === 0 ? (
          <Button
            variant="outline"
            onClick={resendCode}
            borderRadius="30px"
            px={10}
            m="0 auto"
            fontSize="md"
            display="flex"
            isDisabled={isSubmitting}
          >
            Resend code
          </Button>
        ) : (
          <Text textAlign="center">
            We've sent the code to your email. <br />
            You can resend it in {seconds} seconds if needed.
          </Text>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => setStep(Steps.ADD)}
          isDisabled={isSubmitting}
          mr={2}
        >
          Back
        </Button>
        <Button
          w="full"
          colorScheme="blue"
          onClick={onSubmit}
          isLoading={isSubmitting}
        >
          Verify Code
        </Button>
      </ModalFooter>
    </Stack>
  );
};

const schema = yup
  .object({
    domain: yup.string().required("This field is required"),
    email: yup
      .string()
      .email("Please enter valid email address.")
      .required("This field is required"),
  })
  .required();

export default AddDomainModal;
