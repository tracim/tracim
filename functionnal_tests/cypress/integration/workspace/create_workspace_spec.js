import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Workspace', () => {
  before(() => {
    cy.resetDB()
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.HOME })
  })

  const createOneSpace = (cy, spaceName) => {
    return cy
      .get('.newSpace__input').should('be.visible').type(spaceName)
      .get('.singleChoiceList__item').first().should('be.visible').click()
      .get('.newSpace__button .btn').should('be.visible').click()
      .get('div.newSpace__input').should('be.visible')
      .get('.singleChoiceList__item').first().should('be.visible').click()
      .get('.newSpace__button .btn').last().should('be.visible').click()
  }

  it.skip('should create a new space while no others are created', () => {
    const spaceTitle = 'Space Title'

    cy.get('[data-cy=homepagecard__create_btn]').should('be.visible').click()
    createOneSpace(cy, spaceTitle)

    cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: 1 } })
      .get('.dashboard')
      .contains('.pageTitleGeneric__title__label', spaceTitle)

    cy.get(`.sidebar__content__navigation__item__name[title="${spaceTitle}"]`)
      .should('exist')
  })

  const getWorkspaceItemByName = (cy, spaceTitle) => (
    cy.get(`.sidebar__content__navigation__item__name[title="${spaceTitle}"]`)
      .parents('li.sidebar__content__navigation__item')
  )

  describe('Creating a workspace while a lot of workspace are already created', () => {
    const nbOfSpaces = 20
    const newSpaceName = '0'

    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      for (let i = 1; i < nbOfSpaces; i++) {
        cy.createRandomWorkspace()
      }
    })

    it.skip('should scroll to the new workspace in the sidebar', () => {
      cy.visitPage({ pageName: p.HOME })
      cy.get('.sidebar__scrollview').scrollTo('bottom')
      cy.get('[data-cy=sidebarCreateWorkspaceBtn]').should('be.visible').click()
      createOneSpace(cy, newSpaceName)
      getWorkspaceItemByName(cy, newSpaceName).should('be.visible')
    })
  })
})
