import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import RadioBtnGroup from '../../src/component/Input/RadioBtn/RadioBtn.jsx'
require('../../src/component/Input/RadioBtn/RadioBtn.styl')

describe('<RadioBtn />', () => {
  const handleNewSelectedValueCallBack = sinon.stub()

  const img = {
    src: 'randomImg',
    alt: 'randomAlt',
    height: 200,
    width: 200,
    position: 'bottom'
  }

  const props = {
    selectedIndex: 0,
    options: [{
      img: img,
      text: 'randomText1',
      value: 'randomValue1'
    }, {
      text: 'randomText2',
      value: 'randomValue2'
    }],
    handleNewSelectedValue: handleNewSelectedValueCallBack,
    customColor: 'randomColor'
  }

  const wrapper = mount(
    <RadioBtnGroup
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should have ${props.options.length} options`, () =>
      expect(wrapper.find('.radio_btn_group__btn')).to.have.lengthOf(2)
    )

    it('should have one radioBtnWithImage', () =>
      expect(wrapper.find('.radio_btn_group__btn.radio_btn_group__btn__img')).to.have.lengthOf(1)
    )

    it(`the radioBtnWithImage should display the img: "${img.src}"`, () => {
      expect(wrapper.find('.radio_btn_group__btn__img__img').prop('src')).to.equal(img.src)
      expect(wrapper.find('.radio_btn_group__btn__img__img').prop('alt')).to.equal(img.alt)
      expect(wrapper.find('.radio_btn_group__btn__img__img').prop('height')).to.equal(img.height)
      expect(wrapper.find('.radio_btn_group__btn__img__img').prop('width')).to.equal(img.width)
    })

    it(`the radioBtnWithImage should display: "${props.options[0].text}"`, () =>
      expect(wrapper.find('.radio_btn_group__btn__img__label')).to.have.text().equal(props.options[0].text)
    )

    it(`the radioBtn without image should display: "${props.options[1].text}"`, () =>
      expect(wrapper.find('.radio_btn_group__btn > label')).to.have.text().equal(props.options[1].text)
    )

    it('the radioBtnWithImage should have style.flexDirection = "column-reverse"', () => {
      expect(wrapper.find('.radio_btn_group__btn.radio_btn_group__btn__img').prop('style').flexDirection).to.equal('column-reverse')
    })

    it(`the radioBtnWithImage should have the borderColor: "${props.customColor}"`, () => {
      expect(wrapper.find('.radio_btn_group__btn.radio_btn_group__btn__img').prop('style').borderColor).to.equal(props.customColor)
    })
  })

  describe('Handlers', () => {
    it('handleNewSelectedValueCallBack should be called when the radioBtn is clicked', () => {
      wrapper.find('.radio_btn_group__btn').at(1).simulate('click')
      expect(handleNewSelectedValueCallBack.called).to.equal(true)
      expect(wrapper.state('selectedIndex')).to.equal(1)
      expect(wrapper.state('selectedValue')).to.eql(props.options[1])
      handleNewSelectedValueCallBack.resetHistory()
    })

    it('handleNewSelectedValueCallBack should be called when the radioBtnWithImage is clicked', () => {
      wrapper.find('.radio_btn_group__btn').at(0).simulate('click')
      expect(handleNewSelectedValueCallBack.called).to.equal(true)
      expect(wrapper.state('selectedIndex')).to.equal(0)
      expect(wrapper.state('selectedValue')).to.eql(props.options[0])
      handleNewSelectedValueCallBack.resetHistory()
    })
  })
})
