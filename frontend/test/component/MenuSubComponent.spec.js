import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { MenuSubComponent as MenuSubComponentWithoutHOC } from '../../src/component/Account/MenuSubComponent'
import { translateMock } from '../hocMock/translate'

describe('<MenuSubComponent />', () => {
  const onClickMenuItemCallBack = sinon.stub()

  const props = {
    menu : [{
      name: 'randomItem1',
      label: 'randomLabel1',
      active: true
    },{
      name: 'randomItem2',
      label: 'randomLabel2',
      active: false
    }],
    onClickMenuItem: onClickMenuItemCallBack,
  }

  const ComponentWithHoc = translateMock()(MenuSubComponentWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {
    it(`should render ${props.menu.length} items`, () => {
      expect(wrapper.find('li').length).to.equal(props.menu.length)
    })

    it(`should display the name each items (li)`, () => {
      for(let i=0; i < props.menu.length; i++) {
        expect(wrapper.find('div.menusubcomponent__list__item__link').at(i)).to.have.text().equal(props.menu[i].label)
      }
    })

    it('active item in menu should have the class primaryColorBgLighten', () => {
      expect(wrapper.find('li.menusubcomponent__list__item.primaryColorBgLighten').length).to.equal(1)
    })
  })

  describe('handlers', () => {
    it('onClickMenuItemCallBack should be called when an item is clicked', () => {
      wrapper.find('li').at(0).simulate('click')
      expect(onClickMenuItemCallBack.called).to.equal(true)
    })
  })
})
