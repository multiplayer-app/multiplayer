import { Notebook } from '@multiplayer/types'


export class SecretsManager implements Notebook.ISecretsManager {
  private readonly dbPromise: Promise<IDBDatabase>
  private readonly dbName: string
  private readonly storeName: string
  private readonly prefix: string

  constructor(context: Notebook.SecretContext) {
    this.dbName = 'secretsDB'
    this.storeName = 'secretsStore'
    this.dbPromise = this.openDB()
    this.prefix = this.buildPrefix(context)
  }

  private buildPrefix(context: Notebook.SecretContext): string {
    return `w/${context.workspaceId}/p/${context.projectId}/e/${context.entityId}/`
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true })
          store.createIndex('prefix_name', ['prefix', 'key'], { unique: true });
          store.createIndex('prefix', 'prefix');
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateSecret(id: number, data: {key: string, value: string }) {
    const db = await this.dbPromise
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.put({
        id: id,
        key: data.key,
        value: data.value,
        prefix: this.prefix,
      })

      tx.oncomplete = () => resolve(request.result as number)
      tx.onerror = () => reject(tx.error)
    })
  }

  async storeSecret(key: string, value: string | number | boolean): Promise<number> {
    const db = await this.dbPromise
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.put({
        value,
        key: key,
        prefix: this.prefix
      })

      tx.oncomplete = () => resolve(request.result as number)
      tx.onerror = () => reject(tx.error)
    })
  }

  async getAllSecrets(): Promise<Notebook.SecretsManagerRecord[]> {
    const db = await this.dbPromise
    return new Promise<Notebook.SecretsManagerRecord[]>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const index = store.index('prefix');
      const request = index.getAll(this.prefix)

      request.onsuccess = () => {
        const data: Notebook.SecretsManagerRecord[] = request.result.map((record: any) => ({
          value: record.value, key: record.key, id: record.id,
        }))
        resolve(data)
      }
      request.onerror = () => reject(tx.error)
    })

  }
  async getSecretById(id: number): Promise<Notebook.SecretsManagerRecord | undefined> {
    const db = await this.dbPromise
    return new Promise<Notebook.SecretsManagerRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        if(!request.result) return resolve(undefined)
        resolve({
          key: request.result.key,
          value: request.result.value,
          id: request.result.id,
        })
      }
      request.onerror = () => reject(tx.error)
    })
  }
  async getSecretByName(key: string): Promise<Notebook.SecretsManagerRecord | undefined> {
    const db = await this.dbPromise
    return new Promise<Notebook.SecretsManagerRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly')
      const store = tx.objectStore(this.storeName)

      const index = store.index('prefix_name');
      const request = index.get([this.prefix, key])

      request.onsuccess = () => {
        if(!request.result) return resolve(undefined)
        resolve({
          key: request.result.key,
          value: request.result.value,
          id: request.result.id,
        })
      }
      request.onerror = () => reject(tx.error)
    })
  }

  async deleteSecretByName(key: string): Promise<void> {
    const secret = await this.getSecretByName(key)
    if (secret) {
      return this.deleteSecretById(secret.id)
    }
  }

  async deleteSecretById(id: number): Promise<void> {
    const db = await this.dbPromise
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite')
      const store = tx.objectStore(this.storeName)
      store.delete(id)

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}