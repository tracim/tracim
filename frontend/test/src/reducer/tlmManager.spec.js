import { expect } from 'chai'
import { SET, setLiveMessageManager, TLM_MANAGER } from '../../../src/action-creator.sync.js'
import tlmManager from '../../../src/reducer/tlmManager.js'

describe('reducer tlmManager.js', () => {
  describe('actions', () => {
    const initialState = null

    it('should return the initial state when no action given', () => {
      const rez = tlmManager(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal(initialState)
    })

    describe(`${SET}/${TLM_MANAGER}`, () => {
      const fakeTLMManagerInstance = { nothing: true }
      const rez = tlmManager(initialState, setLiveMessageManager(fakeTLMManagerInstance))

      it('should return a the instance given', () => {
        expect(rez).to.deep.equal(fakeTLMManagerInstance)
      })
    })
  })
})
