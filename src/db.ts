export class DB {
  _db: Map<string, Buffer>

  constructor() {
    this._db = new Map()
  }

  set(key: Buffer, value: Buffer) {
    this._db.set(key.toString('hex'), value)
  }

  get(key: Buffer): Buffer | undefined {
    return this._db.get(key.toString('hex'))
  }
}
