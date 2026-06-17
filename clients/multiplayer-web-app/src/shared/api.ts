import axios from "axios";
import axiosRetry from "axios-retry";
import {
  modifyResData,
  modifyResError,
  setMemoizationKey,
} from "./helpers/api.helpers";
import { config } from "../config";
const CURRENT_USER_HEADER_NAME = "x-multiplayer-user";
const baseURL = config.REACT_APP_API_BASE_URL || "";
const apiPrefix = config.REACT_APP_API_PREFIX;
const gitPrefix = config.REACT_APP_GIT_PREFIX;
const authPrefix = config.REACT_APP_AUTH_PREFIX;
const versionPrefix = config.REACT_APP_VERSION_PREFIX;
const radarPrefix = config.REACT_APP_RADAR_PREFIX;
const assetsPrefix = config.REACT_APP_ASSETS_PREFIX;
const notebookPrefix = config.REACT_APP_NOTEBOOK_PREFIX;

const apiInstanceBaseURL = baseURL + apiPrefix;
const gitInstanceBaseURL = baseURL + gitPrefix;
const authInstanceBaseURL = baseURL + authPrefix;
const radarInstanceBaseURL = baseURL + radarPrefix;
const assetsInstanceBaseURL = baseURL + assetsPrefix;
const versionInstanceBaseURL = baseURL + versionPrefix;
const notebookInstanceBaseURL = baseURL + notebookPrefix;

const retryConfigs = {
  retries: 8,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: any) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      return false;
    }
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
};

const apiInstance = axios.create({
  baseURL: apiInstanceBaseURL,
  withCredentials: true,
});

const gitInstance = axios.create({
  baseURL: gitInstanceBaseURL,
  withCredentials: true,
});

const gitPublicInstance = axios.create({
  baseURL: gitInstanceBaseURL,
  withCredentials: true,
});

const versionInstance = axios.create({
  baseURL: versionInstanceBaseURL,
  withCredentials: true,
});

const authInstance = axios.create({
  baseURL: authInstanceBaseURL,
  withCredentials: true,
});

const radarInstance = axios.create({
  baseURL: radarInstanceBaseURL,
  withCredentials: true,
});

const notebookInstance = axios.create({
  baseURL: notebookInstanceBaseURL,
  withCredentials: true,
});

const assetsInstance = axios.create({
  baseURL: assetsInstanceBaseURL,
  withCredentials: true,
});

const fetchUrlContent = async (url: string) => {
  try {
    const response = await axios.get(url);
    return modifyResData(response);
  } catch (error) {
    return modifyResError(error);
  }
};

const fetchAllUrlsContent = async (urls: string[]) => {
  const fetchPromises = urls.map((url) => fetchUrlContent(url));
  return Promise.all(fetchPromises);
};

axiosRetry(apiInstance as any, retryConfigs);
axiosRetry(gitInstance as any, retryConfigs);
axiosRetry(gitPublicInstance as any, retryConfigs);
axiosRetry(authInstance as any, retryConfigs);
axiosRetry(radarInstance as any, retryConfigs);
axiosRetry(versionInstance as any, retryConfigs);
axiosRetry(notebookInstance as any, retryConfigs);
axiosRetry(assetsInstance as any, retryConfigs);

apiInstance.interceptors.response.use(modifyResData, modifyResError);
gitInstance.interceptors.response.use(modifyResData, modifyResError);
gitPublicInstance.interceptors.response.use(modifyResData, modifyResError);
authInstance.interceptors.response.use(modifyResData, modifyResError);
radarInstance.interceptors.response.use(modifyResData, modifyResError);
versionInstance.interceptors.response.use(modifyResData, modifyResError);
notebookInstance.interceptors.response.use(modifyResData, modifyResError);
assetsInstance.interceptors.response.use(modifyResData, modifyResError);

const updateInstancesHeaders = (headerName: string, headerValue: string) => {
  apiInstance.defaults.headers.common[headerName] = headerValue;
  gitInstance.defaults.headers.common[headerName] = headerValue;
  authInstance.defaults.headers.common[headerName] = headerValue;
  radarInstance.defaults.headers.common[headerName] = headerValue;
  versionInstance.defaults.headers.common[headerName] = headerValue;
  notebookInstance.defaults.headers.common[headerName] = headerValue;
  gitPublicInstance.defaults.headers.common[headerName] = headerValue;
  assetsInstance.defaults.headers.common[headerName] = headerValue;
};

const setCurrentSessionId = (sessionId: string) => {
  setMemoizationKey(sessionId);
  if (sessionId) {
    sessionStorage.setItem(CURRENT_USER_HEADER_NAME, sessionId);
  } else {
    sessionStorage.removeItem(CURRENT_USER_HEADER_NAME);
  }
  updateInstancesHeaders(CURRENT_USER_HEADER_NAME, sessionId);
};

const setAccessToken = (accessToken: string) => {
  // const headerName = 'Authorization';
  // const headerValue = accessToken ? `Bearer ${accessToken}` : null;
  // updateInstancesHeaders(headerName, headerValue);
};

const getCurrentSessionId = () => {
  return sessionStorage.getItem(CURRENT_USER_HEADER_NAME) || "";
};

const getAuthHeaders = () => {
  return {
    [CURRENT_USER_HEADER_NAME]: getCurrentSessionId(),
    ...(window.accessToken && {
      Authorization: `Bearer ${window.accessToken}`,
    }),
  };
};
if (window.accessToken) {
  // setAccessToken(window.accessToken);
}

export {
  apiInstance,
  gitInstance,
  assetsInstance,
  gitPublicInstance,
  authInstance,
  radarInstance,
  versionInstance,
  notebookInstance,
  apiInstanceBaseURL,
  gitInstanceBaseURL,
  authInstanceBaseURL,
  assetsInstanceBaseURL,
  versionInstanceBaseURL,
  notebookInstanceBaseURL,
  CURRENT_USER_HEADER_NAME,
  fetchUrlContent,
  fetchAllUrlsContent,
  setCurrentSessionId,
  getCurrentSessionId,
  setAccessToken,
  getAuthHeaders,
};
