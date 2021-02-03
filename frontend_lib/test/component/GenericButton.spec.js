import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import GenericButton from '../../src/component/Button/GenericButton.jsx'
import sinon from 'sinon'

describe('<GenericButton />', () => {
  const onClickCallBack = sinon.spy()

  const props = {
    onClick: onClickCallBack,
    disabled: false,
    customClass: 'randomCustomClass',
    label: 'randomLabel',
    dataCy: 'random-data-cy',
    faIcon: 'randomIcon',
    style: { color: 'yellow' },
    customColor: 'randomCustomColor'
  }

  const wrapper = shallow(
    <GenericButton
      {...props}
    />
  )

  describe('Design static', () => {
    it(`should display "${props.label}"`, () =>
      expect(wrapper.find('button')).to.have.text().equal(props.label)
    )

    it(`the button should have the class "${props.customClass}"`, () =>
      expect(wrapper.find(`button.${props.customClass}`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.style.color}`, () =>
      expect(wrapper.find('button').prop('style').color).to.equal(props.style.color)
    )

    it(`should have the icon: ${props.faIcon}`, () =>
      expect(wrapper.find(`i.${props.faIcon}`)).to.have.lengthOf(1)
    )

    it(`should have the icon: ${props.faIcon}`, () =>
      expect(wrapper.find(`i.${props.faIcon}`)).to.have.lengthOf(1)
    )

    it('the button should be disabled when disabled is set to true', () => {
      wrapper.setProps({ disabled: true })
      expect(wrapper.find('button').prop('disabled')).to.equal(true)
      wrapper.setProps({ disabled: props.disabled })
    })

    it('should contains the customColor in the button style', () =>
      expect(wrapper.find('button').prop('style').borderColor).to.equal(props.customColor)
    )
  })

  describe('Handlers', () => {
    it('should call props.onClick when handler onClick is called', () => {
      wrapper.find('button').simulate('click')
      expect(onClickCallBack.called).to.equal(true)
    })
  })
})
