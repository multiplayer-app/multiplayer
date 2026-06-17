export interface ISessionNote {
  _id: string;
  session: string;
  workspace: string;
  project: string;
  content: string;
  bucket: string;
  prefix: string;
  createdAt: Date;
  updatedAt: Date;

  stateUrl?: string;
}

export enum SessionNoteKey {
  STATE = 'STATE',
  UPDATES = 'UPDATES',
  UPLOADS = 'UPLOADS',
}

export enum SessionNoteType {
  Span = 'span',
  Sketch = 'sketch',
  Bookmark = 'bookmark',
  DomElement = 'dom-element',
}

export interface ISessionNoteItem {
  id: string;
  type: SessionNoteType;
  title?: string;
  note?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}
