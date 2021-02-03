import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PromptMessage from '../../src/component/PromptMessage/PromptMessage.jsx'
import sinon from 'sinon'

require('../../src/component/PromptMessage/PromptMessage.styl')

describe('<PromptMessage />', function () {
  const onClickBtnCallBack = sinon.spy()

  const props = {
    msg: 'randomMessage',
    btnType: 'button',
    icon: 'randomIcon',
    btnLabel: 'randomBtnLabel',
    onClickBtn: onClickBtnCallBack
  }

  const wrapper = shallow(
    <PromptMessage
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display "${props.msg}"`, () =>
      expect(wrapper.find('.promptMessage__msg')).to.have.text().equal(props.msg)
    )

    it(`should display "${props.btnLabel}"`, () =>
      expect(wrapper.find('.promptMessage__btn')).to.have.text().equal(props.btnLabel)
    )

    it('should display the button"', () => {
      expect(wrapper.find('.promptMessage__btn')).to.have.lengthOf(1)
    })

    it(`should display 2 icon "${props.icon}"`, () => {
      expect(wrapper.find(`i.${props.icon}`)).to.have.lengthOf(2)
    })

    it('should only display the buttonLink when the btnType is set to link"', () => {
      wrapper.setProps({ btnType: 'link' })
      expect(wrapper.find('button.promptMessage__btn')).to.have.lengthOf(1)
    })

    it(`should display 1 icon when the btnType is set to link "${props.icon}"`, () => {
      wrapper.setProps({ btnType: 'link' })
      expect(wrapper.find(`.${props.icon}`)).to.have.lengthOf(1)
    })
  })

  describe('Handlers', () => {
    it('should call props.onClickBtn when handler onClickBtn is called', () => {
      wrapper.find('.promptMessage__btn').simulate('click')
      expect(onClickBtnCallBack.called).to.equal(true)
    })
  })
})
