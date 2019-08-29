import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { FlashMessage as FlashMessageWithoutHOC } from '../../src/component/FlashMessage.jsx'
import { translateMock } from '../hocMock/translate.js'
import sinon from 'sinon'

describe('<FlashMessage />', () => {
  const removeFlashMessageCallBack = sinon.stub()

  const props = {
    flashMessage: [{
      message: 'randomMessage',
      type: 'info'
    }],
    removeFlashMessage: removeFlashMessageCallBack
  }

  const ComponentWithHoc = translateMock()(FlashMessageWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {
    it(`should display the message: ${props.flashMessage[0].message} in a div`, () =>
      expect(wrapper.find('div.flashmessage__container__content__text__paragraph')).to.text().equal(props.flashMessage[0].message)
    )

    it('should remove the flash message when flashMessage is empty', () => {
      wrapper.setProps({ flashMessage: [] })
      expect(wrapper.find('div.flashmessage__container').length).to.equal(0)
      wrapper.setProps({ flashMessage: props.flashMessage })
    })
  })

  describe('handler', () => {
    it('removeFlashMessageCallBack should be called when the close button is clicked', () => {
      wrapper.find('div.flashmessage__container__close__icon').simulate('click')
      expect(removeFlashMessageCallBack.called).to.equal(true)
    })
  })
})
