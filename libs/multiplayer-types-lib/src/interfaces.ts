/*****************************************
 *** PERMISSIONS RELATED TYPES ***
 *****************************************/

enum PERMISSION {
  READ, WRITE
}
type TopAccessLevel = '*';
type ProjectAccessLevel = Exclude<string, TopAccessLevel>;

export enum AccessSection {
  PROJECTS = 'projects',
  BILLING = 'billing',
  MEMBERS = 'members',
  TEAM_SETTINGS = 'teamSettings'
}

// todo: finalize
interface AccessPolicy {
  projects: { [accessLevel: ProjectAccessLevel | TopAccessLevel]: PERMISSION };
  billing: { [accessLevel: ProjectAccessLevel | TopAccessLevel]: PERMISSION };
  members: { [accessLevel: ProjectAccessLevel | TopAccessLevel]: PERMISSION };
  teamSettings: { [accessLevel: ProjectAccessLevel | TopAccessLevel]: PERMISSION };
}

// default policies:
// const ViewerPolicy: AccessPolicy = { projects: {'*': PERMISSION.READ}};
// const EditorPolicy: AccessPolicy= { projects: {'*': PERMISSION.WRITE}};
// possibly can be extended to scooped set of policies { projects: {'*': PERMISSION.WRITE},billing:{}};

export interface Group {
  _id: string;
  teamId: string;
  name: string;
  accessPolicy: AccessPolicy;
}

export interface Member {
  _id: string;
  teamId: string;
  userId: string;
  groups: [
    {
      _id: string;
      name: string;
      accessPolicy: AccessPolicy;
    }
  ];
  accessPolicy?: AccessPolicy;
}
// Member's accessPolicy can be used to upgrade access level, but not to downgrade

// How to calc summary access level for user?
// const member = {
// groups: [
// {name: 'viewers_team', accessPolicy: {'*': 0}},
// ]},
// accessPolicy: {'myI liked an interface, it is more user-friendly (at least at first sight). The only concern i have is does linear have sprint-like functionality or not. I did not find something similar there yet.Id': 1}
// };
// Summary policy: able to view all project, but can edit only one with id `myWorkspaceId`

// const member = {
// groups: [
// {name: 'editors_team', accessPolicy: {'*': 1}},
// ]},
// accessPolicy: {'myWorkspaceId': 0}
// };
// Summary policy: able to edit all projects (member's accessPolicy is ignored, since team access level is higher)
