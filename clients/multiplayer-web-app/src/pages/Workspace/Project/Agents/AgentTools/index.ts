import type { ToolRendererComponent } from "./common";
import { BashToolRenderer } from "./BashToolRenderer";
import { ReadToolRenderer } from "./ReadToolRenderer";
import { EditToolRenderer } from "./EditToolRenderer";
import { WritePatchToolRenderer } from "./WritePatchToolRenderer";
import { GrepToolRenderer } from "./GrepToolRenderer";
import { GlobToolRenderer } from "./GlobToolRenderer";
import { AgentToolRenderer } from "./AgentToolRenderer";
import { ToolSearchRenderer } from "./ToolSearchRenderer";
import { GitToolRenderer } from "./GitToolRenderer";
import { WriteToolRenderer } from "./WriteToolRenderer";

export const AGENT_TOOL_RENDERERS: Record<string, ToolRendererComponent> = {
  // Claude Code tool names
  Bash: BashToolRenderer,
  Read: ReadToolRenderer,
  Write: WriteToolRenderer,
  Edit: EditToolRenderer,
  Grep: GrepToolRenderer,
  Glob: GlobToolRenderer,
  Agent: AgentToolRenderer,
  ToolSearch: ToolSearchRenderer,
  git_status: GitToolRenderer,
  git_commit: GitToolRenderer,
  git_push: GitToolRenderer,
  git_create_pr: GitToolRenderer,
  // legacy / custom tool names
  read_file: ReadToolRenderer,
  write_patch: WritePatchToolRenderer,
};
