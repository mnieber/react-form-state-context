// Taken from https://stackoverflow.com/a/42696154

export function unflatten(data: { [key: string]: any }) {
  var result = {};
  for (var i in data) {
    var keys = i.split('.');
    keys.reduce(function (r: any, e: any, j: any) {
      return (
        r[e] ||
        (r[e] = isNaN(Number(keys[j + 1]))
          ? keys.length - 1 == j
            ? data[i]
            : {}
          : [])
      );
    }, result);
  }
  return result;
}
