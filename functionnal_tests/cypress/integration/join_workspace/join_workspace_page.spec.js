import { PAGES as p } from '../../support/urls_commands.js'

const prepareTest = () => {
  cy.resetDB()
  cy.setupBaseDB()
  cy.loginAs('administrators')
  cy.createWorkspace('baseWorkspace')
  cy.createWorkspace('openWorkspace')
  cy.createWorkspace('onRequestWorkspace')
}

describe('Join space page', () => {
  before(() => prepareTest())
  beforeEach(() => {
    cy.loginAs('users')
    cy.visitPage({
      pageName: p.JOIN_WORKSPACE
    })
  })
  describe('The space list', () => {
    it('should contain a header plus two spaces', () => {
      cy.get('.joinWorkspace__content__workspaceList__item').should('have.length', 3)
    })
  })

  const testCases = [
    { index: 0, name: 'first', title: 'ON REQUEST', button: 'Request access' },
    { index: 1, name: 'second', title: 'OPEN', button: 'Join the space' }
  ]
  testCases.forEach(testCase => {
    describe(`The ${testCase.name} space item`, () => {
      it(`should contain "${testCase.title}" and have a "${testCase.button}" button`, () => {
        cy.contains('.joinWorkspace__content__workspaceList__item', testCase.title)
          .find('button')
          .contains(testCase.button)
      })
    })
  })

  describe('Clicking on a "Request access" button', () => {
    it('should change the button to a "Request sent" label', () => {
      cy.contains('.joinWorkspace__content__workspaceList__item', 'ON REQUEST')
        .find('button')
        .click()
      cy.contains('.joinWorkspace__content__workspaceList__item', 'ON REQUEST').should('contain.text', 'Request sent')
    })
  })

  describe('Clicking on a "Join the space" button', () => {
    it("should redirect to the space's page", () => {
      cy.contains('.joinWorkspace__content__workspaceList__item', 'OPEN')
        .find('button')
        .click()
      cy.location('pathname').should('contain', '/ui/workspaces/')
    })
  })

})
