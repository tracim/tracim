import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { WebdavInfo } from '../../../src/component/Account/WebdavInfo.jsx'

describe('<WebdavInfo />', () => {
  const props = {
    customClass: 'randomCustomClass',
    introText: 'randomIntroText',
    webdavText: 'randomWebdavText',
    webdavUrl: 'randomWebdavUrl'
  }

  const wrapper = shallow(<WebdavInfo {...props} />)

  describe('static design', () => {
    it(`the root div should have the class: ${props.customClass}`, () =>
      expect(wrapper.find(`div.webdavInfo.${props.customClass}`).length).to.equal(1)
    )

    it(`should display the introText: ${props.introText}`, () =>
      expect(wrapper.find('div.webdavInfo__content__text > div')).to.text().contains(props.introText)
    )

    it(`should display the webdavText: ${props.webdavText}`, () =>
      expect(wrapper.find('a.webdavInfo__content__text__help')).to.text().equal(props.webdavText)
    )

    it(`should display the webdavUrl: ${props.webdavText}`, () =>
      expect(wrapper.find('div.webdavInfo__content__link__url')).to.text().equal(props.webdavUrl)
    )
  })
})
