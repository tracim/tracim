import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { SubDropdownCreateButton as SubDropdownCreateButtonWithoutHOC } from '../../src/component/common/Input/SubDropdownCreateButton'
import sinon from 'sinon'
import { appList } from '../hocMock/redux/appList/appList.js'
import { translateMock } from '../hocMock/translate'

describe('<SubDropdownCreateButton />', () => {
  const onClickCreateContentCallBack = sinon.stub()

  // INFO - GM - 2019-08-14 - Remove '/' in slug because it is not supported by enzyme selector
  const newAppList = appList.map(a => {
    return { ...a, slug: a.slug.replace('/', '') }
  })

  const props = {
    availableApp: newAppList,
    onClickCreateContent: onClickCreateContentCallBack,
    folderId: 1
  }

  const ComponentWithHoc = translateMock()(SubDropdownCreateButtonWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {
    it(`should display ${newAppList.length} available app`, () =>
      expect(wrapper.find('div.subdropdown__link').length).to.equal(appList.length)
    )

    describe('each app should have his class in sub divs', () => {
      for(let i = 0; i < newAppList.length; i++) {
        describe(appList[i].slug, () => {
          it(`app: ${newAppList[i].slug} should have a div with the class: subdropdown__link__${newAppList[i].slug}`, () =>
            expect(wrapper.find('div.subdropdown__link__' + newAppList[i].slug).length).to.equal(1)
          )

          it(`app: ${newAppList[i].slug} should have a div with the class: subdropdown__link__${newAppList[i].slug}__icon`, () =>
            expect(wrapper.find(`div.subdropdown__link__${newAppList[i].slug}__icon`).length).to.equal(1)
          )

          it(`app: ${newAppList[i].slug} should have a div with the class: subdropdown__link__${newAppList[i].slug}__text`, () =>
            expect(wrapper.find(`div.subdropdown__link__${newAppList[i].slug}__text`).length).to.equal(1)
          )

          it(`app: ${newAppList[i].slug} should display his creationLabel: ${newAppList[i].creationLabel}`, () =>
            expect(wrapper.find(`div.subdropdown__link__${newAppList[i].slug}__text`)).to.text().equal(newAppList[i].creationLabel)
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
