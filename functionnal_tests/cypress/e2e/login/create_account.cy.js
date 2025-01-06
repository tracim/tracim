import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Login page - Create Account form', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '' }, waitForTlm: false })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should allow a user to create his account', function () {
    cy.get('[data-cy=showCreateAccountFormButton]').click()
    cy.get('[data-cy=loginGroup] > input').type('Foo bar')
    cy.get('[data-cy=emailGroup] > input').type('foo@foo.fo')
    cy.get('[data-cy=passwordGroup] > input').type('mysecretpassword')
    cy.get('[data-cy=createAccountButton]').click()
    cy.location('pathname').should('be.equal', '/ui')
  })

  it('should allow a user to come back to the sign-in form', function () {
    cy.get('[data-cy=connectButton]')
    cy.get('[data-cy=showCreateAccountFormButton]').click()
    cy.get('[data-cy=createAccountButton]')
    cy.get('[data-cy=signInLink]').click()
    cy.get('[data-cy=connectButton]')
  })
})
