import { Text } from "@chakra-ui/react";

/** takes a `content` string and highlights any mentions (text starting with '@') */
const MentionedText = ({
  content,
  highlightColor = "#473CFB",
}: {
  content: string;
  highlightColor?: string;
}) => {
  const regex = /(^|\s)@(\w+)/g;
  const elements = [];
  let lastIndex = 0;

  content.replace(regex, (match, p1, p2, offset) => {
    if (lastIndex < offset) {
      elements.push(
        <Text as="span" key={lastIndex}>
          {content.slice(lastIndex, offset)}
        </Text>
      );
    }

    elements.push(
      <Text as="span" key={offset} style={{ color: highlightColor }}>
        {p1}@{p2}
      </Text>
    );

    lastIndex = offset + match.length;

    return match;
  });

  if (lastIndex < content.length) {
    elements.push(
      <Text as="span" key={lastIndex}>
        {content.slice(lastIndex)}
      </Text>
    );
  }

  return <>{elements}</>;
};

export default MentionedText;
