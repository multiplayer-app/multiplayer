import { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import DragHandle from '@tiptap-pro/extension-drag-handle-react'

import { Icon } from '../../ui/Icon'
import { Toolbar } from '../../ui/Toolbar'
import { Surface } from '../../ui/Surface'
import { DropdownButton } from '../../ui/Dropdown'

import { useData } from './hooks/useData'
import useContentItemActions from './hooks/useContentItemActions'

export type ContentItemMenuProps = {
  editor: Editor
}

export const ContentItemMenu = ({ editor }: ContentItemMenuProps) => {
  const data = useData()
  const tippy = useRef<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = useContentItemActions(editor, data.currentNode, data.currentNodePos)

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (tippy.current && !tippy.current.state.isDestroyed) {
        tippy.current.hide()
      }
    })
    observer.observe(editor.view.dom)
  }, [editor])

  useEffect(() => {
    if (menuOpen) {
      editor.commands.setMeta('lockDragHandle', true)
    } else {
      editor.commands.setMeta('lockDragHandle', false)
    }
  }, [editor, menuOpen])

  if (!editor.isEditable) return null

  return (
    <DragHandle
      editor={editor}
      pluginKey="ContentItemMenu"
      onNodeChange={data.handleNodeChange}
      tippyOptions={{
        appendTo: 'parent',
        offset: [-2, 8],
        zIndex: 99,
        onShown: instance => {
          tippy.current = instance
        },
      }}
    >
      <div className="flex items-center gap-0.5 select-none">
        <Toolbar.Button onClick={actions.handleAdd}>
          <Icon name="Plus" />
        </Toolbar.Button>
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger asChild>
            <Toolbar.Button>
              <Icon name="GripVertical" />
            </Toolbar.Button>
          </Popover.Trigger>
          <Popover.Content side="bottom" align="start" sideOffset={8}>
            <Surface className="p-2 flex flex-col min-w-[16rem]">
              <Popover.Close>
                <DropdownButton as="div" onClick={actions.resetTextFormatting}>
                  <Icon name="RemoveFormatting" />
                  Clear formatting
                </DropdownButton>
              </Popover.Close>
              <Popover.Close>
                <DropdownButton as="div" onClick={actions.copyNodeToClipboard}>
                  <Icon name="Clipboard" />
                  Copy to clipboard
                </DropdownButton>
              </Popover.Close>
              <Popover.Close>
                <DropdownButton as="div" onClick={actions.duplicateNode}>
                  <Icon name="Copy" />
                  Duplicate
                </DropdownButton>
              </Popover.Close>
              <Toolbar.Divider horizontal />
              <Popover.Close>
                <DropdownButton
                  as="div"
                  onClick={actions.deleteNode}
                  className="text-red-500 bg-red-500 dark:text-red-500 hover:bg-red-500 dark:hover:text-red-500 dark:hover:bg-red-500 bg-opacity-10 hover:bg-opacity-20 dark:hover:bg-opacity-20"
                >
                  <Icon name="Trash2" />
                  Delete
                </DropdownButton>
              </Popover.Close>
            </Surface>
          </Popover.Content>
        </Popover.Root>
      </div>
    </DragHandle>
  )
}
