import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import DropdownLang from '../../../src/component/Header/MenuActionListItem/DropdownLang.jsx'
import sinon from 'sinon'

describe('<DropdownLang />', () => {
  const onChangeLangCallBack = sinon.stub()

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
    it(`should display the icon of the current active lang: ${props.langActiveId}`, () =>
      expect(wrapper.find('img.dropdownlang__dropdown__btnlanguage__imgselected').prop('src')).to.equal(props.langList[0].icon)
    )

    it(`should display the label of the current active lang: ${props.langActiveId}`, () =>
      expect(wrapper.find('button.dropdownlang__dropdown__btnlanguage')).to.text().contains(props.langList[0].label)
    )

    it(`should display ${props.langList.length - 1} dropdown link for the others languages`, () => {
      expect(wrapper.find('div.dropdownlang__dropdown__subdropdown__link').length).to.equal(props.langList.length - 1)
    })

    it(`should display the label of each other language`, () => {
      for (let i = 1; i < props.langList.length; i++) {
        expect(wrapper.find('div.dropdownlang__dropdown__subdropdown__link').at(i - 1)).to.text().equal(props.langList[i].label)
      }
    })

    it(`should display the icon of each other language`, () => {
      for (let i = 1; i < props.langList.length; i++) {
        expect(wrapper.find('img.dropdownlang__dropdown__subdropdown__link__flag').at(i - 1).prop('src')).to.equal(props.langList[i].icon)
      }
    })
  })

  describe('handler', () => {
    it('onChangeLangCallBack should be called when a language link is clicked', () => {
      wrapper.find('div.dropdownlang__dropdown__subdropdown__link').at(0).simulate('click')
      expect(onChangeLangCallBack.called).to.equal(true)
    })
  })
})
