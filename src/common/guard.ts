export default class Guard {
    public static empty(value: string, paramName?: string, message?: string) {
        if (!!value === false || value.trim().length === 0) {
            message =
                message || `'${paramName || 'value'}' cannot be null or empty`
            throw new Error(message)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static null(value: any, paramName?: string, message?: string) {
        if (!!value === false) {
            message =
                message ||
                `'${paramName || 'value'}' cannot be null or undefined`
            throw new Error(message)
        }
    }

    public static expression<T>(
        value: T,
        predicate: (value: T) => boolean,
        paramName?: string,
        message?: string
    ) {
        if (!!value === false || !predicate(value)) {
            message =
                message || `'${paramName || 'value'}' is not a valid value`
            throw new Error(message)
        }
    }
}
