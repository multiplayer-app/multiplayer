import { authInstance } from "shared/api";
import { OauthTokenType, RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types';

export const signOut = (): Promise<any> => {
  return authInstance.post("/logout");
};

export const getUserSession = (): Promise<any> => {
  return authInstance.get(`/user-session?v=${Date.now()}`);
};

export const setUserSession = (current: string): Promise<any> => {
  return authInstance.patch("/user-session", { current });
};

export const generateAuthCode = (clientId: string, data: {
  codeChallenge: string,
  codeChallengeMethod: string,
  redirectUri: string,
  scope?: Partial<Record<RoleProjectPermissionEntity, RoleAccessAction[]>>,
  workspaceId?: string,
  projectId?: string,
  tokenType: OauthTokenType,
}): Promise<any> => {
  return authInstance.post(`/oauth-clients/${clientId}/authorize`, data);
};

export const getAuthType = (params: { email: string }): Promise<any> => {
  return authInstance.get("/auth-type", { params });
};

export const signIn = (body: {
  email: string;
  password: string;
}): Promise<any> => {
  return authInstance.post("/local/login", body);
};

export const signUp = (body: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}): Promise<any> => {
  return authInstance.post("/local/register", body);
};

export const forgotPassword = (body: { email: string }): Promise<any> => {
  return authInstance.post("/local/forgot", body);
};

export const setPassword = (body: {
  token: string;
  password: string;
}): Promise<any> => {
  return authInstance.post("/local/set-password", body);
};

export const confirmEmail = (body: { token: string }): Promise<any> => {
  return authInstance.post("/local/confirm-email", body);
};

export const resendConfirmEmail = (body: { email: string }): Promise<any> => {
  return authInstance.post("/local/resend-confirm-email", body);
};

export const unlinkAccount = (accountType: string): Promise<any> => {
  return authInstance.patch(`${accountType}/unlink`);
};

export const getClientInfo = (
  clientId: string,
  params: {
    response_type: string;
    redirect_uri: string;
  }
): Promise<{
  _id: string;
  clientName: string;
  clientUri: string;
  logoUri: string;
  grantTypes: string[];
}> => {
  return authInstance.get(`/oauth-clients/${clientId}`, { params });
};
