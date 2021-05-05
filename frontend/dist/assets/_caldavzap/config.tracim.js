// Values copied from caldavzap config.js file.

var importedConfig = window.parent.document.getElementById('agendaIframe').getAttribute('data-config')
var configObj = JSON.parse(importedConfig)

var globalAccountSettings = configObj.globalAccountSettings.agendaList.map(c => ({
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
  basehref: c.href.split('/')[2], // const [protocol, empty, hostname, ...path] = c.href.split('/')
  workspaceId: c.workspaceId,
  loggedUserRole: c.loggedUserRole
}))

var globalShouldShowSidebar = configObj.shouldShowCaldavzapSidebar || configObj.globalAccountSettings.agendaList.length > 1

var globalBackgroundSync=true
var globalSyncResourcesInterval=120000
var globalEnableRefresh=false
var globalEnableKbNavigation=true

// globalTracimLang is declared in tracim header (caldavzap is in an iframe)
var globalInterfaceLanguage = (function (lang) {
  switch (lang) {
    case 'fr':
      return 'fr_FR'
    case 'de':
      return 'de_DE'
    case 'en':
      return 'en_US'
    default:
      return 'en_US'
  }
})(configObj.userLang)

var globalInterfaceCustomLanguages=['en_US', 'fr_FR', 'de_DE']
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
var globalTimeZonesEnabled=[
  'Arctic/Longyearbyen', 'Africa/Dar_es_Salaam', 'Africa/Mbabane', 'Africa/Lagos', 'Africa/Bissau', 'Africa/Nairobi', 'Africa/Tunis', 'Africa/Khartoum', 'Africa/Asmara', 'Africa/Lubumbashi', 'Africa/Blantyre', 'Africa/Bamako', 'Africa/Algiers', 'Africa/Ouagadougou', 'Africa/Djibouti', 'Africa/Sao_Tome', 'Africa/Ndjamena', 'Africa/Malabo', 'Africa/Porto-Novo', 'Africa/Addis_Ababa', 'Africa/Gaborone', 'Africa/Brazzaville', 'Africa/Lusaka', 'Africa/Windhoek', 'Africa/Kinshasa', 'Africa/Mogadishu', 'Africa/Casablanca', 'Africa/Kigali', 'Africa/Douala', 'Africa/Abidjan', 'Africa/Cairo', 'Africa/Freetown', 'Africa/Luanda', 'Africa/Nouakchott', 'Africa/Harare', 'Africa/Tripoli', 'Africa/Maseru', 'Africa/Monrovia', 'Africa/Conakry', 'Africa/Juba', 'Africa/El_Aaiun', 'Africa/Accra', 'Africa/Bujumbura', 'Africa/Bangui', 'Africa/Lome', 'Africa/Johannesburg', 'Africa/Maputo', 'Africa/Niamey', 'Africa/Ceuta', 'Africa/Dakar', 'Africa/Libreville', 'Africa/Kampala', 'Africa/Banjul',
  'Atlantic/Azores', 'Atlantic/South_Georgia', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Cape_Verde', 'Atlantic/Stanley', 'Atlantic/Bermuda', 'Atlantic/Reykjavik', 'Atlantic/St_Helena', 'Atlantic/Faroe',
  'America/Sitka', 'America/Caracas', 'America/Resolute', 'America/Porto_Velho', 'America/Sao_Paulo', 'America/Marigot', 'America/Juneau', 'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/North_Dakota/Beulah', 'America/Rio_Branco', 'America/Lower_Princes', 'America/Denver', 'America/Santo_Domingo', 'America/Halifax', 'America/Dominica', 'America/St_Kitts', 'America/Merida', 'America/St_Johns', 'America/New_York', 'America/Adak', 'America/Nipigon', 'America/Godthab', 'America/Montserrat', 'America/Guyana', 'America/Thule', 'America/Los_Angeles', 'America/Goose_Bay', 'America/Blanc-Sablon', 'America/Regina', 'America/Rainy_River', 'America/Anguilla', 'America/Toronto', 'America/Costa_Rica', 'America/Maceio', 'America/Araguaina', 'America/Whitehorse', 'America/Santa_Isabel', 'America/Vancouver', 'America/St_Barthelemy', 'America/Bogota', 'America/Pangnirtung', 'America/Santarem', 'America/Boise', 'America/Recife', 'America/Glace_Bay', 'America/Lima', 'America/Dawson', 'America/Tijuana', 'America/Cuiaba', 'America/Creston', 'America/Fortaleza', 'America/Atikokan', 'America/Puerto_Rico', 'America/St_Thomas', 'America/Indiana/Petersburg', 'America/Indiana/Indianapolis', 'America/Indiana/Tell_City', 'America/Indiana/Vevay', 'America/Indiana/Marengo',
  'America/Indiana/Winamac', 'America/Indiana/Vincennes', 'America/Indiana/Knox', 'America/Nassau', 'America/Tegucigalpa', 'America/Noronha', 'America/Eirunepe', 'America/Jamaica', 'America/Monterrey', 'America/Managua', 'America/Iqaluit', 'America/Kentucky/Monticello', 'America/Kentucky/Louisville', 'America/Barbados', 'America/St_Vincent', 'America/Santiago', 'America/Montevideo', 'America/Chihuahua', 'America/Bahia_Banderas', 'America/Bahia', 'America/Guatemala', 'America/Mexico_City', 'America/Martinique', 'America/Belize', 'America/St_Lucia', 'America/Asuncion', 'America/Havana', 'America/Detroit', 'America/Metlakatla', 'America/Guayaquil', 'America/Rankin_Inlet', 'America/Argentina/Ushuaia',
  'America/Argentina/Rio_Gallegos', 'America/Argentina/San_Luis', 'America/Argentina/Catamarca', 'America/Argentina/San_Juan', 'America/Argentina/Mendoza', 'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Cordoba', 'America/Argentina/Tucuman', 'America/Argentina/Salta', 'America/Argentina/Buenos_Aires', 'America/Panama', 'America/Yakutat', 'America/Cayenne', 'America/Menominee', 'America/Swift_Current', 'America/Campo_Grande', 'America/Grenada', 'America/El_Salvador', 'America/Anchorage', 'America/Edmonton', 'America/Scoresbysund', 'America/Moncton', 'America/Thunder_Bay', 'America/Phoenix', 'America/Boa_Vista', 'America/Aruba', 'America/Nome', 'America/Guadeloupe', 'America/Ojinaga', 'America/Belem', 'America/Mazatlan', 'America/Port-au-Prince', 'America/Port_of_Spain', 'America/Paramaribo', 'America/Winnipeg', 'America/Antigua', 'America/Manaus', 'America/Grand_Turk', 'America/Hermosillo', 'America/Inuvik', 'America/Cayman', 'America/Cambridge_Bay', 'America/Cancun', 'America/Kralendijk', 'America/Tortola', 'America/Curacao', 'America/Matamoros', 'America/Miquelon', 'America/Yellowknife', 'America/La_Paz', 'America/Chicago', 'America/Danmarkshavn', 'America/Dawson_Creek',
  'Asia/Jerusalem', 'Asia/Irkutsk', 'Asia/Novokuznetsk', 'Asia/Vientiane', 'Asia/Colombo', 'Asia/Krasnoyarsk', 'Asia/Qatar', 'Asia/Bahrain', 'Asia/Urumqi', 'Asia/Beirut', 'Asia/Sakhalin', 'Asia/Karachi', 'Asia/Bishkek', 'Asia/Macau', 'Asia/Kolkata', 'Asia/Hong_Kong', 'Asia/Makassar', 'Asia/Kuwait', 'Asia/Chita', 'Asia/Tehran', 'Asia/Magadan', 'Asia/Yakutsk', 'Asia/Kabul', 'Asia/Oral', 'Asia/Srednekolymsk', 'Asia/Novosibirsk', 'Asia/Rangoon', 'Asia/Aqtau', 'Asia/Damascus', 'Asia/Pontianak', 'Asia/Samarkand', 'Asia/Jayapura', 'Asia/Choibalsan', 'Asia/Baghdad', 'Asia/Tashkent', 'Asia/Hebron', 'Asia/Nicosia', 'Asia/Aden', 'Asia/Dhaka', 'Asia/Aqtobe', 'Asia/Brunei', 'Asia/Ho_Chi_Minh', 'Asia/Ashgabat', 'Asia/Seoul', 'Asia/Dubai', 'Asia/Thimphu', 'Asia/Shanghai', 'Asia/Almaty', 'Asia/Pyongyang', 'Asia/Singapore', 'Asia/Phnom_Penh', 'Asia/Gaza', 'Asia/Jakarta', 'Asia/Kathmandu', 'Asia/Manila', 'Asia/Bangkok', 'Asia/Baku', 'Asia/Kuala_Lumpur', 'Asia/Riyadh', 'Asia/Ulaanbaatar', 'Asia/Omsk', 'Asia/Yekaterinburg', 'Asia/Ust-Nera', 'Asia/Yerevan', 'Asia/Khandyga', 'Asia/Anadyr', 'Asia/Dushanbe', 'Asia/Kuching', 'Asia/Qyzylorda', 'Asia/Tbilisi', 'Asia/Istanbul', 'Asia/Amman', 'Asia/Taipei', 'Asia/Muscat', 'Asia/Vladivostok', 'Asia/Dili', 'Asia/Hovd', 'Asia/Tokyo', 'Asia/Kamchatka',
  'Pacific/Johnston', 'Pacific/Niue', 'Pacific/Pohnpei', 'Pacific/Tahiti', 'Pacific/Rarotonga', 'Pacific/Tongatapu', 'Pacific/Port_Moresby', 'Pacific/Guadalcanal', 'Pacific/Saipan', 'Pacific/Gambier', 'Pacific/Honolulu', 'Pacific/Wake', 'Pacific/Fiji', 'Pacific/Kwajalein', 'Pacific/Nauru', 'Pacific/Kiritimati', 'Pacific/Midway', 'Pacific/Funafuti', 'Pacific/Chuuk', 'Pacific/Auckland', 'Pacific/Pitcairn', 'Pacific/Majuro', 'Pacific/Pago_Pago', 'Pacific/Easter', 'Pacific/Efate', 'Pacific/Tarawa', 'Pacific/Guam', 'Pacific/Apia', 'Pacific/Norfolk', 'Pacific/Bougainville', 'Pacific/Kosrae', 'Pacific/Wallis', 'Pacific/Chatham', 'Pacific/Marquesas', 'Pacific/Galapagos', 'Pacific/Fakaofo', 'Pacific/Enderbury', 'Pacific/Noumea', 'Pacific/Palau',
  'Antarctica/Davis', 'Antarctica/Rothera', 'Antarctica/McMurdo', 'Antarctica/Mawson', 'Antarctica/Troll', 'Antarctica/DumontDUrville', 'Antarctica/Casey', 'Antarctica/Palmer', 'Antarctica/Syowa', 'Antarctica/Vostok', 'Antarctica/Macquarie',
  'Europe/Dublin', 'Europe/Andorra', 'Europe/Vienna', 'Europe/Vaduz', 'Europe/Ljubljana', 'Europe/Brussels', 'Europe/Helsinki', 'Europe/London', 'Europe/Mariehamn', 'Europe/Chisinau', 'Europe/Busingen', 'Europe/Malta', 'Europe/Amsterdam', 'Europe/Vatican', 'Europe/Berlin', 'Europe/Sofia', 'Europe/Prague', 'Europe/Volgograd', 'Europe/Warsaw', 'Europe/Gibraltar', 'Europe/Minsk', 'Europe/Tirane', 'Europe/Samara', 'Europe/Budapest', 'Europe/Stockholm', 'Europe/Sarajevo', 'Europe/Nicosia', 'Europe/Uzhgorod', 'Europe/Kaliningrad', 'Europe/Vilnius', 'Europe/Zurich', 'Europe/Jersey', 'Europe/Madrid', 'Europe/Luxembourg', 'Europe/Skopje', 'Europe/Bratislava', 'Europe/Riga', 'Europe/Guernsey', 'Europe/Zagreb', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Paris', 'Europe/Kiev', 'Europe/Lisbon', 'Europe/Athens', 'Europe/San_Marino', 'Europe/Zaporozhye', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Copenhagen', 'Europe/Podgorica', 'Europe/Oslo', 'Europe/Tallinn', 'Europe/Belgrade', 'Europe/Rome', 'Europe/Simferopol', 'Europe/Bucharest',
  'Australia/Lord_Howe', 'Australia/Adelaide', 'Australia/Eucla', 'Australia/Broken_Hill', 'Australia/Currie', 'Australia/Brisbane', 'Australia/Melbourne', 'Australia/Hobart', 'Australia/Darwin', 'Australia/Perth', 'Australia/Sydney', 'Australia/Lindeman',
  'Indian/Mayotte', 'Indian/Mauritius', 'Indian/Cocos', 'Indian/Chagos', 'Indian/Maldives', 'Indian/Antananarivo', 'Indian/Christmas', 'Indian/Comoro', 'Indian/Mahe', 'Indian/Reunion', 'Indian/Kerguelen'
]

