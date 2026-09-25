describe('ci failed list check', () => {
  it('is deliberately failing to verify the after:run failed-tests summary', () => {
    expect(true).to.equal(false)
  })
})
