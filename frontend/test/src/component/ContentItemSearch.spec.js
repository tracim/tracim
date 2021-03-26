import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ContentItemSearch as ContentItemSearchWithoutHOC } from '../../../src/component/Search/ContentItemSearch.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'

describe('<ContentItemSearch />', () => {
  const status = contentType[2].availableStatuses[0]

  const props = {
    statusSlug: status.slug,
    customClass: 'randomCustomClass',
    label: 'randomLabel',
    fileName: 'randomFileName',
    fileExtension: 'randomFileExtension',
    contentType: contentType[2],
    faIcon: 'randomFaIcon',
    urlContent: 'randomUrlContent',
    path: 'randomPath',
    lastModificationTime: '05/08/2019',
    lastModificationFormated: '2019/05/08',
    lastModificationAuthor: 'randomAuthor'
  }

  const wrapper = shallow(<ContentItemSearchWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it('should display the path in a div', () =>
      expect(wrapper.find('div.content__path')).to.text().equal(props.path)
    )

    it(`should display the lastModificationTime: ${props.lastModificationTime}`, () =>
      expect(wrapper.find('div.content__lastModification')).to.text().contains(props.lastModificationTime)
    )

    it(`should display the status label: ${status.label} in a div`, () =>
      expect(wrapper.find('div.content__status__text')).to.text().equal(status.label)
    )

    it(`should display the status icon: ${status.faIcon}`, () =>
      expect(wrapper.find('div.content__status__icon').children('i').prop('className')).include(status.faIcon)
    )

    it(`should display the icon: ${props.faIcon}`, () =>
      expect(wrapper.find(`div.content__type > i.${props.faIcon}`).length).to.equal(1)
    )

    it(`the div .content__type should have the color: ${props.contentType.hexcolor}`, () =>
      expect(wrapper.find('div.content__type').prop('style').color).to.equal(props.contentType.hexcolor)
    )

    it(`the div .content__type should have the title: ${props.contentType.label}`, () =>
      expect(wrapper.find('div.content__type').prop('title')).to.equal(props.contentType.label)
    )

    it(`the div .content__path should have the title: ${props.path}`, () =>
      expect(wrapper.find('div.content__path').prop('title')).to.equal(props.path)
    )

    it(`the div .content__lastModification should have the title: ${props.lastModificationFormated}`, () =>
      expect(wrapper.find('div.content__lastModification').prop('title')).to.equal(props.lastModificationFormated)
    )

    it(`the div .content__status should have the title: ${status.label}`, () =>
      expect(wrapper.find('div.content__status').prop('title')).to.equal(status.label)
    )
  })
})
