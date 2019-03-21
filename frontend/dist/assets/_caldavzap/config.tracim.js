// Values copied from caldavzap config.js file.

var importedConfig = window.parent.document.getElementById('cladavzapIframe').getAttribute('data-config')
var configObj = JSON.parse(importedConfig)

var globalAccountSettings = configObj.globalAccountSettings.calendarList.map(c => ({
  href: c.href,
  userAuth: {
    userName: 'notaname',
    userPassword: 'notapw'
  },
  withCredentials: c.withCredentials,
  hrefLabel: c.hrefLabel,
  timeOut: 90000,
  lockTimeOut: 10000,
  checkContentType: true,
  settingsAccount: c.settingsAccount,
  delegation: false,
  forceReadOnly: null,
  ignoreAlarms: false,
  backgroundCalendars: [],
  basehref: c.href.split('/')[2] // const [protocol, empty, hostname, ...path] = c.href.split('/')
}))

var globalBackgroundSync=true
var globalSyncResourcesInterval=120000
var globalEnableRefresh=false
var globalEnableKbNavigation=true
// var globalInterfaceLanguage=window.parent.globalTracimLang === 'fr' ? 'fr_FR' : window.parent.globalTracimLang // Côme - 2017/09/14 - line outdated
// globalTracimLang is declared in tracim header (caldavzap is in an iframe)
var globalInterfaceLanguage = (function (lang) {
  switch (lang) {
    case 'fr':
      return 'fr_FR'
    case 'en':
      return 'en_US'
    default:
      return 'en_US'
  }
})(configObj.userLang)

var globalInterfaceCustomLanguages=['en_US', 'fr_FR']
var globalSortAlphabet=' 0123456789'+
  'AÀÁÂÄÆÃÅĀBCÇĆČDĎEÈÉÊËĒĖĘĚFGĞHIÌÍÎİÏĪĮJKLŁĹĽMNŃÑŇOÒÓÔÖŐŒØÕŌ'+
  'PQRŔŘSŚŠȘșŞşẞTŤȚțŢţUÙÚÛÜŰŮŪVWXYÝŸZŹŻŽ'+
  'aàáâäæãåābcçćčdďeèéêëēėęěfgğhiìíîïīįıjklłĺľmnńñňoòóôöőœøõō'+
  'pqrŕřsśšßtťuùúûüűůūvwxyýÿzźżžАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЮЯ'+
  'Ьабвгґдеєжзиіїйклмнопрстуфхцчшщюяь'
var globalSearchTransformAlphabet={
  '[ÀàÁáÂâÄäÆæÃãÅåĀā]': 'a', '[ÇçĆćČč]': 'c', '[Ďď]': 'd',
  '[ÈèÉéÊêËëĒēĖėĘęĚě]': 'e', '[Ğğ]': 'g', '[ÌìÍíÎîİıÏïĪīĮį]': 'i',
  '[ŁłĹĺĽľ]': 'l', '[ŃńÑñŇň]': 'n', '[ÒòÓóÔôÖöŐőŒœØøÕõŌō]': 'o',
  '[ŔŕŘř]': 'r', '[ŚśŠšȘșŞşẞß]': 's', '[ŤťȚțŢţ]': 't',
  '[ÙùÚúÛûÜüŰűŮůŪū]': 'u', '[ÝýŸÿ]': 'y', '[ŹźŻżŽž]': 'z'
}
var globalResourceAlphabetSorting=true
var globalNewVersionNotifyUsers=[]
var globalDatepickerFirstDayOfWeek=1
var globalHideInfoMessageAfter=1800
var globalEditorFadeAnimation=666
var globalEventStartPastLimit=3
var globalEventStartFutureLimit=3
var globalTodoPastLimit=1
var globalLoadedCalendarCollections = []
var globalLoadedTodoCollections=[]
var globalActiveCalendarCollections=[]
var globalActiveTodoCollections=[]
var globalActiveView='multiWeek'
var globalOpenFormMode='double'
var globalTodoListFilterSelected=['filterAction', 'filterProgress']
var globalCalendarStartOfBusiness=8
var globalCalendarEndOfBusiness=17
var globalDefaultEventDuration=120
var globalDisplayHiddenEvents=false
var globalTimeZoneSupport=true
var globalTimeZone='Europe/Berlin'
var globalTimeZonesEnabled=[]
var globalRewriteTimezoneComponent=true
var globalRemoveUnknownTimezone=false
var globalShowHiddenAlarms=false
var globalIgnoreCompletedOrCancelledAlarms=true
var globalMozillaSupport=false
var globalWeekendDays=[0, 6]
var globalAppleRemindersMode=true
