import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Timezone as TimezoneWithoutHOC } from '../../../src/component/Account/Timezone.jsx'
import sinon from 'sinon'

describe('<Timezone />', () => {
  const onChangeTimezoneCallBack = sinon.stub()

  const props = {
    timezone: [{
      place: 'Paris'
    },{
      place: 'Berlin'
    }],
    onChangeTimezone: onChangeTimezoneCallBack,
    timezoneUser: {
      place: 'Paris'
    }
  }

  const wrapper = shallow(<TimezoneWithoutHOC { ...props } t={key => key} />)

  describe('static design', () => {

  })
})
