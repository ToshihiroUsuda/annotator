/**
 * Defines that an (visual) object can be freezed or unfreezed.
 * @remarks Usuallly it means that in frozen state object does not react to events
 * and also might change its presentation.
 */
export interface ILockable {
    /**
     * Freeze the object presentation
     */
    lock(): void

    /**
     * Unfreeze the object presentation
     */
    unlock(): void
}
