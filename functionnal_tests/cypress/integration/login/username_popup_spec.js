/*
FIXME - RJ - 2020-10-26 - tests in this file are unstable and will be fixed in https://github.com/tracim/tracim/issues/3483

import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

const newUsername = 'newUsername'
const shortUsername = 'nU'

const userWithoutUsername = {
  email: 'userWithoutUsername@tracim.fr',
  email_notification: false,
  lang: 'en',
  password: 'userWithoutUsername',
  profile: 'users',
  public_name: 'userWithoutUsername',
  username: null,
  timezone: 'Europe/Paris'
}

let userWithUsernameEmail
let userWithUsernameUsername
let userWithUsernamePassword

const usernamePopup = '.homepage__usernamePopup__body'
const confirmButton = '.homepage__usernamePopup__body__btn'
const checkbox = '.homepage__usernamePopup__body__checkbox__input'
const usernameInput = '[data-cy=usernamePopup_username]'
const passwordInput = '[data-cy=usernamePopup_password]'

describe('Login', function () {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.request('POST', '/api/users', userWithoutUsername)
      .then(response => {
        response.body.password = '8QLa$<w'
        return response.body
      })

    cy.createRandomUser().then(user => {
      userWithUsernameEmail = user.email
      userWithUsernameUsername = user.username
      userWithUsernamePassword = user.password
    })
    cy.logout()
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('if username is null', function () {
    beforeEach(() => {
      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=text]')
        .type(userWithoutUsername.email)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=password]')
        .type(userWithoutUsername.password)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('.loginpage__card__form__btnsubmit')
        .click()
    })

    it('should open the set username popup with the confirm button disabled', function () {
      cy.get(usernamePopup).should('be.visible')
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should enable the confirm button when check "Never ask me again"', function () {
      cy.get(checkbox).click()
      cy.get(confirmButton).should('be.enabled')
    })

    it('should have the confirm button disabled if the user does not put the password', function () {
      cy.get(usernameInput).type(newUsername)
      cy.get(passwordInput).should('be.empty')
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should have the confirm button disabled if username is not available', function () {
      cy.get(usernameInput).type(userWithUsernameUsername)
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should have the confirm button disabled if username is too short', function () {
      cy.get(usernameInput).type(shortUsername)
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should show error if invalid password', function () {
      cy.get(usernameInput).type(newUsername)
      cy.get(passwordInput).type(newUsername)
      cy.get(confirmButton).click()
      cy.get('.flashmessage').contains('Invalid password')
    })

    it('should be able to set username', function () {
      cy.get(usernameInput).type(newUsername)
      cy.get(passwordInput).type(userWithoutUsername.password)
      cy.get(confirmButton).click()
      cy.get('.flashmessage').contains('Your username has been set')
    })

    describe('if user choose "Never ask me again"', function () {
      it('should not open the set username popup if they login again', function () {
        cy.get(checkbox).click()
        cy.get(confirmButton).click()

        cy.logout()
        cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' } })

        cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
          .find('input[type=text]')
          .type(userWithoutUsername.email)

        cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
          .find('input[type=password]')
          .type(userWithoutUsername.password)

        cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
          .find('.loginpage__card__form__btnsubmit')
          .click()

        cy.get(usernamePopup).should('not.be.visible')
      })
    })
  })

  describe('if username is not null', function () {
    beforeEach(() => {
      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=text]')
        .type(userWithUsernameEmail)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=password]')
        .type(userWithUsernamePassword)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('.loginpage__card__form__btnsubmit')
        .click()
    })
    it('should not open the set username popup', function () {
      this.skip() // FIXME - GB - 2020-09-09 - this test is unstable and it will be fixed at https://github.com/tracim/tracim/issues/3483
      cy.get(usernamePopup).should('not.be.visible')
    })
  })
})
*/
