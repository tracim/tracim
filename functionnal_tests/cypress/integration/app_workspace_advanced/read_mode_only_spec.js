import { PAGES as p } from '../../support/urls_commands'

describe('Space settings in reader mode', () => {
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()

    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.visitPage({ pageName: p.ADVANCED_DASHBOARD, params: { workspaceId } })

      // INFO - MP - 2021-11-05 - Test the tag manipulation
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.get('[data-cy=add_tag]').type('Tag')
      cy.get('[data-cy=validate_tag]').click()

      // INFO - MP - 2021-11-05 - Change visibility
      cy.get('[data-cy=popin_right_part_members_list]').click()
      // INFO - MP - 2021-11-05 - 2 is the id of John Doe
      cy.get('[data-cy=workspace_advanced__member-2_role]')
        .find('button')
        .first().click()
      cy.get('[data-cy=workspace_advanced__member-2_role]')
        .find('[data-cy=dropdownMenu_items]')
        .find('>span')
        // FIXME - MP - 2021-11-05 - Add data-cy into these buttons
        // to not pick the wrong one
        .last().click()
      // INFO - MP - 2021-11-05 - 1 is the id of GlobalManager
      cy.get('[data-cy=workspace_advanced__member-1_role]')
        .find('button')
        .first().click()
      cy.get('[data-cy=workspace_advanced__member-1_role]')
        .find('[data-cy=dropdownMenu_items]')
        .find('>span')
        // FIXME - MP - 2021-11-05 - Add data-cy into theses button
        // to not pick the rong one
        .last().click()
    })
  })

  beforeEach(() => {
    cy.loginAs('users')
    cy.visitPage({ pageName: p.ADVANCED_DASHBOARD, params: { workspaceId } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('description should be visible and not editable', () => {
    cy.get('.workspace_advanced__description').should('be.visible')
    cy.get('.workspace_advanced__description__bottom__btn').should('not.exist')
  })

  it('default role should not be visible', () => {
    cy.get('.workspace_advanced__defaultRole').should('not.exist')
  })

  it('delete button should not be visible', () => {
    cy.get('.workspace_advanced__delete').should('not.exist')
  })

  it('optional functionalities tab should not be visible', () => {
    cy.get('[data-cy=popin_right_part_optional_functionalities]').should('not.exist')
  })

  it('should not allow modification of members', () => {
    cy.get('.workspace_advanced__userlist__adduser').should('not.exist')
    cy.get('.workspace_advanced__userlist__list__item__delete').should('not.exist')
    cy.get('.workspace_advanced__userlist__list__item__name__username').contains('TheAdmin')
    cy.get('.workspace_advanced__userlist__list__item__role').contains('Reader')
  })

  it('should not allow modification of tags', () => {
    cy.get('[data-cy=popin_right_part_tag').click()
    cy.get('.tagList__form__tag').should('not.exist')
    cy.get('[data-cy=IconButton_DeleteTagFromSpace]').should('not.exist')
    cy.get('.tagList__list__item__info').contains('Tag')
  })
})
