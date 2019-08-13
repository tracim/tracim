import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Comment from '../../src/component/Timeline/Comment.jsx'

describe('<Comment />', () => {
  const props = {
    customClass: 'randomCustomClass',
    author: 'randomAuthor',
    text: 'randomText',
    createdFormated: 'randomCreatedFormated',
    createdDistance: 'randomCreatedDistance',
    fromMe: true
  }

  const wrapper = shallow(
    <Comment {...props} />
  )

  describe('Static design', () => {
    it(`should have the class '${props.customClass}__messagelist__item'`, () => {
      expect(wrapper.find(`li.${props.customClass}__messagelist__item`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}'`, () => {
      expect(wrapper.find(`div.${props.customClass}`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__header'`, () => {
      expect(wrapper.find(`div.${props.customClass}__header`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__header__text'`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__text`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__header__text__author'`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__text__author`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__header__text__date'`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__text__date`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__header__avatar'`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__avatar`)).to.have.lengthOf(1)
    })

    it(`should have the class '${props.customClass}__body'`, () => {
      expect(wrapper.find(`div.${props.customClass}__body`)).to.have.lengthOf(1)
    })

    it(`should display the author ${props.author} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__text__author`)).to.have.text().equal(props.author)
    })

    it(`should display the created Distance ${props.createdDistance} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__text__date`)).to.have.text().equal(props.createdDistance)
    })

    it(`should display the created Distance ${props.text} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body`).render()).to.have.text().equal(props.text)
    })

    it(`the date div should have the title: ${props.createdFormated}`, () => {
      expect(wrapper.find(`div.${props.customClass}__header__text__date`).prop('title')).to.equal(props.createdFormated)
    })

    it(`should have the className "sent" when it is your comment`, () => {
      wrapper.setProps({ fromMe: true })
      expect(wrapper.find(`div.${props.customClass}.sent`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.customClass}.received`)).to.have.lengthOf(0)
      wrapper.setProps({ fromMe: props.fromMe })
    })

    it(`should have the className "received" when it is your comment`, () => {
      wrapper.setProps({ fromMe: false })
      expect(wrapper.find(`div.${props.customClass}.received`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${props.customClass}.sent`)).to.have.lengthOf(0)
      wrapper.setProps({ fromMe: props.fromMe })
    })
  })
})
