// Remove null elements from an array with nulls and return an array without nulls
export function removeNulls<T>(arr: (T | null)[]) {
    return arr.filter(e => e != null) as T[];
}