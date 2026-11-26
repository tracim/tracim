import { expect } from 'chai'

describe('ci failed list check (mocha)', () => {
  it('is deliberately failing to verify the mocha failed-tests summary', () => {
    expect(true).to.equal(false)
  })
})
