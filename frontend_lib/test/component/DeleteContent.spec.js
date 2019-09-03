import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import DeleteContent from '../../src/component/OptionComponent/DeleteContent.jsx'
import sinon from 'sinon'

describe('<DeleteContent />', () => {
  const onClickDeleteBtnCallBack = sinon.stub()

  const props = {
    onClickDeleteBtn: onClickDeleteBtnCallBack,
    disabled: false
  }

  const wrapper = mount(
    <DeleteContent
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should have it button disabled property set to ${props.disabled}`, () => {
      expect(wrapper.find(`[data-cy='delete__button']`).prop('disabled')).to.equal(props.disabled)
    })
  })

  describe('Handlers', () => {
    it(`onClickDeleteBtn handler should call the proper handler`, () => {
      wrapper.find(`[data-cy='delete__button']`).simulate('click')
      expect(onClickDeleteBtnCallBack.called).to.equal(true)
    })
  })
})
