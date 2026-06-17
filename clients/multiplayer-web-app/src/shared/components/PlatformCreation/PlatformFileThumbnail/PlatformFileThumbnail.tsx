import { Flex, Icon, Img, Spinner } from "@chakra-ui/react";
import { CloseIcon, CSVFileIcon } from "shared/icons";

const isCSV = (file: File): boolean => {
  return file.type === "text/csv";
};

const PlatformFileThumbnail = ({ file, removeFile }) => (
  <Flex
    mr={2}
    mb={1}
    height={12}
    width={20}
    whiteSpace="normal"
    border="1px solid"
    borderRadius={8}
    alignItems="center"
    justifyContent="center"
    position="relative"
    borderColor="blackAlpha.200"
    backgroundColor={isCSV(file) ? "bg.subtle" : "bg.primary"}
  >
    {file.loading ? (
      <Spinner color="brand.500" m="auto" alignSelf="center" />
    ) : (
      <>
        {!isCSV(file) ? (
          <Img
            src={file.preview}
            height="100%"
            width="100%"
            borderRadius={8}
            objectFit="contain"
          />
        ) : (
          <Icon as={CSVFileIcon} width={6} height={6} />
        )}
        <Icon
          cursor="pointer"
          position="absolute"
          top={1}
          right={1}
          width={3}
          height={3}
          color={isCSV(file) ? "blackAlpha.400" : "blackAlpha.700"}
          as={CloseIcon}
          onClick={() => removeFile(file._id)}
        />
      </>
    )}
  </Flex>
);

export default PlatformFileThumbnail;
