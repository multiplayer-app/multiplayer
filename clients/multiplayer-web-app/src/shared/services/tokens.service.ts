import { apiInstance } from "shared/api";

/**
 * Applies a token.
 * @param code - The token code to apply.
 * @returns A promise that resolves when the token is successfully applied.
 */
export const applyToken = (token: string): Promise<any> => {
  return apiInstance.post("/tokens/apply", { token });
};

/**
 * Verify a token.
 * @param token - The token to verify.
 * @returns A promise that resolves when the token is successfully verified.
 */
export const verifyInvitationToken = (token: string): Promise<any> => {
  return apiInstance.get(`/tokens/${token}`);
};
