import Guard from '../guard'

export async function forEachAsync<T>(
    this: T[],
    action: (item: T) => Promise<void>,
    batchSize: number = 5
): Promise<void> {
    Guard.null(this)
    Guard.null(action)
    Guard.expression(batchSize, (value) => value > 0)

    const all: T[] = [...this]

    while (all.length > 0) {
        const batch: T[] = []

        while (all.length > 0 && batch.length < batchSize) {
            const val = all.pop()
            if (val !== undefined) {
                batch.push(val)
            }
        }

        const tasks = batch.map((item) => action(item))
        await Promise.all(tasks)
    }
}

export async function mapAsync<T, R>(
    this: T[],
    action: (item: T) => Promise<R>,
    batchSize: number = 5
): Promise<R[]> {
    Guard.null(this)
    Guard.null(action)
    Guard.expression(batchSize, (value) => value > 0)

    let results: R[] = []
    const all: T[] = [...this]

    while (all.length > 0) {
        const batch: T[] = []

        while (all.length > 0 && batch.length < batchSize) {
            const val = all.pop()
            if (val !== undefined) {
                batch.push(val)
            }
        }

        const tasks = batch.map((item) => action(item))
        const batchResults = await Promise.all(tasks)
        results = results.concat(batchResults)
    }

    return results
}
