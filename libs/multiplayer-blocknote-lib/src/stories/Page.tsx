import React from 'react'

import './page.scss'

import { BlockEditor } from 'src/components/BlockEditor'
import useBlockEditor from 'src/hooks/useBlockEditor'

export const Page: React.FC = () => {
  const editor = useBlockEditor({
    autofocus: false,
  })
  if (!editor) return null
  return (
    <article>
      <section className="storybook-page">
        <BlockEditor editor={editor} />
      </section>
    </article>
  )
}
