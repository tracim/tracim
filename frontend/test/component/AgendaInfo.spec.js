import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { AgendaInfo as AgendaInfoWithoutHOC } from '../../src/component/Dashboard/AgendaInfo.jsx'
import { translateMock } from '../hocMock/translate.js'

describe('<AgendaInfo />', () => {
  const props = {
    introText: 'randomIntroText',
    caldavText: 'randomCaldavText',
    agendaUrl: 'randomAgendaUrl',
    customClass: 'randomCustomClass'
  }

  const ComponentWithHoc = translateMock()(AgendaInfoWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {
    it(`the root div should have the class: ${props.customClass}`, () =>
      expect(wrapper.find(`div.agendaInfo.${props.customClass}`).length).to.equal(1)
    )

    it(`should display the introText: ${props.introText} in a div`, () =>
      expect(wrapper.find('div.agendaInfo__content__text > div')).to.text().contains(props.introText)
    )

    it(`should display the caldavText: ${props.caldavText}`, () =>
      expect(wrapper.find('a.agendaInfo__content__text__help')).to.text().equal(props.caldavText)
    )

    it(`should display the agendaUrl: ${props.agendaUrl} in a div`, () => {
      expect(wrapper.find('div.agendaInfo__content__link__url')).to.text().equal(props.agendaUrl)
    })
  })
})
