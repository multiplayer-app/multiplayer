import { useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  Input,
  useOutsideClick,
  useEventListener,
  Spinner,
  BoxProps,
} from "@chakra-ui/react";
import { ITag } from "@multiplayer/types";
import { normalizeTag, extractKeyValue } from "@multiplayer/util-shared";

import Tag from "shared/components/Tag";
import { TagFillIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";

interface TagInputProps {
  value: string[];
  readonly?: boolean;
  showIcon?: boolean;
  autoFocus?: boolean;
  objectType?: string;
  suggestions?: string[];
  inputPlaceholder?: string;
  boxProps?: BoxProps;
  onClick?: (e) => void;
  onChange: (val: string[]) => void;
}

const TagInput = ({
  value,
  suggestions,
  objectType = "tags",
  autoFocus = false,
  onChange,
  onClick,
  showIcon = true,
  boxProps = {},
  readonly,
  inputPlaceholder,
}: TagInputProps) => {
  const message = useMessage();
  const containerRef = useRef();
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>();

  const addTag = async (name: string) => {
    if (!name) return;
    try {
      setLoading(true);
      const newTag = name;
      const newVal = [
        ...value.filter((t: string | ITag) => {
          const tagString =
            typeof t === "string" ? t : `${t.key ? t.key + ":" : ""}${t.value}`;
          return tagString !== newTag;
        }),
        newTag,
      ];
      onChange(newVal);
    } catch (error) {
      message.handleError(error);
    }
    setLoading(false);
  };

  const onBlur = (e) => {
    const normalizedTag = normalizeTag(e.target.value.trim());
    addTag(normalizedTag);

    e.target.value = "";
  };

  const onKeyDown = (e) => {
    if (e.code === "Enter" || e.code === "Comma") {
      e.preventDefault();
      e.stopPropagation();
      const normalizedTag = normalizeTag(e.target.value.trim());
      addTag(normalizedTag);
      e.target.value = "";
      e.target.focus();
    } else if (e.code === "Backspace" && !e.target.value) {
      onChange(value.slice(0, -1));
    }
  };

  useEventListener("keydown", (e) => {
    if (readonly) return;
    if (e.code === "Delete" || e.code === "Backspace") {
      if (selectedTag) {
        const newVal = value.filter((t) => t !== selectedTag);
        if (newVal.length !== value.length) {
          onChange(newVal);
        }
      }
    }
  });

  useOutsideClick({
    ref: containerRef,
    handler: () => {
      setSelectedTag(null);
    },
  });

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    return suggestions.filter(
      (tag) =>
        !value.some((t) => {
          return t !== tag;
        })
    );
  }, [suggestions, value]);

  return (
    <>
      {filteredSuggestions.length ? (
        <Flex mb="4" fontSize="lg" alignItems="center">
          Write or select a tag
          <Flex gap="2" ml="4">
            {filteredSuggestions.map((tag) => (
              <Tag key={tag} name={tag} onClick={() => addTag(tag)} />
            ))}
          </Flex>
        </Flex>
      ) : null}

      <Box
        px="3"
        py="2"
        gap="2"
        w="100%"
        minH="10"
        as="label"
        flex="1"
        border="1px"
        rounded="lg"
        display="flex"
        borderColor="border.secondary"
        onClick={onClick}
        alignItems="center"
        ref={containerRef}
        _hover={{ borderColor: "border.tertiary" }}
        bg={readonly ? "input.readonly.bg" : "input.bg"}
        {...boxProps}
      >
        {showIcon && <Icon as={TagFillIcon} />}
        <Flex flex="1" flexWrap="wrap" gap="2" alignItems="flex-start">
          {value?.map((t) => {
            const tag: ITag = typeof t === "string" ? extractKeyValue(t) : t;
            return (
              <Tag
                key={tag.key + tag.value}
                name={`${tag.key ? tag.key + ":" : ""}${tag.value}`}
                isSelected={selectedTag === t}
                onClick={() => setSelectedTag(t)}
              />
            );
          })}

          {!readonly && (
            <Input
              flex="1"
              size="sm"
              minW="120px"
              variant="unstyled"
              border="none"
              placeholder={
                inputPlaceholder ||
                `Write ${value.length ? "more " : ""}${objectType}...`
              }
              autoFocus={autoFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
            />
          )}
          {loading && <Spinner size="sm" color="brand.500" />}
        </Flex>
      </Box>
    </>
  );
};

export default TagInput;
