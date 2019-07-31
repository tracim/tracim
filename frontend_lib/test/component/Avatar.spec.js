import React from 'react'
import {expect} from 'chai'
import {shallow, configure} from 'enzyme'
import Avatar from '../../src/component/Avatar/Avatar.jsx'

require('../../src/component/Avatar/Avatar.styl')

describe('<Avatar />', () => {
  let publicName
  let expectedNameResult
  let twoLetterPublicName

  const props = {
    publicName: 'myName',
    width: '100px',
    style: {
      color: 'yellow'
    }
  }
  const publicNameTwoLetterResult = 'MY'

  const wrapper = shallow(
    <Avatar
      {...props}
    />
  )

  describe('Static design test', () => {
    it(`should have the title : "${props.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.publicName)
    })

    it(`should have the text : "${publicNameTwoLetterResult}"`, () => {
      expect(wrapper.find('.avatar')).to.have.text().equal(publicNameTwoLetterResult)
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

  describe(`Component's function test`, () => {
    describe('Test Avatar.getTwoLetter(name) with a name with space', () => {
      it(`name : "${publicName = 'public name'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })


      it(`name : "${publicName = ''}" should return "${expectedNameResult = ''}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it(`name : "${publicName = 'publicname'}" should return "${expectedNameResult = 'pu'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it(`name : "${publicName = 'public name test'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('Test Avatar.getTwoLetter(name) with a name with dash', () => {
      it(`name : "${publicName = 'public-name'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it(`name : "${publicName = 'public-name-test'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('Test Avatar.getTwoLetter(name) with a name with dot', () => {
      it(`name : "${publicName = 'public.name'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it(`name : "${publicName = 'public.name.test'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('Test Avatar.getTwoLetter(name) with a name with mixed separator', () => {
      it(`name : "${publicName = 'public.name-test'}" should return "${expectedNameResult = 'pt'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })

      it(`name : "${publicName = 'public name-test'}" should return "${expectedNameResult = 'pn'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })

    describe('Test Avatar.getTwoLetter(name) with a name without separator', () => {
      it(`name : "${publicName = 'publicName'}" should return "${expectedNameResult = 'pu'}"`, () => {
        twoLetterPublicName = wrapper.instance().getTwoLetter(publicName)
        expect(twoLetterPublicName).to.equal(expectedNameResult)
      })
    })
  })
})
