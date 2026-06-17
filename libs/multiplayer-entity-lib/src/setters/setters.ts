export type Setters<Type> = {
  [Property in keyof Type as `set${Capitalize<string & Property>}`]: (data: Type) => void;
} & {
  setFields: (data: Type) => void
};
