import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { FlashMessage as FlashMessageWithoutHOC } from '../../../src/component/FlashMessage.jsx'
import sinon from 'sinon'

describe('<FlashMessage />', () => {
  const onRemoveFlashMessageCallBack = sinon.spy()

  const props = {
    flashMessage: [{
      message: 'randomMessage',
      type: 'info'
    }],
    onRemoveFlashMessage: onRemoveFlashMessageCallBack
  }

  const wrapper = shallow(<FlashMessageWithoutHOC {...props} t={key => key} />)

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
    it('onRemoveFlashMessageCallBack should be called when the close button is clicked', () => {
      wrapper.find('div.flashmessage__container__close__icon').simulate('click')
      expect(onRemoveFlashMessageCallBack.called).to.equal(true)
    })
  })
})
