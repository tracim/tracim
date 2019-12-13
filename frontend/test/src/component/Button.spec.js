import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Button from '../../../src/component/common/Input/Button.jsx'
import sinon from 'sinon'

describe('<Button />', () => {
  const onClickCallBack = sinon.stub()

  const props = {
    htmlType: 'button',
    bootstrapType: 'primary',
    customClass: 'randomCustomClass',
    label: 'randomLabel',
    onClick: onClickCallBack
  }

  const wrapper = shallow(<Button { ...props } />)

  describe('static design', () => {
    it('should display the button', () =>
      expect(wrapper.find('button').length).to.equal(1)
    )

    it(`the button type should be ${ props.htmlType }`, () =>
      expect(wrapper.find('button').prop('type')).to.equal(props.htmlType)
    )

    it(`the button should display: ${props.label}`, () =>
      expect(wrapper.find('button')).to.text().equal(props.label)
    )

    it(`the button should have the bootstrap class: 'btn-${props.bootstrapType}'`, () =>
      expect(wrapper.find(`button.btn-${props.bootstrapType}`).length).to.equal(1)
    )

    it(`the button should have the custom class: ${props.customClass}`, () =>
      expect(wrapper.find(`button.${props.customClass}`).length).to.equal(1)
    )
  })

  describe('handler', () => {
    it('onClickCallBack should be called when the button is clicked', () => {
      wrapper.find('button').simulate('click')
      expect(onClickCallBack.called).to.equal(true)
    })
  })
})
