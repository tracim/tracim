import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import Help from '../../../src/component/Header/MenuActionListItem/Help.jsx'
import sinon from 'sinon'

describe('<Help />', () => {
  const onClickHelpCallBack = sinon.stub()

  const props = {
    onClickHelp: onClickHelpCallBack
  }

  const wrapper = mount(<Help {...props} />)

  describe('handler', () => {
    it('onClickHelpCallBack should be called when the button is clicked', () => {
      wrapper.find('button').simulate('click')
      expect(onClickHelpCallBack.called).to.equal(true)
    })
  })
})
