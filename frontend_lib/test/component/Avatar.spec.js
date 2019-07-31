import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import Avatar from '../../src/component/Avatar/Avatar.jsx'
require('../../src/component/Avatar/Avatar.styl')

describe('<Avatar />', () => {
  describe('<Avatar /> with a normal name (no space, no point, no dash)', () => {
    const props = {
      publicName: 'myName',
      publicNameTwoLetterUpperCase: 'MY',
      width: '100px',
      style: {
        color: 'yellow'
      }
    }

    const wrapper = shallow(
      <Avatar
        publicName={props.publicName}
        width={props.width}
        style={props.style}
      />
    )

    it(`should have the title : "${props.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.publicName)
    })

    it(`should have the text : "${props.publicNameTwoLetterUpperCase}"`, () => {
      expect(wrapper.find('.avatar')).to.have.text().equal(props.publicNameTwoLetterUpperCase)
    })

    it(`should have the same style object`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('style')).to.deep.equal(props.style)
    })

    it(`should display its avatar in width, height and borderRadius : ${props.width}`, () => {
      expect(wrapper.find('.avatar').prop('style').width).to.equal(props.width)
      expect(wrapper.find('.avatar').prop('style').height).to.equal(props.width)
      expect(wrapper.find('.avatar').prop('style').borderRadius).to.equal(props.width)
    })
  })

  describe('<Avatar /> with a name with a space', () => {
    const props = {
      publicName: 'my Name',
      publicNameTwoLetterUpperCase: 'MN',
      width: '100px',
      style: {
        color: 'yellow'
      }
    }

    const wrapper = shallow(
      <Avatar
        publicName={props.publicName}
        width={props.width}
        style={props.style}
      />
    )

    it(`should have the title : "${props.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.publicName)
    })

    it(`should have the text : "${props.publicNameTwoLetterUpperCase}"`, () => {
      expect(wrapper.find('.avatar')).to.have.text().equal(props.publicNameTwoLetterUpperCase)
    })
  })

  describe('<Avatar /> with a name with a point', () => {
    const props = {
      publicName: 'myNa.me',
      publicNameTwoLetterUpperCase: 'MM',
      width: '100px',
      style: {
        color: 'yellow'
      }
    }

    const wrapper = shallow(
      <Avatar
        publicName={props.publicName}
        width={props.width}
        style={props.style}
      />
    )

    it(`should have the title : "${props.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.publicName)
    })

    it(`should have the text : "${props.publicNameTwoLetterUpperCase}"`, () => {
      expect(wrapper.find('.avatar')).to.have.text().equal(props.publicNameTwoLetterUpperCase)
    })
  })

  describe('<Avatar /> with a name with a dash', () => {
    const props = {
      publicName: 'myNam-e',
      publicNameTwoLetterUpperCase: 'ME',
      width: '100px',
      style: {
        color: 'yellow'
      }
    }

    const wrapper = shallow(
      <Avatar
        publicName={props.publicName}
        width={props.width}
        style={props.style}
      />
    )

    it(`should have the title : "${props.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.publicName)
    })

    it(`should have the text : "${props.publicNameTwoLetterUpperCase}"`, () => {
      expect(wrapper.find('.avatar')).to.have.text().equal(props.publicNameTwoLetterUpperCase)
    })
  })
})
