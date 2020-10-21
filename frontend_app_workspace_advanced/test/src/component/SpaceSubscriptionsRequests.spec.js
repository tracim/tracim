import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { SpaceSubscriptionsRequests } from '../../../src/component/SpaceSubscriptionsRequests.jsx'

describe('<SpaceSubscriptionsRequests />', () => {
  const props = {
    subscriptionsRequests: []
  }

  const wrapper = shallow(<SpaceSubscriptionsRequests {...props} t={key => key} />)

  describe('static design', () => {
    it('if subscriptionsRequests is empty should show a message', () => {
      expect(wrapper.find('.workspace_advanced__subscriptionsRequest__empty')).to.contain(
        'There are no requests yet.'
      )
    })
  })
})
