import i18n from './i18n.js'

export const getUserProfile = (profileObj, slug) => Object.keys(profileObj).map(p => profileObj[p]).find(p => slug === p.slug) || {}

export const debug = {
  config: {
    label: 'Admin workspace user',
    slug: 'admin_workspace_user',
    faIcon: 'file-text-o',
    hexcolor: '#7d4e24',
    type: 'form', // 'user' or 'workspace'
    translation: {en: {}, fr: {}},
    apiUrl: 'http://localhost:6543/api/v2',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    system: {
      config: {
        email_notification_activated: true
      }
    },
    profileObject: {
      ADMINISTRATOR: {
        id: 1,
        slug: 'administrators',
        faIcon: 'shield',
        hexcolor: '#ed0007',
        label: i18n.t('Administrator')
      },
      MANAGER: {
        id: 2,
        slug: 'trusted-users',
        faIcon: 'graduation-cap',
        hexcolor: '#f2af2d',
        label: i18n.t('Trusted user')
      },
      USER: {
        id: 4,
        slug: 'users',
        faIcon: 'user',
        hexcolor: '#3145f7',
        label: i18n.t('User')
      },
      FORM: {
        id: 5,
        slug: 'form',
        faIcon: 'user',
        hexcolor: '#00FFFF',
        label: 'Formulaire'
      }
    }
  },
  loggedUser: {
    user_id: 1,
    public_name: 'Global Manager',
    email: 'osef@algoo.fr',
    lang: 'en',
    avatar_url: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  content: {
    workspaceList: [],
    userList: []
  }
}

export const DRAG_AND_DROP = {
  FIELD: 'field',
  FIELD_TYPE: 'field_type'
}

export const FIELD_TYPE = {
  STRING: {
    fieldType: 'string',
    name: 'String'
  },
  INTEGER: {
    fieldType: 'integer',
    name: 'Integer'
  },
  NUMBER: {
    fieldType: 'number',
    name: 'Number'
  },
  ARRAY: {
    fieldType: 'array',
    name: 'Array'
  },
  BOOLEAN: {
    fieldType: 'boolean',
    name: 'Boolean'
  },
  OBJECT: {
    fieldType: 'object',
    name: 'Object'
  },
  TEXT_RICH: {
    fieldType: 'textRich',
    name: 'Text rich'
  },
  SELECT_USER: {
    fieldType: 'selectUsers',
    name: 'Select users'
  },
  MARKDOWN_FIELD: {
    fieldType: 'markdownField',
    name: 'Markdown editor'
  },
  IMAGE_FIELD: {
    fieldType: 'imageField',
    name: 'Image'
  }
}

export const SPECIAL_FIELD = [
  FIELD_TYPE.TEXT_RICH.fieldType,
  FIELD_TYPE.SELECT_USER.fieldType,
  FIELD_TYPE.MARKDOWN_FIELD.fieldType,
  FIELD_TYPE.IMAGE_FIELD.fieldType
]

export const isSpecialField = (fieldType) => {
  return SPECIAL_FIELD.includes(fieldType)
}

export const POSITION = {
  ROOT: '_root'
}

export const getWidgets = (type) => {
  switch (type) {
    case 'string':
      return FIELD_PROPERTIES.STRING.WIDGET
    case 'number':
      return FIELD_PROPERTIES.NUMBER.WIDGET
    case 'integer':
      return FIELD_PROPERTIES.INTEGER.WIDGET
    case 'boolean':
      return FIELD_PROPERTIES.BOOLEAN.WIDGET
    default:
      return undefined
  }
}

export const getFormats = (type) => {
  switch (type) {
    case 'string':
      return FIELD_PROPERTIES.STRING.FORMAT
    default:
      return undefined
  }
}

const FIELD_PROPERTIES = {
  STRING: {
    WIDGET: [
      'hidden',
      'text',
      'password',
      'uri',
      'data-url',
      'textarea',
      'date',
      'datetime',
      'alt-date',
      'alt-datetime',
      'color',
      'file'
    ],
    FORMAT: [
      'date-time',
      'email',
      'hostname',
      'date',
      'ipv4',
      'ipv6',
      'uri'
    ]
  },
  NUMBER: {
    WIDGET: [
      'hidden',
      'range',
      'text',
      'updown'
    ],
    FORMAT: []
  },
  INTEGER: {
    WIDGET: [
      'hidden',
      'range',
      'text',
      'updown'
    ],
    FORMAT: []
  },
  BOOLEAN: {
    WIDGET: [
      'hidden',
      'checkbox'
    ],
    FORMAT: []
  }
}
