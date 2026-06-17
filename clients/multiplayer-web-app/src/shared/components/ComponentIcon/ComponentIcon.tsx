import { useEffect, useMemo, useState } from "react";
import { ComponentType } from "@multiplayer/types";
import {
  Box,
  Flex,
  Grid,
  Icon,
  Image,
  Menu,
  Modal,
  Button,
  MenuItem,
  MenuList,
  ModalBody,
  MenuButton,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  useDisclosure,
  ModalCloseButton,
} from "@chakra-ui/react";
import FileInput from "shared/components/FileInput";
import NodeIcon from "shared/components/NodeIcon";
import DebounceSearch from "shared/components/DebounceSearch/DebounceSearch";
import PageLoading from "shared/components/PageLoading";
import { PencilIcon } from "shared/icons";

interface ComponentIconProps {
  type: ComponentType | "group";
  iconUrl: string;
  boxSize: string;
  readonly?: boolean;
  onIconChange: (url: string) => void;
}
const DEV_ICONS_PATH = `https://cdn.jsdelivr.net/gh/devicons/devicon`;
const ComponentIcon = ({
  type,
  iconUrl,
  boxSize,
  readonly,
  onIconChange,
}: ComponentIconProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState("");

  const handleChange = () => {
    onIconChange(selected);
    onClose();
  };

  return (
    <>
      <Menu>
        <MenuButton disabled={readonly}>
          <Flex
            p="1"
            bg="bg.subtle"
            borderRadius="lg"
            alignItems="center"
            justifyContent="center"
            boxSize={boxSize}
            position="relative"
          >
            <Image
              src={iconUrl}
              w="full"
              h="full"
              objectFit="contain"
              verticalAlign="top"
              fallback={<NodeIcon type={type} w="full" h="full" boxSize="8" />}
            />
            {!readonly && (
              <Box
                borderRadius="50%"
                bg="bg.subtle"
                boxSize={6}
                border="1px solid white"
                position="absolute"
                bottom="-6px"
                right="-6px"
              >
                <Icon as={PencilIcon} color="muted" boxSize="16px" />
              </Box>
            )}
          </Flex>
        </MenuButton>
        <MenuList zIndex="popover">
          <MenuItem
            as={FileInput}
            maxSize={0.2}
            accept="image/svg+xml"
            onUpload={(_, dataUrl) => onIconChange(dataUrl)}
          >
            Upload icon (.svg)
          </MenuItem>
          <MenuItem onClick={onOpen}>Choose from library</MenuItem>
          {!!iconUrl && (
            <MenuItem onClick={() => onIconChange("")} color="red.500">
              Remove icon
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      <Modal
        size="4xl"
        isOpen={isOpen}
        onClose={onClose}
        onCloseComplete={() => setSelected("")}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Choose from library</ModalHeader>
          <ModalCloseButton />
          <ModalBody py="0" px="2" maxHeight="65vh" overflow="auto">
            <IconsList selected={selected} onSelect={setSelected} />
          </ModalBody>
          <ModalFooter gap="4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleChange} isDisabled={!selected}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const IconsList = ({ onSelect, selected }) => {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [icons, setIcons] = useState([]);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const res = await fetch(`${DEV_ICONS_PATH}/devicon.json`).then((res) =>
          res.json()
        );
        setIcons(res.filter((i) => !!i.versions.svg?.length));
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchIcons();
  }, []);

  const filteredIcons = useMemo(() => {
    if (!query) return icons;
    const lq = query.toLowerCase();
    return icons.filter((obj) => {
      if (obj.name.toLowerCase().includes(lq)) {
        return true;
      }
      return !!obj.altnames.some((alt) => alt.toLowerCase().includes(lq));
    });
  }, [icons, query]);

  return (
    <Flex direction="column">
      <Box position="sticky" top="0" px="2" bg="bg.primary" zIndex="10">
        <DebounceSearch onSearch={setQuery} inputProps={{ autoFocus: true }} />
      </Box>
      <Grid
        gridTemplateColumns="repeat(5, 1fr)"
        gap="2"
        minH="200px"
        position="relative"
      >
        {loading ? (
          <PageLoading />
        ) : (
          filteredIcons.map((icon) => (
            <ListItem
              key={icon.name}
              icon={icon}
              selected={selected}
              onSelect={onSelect}
            />
          ))
        )}
      </Grid>
    </Flex>
  );
};

const ListItem = ({ icon, onSelect, selected }) => {
  const [version, setVersion] = useState(icon.versions.svg[0]);
  const basePath = `${DEV_ICONS_PATH}/icons/${icon.name}/${icon.name}`;
  const url = `${basePath}-${version}.svg`;
  const isSelected = selected?.startsWith(basePath);

  return (
    <Flex
      p="2"
      gap="2"
      key={icon.name}
      fontSize="small"
      flexDir="column"
      alignItems="center"
      borderRadius="base"
      _hover={{ bg: "bg.surface" }}
      wordBreak="break-word"
      cursor="pointer"
      onClick={() => onSelect(url)}
      border="solid 2px"
      borderColor={isSelected ? "brand.500" : "transparent"}
    >
      <Image loading="lazy" boxSize="12" src={url} />
      {icon.name}
      <Flex gap="1" p="1" onClick={(e) => e.stopPropagation()}>
        {icon.versions.svg.map((v) => (
          <Box
            as="span"
            key={v}
            boxSize="3"
            borderRadius="full"
            border="solid 1px"
            onClick={() => {
              setVersion(v);
              if (isSelected) {
                onSelect(url);
              }
            }}
            borderColor={v === version ? "brand.500" : "border.secondary"}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export default ComponentIcon;
