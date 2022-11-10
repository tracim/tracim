import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { SearchInput as SearchWithoutHOC } from '../../../src/component/Search/SearchInput.jsx'
import sinon from 'sinon'

describe('<SearchInput />', () => {
  const onClickSearchCallBack = sinon.spy()

  const props = {
    onClickSearch: onClickSearchCallBack,
    onClickToggleSidebar: () => {},
    searchString: 'randomValue'
  }

  const wrapper = shallow(<SearchWithoutHOC {...props} t={key => key} />)

  // FIXME - G.B. - When it was a class component, the tests called the functions of the component from its instance,
  // now it's a functional component, this can't be done.
  // See https://github.com/tracim/tracim/issues/5223#issuecomment-1091805956
  describe.skip('intern functions', () => {
    it('handleNewSearch should change his state', () => {
      const randomValue = 'randomValue'
      wrapper.instance().handleNewSearch({ target: { value: randomValue } })
      expect(wrapper.state('searchString')).to.equal(randomValue)
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
