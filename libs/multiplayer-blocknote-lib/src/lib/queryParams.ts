export default class QueryParams extends URLSearchParams {
  constructor(parameters?: string[][] | Record<string, string> | string | URLSearchParams) {
    super(parameters)
  }

  toString(): string {
    const stringVal = super.toString()
    // Decode everything inside {{ }}

    return stringVal
      .replace(/%7B%7B(.*?)%7D%7D/g, (_, p1) => `{{${decodeURIComponent(p1)}}}`)
      .replace(/%7B/g, '{') // Decode all `{`
      .replace(/%7D/g, '}') // Decode all `}`
  }
}
