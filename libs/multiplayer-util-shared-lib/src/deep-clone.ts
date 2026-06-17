export const clone = (jsonObj: any): any => {
  return JSON.parse(JSON.stringify(jsonObj))
}
