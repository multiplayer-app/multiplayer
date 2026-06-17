export * from '@tiptap/extension-collaboration-cursor'
export const cursorRender = (user: { color: string; name: string }) => {
  const cursor = document.createElement('span')

  cursor.classList.add('collaboration-cursor__caret')
  cursor.setAttribute('style', `border-color: ${user.color}`)

  const label = document.createElement('span')

  label.classList.add('collaboration-cursor__label')
  label.setAttribute('style', `background-color: ${user.color}`)
  label.insertBefore(document.createTextNode(user.name), null)

  const nonbreakingSpace1 = document.createTextNode('\u2060')
  const nonbreakingSpace2 = document.createTextNode('\u2060')
  cursor.insertBefore(nonbreakingSpace1, null)
  cursor.insertBefore(label, null)
  cursor.insertBefore(nonbreakingSpace2, null)
  return cursor
}
