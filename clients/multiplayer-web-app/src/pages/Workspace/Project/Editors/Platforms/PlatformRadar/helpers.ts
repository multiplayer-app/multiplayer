import CryptoJS from "crypto-js";
import { PlatformDetections } from "./types";

export const generateDetectionsHash = (
  detections: PlatformDetections,
  appliedDetections: Set<string>
): string => {
  const { dependencies, components } = detections;
  const filteredDetections = [...components, ...dependencies]
    .map((d) => d.id)
    .filter((id) => !appliedDetections.has(id));

  filteredDetections.sort((a, b) => a.localeCompare(b));

  const str = filteredDetections.join("|");

  return CryptoJS.SHA256(str).toString();
};
