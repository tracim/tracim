// Values copied from caldavzap config.js file.

var globalAccountSettings=[
    {
        href: '${user_base_url}',
        userAuth:
        {
            userName: '${fake_api.current_user.email}',
            userPassword: '${auth_token}'
        },
        timeOut: 90000,
        lockTimeOut: 10000,
        checkContentType: true,
        settingsAccount: false,
        delegation: false,
        forceReadOnly: null,
        ignoreAlarms: false,
        backgroundCalendars: [],
        basehref: '${base_href_url}'
    },
% if workspace_clendar_urls:
    {
        href: '${workspace_base_url}',
        userAuth:
        {
            userName: '${fake_api.current_user.email}',
            userPassword: '${auth_token}'
        },
        timeOut: 90000,
        lockTimeOut: 10000,
        checkContentType: true,
        settingsAccount: false,
        delegation: false,
        forceReadOnly: null,
        ignoreAlarms: false,
        backgroundCalendars: [],
        basehref: '${base_href_url}'
    },
% endif
] ;

var globalBackgroundSync=true;
var globalSyncResourcesInterval=120000;
var globalEnableRefresh=false;
var globalEnableKbNavigation=true;
var globalInterfaceLanguage=window.parent.globalTracimLang; // globalTracimLang is declared in tracim header (caldavzap in in an iframe)
var globalInterfaceCustomLanguages=['en_US', 'fr_FR'];
var globalSortAlphabet=' 0123456789'+
    'AÀÁÂÄÆÃÅĀBCÇĆČDĎEÈÉÊËĒĖĘĚFGĞHIÌÍÎİÏĪĮJKLŁĹĽMNŃÑŇOÒÓÔÖŐŒØÕŌ'+
    'PQRŔŘSŚŠȘșŞşẞTŤȚțŢţUÙÚÛÜŰŮŪVWXYÝŸZŹŻŽ'+
    'aàáâäæãåābcçćčdďeèéêëēėęěfgğhiìíîïīįıjklłĺľmnńñňoòóôöőœøõō'+
    'pqrŕřsśšßtťuùúûüűůūvwxyýÿzźżžАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЮЯ'+
    'Ьабвгґдеєжзиіїйклмнопрстуфхцчшщюяь';
var globalSearchTransformAlphabet={
    '[ÀàÁáÂâÄäÆæÃãÅåĀā]': 'a', '[ÇçĆćČč]': 'c', '[Ďď]': 'd',
    '[ÈèÉéÊêËëĒēĖėĘęĚě]': 'e', '[Ğğ]': 'g', '[ÌìÍíÎîİıÏïĪīĮį]': 'i',
    '[ŁłĹĺĽľ]': 'l', '[ŃńÑñŇň]': 'n', '[ÒòÓóÔôÖöŐőŒœØøÕõŌō]': 'o',
    '[ŔŕŘř]': 'r', '[ŚśŠšȘșŞşẞß]': 's', '[ŤťȚțŢţ]': 't',
    '[ÙùÚúÛûÜüŰűŮůŪū]': 'u', '[ÝýŸÿ]': 'y', '[ŹźŻżŽž]': 'z'
};
var globalResourceAlphabetSorting=true;
var globalNewVersionNotifyUsers=[];
var globalDatepickerFirstDayOfWeek=1;
var globalHideInfoMessageAfter=1800;
var globalEditorFadeAnimation=666;
var globalEventStartPastLimit=3;
var globalEventStartFutureLimit=3;
var globalTodoPastLimit=1;
var globalLoadedCalendarCollections=[];
var globalLoadedTodoCollections=[];
var globalActiveCalendarCollections=[];
var globalActiveTodoCollections=[];
var globalActiveView='multiWeek';
var globalOpenFormMode='double';
var globalTodoListFilterSelected=['filterAction', 'filterProgress'];
var globalCalendarStartOfBusiness=8;
var globalCalendarEndOfBusiness=17;
var globalDefaultEventDuration=120;
var globalDisplayHiddenEvents=false;
var globalTimeZoneSupport=true;
var globalTimeZone='Europe/Berlin';
var globalTimeZonesEnabled=[];
var globalRewriteTimezoneComponent=true;
var globalRemoveUnknownTimezone=false;
var globalShowHiddenAlarms=false;
var globalIgnoreCompletedOrCancelledAlarms=true;
var globalMozillaSupport=false;
var globalWeekendDays=[0, 6];
var globalAppleRemindersMode=true;
