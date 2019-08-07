import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import TextAreaApp from '../../src/component/Input/TextAreaApp/TextAreaApp.jsx'
import sinon from 'sinon'
require('../../src/component/Input/TextAreaApp/TextAreaApp.styl')

describe('<TextAreaApp />', () => {
  const onChangeText = sinon.stub()
  const onClickCancelBtn = sinon.stub()
  const onClickValidateBtn = sinon.stub()

  const props = {
    text: 'Lorem',
    customClass: 'randomTestClass',
    customColor: '#FFFFFF',
    id: 'MyId',
    onChangeText: onChangeText,
    onClickCancelBtn: onClickCancelBtn,
    onClickValidateBtn: onClickValidateBtn,
    disableValidateBtn: false
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
    it('onClickValidateBtn handler should call the proper handler', () => {
      wrapper.find(`button.${props.customClass}__submit`).simulate('click')
      expect(onClickValidateBtn.called).to.equal(true)
    })

    it('onClickCancelBtn handler should call the proper handler', () => {
      wrapper.find(`button.${props.customClass}__cancel`).simulate('click')
      expect(onClickCancelBtn.called).to.equal(true)
    })

    it('onChangeText handler should call the proper handler', () => {
      wrapper.find(`textarea.${props.customClass}__text`).simulate('change')
      expect(onChangeText.called).to.equal(true)
    })
  })
})
