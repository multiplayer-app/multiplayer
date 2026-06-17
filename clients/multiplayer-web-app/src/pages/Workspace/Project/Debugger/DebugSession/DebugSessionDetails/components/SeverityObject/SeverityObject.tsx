import MonoText from "shared/components/MonoText";

interface SeverityObjectProps {
  severity: "info" | "warn" | "debug" | "error";
}

const SeverityObject = ({ severity }: SeverityObjectProps) => {
  return (
    <MonoText color={severityStyleMap[severity]}>
      {severity.toUpperCase()}
    </MonoText>
  );
};

const severityStyleMap = {
  // make a map in types
  info: "purple.500",
  warn: "yellow.500",
  debug: "muted",
  error: "red.500",
};

export default SeverityObject;
