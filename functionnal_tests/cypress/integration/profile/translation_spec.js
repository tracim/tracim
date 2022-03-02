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
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
    cy.contains('.breadcrumbs', 'profile').should('be.visible')

    cy.changeLanguage('fr')
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
    cy.contains('.breadcrumbs', 'Profil').should('be.visible')

    cy.changeLanguage('pt')
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
    cy.contains('.breadcrumbs', 'Perfil').should('be.visible')

    cy.changeLanguage('de')
    cy.visitPage({ pageName: PAGES.PROFILE, params: { userId: baseUser.user_id } })
    cy.contains('.breadcrumbs', 'Profil').should('be.visible')
  })
})
