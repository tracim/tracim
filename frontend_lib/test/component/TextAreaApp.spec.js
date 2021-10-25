import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import TextAreaApp from '../../src/component/Input/TextAreaApp/TextAreaApp.jsx'
import sinon from 'sinon'
require('../../src/component/Input/TextAreaApp/TextAreaApp.styl')

describe('<TextAreaApp />', () => {
  const onChangeTextCallBack = sinon.spy()
  const onClickCancelBtnCallBack = sinon.spy()
  const onClickValidateBtnCallBack = sinon.spy()

  const props = {
    text: 'Lorem',
    customClass: 'randomTestClass',
    customColor: '#FFFFFF',
    elementId: 'MyId',
    onChangeText: onChangeTextCallBack,
    onClickCancelBtn: onClickCancelBtnCallBack,
    onClickValidateBtn: onClickValidateBtnCallBack,
    disableValidateBtn: () => false,
    workspaceId: 1
  }

  const wrapper = mount(
    <TextAreaApp
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display "${props.text}"`, () =>
      expect(wrapper.find(`textarea.${props.customClass}__text`).prop('value')).to.equal(props.text)
    )

    it(`the form should have the class "${props.customClass}"`, () => {
      expect(wrapper.find(`form.${props.customClass}`)).to.have.lengthOf(1)
    })
  })

  describe('Handlers', () => {
    it('should call props.onClickValidateBtn when handler onClickValidateBtn is called', () => {
      wrapper.find(`button.${props.customClass}__submit`).simulate('click')
      expect(onClickValidateBtnCallBack.called).to.equal(true)
    })

    it('should call props.onClickCancelBtn when handler onClickCancelBtn is called', () => {
      wrapper.find(`button.${props.customClass}__cancel`).simulate('click')
      expect(onClickCancelBtnCallBack.called).to.equal(true)
    })
  })
})
