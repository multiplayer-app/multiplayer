import { useState, useEffect } from "react";

// Repository provider configurations
const PROVIDERS = {
  github: {
    baseUrl: "https://api.github.com/repos",
    rawBase: "https://raw.githubusercontent.com",
    parseReadmeUrl: (owner: string, repo: string, branch: string) =>
      `${PROVIDERS.github.rawBase}/${owner}/${repo}/${branch}/README.md`,
  },
  gitlab: {
    baseUrl: "https://gitlab.com/api/v4/projects",
    rawBase: "https://gitlab.com",
    parseReadmeUrl: (owner: string, repo: string, branch: string) =>
      `${PROVIDERS.gitlab.rawBase}/${owner}/${repo}/-/raw/${branch}/README.md`,
  },
  bitbucket: {
    baseUrl: "https://api.bitbucket.org/2.0/repositories",
    rawBase: "https://bitbucket.org",
    parseReadmeUrl: (owner: string, repo: string, branch: string) =>
      `${PROVIDERS.bitbucket.rawBase}/${owner}/${repo}/raw/${branch}/README.md`,
  },
};

// URL parsing utility
const parseRepositoryUrl = (sourceUri: string) => {
  const patterns = [
    {
      provider: "github",
      regex: /github\.com\/([^\/]+)\/([^\/]+)/,
    },
    {
      provider: "gitlab",
      regex: /gitlab\.com\/([^\/]+)\/([^\/]+)/,
    },
    {
      provider: "bitbucket",
      regex: /bitbucket\.org\/([^\/]+)\/([^\/]+)/,
    },
  ];

  for (const { provider, regex } of patterns) {
    const match = sourceUri.match(regex);
    if (match) {
      return {
        provider,
        owner: match[1],
        repo: match[2],
      };
    }
  }

  return null;
};

// Readme fetching function
const fetchReadmeContent = async (repoInfo: {
  provider: string;
  owner: string;
  repo: string;
  branch?: string;
}) => {
  const { provider, owner, repo, branch = "main" } = repoInfo;
  const providerConfig = PROVIDERS[provider as keyof typeof PROVIDERS];

  if (!providerConfig) {
    console.warn(`Unsupported provider: ${provider}`);
  }

  try {
    // Try API endpoint first
    const apiReadmeUrl = `${providerConfig.baseUrl}/${owner}/${repo}/readme`;
    const apiResponse = await fetch(apiReadmeUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      if (apiData.download_url) {
        const readmeResponse = await fetch(apiData.download_url);
        return await readmeResponse.text();
      }
    }

    // Fallback to direct README URL
    const directReadmeUrl = providerConfig.parseReadmeUrl(owner, repo, branch);
    const directResponse = await fetch(directReadmeUrl);

    if (!directResponse.ok) {
      console.warn("README not found");
    }

    return await directResponse.text();
  } catch (error) {
    console.error("Failed to fetch README:", error);
    return "";
  }
};

export const useRepositoryReadme = (implementation?: any) => {
  const [readme, setReadme] = useState("");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReadme = async () => {
      if (!implementation) return;

      const sourceUri = implementation?.sourceObject?.sourceUri;
      const sourceGitRef = implementation?.sourceGitRef;

      setError(null);

      try {
        let repoInfo: { provider: any; owner: any; repo: any; branch?: any };

        // Attempt to parse from sourceUri
        if (sourceUri) {
          const parsedInfo = parseRepositoryUrl(sourceUri);
          if (parsedInfo) {
            repoInfo = parsedInfo;
          }
        }

        // Fallback to sourceGitRef
        if (!repoInfo && sourceGitRef) {
          repoInfo = {
            provider: sourceGitRef.repositoryType?.toLowerCase(),
            owner: sourceGitRef.repositoryOwner,
            repo: sourceGitRef.repositoryName,
            branch: sourceGitRef.branch,
          };
        }

        if (!repoInfo) {
          return;
        }

        const readmeContent = await fetchReadmeContent(repoInfo);
        setReadme(readmeContent);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    };

    fetchReadme();
  }, [implementation]);

  return { readme, error };
};
