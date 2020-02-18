import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { DropdownCreateButton as DropdownCreateButtonWithoutHOC } from '../../../src/component/common/Input/DropdownCreateButton.jsx'
import sinon from 'sinon'
import { appList } from '../../hocMock/redux/appList/appList.js'

describe('<DropdownCreateButton />', () => {
  const onClickCreateContentCallBack = sinon.spy()

  const props = {
    availableApp: appList,
    onClickCreateContent: onClickCreateContentCallBack,
    parentClass: 'randomParentClass',
    customClass: 'randomCustomClass',
    folderId: 1
  }

  const wrapper = shallow(<DropdownCreateButtonWithoutHOC {...props} t={key => key} />)

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

    it(`a div inside the the root div should have the class: ${props.parentClass}__setting`, () =>
      expect(wrapper.find(`div.${props.parentClass} > div.${props.parentClass}__setting`).length).to.equal(1)
    )
  })
})
