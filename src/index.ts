import * as assert from 'assert'
import { sha256, zeros } from 'ethereumjs-util'
import { DB } from './db'

const KEY_SIZE = 32
const DEPTH = KEY_SIZE * 8
const EMPTY_VALUE = zeros(KEY_SIZE)

enum Direction {
  Left = 0,
  Right = 1,
}

type Hasher = (v: Buffer) => Buffer
const hash: Hasher = sha256

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
      const newH = hash(Buffer.concat([h, h]))
      this._db.set(newH, Buffer.concat([h, h]))
      this._defaultValues[i] = newH
      h = newH
    }
    this._root = h
  }

  static verifyProof(proof: Buffer[], root: Buffer, key: Buffer, value: Buffer): boolean {
    assert(proof.length === DEPTH, 'Incorrect proof length')

    let v = hash(value)
    for (let i = DEPTH - 1; i >= 0; i--) {
      const direction = getPathDirection(key, i)
      if (direction === Direction.Left) {
        v = hash(Buffer.concat([v, proof[i]]))
      } else {
        v = hash(Buffer.concat([proof[i], v]))
      }
    }

    return v.equals(root)
  }

  get root(): Buffer {
    return this._root
  }

  put(key: Buffer, value?: Buffer) {
    assert(key.byteLength === KEY_SIZE, `Key must be of size ${KEY_SIZE}`)

    let v = this._root
    const siblings: [Direction, Buffer][] = []
    for (let i = 0; i < DEPTH; i++) {
      const direction = getPathDirection(key, i)
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
      v = hash(value)
      this._db.set(v, value)
    } else {
      v = EMPTY_VALUE
    }

    for (let i = DEPTH - 1; i >= 0; i--) {
      const [direction, sibling] = siblings.pop()!
      let h
      if (direction === Direction.Left) {
        h = hash(Buffer.concat([v, sibling]))
        this._db.set(h, Buffer.concat([v, sibling]))
      } else {
        h = hash(Buffer.concat([sibling, v]))
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
      const direction = getPathDirection(key, i)
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

  prove(key: Buffer): Buffer[] {
    let v = this._root
    const siblings = []
    for (let i = 0; i < DEPTH; i++) {
      const direction = getPathDirection(key, i)
      const res = this._db.get(v)
      if (!res) throw new Error('Value not found in db')
      if (direction === Direction.Left) {
        v = res.slice(0, 32)
        siblings.push(res.slice(32, 64))
      } else {
        v = res.slice(32, 64)
        siblings.push(res.slice(0, 32))
      }
    }
    return siblings
  }
}

function getPathDirection(path: Buffer, i: number): Direction {
  const byte = path[Math.floor(i / 8)]
  const bit = byte & (2 ** (7 - (i % 8)))
  return bit === 0 ? Direction.Left : Direction.Right
}
