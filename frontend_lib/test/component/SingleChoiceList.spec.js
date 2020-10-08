import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import SingelChoiceList from '../../src/component/Input/SingleChoiceList/SingleChoiceList.jsx'
require('../../src/component/Input/SingleChoiceList/SingleChoiceList.styl')

describe('<SingelChoiceList />', () => {
  const onChangeCallBack = sinon.spy()

  const props = {
    list: [{ slug: 'random' }, { slug: 'currentValue' }],
    onChange: onChangeCallBack,
    currentValue: 'randomcurrentValue'
  }

  const wrapper = mount(
    <SingelChoiceList
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should display ${props.list.length} values`, () => {
      expect(wrapper.find('.singleChoiceList__item').length).equal(props.list.length)
      for (let i = 0; i < props.list.length; i++) {
        expect(wrapper.find(`[value='${props.list[i].slug}']`).length)
          .to.equal(1)
        expect(wrapper.find(`[value='${props.list[i].slug}']`).prop('checked'))
          .to.equal(props.list[i].slug === props.currentValue)
      }
    })
  })

  describe('Handlers', () => {
    it('should call props.onChange when handler onChange is called', () => {
      wrapper.find('.singleChoiceList__item__radioButton > input').first().simulate('change')
      expect(onChangeCallBack.called).to.equal(true)
    })
  })
})
