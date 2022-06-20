import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { PublicProfile } from '../../../src/container/PublicProfile.jsx'
import { user, userFromApi } from '../../hocMock/redux/user/user'
import { mockGetCustomPropertiesSchema200, mockGetAboutUser200 } from '../../apiMock.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import { isFunction } from '../../hocMock/helper'

describe('<PublicProfile />', () => {
  const dispatchMock = params => {
    if (isFunction(params)) return params(dispatchMock)
    return params
  }

  const props = {
    breadcrumbs: [],
    user: user,
    system: {
      config: {
        call__unanswered_timeout: 42
      }
    },
    match: {
      params: {
        userid: user.userId
      }
    },
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    t: tradKey => tradKey,
    dispatch: dispatchMock
  }

  mockGetAboutUser200(FETCH_CONFIG.apiUrl, user.userId, userFromApi)
  mockGetCustomPropertiesSchema200(FETCH_CONFIG.apiUrl, {
    json: { json_schema: { }, ui_schema: { }, code: 2 }
  })

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
