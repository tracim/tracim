import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { PopupCreateWorkspace } from '../../src/container/PopupCreateWorkspace.jsx'

describe('<PopupCreateWorkspace />', () => {
  const props = {
    registerCustomEventHandlerList: () => {},
    t: key => key,
    loggedUser: {
      userId: 5,
      username: 'JohnD',
      firstname: 'John',
      lastname: 'Doe',
      email: 'test@test.test',
      avatar: '',
      lang: 'fr'
    }
  }

  const wrapper = shallow(<PopupCreateWorkspace {...props} />)

  describe('Custom Event Handler', () => {
    describe('handleAllAppChangeLanguage()', () => {
      describe('change the language to portuguese', () => {
        wrapper.instance().handleAllAppChangeLanguage('pt')

        it('should update the state correctly with the new lang', () => {
          expect(wrapper.state('loggedUser').lang).to.equal('pt')
        })
        it('should update the state loggedUser without overwrite the previous state', () => {
          expect(wrapper.state('loggedUser').userId).to.equal(props.loggedUser.userId)
        })
      })
    })
  })
})
