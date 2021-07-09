import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

describe('Create tags in space', () => {
  let workspaceId
  const flashMessageClass = '.flashmessage__container__content__text__paragraph'
  const flashMessageText = 'Your tag has been created'

  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()
      cy.get('[data-cy=popin_right_part_tag').click()
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should create and add two tags', () => {
    cy.get('[data-cy=add_tag]').type('TagOne')
    cy.get('[data-cy=validate_tag]').click()
    cy.contains(flashMessageClass, flashMessageText)
    cy.get('[data-cy=tag_list] li').should('have.length', 1)
    cy.get('[data-cy=add_tag]').type('TagTwo')
    cy.get('[data-cy=validate_tag]').click()
    cy.contains(flashMessageClass, flashMessageText)
    cy.get('[data-cy=tag_list] li').should('have.length', 2)
  })

  it('should list the tags', () => {
    cy.get('[data-cy=add_tag]').type('TagOne')
    cy.get('[data-cy=validate_tag]').click()
    cy.contains(flashMessageClass, flashMessageText)
    cy.get('[data-cy=tag_list] li').should('have.length', 1)
    cy.get('[data-cy=add_tag]').type('TagTwo')
    cy.get('[data-cy=validate_tag]').click()
    cy.contains(flashMessageClass, flashMessageText)
    cy.get('[data-cy=tag_list] li').should('have.length', 2)
    // switch tab and come back
    cy.get('[data-cy=popin_right_part_members_list]').click()
    cy.get('[data-cy=popin_right_part_tag]').click()
    cy.get('[data-cy=tag_list] li').should('have.length', 2)
    cy.get('[data-cy=tag_list]').first().should('contain', 'TagTwo')
  })
})
