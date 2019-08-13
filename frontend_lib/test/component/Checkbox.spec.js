import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Checkbox from '../../src/component/Input/Checkbox.jsx'

describe('<Checkbox />', () => {
  const onClickCheckbox = sinon.stub()

  const props = {
    name: 'randomName',
    onClickCheckbox: onClickCheckbox,
    checked: false,
    defaultChecked: false,
    disabled: false,
    styleLabel: { color: 'yellow' },
    styleCheck: { color: 'red' }
  }

  const wrapper = shallow(
    <Checkbox
      {...props}
    />
  )

  describe('Static design', () => {
    it(`the label's htmlFor property should contains "${props.name} "`, () =>
      expect(wrapper.find(`label.checkboxCustom`).prop('htmlFor')).to.contains(props.name)
    )

    it(`should not diplay the div .checboxCustom__checked if checked is false`, () =>
      expect(wrapper.find(`div.checkboxCustom__checked`)).to.have.lengthOf(0)
    )

    it(`should diplay the div .checkboxCustom__checked if checked is true`, () => {
      wrapper.setProps({ checked: true })
      expect(wrapper.find(`div.checkboxCustom__checked`)).to.have.lengthOf(1)
      wrapper.setProps({ checked: props.checked })
    })

    it(`the label's style should contains its styleLabel`, () => {
      expect(wrapper.find(`label.checkboxCustom`).prop('style')).to.contains(props.styleLabel)
    })

    it(`the div .checkboxCustom__checked style should contains its styleLabel`, () => {
      wrapper.setProps({ checked: true })
      expect(wrapper.find(`div.checkboxCustom__checked`).prop('style')).to.contains(props.styleCheck)
      wrapper.setProps({ checked: props.checked })
    })

    it(`the input should have defaultChecked set to ${props.defaultChecked}`, () => {
      expect(wrapper.find(`input`).prop('defaultChecked')).to.equal(props.defaultChecked)
    })

    it('the label should have the class "checked" when checked is true', () => {
      wrapper.setProps({ checked: true })
      expect(wrapper.find(`label.checkboxCustom.checked`)).to.have.lengthOf(1)
      wrapper.setProps({ checked: props.checked })
    })
  })

  describe('Handlers', () => {
    it('onClickCheckbox handler should call the proper handler', () => {
      wrapper.find(`label.checkboxCustom`).simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onClickCheckbox.called).to.equal(true)
    })
  })
})
