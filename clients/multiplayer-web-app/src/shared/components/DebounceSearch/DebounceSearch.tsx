import { useRef } from "react";
import {
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  InputProps,
} from "@chakra-ui/react";
import { ReactComponent as Search } from "assets/icons/project/search.svg";
import "./debounceSearch.scss";

interface DebounceSearchProps extends InputGroupProps {
  onSearch: (val: string) => void;
  inputProps?: InputProps;
  showSearchIcon?: boolean;
  hideDeleteButton?: boolean;
  inputGroupProps?: InputGroupProps;
}
const DebounceSearch = ({
  showSearchIcon = true,
  onSearch,
  inputProps,
  inputGroupProps,
  hideDeleteButton,
  ...rest
}: DebounceSearchProps) => {
  const timeId = useRef<NodeJS.Timeout>();

  const handleChange = (e) => {
    inputProps?.onChange && inputProps.onChange(e);
    clearTimeout(timeId.current);
    timeId.current = setTimeout(() => {
      onSearch(e.target.value.trim());
    }, 300);
  };

  return (
    <InputGroup
      my="3"
      {...inputGroupProps}
      {...rest}
      className={hideDeleteButton ? "hide-delete-button" : ""}
    >
      {showSearchIcon && (
        <InputLeftElement pointerEvents="none">
          <Search color="muted" />
        </InputLeftElement>
      )}
      <Input
        type="search"
        borderRadius="full"
        {...inputProps}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        onChange={handleChange}
      />
    </InputGroup>
  );
};

export default DebounceSearch;
