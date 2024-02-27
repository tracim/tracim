import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { Breadcrumbs } from '../../src/component/Breadcrumbs/Breadcrumbs.jsx'
require('../../src/component/Breadcrumbs/Breadcrumbs.styl')

describe('<Breadcrumbs />', () => {
  const breadcrumbsList = [{
    link: '/ui',
    label: 'Home',
    type: 'CORE',
    isALink: true
  }, {
    link: '',
    label: 'First level',
    type: 'CORE',
    isALink: false
  }, {
    link: '/ui/second',
    label: 'Second level',
    type: 'CORE',
    isALink: true
  }]

  const props = {
    breadcrumbsList: breadcrumbsList,
    keepLastBreadcrumbAsLink: true,
    t: key => key
  }

  const BreadcrumbsWithHOC = withRouterMock(Breadcrumbs)
  const wrapper = mount(<BreadcrumbsWithHOC {...props} />, { wrappingComponent: RouterMock })

  describe('The first level', () => {
    it('should display "First level"', () => expect(wrapper.find('.breadcrumbs__item').at(1)).to.have.text().to.contains('First level'))
  })

  describe('The second level', () => {
    it('should display "Second level"', () => expect(wrapper.find('.breadcrumbs__item').at(2)).to.have.text().to.be.equal('Second level'))
  })
})
