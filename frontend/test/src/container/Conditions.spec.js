import React from 'react'
import { expect } from 'chai'
import { Conditions } from '../../../src/container/Conditions.jsx'
import sinon from 'sinon'
import {
  HEAD_TITLE,
  SET
} from '../../../src/action-creator.sync.js'
import { isFunction } from '../../hocMock/helper'
import { mount } from 'enzyme'

describe('In <Conditions />', () => {
  const setHeadTitleCallBack = sinon.spy()

  const dispatchMock = (params) => {
    if (isFunction(params)) return params(dispatchMock)

    switch (params.type) {
      case `${SET}/${HEAD_TITLE}`: setHeadTitleCallBack(); break
    }
    return params
  }

  const props = {
    usageConditionsList: [{
      title: 'file',
      url: '/'
    }],
    system: {
      config: { }
    },
    t: key => key,
    dispatch: dispatchMock,
    onClickCancel: () => { },
    onClickValidate: () => { }
  }

  const wrapper = mount(<Conditions {...props} />)
  const conditionsInstance = wrapper.instance()

  describe('its internal function', () => {
    describe('setHeadTitle()', () => {
      it('should call setHeadTitleCallBack', () => {
        conditionsInstance.setHeadTitle()
        expect(setHeadTitleCallBack.called).to.equal(true)
      })
    })

    describe('handleClickCheckbox', () => {
      it('should add the id to the usageConditionsCheckedList state if it is not on the list', () => {
        wrapper.setState({ usageConditionsCheckedList: [] })
        conditionsInstance.handleClickCheckbox(10)
        expect(wrapper.state('usageConditionsCheckedList')).to.deep.equal([10])
      })

      it('should remove the id to the usageConditionsCheckedList state if it is not on the list', () => {
        wrapper.setState({ usageConditionsCheckedList: [10, 5] })
        conditionsInstance.handleClickCheckbox(10)
        expect(wrapper.state('usageConditionsCheckedList')).to.deep.equal([5])
      })
    })
  })
})
