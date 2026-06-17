import { Box, Input } from "@chakra-ui/react";
import { forwardRef } from "react";
import useMessage from "shared/hooks/useMessage";

const FileInput = forwardRef<any, any>(
  ({ children, accept = "image/*", onUpload, maxSize = 2, ...rest }, ref) => {
    const message = useMessage();
    const handleIconChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const maxAllowedSize = maxSize * 1024 * 1024;
      if (file.size > maxAllowedSize) {
        message.handleError({
          message: `The selected file exceeds the maximum allowed size of ${maxSize}MB.`,
        });
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        onUpload(file, reader.result);
        e.target.value = "";
      });

      if (file) {
        reader.readAsDataURL(file);
      }
    };

    return (
      <Box as="label" cursor="pointer" {...rest} ref={ref}>
        <Input
          type="file"
          display="none"
          accept={accept}
          onChange={handleIconChange}
        />
        {children}
      </Box>
    );
  }
);

export default FileInput;
