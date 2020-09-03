import { PAGES } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.visitPage({ pageName: PAGES.LOGIN, params: { loginParam: '' } })
  })

  it('should have translations', () => {
    cy.contains('.loginpage__card__form__btnsubmit', 'Connection')

    cy.changeLanguage('fr')
    cy.contains('.loginpage__card__form__btnsubmit', 'Connexion')

    cy.changeLanguage('pt')
    cy.contains('.loginpage__card__form__btnsubmit', 'Conexão')
  })
})
