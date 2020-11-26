module.exports = {
  debug: false,
  removeUnusedKeys: true,
  func: {
    list: ['t', 'props.t', 'this.props.t', 'i18n.t'],
    extensions: ['.js', '.jsx']
  },
  trans: {
    component: 'Trans',
    i18nKey: 'i18nKey',
    defaultsKey: 'defaults',
    extensions: ['.js', '.jsx'],
    fallbackKey: (ns, value) => value,
    acorn: {
      ecmaVersion: 10, // defaults to 10
      sourceType: 'module' // defaults to 'module'
      // Check out https://github.com/acornjs/acorn/tree/master/acorn#interface for additional options
    }
  },
  lngs: ['en', 'fr', 'pt'],
  defaultLng: 'en',
  keySeparator: false, // false means "keyBasedFallback"
  nsSeparator: false, // false means "keyBasedFallback"
  fallbackLng: false,

  ns: ['translation'], // namespace
  defaultNS: 'translation',

  // @param {string} lng The language currently used.
  // @param {string} ns The namespace currently used.
  // @param {string} key The translation key.
  // @return {string} Returns a default value for the translation key.
  // Return key as the default value for English language. Otherwise, returns '__NOT_TRANSLATED__'
  defaultValue: (lng, ns, key) => lng === 'en' ? key : '__NOT_TRANSLATED__',

  react: { wait: true },

  resource: {
    // The path where resources get loaded from.
    // /!\ /!\ /!\ Relative to CURRENT working directory. /!\
    loadPath: 'i18next.scanner/{{lng}}/{{ns}}.json',
    // The path to store resources.
    // /!\ /!\ /!\ Relative to the path specified by `vfs.dest('./i18next.scanner')`. /!\
    savePath: '{{lng}}/{{ns}}.json',
    jsonIndent: 2,
    lineEnding: '\n'
  }
}
