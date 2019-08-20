import React from 'react'
import { expect, assert } from 'chai'
import { mount } from 'enzyme'
import { Timezone as TimezoneWithoutHOC } from '../../src/component/Account/Timezone.jsx'
import sinon from 'sinon'
import { translateMock } from "../hocMock/translate";

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

  const ComponentWithHoc = translateMock()(TimezoneWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {

  })
})
