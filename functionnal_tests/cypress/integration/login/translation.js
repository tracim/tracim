import { PAGES } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.visitPage({ pageName: PAGES.LOGIN, params: { loginParam: '' }, waitForTlm: false })
  })

  it('should have translations', () => {
    cy.changeLanguage('en')
    cy.contains('.loginpage__main__form__btnsubmit', 'Connection')

    cy.changeLanguage('fr')
    cy.contains('.loginpage__main__form__btnsubmit', 'Connexion')

    cy.changeLanguage('pt')
    cy.contains('.loginpage__main__form__btnsubmit', 'Conexão')

    cy.changeLanguage('de')
    cy.contains('.loginpage__main__form__btnsubmit', 'Verbindung')
  })
})
