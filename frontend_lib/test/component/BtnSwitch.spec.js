import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import BtnSwitch from '../../src/component/Input/BtnSwitch/BtnSwitch.jsx'
import sinon from 'sinon'
require('../../src/component/Input/BtnSwitch/BtnSwitch.styl')

describe('<BtnSwitch />', () => {
  const onChangeCallBack = sinon.stub()

  const props = {
    checked: false,
    onChange: onChangeCallBack,
    activeLabel: 'randomActiveLabel',
    inactiveLabel: 'randomInactiveLabel',
    disabled: true
  }

  const wrapper = shallow(
    <BtnSwitch
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display "${props.inactiveLabel}" when it is not checked"`, () =>
      expect(wrapper.find('.btnswitch__text')).to.have.text().equal(props.inactiveLabel)
    )

    it(`should have a span with the class primaryColorBg when checked and not disabled`, () => {
      wrapper.setProps({ checked: true, disabled: false })
      expect(wrapper.find(`span.primaryColorBg`)).to.have.lengthOf(1)
      expect(wrapper.find(`span.defaultBg`)).to.have.lengthOf(0)
      wrapper.setProps({ checked: props.checked, disabled: props.disabled })
    })

    it(`should have a span with the class defaultBg when checked and not disabled`, () => {
      expect(wrapper.find(`span.defaultBg`)).to.have.lengthOf(1)
      expect(wrapper.find(`span.primaryColorBg`)).to.have.lengthOf(0)
    })

    it(`should have a div with the class disabled when disabled is true`, () => {
      expect(wrapper.find(`div.disabled`)).to.have.lengthOf(1)
    })

    it(`should have a div without the class disabled when disabled is false`, () => {
      wrapper.setProps({ disabled: false })
      expect(wrapper.find(`div.disabled`)).to.have.lengthOf(0)
      wrapper.setProps({ disabled: props.disabled })
    })

    it(`should display "${props.activeLabel} when it is checked"`, () => {
      wrapper.setProps({ checked: true })
      expect(wrapper.find('.btnswitch__text')).to.have.text().equal(props.activeLabel)
      wrapper.setProps({ checked: props.checked })
    })
  })

  describe('Handlers', () => {
    it('should call props.onChange when handler onChange is called', () => {
      wrapper.setProps({ disabled: false })
      wrapper.find(`input`).simulate('change', { value: 'randomText', preventDefault: () => {}, stopPropagation: () => {} })
      expect(onChangeCallBack.called).to.equal(true)
      onChangeCallBack.resetHistory()
    })

    it('should call props.onChange when handler onClick is called', () => {
      wrapper.setProps({ disabled: false })
      wrapper.find(`label`).simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onChangeCallBack.called).to.equal(true)
      onChangeCallBack.resetHistory()
    })

    it(`if disabled is true it should not call onChange`, () => {
      wrapper.setProps({ disabled: true })
      wrapper.find(`input`).simulate('change', { value: 'randomText', preventDefault: () => {}, stopPropagation: () => {} })
      wrapper.find(`label.switch.nomarginlabel`).simulate('onClick', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onChangeCallBack.called).to.equal(false)
      onChangeCallBack.resetHistory()
    })
  })
})
