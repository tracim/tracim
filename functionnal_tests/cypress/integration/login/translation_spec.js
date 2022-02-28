import { PAGES } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.visitPage({ pageName: PAGES.LOGIN, params: { loginParam: '' }, waitForTlm: false })
  })

  it('should have translations', () => {
    cy.changeLanguageUnloggedPages('en')
    cy.contains('.loginpage__main__form__btnsubmit', 'Connection')

    cy.changeLanguageUnloggedPages('fr')
    cy.contains('.loginpage__main__form__btnsubmit', 'Connexion')

    cy.changeLanguageUnloggedPages('pt')
    cy.contains('.loginpage__main__form__btnsubmit', 'Conexão')

    cy.changeLanguageUnloggedPages('de')
    cy.contains('.loginpage__main__form__btnsubmit', 'Verbindung')
  })
})
