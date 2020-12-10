import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Breadcrumbs } from '../../src/component/Breadcrumbs/Breadcrumbs.jsx'
require('../../src/component/Breadcrumbs/Breadcrumbs.styl')

describe('<Breadcrumbs />', () => {
  const breadcrumbsList = [{
    link: <a href='/ui'><i className='fa fa-home' />Home</a>,
    label: 'Home',
    type: 'CORE'
  }, {
    link: <span className='nolink'>First level</span>,
    label: 'First level',
    type: 'CORE',
    notALink: true
  }, {
    link: <a className='secondlvl' href='/ui/second'>Second level</a>,
    label: 'Second level',
    type: 'CORE'
  }]

  const props = {
    breadcrumbsList: breadcrumbsList,
    t: key => key
  }
  const wrapper = shallow(
    <Breadcrumbs {...props} />
  )

  describe('The first level', () => {
    it('should display "First level"', () => expect(wrapper.find('.nolink')).to.have.text().to.be.equal('First level'))
    it('should NOT have the class primaryColorFontDarkenHover and primaryColorFont', () => {
      expect(wrapper.find('.nolink').parent()).to.have.attr('class').to.not.contains('primaryColorFontDarkenHover')
      expect(wrapper.find('.nolink').parent()).to.have.attr('class').to.not.contains('primaryColorFont')
    })
  })

  describe('The second level', () => {
    it('should display "Second level"', () => expect(wrapper.find('.secondlvl')).to.have.text().to.be.equal('Second level'))
    it('should have the class primaryColorFontDarkenHover and primaryColorFont', () => {
      expect(wrapper.find('.secondlvl').parent()).to.have.attr('class').to.contains('primaryColorFontDarkenHover')
      expect(wrapper.find('.secondlvl').parent()).to.have.attr('class').to.contains('primaryColorFont')
    })
  })
})
