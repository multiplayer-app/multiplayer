import { Box, BoxProps } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

const MarkdownRenderer = ({
  content,
  props,
}: {
  content: string | null | undefined;
  props?: BoxProps;
}) => {
  return (
    <Box
      sx={{ "& *": { all: "revert" }, img: { maxWidth: "100%" } }}
      {...props}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {props.children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
