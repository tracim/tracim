import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import NewVersionBtn from '../../src/component/OptionComponent/NewVersionBtn.jsx'
import sinon from 'sinon'

describe('<NewVersionBtn />', () => {
  const onClickNewVersionBtnCallBack = sinon.stub()

  const props = {
    onClickNewVersionBtn: onClickNewVersionBtnCallBack,
    disabled: false,
    customColor: 'yellow',
    label: 'RandomLabel'
  }

  const wrapper = mount(
    <NewVersionBtn
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should have its button disabled property set to ${props.disabled}`, () => {
      expect(wrapper.find(`button.wsContentGeneric__option__menu__addversion`).prop('disabled')).to.equal(props.disabled)
    })

    it(`the button should have the customColor: ${props.customColor}`, () => {
      expect(wrapper.find(`button.wsContentGeneric__option__menu__addversion`).prop('style').borderColor)
        .to.equal(props.customColor)
    })

    it(`the button should display: ${props.label}`, () => {
      expect(wrapper.find(`button.wsContentGeneric__option__menu__addversion`)).to.have.text().equal(props.label)
    })
  })

  describe('Handlers', () => {
    it(`onClickNewVersionBtn handler should call the proper handler`, () => {
      wrapper.find(`button.wsContentGeneric__option__menu__addversion`).simulate('click')
      expect(onClickNewVersionBtnCallBack.called).to.equal(true)
    })
  })
})
