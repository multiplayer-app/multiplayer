import { Box } from "@chakra-ui/react";

export type Collaborator = {
  pointer?: CollaboratorPointer;
  button?: "up" | "down";
  username?: string | null;
  color?: { background: string; stroke: string };
  id?: string;
};

export type CollaboratorPointer = {
  x: number;
  y: number;
  [key: string]: any;
};

const CollaborativeCursors = ({
  cursors,
  zoom = 1,
}: {
  cursors: Collaborator[];
  zoom: number;
}) => {
  return (
    <>
      {cursors.map((item) => (
        <Box
          key={item.id}
          top="0"
          left="0"
          zIndex="2"
          className="cursor"
          position="absolute"
          style={{
            transform: `translate(${item.pointer.x * zoom}px, ${
              item.pointer.y * zoom
            }px)`,
            transition: "transform 0.5s cubic-bezier(.17,.93,.38,1)",
          }}
        >
          <svg
            width="25"
            height="24"
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke="inverse"
              strokeWidth="0.5"
              fill={item.color.background}
              d="M13.8402 14.3225L13.8541 14.2829C14.2129 13.2958 14.9817 12.5139 15.9567 12.1447L22.7396 9.57706L23.3697 9.33855L22.7366 9.10831L4.27642 2.39524L3.76443 2.20906L3.95715 2.71862L10.9551 21.2225L11.1979 21.8645L11.4249 21.2167L13.8402 14.3225Z"
            />
          </svg>

          <Box
            px="2"
            top="20px"
            left="20px"
            position="absolute"
            color="inverse"
            lineHeight="6"
            borderRadius="full"
            whiteSpace="nowrap"
            bg={item.color.background}
            mixBlendMode="difference"
            boxShadow="0px 1px 4px 0px #00000026"
          >
            {item.username}
          </Box>
        </Box>
      ))}
    </>
  );
};

export default CollaborativeCursors;
