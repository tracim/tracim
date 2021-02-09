import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Search as SearchWithoutHOC } from '../../../src/component/Search/Search.jsx'
import sinon from 'sinon'

describe('<Search />', () => {
  const onClickSearchCallBack = sinon.spy()

  const props = {
    onClickSearch: onClickSearchCallBack
  }

  const wrapper = shallow(<SearchWithoutHOC {...props} t={key => key} />)

  describe('intern functions', () => {
    it('handleNewSearch should change his state', () => {
      const randomValue = 'randomValue'
      wrapper.instance().handleNewSearch({ target: { value: randomValue } })
      expect(wrapper.state('searchedKeywords')).to.equal(randomValue)
    })

    it('handleKeyDown should call handleClickSearch which call onClickSearchCallBack when the key is "Enter"', () => {
      wrapper.instance().handleKeyDown({ key: 'Enter' })
      expect(onClickSearchCallBack.called).to.equal(true)
      onClickSearchCallBack.resetHistory()
    })
  })

  describe('handler', () => {
    it('onClickSearchCallBack should be call when the button is clicked', () => {
      wrapper.find('button').simulate('click')
      expect(onClickSearchCallBack.called).to.equal(true)
    })
  })
})
