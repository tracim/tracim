import { PAGES } from '../../support/urls_commands.js'


const createSpace = (type) => {
  cy.get('[data-cy=sidebarCreateSpaceBtn]').click()
  cy.get('.newSpace__input').type(`${type} space`)
  cy.get(`li[title="${type}"] .singleChoiceList__item`).click()
  cy.get('.newSpace__button .btn').should('be.enabled').click()
  cy.get('.singleChoiceList__item__radioButton').first().click()
  cy.get('.newSpace__icon__right').click()
}

describe('Sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it('should have space type icon if space is confidential', () => {
    const type = 'Confidential'
    createSpace(type)
    cy.get(`.sidebar__item__name[title="${type} space"] .sidebar__item__space__type`).should('be.visible')
  })

  it('should not have space type icon if space is on request', () => {
    const type = 'On request'
    createSpace(type)
    cy.get(`.sidebar__item__name[title="${type} space"] .sidebar__item__space__type`).should('be.not.visible')
  })

  it('should not have space type icon if space is open', () => {
    const type = 'Open'
    createSpace(type)
    cy.get(`.sidebar__item__name[title="${type} space"] .sidebar__item__space__type`).should('be.not.visible')
  })
})
