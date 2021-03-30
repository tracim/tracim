/*
import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ContentTypeBtn } from '../../../src/component/Dashboard/ContentTypeBtn.jsx'
import sinon from 'sinon'

describe('<ContentTypeBtn />', () => {
  const onClickBtnCallBack = sinon.spy()

  const props = {
    hexcolor: '#ffffff',
    label: 'randomLabel',
    faIcon: 'randomFaIcon',
    creationLabel: 'randomCreationLabel',
    customClass: 'randomCustomClass',
    onClickBtn: onClickBtnCallBack,
    appSlug: 'randomAppSlug'
  }

  const wrapper = shallow(<ContentTypeBtn {...props} />)

  describe('static design', () => {
    it(`the root div should have the class: ${props.customClass}`, () =>
      expect(wrapper.find(`div.contentTypeBtn.${props.customClass}`).length).to.equal(1)
    )

    it(`the background color should be: ${props.hexcolor}`, () =>
      expect(wrapper.find('div.contentTypeBtn').prop('style').backgroundColor).to.equal(props.hexcolor)
    )

    it(`a div should have the class: ${props.customClass}__text`, () =>
      expect(wrapper.find(`div.${props.customClass}__text`).length).to.equal(1)
    )

    it(`a div should have the class: ${props.customClass}__text__icon`, () =>
      expect(wrapper.find(`div.${props.customClass}__text__icon`).length).to.equal(1)
    )

    it(`a div should have the class: ${props.customClass}__text__title`, () =>
      expect(wrapper.find(`div.${props.customClass}__text__title`).length).to.equal(1)
    )

    it(`should display the creationLabel: ${props.creationLabel}`, () =>
      expect(wrapper.find(`div.${props.customClass}__text__title`)).to.text().equal(props.creationLabel)
    )

    it(`should display the icon: ${props.faIcon}`, () =>
      expect(wrapper.find(`div.${props.customClass}__text__icon > i.${props.faIcon}`).length).to.equal(1)
    )
  })

  describe('handler', () => {
    it('onClickBtnCallBack should be called when the root div is clicked', () => {
      wrapper.find('div.contentTypeBtn').simulate('click')
      expect(onClickBtnCallBack.called).to.equal(true)
    })
  })
})
*/
