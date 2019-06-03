class Stache {
  denormalize(object) {
    const newObj = {};
    for (let key in object) {
      let workingObj = newObj;
      let path = key.split(".");
      for (let i = 1; i < path.length; i += 1) {
        const e = path[i];
        if (i === path.length - 1) workingObj[e] = object[key];
        if (!workingObj[e]) {
          if (Number(path[i + 1]) || Number(path[i + 1]) === 0) {
            workingObj[e] = [];
          } else workingObj[e] = {};
        }
        workingObj = workingObj[e];
      }
    }
    return newObj;
  }

  normalize(object) {
    return Object.assign(
      {},
      ...(function flattener(objectBit, path = "") {
        return [].concat(
          ...Object.keys(objectBit).map(key => {
            return typeof objectBit[key] === "object" && objectBit[key] !== null
              ? flattener(objectBit[key], `${path}.${key}`)
              : { [`${path}.${key}`]: objectBit[key] };
          })
        );
      })(object)
    );
  }

  offsetKeys(object, offset) {
    let newObj = {};
    for (let key in object) {
      let path = key.split(".");
      if (path[4]) {
        path[4] = +path[4] + offset;
        newObj[path.join(".")] = object[key];
      }
    }
    return newObj;
  }
}

module.exports = Stache;
