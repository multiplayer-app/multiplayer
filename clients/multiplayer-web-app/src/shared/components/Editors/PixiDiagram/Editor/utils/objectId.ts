export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16); // 8 characters
  const machineIdentifier = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0"); // 6 characters
  const processIdentifier = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, "0"); // 4 characters
  const counter = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0"); // 6 characters

  return `${timestamp}${machineIdentifier}${processIdentifier}${counter}`;
}
