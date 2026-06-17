import {
  Link,
  Color,
  Emoji,
  Focus,
  Table,
  Column,
  // Columns,
  Heading,
  TaskList,
  FontSize,
  TaskItem,
  TableRow,
  // Document,
  TableCell,
  TextAlign,
  Subscript,
  TextStyle,
  Underline,
  Highlight,
  ImageBlock,
  Dropcursor,
  Typography,
  Selection,
  Figcaption,
  StarterKit,
  ImageUpload,
  Superscript,
  TableHeader,
  Placeholder,
  SlashCommand,
  TrailingNode,
  HorizontalRule,
  CharacterCount,
  emojiSuggestion,
  Comment,
  CodeBlock,
  RestApiBlock,
  Collaboration,
  BlockquoteFigure,
  SearchAndReplace,
  EnvVarsExtension,
  RunnableCodeBlock,
  CollaborationCursor,
  RunnableBlocksExtension,
  TableOfContents,
  ChartBlock,
  AiAssistant,
} from '.'

import { cursorRender } from './CollaborationCursor'

const defaultUser = { id: 'guest', name: 'Guest', color: 'orange' }
export const ExtensionKit = ({
  proxy,
  aiAssistant,
  showOutline,
  environments,
  allowComments,
  collaboration,
  notebookDebugger,
  secretsManager,
  allowRunnableBlocks,
  user = defaultUser,
}) => {
  const extensions = [
    // This customized Document extension causes error on large text paste
    // Document,
    // Columns,
    StarterKit.configure({
      // document: false,
      dropcursor: false,
      heading: false,
      horizontalRule: false,
      blockquote: false,
      codeBlock: false,
      history: collaboration ? false : {},
    }),
    Color,
    Column,
    TaskList,
    Underline,
    FontSize,
    TextStyle,
    Selection,
    ImageBlock,
    TrailingNode,
    HorizontalRule,
    CodeBlock.configure(),
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    Highlight.configure({ multicolor: true }),
    CharacterCount.configure({ limit: 5000000 }),
    Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
    ImageUpload.configure({ clientId: Math.random() }),
    Emoji.configure({ enableEmoticons: true, suggestion: emojiSuggestion }),
    TextAlign.extend({
      addKeyboardShortcuts() {
        return {}
      },
    }).configure({ types: ['heading', 'paragraph'] }),
    // UniqueID.configure({
    //   types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'table'],
    //   filterTransaction: transaction => !isChangeOrigin(transaction),
    // }),
    Subscript,
    Superscript,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    Typography,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: false,
      showOnlyWhenEditable: true,
      placeholder: ({ node }) => {
        switch (node.type.name) {
          case 'heading':
            return 'Heading'
          case 'paragraph':
            return "Enter text or type '/' for commands"
          default:
            return '' //Enter text or type '/' for commands
        }
      },
    }),
    Focus,
    Figcaption,
    BlockquoteFigure,
    SearchAndReplace.configure(),
    TableOfContents.configure({ showOutline }),
    SlashCommand.configure({ allowRunnableBlocks }),
    Dropcursor.configure({ width: 4, class: 'ProseMirror-dropcursor border-blue' }),
    RunnableCodeBlock.configure({
      proxy,
      secretsManager,
      notebookDebugger,
      allowRunnableBlocks,
      defaultLanguage: 'javascript',
    }),
    RestApiBlock.configure({ proxy, notebookDebugger, secretsManager, allowRunnableBlocks }),
    RunnableBlocksExtension.configure({ allowRunnableBlocks, secretsManager }),
    ChartBlock.configure({ proxy, notebookDebugger }),
  ]

  if (allowComments) {
    extensions.push(Comment.configure({ user }))
  }

  if (collaboration) {
    extensions.push(
      Collaboration.configure({
        fragment: collaboration.fragment,
        undoManager: collaboration.undoManager,
      }),
      CollaborationCursor.configure({
        user,
        render: cursorRender,
        provider: collaboration.provider,
      }),
    )
  }

  if (environments) {
    extensions.push(EnvVarsExtension(environments))
  }

  if (aiAssistant) {
    extensions.push(AiAssistant.configure({ apiInstance: aiAssistant.apiInstance, path: aiAssistant.path }))
  }

  return extensions
}

export default ExtensionKit
