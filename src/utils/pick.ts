const isJsonParsable = (string: string) => {
  try {
    JSON.parse(string);
  } catch (e) {
    return false;
  }
  return true;
};
/* eslint-disable @typescript-eslint/no-explicit-any */
const pick = (object: any, keys: string[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return keys.reduce((obj: any, key: any) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      if (isJsonParsable(object[key])) {
        obj[key] = JSON.parse(object[key]);
      } else {
        obj[key] = object[key];
      }
      // eslint-disable-next-line no-param-reassign
    }
    return obj;
  }, {});
};

export default pick;
