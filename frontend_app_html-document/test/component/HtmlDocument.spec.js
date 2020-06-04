import React from 'react'
import { expect } from 'chai'
import { shallow, mount } from 'enzyme'
import { HtmlDocument } from '../../src/component/HtmlDocument.jsx'
import {
  TextAreaApp,
  DisplayState,
  APP_FEATURE_MODE
} from 'tracim_frontend_lib'

const props = {
  mode: APP_FEATURE_MODE.VIEW,
  customColor: '#654321',
  wysiwygNewVersion: 'wysiwygNewVersionTest',
  disableValidateBtn: false,
  version: '42',
  lastVersion: '1337',
  text: "Hi, I'm a Html Document.",
  isArchived: false,
  isDeleted: false,
  isDeprecated: false,
  deprecatedStatus: {
    label: 'Deprecated',
    slug: 'closed-deprecated',
    faIcon: 'warning',
    hexcolor: '#ababab',
    globalStatus: 'closed'
  },
  isDraftAvailable: false,
  onClickValidateBtn: () => {},
  onChangeText: () => {},
  onClickCloseEditMode: () => {},
  onClickRestoreArchived: () => {},
  onClickRestoreDeleted: () => {},
  onClickShowDraft: () => {},
  t: () => {}
}

describe('<HtmlDocument />', () => {
  describe('in VIEW mode', () => {
    const wrapper = shallow(
      <HtmlDocument {...props} />
    )

    it(`should display the last version number ${props.lastVersion}`, () =>
      expect(wrapper.find('.html-document__contentpage__textnote__version').render().text()).to.contains(props.lastVersion)
    )

    it('should display the content of the document', () =>
      expect(wrapper.find('.html-document__contentpage__textnote__text').render().text()).to.contains(props.text)
    )

    describe('with an archived content', () => {
      const wrapper = mount(
        <HtmlDocument
          {...props}
          isArchived
        />
      )

      it('should display the archived warning', () =>
        expect(wrapper.find('.html-document__contentpage__left__wrapper'))
          .to.have.descendants(DisplayState)
          .and
          .have.html().to.contains('fa-archive')
      )
    })

    describe('with a deleted content', () => {
      const wrapper = mount(
        <HtmlDocument
          {...props}
          isDeleted
        />
      )

      it('should display the trash warning', () =>
        expect(wrapper.find('.html-document__contentpage__left__wrapper'))
          .to.have.descendants(DisplayState)
          .and
          .have.html().to.contains('fa-trash')
      )
    })

    describe('with a deprecated content', () => {
      const wrapper = mount(
        <HtmlDocument
          {...props}
          isDeprecated
        />
      )

      it(`should display the ${props.deprecatedStatus.faIcon} warning`, () =>
        expect(wrapper.find('.html-document__contentpage__left__wrapper'))
          .to.have.descendants(DisplayState)
          .and
          .have.html().to.contains(`fa-${props.deprecatedStatus.faIcon}`)
      )
    })

    describe('with a draft available', () => {
      const wrapper = mount(
        <HtmlDocument
          {...props}
          isDraftAvailable
        />
      )

      it('should display the "resume writing" button', () =>
        expect(wrapper.find('.html-document__contentpage__textnote'))
          .to.have.descendants(DisplayState)
          .and
          .have.html().to.contains('fa-hand-o-right')
      )
    })
  })
})

describe('in REVISON mode', () => {
  const wrapper = shallow(
    <HtmlDocument
      {...props}
      mode={APP_FEATURE_MODE.REVISION}
    />
  )

  it(`should display the version number ${props.version}`, () =>
    expect(wrapper.find('.html-document__contentpage__textnote__version').render().text()).to.contains(props.version)
  )
  it(`should display the last version number ${props.lastVersion}`, () =>
    expect(wrapper.find('.html-document__contentpage__textnote__lastversion').render().text()).to.contains(props.lastVersion)
  )
})

describe('in EDIT mode', () => {
  const wrapper = shallow(
    <HtmlDocument
      {...props}
      mode={APP_FEATURE_MODE.EDIT}
    />
  )

  it('should contain a <TextAreaApp /> component', () =>
    expect(wrapper.find('.html-document__contentpage__textnote')).to.have.descendants(TextAreaApp)
  )
})
