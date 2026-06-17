export type Condition =
{
  $gt?: { $date: Date } | number
  $lt?: { $date: Date } | number
}
| { $like: string }
| { $value: string[]; $columnType: string }
| { $not: null }
| { $exists: boolean }
| string
| string[]
| number
| number[]
| boolean

type ApplyBasicQueryCasting<T> = T | T[] | (T extends (infer U)[] ? U : any) | any;

type RootQuerySelector = {
  $or?: ApplyBasicQueryCasting<Condition>[]
  [key: string]: any;
}

export type FilterQuery = {
  [key: string]: ApplyBasicQueryCasting<Condition>
} & RootQuerySelector;
