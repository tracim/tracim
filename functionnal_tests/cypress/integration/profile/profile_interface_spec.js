import { PAGES, URLS } from '../../support/urls_commands'
import baseUser from '../../fixtures/baseUser.json'
import defaultAdmin from '../../fixtures/defaultAdmin.json'

describe('Profile', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.login(defaultAdmin)
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
  })

  it("should have the user's avatar", () => {
    cy.get('.profile__mainBar .avatar-wrapper')
      .should('have.attr', 'title', baseUser.public_name)
      .should('be.visible')
  })

  it("should have the user's name", () => {
    cy.contains('.profile__mainBar__info__user', baseUser.public_name)
      .should('be.visible')
  })

  it('should have the information part', () => {
    cy.contains('.profile__content__information', 'Information')
      .should('be.visible')
  })

  it('should have the personal page part', () => {
    cy.contains('.profile__content__page', 'Personal Page')
      .should('be.visible')
  })
})

describe('Account settings button', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
  })

  it("As an admin on another user's profile, should redirect to the /admin/user page", () => {
    cy.login(defaultAdmin)
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })

    cy.contains('.profile__mainBar__btnGrp', 'Account settings')
      .should('be.visible').click()
    cy.url().should('include', URLS[PAGES.ADMIN_USER]({ userId: baseUser.user_id }));
  })

  it("As an user on it's own profile, should redirect to the account page", () => {
    cy.login(baseUser)
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })

    cy.contains('.profile__mainBar__btnGrp', 'Account settings')
      .should('be.visible').click()
    cy.url().should('include', URLS[PAGES.ACCOUNT]());
  })

  it("As an user on another user's own profile, should not exist", () => {
    cy.login(baseUser)
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: defaultAdmin.user_id } })

    cy.contains('.profile__mainBar__btnGrp', 'Account settings')
      .should('not.be.visible')
  })
})
