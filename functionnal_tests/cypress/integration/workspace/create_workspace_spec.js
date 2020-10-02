import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('Workspace', () => {
  before(() => {
    cy.resetDB()
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visit('/ui')
  })

  it('should create a new workspace while no others are created', () => {
    const workspaceTitle = 'first workspace'

    cy.get('[data-cy=homepagecard__btn]').should('be.visible').click()
      .get('[data-cy=createcontent__form__input]').should('be.visible').type(workspaceTitle)
      .get('[data-cy=popup__createcontent__form__button]').should('be.visible').click()
    cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: 1 } })
      .get('.dashboard')
      .get('[data-cy="dashboardWorkspaceLabel"]')
      .contains(workspaceTitle)

    cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspaceTitle}"]`)
      .should('exist')
  })

  const createOneWorkspace = (cy, workspaceName) => {
    return cy.get('[data-cy="sidebarCreateWorkspaceBtn"]').click()
      .get('[data-cy="createcontent__form__input"]').type(workspaceName)
      .get('[data-cy="popup__createcontent__form__button"]').click()
  }

  const getWorkspaceItemByName = (cy, workspaceTitle) => (
    cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspaceTitle}"]`)
      .parents('li.sidebar__content__navigation__workspace__item')
  )

  describe('Creating a workspace while a lot of workspace are already created', () => {
    const nbWorkspace = 20
    const newWorkspaceName = '0'

    beforeEach(() => {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('administrators')
      for (let i = 1; i < nbWorkspace; i++) {
        cy.createRandomWorkspace()
      }
    })

    it('should scroll to the new workspace in the sidebar', () => {
      cy.visit('/ui')
      cy.get('.sidebar__scrollview').scrollTo('bottom')
      createOneWorkspace(cy, newWorkspaceName)
      getWorkspaceItemByName(cy, newWorkspaceName).should('be.visible')
    })
  })
})
