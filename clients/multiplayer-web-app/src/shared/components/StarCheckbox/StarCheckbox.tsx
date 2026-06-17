import { Button, Icon } from "@chakra-ui/react";
import { useMemo } from "react";
import { StarFilledIcon, StarIcon } from "shared/icons";

const StarCheckbox = ({ starred, toggleStarred }) => {
  const starFilterProps = useMemo(() => {
    return {
      star: {
        background: starred ? "bg.subtle" : "bg.primary",
        borderColor: starred ? "border.secondary" : "border.secondary",
        color: starred ? "body" : "muted",
      },
      icon: {
        as: starred ? StarFilledIcon : StarIcon,
        color: starred ? "body" : "muted",
        strokeWidth: starred ? "unset" : "1.5px",
        boxSize: starred ? "20px" : "16px",
        transform: starred ? "rotate(270deg)" : "rotate(0deg)",
      },
    };
  }, [starred]);

  return (
    <Button
      onClick={toggleStarred}
      variant="light"
      {...starFilterProps.star}
      leftIcon={
        <Icon
          {...starFilterProps.icon}
          transition="0.9s ease-in"
          willChange="transform"
          width="20px"
        />
      }
    >
      Starred
    </Button>
  );
};

export default StarCheckbox;
