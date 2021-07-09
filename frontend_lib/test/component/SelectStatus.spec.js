import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import SelectStatus from '../../src/component/Input/SelectStatus/SelectStatus.jsx'
import sinon from 'sinon'
import { status, statusList } from '../fixture/status.js'
import IconButton from '../../src/component/Button/IconButton.jsx'
require('../../src/component/Input/SelectStatus/SelectStatus.styl')

describe('<SelectStatus />', () => {
  const onChangeStatusCallBack = sinon.spy()

  const props = {
    availableStatus: statusList,
    selectedStatus: status.VALIDATED,
    disabled: false,
    onChangeStatus: onChangeStatusCallBack
  }

  const wrapper = mount(
    <SelectStatus
      {...props}
    />
  )

  describe('Static design', () => {
    it('should have the button enabled when the property disabled is false', () =>
      expect(wrapper.find('.dropdownMenuButton').prop('disabled')).to.equal(props.disabled)
    )

    it('should have the button disabled when the property disabled is true', () => {
      wrapper.setProps({ disabled: true })
      expect(wrapper.find('.dropdownMenuButton').prop('disabled')).to.equal(true)
      wrapper.setProps({ disabled: props.disabled })
    })

    it(`should display "${props.selectedStatus.label}" in the dropdownbtn`, () => {
      expect(wrapper.find('.dropdownMenuButton')).to.have.text().contains(props.selectedStatus.label)
    })

    it(`should have ${props.availableStatus.length} submenu_item`, () => {
      expect(wrapper.find(IconButton)).to.have.lengthOf(props.availableStatus.length)
    })

    it(`first submenu_item should have its icon: "${props.availableStatus[0].faIcon}"`, () => {
      expect(wrapper.find(IconButton).at(0).prop('icon')).to.equal(props.availableStatus[0].faIcon)
    })

    it(`second submenu_item should have its icon: "${props.availableStatus[1].faIcon}"`, () => {
      expect(wrapper.find(IconButton).at(1).prop('icon')).to.equal(props.availableStatus[1].faIcon)
    })
  })

  describe('Handlers', () => {
    it('first submenu_item should call the proper onClick', () => {
      wrapper.find(IconButton).first().simulate('click')
      expect(onChangeStatusCallBack.called).to.equal(true)
      onChangeStatusCallBack.resetHistory()
    })
  })
})
