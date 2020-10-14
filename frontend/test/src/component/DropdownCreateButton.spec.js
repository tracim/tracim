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
    folderId: 1
  }

  const wrapper = shallow(<DropdownCreateButtonWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display ${props.availableApp.length} available app`, () =>
      expect(wrapper.find('button.transparentButton').length).to.equal(props.availableApp.length)
    )

    describe('handler', () => {
      it('onClickCreateContentCallBack should be called when a app is clicked', () => {
        wrapper.find('button.transparentButton').first().simulate('click', { preventDefault: () => { }, stopPropagation: () => { } })
        expect(onClickCreateContentCallBack.called).to.equal(true)
      })
    })
  })
})
