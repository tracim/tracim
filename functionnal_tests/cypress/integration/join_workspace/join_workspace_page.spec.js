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
      cy.get('.joinWorkspace__content__workspaceList__item').should('have.length', 3).should('not.contain', '<b>')
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
    it('should be possible', () => {
      cy.contains('.joinWorkspace__content__workspaceList__item', 'ON REQUEST')
        .find('button')
        .click()
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

  describe('The icon tooltip', () => {
    it('should be translated', () => {
      cy.get('.joinWorkspace__content__workspaceList__item i.fas').invoke('attr', 'title').then(title => expect(title).to.equal('On request'))

      cy.changeLanguage('fr')
      cy.contains('.pageTitleGeneric', 'Rejoindre un espace')
      cy.get('.joinWorkspace__content__workspaceList__item i.fas').invoke('attr', 'title').then(title => expect(title).to.equal('Sur demande'))

      cy.changeLanguage('pt')
      cy.contains('.pageTitleGeneric', 'Junte-se a um espaço')
      cy.get('.joinWorkspace__content__workspaceList__item i.fas').invoke('attr', 'title').then(title => expect(title).to.equal('A pedido'))
    })
  })
})
