import React from 'react'
import { expect, assert } from 'chai'
import { mount } from 'enzyme'
import { FileItemHeader as FileItemHeaderWithoutHOC } from '../../src/component/Workspace/ContentItemHeader'
import { translateMock } from '../hocMock/translate'

describe('<ContentItemHeader />', () => {
  const props = {
    showSearchDetails: true
  }

  const ComponentWithHoc = translateMock()(FileItemHeaderWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

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
