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

    cy.get('[data-cy=homepagecard__btn]').click()
      .get('[data-cy=createcontent__form__input]').type(workspaceTitle)
      .get('[data-cy=popup__createcontent__form__button]').click()
    cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: 1 } })
      .get('.dashboard')
      .get('[data-cy="dashboardWorkspaceLabel"]')
      .contains(workspaceTitle)

    cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspaceTitle}"]`)
      .should('exist')
  })

  describe('Dashboard', () => {
    describe('Creating two new workspaces', () => {
      const createOneWorkspace = (cy, workspaceName) => {
        return cy.get('[data-cy="sidebarCreateWorkspaceBtn"]').click()
          .get('[data-cy="createcontent__form__input"]').type(workspaceName)
          .get('[data-cy="popup__createcontent__form__button"]').click()
      }

      it('should display the new workspaces properly', () => {
        const workspaceTitle1 = 'second workspace'
        const workspaceTitle2 = 'third workspace'

        createOneWorkspace(cy, workspaceTitle1)
          .get('.dashboard')
          .get('[data-cy="dashboardWorkspaceLabel"]')
          .contains(workspaceTitle1)

        createOneWorkspace(cy, workspaceTitle2)
          .get('.dashboard')
          .get('[data-cy="dashboardWorkspaceLabel"]')
          .contains(workspaceTitle2)
      })
    })
  })
})
