import * as tape from 'tape'
import { SMT } from '../src'

tape('SMT', (t: tape.Test) => {
  const tree = new SMT()

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

tape('Proof generation/verification', (t: tape.Test) => {
  const tree = new SMT()

  const k = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex')
  const k2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000004', 'hex')
  const k3 = Buffer.from('00000000000000000000000000000000000000000000ff000000000000000000', 'hex')

  const leaf2 = Buffer.from('ff', 'hex')
  const leaf3 = Buffer.from('aa', 'hex')

  tree.put(k2, leaf2)
  tree.put(k3, leaf3)

  const proof2 = tree.prove(k2)
  const proof3 = tree.prove(k3)

  const nonmembershipProof = tree.prove(k)

  const newTree = new SMT()
  t.true(newTree.verifyProof(proof2, tree.root, k2, leaf2))
  t.true(newTree.verifyProof(proof3, tree.root, k3, leaf3))
  t.true(newTree.verifyProof(nonmembershipProof, tree.root, k))

  t.end()
})

tape('Compact proof generation/verification', (t: tape.Test) => {
  const tree = new SMT()

  const k = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex')
  const k2 = Buffer.from('0000000000000000000000000000000000000000000000000000000000000004', 'hex')
  const k3 = Buffer.from('00000000000000000000000000000000000000000000ff000000000000000000', 'hex')

  const leaf2 = Buffer.from('ff', 'hex')
  const leaf3 = Buffer.from('aa', 'hex')

  tree.put(k2, leaf2)
  tree.put(k3, leaf3)

  const proof2 = tree.prove(k2)
  const proof3 = tree.prove(k3)
  t.equals(proof2.length, 256)
  const cproof2 = tree.compressProof(proof2)
  const cproof3 = tree.compressProof(proof3)

  const nonmembershipProof = tree.prove(k)
  const cnmp = tree.compressProof(nonmembershipProof)

  const newTree = new SMT()
  t.true(newTree.verifyCompactProof(cproof2, tree.root, k2, leaf2))
  t.true(newTree.verifyCompactProof(cproof3, tree.root, k3, leaf3))
  t.true(newTree.verifyCompactProof(cnmp, tree.root, k))

  t.end()
})
