import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import CardPopup from '../../src/component/CardPopup/CardPopup.jsx'
require('../../src/component/CardPopup/CardPopup.styl')

describe('<CardPopup />', () => {
  const props = {
    customClass: 'randomCustomClass',
    customHeaderClass: 'RandomCustomHeaderClass',
    customColor: 'yellow',
    onClose: () => { return 1 },
    hideCloseBtn: false,
    customStyle: {
      color: 'yellow'
    }
  }

  const children = <div><h1>Random title</h1>I am a children of CardPopup</div>

  const wrapper = shallow(
    <CardPopup
      {...props}
    >
      <div><h1>Random title</h1>I am a children of CardPopup</div>
    </CardPopup>
  )

  describe('Static design test', () => {
    it(`should have the customClass  in the right DOM element"${props.customClass}"`, () =>
      expect(wrapper.find(`.${props.customClass}`)).to.have.lengthOf(1)
    )

    it(`should have the customHeaderClass in the right DOM element "${props.customHeaderClass}"`, () =>
      expect(wrapper.find(`.${props.customHeaderClass}`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.customStyle.color}`, () =>
      expect(wrapper.find(`.${props.customClass}.cardPopup`).prop('style')).to.deep.equal(props.customStyle)
    )

    it(`should display its background color ${props.customColor}`, () =>
      expect(wrapper.find(`.${props.customHeaderClass}.cardPopup__header`).prop('style').backgroundColor).to.equal(props.customColor)
    )

    it(`should have its children ${children}   ${wrapper.find(`.cardPopup__body`).children()}`, () =>
      expect(wrapper.find(`.cardPopup__body`).children().contains(children)).to.equal(true)
    )

    it(`should be set hideCloseBtn to : ${props.hideCloseBtn}`, () => {
      expect(wrapper.find(`.cardPopup__close`)).to.have.lengthOf(1)
    })
  })

  describe('Handlers test', () => {
    it(`onClick handler should call the proper handler`, () =>
      expect(wrapper.find(`.cardPopup__close`).prop('onClick')()).to.equal(props.onClose())
    )
  })
})
