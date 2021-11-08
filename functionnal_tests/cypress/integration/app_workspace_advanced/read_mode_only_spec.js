import { PAGES as p } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

describe('Space settings in reader mode', () => {
  let workspaceId
  const flashMessageClass = '.flashmessage__container__content__text__paragraph'
  const flashMessageText = 'Your tag has been created'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()

    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })

      // NOTE - MP - 05-11-2021 - If the page isn't loaded after 30s
      // there is a problem somewhere
      cy.get('.userstatus__role__text', { timeout: 30000 })
        .contains('Space manager')

      cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()

      // NOTE - MP - 05-11-2021 - Test the tag manipulation
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.get('[data-cy=add_tag]').type('Tag')
      cy.get('[data-cy=validate_tag]').click()

      // NOTE - MP - 05-11-2021 - Change visibility
      cy.get('[data-cy=popin_right_part_members_list]').click()
      // NOTE - MP - 05-11-2021 - 2 is the id of John Doe
      cy.get('[data-cy=workspace_advanced__member-2_role]')
        .find('button')
        .first().click()
      cy.get('[data-cy=workspace_advanced__member-2_role]')
        .find('[data-cy=dropdownMenu_items]')
        .find('>span')
        // FIXEME - MP - 05-11-2021 - Add data-cy into theses button
        // to not pick the last
        .first().click()
      // NOTE - MP - 05-11-2021 - 1 is the id of GlobalManager
      cy.get('[data-cy=workspace_advanced__member-1_role]')
        .find('button')
        .first().click()
      cy.get('[data-cy=workspace_advanced__member-1_role]')
        .find('[data-cy=dropdownMenu_items]')
        .find('>span')
        // FIXEME - MP - 05-11-2021 - Add data-cy into theses button
        // to not pick the last
        .last().click()
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId } })

    // NOTE - MP - 05-11-2021 - If the page isn't loaded after 30s
    // there is a problem somewhere
    cy.get('.userstatus__role__text', { timeout: 30000 })
      .contains('Reader')

    cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
      .find('.dashboard__workspace__detail__buttons .iconbutton')
      .click()
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
