import { expect } from 'chai'
import systemReducer, { defaultSystem } from '../../../src/reducer/system.js'
import {
  SET,
  setHeadTitle,
  HEAD_TITLE
} from '../../../src/action-creator.sync.js'

describe('system reducer', () => {
  it('should return the default state', () => {
    expect(systemReducer(undefined, {})).to.deep.equal(defaultSystem)
  })

  describe.skip(`should handle ${SET}/${HEAD_TITLE}`, () => {
    // TODO - MB - 2021-10-12 - Adapt this U test with the call feature changes, see https://github.com/tracim/tracim/issues/4993
    const newTitle = 'newTitle'

    describe('when the instance name is not already set', () => {
      it('should not set the new head title', () => {
        expect(
          systemReducer(
            defaultSystem,
            setHeadTitle(newTitle)
          )
        ).to.deep.equal(
          defaultSystem
        )
      })
    })

    describe('when the instance name is set', () => {
      const initialState = { ...defaultSystem, config: { ...defaultSystem.config, instance_name: 'Tracim' } }

      describe('with a different new headTitle', () => {
        it('should set the new head title', () => {
          expect(
            systemReducer(initialState, setHeadTitle(newTitle))
          ).to.deep.equal({
            ...initialState,
            headTitle: `${newTitle} · ${initialState.config.instance_name}`
          })
        })
      })
      describe('with identical new headTitle', () => {
        it('should return the state', () => {
          expect(
            systemReducer({ ...initialState, headTitle: 'Tracim' }, setHeadTitle(''))
          ).to.deep.equal({ ...initialState, headTitle: 'Tracim' })
        })
      })
    })
  })
})
