import { PAGES as p } from '../../support/urls_commands.js'

const prepareTest = () => {
  cy.resetDB()
  cy.setupBaseDB()
  cy.loginAs('administrators')
  cy.createWorkspace('baseWorkspace')
  cy.createWorkspace('openWorkspace')
  cy.createWorkspace('onRequestWorkspace')
  cy.loginAs('users')
}

describe('Join space page', () => {
  before(() => prepareTest())
  beforeEach(() => {
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
        cy.get('.joinWorkspace__content__workspaceList__item').eq(testCase.index + 1)
          .contains(testCase.title)
          .get('button')
          .contains(testCase.button)
      })
    })
  })

  describe('Clicking on a "Request access" button', () => {
    it('should change the button to a "Request sent label"', () => {
      cy.get('.joinWorkspace__content__workspaceList__item > button').eq(0).click()
      cy.get('.joinWorkspace__content__workspaceList__item').contains('Request sent')
    })
  })

  describe('Clicking on a "Join the space" button', () => {
    it("should redirect to the space's page", () => {
      cy.get('.joinWorkspace__content__workspaceList__item > button').eq(1).click()
      cy.location('pathname').should('contain', '/ui/workspaces/')
    })
  })

})
