import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

const newUsername = 'newUsername'
const shortUsername = 'nU'

let userWithoutUsernameEmail
let userWithoutUsernamePassword

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
    cy.createRandomUser().then(user => {
      user.username = null
      userWithoutUsernameEmail = user.email
      userWithoutUsernamePassword = user.password
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
      .find('input[type=email]')
      .type(userWithoutUsernameEmail)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=password]')
        .type(userWithoutUsernamePassword)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('.loginpage__card__form__btnsubmit')
        .click()
    })

    it('should open the set username popup with the confirm button disabled', function () {
      cy.get(usernamePopup).should('be.visible')
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should enable the confirm button when check "never ask me again"', function () {
      cy.get(checkbox).click()
      cy.get(confirmButton).should('be.enabled')
    })

    it('should have the confirm button disabled if the user not put the password', function () {
      cy.get(usernameInput).type(newUsername)
      cy.get(passwordInput).should('be.empty')
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should have the confirm button disabled if username is not available', function () {
      cy.get(usernameInput).type(userWithUsernameUsername)
      cy.get(confirmButton).should('not.be.enabled')
    })

    it('should show error if username is too short', function () {
      cy.get(usernameInput).type(shortUsername)
      cy.get(passwordInput).type(userWithoutUsernamePassword)
      cy.get(confirmButton).click()
      cy.get('.flashmessage').contains('Username must be at least 3 characters')
    })

    it('should show error if invalid password', function () {
      cy.get(usernameInput).type(newUsername)
      cy.get(passwordInput).type(newUsername)
      cy.get(confirmButton).click()
      cy.get('.flashmessage').contains('Invalid password')

    })

    it('should be able to set username', function () {
      cy.get(usernameInput).type(newUsername)
      cy.get(passwordInput).type(userWithoutUsernamePassword)
      cy.get(confirmButton).click()
      cy.get('.flashmessage').contains('Your username has been changed')
    })

    describe('if user choose "never ask me again"', function () {
      it('should not open the set username popup if they login again', function () {
        cy.get(checkbox).click()
        cy.get(confirmButton).click()

        cy.logout()
        cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' } })

        cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=email]')
        .type(userWithoutUsernameEmail)

        cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
          .find('input[type=password]')
          .type(userWithoutUsernamePassword)

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
      .find('input[type=email]')
      .type(userWithUsernameEmail)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('input[type=password]')
        .type(userWithUsernamePassword)

      cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
        .find('.loginpage__card__form__btnsubmit')
        .click()
    })
    it('should not open the set username popup', function () {
      cy.get(usernamePopup).should('not.be.visible')
    })
  })
})
