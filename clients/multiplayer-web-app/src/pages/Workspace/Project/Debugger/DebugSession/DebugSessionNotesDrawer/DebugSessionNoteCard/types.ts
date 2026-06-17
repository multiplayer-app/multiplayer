import { ISessionNoteItem } from '@multiplayer/types';
import { Node } from '@tiptap/pm/model';


export interface SessionNoteNode extends Node {
  attrs: ISessionNoteItem;
}
