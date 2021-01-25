import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import Avatar, { AVATAR_SIZE } from '../../src/component/Avatar/Avatar.jsx'

require('../../src/component/Avatar/Avatar.styl')

describe('<Avatar />', () => {
  let publicName
  let expectedNameResult
  let twoLetterPublicName

  const props = {
    user: { publicName: 'myName' },
    apiUrl: '/',
    size: AVATAR_SIZE.BIG,
    style: {
      color: 'yellow'
    }
  }

  const wrapper = mount(<Avatar {...props} />).find('Avatar')

  describe('Static design', () => {
    it(`should have the title "${props.user.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.user.publicName)
    })

    const publicNameTwoLetterResult = 'MY'

    it(`should have the text "${publicNameTwoLetterResult}"`, () => {
      expect(wrapper.find('.avatar')).to.have.text().equal(publicNameTwoLetterResult)
    })

    it('should have the same style object', () => {
      expect(wrapper.find('.avatar-wrapper').prop('style')).to.deep.equal(props.style)
    })

    it('should display its avatar in width, height', () => {
      expect(wrapper.find('.avatar').prop('style').width).to.equal(props.size)
      expect(wrapper.find('.avatar').prop('style').height).to.equal(props.size)
    })
  })

  describe('Component\'s function', () => {
    describe('getTwoLetters(name) with a name with space', () => {
      it('name: "public name" should return "pn"', () => {
        publicName = 'public name'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "" should return ""', () => {
        publicName = ''
        expectedNameResult = ''
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "publicname" should return "pu"', () => {
        publicName = 'publicname'
        expectedNameResult = 'pu'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "public name test" should return "pn"', () => {
        publicName = 'public name test'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "     public     name     " should return "pn"', () => {
        publicName = '     public name     '
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "name   " should return "na"', () => {
        publicName = 'name   '
        expectedNameResult = 'na'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('getTwoLetters(name) with a name with dash', () => {
      it('name: "public-name" should return "pn"', () => {
        publicName = 'public-name'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "public-name-test" should return "pn"', () => {
        publicName = 'public-name-test'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('getTwoLetters(name) with a name with dot', () => {
      it('name: "public.name" should return "pn"', () => {
        publicName = 'public.name'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "public.name.test" should return "pn"', () => {
        publicName = 'public.name.test'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('getTwoLetters(name) with a name with mixed separator', () => {
      it('name: "public.name-test" should return "pt"', () => {
        publicName = 'public.name-test'
        expectedNameResult = 'pt'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it('name: "public name-test" should return "pn"', () => {
        publicName = 'public name-test'
        expectedNameResult = 'pn'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('getTwoLetters(name) with a name without separator', () => {
      it('name: "publicName" should return "pu"', () => {
        publicName = 'publicName'
        expectedNameResult = 'pu'
        twoLetterPublicName = wrapper.instance().getTwoLetters(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })
  })
})
