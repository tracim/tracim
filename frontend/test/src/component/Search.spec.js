import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Search as SearchWithoutHOC } from '../../../src/component/Header/Search.jsx'
import sinon from 'sinon'
import { translateMock } from '../../hocMock/translate.js'

describe('<Search />', () => {
  const onClickSearchCallBack = sinon.stub()

  const props = {
    onClickSearch: onClickSearchCallBack
  }

  const ComponentWithHoc = translateMock()(SearchWithoutHOC)

  const wrapper = mount(<ComponentWithHoc {...props} />)

  const wrapperInstance = wrapper.find('Search')

  describe('intern functions', () => {
    it('handleNewSearch should change his state', () => {
      const randomValue = 'randomValue'
      wrapperInstance.instance().handleNewSearch({ target: { value: randomValue } })
      expect(wrapperInstance.state('searchedKeywords')).to.equal(randomValue)
    })

    it('handleKeyDown should call handleClickSearch which call onClickSearchCallBack when the key is "Enter"', () => {
      wrapperInstance.instance().handleKeyDown({ key: 'Enter' })
      expect(onClickSearchCallBack.called).to.equal(true)
      onClickSearchCallBack.resetHistory()
    })
  })

  describe('handlers', () => {
    it('onClickSearchCallBack should be call when the button is clicked', () => {
      wrapper.find('button').simulate('click')
      expect(onClickSearchCallBack.called).to.equal(true)
    })
  })
})
