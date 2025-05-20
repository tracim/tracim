import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import CardPopupCreateContent from '../../src/component/CardPopup/CardPopupCreateContent.jsx'
import sinon from 'sinon'
require('../../src/component/CardPopup/CardPopupCreateContent.styl')

// TODO - MP - 2022-06-07 - https://github.com/tracim/tracim/issues/5697
describe.skip('<CardPopupCreateContent />', () => {
  const onCloseCallBack = sinon.spy()
  const onValidateCallBack = sinon.spy()
  const onChangeContentNameCallBack = sinon.spy()

  const props = {
    onClose: onCloseCallBack,
    onValidate: onValidateCallBack,
    contentName: 'randomContentName',
    onChangeContentName: onChangeContentNameCallBack,
    label: 'randomLabel',
    customColor: 'yellow',
    faIcon: 'randomIcon',
    btnValidateLabel: 'RandomBtnValidateLabel',
    customStyle: {
      color: 'yellow'
    },
    inputPlaceholder: 'RandomInputPlaceholder'
  }

  const wrapper = shallow(
    <CardPopupCreateContent
      {...props}
    />
  )

  describe('Handlers', () => {
    it('should call props.onValidate when handler onValidate is called when the Enter key is pressed', () => {
      wrapper.find('.createcontent__form__input').simulate('keyDown', { key: 'Enter', preventDefault: () => {} })
      expect(onValidateCallBack.called).to.equal(true)
    })

    it('should call props.onClose when handler onClose is called when the Escape key is pressed', () => {
      wrapper.find('.createcontent__form__input').simulate('keyDown', { key: 'Escape', preventDefault: () => {} })
      expect(onCloseCallBack.called).to.equal(true)
    })

    it('should call props.onChangeContentName when handler onChangeContentName is called', () => {
      wrapper.find('.createcontent__form__input').simulate('change', { value: 'randomText' })
      expect(onChangeContentNameCallBack.called).to.equal(true)
    })
  })
})
