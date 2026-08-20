describe('ci failed list check', () => {
  it('is deliberately failing to verify the mocha failed-tests summary', () => {
    expect(true).to.equal(false)
  })
})
