import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Editor as CoreEditor } from '@tiptap/core'
import GlobeIcon from '../../assets/globe-icon.svg?react'
import CodeIcon from '../../assets/terminal-icon.svg?react'
import { DropdownButton } from '../ui/Dropdown'
import { Surface } from '../ui/Surface'
import { FORMAT_BLOCKS, INSERTION_BLOCKS } from 'src/extensions/SlashCommand/groups'
import { Icon } from '../ui/Icon'
import AiForm from '../AiForm'
import { moveCursorToEnd } from 'src/lib/utils'

const otherBlocks = [...FORMAT_BLOCKS, ...INSERTION_BLOCKS]

interface PlaceholderBlockProps {
  editor: CoreEditor
}

const PlaceholderBlock = ({ editor }: PlaceholderBlockProps) => {
  if (!editor.isEditable) return null

  const handleInsertBlock = (insertBlock: () => void) => {
    moveCursorToEnd(editor)
    insertBlock()
  }

  return (
    <div className="px-[48px] pb-8 mt-6">
      <div className="max-w-[820px] w-full mx-auto text-xs text-neutral-700 dark:text-neutral-200">
        <AiForm editor={editor} />

        {/* Button group */}
        <div
          className="
            flex mb-4 flex-col md:flex-row
            rounded-2xl md:rounded-full overflow-hidden
            border border-gray-200 dark:border-neutral-800
            bg-white dark:bg-neutral-900
            divide-y divide-gray-200 dark:divide-neutral-800 md:divide-y-0 md:divide-x
          "
        >
          {/* Add code block */}
          <button
            className="
              flex items-center justify-center gap-2 flex-1 py-2
              rounded-t-full md:rounded-none md:rounded-l-full
              focus:outline-none focus:ring
              text-neutral-700 dark:text-neutral-100
              hover:bg-gray-50 dark:hover:bg-neutral-800
            "
            onClick={() => handleInsertBlock(() => editor.chain().setRunnableCodeBlock().run())}
            onKeyDown={e => e.key === 'Enter' && handleInsertBlock(() => editor.chain().setRunnableCodeBlock().run())}
          >
            <CodeIcon />
            Add a code block
          </button>

          {/* API call */}
          <button
            className="
              flex items-center justify-center gap-2 flex-1 py-2
              rounded-none
              focus:outline-none focus:ring
              text-neutral-700 dark:text-neutral-100
              hover:bg-gray-50 dark:hover:bg-neutral-800
            "
            onClick={() => handleInsertBlock(() => editor.chain().setRestApiBlock().run())}
            onKeyDown={e => e.key === 'Enter' && handleInsertBlock(() => editor.chain().setRestApiBlock().run())}
          >
            <GlobeIcon />
            Make an API call
          </button>

          {/* UI block */}
          <button
            className="
              flex items-center justify-center gap-2 flex-1 py-2
              rounded-none
              focus:outline-none focus:ring
              text-neutral-700 dark:text-neutral-100
              hover:bg-gray-50 dark:hover:bg-neutral-800
            "
            onClick={() => handleInsertBlock(() => editor.chain().setChartBlock().run())}
            onKeyDown={e => e.key === 'Enter' && handleInsertBlock(() => editor.chain().setChartBlock().run())}
          >
            <Icon name="ChartPie" className="text-yellow-500" />
            Add a UI block
          </button>

          {/* Other blocks dropdown */}
          <Dropdown.Root modal={false}>
            <Dropdown.Trigger asChild>
              <button
                className="
                  flex items-center justify-center gap-2 flex-1 py-2
                  rounded-b-full md:rounded-none md:rounded-r-full
                  focus:outline-none focus:ring
                  text-neutral-700 dark:text-neutral-100
                  hover:bg-gray-50 dark:hover:bg-neutral-800
                "
              >
                Other blocks
                <Icon name="ChevronDown" className="w-2 h-2" />
              </button>
            </Dropdown.Trigger>

            <Dropdown.Content asChild>
              <Surface className="flex flex-col gap-1 px-2 py-4 z-20 bg-white dark:bg-neutral-900">
                {otherBlocks.map(({ name, iconName, label, action }) => (
                  <DropdownButton
                    key={name}
                    onClick={() => handleInsertBlock(() => action(editor))}
                    onKeyDown={e => e.key === 'Enter' && handleInsertBlock(() => action(editor))}
                  >
                    <Icon name={iconName} />
                    {label}
                  </DropdownButton>
                ))}
              </Surface>
            </Dropdown.Content>
          </Dropdown.Root>
        </div>

        <div className="text-gray-500 dark:text-neutral-400 text-center">
          Start by typing <span className="font-semibold">/</span> anywhere in the notebook to see the blocks
        </div>
      </div>
    </div>
  )
}

export default PlaceholderBlock
