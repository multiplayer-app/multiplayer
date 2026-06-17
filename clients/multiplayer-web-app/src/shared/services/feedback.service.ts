import { apiInstance } from "shared/api";

export const sendFeedback = (body: {
  subject: string;
  message: string;
}): Promise<any> => {
  return apiInstance.post(`/feedback`, body);
};
