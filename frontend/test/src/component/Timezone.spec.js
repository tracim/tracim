import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Timezone as TimezoneWithoutHOC } from '../../../src/component/Account/Timezone.jsx'
import sinon from 'sinon'
import Select from 'react-select'

describe('<Timezone />', () => {
  const onChangeTimezoneCallBack = sinon.stub()

  const props = {
    timezone: [{
      place: 'Paris'
    }, {
      place: 'Berlin'
    }],
    onChangeTimezone: onChangeTimezoneCallBack,
    timezoneUser: {
      place: 'Paris'
    }
  }

  const wrapper = shallow(<TimezoneWithoutHOC {...props} t={key => key} />)

  describe('intern functions', () => {
    describe('handleChangeTimezone', () => {
      it('should call onChangeTimezoneCallback with the right param', () => {
        wrapper.find(Select).dive().props().onChange({ place: 'Berlin' })
        expect(onChangeTimezoneCallBack.getCall(0).args[0]).to.deep.equal({ place: 'Berlin' })
      })

      it('should call onChangeTimezoneCallback undefined param if the timezone do not exist in props.timezone', () => {
        wrapper.find(Select).dive().props().onChange({ place: 'Rome' })
        expect(onChangeTimezoneCallBack.getCall(1).args[0]).to.be.a('undefined')
      })
    })
  })
})
