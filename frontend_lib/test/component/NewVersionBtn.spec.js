import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import NewVersionBtn from '../../src/component/OptionComponent/NewVersionBtn.jsx'
import sinon from "sinon";

describe('<NewVersionBtn />', () => {
  const onClickNewVersionBtnCallBack = sinon.stub()

  const props = {
    onClickNewVersionBtn: onClickNewVersionBtnCallBack,
    disabled: true,
    customColor: 'yellow',
    label: 'RandomLabel'
  }

  const wrapper = shallow(
    <NewVersionBtn
      {...props}
    />
  ).dive()

  describe('Static design', () => {
    it(`should have its button disabled property set to ${props.disabled}`, () => {
      expect(wrapper.find(`[data-cy='wsContentGeneric__option__menu__addversion']`).prop('disabled')).to.equal(props.disabled)
    })

    it(`its button should have the customColor : ${props.customColor}`, () => {
      expect(wrapper.find(`[data-cy='wsContentGeneric__option__menu__addversion']`).prop('style').borderColor)
        .to.equal(props.customColor)
    })

    it(`its button should display : ${props.label}`, () => {
      expect(wrapper.find(`[data-cy='wsContentGeneric__option__menu__addversion']`)).to.have.text().equal(props.label)
    })
  })

  describe('Handlers', () => {
    it(`onClickNewVersionBtn handler should call the proper handler`, () => {
      wrapper.find(`[data-cy='wsContentGeneric__option__menu__addversion']`).simulate('click')
      expect(onClickNewVersionBtnCallBack.called).to.true
    })
  })
})
