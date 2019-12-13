import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { SubDropdownCreateButton as SubDropdownCreateButtonWithoutHOC } from '../../../src/component/common/Input/SubDropdownCreateButton.jsx'
import sinon from 'sinon'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'

describe('<SubDropdownCreateButton />', () => {
  const onClickCreateContentCallBack = sinon.stub()

  const props = {
    availableApp: contentType,
    onClickCreateContent: onClickCreateContentCallBack,
    folderId: 1
  }

  const wrapper = shallow(<SubDropdownCreateButtonWithoutHOC { ...props } t={key => key} />)

  describe('static design', () => {
    it(`should display ${contentType.length} available app`, () =>
      expect(wrapper.find('div.subdropdown__link').length).to.equal(contentType.length)
    )

    describe('each app should have his class in sub divs', () => {
      for(let i = 0; i < contentType.length; i++) {
        describe(contentType[i].slug, () => {
          it(`app: ${contentType[i].slug} should have a div with the class: subdropdown__link__${contentType[i].slug}`, () =>
            expect(wrapper.find('div.subdropdown__link__' + contentType[i].slug).length).to.equal(1)
          )

          it(`app: ${contentType[i].slug} should have a div with the class: subdropdown__link__${contentType[i].slug}__icon`, () =>
            expect(wrapper.find(`div.subdropdown__link__${contentType[i].slug}__icon`).length).to.equal(1)
          )

          it(`app: ${contentType[i].slug} should have a div with the class: subdropdown__link__${contentType[i].slug}__text`, () =>
            expect(wrapper.find(`div.subdropdown__link__${contentType[i].slug}__text`).length).to.equal(1)
          )

          it(`app: ${contentType[i].slug} should display his creationLabel: ${contentType[i].creationLabel}`, () =>
            expect(wrapper.find(`div.subdropdown__link__${contentType[i].slug}__text`)).to.text().equal(contentType[i].creationLabel)
          )
        })
      }
    })

    describe('handler', () => {
      it('onClickCreateContentCallBack should be called when a app is clicked', () => {
        wrapper.find('.subdropdown__link').first().simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
        expect(onClickCreateContentCallBack.called).to.equal(true)
      })
    })
  })
})