// @INFO - CH - 2019-04-02 - from https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie/Simple_document.cookie_framework
var globalDocCookies = {
  getItem: function (sKey) {
    if (!sKey) { return null; }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  // @INFO - CH - 2019-04-02 - bellow functions are unused
  // removeItem: function (sKey, sPath, sDomain) {
  //   if (!this.hasItem(sKey)) { return false; }
  //   document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
  //   return true;
  // },
  // hasItem: function (sKey) {
  //   if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
  //   return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  // },
  // keys: function () {
  //   var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
  //   for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
  //   return aKeys;
  // }
};

// FIXME - CH - 2019-04-03 - Saving the timezone in a cookie in ok but a better solution should be implement
// see https://github.com/tracim/tracim/issues/1551
var globalTimezoneCookieName = 'caldavzap_default_timezone'
var globalUpdateTimezoneCookieValue = function (newTimezone) {
  globalDocCookies.setItem(globalTimezoneCookieName, newTimezone, 60*60*24*365)
}

var initCaldavzapTimezone = function () {
  var timezoneFallback = 'Europe/Paris'

  var timezoneCookieValue = globalDocCookies.getItem(globalTimezoneCookieName)

  if (timezoneCookieValue && globalTimeZonesEnabled.includes(timezoneCookieValue)) {
    return timezoneCookieValue
  }

  if (Intl.DateTimeFormat() && Intl.DateTimeFormat().resolvedOptions() && Intl.DateTimeFormat().resolvedOptions().timeZone) {
    var userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (globalTimeZonesEnabled.includes(userTimezone)) {
      return userTimezone
    }

    return timezoneFallback
  }

  globalUpdateTimezoneCookieValue(timezoneFallback)
}

var globalTimeZone = initCaldavzapTimezone()

var globalRewriteTimezoneComponent=true
var globalRemoveUnknownTimezone=false
var globalShowHiddenAlarms=false
var globalIgnoreCompletedOrCancelledAlarms=true
var globalMozillaSupport=false
var globalWeekendDays=[0, 6]
var globalAppleRemindersMode=true
