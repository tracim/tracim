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
    disabled: false
  }

  const wrapper = mount(
    <ArchiveDeleteContent
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should have its buttons disabled property set to ${props.disabled}`, () => {
      // expect(wrapper.find(`[data-cy='archive__button']`).prop('disabled')).to.equal(props.disabled) // INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
      expect(wrapper.find(`[data-cy='delete__button']`).prop('disabled')).to.equal(props.disabled)
    })
  })

  describe('Handlers', () => {
    it('should call props.onClickDeleteBtn when handler onClickDeleteBtn is called', () => {
      wrapper.find(`[data-cy='delete__button']`).simulate('click')
      expect(onClickDeleteBtnCallBack.called).to.equal(true)
    })

    // INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
    // it(`should call props.onClickArchiveBtn when handler onClickArchiveBtn is called`, () => {
    //   wrapper.find(`[data-cy='archive__button']`).simulate('click')
    //   expect(onClickArchiveBtnCallBack.called).to.equal(true)
    // })
  })
})
