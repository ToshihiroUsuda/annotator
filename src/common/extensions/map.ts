import Guard from '../guard'

export async function forEachAsync<K, V>(
    this: Map<K, V>,
    action: (value: V, key: K) => Promise<void>,
    batchSize: number = 5
): Promise<void> {
    Guard.null(this)
    Guard.null(action)
    Guard.expression(batchSize, (value) => value > 0)

    const all: Array<[K, V]> = [...this.entries()]

    while (all.length > 0) {
        const batch: Array<[K, V]> = []

        while (all.length > 0 && batch.length < batchSize) {
            const val = all.pop()
            if (val !== undefined) {
                batch.push(val)
            }
        }

        const tasks = batch.map((item) => action(item[1], item[0]))
        await Promise.all(tasks)
    }
}
