export class EntityAlreadyExistsError extends Error {
  constructor(entityName: string, entityId: string) {
    super(`${entityName} with id ${entityId} already exists`)
  }
}