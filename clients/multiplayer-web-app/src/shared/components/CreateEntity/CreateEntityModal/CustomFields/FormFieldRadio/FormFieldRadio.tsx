import { Grid, Input, Flex, Icon, Box, Text } from "@chakra-ui/react";
import LabelGroup from "shared/components/LabelGroup";

const FormFieldRadio = ({ name, label, options, registerFn, setPreview }) => {
  const { onChange, ...rest } = registerFn(name);

  return (
    <Box>
      <LabelGroup mb="4" label={label} />
      <Grid gap="4" gridTemplateColumns="repeat(2, 1fr)" alignItems="stretch">
        {options.map(({ value, label, icon, preview }) => (
          <Box
            as="label"
            cursor="pointer"
            key={value}
            __css={{
              "input:checked + div": {
                borderColor: "brand.500",
                outline: "1px solid",
                outlineColor: "brand.500",
              },
            }}
          >
            <Input
              hidden
              type="radio"
              value={value}
              onChange={(e) => {
                onChange(e);
                preview && setPreview(preview);
              }}
              {...rest}
            />
            <Flex
              gap="2"
              flex="1"
              h="120px"
              bg="bg.surface"
              flexDir="column"
              border="1px solid"
              borderRadius="base"
              alignItems="center"
              justifyContent="center"
              borderColor={"border.tertiary"}
            >
              <Icon color="muted" boxSize="8" as={icon} />
              <Text>{label}</Text>
            </Flex>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default FormFieldRadio;
