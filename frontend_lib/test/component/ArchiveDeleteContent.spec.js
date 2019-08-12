import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import ArchiveDeleteContent from '../../src/component/OptionComponent/ArchiveDeleteContent.jsx'
import sinon from 'sinon'

describe('<ArchiveDeleteContent />', () => {
  const onClickDeleteBtnCallBack = sinon.stub()
  const onClickArchiveBtnCallBack = sinon.stub()

  const props = {
    onClickDeleteBtn: onClickDeleteBtnCallBack,
    onClickArchiveBtn: onClickArchiveBtnCallBack,
    disabled: false,
    t: (tradKey) => tradKey
  }

  const wrapper = mount(
    <ArchiveDeleteContent.WrappedComponent
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should have its buttons disabled property set to ${props.disabled}`, () => {
      expect(wrapper.find(`[data-cy='archive__button']`).prop('disabled')).to.equal(props.disabled)
      expect(wrapper.find(`[data-cy='delete__button']`).prop('disabled')).to.equal(props.disabled)
    })
  })

  describe('Handlers', () => {
    it(`onClickDeleteBtn handler should call the proper handler`, () => {
      wrapper.find(`[data-cy='delete__button']`).simulate('click')
      expect(onClickDeleteBtnCallBack.called).to.equal(true)
    })

    it(`onClickDeleteBtn handler should call the proper handler`, () => {
      wrapper.find(`[data-cy='archive__button']`).simulate('click')
      expect(onClickDeleteBtnCallBack.called).to.equal(true)
    })
  })
})
