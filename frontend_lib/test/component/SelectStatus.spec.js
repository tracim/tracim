import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import SelectStatus from '../../src/component/Input/SelectStatus/SelectStatus.jsx'
import sinon from 'sinon'
require('../../src/component/Input/SelectStatus/SelectStatus.styl')

describe('<SelectStatus />', () => {
  const onChangeStatusCallBack = sinon.stub()

  const props = {
    availableStatus: [
      {
        slug: 'randomSlug1',
        customColor: 'randomCustomColor1',
        faIcon: 'randomFaIcon1',
        hexcolor: 'randomHexColor1',
        label: 'randomLabel1'
      },
      {
        slug: 'randomSlug2',
        customColor: 'randomCustomColor2',
        faIcon: 'randomFaIcon2',
        hexcolor: 'randomHexColor2',
        label: 'randomLabel2'
      }],
    selectedStatus: {
      slug: 'randomSlug3',
      customColor: 'randomCustomColor3',
      faIcon: 'randomFaIcon3',
      hexcolor: 'randomHexColor3',
      label: 'randomLabel3'
    },
    disabled: false,
    onChangeStatus: onChangeStatusCallBack
  }

  const wrapper = mount(
    <SelectStatus
      {...props }
    />
  )

  describe('Static design', () => {
    it(`should have the button not disabled when disabled is false`, () =>
      expect(wrapper.find('#dropdownMenu2').prop('disabled')).to.equal(props.disabled)
    )

    it(`should have the button disabled when disabled is true`, () => {
      wrapper.setProps({ disabled: true })
      expect(wrapper.find('#dropdownMenu2').prop('disabled')).to.equal(true)
      wrapper.setProps({ disabled: props.disabled })
    })

    it(`should display "${props.selectedStatus.label}" in the dropdownbtn`, () => {
      expect(wrapper.find('#dropdownMenu2')).to.have.text().contains(props.selectedStatus.label)
    })

    it(`should have 2 submenu_item`, () => {
      expect(wrapper.find(`button.selectStatus__submenu__item`)).to.have.lengthOf(2)
    })

    it(`first submenu_item should have its icon: "${props.availableStatus[0].faIcon}"`, () => {
      expect(wrapper.find(`button.selectStatus__submenu__item`).at(0)
        .find(`i.fa-${props.availableStatus[0].faIcon}`))
        .to.have.lengthOf(1)
    })

    it(`second submenu_item should have its icon: "${props.availableStatus[1].faIcon}"`, () => {
      expect(wrapper.find(`button.selectStatus__submenu__item`).at(1)
        .find(`i.fa-${props.availableStatus[1].faIcon}`))
        .to.have.lengthOf(1)
    })

    it(`first submenu_item should have its icon: "${props.availableStatus[0].faIcon}"`, () => {
      expect(wrapper.find(`button.selectStatus__submenu__item`).at(0)
        .find(`i.fa-${props.availableStatus[0].faIcon}`))
        .to.have.lengthOf(1)
    })
  })

  describe('Handlers', () => {
    it(`first submenu_item should call the proper onClick`, () => {
      wrapper.find(`button.selectStatus__submenu__item`).at(0).simulate('click')
      expect(onChangeStatusCallBack.called).to.equal(true)
      onChangeStatusCallBack.resetHistory()
    })
  })
})
