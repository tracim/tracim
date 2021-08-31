import React from 'react'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { expect } from 'chai'
import { mount } from 'enzyme'
import Comment from '../../src/component/Timeline/Comment.jsx'
import { TRANSLATION_STATE } from '../../src/translation.js'

const nock = require('nock')

describe('<Comment />', () => {
  const props = {
    apiUrl: 'http://fake.url/api',
    created: '0',
    customClass: 'randomCustomClass',
    customColor: '#252525',
    author: { public_name: 'randomAuthor', user_id: 1, username: 'admin' },
    isPublication: false,
    loggedUser: { public_name: 'randomUser' },
    text: 'randomText',
    contentId: 1337,
    workspaceId: 42,
    apiContent: {
      id: 1337,
      workspaceId: 42,
      type: 'comment',
      CurrentRevisionId: 1338
    },
    onClickTranslate: () => {},
    onClickRestore: () => {},
    onClickEditComment: () => {},
    onClickDeleteComment: () => {},
    fromMe: true,
    translationState: TRANSLATION_STATE.DISABLED,
    onChangeTranslationTargetLanguageCode: () => {},
    translationTargetLanguageCode: 'en',
    targetLanguageList: [{ code: 'fr', display: 'Français' }],
    translationTargetLanguageList: [{ code: 'fr', display: 'Français' }],
    onChangeTargetLanguageCode: () => {}
  }

  function mockReactions () {
    nock(props.apiUrl).get(`/workspaces/${props.workspaceId}/contents/${props.contentId}/reactions`).reply(200, [])
  }

  const CommentWithHOC = withRouterMock(Comment)

  mockReactions()
  const wrapper = mount(<CommentWithHOC {...props} />, { wrappingComponent: RouterMock })

  describe('Static design', () => {
    it(`should have the class '${props.customClass}__messagelist__item'`, () => {
      expect(wrapper.find(`div.${props.customClass}__messagelist__item`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}'`, () => {
      expect(wrapper.find(`div.${props.customClass}`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__body'`, () => {
      expect(wrapper.find(`div.${props.customClass}__body`)).to.have.lengthOf(1)
    })

    it(`should display the author ${props.author.public_name} of the comment`, () => {
      expect(wrapper.find(`span.${props.customClass}__body__content__header__meta__author`)).to.have.text().equal(props.author.public_name)
    })

    it(`should display the text ${props.text} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body__content__text`).render()).to.have.text().equal(props.text)
    })

    it('should have the className "sent" when it is your comment', () => {
      mockReactions()
      const wrapper = mount(<CommentWithHOC {...props} fromMe />, { wrappingComponent: RouterMock })
      expect(wrapper.find(`div.${props.customClass}.sent`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.customClass}.received`)).to.have.lengthOf(0)
    })

    it('should have the className "received" when it is your comment', () => {
      mockReactions()
      const wrapper = mount(<CommentWithHOC {...props} fromMe={false} />, { wrappingComponent: RouterMock })
      expect(wrapper.find(`div.${props.customClass}.received`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.customClass}.sent`)).to.have.lengthOf(0)
    })
  })
})
