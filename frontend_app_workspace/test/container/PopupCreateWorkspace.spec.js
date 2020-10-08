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
    describe('handleChangeNewName', () => {
      it('should update newName state with the chosen name', () => {
        wrapper.instance().handleChangeNewName({ target: { value: 'name' } })
        expect(wrapper.state('newName')).to.equal('name')
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
      it('should update newParentSpaceId state with the chosen space id', () => {
        wrapper.instance().handleChangeParentSpace({ spaceId: 4, parentId: null })
        expect(wrapper.state('newParentSpaceId')).to.equal(4)
      })

      it('should update showWarningMessage state to true if parentId is not null', () => {
        wrapper.instance().handleChangeParentSpace({ spaceId: 4, parentId: 5 })
        expect(wrapper.state('showWarningMessage')).to.equal(true)
      })

      it('should update showWarningMessage state to false if parentId is null', () => {
        wrapper.instance().handleChangeParentSpace({ spaceId: 4, parentId: null })
        expect(wrapper.state('showWarningMessage')).to.equal(false)
      })
    })

    describe('handleClickNextOrBack', () => {
      describe('in first step', () => {
        it('should update parentOptions state with the list of spaces + the root', (done) => {
          wrapper.setState({ isFirstStep: true })
          mockGetUserSpaces200(apiUrl, props.loggedUser.userId, [])
          wrapper.instance().handleClickNextOrBack().then(() => {
            expect(wrapper.update().state('parentOptions')).to.deep.equal(
              [{ value: props.t('None'), label: props.t('None'), spaceId: null, parentId: null }]
            )
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
