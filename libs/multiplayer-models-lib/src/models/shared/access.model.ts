import { mongoose, ObjectId } from '@multiplayer/mongo'

const { Schema } = mongoose

export const AccessSchema = new Schema({
  guest: {
    enabled: {
      type: Boolean,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
      required: true,
    },
  },

  users: [new Schema({
    user: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
      required: true,
    },
  })],

  workspaceUsers: [new Schema({
    workspaceUser: {
      type: ObjectId,
      ref: 'Workspace-User',
      required: true,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
      required: true,
    },
  })],

  workspaces: [new Schema({
    workspace: {
      type: ObjectId,
      ref: 'Workspace',
      required: true,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
      required: true,
    },
  })],

  projects: [new Schema({
    project: {
      type: ObjectId,
      ref: 'Project',
      required: true,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
      required: true,
    },
  })],

  teams: [new Schema({
    team: {
      type: ObjectId,
      ref: 'Team',
      required: true,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
      required: true,
    },
  })],

  publicLink: {
    token: {
      type: String,
    },
    role: {
      type: ObjectId,
      ref: 'Role',
    },
  },
}, {
  _id: false,
})
