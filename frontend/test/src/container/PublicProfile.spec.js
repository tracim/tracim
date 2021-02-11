import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { PublicProfile } from '../../../src/container/PublicProfile.jsx'
import { user } from '../../hocMock/redux/user/user'

describe('<PublicProfile />', () => {
  const props = {
    user: user,
    match: {
      params: {
        userid: 1
      }
    },
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    t: tradKey => tradKey
  }

  const wrapper = shallow(<PublicProfile {...props} />)

  describe('isSchemaObjectEmpty()', () => {
    it('should return true if schemaObject is empty', () => {
      expect(
        wrapper.instance().isSchemaObjectEmpty({})
      ).to.equal(true)
    })

    it('should return true if the properties of schemaObject are empty', () => {
      expect(
        wrapper.instance().isSchemaObjectEmpty({ properties: {} })
      ).to.equal(true)
    })

    it('should return false if the properties of schemaObject are not empty', () => {
      expect(
        wrapper.instance().isSchemaObjectEmpty({ properties: { att: 'notEmpty' } })
      ).to.equal(false)
    })
  })
})
