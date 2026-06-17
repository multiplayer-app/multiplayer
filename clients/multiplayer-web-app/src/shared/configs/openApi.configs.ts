import { OpenAPIV3 } from "openapi-types";
import { toCamelCase } from "shared/utils";

export const HttpMethodConfigs = {
  [OpenAPIV3.HttpMethods.GET]: { color: "#4E835B", label: "GET" },
  [OpenAPIV3.HttpMethods.POST]: { color: "#437AAC", label: "POST" },
  [OpenAPIV3.HttpMethods.PUT]: { color: "#D1732F", label: "PUT" },
  [OpenAPIV3.HttpMethods.PATCH]: { color: "#D1732F", label: "PATCH" },
  [OpenAPIV3.HttpMethods.DELETE]: { color: "#B03340", label: "DELETE" },
  [OpenAPIV3.HttpMethods.OPTIONS]: { color: "#718096", label: "OPTIONS" },
  [OpenAPIV3.HttpMethods.HEAD]: { color: "#718096", label: "HEAD" },
  [OpenAPIV3.HttpMethods.TRACE]: { color: "#718096", label: "TRACE" },
};

export const httpStatusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  426: "Upgrade Required",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
};

export const getMethodConfigs = (key: OpenAPIV3.HttpMethods) => {
  return HttpMethodConfigs[key] || { color: "#718096", label: key };
};

export const generateOperationId = (
  httpMethod: OpenAPIV3.HttpMethods,
  path: string
): string => {
  const sanitizedPath = path.replace(/\//g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const operationId = `${httpMethod.toLowerCase()}_${sanitizedPath}`;
  return toCamelCase(operationId, "_");
};

export const getMethodInitialData = (
  key: OpenAPIV3.HttpMethods
): OpenAPIV3.OperationObject => {
  const baseValue: OpenAPIV3.OperationObject = {
    summary: "",
    description: "",
    responses: {
      "200": {
        description: "OK",
      },
    },
  };
  switch (key) {
    case OpenAPIV3.HttpMethods.POST:
    case OpenAPIV3.HttpMethods.PUT:
      return {
        ...baseValue,
        requestBody: {
          description: "",
          required: true,
          content: {
            "application/json": {},
          },
        },
      };
    default:
      return baseValue;
  }
};
