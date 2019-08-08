import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import IconButton from '../../src/component/Button/IconButton.jsx'
import sinon from 'sinon'

describe('<IconButton />', () => {
  const onClickCallBack = sinon.stub()

  const props = {
    icon: 'test',
    className: 'ramdom_class',
    onClick: onClickCallBack,
    disabled: false,
    text: 'randomText',
    style: {
      color: 'yellow'
    }
  }

  const wrapper = shallow(
    <IconButton
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display "${props.text}"`, () =>
      // INFO - GM - 2019-08-06 - Is it normal to have a space before the text ?
      expect(wrapper.find(`button.${props.className}.btn`)).to.have.text().equal(' ' + props.text)
    )

    it(`should have the class "${props.className}"`, () =>
      expect(wrapper.find(`button.${props.className}.btn`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.style.color}`, () =>
      expect(wrapper.find(`button.${props.className}.btn`).prop('style')).to.deep.equal(props.style)
    )

    it(`button disabled property should be set to: ${props.disabled}`, () =>
      expect(wrapper.find(`button.${props.className}.btn`).prop('disabled')).to.equal(props.disabled)
    )

    it(`should have the icon: "${props.icon}"`, () =>
      expect(wrapper.find(`.fa.fa-${props.icon}`)).to.have.lengthOf(1)
    )
  })

  describe('Handlers', () => {
    it(`onClick handler should call the proper handler when the icon button is clicked`, () => {
      wrapper.find(`button.${props.className}.btn`).simulate('click')
      expect(onClickCallBack.called).to.equal(true)
    })
  })
})
