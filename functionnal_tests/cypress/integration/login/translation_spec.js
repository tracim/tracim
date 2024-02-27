import { PAGES } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.visitPage({ pageName: PAGES.LOGIN, params: { loginParam: '' }, waitForTlm: false })
  })

  it('should have translations', () => {
    cy.changeLanguageUnloggedPages('en')
    cy.contains('.classicLoginAuthForm__btnsubmit', 'Connection')

    cy.changeLanguageUnloggedPages('fr')
    cy.contains('.classicLoginAuthForm__btnsubmit', 'Connexion')

    cy.changeLanguageUnloggedPages('pt')
    cy.contains('.classicLoginAuthForm__btnsubmit', 'Conexão')

    cy.changeLanguageUnloggedPages('de')
    cy.contains('.classicLoginAuthForm__btnsubmit', 'Verbindung')

    cy.changeLanguageUnloggedPages('ar')
    cy.contains('.classicLoginAuthForm__btnsubmit', 'تسجيل الدخول')

    cy.changeLanguageUnloggedPages('es')
    cy.contains('.classicLoginAuthForm__btnsubmit', 'Conexión')
  })
})
