import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { BrowserRouter } from 'react-router-dom'
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
  const history = require('history').createBrowserHistory()

  // INFO - CH - 2020-01-11 - <Breadcrumbs /> contains <Link> components from react router.
  // So we need to wrap it in a Router so we need to use mount() instead of shallow()
  const wrapper = mount(
    <BrowserRouter history={history}>
      <Breadcrumbs {...props} />
    </BrowserRouter>
  )

  describe('The first level', () => {
    it('should display "First level"', () => expect(wrapper.find('.breadcrumbs__item').at(1)).to.have.text().to.be.equal('First level'))
    it('should NOT have the class primaryColorFontDarkenHover and primaryColorFont', () => {
      expect(wrapper.find('.breadcrumbs__item').at(1)).to.have.attr('class').to.not.contains('primaryColorFontDarkenHover')
      expect(wrapper.find('.breadcrumbs__item').at(1)).to.have.attr('class').to.not.contains('primaryColorFont')
    })
  })

  describe('The second level', () => {
    it('should display "Second level"', () => expect(wrapper.find('.breadcrumbs__item').at(2)).to.have.text().to.be.equal('Second level'))
    it('should have the class primaryColorFontDarkenHover and primaryColorFont', () => {
      expect(wrapper.find('.breadcrumbs__item').at(2)).to.have.attr('class').to.contains('primaryColorFontDarkenHover')
      expect(wrapper.find('.breadcrumbs__item').at(2)).to.have.attr('class').to.contains('primaryColorFont')
    })
  })
})
