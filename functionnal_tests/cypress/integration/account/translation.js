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
    cy.get('.account__userpreference__setting').contains('Meine Kontoeinstellungen ändern')

    cy.get('.iconbutton__text_with_icon').contains('Verwalten von Benutzerbereichen')
      .click()
    cy.get('.cardPopup__header__title').contains('Bereichsmanagement für den Benutzer John Doe')
  })
})
