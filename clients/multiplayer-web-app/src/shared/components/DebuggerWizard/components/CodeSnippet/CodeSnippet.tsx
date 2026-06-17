import { Box, useColorMode } from "@chakra-ui/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import CopySyntax from "shared/components/DebuggerWizard/components/CopySyntax";

const customStyle = {
  borderRadius: "8px",
  padding: "16px",
  fontSize: "0.9rem",
};

const CodeSnippet = ({ language, code, ...boxProps }) => {
  const { colorMode } = useColorMode();
  const style = colorMode === "dark" ? oneDark : oneLight;

  return (
    <Box position="relative" {...boxProps}>
      <SyntaxHighlighter
        language={language}
        style={style}
        customStyle={customStyle}
      >
        {code}
      </SyntaxHighlighter>
      <CopySyntax value={code} />
    </Box>
  );
};

export default CodeSnippet;
