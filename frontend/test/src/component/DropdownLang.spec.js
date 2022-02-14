import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import DropdownLang from '../../../src/component/Header/MenuActionListItem/DropdownLang.jsx'
import sinon from 'sinon'

describe('<DropdownLang />', () => {
  const onChangeLangCallBack = sinon.spy()

  const props = {
    langList: [{
      id: 'fr',
      label: 'French',
      icon: 'iconFrench'
    }, {
      id: 'en',
      label: 'English',
      icon: 'iconEnglish'
    }, {
      id: 'cn',
      label: '中文',
      icon: 'iconChinese'
    }],
    langActiveId: 'fr',
    onChangeLang: onChangeLangCallBack
  }

  const wrapper = shallow(<DropdownLang {...props} />)

  describe('static design', () => {
    it(`should display ${props.langList.length - 1} dropdown link for the others languages`, () => {
      expect(wrapper.find('button.transparentButton').length).to.equal(props.langList.length - 1)
    })

    it('should display the label of each other language', () => {
      for (let i = 1; i < props.langList.length; i++) {
        expect(wrapper.find('button.transparentButton').at(i - 1)).to.text().equal(props.langList[i].label)
      }
    })
  })

  describe('handler', () => {
    it('onChangeLangCallBack should be called when a language link is clicked', () => {
      wrapper.find('button.transparentButton').at(0).simulate('click')
      expect(onChangeLangCallBack.called).to.equal(true)
    })
  })
})
