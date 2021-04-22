import React from 'react'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { expect } from 'chai'
import { mount } from 'enzyme'
import Comment from '../../src/component/Timeline/Comment.jsx'
import { TRANSLATION_STATE } from '../../src/translation.js'

describe('<Comment />', () => {
  const props = {
    apiUrl: '',
    createdRaw: 'date',
    customClass: 'randomCustomClass',
    customColor: '#252525',
    author: { public_name: 'randomAuthor' },
    isPublication: false,
    loggedUser: { public_name: 'randomUser' },
    text: 'randomText',
    createdFormated: 'randomCreatedFormated',
    createdDistance: 'randomCreatedDistance',
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
    translationState: TRANSLATION_STATE.DISABLED
  }

  const CommentWithHOC = withRouterMock(Comment)
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
      expect(wrapper.find(`div.${props.customClass}__body__content__header__meta__author`)).to.have.text().equal(props.author.public_name)
    })

    it(`should display the created Distance ${props.createdDistance} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body__content__header__meta__date`)).to.have.text().equal(props.createdDistance)
    })

    it(`should display the text ${props.text} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body__content__text`).render()).to.have.text().equal(props.text)
    })

    it('should have the className "sent" when it is your comment', () => {
      wrapper.setProps({ fromMe: true })
      expect(wrapper.find(`div.${props.customClass}.sent`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.customClass}.received`)).to.have.lengthOf(0)
      wrapper.setProps({ fromMe: props.fromMe })
    })

    it('should have the className "received" when it is your comment', () => {
      wrapper.setProps({ fromMe: false })
      expect(wrapper.find(`div.${props.customClass}.received`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.customClass}.sent`)).to.have.lengthOf(0)
      wrapper.setProps({ fromMe: props.fromMe })
    })
  })
})
