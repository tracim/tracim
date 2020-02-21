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

  describe('Dashboard', () => {
    describe('Creating two new workspaces', () => {
      const createOneWorkspace = (cy, workspaceName) => {
        return cy.get('[data-cy="sidebarCreateWorkspaceBtn"]').should('be.visible').click()
          .get('[data-cy="createcontent__form__input"]').should('be.visible').type(workspaceName)
          .get('[data-cy="popup__createcontent__form__button"]').should('be.visible').click()
      }

      const getWorkspaceItemByName = (workspaceTitle) => (
        cy.get(`.sidebar__content__navigation__workspace__item__name[title="${workspaceTitle}"]`)
          .parents('li.sidebar__content__navigation__workspace__item')
      )

      it('should display the new workspaces properly with the right workspace opened in the sidebar', () => {
        const workspaceTitle1 = 'second workspace'
        const workspaceTitle2 = 'third workspace'

        createOneWorkspace(cy, workspaceTitle1)
          .get('.dashboard')
          .get('[data-cy="dashboardWorkspaceLabel"]')
          .contains(workspaceTitle1)

        getWorkspaceItemByName(workspaceTitle1)
          .find('.sidebar__content__navigation__workspace__item__submenu')
          .should('be.visible')

        createOneWorkspace(cy, workspaceTitle2)
          .get('.dashboard')
          .get('[data-cy="dashboardWorkspaceLabel"]')
          .contains(workspaceTitle2)

        getWorkspaceItemByName(workspaceTitle2)
          .find('.sidebar__content__navigation__workspace__item__submenu')
          .should('be.visible')
      })
    })
  })
})
