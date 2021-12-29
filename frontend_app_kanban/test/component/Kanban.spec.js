import React from 'react'
import Board from '@asseinfo/react-kanban'
import { shallow } from 'enzyme'
import { Kanban, BOARD_STATE } from '../../src/component/Kanban.jsx'
import { expect } from 'chai'
import { debug } from '../../src/debug.js'

debug.config.apiUrl = 'http://unit.test:6543/api'

describe('<Kanban />', () => {
  const props = {
    content: {
      content_id: 1,
      content_type: 'kanban'
    },
    config: {
    },
    t: () => {}
  }

  const wrapper = shallow(<Kanban {...props} />)

  describe('Board component', () => {
    for (const state of [BOARD_STATE.LOADING, BOARD_STATE.LOADED, BOARD_STATE.ERROR]) {
      before(() => {
        wrapper.setState({ boardState: state })
      })
      it(`should exist in state ${state}`, () => {
        expect(wrapper.find(Board)).to.have.lengthOf(1)
      })
    }
  })
})
