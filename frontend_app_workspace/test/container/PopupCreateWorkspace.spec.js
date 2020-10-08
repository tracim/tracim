import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { PopupCreateWorkspace } from '../../src/container/PopupCreateWorkspace.jsx'
import { mockGetUserSpaces200 } from '../apiMock.js'

describe('<PopupCreateWorkspace />', () => {
  const props = {
    registerCustomEventHandlerList: () => { },
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
  const apiUrl = 'http://localhost:6543'
  const wrapper = shallow(<PopupCreateWorkspace {...props} />)

  describe('internal functions', () => {
    describe('handleChangeNewWorkspaceName', () => {
      it('should update newWorkspaceName state with the chosen name', () => {
        wrapper.instance().handleChangeNewWorkspaceName({ target: { value: 'name' } })
        expect(wrapper.state('newWorkspaceName')).to.equal('name')
      })
    })

    describe('handleChangeNewDefaultRole', () => {
      it('should update newDefaultRole state with the chosen role slug', () => {
        wrapper.instance().handleChangeNewDefaultRole('role')
        expect(wrapper.state('newDefaultRole')).to.equal('role')
      })
    })

    describe('handleChangeSpacesType', () => {
      it('should update newType state with the chosen type slug', () => {
        wrapper.instance().handleChangeSpacesType('type')
        expect(wrapper.state('newType')).to.equal('type')
      })
    })

    describe('handleChangeParentSpace', () => {
      it('should update newParentSpace state with the chosen space id', () => {
        wrapper.instance().handleChangeParentSpace({ value: 4 })
        expect(wrapper.state('newParentSpace')).to.equal(4)
      })
    })

    describe('handleClickNextOrBack', () => {
      describe('in first step', () => {
        it('should update parentOptions state with the list of spaces + the root', (done) => {
          wrapper.setState({ isFirstStep: true })
          mockGetUserSpaces200(apiUrl, props.loggedUser.userId, [])
          wrapper.instance().handleClickNextOrBack().then(() => {
            expect(wrapper.update().state('parentOptions')).to.deep.equal([{ value: null, label: props.t('None') }])
          }).then(done, done)
        })

        it('should update isFirstStep state to false', (done) => {
          wrapper.setState({ isFirstStep: true })
          mockGetUserSpaces200(apiUrl, props.loggedUser.userId, [])
          wrapper.instance().handleClickNextOrBack().then(() => {
            expect(wrapper.state('isFirstStep')).to.equal(false)
          }).then(done, done)
        })
      })

      describe('in second step', () => {
        it('should update isFirstStep state to true', () => {
          wrapper.setState({ isFirstStep: false })
          wrapper.instance().handleClickNextOrBack()
          expect(wrapper.state('isFirstStep')).to.equal(true)
        })
      })
    })
  })

  describe('Custom Event Handler', () => {
    describe('handleAllAppChangeLanguage()', () => {
      describe('change the language to portuguese', () => {
        wrapper.instance().handleAllAppChangeLanguage('pt')

        it('should update the state correctly with the new lang', () => {
          expect(wrapper.state('loggedUser').lang).to.equal('pt')
        })
        it('should update the state loggedUser without overwriting the previous state', () => {
          expect(wrapper.state('loggedUser').userId).to.equal(props.loggedUser.userId)
        })
      })
    })
  })
})
