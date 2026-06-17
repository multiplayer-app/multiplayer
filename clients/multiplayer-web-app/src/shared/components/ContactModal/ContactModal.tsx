import { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Icon,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Textarea,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import * as FeedbackService from "shared/services/feedback.service";
import { yupResolver } from "@hookform/resolvers/yup/dist/yup";

import useMessage from "shared/hooks/useMessage";

import particlesImage from "assets/images/success-particles.png";
import { CheckCircleFilledIcon } from "shared/icons";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const ContactModal = ({ disclosure }: { disclosure: UseDisclosureReturn }) => {
  const toastMessage = useMessage();
  const { trackEvent } = useAnalytics();
  const [successMessageVisible, setSuccessMessageVisible] = useState(false);

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onValidSubmit = async ({ subject, message }) => {
    try {
      await FeedbackService.sendFeedback({ subject, message });
      trackEvent(PostHogEvents.SUPPORT_REQUEST, {});
      reset();
      setSuccessMessageVisible(true);
    } catch (error) {
      toastMessage.handleError(error);
    }
  };

  const onClose = () => {
    disclosure.onClose();
    setSuccessMessageVisible(false);
  };

  return (
    <Modal
      size="4xl"
      isCentered={true}
      motionPreset="slideInBottom"
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent borderRadius="3xl">
        {!successMessageVisible ? (
          <Stack as="form" onSubmit={handleSubmit(onValidSubmit)} noValidate>
            <ModalHeader bg="bg.surface" borderTopRadius="3xl" mb={4}>
              Get in touch with us
            </ModalHeader>
            <ModalCloseButton color="muted" zIndex="2" />
            <ModalBody>
              <FormControl mb="6" isInvalid={!!errors.subject}>
                <FormLabel>Subject</FormLabel>
                <Input
                  autoFocus
                  fontSize="sm"
                  resize="none"
                  placeholder="Enter your subject here.."
                  {...register("subject")}
                />
              </FormControl>
              <FormControl mb="6" isInvalid={!!errors.message}>
                <FormLabel>Message</FormLabel>
                <Textarea
                  pb={2.5}
                  pt={2.5}
                  rows={3}
                  fontSize="sm"
                  resize="none"
                  placeholder="Enter your message here..."
                  {...register("message")}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                px="45px"
                type="submit"
                colorScheme="blue"
                isLoading={isSubmitting}
              >
                Send message
              </Button>
            </ModalFooter>
          </Stack>
        ) : (
          <Stack alignItems="center" pb={84}>
            <Image src={particlesImage} w="100" borderBottomRightRadius="3xl" />
            <ModalCloseButton color="muted" zIndex="2" />
            <ModalBody>
              <Stack
                bg="brand.500"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                mb={6}
                w={16}
                h={16}
                borderRadius={16}
              >
                <Icon
                  as={CheckCircleFilledIcon}
                  color="inverse"
                  w={38}
                  h={38}
                />
              </Stack>
              <Text
                fontSize="xl"
                fontWeight="semibold"
                color="subtle"
                mb={4}
                textAlign="center"
              >
                Your message was successfully sent.
              </Text>
              <Text fontSize="sm" color="muted" textAlign="center">
                Someone from our team will get back to you as soon as possible.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button px="45px" w={268} colorScheme="blue" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </Stack>
        )}
      </ModalContent>
    </Modal>
  );
};

const schema = yup
  .object({
    subject: yup.string().required("This field is required"),
    message: yup.string().required("This field is required"),
  })
  .required();

export default ContactModal;
