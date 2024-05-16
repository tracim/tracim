import { expect } from 'chai'
import { CONTENT_TYPE } from '../src/helper.js'
import { buildAppCustomActionLinkList } from '../src/appCustomAction.js'

describe('buildAppCustomActionLinkList()', () => {
  const appCustomActionConfig = [{
    icon_text: 'someIcon',
    icon_image: 'someImage',
    content_type_filter: 'file,thread',
    content_extension_filter: '.jpg,.png',
    content_label_filter: '',
    workspace_filter: '1,2,3',
    user_role_filter: 'workspace-manager,content-manager,contributor',
    user_profile_filter: 'administrators,trusted-users',
    label: {
      fr: 'some french label',
      en: 'some english label'
    },
    link: 'some link'
  }]
  const content = {
    content_id: 10,
    workspace_id: 1,
    label: 'some content label',
    file_extension: '.jpg',
    author: {
      user_id: 5,
      public_name: 'John Doe'
    }
  }
  const loggedUser = {
    userId: 1,
    userRoleIdInWorkspace: 4,
    profile: 'trusted-users'
  }
  const appContentType = CONTENT_TYPE.FILE
  const appLanguage = 'en'

  it('should create an object for the DropdownMenu of PopinFixedHeader', () => {
    const appCustomActionListResult = buildAppCustomActionLinkList(
      appCustomActionConfig, content, loggedUser, appContentType, appLanguage
    )
    const expected = [{
      icon: 'someIcon',
      image: 'someImage',
      label: 'some english label',
      actionLink: 'some link',
      showAction: true,
      dataCy: 'popinListItem__customAction'
    }]
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should replace the variables in the link with values', () => {
    const newAppCustomActionConfig = [{
      ...appCustomActionConfig[0],
      link: [
        'https://some.domaine.com/open',
        '?',
        'content_label={content.label}',
        '&content={content.content_id}',
        '&space_id={content.workspace_id}',
        '&author_id={content.author_id}',
        '&author_name={content.author_name}',
        '&url={content.url}',
        '&user_id={user.user_id}'
      ].join('')
    }]

    const appCustomActionListResult = buildAppCustomActionLinkList(
      newAppCustomActionConfig, content, loggedUser, appContentType, appLanguage
    )

    const expectedLink = [
      'https://some.domaine.com/open',
      '?',
      'content_label=some%20content%20label',
      '&content=10',
      '&space_id=1',
      '&author_id=5',
      '&author_name=John%20Doe',
      '&url=http%3A%2F%2Flocalhost%2Fcontents%2F10',
      '&user_id=1'
    ].join('')

    const expected = [{
      icon: 'someIcon',
      image: 'someImage',
      label: 'some english label',
      actionLink: expectedLink,
      showAction: true,
      dataCy: 'popinListItem__customAction'
    }]
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should not display any custom action if the content type mismatch', () => {
    const newAppContentType = CONTENT_TYPE.LOGBOOK

    const appCustomActionListResult = buildAppCustomActionLinkList(
      appCustomActionConfig, content, loggedUser, newAppContentType, appLanguage
    )
    const expected = []
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should not display any custom action if the content label regex mismatch', () => {
    const newContent = {
      ...content,
      label: 'not matching regex'
    }
    const newAppCustomActionConfig = [{
      ...appCustomActionConfig[0],
      content_label_filter: 'some'
    }]

    const appCustomActionListResult = buildAppCustomActionLinkList(
      newAppCustomActionConfig, newContent, loggedUser, appContentType, appLanguage
    )
    const expected = []
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it("should not display any custom actions user doesn't have enough role in workspace", () => {
    const newLoggedUser = {
      ...loggedUser,
      userRoleIdInWorkspace: 1
    }

    const appCustomActionListResult = buildAppCustomActionLinkList(
      appCustomActionConfig, content, newLoggedUser, appContentType, appLanguage
    )
    const expected = []
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it("should not display any custom actions user doesn't have enough profile", () => {
    const newLoggedUser = {
      ...loggedUser,
      profile: 1
    }

    const appCustomActionListResult = buildAppCustomActionLinkList(
      appCustomActionConfig, content, newLoggedUser, appContentType, appLanguage
    )
    const expected = []
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should not display any custom action if the file extension mismatch', () => {
    const newContent = {
      ...content,
      file_extension: '.avi'
    }

    const appCustomActionListResult = buildAppCustomActionLinkList(
      appCustomActionConfig, newContent, loggedUser, appContentType, appLanguage
    )
    const expected = []
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should not display any custom action if the workspace id mismatch', () => {
    const newContent = {
      ...content,
      workspace_id: 11
    }

    const appCustomActionListResult = buildAppCustomActionLinkList(
      appCustomActionConfig, newContent, loggedUser, appContentType, appLanguage
    )
    const expected = []
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should display only one link if two are given but one mismatch', () => {
    const secondAppCustomConfig = [
      ...appCustomActionConfig,
      {
        icon_text: 'someOtherIcon',
        icon_image: '',
        content_type_filter: 'kanban',
        label: {
          fr: 'some other french label',
          en: 'some other english label'
        },
        link: 'some other link'
      }
    ]
    const newAppContentType = CONTENT_TYPE.KANBAN

    const appCustomActionListResult = buildAppCustomActionLinkList(
      secondAppCustomConfig, content, loggedUser, newAppContentType, appLanguage
    )
    const expected = [{
      icon: 'someOtherIcon',
      image: '',
      label: 'some other english label',
      actionLink: 'some other link',
      showAction: true,
      dataCy: 'popinListItem__customAction'
    }]
    expect(appCustomActionListResult).to.deep.equal(expected)
  })

  it('should work with the strict minimal properties in config (the required=True ones by backend)', () => {
    const newAppCustomActionConfig = [{
      icon_text: 'someIcon',
      icon_image: '',
      label: {
        en: 'some english label'
      },
      link: 'some link'
    }]

    const appCustomActionListResult = buildAppCustomActionLinkList(
      newAppCustomActionConfig, content, loggedUser, appContentType, appLanguage
    )
    const expected = [{
      icon: 'someIcon',
      image: '',
      label: 'some english label',
      actionLink: 'some link',
      showAction: true,
      dataCy: 'popinListItem__customAction'
    }]
    expect(appCustomActionListResult).to.deep.equal(expected)
  })
})
