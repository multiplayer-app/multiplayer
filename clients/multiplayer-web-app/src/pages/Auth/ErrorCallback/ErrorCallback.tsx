import { Text, Stack, Button, Heading } from "@chakra-ui/react";

import AuthBox from "shared/components/AuthBox";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const ErrorCallback = () => {
  const [message, setMessage] = useState("");
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setMessage(query.get("message"));
  }, [location.search]);

  return (
    <AuthBox>
      <Stack
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        minHeight="350"
        spacing="4"
      >
        <Heading as="h5" size="md">
          Oops!
        </Heading>
        <Text maxW="350px" mx="auto" color="muted" fontSize="md">
          {message}
        </Text>
        <Button variant="link" as={Link} to="/auth">
          Go back
        </Button>
      </Stack>
    </AuthBox>
  );
};

export default ErrorCallback;
