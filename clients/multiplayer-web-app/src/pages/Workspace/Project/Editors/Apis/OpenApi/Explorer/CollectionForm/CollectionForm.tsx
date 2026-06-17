import * as yup from "yup";
import { Box } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import FormField from "shared/components/FormField";
import { TagObjectType } from "shared/models/openApi.types";

interface CollectionFormProps {
  onSubmit: (data: TagObjectType) => Promise<void>;
}

const CollectionForm = ({ onSubmit }: CollectionFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onValidSubmit = ({ name }) => {
    return onSubmit({ name, description: name });
  };

  return (
    <Box
      px="4"
      pt="4"
      pb="1"
      as="form"
      onSubmit={handleSubmit(onValidSubmit)}
      noValidate
    >
      <FormField
        name="name"
        errors={errors}
        registerFn={register}
        isLoading={isSubmitting}
        inputProps={{ autoFocus: true }}
        placeholder="Enter collection name"
      />
    </Box>
  );
};

const schema = yup
  .object({
    name: yup.string().trim().required("This field is required"),
  })
  .required();

export default CollectionForm;
