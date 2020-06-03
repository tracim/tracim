import { PAGES } from '../../support/urls_commands'

describe('Login page', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.visitPage({ pageName: PAGES.LOGIN, params: { loginParam: '' } })
  })

  it('should have translations', () => {
    cy.get('.loginpage__card__form__btnsubmit').contains('Connection')

    cy.changeLanguage('fr')
    cy.get('.loginpage__card__form__btnsubmit').contains('Connexion')

    cy.changeLanguage('pt')
    cy.get('.loginpage__card__form__btnsubmit').contains('Conexão')
  })
})
