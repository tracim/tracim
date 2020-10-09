import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import SelectStatus from '../../src/component/Input/SelectStatus/SelectStatus.jsx'
import sinon from 'sinon'
import { status, statusList } from '../fixture/status.js'
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
      expect(wrapper.find('#dropdownMenuButton').prop('disabled')).to.equal(props.disabled)
    )

    it('should have the button disabled when the property disabled is true', () => {
      wrapper.setProps({ disabled: true })
      expect(wrapper.find('#dropdownMenuButton').prop('disabled')).to.equal(true)
      wrapper.setProps({ disabled: props.disabled })
    })

    it(`should display "${props.selectedStatus.label}" in the dropdownbtn`, () => {
      expect(wrapper.find('#dropdownMenuButton')).to.have.text().contains(props.selectedStatus.label)
    })

    it(`should have ${props.availableStatus.length} submenu_item`, () => {
      expect(wrapper.find('button.selectStatus__submenu__item')).to.have.lengthOf(props.availableStatus.length)
    })

    it(`first submenu_item should have its icon: "${props.availableStatus[0].faIcon}"`, () => {
      expect(wrapper.find('button.selectStatus__submenu__item').at(0)
        .find(`i.fa-${props.availableStatus[0].faIcon}`))
        .to.have.lengthOf(1)
    })

    it(`second submenu_item should have its icon: "${props.availableStatus[1].faIcon}"`, () => {
      expect(wrapper.find('button.selectStatus__submenu__item').at(1)
        .find(`i.fa-${props.availableStatus[1].faIcon}`))
        .to.have.lengthOf(1)
    })
  })

  describe('Handlers', () => {
    it('first submenu_item should call the proper onClick', () => {
      wrapper.find('button.selectStatus__submenu__item').first().simulate('click')
      expect(onChangeStatusCallBack.called).to.equal(true)
      onChangeStatusCallBack.resetHistory()
    })
  })
})
