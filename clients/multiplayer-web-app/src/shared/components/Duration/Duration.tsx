import MonoText from "shared/components/MonoText";
import { formatDuration } from "../../../pages/Workspace/Project/Debugger/DebugSession/utils";

interface DurationProps {
  data: number | string; // in nanoseconds
}

const Duration = ({ data }: DurationProps) => {
  const d = data ? Number(data) : -1;
  if (d < 0) return null;

  return <MonoText>{formatDuration(d)}</MonoText>;
};

export default Duration;
