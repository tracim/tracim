import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Space settings', function () {
  const oldDescription = 'A super description of my space.'
  const newDescription = 'description'
  let spaceId = 1
  let spaceLabel

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.fixture('baseWorkspace').then(space => {
      spaceId = space.workspace_id
      spaceLabel = space.label
    })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: spaceId } })

    cy.contains('.userstatus__role__text', 'Space manager')

    cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
      .find('.dashboard__workspace__rightMenu__contents .fa-cog')
      .click()

    cy.contains('.workspace_advanced__contentpage__header__title', spaceLabel)
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe("Changing the space's description", () => {
    it('Should update the description in the dashboard', function () {
      cy.contains('.workspace_advanced__description', oldDescription)

      cy.get('.workspace_advanced__description__bottom__btn').click()

      cy.waitForHugeRTELoaded().then(() => {
        cy.typeInHugeRTE(newDescription).then(() => {
          cy.get('.workspace_advanced__description__bottom__btn').click()

          cy.get('.workspace_advanced__contentpage__header__close').click()

          cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
            .find('.dashboard__workspace__detail__description')
            .contains(newDescription)
        })
      })
    })
  })

  describe("Changing the space's default role", () => {
    it('Should show a flash message', function () {
      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('.workspace_advanced__defaultRole')
        .should('be.visible')

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('.workspace_advanced__defaultRole__list .singleChoiceList__item')
        .first()
        .click()

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .find('.workspace_advanced__defaultRole__bottom__btn')
        .click()

      cy.contains('.flashmessage__container__content__text__paragraph', 'Save successful')
    })
  })

  describe('Member list of the space', () => {
    // INFO - MP - 2021-11-05 - 2 users: GlobalManager and John Doe
    let numberOfUserInWorkSpace = 2
    let userId = 0
    let userPublicName = ''
    let userEmail = ''
    let userUsername = ''

    beforeEach(() => {
      cy.contains('.workspace_advanced__contentpage__header__title', spaceLabel)
      cy.contains('.wsContentGeneric__content__right__content__title', 'Members List')

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .get(`.workspace_advanced__userlist__list__item`)
        .should('be.visible')
        .and('have.length', numberOfUserInWorkSpace)

      cy.getTag({ selectorName: s.CONTENT_FRAME })
        .get('div.workspace_advanced__userlist__adduser__button')
        .should('be.visible')
        .click()

      cy.createRandomUser().then(user => {
        userId = user.user_id
        userPublicName = user.public_name
        userEmail = user.email
        userUsername = user.username
      })
    })

    describe('Modify user list of a space', () => {
      // INFO - MP - 2021-11-05 - Finish the process to add an user
      const finishAddUser = () => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('div.autocomplete__item')
          .click()

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('.memberlist__form__role .singleChoiceList__item__radioButton > input')
          .first()
          .click()

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('.memberlist__form__submitbtn > button')
          .click()
      }

      // INFO - MP - 2021-11-05 - Validate the test; not in after each since it is
      // not a cleaning method
      const successfullyAdded = (userId) => {
        cy.getTag({ selectorName: s.FLASH_MESSAGE })
          .should('be.visible')

        // INFO - MP - 2021-11-04 - We got a success flash message the
        // user is successfully added to the database
        cy.getTag({ selectorName: s.FLASH_TYPE })
          .should('have.class', 'bg-info')

        numberOfUserInWorkSpace += 1

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get(`.workspace_advanced__userlist__list__item`)
          .should('be.visible')
          .and('have.length', numberOfUserInWorkSpace)

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get(`[data-cy=workspace_advanced__member-${userId}]`)
          .should('be.visible')
      }

      it('Should be able to add an user with their public name', () => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('#addmember')
          .clear()
          .type(userPublicName)

        finishAddUser()

        successfullyAdded(userId)
      })

      it('Should be able to add an user with his email', () => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('#addmember')
          .clear()
          .type(userEmail)

        finishAddUser()
        successfullyAdded(userId)
      })

      it('Should be able to add an user with his username', () => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('#addmember')
          .clear()
          .type(userUsername)

        finishAddUser()
        successfullyAdded(userId)
      })

      it('Should be able to remove an user of a space', () => {
        // INFO - MP - 2021-11-05 - Before this test: add an user to remove
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('#addmember')
          .clear()
          .type(userPublicName)

        finishAddUser()

        numberOfUserInWorkSpace += 1

        // INFO - MP - 2021-11-05 - Start the current test
        cy.getTag({ selectorName: s.WORKSPACE_ADVANCED_USER_DELETE })
          .last()
          .click()

        cy.getTag({ selectorName: s.FLASH_MESSAGE })
          .should('be.visible')

        // INFO - MP - 2021-11-04 - We got a success flash message the
        // user is successfully added to the database
        cy.getTag({ selectorName: s.FLASH_TYPE })
          .should('have.class', 'bg-info')

        numberOfUserInWorkSpace -= 1

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get(`.workspace_advanced__userlist__list__item`)
          .should('be.visible')
          .and('have.length', numberOfUserInWorkSpace)

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get(`[data-cy=workspace_advanced__member-${userId}]`)
          .should('not.exist')
      })
    })

    describe('Disabled user', () => {
      beforeEach(() => {
        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('#addmember')
          .clear()
          .type(userPublicName)

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('div.autocomplete__item')
          .click()

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('.memberlist__form__role .singleChoiceList__item__radioButton > input')
          .first()
          .click()

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get('.memberlist__form__submitbtn > button')
          .click()

        cy.getTag({ selectorName: s.FLASH_MESSAGE })

        numberOfUserInWorkSpace += 1

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .get(`.workspace_advanced__userlist__list__item`)
          .should('be.visible')
          .and('have.length', numberOfUserInWorkSpace)
      })

      it('Should not display disabled user of the workspace', () => {
        cy.disableUser(userId)

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .find(`.workspace_advanced__userlist__list__item[data-cy=workspace_advanced__member-${userId}]`)
          .should('be.visible')


        cy.loginAs('administrators')
        cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: spaceId } })

        cy.contains('.pageTitleGeneric__title__label', spaceLabel)
        cy.contains('.userstatus__role__text', 'Space manager')

        cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
          .get('.dashboard__workspace__rightMenu__contents .fa-cog')
          .click()

        cy.contains('.workspace_advanced__contentpage__header__title', spaceLabel)

        cy.contains('.wsContentGeneric__content__right__content__title', 'Members List')

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .find(`.workspace_advanced__userlist__list__item[data-cy=workspace_advanced__member-1]`)
          .should('be.visible')

        cy.getTag({ selectorName: s.CONTENT_FRAME })
          .find(`.workspace_advanced__userlist__list__item[data-cy=workspace_advanced__member-${userId}]`)
          .should('not.exist')

        cy.enableUser(userId)
      })
    })
  })

  describe('Optional features', () => {
    const testCases = [
      {
        feature: 'news',
        buttonSelector: '[data-cy=publication_enabled]',
        deactivatedMessage: 'News deactivated',
        activatedMessage: 'News activated'
      },
      {
        feature: 'agenda',
        buttonSelector: '[data-cy=agenda_enabled]',
        deactivatedMessage: 'Agenda deactivated',
        activatedMessage: 'Agenda activated'
      },
      {
        feature: 'download',
        buttonSelector: '[data-cy=download_enabled]',
        deactivatedMessage: 'Download deactivated',
        activatedMessage: 'Download activated'
      },
      {
        feature: 'upload',
        buttonSelector: '[data-cy=upload_enabled]',
        deactivatedMessage: 'Upload deactivated',
        activatedMessage: 'Upload activated'
      }
    ]
    for (const testCase of testCases) {
      it(`should allow to toggle ${testCase.feature}`, () => {
        cy.get('[data-cy=popin_right_part_optional_functionalities]').click()
        cy.get('.wsContentGeneric__content__right__content__title').should('be.visible')
        cy.contains(`${testCase.buttonSelector}`, testCase.activatedMessage)
        cy.get(`${testCase.buttonSelector} > .btnswitch > .switch > .slider`).click()
        cy.contains(`${testCase.buttonSelector}`, testCase.deactivatedMessage)
        cy.contains('.flashmessage__container__content__text__paragraph', testCase.deactivatedMessage)
          .should('be.visible')
          .get('.flashmessage__container__close__icon')
          .click()
        cy.get(`${testCase.buttonSelector} > .btnswitch > .switch > .slider`).click()
        cy.contains(`${testCase.buttonSelector}`, testCase.activatedMessage)
        cy.contains('.flashmessage__container__content__text__paragraph', testCase.activatedMessage)
      })
    }
  })
})
