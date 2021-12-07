import { PAGES } from '../../support/urls_commands.js'

describe('Account page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.ACCOUNT })
  })

  it('should have translations', () => {
    cy.get('.account__userpreference__setting').contains('Change my account settings')

    cy.changeLanguage('fr')
    cy.get('.account__userpreference__setting').contains('Changer les paramètres de mon compte')

    cy.changeLanguage('pt')
    cy.get('.account__userpreference__setting').contains('Mudar minhas definições de conta')

    cy.changeLanguage('de')
    cy.contains('.account__userpreference__setting', 'Meine Kontoeinstellungen ändern')

    cy.contains('.iconbutton__text_with_icon', 'Verwalten von Benutzerbereichen')
      .click()
    cy.contains('.cardPopup__header__title', 'Bereichsmanagement für den Benutzer John Doe')
  })
})
