import { useFieldArray } from "react-hook-form";
import { useCallback } from "react";
import { RemoteSessionRecordingConditionCompareOperator } from "@multiplayer/types";
import { Box, Button, VStack } from "@chakra-ui/react";
import ConditionRow from "shared/components/RemoteRecording/ConditionRow";

const StartFilterBlock = ({ control, register, basePath, errors }) => {
  const START_FIELD_NAME = basePath 
    ? `${basePath}.conditions.start` 
    : "conditions.start";
  const { fields, append, remove } = useFieldArray({
    control,
    name: START_FIELD_NAME,
  });

  const handleAddCondition = useCallback(() => {
    append({
      attributePath: "",
      value: "",
      conditionType: RemoteSessionRecordingConditionCompareOperator.EQUALS,
    });
  }, [append]);

  return (
    <Box
      bg="bg.subtle"
      borderWidth="0.5px"
      borderColor="border.secondary"
      borderRadius="16px"
      p={4}
    >
      <VStack spacing={3} align="stretch">
        {fields.map((row, rowIndex) => (
          <ConditionRow
            key={row.id}
            rowIndex={rowIndex}
            control={control}
            register={register}
            remove={remove}
            fieldsLength={fields.length}
            basePath={basePath}
            errors={errors}
          />
        ))}
      </VStack>

      <Button
        variant="light"
        color="subtle"
        mt={4}
        fontWeight={600}
        onClick={handleAddCondition}
      >
        Add new condition
      </Button>
    </Box>
  );
};

export default StartFilterBlock;
