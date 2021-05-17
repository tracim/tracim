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
    cy.get('.breadcrumbs').contains('profile').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('.breadcrumbs').contains('Profil').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('.breadcrumbs').contains('Perfil').should('be.visible')

    cy.changeLanguage('de')
    cy.get('.breadcrumbs').contains('Profil').should('be.visible')
  })
})
