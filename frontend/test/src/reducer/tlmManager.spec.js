import { expect } from 'chai'
import { SET, setLiveMessageManager, setLiveMessageManagerStatus, TLM_MANAGER, TLM_MANAGER_STATUS } from '../../../src/action-creator.sync.js'
import tlm from '../../../src/reducer/tlmManager.js'

describe('reducer tlm.js', () => {
  describe('actions', () => {
    const initialState = null

    it('should return the initial state when no action given', () => {
      const rez = tlm(initialState, { type: 'nothing that will match', action: {} })
      expect(rez).to.deep.equal(initialState)
    })

    describe(`${SET}/${TLM_MANAGER}`, () => {
      const fakeTLMManagerInstance = { nothing: true }
      const rez = tlm(initialState, setLiveMessageManager(fakeTLMManagerInstance))

      it('should return the instance given as parameter', () => {
        expect(rez).to.deep.equal({ manager: fakeTLMManagerInstance })
      })
    })

    describe(`${SET}/${TLM_MANAGER_STATUS}`, () => {
      const status = 'open'
      const rez = tlm(initialState, setLiveMessageManagerStatus(status))

      it('should return the status given as parameter', () => {
        expect(rez).to.deep.equal({ status: status })
      })
    })
  })
})
