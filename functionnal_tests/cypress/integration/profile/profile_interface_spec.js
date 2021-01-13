import { PAGES } from '../../support/urls_commands'
import baseUser from '../../fixtures/baseUser.json'

describe('Profile', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
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

  it('should have the informations part', () => {
    cy.contains('.profile__content__informations', 'Informations')
      .should('be.visible')
  })

  it('should have the personal page part', () => {
    cy.contains('.profile__content__page', 'Personal page')
      .should('be.visible')
  })
})
