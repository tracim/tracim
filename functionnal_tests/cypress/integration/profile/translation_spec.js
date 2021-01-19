import { PAGES } from '../../support/urls_commands'
import baseUser from '../../fixtures/baseUser.json'

describe('Profile', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.get('.profile__content__page').contains('Personal page').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('.profile__content__page').contains('Page personnelle').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('.profile__content__page').contains('Página pessoal').should('be.visible')
  })
})
