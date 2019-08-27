import * as tape from 'tape'
import { SMT } from '../src'

tape('SMT', (t: tape.Test) => {
  const tree = new SMT()

  console.log(tree._root)
  const k = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex')
  const k2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000004', 'hex')
  const k3 = Buffer.from('00000000000000000000000000000000000000000000ff000000000000000000', 'hex')

  const leaf2 = Buffer.from('ff', 'hex')
  const leaf3 = Buffer.from('aa', 'hex')

  tree.put(k2, leaf2)
  tree.put(k3, leaf3)

  t.deepEqual(tree.get(k), undefined)
  t.deepEqual(tree.get(k2), leaf2)
  t.deepEqual(tree.get(k3), leaf3)

  // Remove leaf at k2
  tree.put(k2)
  t.deepEqual(tree.get(k2), undefined)

  t.end()
})
