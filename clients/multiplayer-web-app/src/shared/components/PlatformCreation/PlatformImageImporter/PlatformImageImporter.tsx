import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Flex, Icon, Input, Spinner, Stack, Text } from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import { HttpStatusCode } from "axios";

import useMessage from "shared/hooks/useMessage";
import { extractPlatform } from "shared/services/ai.service";
import { IExtractedTableData } from "shared/models/interfaces";
import { ReactComponent as DownloadIcon } from "assets/icons/download.svg";
import PlatformFileThumbnail from "shared/components/PlatformCreation/PlatformFileThumbnail";

interface PlatformImageImporterProps {
  maxSize: number;
  setData: (data: IExtractedTableData[]) => void;
  setSelectedFiles: (
    files: { name: string; file: File; _id: string }[]
  ) => void;
  filterData: (UID: string, field: string) => void;
  storedFiles?: { name: string; file: File; _id: string }[];
}

const PlatformImageImporter = ({
  maxSize,
  setData,
  setSelectedFiles,
  storedFiles,
  filterData,
}: PlatformImageImporterProps) => {
  const message = useMessage();
  const { workspaceId } = useParams();
  const [files, setFiles] = useState(storedFiles || []);
  const [loading, setLoading] = useState(false);
  const allowedFileTypes = ["image/png", "image/jpg", "image/jpeg"];
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsOver(false);
  };

  useEffect(() => {
    setSelectedFiles(files);
  }, [files]);

  const handleDrop = async (e) => {
    e.preventDefault();
    const { files } = e.dataTransfer;
    if (!validateFileTypes(files)) {
      message.handleError({ message: "Unsupported file format" });
      setIsOver(false);
      return;
    }

    await handleFilesUpload(files, e);
  };

  const validateFileTypes = useCallback(
    (files: File[]) => {
      return Array.from(files).every(({ type }) =>
        allowedFileTypes.includes(type)
      );
    },
    [allowedFileTypes]
  );

  const checkFilesSize = useCallback(
    (files: File[], maxSize: number) => {
      const maxAllowedSize = maxSize * 1024 * 1024;
      return Array.from(files).some((file) => file.size > maxAllowedSize);
    },
    [maxSize]
  );

  const handleFilesUpload = async (files: File[], e) => {
    if (checkFilesSize(files, maxSize)) {
      message.handleError({
        message: `One of the files exceeds the maximum allowed size of ${maxSize}MB.`,
      });
      e.target.value = "";
      return;
    }

    if (files.length) {
      const enhancedFiles = setFilesMetadata(files);
      setFiles((prev) => [...prev, ...enhancedFiles]);

      await processAndUploadFiles(enhancedFiles);
      setIsOver(false);
    }
  };

  const processAndUploadFiles = async (enhancedFiles) => {
    setLoading(true);

    for (let item of enhancedFiles) {
      const formData = new FormData();
      formData.append("image", item.file);
      try {
        const res = await extractPlatform(workspaceId, formData);

        if (res.components) {
          const tableData = res.components.map((component) => {
            const uuid = uuidv4();
            return {
              ...component,
              fileId: item._id,
              _id: uuid,
              entityId: uuid,
              tags: [],
            };
          });
          setData(tableData);
        }
      } catch (error) {
        if (error.code === HttpStatusCode.FailedDependency) {
          message.handleError({
            message: "Unable to extract content from the file",
          });
        } else {
          message.handleError(error);
        }

        setLoading(false);
      }
    }

    setLoading(false);
  };

  const setFilesMetadata = (files: File[]) => {
    return Array.from(files).map((file: File) => {
      const fileReader = new FileReader();
      const uuid = uuidv4();
      const fileData = {
        name: file.name,
        file: file,
        _id: uuid,
        entityId: uuid,
        preview: null,
        loading: true,
        type: file.type,
      };

      fileReader.onloadend = () => {
        fileData.preview = fileReader.result;
        fileData.loading = false;
      };
      fileReader.readAsDataURL(file);

      return fileData;
    });
  };

  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    if (!validateFileTypes(files)) {
      message.handleError({ message: "Unsupported file format" });
      return;
    }
    await handleFilesUpload(files, e);
  };

  const removeFile = (UID: string) => {
    const filteredArray = files.filter((file) => file._id !== UID);
    setFiles(filteredArray);
    filterData(UID, "fileId");
  };

  const hasFiles = files.length > 0;
  // make the empty space smaller if files are selected
  const pTop = hasFiles ? 7 : 10;
  const pBottom = hasFiles ? 3 : 10;
  const mBottom = hasFiles ? 2 : 0;

  return (
    <>
      <Stack
        width="100%"
        pt={pTop}
        pb={pBottom}
        mb={mBottom}
        alignItems="center"
        justifyContent="center"
        borderRadius={8}
        gap={0}
        border={isOver ? "1.5px dashed" : "1px dashed"}
        borderColor={isOver ? "border.tertiary" : "border.secondary"}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {loading ? (
          <Stack justifyContent="center">
            <Spinner color="brand.500" m="auto" alignSelf="center" />
            <Text
              color="muted"
              mt="5"
              mb="30px"
              fontSize="sm"
              fontWeight="medium"
            >
              Powering up! AI Assist is processing your diagram.
            </Text>
          </Stack>
        ) : (
          <>
            <Box mb={6} cursor="pointer">
              <label style={{ cursor: "pointer" }}>
                <Input
                  type="file"
                  accept={allowedFileTypes.join(", ")}
                  display="none"
                  multiple
                  onChange={handleFileInputChange}
                />
                <Icon
                  as={DownloadIcon}
                  borderRadius={8}
                  padding={3}
                  width={12}
                  height={12}
                  backgroundColor="bg.subtle"
                  color="subtle"
                />
              </label>
            </Box>
            <Text fontSize="md" fontWeight="semibold" color="subtle" mb={2}>
              {files.length
                ? "Keep uploading images to get a full list of your components"
                : "Import files from your computer"}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="muted"
              mb={files.length ? 6 : 0}
            >
              Only standard image formats (.png, .jpg, .jpeg) are supported.
              Maximum image size is 5MB
            </Text>
          </>
        )}
      </Stack>
      {!!files.length && (
        <Flex flexWrap="wrap" width="full">
          {files.map((file: any, index: number) => {
            return !file.loading ? (
              <PlatformFileThumbnail
                key={index}
                file={file}
                removeFile={removeFile}
              />
            ) : null;
          })}
        </Flex>
      )}
    </>
  );
};

export default PlatformImageImporter;
