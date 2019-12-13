import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { FileItemHeader as FileItemHeaderWithoutHOC } from '../../../src/component/Workspace/ContentItemHeader.jsx'

describe('<ContentItemHeader />', () => {
  const props = {
    showSearchDetails: true
  }

  const wrapper = shallow(<FileItemHeaderWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('should display search details when showSearchDetails is true', () =>
      expect(wrapper.find('div.content__header__search').length).to.equal(1)
    )

    it('should not display search details when showSearchDetails is false', () => {
      wrapper.setProps({ showSearchDetails: false })
      expect(wrapper.find('div.content__header__search').length).to.equal(0)
      wrapper.setProps({ showSearchDetails: props.showSearchDetails })
    })
  })
})
