import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { SpaceSubscriptionsRequests } from '../../../src/component/SpaceSubscriptionsRequests.jsx'

describe('<SpaceSubscriptionsRequests />', () => {
  const props = {
    subcriptionRequestList: []
  }

  const wrapper = shallow(<SpaceSubscriptionsRequests {...props} t={key => key} />)

  describe('static design', () => {
    it('if subcriptionRequestList is empty should show a message', () => {
      expect(wrapper.find('.workspace_advanced__subscriptionRequests__empty')).to.contain(
        'There are no requests yet.'
      )
    })
  })
})
