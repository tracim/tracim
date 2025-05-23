import React from 'react'
import { expect } from 'chai'
import { shallow, mount } from 'enzyme'
import { HtmlDocument } from '../../src/component/HtmlDocument.jsx'
import {
  APP_FEATURE_MODE,
  TRANSLATION_STATE,
  PromptMessage,
  TinyEditor
} from 'tracim_frontend_lib'

const props = {
  apiUrl: 'http://localhost/api',
  mode: APP_FEATURE_MODE.VIEW,
  config: {
    iframe_whitelist: []
  },
  customColor: '#654321',
  disableValidateBtn: () => false,
  version: '42',
  lastVersion: 1337,
  text: "Hi, I'm a Html Document.",
  isArchived: false,
  isDeleted: false,
  isDeprecated: false,
  displayNotifyAllMessage: false,
  deprecatedStatus: {
    label: 'Deprecated',
    slug: 'closed-deprecated',
    faIcon: 'warning',
    hexcolor: '#ababab',
    globalStatus: 'closed'
  },
  isDraftAvailable: false,
  onClickValidateBtn: () => { },
  onChangeText: () => { },
  onClickCloseEditMode: () => { },
  onClickRestoreArchived: () => { },
  onClickRestoreDeleted: () => { },
  onClickShowDraft: () => { },
  onClickNotifyAll: () => { },
  onClickCloseNotifyAllMessage: () => { },
  onClickToggleTranslation: () => { },
  translationState: TRANSLATION_STATE.DISABLED,
  t: (s, opts) => {
    for (const p in opts) {
      s = s.replace('{{' + p + '}}', opts[p])
    }
    return s
  },
  workspaceId: 1
}

describe('<HtmlDocument />', () => {
  describe('in VIEW mode', () => {
    describe('with the displayNotifyAllMessage is set a true', () => {
      const wrapper = mount(
        <HtmlDocument
          {...props}
          displayNotifyAllMessage
        />
      )

      it('should display the prompt message', () =>
        expect(wrapper.find('.html-document__contentpage__left__wrapper'))
          .to.have.descendants(PromptMessage)
          .and
          .have.html().to.contains('far fa-hand-point-right')
      )
    })

    describe('with an archived content', () => {
      const wrapper = mount(
        <HtmlDocument
          {...props}
          isArchived
        />
      )

      it('should display the archived warning', () =>
        expect(wrapper.find('.html-document__contentpage__left__wrapper'))
          .to.have.descendants(PromptMessage)
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
          .to.have.descendants(PromptMessage)
          .and
          .have.html().to.contains('fa-trash-alt')
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
          .to.have.descendants(PromptMessage)
          .and
          .have.html().to.contains(`${props.deprecatedStatus.faIcon}`)
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
          .to.have.descendants(PromptMessage)
          .and
          .have.html().to.contains('far fa-hand-point-right')
      )
    })
  })
})

describe('in EDIT mode', () => {
  const wrapper = shallow(
    <HtmlDocument
      {...props}
      mode={APP_FEATURE_MODE.EDIT}
    />
  )

  it('should contain a <TinyEditor /> component', () =>
    expect(wrapper.find('.html-document__contentpage__textnote')).to.have.descendants(TinyEditor)
  )
})
