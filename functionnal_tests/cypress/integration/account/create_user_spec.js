import { PAGES as p } from '../../support/urls_commands'

const publicName = 'new_public_name'
const username = 'new_username'
const anotherUsername = 'another_new_username'
const email = 'new.email@tracim.fr'
const correctPwd = '123456'

const errShortPwd = '123'
const errLongPwd = '123'.repeat(200)
const errPublicName = 'pn'
const errShortUsername = 'un'
const errSpaceUsername = 'new username'
const errNotAllowedCharsUsername = 'usern@me!'
const errEmail = 'err.email'

describe('When "Create new user" at Administration', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.ADMIN_USER })
  })

  it('should disable submit button if missing full name', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_username]').type(username)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').should('be.disabled')
  })

  it('should disable submit button if missing email', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(username)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').should('be.disabled')
  })

  it('should enable submit button if missing just the username', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').should('be.enabled')
  })

  it('should disable submit button if missing profile', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_password]').type(email)
    cy.get('[data-cy=adduser_email]').type(correctPwd)
    cy.get('[data-cy=adminUser__adduser__form__submit]').should('be.disabled')
  })

  it('should show error message if password is too long', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(errLongPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('[data-cy=flashmessage]').contains('New password is too long (maximum 512 characters)')
  })

  it('should show error message if password is too short', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(errShortPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('.flashmessage').contains('New password is too short (minimum 6 characters)')
  })

  it('should show error message if full name is too short', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(errPublicName)
    cy.get('[data-cy=adduser_username]').type(username)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('.flashmessage').contains('Full name must be at least 3 characters')
  })

  it('should disable submit button if username is too short', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(errShortUsername)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=adminUser__adduser__form__submit]').should('be.disabled')
  })

  it('should disable submit button if username has a whitespace', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(errSpaceUsername)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=adminUser__adduser__form__submit]').should('be.disabled')
  })

  it('should show error message if username has not allowed characters', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(errNotAllowedCharsUsername)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('.flashmessage').contains('Your username is incorrect, the allowed characters are azAZ09-_')
  })

  it('should show error message if email is out of standard', () => {
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(username)
    cy.get('[data-cy=adduser_email]').type(errEmail)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('.flashmessage').contains('Error, invalid email address')
  })

  it('should create a user with correct data', () => {
    cy.get('[data-cy=adminUser__adduser__form]').should('not.exist')
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adminUser__adduser__form]')
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(username)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('[data-cy=flashmessage]').contains('User created')
    cy.get('[data-cy=adminUser__adduser__form]').should('not.exist')
    cy.contains(publicName)
  })

  it("should shows error message if the user's email already exists", () => {
    cy.get('[data-cy=adminUser__adduser__form]').should('not.exist')
    cy.get('[data-cy=adminUser__adduser__button]').click()
    cy.get('[data-cy=adminUser__adduser__form]')
    cy.get('[data-cy=adduser_name]').type(publicName)
    cy.get('[data-cy=adduser_username]').type(anotherUsername)
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(correctPwd)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('[data-cy=flashmessage]').contains('Email already exists')
    cy.contains(publicName)
    cy.contains(username)
    cy.contains(email)
  })
})
