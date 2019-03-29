import * as extend from 'extend';

export function buildObject(messages: any[], put = 'put', del = 'delete'): any {
  const result = {};
  messages.forEach((m) => {
    if (m[del]) {
      m[del].forEach((path: string) => deletePropertyPath(result, path));
    } else if (m[put]) {
      extend(true, result, m[put]);
    }
  });
  return result;
}

export const buildSet = (messages: any[], add = 'add', remove = 'remove') => {
  const result: any[] = [];
  messages.forEach((m) => {
    if (m[add]) {
      array(m[add]).forEach((i) => result.push(i));
    } else if (m[remove]) {
      array(m[remove]).forEach((prop) => {
        const index = result.indexOf(prop);
        if (index !== -1) {
          result.splice(index, 1);
        }
      });
    }
  });
  return result.filter(onlyUnique);
};

export const buildReversingKeyPropertiesArray = (
  messages: any[],
  usedProperties: string[],
) => {
  const keys: any = {};
  const keyOrder: string[] = [];
  messages.forEach((message) => {
    for (const p of usedProperties) {
      if (message[p]) {
        const entries = array(message[p]);
        entries.forEach((entry) => {
          keys[entry] = p;
          keyOrder.push(entry);
        });
        break;
      }
    }
  });
  return keyOrder
    .reverse()
    .filter(onlyUnique)
    .reverse()
    .map((key) => ({ [key]: keys[key] }));
};

const onlyUnique = (value: any, index: number, self: any[]) => {
  return self.indexOf(value) === index;
};

const array = (obj: any) => (Array.isArray(obj) ? obj : [obj]);

const deletePropertyPath = (obj: any, path: string) => {
  const props = path.split('.');

  for (let i = 0; i < props.length - 1; i++) {
    obj = obj[props[i]];

    if (typeof obj === 'undefined') {
      return false;
    }
  }
  const prop = props.pop();
  if (prop) {
    delete obj[prop];
    return true;
  } else {
    return false;
  }
};
