import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import NewVersionBtn from '../../src/component/OptionComponent/NewVersionBtn.jsx'
import sinon from 'sinon'

describe('<NewVersionBtn />', () => {
  const onClickCallBack = sinon.spy()

  const props = {
    onClickNewVersionBtn: onClickCallBack,
    disabled: false,
    label: 'randomLabel',
    dataCy: 'random-data-cy',
    style: { color: 'yellow' },
    customColor: 'randomCustomColor',
    icon: 'upload'
  }

  const wrapper = mount(
    <NewVersionBtn
      {...props}
    />
  )

  describe('Design static', () => {
    it(`should display "${props.label}"`, () =>
      expect(wrapper.find('button')).to.have.text().equal(props.label)
    )

    it(`should display its text in color ${props.style.color}`, () =>
      expect(wrapper.find('button').prop('style').color).to.equal(props.style.color)
    )

    it('the button should be disabled when disabled is set to true', () => {
      wrapper.setProps({ disabled: true })
      expect(wrapper.find('button').prop('disabled')).to.equal(true)
      wrapper.setProps({ disabled: props.disabled })
    })

    it('should contains the customColor in the button style', () =>
      expect(wrapper.find('button').prop('style').borderColor).to.equal(props.customColor)
    )

    it(`should display the icon "${props.icon}"`, () =>
      expect(wrapper.find(`.${props.icon}`)).to.have.lengthOf(1)
    )
  })

  describe('Handlers', () => {
    it('should call props.onClick when handler onClick is called', () => {
      wrapper.find('button').simulate('click')
      expect(onClickCallBack.called).to.equal(true)
    })
  })
})
