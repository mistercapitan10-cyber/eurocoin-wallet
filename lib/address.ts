export const shortenAddress = (
  address: string,
  length = 4,
): string => {
  if (address.length <= length * 2) {
    return address;
  }

  const prefix = address.slice(0, length + 2); // include 0x
  const suffix = address.slice(-length);
  return `${prefix}…${suffix}`;
};
