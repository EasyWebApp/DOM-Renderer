/**
 * @param {*} object
 *
 * @return {Boolean}
 */
export function likeArray(object) {
    object = Object(object);

    return (
        !(object instanceof String) &&
        !(object instanceof Function) &&
        !(object instanceof Node) &&
        (object[Symbol.iterator] instanceof Function ||
            typeof object.length === 'number')
    );
}

/**
 * @param {Node[]} list
 * @param {Number} [index]
 *
 * @return {Number}
 */
export function insertableIndexOf(list, index) {
    return !(index != null) || index > list.length
        ? list.length
        : index < 0
            ? list.length + index
            : index;
}
