import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import InputGroupText from '../../../src/component/common/Input/InputGroupText.jsx'
import sinon from 'sinon'

describe('<InputGroupText />', () => {
  const onChangeCallBack = sinon.spy()
  const onKeyDownCallBack = sinon.spy()

  const props = {
    parentClassName: 'randomParentClassName',
    value: 'randomValue',
    type: 'text',
    customClass: 'randomCustomClass',
    icon: 'randomIcon',
    placeHolder: 'randomPlaceHolder',
    invalidMsg: 'randomInvalidMsg',
    isInvalid: true,
    onChange: onChangeCallBack,
    onKeyDown: onKeyDownCallBack,
    maxLength: 10
  }

  const wrapper = shallow(
    <InputGroupText {...props} />
  )

  describe('static design', () => {
    it(`the root div should have the parent class: ${props.parentClassName}`, () =>
      expect(wrapper.find(`div.${props.parentClassName}`).length).to.equal(1)
    )

    it(`should include a div with the class: ${props.parentClassName}__msgerror`, () =>
      expect(wrapper.find(`div.${props.parentClassName}__msgerror`).length).to.equal(1)
    )

    it(`should include a input with the class: ${props.parentClassName}__input`, () =>
      expect(wrapper.find(`input.${props.parentClassName}__input`).length).to.equal(1)
    )

    it('should include a input with the class: is-invalid', () =>
      expect(wrapper.find(`input.${props.parentClassName}__input.is-invalid`).length).to.equal(1)
    )

    it(`should display the icon: ${props.icon}`, () =>
      expect(wrapper.find(`i.${props.icon}`).length).to.equal(1)
    )

    it(`the input should have the value: ${props.value}`, () =>
      expect(wrapper.find('input').prop('value')).to.equal(props.value)
    )

    it(`the input should have the placeHolder: ${props.placeHolder}`, () =>
      expect(wrapper.find('input').prop('placeholder')).to.equal(props.placeHolder)
    )

    it(`the input should have the type: ${props.type}`, () =>
      expect(wrapper.find('input').prop('type')).to.equal(props.type)
    )
  })

  describe('handlers', () => {
    it('onChangeCallBack should be call when input is onChange', () => {
      wrapper.find('input').simulate('change')
      expect(onChangeCallBack.called).to.equal(true)
    })

    it('onKeyDownCallBack should be call when key is down', () => {
      wrapper.find('input').simulate('keydown', { keyCode: 13 })
      expect(onKeyDownCallBack.called).to.equal(true)
    })
  })
})
