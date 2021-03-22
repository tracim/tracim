import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import CardPopup from '../../src/component/CardPopup/CardPopup.jsx'
require('../../src/component/CardPopup/CardPopup.styl')

describe('<CardPopup />', () => {
  const onCloseCallBack = sinon.spy()

  const props = {
    customClass: 'randomCustomClass',
    customHeaderClass: 'RandomCustomHeaderClass',
    customColor: 'yellow',
    onClose: onCloseCallBack,
    hideCloseBtn: false,
    customStyle: {
      color: 'yellow'
    }
  }

  const Children = () => <div><h1>Random title</h1>I am a children of CardPopup</div>

  const wrapper = shallow(
    <CardPopup
      {...props}
    >
      <Children />
    </CardPopup>
  )

  describe('Static design', () => {
    it(`should have the customClass in the right DOM element "${props.customClass}"`, () =>
      expect(wrapper.find(`.${props.customClass}.cardPopup`)).to.have.lengthOf(1)
    )

    it(`should have the customHeaderClass in the right DOM element "${props.customHeaderClass}"`, () =>
      expect(wrapper.find(`.${props.customHeaderClass}.cardPopup__header`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.customStyle.color}`, () =>
      expect(wrapper.find(`.${props.customClass}.cardPopup`).prop('style')).to.deep.equal(props.customStyle)
    )

    it(`should display its background color ${props.customColor}`, () =>
      expect(wrapper.find(`.${props.customHeaderClass}.cardPopup__header`).prop('style').backgroundColor).to.equal(props.customColor)
    )

    it('should have its children', () =>
      expect(wrapper.find('.cardPopup__body').find(Children).length).equal(1)
    )

    it(`should be set hideCloseBtn to: ${props.hideCloseBtn}`, () => {
      expect(wrapper.find('.cardPopup__close')).to.have.lengthOf(1)
    })
  })

  describe('Handlers', () => {
    it('should call props.onClose when handler onClose is called', () => {
      wrapper.find('.cardPopup__close button').simulate('click')
      expect(onCloseCallBack.called).to.equal(true)
    })
  })
})
