import { BlockElement } from './notebook-data'

export interface SessionNoteData {
  type: string;
  content?: BlockElement[];
}