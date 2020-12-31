import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import IconButton from '../../src/component/Button/IconButton.jsx'
import sinon from 'sinon'

describe('<IconButton />', () => {
  const onClickCallBack = sinon.spy()

  const props = {
    icon: 'test',
    customClass: 'random_class',
    onClick: onClickCallBack,
    disabled: false,
    text: 'randomText'
  }

  const wrapper = shallow(
    <IconButton
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display "${props.text}"`, () =>
      expect(wrapper.find(`button.${props.customClass}`)).to.have.text().equal(props.text)
    )

    it(`should have the class "${props.customClass}"`, () =>
      expect(wrapper.find(`button.${props.customClass}`)).to.have.lengthOf(1)
    )

    it(`button disabled property should be set to: ${props.disabled}`, () =>
      expect(wrapper.find(`button.${props.customClass}`).prop('disabled')).to.equal(props.disabled)
    )

    it(`should have the icon: "${props.icon}"`, () =>
      expect(wrapper.find(`.fa.fa-${props.icon}`)).to.have.lengthOf(1)
    )
  })

  describe('Handlers', () => {
    it('should call props.onClick when handler onClick is called', () => {
      wrapper.find(`button.${props.customClass}`).simulate('click')
      expect(onClickCallBack.called).to.equal(true)
    })
  })
})
