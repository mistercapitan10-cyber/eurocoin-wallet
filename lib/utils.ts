type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[];

const flatten = (value: ClassValue): Array<string | number> => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flatten(item));
  }

  if (value === null || value === false || value === undefined) {
    return [];
  }

  return [value];
};

export const cn = (...classes: ClassValue[]): string =>
  flatten(classes)
    .filter(Boolean)
    .map(String)
    .join(" ");
