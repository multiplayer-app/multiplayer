import { memo, useEffect, useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { BubbleMenu, Editor } from '@tiptap/react'
import { Icon } from '../../ui/Icon'
import { Toolbar } from '../../ui/Toolbar'
import { Surface } from '../../ui/Surface'
import { ColorPicker } from '../../panels'

// import { FontSizePicker } from './components/FontSizePicker'
import { useTextmenuStates } from './hooks/useTextmenuStates'
import { EditLinkPopover } from './components/EditLinkPopover'
import { useTextmenuCommands } from './hooks/useTextmenuCommands'
import { ContentTypePicker } from './components/ContentTypePicker'
import { useTextmenuContentTypes } from './hooks/useTextmenuContentTypes'

// We memorize the button so each button is not rerendered
// on every editor state change
const MemoButton = memo(Toolbar.Button)
const MemoColorPicker = memo(ColorPicker)
// const MemoFontSizePicker = memo(FontSizePicker)
const MemoContentTypePicker = memo(ContentTypePicker)

export type TextMenuProps = {
  editor: Editor
  customBlockExclusions?: string[]
}

export const TextMenu = ({ editor, customBlockExclusions = [] }: TextMenuProps) => {
  const states = useTextmenuStates(editor, customBlockExclusions)
  const commands = useTextmenuCommands(editor)
  const blockOptions = useTextmenuContentTypes(editor)
  const [selecting, setSelecting] = useState(false)
  const hasComments = useMemo(() => editor.extensionManager.extensions.some(({ name }) => name === 'comment'), [editor])

  useEffect(() => {
    const controller = new AbortController()
    let selectionTimeout: number

    const onSelectionChange = () => {
      setSelecting(true)

      if (selectionTimeout) {
        window.clearTimeout(selectionTimeout)
      }

      selectionTimeout = window.setTimeout(() => {
        setSelecting(false)
      }, 500)
    }

    editor.on('selectionUpdate', onSelectionChange)

    return () => {
      editor.off('selectionUpdate', onSelectionChange)
    }
  }, [editor])

  return (
    <BubbleMenu
      className={selecting ? 'hidden' : ''}
      tippyOptions={{
        popperOptions: {
          placement: 'top-start',
          modifiers: [
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
            {
              name: 'flip',
              options: { fallbackPlacements: ['bottom-start', 'top-end', 'bottom-end'] },
            },
          ],
        },
        offset: [0, 8],
        maxWidth: 'calc(100vw - 16px)',
      }}
      editor={editor}
      pluginKey="textMenu"
      shouldShow={states.shouldShow}
      updateDelay={0}
    >
      <Toolbar.Wrapper>
        <Toolbar.Divider />
        <MemoContentTypePicker options={blockOptions} />
        {/* <MemoFontSizePicker onChange={commands.onSetFontSize} value={states.currentSize || ''} /> */}
        <Toolbar.Divider />
        <MemoButton tooltip="Bold" tooltipShortcut={['Mod', 'B']} onClick={commands.onBold} active={states.isBold}>
          <Icon name="Bold" />
        </MemoButton>
        <MemoButton
          tooltip="Italic"
          tooltipShortcut={['Mod', 'I']}
          onClick={commands.onItalic}
          active={states.isItalic}
        >
          <Icon name="Italic" />
        </MemoButton>
        <MemoButton
          tooltip="Underline"
          tooltipShortcut={['Mod', 'U']}
          onClick={commands.onUnderline}
          active={states.isUnderline}
        >
          <Icon name="Underline" />
        </MemoButton>
        <MemoButton
          tooltip="Strikehrough"
          tooltipShortcut={['Mod', 'Shift', 'S']}
          onClick={commands.onStrike}
          active={states.isStrike}
        >
          <Icon name="Strikethrough" />
        </MemoButton>
        <MemoButton tooltip="Code" tooltipShortcut={['Mod', 'E']} onClick={commands.onCode} active={states.isCode}>
          <Icon name="Code" />
        </MemoButton>
        <MemoButton tooltip="Code block" onClick={commands.onCodeBlock}>
          <Icon name="Code" />
        </MemoButton>
        <MemoButton tooltip="Api block" onClick={commands.onApiBlock}>
          <Icon name="ArrowRightLeft" />
        </MemoButton>
        {hasComments && (
          <MemoButton tooltip="Comment" active={states.isComment} onClick={commands.onComment}>
            Comment
          </MemoButton>
        )}
        <EditLinkPopover onSetLink={commands.onLink} />
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentHighlight} tooltip="Highlight text">
              <Icon name="Highlighter" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" sideOffset={8} asChild>
            <Surface className="p-1">
              <MemoColorPicker
                color={states.currentHighlight}
                onChange={commands.onChangeHighlight}
                onClear={commands.onClearHighlight}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root>
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentColor} tooltip="Text color">
              <Icon name="Palette" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" sideOffset={8} asChild>
            <Surface className="p-1">
              <MemoColorPicker
                color={states.currentColor}
                onChange={commands.onChangeColor}
                onClear={commands.onClearColor}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root>
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton tooltip="More options">
              <Icon name="EllipsisVertical" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" asChild>
            <Toolbar.Wrapper>
              <MemoButton
                tooltip="Subscript"
                tooltipShortcut={['Mod', '.']}
                onClick={commands.onSubscript}
                active={states.isSubscript}
              >
                <Icon name="Subscript" />
              </MemoButton>
              <MemoButton
                tooltip="Superscript"
                tooltipShortcut={['Mod', ',']}
                onClick={commands.onSuperscript}
                active={states.isSuperscript}
              >
                <Icon name="Superscript" />
              </MemoButton>
              <Toolbar.Divider />
              <MemoButton
                tooltip="Align left"
                tooltipShortcut={['Shift', 'Mod', 'L']}
                onClick={commands.onAlignLeft}
                active={states.isAlignLeft}
              >
                <Icon name="AlignLeft" />
              </MemoButton>
              <MemoButton
                tooltip="Align center"
                tooltipShortcut={['Shift', 'Mod', 'E']}
                onClick={commands.onAlignCenter}
                active={states.isAlignCenter}
              >
                <Icon name="AlignCenter" />
              </MemoButton>
              <MemoButton
                tooltip="Align right"
                tooltipShortcut={['Shift', 'Mod', 'R']}
                onClick={commands.onAlignRight}
                active={states.isAlignRight}
              >
                <Icon name="AlignRight" />
              </MemoButton>
              <MemoButton
                tooltip="Justify"
                tooltipShortcut={['Shift', 'Mod', 'J']}
                onClick={commands.onAlignJustify}
                active={states.isAlignJustify}
              >
                <Icon name="AlignJustify" />
              </MemoButton>
            </Toolbar.Wrapper>
          </Popover.Content>
        </Popover.Root>
      </Toolbar.Wrapper>
    </BubbleMenu>
  )
}
