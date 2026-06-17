import { IWorkspaceUser } from "@multiplayer/types";

export function getClientUserName(user: IWorkspaceUser): string {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username;
}

export function sortAlphabetically(a: string, b: string): number {
  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
}

export function getUserInitials(fullName) {
  const nameParts = fullName.trim().split(/\s+/);
  return nameParts.map((part) => part[0].toUpperCase()).join("");
}
