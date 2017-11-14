import { getNumber } from '../ScoreUtil'
import { expect } from 'chai'

describe('Score Util', () => {
  it('Return -1 when word is not defined in the map', () => {
    expect(getNumber('Random')).to.eq(-1)
  })

  it('Return 4 when input is "for"', () => {
    expect(getNumber('for')).to.eq(4)
  })

  it('Return 4 when input is "Four" (ignore case)', () => {
    expect(getNumber('for')).to.eq(4)
  })
})
