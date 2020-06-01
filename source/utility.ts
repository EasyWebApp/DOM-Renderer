import { isEmpty } from 'web-utility/source/data';

export function find<T>(
    list: ArrayLike<T>,
    callback: (item: T, index: number) => boolean,
    offset = 0
) {
    const { length } = list;

    for (let i = offset; i < length; i++)
        if (callback(list[i], i)) return list[i];
}

export function clearList<T = any>(data: any[]): T[] {
    return [data].flat(Infinity).filter(node => !isEmpty(node));
}
