import { Flex, FlexProps } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IGitRef } from "@multiplayer/types";

import { getGitRepositoryMemo } from "shared/services/git.service";
import EntityIcon from "../EntityIcon";

interface GitRefProps extends FlexProps {
  gitRef: IGitRef;
}

const GitRef = ({ gitRef, ...rest }: GitRefProps) => {
  const { projectId } = useParams();
  const [name, setName] = useState("./");

  useEffect(() => {
    const fetchName = async () => {
      try {
        const res = await getGitRepositoryMemo(projectId, gitRef.repositoryId);
        setName(res.gitRepository.name);
      } catch (error) {
        setName("");
      }
    };
    fetchName();
  }, [projectId, gitRef.repositoryId]);

  return (
    <Flex alignItems="center" color="muted" fontSize="small" gap="2" {...rest}>
      <EntityIcon
        boxSize="4"
        name={gitRef.repositoryType}
        __css={{ path: { fill: "currentColor" } }}
      />
      {name}/{gitRef.path}
    </Flex>
  );
};

export default GitRef;
