import { PAGES } from '../../support/urls_commands'
import { SELECTORS } from '../../support/generic_selector_commands'

describe('Space settings in reader mode', () => {
  let workspaceId
  const flashMessageClass = '.flashmessage__container__content__text__paragraph'
  const flashMessageText = 'Your tag has been created'

  before(function  () {
    this.skip() // MB - 2021-10-11 - unstable test, see issue : https://github.com/tracim/tracim/issues/4995

    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
      cy.contains('.userstatus__role__text', 'Space manager')
      cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
        .find('.dashboard__workspace__detail__buttons .iconbutton')
        .click()

      cy.get('[data-cy=popin_right_part_tag').click()
      cy.get('[data-cy=add_tag]').type('Tag')
      cy.get('[data-cy=validate_tag]').click()
      cy.contains(flashMessageClass, flashMessageText)

      cy.get('[data-cy=popin_right_part_members_list]').click()
      cy.get('.workspace_advanced__userlist__list__item__role').last().click()
      cy.get('.workspace_advanced__userlist__list__item__role .dropdownMenuItem .fa-gavel')
        .last().click()
      cy.get('.workspace_advanced__userlist__list__item__role').first().click()
      cy.get('.workspace_advanced__userlist__list__item__role .dropdownMenuItem .fa-eye')
        .first().click()
    })
  })

  beforeEach(() => {
  cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.DASHBOARD, params: { workspaceId } })
    cy.contains('.userstatus__role__text', 'Reader')
    cy.getTag({ selectorName: SELECTORS.WORKSPACE_DASHBOARD })
      .find('.dashboard__workspace__detail__buttons .iconbutton')
      .click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('description', () => {
    it('should be visible and not editable', () => {
      cy.get('.workspace_advanced__description').should('be.visible')
      cy.get('.workspace_advanced__description__bottom__btn').should('not.exist')
    })
  })

  describe('default role, delete button an optional functionalities tab', () => {
    it('should not be visible', () => {
      cy.get('.workspace_advanced__defaultRole').should('not.exist')
      cy.get('.workspace_advanced__delete').should('not.exist')
      cy.get('[data-cy=popin_right_part_optional_functionalities]').should('not.exist')
    })
  })

  describe('member list', () => {
    it('should not allow addition or deletion of members', () => {
      cy.get('.workspace_advanced__userlist__adduser').should('not.exist')
      cy.get('.workspace_advanced__userlist__list__item__delete').should('not.exist')
      cy.contains('.workspace_advanced__userlist__list__item__name__username', 'TheAdmin')
      cy.contains('.workspace_advanced__userlist__list__item__role', 'Reader')
    })
  })


  describe('tag list', () => {
    it('should not allow addition or deletion of tags', () => {
      cy.get('[data-cy=popin_right_part_tag').click()
      cy.get('.tagList__form__tag').should('not.exist')
      cy.get('[data-cy=IconButton_DeleteTagFromSpace]').should('not.exist')
      cy.contains('.tagList__list__item__info', 'Tag')
    })
  })
})
