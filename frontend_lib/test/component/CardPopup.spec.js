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
    onClose: () => {},
    hideCloseBtn: false,
    customStyle: {
      color: 'yellow'
    },
    children: '<div>I am a children of CardPopup</div>'
  }

  const wrapper = shallow(
    <CardPopup
      customClass={props.customClass}
      customHeaderClass={props.customHeaderClass}
      customColor={props.customColor}
      onClose={props.onClose}
      hideCloseBtn={props.hideCloseBtn}
      customStyle={props.customStyle}
      children={props.children}
    />
  )

  it(`should have the class "${props.customClass}"`, () =>
    expect(wrapper.find(`.${props.customClass}`)).to.have.lengthOf(1)
  )

  it(`should have the class "${props.customHeaderClass}"`, () =>
    expect(wrapper.find(`.${props.customHeaderClass}`)).to.have.lengthOf(1)
  )

  it(`should display its text in color ${props.customStyle.color}`, () =>
    expect(wrapper.find(`.${props.customClass}`).prop('style')).to.deep.equal(props.customStyle)
  )

  it(`should display its background color ${props.customColor}`, () =>
    expect(wrapper.find(`.${props.customHeaderClass}`).prop('style').backgroundColor).to.equal(props.customColor)
  )

  it(`should have its children ${props.children}`, () =>
    expect(wrapper.find(`.cardPopup__body`)).to.have.text().equal(props.children)
  )

  it(`should be set hideCloseBtn to : ${props.hideCloseBtn}`, () => {
    expect(wrapper.find(`.cardPopup__close`)).to.have.lengthOf(1)
    expect(wrapper.find(`.fa.fa-times`)).to.have.lengthOf(1)
  })

  it(`should have its good onClick`, () =>
    expect(wrapper.find(`.cardPopup__close`).prop('onClick')).to.have.equal(props.onClose)
  )
})
