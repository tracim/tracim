import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Comment from '../../src/component/Timeline/Comment.jsx'

describe('<Comment />', () => {
  const props = {
    customClass: 'randomCustomClass',
    author: { public_name: 'randomAuthor' },
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

    it(`should have the class '${props.customClass}__body'`, () => {
      expect(wrapper.find(`div.${props.customClass}__body`)).to.have.lengthOf(1)
    })

    it(`should display the author ${props.author.public_name} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body__author`)).to.have.text().equal(props.author.public_name)
    })

    it(`should display the created Distance ${props.createdDistance} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body__date`)).to.have.text().equal(props.createdDistance)
    })

    it(`should display the text ${props.text} of the comment`, () => {
      expect(wrapper.find(`div.${props.customClass}__body__text`).render()).to.have.text().equal(props.text)
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
