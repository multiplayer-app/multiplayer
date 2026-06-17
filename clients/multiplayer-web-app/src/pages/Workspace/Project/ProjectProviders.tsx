import { TabsProvider } from "shared/providers/TabsContext";
import { FlowsProvider } from "shared/providers/FlowsContext";
import { VersionProvider } from "shared/providers/VersionContext";
import { ProjectProvider } from "shared/providers/ProjectContext";
import { EntitiesProvider } from "shared/providers/EntitiesContext";
import { IntegrationsProvider } from "shared/providers/IntegrationsContext";
import { ProjectModalsProvider } from "shared/providers/ProjectModalsContext";
import { ProjectSandboxProvider } from "shared/providers/ProjectSandboxContext";
import { SandboxTourProvider } from "shared/providers/SandboxTourProvider";
import { AgentRuntimeProvider } from "shared/providers/AgentRuntimeContext";
import { AgentSessionsProvider } from "pages/Workspace/Project/Agents/AgentSessionsContext";
import { PanelChatProvider } from "shared/components/AgentChat";

const ProjectProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProjectProvider>
      <ProjectSandboxProvider>
        <SandboxTourProvider>
          <VersionProvider>
            <EntitiesProvider>
              <IntegrationsProvider>
                <AgentRuntimeProvider>
                  <AgentSessionsProvider>
                    <TabsProvider>
                      <PanelChatProvider>
                        <ProjectModalsProvider>
                          <FlowsProvider>{children}</FlowsProvider>
                        </ProjectModalsProvider>
                      </PanelChatProvider>
                    </TabsProvider>
                  </AgentSessionsProvider>
                </AgentRuntimeProvider>
              </IntegrationsProvider>
            </EntitiesProvider>
          </VersionProvider>
        </SandboxTourProvider>
      </ProjectSandboxProvider>
    </ProjectProvider>
  );
};

export default ProjectProviders;
