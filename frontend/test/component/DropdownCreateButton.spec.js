import React from 'react'
import { expect, assert } from 'chai'
import { mount } from 'enzyme'
import DropdownCreateButton from '../../src/component/common/Input/DropdownCreateButton'
import sinon from 'sinon'
import { appList } from '../hocMock/redux/appList/appList.js'
import i18n from '../../src/i18n'
import { I18nextProvider } from 'react-i18next'

describe('<DropdownCreateButton />', () => {
  const onClickCreateContentCallBack = sinon.stub()

  const props = {
    availableApp: appList,
    onClickCreateContent: onClickCreateContentCallBack,
    parentClass: 'randomParentClass',
    customClass: 'randomCustomClass',
    folderId: 1
  }

  const wrapper = mount(
    <I18nextProvider i18n={i18n}>
      <DropdownCreateButton { ...props } />
    </I18nextProvider>
  )

  describe('static design', () => {
    it(`the root div should have the parentClass: ${props.parentClass}`, () =>
      expect(wrapper.find(`div.${props.parentClass}`).length).to.equal(1)
    )

    it(`the root div should have the customClass: ${props.customClass}`, () =>
      expect(wrapper.find(`div.${props.customClass}`).length).to.equal(1)
    )

    it(`the button should have the class: ${props.parentClass}__label`, () =>
      expect(wrapper.find(`button.${props.parentClass}__label`).length).to.equal(1)
    )

    it(`a div inside the button should have the class: ${props.parentClass}__label__text`, () =>
      expect(wrapper.find(`button > div.${props.parentClass}__label__text`).length).to.equal(1)
    )

    it(`a dive inside the the root div should have the class: ${props.parentClass}__setting`, () =>
      expect(wrapper.find(`div.${props.parentClass} > div.${props.parentClass}__setting`).length).to.equal(1)
    )
  })
})
