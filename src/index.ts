import * as assert from 'assert'
import { sha256, zeros } from 'ethereumjs-util'
import { DB } from './db'

const KEY_SIZE = 32
const DEPTH = KEY_SIZE * 8
const EMPTY_VALUE = zeros(KEY_SIZE)

enum Direction {
  Left = 0,
  Right = 1
}

/**
 * Sparse Merkle tree
 */
export class SMT {
  _db: DB
  _root: Buffer
  _defaultValues: Buffer[]

  constructor() {
    this._db = new DB()
    this._defaultValues = new Array(DEPTH)
    let h = EMPTY_VALUE
    for (let i = DEPTH - 1; i >= 0; i--) {
      const newH = sha256(Buffer.concat([h, h]))
      this._db.set(newH, Buffer.concat([h, h]))
      this._defaultValues[i] = newH
      h = newH
    }
    this._root = h
  }

  get root(): Buffer {
    return this._root
  }

  put(key: Buffer, value?: Buffer) {
    assert(key.byteLength === KEY_SIZE, `Key must be of size ${KEY_SIZE}`)

    let v = this._root
    const siblings: [Direction, Buffer][] = []
    for (let i = 0; i < DEPTH; i++) {
      const direction = this._getPathDirection(key, i)
      const res = this._db.get(v)
      if (!res) throw new Error('Value not found in db')
      if (direction === Direction.Left) {
        v = res.slice(0, 32)
        siblings.push([direction, res.slice(32, 64)])
      } else {
        v = res.slice(32, 64)
        siblings.push([direction, res.slice(0, 32)])
      }
    }

    if (value) {
      v = sha256(value)
      this._db.set(v, value)
    } else {
      v = EMPTY_VALUE
    }

    for (let i = DEPTH - 1; i >= 0; i--) {
      const [direction, sibling] = siblings.pop()!
      let h
      if (direction === Direction.Left) {
        h = sha256(Buffer.concat([v, sibling]))
        this._db.set(h, Buffer.concat([v, sibling]))
      } else {
        h = sha256(Buffer.concat([sibling, v]))
        this._db.set(h, Buffer.concat([sibling, v]))
      }
      v = h
    }

    this._root = v
  }

  get(key: Buffer): Buffer | undefined {
    assert(key.byteLength === KEY_SIZE, `Key must be of size ${KEY_SIZE}`)

    let v = this._root
    for (let i = 0; i < DEPTH; i++) {
      const direction = this._getPathDirection(key, i)
      const res = this._db.get(v)
      if (!res) throw new Error('Value not found in db')
      if (direction === Direction.Left) {
        v = res.slice(0, 32)
      } else {
        v = res.slice(32, 64)
      }
    }

    return v.equals(EMPTY_VALUE) ? undefined : this._db.get(v)
  }

  _getPathDirection(path: Buffer, i: number): Direction {
    const byte = path[Math.floor(i / 8)]
    const bit = byte & (2 ** (7 - (i % 8)))
    return bit === 0 ? Direction.Left : Direction.Right
  }
}
