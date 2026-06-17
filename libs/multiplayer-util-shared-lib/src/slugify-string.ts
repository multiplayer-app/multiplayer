import slugify from 'slugify'

slugify.extend({
  _: '',
  $: '',
  '^': '',
  '%': '',
  '&': '',
  '<': '',
  '>': '',
  '|': '',
  '¢': '',
  '£': '',
  '@': '',
  '"': '',
  ']': '',
  '[': '',
  '=': '',
  '?': '',
  ',': '',
  // '.': '',
  '/': '',
  '\\': '',
  ';': '',
})

export default (value: string): string => {
  return slugify(value, {
    lower: true,
    remove: /[*+~()'"#${}|!:&%]/g,
    trim: true,
  })
}
