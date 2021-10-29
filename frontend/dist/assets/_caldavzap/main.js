/*
CalDavZAP - the open source CalDAV Web Client
Copyright (C) 2011-2015
    Jan Mate <jan.mate@inf-it.com>
    Andrej Lezo <andrej.lezo@inf-it.com>
    Matej Mihalik <matej.mihalik@inf-it.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

var globalEventList=new EventList();
var globalAppleSupport = new AppleSupportNextDateArray();
var globalResourceCalDAVList=new ResourceCalDAVList();
var maxAlarmValue=2147000000;
var globalMultiWeekSize=3;
var globalMaxNextInstanesTodoCheckingNumber=60;

var globalEventIntervalID=null;
var globalResourceRefreshNumber=0;
var globalResourceRefreshNumberTodo=0;
var globalCalDAVInitLoad=true;
var globalCalDAVResourceSync=false;
var globalCalDAVCollectionSync=false;
var globalCalendarNumber=0;
var globalOnlyCalendarNumber=0;
var globalTodoCalendarNumber=0;
var globalOnlyCalendarNumberCount=0;
var globalOnlyTodoCalendarNumberCount=0;
var globalCalendarNumberCount=0;
var globalEventTimeoutID=0;

var cleanResourceCalDAVListTemplate=null;
var cleanResourceCalDAVTODOListTemplate=null;
var cleanVcalendarTemplate=null;
var cleanVtodoTemplate=null;
var origResourceCalDAVListTemplate=null;
var origResourceCalDAVTODOListTemplate=null;
var origVcalendarTemplate=null;
var origVtodoTemplate=null;
var origVtodoLoaderTemplate=null;
var globalSessionTimeZone=null;
var globalCalDAVQs=null;
var globalCalDAVTODOQs=null;
var globalVisibleCalDAVCollections=new Array();
var globalVisibleCalDAVTODOCollections=new Array();
var isResourceComplete=false;
var prevFunctionArray=new Array();
var prevFunctionArrayIterator=0;
var globalWorkerArray=new Array();
var globalIntervalArray=new Array();
var globalCurrentLoadingResource='';
var timeZonesEnabled=new Array();
var cLcouny=42;
var processedTimezones = Array();
var timelist=new Array();
var minelems=[0,15,30,45];
var frequencies = ["SECONDLY", "MINUTELY", "HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
var globalToday=new Date();
var isCalDAVLoaded=false;
var isCalDAVAvaible=true;
var globalLoadedLimit = new Date();
var globalToLoadedLimit = new Date();
var globalLimitLoading='';
var globalLimitTodoLoading='';
var globalBeginPast = new Date();
var globalBeginFuture = new Date();
var globalLoadedLimitTodo = new Date();
var globalToLoadedLimitTodo = new Date();
var globalDefaultCalendarCollectionLoadAll=(typeof globalNetworkCheckSettings=='undefined' && typeof globalNetworkAccountSettings=='undefined');
var globalDefaultCalendarCollectionActiveAll=globalDefaultCalendarCollectionLoadAll;
var globalDefaultTodoCalendarCollectionLoadAll=(typeof globalNetworkCheckSettings=='undefined' && typeof globalNetworkAccountSettings=='undefined');
var globalDefaultTodoCalendarCollectionActiveAll=globalDefaultTodoCalendarCollectionLoadAll;
var globalTodoLoaderHide='';
var globalEventCollectionsLoading=false;
var globalTodoCollectionsLoading=false;

var globalCalEvent=null;
var globalCalTodo=null;
var globalJsEvent=null;
var globalRevertFunction=null;
var globalPrevDragEventAllDay=null;
var globalPrevDate='';
var globalAllowFcRerender=true;
var globalCalWidth=0;
var globalTodoCheckTimeout=null;
var globalTodoCheckTimeoutDelay=1000;
var globalTodolistStatusArray={};

var globalSettings={
	version: {value: (typeof globalSettingsVersion!='undefined' && globalSettingsVersion!=null) ? globalSettingsVersion : 1, locked:false},
	resourcealphabetsorting: {value: (typeof globalResourceAlphabetSorting!='undefined' && globalResourceAlphabetSorting!=null) ? globalResourceAlphabetSorting : true, locked:false},
	usejqueryauth: {value:  (typeof globalUseJqueryAuth!='undefined' && globalUseJqueryAuth!=null) ? globalUseJqueryAuth : false, locked:false},
	settingstype: {value:  (typeof globalSettingsType!='undefined' && globalSettingsType!=null && globalSettingsType!='') ? globalSettingsType : 'principal-URL', locked:false},
	defaultactiveapp: {value:  (typeof globalDefaultActiveApp!='undefined' && globalDefaultActiveApp!=null && globalDefaultActiveApp!='') ? globalDefaultActiveApp : null, locked:false},
	islastdefaultactiveapp: {value:  false, locked:false},
	datepickerfirstdayofweek: {value:  (typeof globalDatepickerFirstDayOfWeek!='undefined' && globalDatepickerFirstDayOfWeek!=null) ? globalDatepickerFirstDayOfWeek : 1, locked:false},
	syncresourcesinterval: {value: (typeof globalSyncResourcesInterval!='undefined' && globalSyncResourcesInterval!=null) ? globalSyncResourcesInterval :300000, locked:false},
	datepickerformat: {value: (typeof globalDatepickerFormat!='undefined' && globalDatepickerFormat!=null && globalDatepickerFormat!='') ? globalDatepickerFormat : localization[globalInterfaceLanguage]._default_datepicker_format_, locked:false},
	backgroundsync: {value: (typeof globalBackgroundSync!='undefined' && globalBackgroundSync!=null) ? globalBackgroundSync : true, locked:false},
	enablekbnavigation: {value: (typeof globalEnableKbNavigation!='undefined' && globalEnableKbNavigation!=null) ? globalEnableKbNavigation : true, locked:false},
	rewritetimezonecomponent: {value:  (typeof globalRewriteTimezoneComponent!='undefined' && globalRewriteTimezoneComponent!=null) ? globalRewriteTimezoneComponent : true, locked:false},
	removeunknowntimezone: {value:  (typeof globalRemoveUnknownTimezone!='undefined' && globalRemoveUnknownTimezone!=null) ? globalRemoveUnknownTimezone : false, locked:false},
	mozillasupport: {value:  (typeof globalMozillaSupport!='undefined' && globalMozillaSupport!=null) ? globalMozillaSupport : false, locked:false},
	appleremindersmode: {value:  (typeof globalAppleRemindersMode!='undefined' && globalAppleRemindersMode!=null) ? globalAppleRemindersMode : false, locked:false},
	titleformatmonth: {value:  localization[globalInterfaceLanguage]._default_title_format_month_, locked:false},
	titleformatweek: {value:  localization[globalInterfaceLanguage]._default_title_format_week_, locked:false},
	titleformatday: {value:  localization[globalInterfaceLanguage]._default_title_format_day_, locked:false},
	titleformattable: {value:  localization[globalInterfaceLanguage]._default_title_format_table_, locked:false},
	columnformatagenda: {value:  localization[globalInterfaceLanguage]._default_column_format_agenda_, locked:false},
	activecalendarcollections: {value:  (typeof globalActiveCalendarCollections!='undefined' && globalActiveCalendarCollections!=null) ? globalActiveCalendarCollections : new Array(), locked:false},
	activetodocollections: {value:  (typeof globalActiveTodoCollections!='undefined' && globalActiveTodoCollections!=null) ? globalActiveTodoCollections : new Array(), locked:false},
	loadedcalendarcollections: {value:  (typeof globalLoadedCalendarCollections!='undefined' && globalLoadedCalendarCollections!=null) ? globalLoadedCalendarCollections : new Array(), locked:false},
	loadedtodocollections: {value:  (typeof globalLoadedTodoCollections!='undefined' && globalLoadedTodoCollections!=null) ? globalLoadedTodoCollections : new Array(), locked:false},
	todolistfilterselected: {value:  (typeof globalTodoListFilterSelected!='undefined' && globalTodoListFilterSelected!=null && globalTodoListFilterSelected!='') ? globalTodoListFilterSelected : ['filterAction', 'filterProgress'], locked:false},
	activeview: {value:  (typeof globalActiveView!='undefined' && globalActiveView!=null && globalActiveView!='') ? globalActiveView : 'multiWeek', locked:false},
	islastactiveview: {value:  true, locked:false},
	calendarselected: {value:  (typeof globalCalendarSelected!='undefined' && globalCalendarSelected!=null && globalCalendarSelected!='') ? globalCalendarSelected : '', locked:false},
	todocalendarselected: {value:  (typeof globalTodoCalendarSelected!='undefined' && globalTodoCalendarSelected!=null && globalTodoCalendarSelected!='') ? globalTodoCalendarSelected : '', locked:false},
	timezone: {value:  (typeof globalTimeZone!='undefined' && globalTimeZone!=null && globalTimeZone!='') ? globalTimeZone : 'local', locked:false},
	islasttimezone: {value: true, locked:false},
	openformmode: {value:  (typeof globalOpenFormMode!='undefined' && globalOpenFormMode!=null && globalOpenFormMode!='') ? globalOpenFormMode : 'double', locked:false},
	calendarstartofbusiness: {value:  (typeof globalCalendarStartOfBusiness!='undefined' && globalCalendarStartOfBusiness!=null) ? globalCalendarStartOfBusiness : 8, locked:false},
	calendarendofbusiness: {value:  (typeof globalCalendarEndOfBusiness!='undefined' && globalCalendarEndOfBusiness!=null) ? globalCalendarEndOfBusiness : 17, locked:false},
	defaulteventduration: {value:  (typeof globalDefaultEventDuration!='undefined' && globalDefaultEventDuration!=null && globalDefaultEventDuration>=0) ? globalDefaultEventDuration : null, locked:false},
	ampmformat: {value:  (typeof globalAMPMFormat!='undefined' && globalAMPMFormat!=null) ? globalAMPMFormat : localization[globalInterfaceLanguage]._default_AMPM_format_, locked:false},
	timeformatagenda: {value:  (typeof globalTimeFormatAgenda!='undefined' && globalTimeFormatAgenda!=null && globalTimeFormatAgenda!='') ? globalTimeFormatAgenda : null, locked:false},
	timeformatbasic: {value:  (typeof globalTimeFormatBasic!='undefined' && globalTimeFormatBasic!=null && globalTimeFormatBasic!='') ? globalTimeFormatBasic : null, locked:false},
	displayhiddenevents: {value:  (typeof globalDisplayHiddenEvents!='undefined' && globalDisplayHiddenEvents!=null) ? globalDisplayHiddenEvents : false, locked:false},
	timezonesupport: {value:  (typeof globalTimeZoneSupport!='undefined' && globalTimeZoneSupport!=null) ? globalTimeZoneSupport : true, locked:false},
	timezonesenabled: {value:  (typeof globalTimeZonesEnabled!='undefined' && globalTimeZonesEnabled!=null && globalTimeZonesEnabled!='') ? globalTimeZonesEnabled : [], locked:false},
	showhiddenalarms: {value:  (typeof globalShowHiddenAlarms!='undefined' && globalShowHiddenAlarms!=null) ? globalShowHiddenAlarms : false, locked:false},
	ignorecompletedorcancelledalarms: {value: (typeof globalIgnoreCompletedOrCancelledAlarms!='undefined' && globalIgnoreCompletedOrCancelledAlarms!=null) ? globalIgnoreCompletedOrCancelledAlarms : true, locked:false},
	weekenddays: {value: (typeof globalWeekendDays!='undefined' && globalWeekendDays!=null && globalWeekendDays!='') ? globalWeekendDays : [0, 6], locked:false},
	eventstartpastlimit: {value:  (typeof globalEventStartPastLimit!='undefined' && globalEventStartPastLimit!=null) ? globalEventStartPastLimit : 3, locked:false},
	todopastlimit: {value:  (typeof globalTodoPastLimit!='undefined' && globalTodoPastLimit!=null) ? globalTodoPastLimit : 3, locked:false},
	eventstartfuturelimit: {value:  (typeof globalEventStartFutureLimit!='undefined' && globalEventStartFutureLimit!=null) ? globalEventStartFutureLimit : 3, locked:false},
	compatibility: {value: (typeof globalCompatibility!='undefined' && globalCompatibility!=null && globalCompatibility!='') ? globalCompatibility : {anniversaryOutputFormat: ['apple']}, locked:false},
	contactstorefn: {value: (typeof globalContactStoreFN!='undefined' && globalContactStoreFN!=null && globalContactStoreFN!='') ? globalContactStoreFN : ['prefix',' last',' middle',' first',' suffix'], locked:false},
	urihandlertel: {value: (typeof globalUriHandlerTel!='undefined' && globalUriHandlerTel!=null && globalUriHandlerTel!='') ? globalUriHandlerTel : 'tel:', locked:false},
	urihandleremail: {value: (typeof globalUriHandlerEmail!='undefined' && globalUriHandlerEmail!=null && globalUriHandlerEmail!='') ? globalUriHandlerEmail : 'mailto:', locked:false},
	urihandlerurl: {value: (typeof globalUriHandlerUrl!='undefined' && globalUriHandlerUrl!=null && globalUriHandlerUrl!='') ? globalUriHandlerUrl : 'http://', locked:false},
	urihandlerprofile: {value: (typeof globalUriHandlerProfile!='undefined' && globalUriHandlerProfile!=null && globalUriHandlerProfile!='') ? globalUriHandlerProfile : {'twitter': 'http://twitter.com/%u', 'facebook': 'http://www.facebook.com/%u', 'flickr': 'http://www.flickr.com/photos/%u', 'linkedin': 'http://www.linkedin.com/in/%u', 'myspace': 'http://www.myspace.com/%u', 'sinaweibo': 'http://weibo.com/n/%u'}, locked:false},
	addresscountryequivalence: {value: (typeof globalAddressCountryEquivalence!='undefined' && globalAddressCountryEquivalence!=null && globalAddressCountryEquivalence!='') ? globalAddressCountryEquivalence : [{country: 'de', regex: '^\\W*Deutschland\\W*$'}, {country: 'sk', regex: '^\\W*Slovensko\\W*$'}], locked:false},
	addressbookselected: {value:  (typeof globalAddressbookSelected!='undefined' && globalAddressbookSelected!=null && globalAddressbookSelected!='') ? globalAddressbookSelected : '', locked:false},
	collectiondisplay: {value:  (typeof globalCollectionDisplay!='undefined' && globalCollectionDisplay!=null && globalCollectionDisplay!='') ? globalCollectionDisplay : (
		(typeof globalGroupContactsByCompanies!='undefined' && globalGroupContactsByCompanies) ?
		[{label: '{Name}', value: {company: ['{Company}', ' [{Department}]'], personal: ['{LastName}', ' {MiddleName}', ' {FirstName}']}}, {label: '{JobTitle}', value: ['{JobTitle}']}, {label: '{Email}', value: ['{Email[:0]}']}, {label: '{Phone} 1', value: ['{Phone[:0]}']}, {label: '{Phone} 2', value: ['{Phone[:1]}']}, {label: '{NoteText}', value: ['{NoteText}']}] :
		[{label: '{Name}', value: ['{LastName}', ' {MiddleName}', ' {FirstName}']}, {label: '{Company} [{Department}]', value: ['{Company}', ' [{Department}]']}, {label: '{JobTitle}', value: ['{JobTitle}']}, {label: '{Email}', value: ['{Email[:0]}']}, {label: '{Phone} 1', value: ['{Phone[:0]}']}, {label: '{Phone} 2', value: ['{Phone[:1]}']}, {label: '{NoteText}', value: ['{NoteText}']}]
		), locked:false},
	collectionsort: {value:  (typeof globalCollectionSort!='undefined' && globalCollectionSort!=null && globalCollectionSort!='') ? globalCollectionSort : '', locked:false},
	defaultaddresscountry: {value:  (typeof globalDefaultAddressCountry!='undefined' && globalDefaultAddressCountry!=null && globalDefaultAddressCountry!='') ? globalDefaultAddressCountry :'us', locked:false},
	addresscountryfavorites: {value:  (typeof globalAddressCountryFavorites!='undefined' && globalAddressCountryFavorites!=null && globalAddressCountryFavorites!='') ? globalAddressCountryFavorites :[], locked:false},
	activeaddressbookcollections: {value:  (typeof globalActiveAddressbookCollections!='undefined' && globalActiveAddressbookCollections!=null) ? globalActiveAddressbookCollections : new Array(), locked:false},
	loadedaddressbookcollections: {value:  (typeof globalLoadedAddressbookCollections!='undefined' && globalLoadedAddressbookCollections!=null) ? globalLoadedAddressbookCollections : new Array(), locked:false}
};


function resetSettings()
{
	globalSettings={
		version: {value: (typeof globalSettingsVersion!='undefined' && globalSettingsVersion!=null) ? globalSettingsVersion : 1, locked:false},
		resourcealphabetsorting: {value: (typeof globalResourceAlphabetSorting!='undefined' && globalResourceAlphabetSorting!=null) ? globalResourceAlphabetSorting : true, locked:false},
		usejqueryauth: {value:  (typeof globalUseJqueryAuth!='undefined' && globalUseJqueryAuth!=null) ? globalUseJqueryAuth : false, locked:false},
		settingstype: {value:  (typeof globalSettingsType!='undefined' && globalSettingsType!=null && globalSettingsType!='') ? globalSettingsType : 'principal-URL', locked:false},
		defaultactiveapp: {value:  (typeof globalDefaultActiveApp!='undefined' && globalDefaultActiveApp!=null && globalDefaultActiveApp!='') ? globalDefaultActiveApp : null, locked:false},
		islastdefaultactiveapp: {value:  false, locked:false},
		datepickerfirstdayofweek: {value:  (typeof globalDatepickerFirstDayOfWeek!='undefined' && globalDatepickerFirstDayOfWeek!=null) ? globalDatepickerFirstDayOfWeek : 1, locked:false},
		syncresourcesinterval: {value: (typeof globalSyncResourcesInterval!='undefined' && globalSyncResourcesInterval!=null) ? globalSyncResourcesInterval :300000, locked:false},
		datepickerformat: {value: (typeof globalDatepickerFormat!='undefined' && globalDatepickerFormat!=null && globalDatepickerFormat!='') ? globalDatepickerFormat : localization[globalInterfaceLanguage]._default_datepicker_format_, locked:false},
		backgroundsync: {value: (typeof globalBackgroundSync!='undefined' && globalBackgroundSync!=null) ? globalBackgroundSync : true, locked:false},
		enablekbnavigation: {value: (typeof globalEnableKbNavigation!='undefined' && globalEnableKbNavigation!=null) ? globalEnableKbNavigation : true, locked:false},
		rewritetimezonecomponent: {value:  (typeof globalRewriteTimezoneComponent!='undefined' && globalRewriteTimezoneComponent!=null) ? globalRewriteTimezoneComponent : true, locked:false},
		removeunknowntimezone: {value:  (typeof globalRemoveUnknownTimezone!='undefined' && globalRemoveUnknownTimezone!=null) ? globalRemoveUnknownTimezone : false, locked:false},
		mozillasupport: {value:  (typeof globalMozillaSupport!='undefined' && globalMozillaSupport!=null) ? globalMozillaSupport : false, locked:false},
		appleremindersmode: {value:  (typeof globalAppleRemindersMode!='undefined' && globalAppleRemindersMode!=null) ? globalAppleRemindersMode : false, locked:false},
		titleformatmonth: {value:  localization[globalInterfaceLanguage]._default_title_format_month_, locked:false},
		titleformatweek: {value:  localization[globalInterfaceLanguage]._default_title_format_week_, locked:false},
		titleformatday: {value:  localization[globalInterfaceLanguage]._default_title_format_day_, locked:false},
		titleformattable: {value:  localization[globalInterfaceLanguage]._default_title_format_table_, locked:false},
		columnformatagenda: {value:  localization[globalInterfaceLanguage]._default_column_format_agenda_, locked:false},
		activecalendarcollections: {value:  (typeof globalActiveCalendarCollections!='undefined' && globalActiveCalendarCollections!=null) ? globalActiveCalendarCollections : new Array(), locked:false},
		activetodocollections: {value:  (typeof globalActiveTodoCollections!='undefined' && globalActiveTodoCollections!=null) ? globalActiveTodoCollections : new Array(), locked:false},
		loadedcalendarcollections: {value:  (typeof globalLoadedCalendarCollections!='undefined' && globalLoadedCalendarCollections!=null) ? globalLoadedCalendarCollections : new Array(), locked:false},
		loadedtodocollections: {value:  (typeof globalLoadedTodoCollections!='undefined' && globalLoadedTodoCollections!=null) ? globalLoadedTodoCollections : new Array(), locked:false},
		todolistfilterselected: {value:  (typeof globalTodoListFilterSelected!='undefined' && globalTodoListFilterSelected!=null && globalTodoListFilterSelected!='') ? globalTodoListFilterSelected : ['filterAction', 'filterProgress'], locked:false},
		activeview: {value:  (typeof globalActiveView!='undefined' && globalActiveView!=null && globalActiveView!='') ? globalActiveView : 'multiWeek', locked:false},
		islastactiveview: {value:  true, lockedlocked:false},
		calendarselected: {value:  (typeof globalCalendarSelected!='undefined' && globalCalendarSelected!=null && globalCalendarSelected!='') ? globalCalendarSelected : '', locked:false},
		todocalendarselected: {value:  (typeof globalTodoCalendarSelected!='undefined' && globalTodoCalendarSelected!=null && globalTodoCalendarSelected!='') ? globalTodoCalendarSelected : '', locked:false},
		timezone: {value:  (typeof globalTimeZone!='undefined' && globalTimeZone!=null && globalTimeZone!='') ? globalTimeZone : 'local', locked:false},
		islasttimezone: {value: true, locked:false},
		openformmode: {value:  (typeof globalOpenFormMode!='undefined' && globalOpenFormMode!=null && globalOpenFormMode!='') ? globalOpenFormMode : 'double', locked:false},
		calendarstartofbusiness: {value:  (typeof globalCalendarStartOfBusiness!='undefined' && globalCalendarStartOfBusiness!=null) ? globalCalendarStartOfBusiness : 8, locked:false},
		calendarendofbusiness: {value:  (typeof globalCalendarEndOfBusiness!='undefined' && globalCalendarEndOfBusiness!=null) ? globalCalendarEndOfBusiness : 17, locked:false},
		defaulteventduration: {value:  (typeof globalDefaultEventDuration!='undefined' && globalDefaultEventDuration!=null && globalDefaultEventDuration>=0) ? globalDefaultEventDuration : null, locked:false},
		ampmformat: {value:  (typeof globalAMPMFormat!='undefined' && globalAMPMFormat!=null) ? globalAMPMFormat : localization[globalInterfaceLanguage]._default_AMPM_format_, locked:false},
		timeformatagenda: {value:  (typeof globalTimeFormatAgenda!='undefined' && globalTimeFormatAgenda!=null && globalTimeFormatAgenda!='') ? globalTimeFormatAgenda : null, locked:false},
		timeformatbasic: {value:  (typeof globalTimeFormatBasic!='undefined' && globalTimeFormatBasic!=null && globalTimeFormatBasic!='') ? globalTimeFormatBasic : null, locked:false},
		displayhiddenevents: {value:  (typeof globalDisplayHiddenEvents!='undefined' && globalDisplayHiddenEvents!=null) ? globalDisplayHiddenEvents : false, locked:false},
		timezonesupport: {value:  (typeof globalTimeZoneSupport!='undefined' && globalTimeZoneSupport!=null) ? globalTimeZoneSupport : true, locked:false},
		timezonesenabled: {value:  (typeof globalTimeZonesEnabled!='undefined' && globalTimeZonesEnabled!=null && globalTimeZonesEnabled!='') ? globalTimeZonesEnabled : [], locked:false},
		showhiddenalarms: {value:  (typeof globalShowHiddenAlarms!='undefined' && globalShowHiddenAlarms!=null) ? globalShowHiddenAlarms : false, locked:false},
		ignorecompletedorcancelledalarms: {value: (typeof globalIgnoreCompletedOrCancelledAlarms!='undefined' && globalIgnoreCompletedOrCancelledAlarms!=null) ? globalIgnoreCompletedOrCancelledAlarms : true, locked:false},
		weekenddays: {value: (typeof globalWeekendDays!='undefined' && globalWeekendDays!=null && globalWeekendDays!='') ? globalWeekendDays : [0, 6], locked:false},
		eventstartpastlimit: {value:  (typeof globalEventStartPastLimit!='undefined' && globalEventStartPastLimit!=null) ? globalEventStartPastLimit : 3, locked:false},
		todopastlimit: {value:  (typeof globalTodoPastLimit!='undefined' && globalTodoPastLimit!=null) ? globalTodoPastLimit : 3, locked:false},
		eventstartfuturelimit: {value:  (typeof globalEventStartFutureLimit!='undefined' && globalEventStartFutureLimit!=null) ? globalEventStartFutureLimit : 3, locked:false},
		compatibility: {value: (typeof globalCompatibility!='undefined' && globalCompatibility!=null && globalCompatibility!='') ? globalCompatibility : {anniversaryOutputFormat: ['apple']}, locked:false},
		contactstorefn: {value: (typeof globalContactStoreFN!='undefined' && globalContactStoreFN!=null && globalContactStoreFN!='') ? globalContactStoreFN : ['prefix',' last',' middle',' first',' suffix'], locked:false},
		urihandlertel: {value: (typeof globalUriHandlerTel!='undefined' && globalUriHandlerTel!=null && globalUriHandlerTel!='') ? globalUriHandlerTel : 'tel:', locked:false},
		urihandleremail: {value: (typeof globalUriHandlerEmail!='undefined' && globalUriHandlerEmail!=null && globalUriHandlerEmail!='') ? globalUriHandlerEmail : 'mailto:', locked:false},
		urihandlerurl: {value: (typeof globalUriHandlerUrl!='undefined' && globalUriHandlerUrl!=null && globalUriHandlerUrl!='') ? globalUriHandlerUrl : 'http://', locked:false},
		urihandlerprofile: {value: (typeof globalUriHandlerProfile!='undefined' && globalUriHandlerProfile!=null && globalUriHandlerProfile!='') ? globalUriHandlerProfile : {'twitter': 'http://twitter.com/%u', 'facebook': 'http://www.facebook.com/%u', 'flickr': 'http://www.flickr.com/photos/%u', 'linkedin': 'http://www.linkedin.com/in/%u', 'myspace': 'http://www.myspace.com/%u', 'sinaweibo': 'http://weibo.com/n/%u'}, locked:false},
		addresscountryequivalence: {value: (typeof globalAddressCountryEquivalence!='undefined' && globalAddressCountryEquivalence!=null && globalAddressCountryEquivalence!='') ? globalAddressCountryEquivalence : [{country: 'de', regex: '^\\W*Deutschland\\W*$'}, {country: 'sk', regex: '^\\W*Slovensko\\W*$'}], locked:false},
		addressbookselected: {value:  (typeof globalAddressbookSelected!='undefined' && globalAddressbookSelected!=null && globalAddressbookSelected!='') ? globalAddressbookSelected : '', locked:false},
		collectiondisplay: {value:  (typeof globalCollectionDisplay!='undefined' && globalCollectionDisplay!=null && globalCollectionDisplay!='') ? globalCollectionDisplay : (
			(typeof globalGroupContactsByCompanies!='undefined' && globalGroupContactsByCompanies) ?
			[{label: '{Name}', value: {company: ['{Company}', ' [{Department}]'], personal: ['{LastName}', ' {MiddleName}', ' {FirstName}']}}, {label: '{JobTitle}', value: ['{JobTitle}']}, {label: '{Email}', value: ['{Email[:0]}']}, {label: '{Phone} 1', value: ['{Phone[:0]}']}, {label: '{Phone} 2', value: ['{Phone[:1]}']}, {label: '{NoteText}', value: ['{NoteText}']}] :
			[{label: '{Name}', value: ['{LastName}', ' {MiddleName}', ' {FirstName}']}, {label: '{Company} [{Department}]', value: ['{Company}', ' [{Department}]']}, {label: '{JobTitle}', value: ['{JobTitle}']}, {label: '{Email}', value: ['{Email[:0]}']}, {label: '{Phone} 1', value: ['{Phone[:0]}']}, {label: '{Phone} 2', value: ['{Phone[:1]}']}, {label: '{NoteText}', value: ['{NoteText}']}]
		), locked:false},
		collectionsort: {value:  (typeof globalCollectionSort!='undefined' && globalCollectionSort!=null && globalCollectionSort!='') ? globalCollectionSort : '', locked:false},
		defaultaddresscountry: {value:  (typeof globalDefaultAddressCountry!='undefined' && globalDefaultAddressCountry!=null && globalDefaultAddressCountry!='') ? globalDefaultAddressCountry :'us', locked:false},
		addresscountryfavorites: {value:  (typeof globalAddressCountryFavorites!='undefined' && globalAddressCountryFavorites!=null && globalAddressCountryFavorites!='') ? globalAddressCountryFavorites :[], locked:false},
		activeaddressbookcollections: {value:  (typeof globalActiveAddressbookCollections!='undefined' && globalActiveAddressbookCollections!=null) ? globalActiveAddressbookCollections : new Array(), locked:false},
		loadedaddressbookcollections: {value:  (typeof globalLoadedAddressbookCollections!='undefined' && globalLoadedAddressbookCollections!=null) ? globalLoadedAddressbookCollections : new Array(), locked:false}
	};
}

function transformToServer(inSettings)
{
	var serverSettings={};

	for(var prop in inSettings)
	{
		serverSettings[prop]=inSettings[prop].value;
	}

	return serverSettings;
}
var globalWindowFocus=true;
var globalLoginUsername='';
var globalLoginPassword='';
var isUserLogged=false;
var isDelegationLoaded=false;
var globalActiveApp='';
var globalAvailableAppsArray=new Array();
var globalEnableAppSwitch=true;
var globalAppName='CalDavZAP';
var globalVersion='0.13.1';
var globalBuildNo=1442928599;
var globalXMLCache=null;
var globalVersionCheckURL=(location.protocol=='file:' ? 'http:' : location.protocol)+'//www.inf-it.com/versioncheck/'+globalAppName+'/?v='+globalVersion;
var globalXClientHeader=globalAppName+' '+globalVersion+' (Inf-IT CalDAV Web Client)';
var globalResourceNumberCount=0;
var globalResourceNumber=0;
var globalResourceIntervalID=null;
var globalFirstLoadNextApp=false;
var globalObjectLoading=false;
var settingsLoaded=false;
var globalKBNavigationPaddingRate=0.2;
var globalParallelAjaxCallCardDAVEnabled=true;
var globalParallelAjaxCallCalDAVEnabled=true;
var globalCacheUpdateInterval=null;
var isIntegrated=false;
var SVG_select='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="19px" height="19px" viewBox="0 0 19 19" overflow="visible" enable-background="new 0 0 19 19" xml:space="preserve"><defs></defs><rect x="2" fill="#585858" width="17" height="19"/><polygon fill="#FFFFFF" points="14,7 10.5,13 7,7 "/><rect fill="#FFFFFF" width="2" height="19"/></svg>';
var SVG_select_b='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="19px" height="19px" viewBox="0 0 19 19" overflow="visible" enable-background="new 0 0 19 19" xml:space="preserve"><defs></defs><rect x="2" fill="#585858" width="17" height="19"/><polygon fill="#FFFFFF" points="14,7 10.5,13 7,7 "/><rect fill="#F0F0F0" width="2" height="19"/></svg>';
var SVG_select_login='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="19px" height="28px" viewBox="0 0 19 28" overflow="visible" enable-background="new 0 0 19 28" xml:space="preserve"><defs></defs><rect fill="#FFFFFF" width="19" height="28"/></svg>';
var SVG_select_dis='<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="22px" height="19px" viewBox="0 0 22 19" overflow="visible" enable-background="new 0 0 22 19" xml:space="preserve"><defs></defs><rect fill="#FFFFFF" width="22" height="19"/></svg>';
var globalDefinedSettings = new Array();
var globalLoadedPrincipals = new Array();
var globalEnableAllResourceSync = true;
if(typeof isSettingsAvaible == 'undefined')
	var globalPreviousSupportedSettings = ['activecalendarcollections','activetodocollections', 'activeaddressbookcollections','todolistfilterselected','activeview','defaultactiveapp','calendarselected', 'todocalendarselected','addressbookselected','timezone', 'loadedtodocollections', 'loadedcalendarcollections', 'loadedaddressbookcollections', 'version'];
var globalSettingsSaving = '';
var globalFirstHideLoader = true;
var globalLoadedCollectionsNumber = 0;
var globalLoadedCollectionsCount = 0;
var ignoreServerSettings=false;
var globalPreventLogoutSync=false;
var globalEmailAddress='';
var globalSettingsVersion=3;
var globalSyncSettingsSave=false;

// Timepicker hack (prevent IE to re-open the datepicker on date click + focus)
var globalTmpTimePickerHackTime=new Object();

function isAvaible(app)
{
	return globalAvailableAppsArray.indexOf(app)!=-1
}

function loadAllResources()
{
	if(globalResourceIntervalID==null)
		netFindResource(globalAccountSettings[0], 0, true, 0);
}

function getAccount(accountUID)
{
	// find the original settings for the resource and user
	var tmp=accountUID.match(RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@([^/]+)(.*/)','i'));
	var resource_href=tmp[1]+tmp[3]+tmp[4];
	var resource_user=tmp[2];

	for(var i=0;i<globalAccountSettings.length;i++)
		if(globalAccountSettings[i].href==resource_href && globalAccountSettings[i].userAuth.userName==resource_user)
			resourceSettings=globalAccountSettings[i];
	return resourceSettings;
}

function checkForUnloadedResources()
{
	var rex=new RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@([^/]+)(.*/)', 'i');

	for(var i=globalLoadedPrincipals.length-1; i>=0;i--)
	{
		var resourceCounter = 0;
		if(isAvaible('CardDavMATE'))
			for(var j=0; j<globalResourceCardDAVList.collections.length;j++)
				if(globalResourceCardDAVList.collections[j].uid!=undefined&&globalResourceCardDAVList.collections[j].makeLoaded)
				{
					var tmp=globalResourceCardDAVList.collections[j].accountUID.match(rex);
					var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
					if(globalLoadedPrincipals[i]==resourceCalDAV_href)
						resourceCounter++;
				}

		if(isAvaible('CalDavZAP'))
		{
			for(var j=0; j<globalResourceCalDAVList.collections.length;j++)
				if(globalResourceCalDAVList.collections[j].uid!=undefined&&globalResourceCalDAVList.collections[j].makeLoaded)
				{
					var tmp=globalResourceCalDAVList.collections[j].accountUID.match(rex);
					var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
					if(globalLoadedPrincipals[i]==resourceCalDAV_href)
						resourceCounter++;
				}

			for(var j=0; j<globalResourceCalDAVList.TodoCollections.length;j++)
				if(globalResourceCalDAVList.TodoCollections[j].uid!=undefined&&globalResourceCalDAVList.TodoCollections[j].makeLoaded)
				{
					var tmp=globalResourceCalDAVList.TodoCollections[j].accountUID.match(rex);
					var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
					if(globalLoadedPrincipals[i]==resourceCalDAV_href)
						resourceCounter++;
				}
		}
		if(resourceCounter==0)
			globalLoadedPrincipals.splice(i,1);
	}
}

function reloadResources(dontSaveSettings, loadArray)
{
	if((isAvaible('CardDavMATE')&&(globalCardDAVInitLoad||globalCardDAVResourceSync)) || (isAvaible('CalDavZAP')&&(globalCalDAVInitLoad||globalCalDAVResourceSync))
	|| (isAvaible('Projects')&&!isProjectsLoaded) || (isAvaible('Settings')&&(!isSettingsLoaded || (globalSettingsSaving!=''&&!dontSaveSettings))) || (isAvaible('CalDavZAP')&&(globalLimitLoading!='' || globalLimitTodoLoading!='')))
		return false;
	if(globalWindowFocus==false)
		return false;
	globalCardDAVResourceSync=true;
	globalCalDAVResourceSync=true;
	if(isAvaible('CalDavZAP'))
	{
		globalCalDAVResourceSync = true;
		globalToday.setHours(0);
		globalToday.setMinutes(0);
		globalToday.setSeconds(0);
		globalToday.setMilliseconds(0);

		var currentToday=new Date();
		currentToday.setHours(0);
		currentToday.setMinutes(0);
		currentToday.setSeconds(0);
		currentToday.setMilliseconds(0);
		if(currentToday.getTime()!=globalToday.getTime())
		{
			if(isAvaible('CalDavZAP'))
				$('.date').datepicker('refresh');
			if(isAvaible('CardDavMATE'))
				$('#vCardEditor').find('input[data-type^="date_"]').datepicker('refresh');
			if(isAvaible('Projects'))
				$('.project_date').datepicker('refresh');
			$('#calendar').fullCalendar('updateToday');
			$('#calendar').fullCalendar('gotoDate', currentToday);
			$('#todoList').fullCalendar('gotoDate', currentToday);
			if(currentToday.getTime()>globalToday.getTime())
			{
				getNextMonths($('#calendar').fullCalendar('getView').end);
				getNextMonthsTodo();
			}
			else //support for timezone with backward time flow
			{
				getPrevMonths($('#calendar').fullCalendar('getView').start);
				getPrevMonthsTodo();
			}
			globalToday=currentToday;
		}
	}
	checkForUnloadedResources();
	if(!globalEnableAllResourceSync&&(typeof loadArray=='undefined' || loadArray==null))
		netFindResource(globalAccountSettings[0], 0, false, 0, globalLoadedPrincipals);
	else
		netFindResource(globalAccountSettings[0], 0, false, 0, loadArray);
}
function ifLoadCollections()
{
	if((isAvaible('CardDavMATE') && (globalCardDAVInitLoad || globalCardDAVResourceSync)) || (isAvaible('CalDavZAP') && (globalCalDAVInitLoad || globalCalDAVResourceSync)))
		return false;

	var changeCounter = 0;
	if(isAvaible('CardDavMATE'))
		for(var i=0; i<globalResourceCardDAVList.collections.length;i++)
			if(globalResourceCardDAVList.collections[i].uid!=undefined && globalResourceCardDAVList.collections[i].someChanged)
				changeCounter++;

	if(isAvaible('CalDavZAP'))
	{
		for(var i=0; i<globalResourceCalDAVList.collections.length;i++)
			if(globalResourceCalDAVList.collections[i].uid!=undefined && globalResourceCalDAVList.collections[i].someChanged)
				changeCounter++;

		for(var i=0; i<globalResourceCalDAVList.TodoCollections.length;i++)
			if(globalResourceCalDAVList.TodoCollections[i].uid!=undefined && globalResourceCalDAVList.TodoCollections[i].someChanged)
				changeCounter++;
	}

	if(changeCounter>0 || globalSettingsSaving!='')
		loadNextApplication(false);
}

function bindColorPickerClick(newElement)
{
	newElement.click(function(event){
		var collectionType=null;
		var resourceSelectedClass=null;
		var resourceItems=null;

		if(newElement.parent().hasClass('resourceCalDAV_item'))
		{
			if(globalEventCollectionsLoading)
				return false;
			collectionType='event';
			resourceSelectedClass='resourceCalDAV_item_selected';
			resourceItems=newElement.parent().siblings('.resourceCalDAV_item_selected');
		}
		else if(newElement.parent().hasClass('resourceCalDAVTODO_item'))
		{
			if(globalTodoCollectionsLoading)
				return false;
			collectionType='todo';
			resourceSelectedClass='resourceCalDAV_item_selected';
			resourceItems=newElement.parent().siblings('.resourceCalDAV_item_selected');
		}
		else if(newElement.hasClass('resourceCardDAVColor'))
		{
			if(globalAddressbookCollectionsLoading)
				return false;
			collectionType='addressbook';
			resourceSelectedClass='resourceCardDAV_selected';
			resourceItems=newElement.parent().parent().siblings().find('.resourceCardDAV_selected');
		}

		var showInput = event.shiftKey;
		var colorpicker=$(this).siblings('.colorPicker');

		if(!$(this).hasClass('hasColorpicker'))
		{
			$(this).addClass('hasColorpicker');
			colorpicker.spectrum({
				chooseText: localization[globalInterfaceLanguage].buttonSave,
				cancelText: localization[globalInterfaceLanguage].buttonCancel,
				color: newElement.css('background-color'),
				showInput: showInput,
				preferredFormat: 'hex6',
				move: function(color)
				{
					newElement.css('background', color);
				},
				hide: function(color)
				{
					if(newElement.css('background-color') != colorpicker.spectrum('get').toRgbString())
						newElement.css('background', colorpicker.spectrum('get').toRgbString());
				},
				change: function(color)
				{
					newElement.css('background', color);
					if(collectionType=='event')
					{
						var coll = globalResourceCalDAVList.getEventCollectionByUID($(this).parent().attr('data-id'));
						netSaveProperty(coll, (typeof globalCalendarColorPropertyXmlns!='undefined'&&globalCalendarColorPropertyXmlns!=null&&globalCalendarColorPropertyXmlns!='' ? globalCalendarColorPropertyXmlns : 'http://apple.com/ns/ical/'), 'calendar-color', color.toHexString())
					}
					else if(collectionType=='todo')
					{
						var coll = globalResourceCalDAVList.getTodoCollectionByUID($(this).parent().attr('data-id'));
						netSaveProperty(coll, (typeof globalCalendarColorPropertyXmlns!='undefined'&&globalCalendarColorPropertyXmlns!=null&&globalCalendarColorPropertyXmlns!='' ? globalCalendarColorPropertyXmlns : 'http://apple.com/ns/ical/'), 'calendar-color', color.toHexString())
					}
					else if(collectionType=='addressbook')
					{
						var coll = globalResourceCardDAVList.getCollectionByUID($(this).parent().attr('data-id'));
						netSaveProperty(coll, (typeof globalAddrColorPropertyXmlns!='undefined'&&globalAddrColorPropertyXmlns!=null&&globalAddrColorPropertyXmlns!='' ? globalAddrColorPropertyXmlns : 'http://inf-it.com/ns/ab/'),  'addressbook-color', color.toHexString())
					}
				}
			});
		}
		else if(showInput!=colorpicker.spectrum('option', 'showInput'))
			colorpicker.spectrum('option', 'showInput',showInput);

		var container = colorpicker.spectrum('container');
		if(container.is(':visible')) {
			colorpicker.spectrum('hide');
		}
		else {
			var offset=$(this).offset();
			colorpicker.spectrum('show');

			if(event.pageY<$(window).height()/2) {
				offset.top+=$(this).outerHeight();
				container.removeClass('sp-inverse');
			}
			else {
				offset.top-=container.outerHeight();
				container.addClass('sp-inverse');
			}
			container.offset(offset);
		}

		resourceItems.removeClass(resourceSelectedClass);
		newElement.parent().addClass(resourceSelectedClass);

		return false;
	});
}

function loadNextApplication(forceLoad)
{
	if(!globalFirstLoadNextApp)
	{
		if(isAvaible('CardDavMATE'))
			setAddressbookNumber();
		if(isAvaible('CalDavZAP'))
			setCalendarNumber(true);
		globalFirstLoadNextApp=true;
	}
	if(isAvaible('CardDavMATE') && !globalCardDAVCollectionSync && globalResourceCardDAVList.collections.length>0)
	{
		globalCardDAVCollectionSync=true;
		CardDAVnetLoadCollection(globalResourceCardDAVList.collections[0], forceLoad, false, null, 0, globalResourceCardDAVList.collections,true);
	}
	else if(isAvaible('CalDavZAP') && !globalCalDAVCollectionSync && globalResourceCalDAVList.collections.length>0)
	{
		globalCalDAVCollectionSync=true;
		CalDAVnetLoadCollection(globalResourceCalDAVList.collections[0], forceLoad, true, 0, globalResourceCalDAVList.collections);
	}
	else if(isAvaible('Projects') && !globalProjectSync && !isProjectsLoaded && getLoggedUser()!=null)
	{
		$('#MainLoaderInner').html('Loading projects');
		globalProjectSync=true;
		if(typeof globalCRMSettings != 'undefined')
			netLoadXSLT(globalCRMSettings.XSLTHref);
		else
		{
			console.log("Error: globalCRMSettings is not defined");
			loadNextApplication(false);
		}
	}
	else if(isAvaible('Reports') && !globalReportsSync && !isReportsLoaded && getLoggedUser()!=null)
	{
		$('#MainLoaderInner').html('Loading Reports');
		globalReportsSync=true;
		if(typeof globalCRMSettings != 'undefined')
			netLoadReportList(globalCRMSettings);
		else
		{
			console.log("Error: globalCRMSettings is not defined");
			loadNextApplication(false);
		}
	}
	else if(isAvaible('Settings') && !globalSettingsSync && !isSettingsLoaded && getLoggedUser()!=null)
	{
		globalSettingsSync = true;
		if(!isSettingsLoaded)
			loadNextApplication(false);
		if($('#ResourceSettingsList').children('.resourceSettings_item').length)
			$('#ResourceSettingsList').children().eq(0).trigger('click');
	}
	else
	{
		if((isAvaible('CalDavZAP') && !isCalDAVLoaded) || (isAvaible('CardDavMATE') && !isCardDAVLoaded))
			$('#MainLoader').fadeOut(1200, function(){$('#MainLoader').css('left','50px');});
		if(isAvaible('CardDavMATE'))
		{
			globalCardDAVCollectionSync=false;
			if(!isCardDAVLoaded)
				isCardDAVLoaded=true;
		}
		if(isAvaible('CalDavZAP'))
		{
			globalCalDAVCollectionSync=false;
			if(!isCalDAVLoaded)
				isCalDAVLoaded=true;
		}
		if(isAvaible('Projects'))
		{
			globalProjectSync=false;
			isProjectsLoaded = true;
		}
		if(isAvaible('Reports'))
		{
			globalReportsSync=false;
			isReportsLoaded = true;
		}
		if(isAvaible('Settings'))
		{
			globalSettingsSync=false;
			isSettingsLoaded = true;
		}
	}
}

function checkForApplication(inputApp)
{
	if(!globalEnableAppSwitch || globalObjectLoading)
		return false;

	globalEnableAppSwitch=false;
	globalActiveApp=inputApp;

	var inputID = 'System'+inputApp;
	$('.System').not('#'+inputID).each(function(){
		$(this).animate({opacity : 0}, 666, function(){
			/* XXX - System display:none changes
			if($(this).attr('id').indexOf('CalDav')==-1)
				$(this).css('display','none');
			else*/
				$(this).css('visibility','hidden');
		});
	});

	/* XXX - System display:none changes
	if(inputID.indexOf('CalDav')==-1)
		$('#'+inputID).css('display','block').animate({opacity : 1}, 666, function(){globalEnableAppSwitch=true;});
	else*/
		$('#'+inputID).css('visibility','visible').animate({opacity : 1}, 666, function(){globalEnableAppSwitch=true;});
}

function getLoggedUser()
{
	for(var i=0; i<globalAccountSettings.length;i++)
		if(globalAccountSettings[i].href.indexOf(globalLoginUsername)!=-1)
			return globalAccountSettings[i];
	return globalAccountSettings[0];
}

function login()
{
	$('#LoginLoader').fadeTo(1200, 1, function(){
		globalLoginUsername=$('#LoginPage').find('[data-type="system_username"]').val();
		globalLoginPassword=$('#LoginPage').find('[data-type="system_password"]').val();
		loadConfig();
	});
}

function logout(forceLogout)
{
	if((typeof forceLogout=='undefined' || forceLogout==null ) && (
		(isAvaible('CardDavMATE') && (!isCardDAVLoaded || globalCardDAVResourceSync)) ||
		(isAvaible('CalDavZAP') && (!isCalDAVLoaded || globalCalDAVResourceSync)) ||
		(isAvaible('Projects') && !isProjectsLoaded) ||
		(isAvaible('Settings') && (!isSettingsLoaded || (globalSettingsSaving!='' && !dontSaveSettings))) ||
		(isAvaible('CalDavZAP') && (globalLimitLoading!='' || globalLimitTodoLoading!=''))
	))
	{
		globalPreventLogoutSync=true;
		return false;
	}
	clearInterval(globalResourceIntervalID);
	if(globalFirstLoadNextApp)
		globalFirstLoadNextApp=false;
	settingsLoaded=false;
	ignoreServerSettings=false;
	//save settings
	checkBeforeClose(false);
	globalResourceIntervalID=null;
	globalLoginUsername='';
	globalLoginPassword='';
	globalXMLCache=null;
	globalResourceNumber=0;
	globalResourceNumberCount=0;
	globalLoadedPrincipals=new Array();
	globalEmailAddress='';
	globalPreventLogoutSync=false;
	globalSyncSettingsSave=false;

	$(document.documentElement).unbind();
	// reset page title
	var tmpMatch = document.title.match('^(.*) \\[.*\\]$');
	if(tmpMatch!=null)
		document.title = tmpMatch[1];

	$('#LoginPage').fadeTo(2000, 1, function(){
		if(typeof isCalDAVLoaded!='undefined' && isCalDAVLoaded)
		{
			logoutCalDAV();
			isCalDAVLoaded=false;
		}

		if(typeof isCardDAVLoaded!='undefined' && isCardDAVLoaded)
		{
			logoutCardDAV();
			isCardDAVLoaded=false;
		}
		if(typeof isProjectsLoaded!='undefined' && isProjectsLoaded)
		{
			logoutProjects();
			isProjectsLoaded = false;
		}
		if(typeof isReportsLoaded!='undefined' && isReportsLoaded)
		{
			logoutReports();
			isReportsLoaded = false;
		}
		if(typeof isSettingsLoaded!='undefined' && isSettingsLoaded)
		{
			logoutSettings();
			isSettingsLoaded = false;
		}

		for(var i=globalAccountSettings.length-1;i>=0;i--)
			if(globalAccountSettings[i].type=='network')
				globalAccountSettings.splice(i, 1);

		if(typeof globalDemoMode=='undefined')
		{
			$('[data-type="system_username"]').val('').change();
			$('[data-type="system_password"]').val('').change();
		}

		$('.integration_d').hide();

		isUserLogged=false;

		if(globalSettings.defaultactiveapp.value==null)
		{
			if(isAvaible('CalDavZAP'))
				globalActiveApp='CalDavZAP';
			else if(isAvaible('CardDavMATE'))
				globalActiveApp='CardDavMATE';
		}
		else
			globalActiveApp=globalSettings.defaultactiveapp.value;

		resetSettings();
		if(isAvaible('CardDavMATE'))
			mainCardDAV();
		if(isAvaible('CalDavZAP'))
			mainCalDAV();
		if(isAvaible('Settings'))
			mainSettings();
		if(isAvaible('Projects'))
			mainProjects();
		if(isAvaible('Reports'))
			mainReports();
		init();
	});
}

function init()
{
	// browser check
	if(($.browser.msie && parseInt($.browser.version, 10)<9) || $.browser.opera)
		$('#login_message').css('display','').text(localization[globalInterfaceLanguage].unsupportedBrowser);

	if(typeof globalDemoMode!='undefined')
	{
		if(typeof globalDemoMode.userName!=undefined)
			$('[data-type="system_username"]').val(globalDemoMode.userName).change();
		if(typeof globalDemoMode.userPassword!=undefined)
			$('[data-type="system_password"]').val(globalDemoMode.userPassword).change();
	}

	loadConfig();
}

function run()
{
	isUserLogged=true;
	window.onfocus=function(){globalWindowFocus=true;}
	window.onblur=function(){if(globalSettings.backgroundsync.value==false) globalWindowFocus=false;}
	$('#LoginPage').fadeOut(2000);

	if(typeof globalAccountSettings=='undefined')
	{
		console.log('Error: \'no account configured\': see config.js!');
		return false;
	}

	if(typeof globalNewVersionNotifyUsers=='undefined' || globalNewVersionNotifyUsers!=null)
		netVersionCheck();

	document.title+=' ['+globalAccountSettings[0].userAuth.userName+']';
	// Automatically detect crossDomain settings
	var detectedHref=location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '');
	for(var i=0;i<globalAccountSettings.length;i++)
	{
		if(globalAccountSettings[i].crossDomain==undefined || typeof globalAccountSettings[i].crossDomain!='boolean')
		{
			if(globalAccountSettings[i].href.indexOf(detectedHref)==0)
				globalAccountSettings[i].crossDomain=false;
			else
				globalAccountSettings[i].crossDomain=true;

			console.log("Info: [userAccount: '"+globalAccountSettings[i].href.replace('\/\/', '//'+globalAccountSettings[i].userAuth.userName+'@')+"']: crossDomain set to: '"+(globalAccountSettings[i].crossDomain==true ? 'true' : 'false')+"'");
		}
	}

	if(typeof globalAvailableAppsArray!='undefined' && globalAvailableAppsArray!=null && globalAvailableAppsArray.length>1) {
		// show integration banner
			$('.integration_d').css('display', 'none');
		// $('.integration_d').css('display', 'block'); => tracim v1

		// show app buttons for available apps only
		if(globalAvailableAppsArray.indexOf('CalDavZAP')!=-1)
			$('#intCaldav').attr('title',localization[globalInterfaceLanguage].txtCalendars).css('display', 'block').find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);
		if(globalAvailableAppsArray.indexOf('CalDavTODO')!=-1)
			$('#intCaldavTodo').attr('title',localization[globalInterfaceLanguage].txtTodos).css('display', 'block').find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);
		if(globalAvailableAppsArray.indexOf('CardDavMATE')!=-1)
			$('#intCarddav').attr('title',localization[globalInterfaceLanguage].txtContacts).css('display', 'block').find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);
		if(globalAvailableAppsArray.indexOf('Projects')!=-1)
			$('#intProjects').attr('title',localization[globalInterfaceLanguage].txtProjects).css('display', 'block').find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);
		if(globalAvailableAppsArray.indexOf('Reports')!=-1)
			$('#intReports').attr('title',localization[globalInterfaceLanguage].txtReports).css('display', 'block').find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);
		if(globalAvailableAppsArray.indexOf('Settings')!=-1)
			$('#intSettings').attr('title',localization[globalInterfaceLanguage].txtSettings).css('display', 'block').find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);

		// show the refresh button
		if(typeof globalEnableRefresh==='boolean' && globalEnableRefresh && (globalAvailableAppsArray.indexOf('CalDavZAP')!=-1 || globalAvailableAppsArray.indexOf('CalDavTODO')!=-1 || globalAvailableAppsArray.indexOf('CardDavMATE')!=-1)) {
			$('#intRefresh').attr('title',localization[globalInterfaceLanguage].txtRefresh).find('.int_error').attr('alt',localization[globalInterfaceLanguage].txtError);
			$('#intRefresh').prev().addBack().css('display', 'block');
		}
	}

	$('#cacheDialogText').text(localization[globalInterfaceLanguage].txtCacheText);
	$('#cacheDialogButton').attr('value',localization[globalInterfaceLanguage].txtCacheButton);
}

function loadConfig()
{
	if(isUserLogged)// !!!!!! kedy moze toto nastat? nexapem ...
		return false;

	var configLoaded=true;
	// Automatically detect crossDomain settings
	var detectedHref=location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '');

	// check username and password against the server and create config from globalNetworkCheckSettings
	if(typeof globalNetworkCheckSettings!='undefined' && globalNetworkCheckSettings!=null)
	{
		if(globalLoginUsername=='' || globalLoginPassword=='')
		{
			$('#LoginPage').fadeTo(500, 1, function(){if(typeof globalDemoMode=='undefined') $('[data-type="system_username"]').focus()});
			$('#LoginLoader').fadeOut(1200);
			return false;
		}
		else
		{
			if(globalNetworkCheckSettings.crossDomain==undefined || typeof globalNetworkCheckSettings.crossDomain!='boolean')
			{
				if(globalNetworkCheckSettings.href.indexOf(detectedHref)==0)
					globalNetworkCheckSettings.crossDomain=false;
				else
					globalNetworkCheckSettings.crossDomain=true;

				console.log("Info: [globalNetworkCheckSettings: '"+globalNetworkCheckSettings.href+"']: crossDomain set to: '"+(globalNetworkCheckSettings.crossDomain==true ? 'true' : 'false')+"'");
			}

// !!!! preco sa riesi s logout buttonom prave tu?
			// show the logout button
			if(typeof globalAvailableAppsArray!='undefined' && globalAvailableAppsArray!=null && globalAvailableAppsArray.length>1) {
				$('#intLogout').prev().addBack().css('display', 'block');
				$('#intLogout').attr('title',localization[globalInterfaceLanguage].altLogout);
			}
			else {
				$('#Logout').css('display', 'block');
			}

			netCheckAndCreateConfiguration(globalNetworkCheckSettings);
			return true;
		}
	}

	// load the configuration XML(s) from the network
	if(typeof globalNetworkAccountSettings!='undefined' && globalNetworkAccountSettings!=null)
	{
		if(globalLoginUsername=='' || globalLoginPassword=='')
		{
			$('#LoginPage').fadeTo(500, 1, function(){if(typeof globalDemoMode=='undefined') $('[data-type="system_username"]').focus()});
			$('#LoginLoader').fadeOut(1200);
			return false;
		}
		else
		{
			if(globalNetworkAccountSettings.crossDomain==undefined || typeof globalNetworkAccountSettings.crossDomain!='boolean')
			{
				if(globalNetworkAccountSettings.href.indexOf(detectedHref)==0)
					globalNetworkAccountSettings.crossDomain=false;
				else
					globalNetworkAccountSettings.crossDomain=true;

				console.log("Info: [globalNetworkAccountSettings: '"+globalNetworkAccountSettings.href+"']: crossDomain set to: '"+(globalNetworkAccountSettings.crossDomain==true ? 'true' : 'false')+"'");
			}
// !!!! preco sa riesi s logout buttonom prave tu?
			// show the logout button
			if(typeof globalAvailableAppsArray!='undefined' && globalAvailableAppsArray!=null && globalAvailableAppsArray.length>1) {
				$('#intLogout').prev().addBack().css('display', 'block');
				$('#intLogout').attr('title',localization[globalInterfaceLanguage].altLogout);
			}
			else {
				$('#Logout').css('display', 'block');
			}

			netLoadConfiguration(globalNetworkAccountSettings);
			return true;
		}
	}

	if((typeof globalNetworkAccountSettings=='undefined' || globalNetworkAccountSettings==null) && (typeof globalNetworkCheckSettings=='undefined' || globalNetworkCheckSettings==null) && (typeof globalAccountSettings!='undefined' && globalAccountSettings!=null) && globalAccountSettings.length>0)
	{
		var delegCount=0, delegIndex=0;
		if(!isDelegationLoaded)
		{
			for(var i=0; i<globalAccountSettings.length; i++)
				if((typeof globalAccountSettings[i].delegation=='boolean' && globalAccountSettings[i].delegation) || (globalAccountSettings[i].delegation instanceof Array && globalAccountSettings[i].delegation.length>0))
					delegIndex=i;
			for(var i=0; i<globalAccountSettings.length; i++)
				if((typeof globalAccountSettings[i].delegation=='boolean' && globalAccountSettings[i].delegation) || (globalAccountSettings[i].delegation instanceof Array && globalAccountSettings[i].delegation.length>0))
				{
					delegCount++;
					DAVresourceDelegation(globalAccountSettings[i], i, delegIndex);
				}
			if(delegCount>0)
				isDelegationLoaded = true;
		}
		if(delegCount==0 && !isDelegationLoaded)
		{
			// start the client
			if(isAvaible('CardDavMATE'))
				runCardDAV();
			if(isAvaible('CalDavZAP'))
				runCalDAV();
			if(isAvaible('Projects'))
				runProjects();
			if(isAvaible('Settings'))
				runSettings();

			globalResourceNumber=globalAccountSettings.length;
			loadAllResources();
		}
	}
}

function globalMain()
{
	for(var prop in globalSettings)
		globalDefinedSettings.push(prop);

	if(typeof globalEnabledApps=='undefined' || globalEnabledApps==null)
	{
		if(typeof isCalDAVAvaible!='undefined' && isCalDAVAvaible!=null && isCalDAVAvaible)
		{
			globalAvailableAppsArray[globalAvailableAppsArray.length]='CalDavZAP';
			globalAvailableAppsArray[globalAvailableAppsArray.length]='CalDavTODO';
		}
		if(typeof isCardDAVAvaible!='undefined' && isCardDAVAvaible!=null && isCardDAVAvaible)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='CardDavMATE';
		if(typeof isSettingsAvaible!='undefined' && isSettingsAvaible!=null && isSettingsAvaible)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='Settings';
		if(typeof isProjectsAvaible!='undefined' && isProjectsAvaible!=null && isProjectsAvaible)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='Projects';
		if(typeof isReportsAvaible!='undefined' && isReportsAvaible!=null && isReportsAvaible)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='Reports';
	}
	else
	{
		if(typeof isCalDAVAvaible!='undefined' && isCalDAVAvaible!=null && isCalDAVAvaible && (globalEnabledApps.indexOf('CalDavZAP')!=-1 || globalEnabledApps.indexOf('CalDavTODO')!=-1 ))
		{
			globalAvailableAppsArray[globalAvailableAppsArray.length]='CalDavZAP';
			globalAvailableAppsArray[globalAvailableAppsArray.length]='CalDavTODO';
		}
		if(typeof isCardDAVAvaible!='undefined' && isCardDAVAvaible!=null && isCardDAVAvaible && globalEnabledApps.indexOf('CardDavMATE')!=-1)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='CardDavMATE';
		if(typeof isSettingsAvaible!='undefined' && isSettingsAvaible!=null && isSettingsAvaible && globalEnabledApps.indexOf('Settings')!=-1)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='Settings';
		if(typeof isProjectsAvaible!='undefined' && isProjectsAvaible!=null && isProjectsAvaible && globalEnabledApps.indexOf('Projects')!=-1)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='Projects';
		if(typeof isReportsAvaible!='undefined' && isReportsAvaible!=null && isReportsAvaible)
			globalAvailableAppsArray[globalAvailableAppsArray.length]='Reports';
	}

	if(globalAvailableAppsArray.length>1)
		isIntegrated=true;

	if(globalSettings.defaultactiveapp.value==null)
	{
		if(isAvaible('CardDavMATE'))
			globalActiveApp='CardDavMATE';
		else if(isAvaible('CalDavZAP'))
			globalActiveApp='CalDavZAP';
	}
	else
		globalActiveApp=globalSettings.defaultactiveapp.value;

	if(isAvaible('CardDavMATE'))
	{
		// Modify available inputs before making additional changes to vCard form
		if(typeof globalDisabledContactAttributes!='undefined' && globalDisabledContactAttributes instanceof Array)
			for(var i=0;i<globalDisabledContactAttributes.length;i++)
				$('#vCardTemplate').find('[data-attr-name="'+jqueryEscapeSelector(globalDisabledContactAttributes[i])+'"]').remove();

		// hook for vCard template extension
		if(typeof(globalContactsExtInitMain)=='function')
			globalContactsExtInitMain($('#vCardTemplate'));
	}

	/*************************** BAD HACKS SECTION ***************************/
	// here we fix the cross OS/cross broser problems (unfixable in pure CSS)
	if($.browser.webkit && !!window.chrome)	/* Chrome */
	{
		if(navigator.platform.toLowerCase().indexOf('win')==0)	/* Windows version */
		{
			$('#LoginPage, #vCardTemplate, #event_details_template, #todo_details_template, #EditorBoxSettings').find('input').css('text-indent', '2px');
			$('#LoginPage, #vCardTemplate, #event_details_template, #todo_details_template, #EditorBoxSettings').find('select').css({'padding-left': '0px', 'padding-right': '13px'});
		}
		else	/* non-Windows version */
			$('#LoginPage, #vCardTemplate, #event_details_template, #todo_details_template, #EditorBoxSettings').find('input').css('text-indent', '1px');
	}
	else if($.browser.safari)
	{
		$('#LoginPage, #vCardTemplate, #event_details_template, #todo_details_template, #EditorBoxSettings').find('textarea').addClass('safari_hack');
		$('#LoginPage, #vCardTemplate, #event_details_template, #todo_details_template, #EditorBoxSettings').find('input').addClass('safari_hack');
	}
	else if($.browser.msie)	/* IE */
	{
		if(parseInt($.browser.version, 10)==10)	/* IE 10 (because there are no more conditional comments) */
		{
			$('select').css({'padding-top': '1px', 'padding-left': '0px', 'padding-right': '0px'});
			$('textarea').css('padding-top', '3px');
			$('input[type=button]').css('padding-top', '2px');
		}

		// ADD SVG to login screen
		var newSVG=$(SVG_select_login).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#Login').find('select[data-type="language"]').after($($('<div>').append($(newSVG).clone()).html()));
	}
	else if($.browser.mozilla)
	{
		// ADD SVG to login screen
		var newSVG=$(SVG_select_login).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#Login').find('select[data-type="language"]').after($($('<div>').append($(newSVG).clone()).html()));
	}
	/*************************** END OF BAD HACKS SECTION ***************************/

	/* language selector */
	var lang_num=0;
	var language_option=$('#Login').find('[data-type="language"]').find('option');
	$('#Login').find('[data-type="language"]').html('');

	if(typeof globalInterfaceCustomLanguages!='undefined' && globalInterfaceCustomLanguages.length!=undefined && globalInterfaceCustomLanguages.length>0)
	{
		for(var i=0; i<globalInterfaceCustomLanguages.length; i++)
			if(localization[globalInterfaceCustomLanguages[i]]!=undefined)
			{
				var tmp=language_option;
				tmp.attr('data-type',globalInterfaceCustomLanguages[i]);
				tmp.text(localization[globalInterfaceCustomLanguages[i]]['_name_']);
				$('#Login').find('[data-type="language"]').append(tmp.clone());
				lang_num++;
			}
	}

	if(lang_num==0)	// no language option, use the default (all languages from localization.js)
		for(var loc in localization)
		{
			var tmp=language_option;
			tmp.attr('data-type',loc);
			tmp.text(localization[loc]['_name_']);	// translation
			$('#Login').find('[data-type="language"]').append(tmp.clone());
		}

	// select the globalInterfaceLanguage in the interface
	$('[data-type="language"]').find('[data-type='+globalInterfaceLanguage+']').prop('selected',true);

	// set login screen logo
	if(isAvaible('CalDavZAP') && !isAvaible('CardDavMATE'))
	{
		$('[data-size="login_logo"]').find('img').attr('src', "images/cdz_logo.svg");
		$('#LoginPage').find('.footer').text('CalDavZAP - the open source CalDAV web client');
	}
	else if(isAvaible('CardDavMATE') && !isAvaible('CalDavZAP'))
	{
		$('[data-size="login_logo"]').find('img').attr('src', "carddavmate/images/cdm_logo.svg");
		$('#LoginPage').find('.footer').text('CardDavMATE - the open source CardDAV web client');
	}
	else
	{
		$('#Login').css('margin-top', '41px');
		$('[data-size="login_logo"]').find('img').attr('src', "images/infcloud_logo.svg");
		$('#LoginPage').find('.footer').text('InfCloud - the open source CalDAV/CardDAV web client');
	}
	$('#LoginPage').find('.footer').attr('title', globalVersion);

	if(isAvaible('CardDavMATE'))
		globalMainCardDAV();
	if(isAvaible('CalDavZAP'))
		globalMainCalDAV();
	if(isAvaible('Projects'))
		globalMainProjects();
	if(isAvaible('Reports'))
		globalMainReports();
	if(isAvaible('Settings'))
		globalMainSettings();

	if(isAvaible('CardDavMATE'))
		mainCardDAV();
	if(isAvaible('CalDavZAP'))
		mainCalDAV();
	if(isAvaible('Projects'))
		mainProjects();
	if(isAvaible('Reports'))
		mainReports();
	if(isAvaible('Settings'))
		mainSettings();

	init();
}

function saveSettings(isFormSave)
{

	if(globalSettings.islastdefaultactiveapp.value)
		globalSettings.defaultactiveapp.value=globalActiveApp;

	globalSettings.version.value=globalSettingsVersion;

	var rex = new RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)');
	if(isAvaible('CalDavZAP'))
	{
		globalSettings.activecalendarcollections.value.splice(0, globalSettings.activecalendarcollections.value.length);
		globalSettings.activetodocollections.value.splice(0, globalSettings.activetodocollections.value.length);
		globalSettings.todolistfilterselected.value.splice(0, globalSettings.todolistfilterselected.value.length);

		for(var i=0;i<globalVisibleCalDAVCollections.length;i++)
		{
			var uidParts=globalVisibleCalDAVCollections[i].match(rex)
			globalSettings.activecalendarcollections.value.splice(globalSettings.activecalendarcollections.value.length , 0, uidParts[1]+uidParts[3]);
		}

		for(var i=0;i<globalVisibleCalDAVTODOCollections.length;i++)
		{
			var uidParts=globalVisibleCalDAVTODOCollections[i].match(rex);
			globalSettings.activetodocollections.value.splice(globalSettings.activetodocollections.value.length , 0, uidParts[1]+uidParts[3]);
		}
		if(globalSettings.islastactiveview.value)
		{
			var view= $('#calendar').fullCalendar('getView');
			globalSettings.activeview.value=view.name;
		}

		if(globalSettings.islasttimezone.value)
			globalSettings.timezone.value=globalSessionTimeZone;

		var uidSelected=$('#ResourceCalDAVList').find('.resourceCalDAV_item_selected').attr('data-id');
		if(uidSelected!=undefined && uidSelected!='')
		{
			var par=uidSelected.split('/');
			globalSettings.calendarselected.value=par[par.length-3]+'/'+par[par.length-2]+'/';
		}

		uidSelected=$('#ResourceCalDAVTODOList').find('.resourceCalDAV_item_selected').attr('data-id');
		if(uidSelected!=undefined && uidSelected!='')
		{
			var par=uidSelected.split('/');
			globalSettings.todocalendarselected.value=par[par.length-3]+'/'+par[par.length-2]+'/';
		}

		var filterArray = $('.fc-filter-option-selected');
		for(var i=0; i<filterArray.length; i++)
			globalSettings.todolistfilterselected.value.splice(globalSettings.todolistfilterselected.value.length,0,$($('.fc-filter-option-selected')[i]).attr('data-type'));
	}

	if(isAvaible('CardDavMATE'))
	{
		globalSettings.activeaddressbookcollections.value.splice(0, globalSettings.activeaddressbookcollections.value.length);
		var visAddrs = dataGetChecked('#ResourceCardDAVList');
		for(var i=0;i<visAddrs.length;i++)
		{
			if(visAddrs[i]!='undefined')
			{
				var uidPart=visAddrs[i].match(RegExp('^(https?://)(.*)', 'i'))[1];
				var uidPart2= visAddrs[i].match(RegExp('^(https?://)(.*)', 'i'))[2].split('@')[2];
				globalSettings.activeaddressbookcollections.value.splice(globalSettings.activeaddressbookcollections.value.length , 0, uidPart+uidPart2);
			}
		}

		if($('#ResourceCardDAVList').find('.group.resourceCardDAV_selected').length>0)
			var uidASelected=$('#ResourceCardDAVList').find('.group.resourceCardDAV_selected').attr('data-id');
		else if($('#ResourceCardDAVList').find('.resourceCardDAV_selected').length>0)
			var uidASelected=$('#ResourceCardDAVList').find('.resourceCardDAV_selected').attr('data-id');
		else
			var uidASelected='';
		if(uidASelected!=undefined && uidASelected!='')
			globalSettings.addressbookselected.value=uidASelected;
	}
	if(isAvaible('Settings') && isFormSave)
		return applyFormSettings();
	else
		return globalSettings;
}

function loadXMLSetings(settingsXML)
{
	$(settingsXML).children().each(
	function(ind,elm)
	{
		var type = $(elm).attr('type');
		var locked = typeof $(elm).attr('locked')!='undefined'&&$(elm).attr('locked')!=null&&$(elm).attr('locked')=='true' ? true : false;
		if(typeof globalSettings[$(elm).prop('tagName').toLowerCase()] == 'undefined')
			return true;
		if(locked)
			globalSettings[$(elm).prop('tagName').toLowerCase()].locked=true;

		if($(elm).children().length>0)
		{
			globalSettings[$(elm).prop('tagName').toLowerCase()].value = new Array();
			$(elm).children().each(function(pind,pelm)
			{
				if($(elm).prop('tagName').toLowerCase() == 'urihandlerprofile')
				{
					globalSettings[$(elm).prop('tagName').toLowerCase()].value = {};
					globalSettings[$(elm).prop('tagName').toLowerCase()].value[$(pelm).text().toLowerCase()] = $(pelm).attr('url');
				}
				else if($(elm).prop('tagName').toLowerCase() == 'addresscountryequivalence')
				{
					var eqObject = {};
					eqObject['country'] = $(pelm).attr('name');
					eqObject['regex'] = $(pelm).attr('regex');
					globalSettings[$(elm).prop('tagName').toLowerCase()].value.push(eqObject);
				}
				else if($(elm).prop('tagName').toLowerCase() == 'compatibility')
				{
					globalSettings[$(elm).prop('tagName').toLowerCase()].value = {};
					globalSettings[$(elm).prop('tagName').toLowerCase()].value[$(pelm).attr('name')] = new Array();
					$(pelm).children().each(function(rind,relm)
					{
						globalSettings[$(elm).prop('tagName').toLowerCase()].value[$(pelm).attr('name')].push($(relm).text());
					});
				}
				else if($(pelm).text()!='')
				{
					switch(type)
					{
						case 'integer':
							globalSettings[$(elm).prop('tagName').toLowerCase()].value.push(parseInt($(pelm).text(),10));
							break;
						case 'string':
							if($(pelm).text()!='null')
								globalSettings[$(elm).prop('tagName').toLowerCase()].value.push($(pelm).text());
							else
								globalSettings[$(elm).prop('tagName').toLowerCase()].value.push(null);
							break;
						case 'boolean':
							if($(pelm).text() == 'true')
								globalSettings[$(elm).prop('tagName').toLowerCase()].value.push(true);
							else
								globalSettings[$(elm).prop('tagName').toLowerCase()].value.push(false);
							break;
						default:
							break;
					}
				}
			});
		}
		else if($(elm).text()!='')
		{
			switch(type)
			{
				case 'integer':
					globalSettings[$(elm).prop('tagName').toLowerCase()].value = parseInt($(elm).text(),10);
					break;
				case 'string':
					if($(elm).text()!='null')
						globalSettings[$(elm).prop('tagName').toLowerCase()].value = $(elm).text();
					else
						globalSettings[$(elm).prop('tagName').toLowerCase()].value = null;
					break;
				case 'boolean':
					if($(elm).text() == 'true')
						globalSettings[$(elm).prop('tagName').toLowerCase()].value = true;
					else if($(elm).text() == 'false')
						globalSettings[$(elm).prop('tagName').toLowerCase()].value = false;
					break;
				default:
					break;
			}
		}
	});
}

function applyServerSettings(inputSettings)
{
	if(typeof inputSettings.activecalendarcollections == 'undefined' || inputSettings.activecalendarcollections==null)
		inputSettings.activecalendarcollections = new Array();

	if(typeof inputSettings.activetodocollections == 'undefined' || inputSettings.activetodocollections==null)
		inputSettings.activetodocollections = new Array();

	if(typeof inputSettings.loadedcalendarcollections == 'undefined' || inputSettings.loadedcalendarcollections==null)
	{
		inputSettings.loadedcalendarcollections = new Array();
		if(isAvaible('CalDavZAP'))
			$('#showUnloadedCalendars').css('display','none');
	}

	if(typeof inputSettings.loadedtodocollections == 'undefined' || inputSettings.loadedtodocollections==null)
	{
		inputSettings.loadedtodocollections = new Array();
		if(isAvaible('CalDavZAP'))
			$('#showUnloadedCalendarsTODO').css('display','none');
	}
	if(typeof inputSettings.activeaddressbookcollections == 'undefined' || inputSettings.activeaddressbookcollections==null)
		inputSettings.activeaddressbookcollections = new Array();

	if(typeof inputSettings.loadedaddressbookcollections == 'undefined' || inputSettings.loadedaddressbookcollections==null)
	{
		inputSettings.loadedaddressbookcollections = new Array();
		if(isAvaible('CardDavMATE'))
			$('#showUnloadedAddressbooks').css('display','none');
	}

	transformSettings(inputSettings);

	for(var prop in inputSettings)
	{
		if(globalDefinedSettings.indexOf(prop)==-1 || (typeof globalPreviousSupportedSettings !='undefined' && globalPreviousSupportedSettings.indexOf(prop)==-1))
		{
			if(globalDefinedSettings.indexOf(prop)==-1)
				console.log('Warning: Unsupported property: \''+prop+'\' (you can safely ignore this message)');
			continue;
		}
		if(typeof globalSettings[prop] !='undefined' && !globalSettings[prop].locked)
			globalSettings[prop].value=inputSettings[prop];
	}
}

function transformSettings(settings) {
	if(!settings.version) {
		settings.version = 1;
	}

	while(settings.version<globalSettingsVersion) {
		console.log('Warning: Detected outdated server settings (version ' + settings.version++ +') - transforming to version ' + settings.version);

		switch(settings.version) {
			case 2:
				if(typeof globalActiveCalendarCollections!='undefined' && globalActiveCalendarCollections!=null)
					settings.activecalendarcollections=globalActiveCalendarCollections.slice();
				else
					settings.activecalendarcollections.splice(0, settings.activecalendarcollections.length);

				if(typeof globalActiveTodoCollections!='undefined' && globalActiveTodoCollections!=null)
					settings.activetodocollections=globalActiveTodoCollections.slice();
				else
					settings.activetodocollections.splice(0, settings.activetodocollections.length);

				if(typeof globalLoadedCalendarCollections!='undefined' && globalLoadedCalendarCollections!=null)
					settings.loadedcalendarcollections=globalLoadedCalendarCollections.slice();
				else
					settings.loadedcalendarcollections.splice(0, settings.loadedcalendarcollections.length);

				if(typeof globalLoadedTodoCollections!='undefined' && globalLoadedTodoCollections!=null)
					settings.loadedtodocollections=globalLoadedTodoCollections.slice();
				else
					settings.loadedtodocollections.splice(0, settings.loadedtodocollections.length);

				if(typeof globalActiveAddressbookCollections!='undefined' && globalActiveAddressbookCollections!=null)
					settings.activeaddressbookcollections=globalActiveAddressbookCollections.slice();
				else
					settings.activeaddressbookcollections.splice(0, settings.activeaddressbookcollections.length);

				if(typeof globalLoadedAddressbookCollections!='undefined' && globalLoadedAddressbookCollections!=null)
					settings.loadedaddressbookcollections=globalLoadedAddressbookCollections.slice();
				else
					settings.loadedaddressbookcollections.splice(0, settings.loadedaddressbookcollections.length);

				if(typeof globalContactStoreFN!='undefined' && globalContactStoreFN!=null)
					settings.contactstorefn=globalContactStoreFN.slice();
				else
					settings.contactstorefn=['prefix', ' last', ' middle', ' first', ' suffix'];
				break;
			case 3:
				settings.collectiondisplay=(typeof globalCollectionDisplay!='undefined' && globalCollectionDisplay!=null && globalCollectionDisplay!='') ? globalCollectionDisplay : (
					(typeof globalGroupContactsByCompanies!='undefined' && globalGroupContactsByCompanies) ?
					[{label: '{Name}', value: {company: ['{Company}', ' [{Department}]'], personal: ['{LastName}', ' {MiddleName}', ' {FirstName}']}}, {label: '{JobTitle}', value: ['{JobTitle}']}, {label: '{Email}', value: ['{Email[:0]}']}, {label: '{Phone} 1', value: ['{Phone[:0]}']}, {label: '{Phone} 2', value: ['{Phone[:1]}']}, {label: '{NoteText}', value: ['{NoteText}']}] :
					[{label: '{Name}', value: ['{LastName}', ' {MiddleName}', ' {FirstName}']}, {label: '{Company} [{Department}]', value: ['{Company}', ' [{Department}]']}, {label: '{JobTitle}', value: ['{JobTitle}']}, {label: '{Email}', value: ['{Email[:0]}']}, {label: '{Phone} 1', value: ['{Phone[:0]}']}, {label: '{Phone} 2', value: ['{Phone[:1]}']}, {label: '{NoteText}', value: ['{NoteText}']}]
				);

				settings.collectionsort=(typeof globalCollectionSort!='undefined' && globalCollectionSort!=null && globalCollectionSort!='') ? globalCollectionSort : '';
				break;
			default:
				break;
		}
	}
}

function loadSettings(strobj, fromServer, syncMode)
{
	if(settingsLoaded && !syncMode)
		return false;
	try
	{
		objNew = jQuery.parseJSON(strobj);
		if(typeof objNew=='object')
		{
			if(!syncMode && typeof globalSettingsXML!='undefined' && globalSettingsXML!=null && globalSettingsXML!='')
				loadXMLSetings($(globalSettingsXML));
			if(fromServer)
				applyServerSettings(objNew);
//			$.extend(globalSettings,objNew);
		}
	}
	catch(err)
	{
		console.log('load settings - JSON parsing error: '+err);
		delete globalSettings.version.value;
		loadSettings(JSON.stringify(globalSettings), false, false);
		return false;
	}
	if(syncMode)
		return false;
	if(isAvaible('CalDavZAP'))
	{
		for(var i=0;i<globalSettings.timezonesenabled.value.length;i++)
			if(timeZonesEnabled.indexOf(globalSettings.timezonesenabled.value[i])==-1)
				timeZonesEnabled.push(globalSettings.timezonesenabled.value[i]);

		if(globalSettings.timezonesupport.value)
		{
			globalSessionTimeZone=globalSettings.timezone.value;
				if(globalSessionTimeZone != null && timeZonesEnabled.indexOf(globalSessionTimeZone)==-1)
					timeZonesEnabled.push(globalSessionTimeZone);
		}
		else
		{
			globalSessionTimeZone = 'local';
			timeZonesEnabled.push('local');
		}

		initTimepicker(globalSettings.ampmformat.value);

		if(globalSettings.timeformatagenda.value==null)
		{
			if(globalSettings.ampmformat.value)
				globalSettings.timeformatagenda.value='h:mm TT{ - h:mm TT}';
			else
				globalSettings.timeformatagenda.value='H:mm{ - H:mm}';
		}

		if(globalSettings.timeformatbasic.value==null)
		{
			if(globalSettings.ampmformat.value)
				globalSettings.timeformatbasic.value = 'h:mmT{-h:mmT}';
			else
				globalSettings.timeformatbasic.value = 'H:mm{-H:mm}';
		}

		if(globalSettings.appleremindersmode.value)
		{
			if(globalSettings.todolistfilterselected.value.indexOf('filterAction')==-1 && globalSettings.todolistfilterselected.value.indexOf('filterCompleted')==-1)
			{
				if(globalSettings.todolistfilterselected.value.indexOf('filterProgress')!=-1)
					globalSettings.todolistfilterselected.value[globalSettings.todolistfilterselected.value.indexOf('filterProgress')] = 'filterAction';
				if(globalSettings.todolistfilterselected.value.indexOf('filterCanceled')!=-1)
					globalSettings.todolistfilterselected.value[globalSettings.todolistfilterselected.value.indexOf('filterCanceled')] = 'filterAction';
			}
		}
		if(globalSettings.eventstartfuturelimit.value == null)
		{
			var now=new Date();
			globalToLoadedLimit = new Date(now.getFullYear(), now.getMonth()+12, 1, 0, 0, 0);
			globalToLoadedLimit.setMilliseconds(0);
			globalBeginFuture = new Date(globalToLoadedLimit.getTime());
			globalBeginFuture.setDate(globalBeginFuture.getDate()+14);
			globalToLoadedLimitTodo = new Date(now.getFullYear(), now.getMonth()+12, 1, 0, 0, 0);
			globalToLoadedLimitTodo.setMilliseconds(0);
		}
		if(globalSettings.enablekbnavigation.value!==false)
			initKbTodoNavigation();
		initFullCalendar();
		initTodoList();

		$('#SystemCalDavZAP .fc-header-title').css('width', $('#main_h_placeholder').width()-$('#SystemCalDavZAP .fc-header-left').outerWidth()-$('#SystemCalDavZAP .fc-header-right').outerWidth());
		$('#ResourceCalDAVList, #ResourceCalDAVTODOList').css('bottom',(globalSettings.timezonesupport.value ? 20 : 0));
		$('#alertBox').css('left', ($(window).width()/2)-($('#alertBox').width()/2));
	}
	if(isAvaible('CardDavMATE'))
	{
		// set ABListTableLayout
		globalRefAbListTableHeader = $('#ABListTable').find('.ablist_table_header');
		var colgroups = $('#ABListTable').find('colgroup');

		for(var i=0; i<getDataColumnCount(); i++) {
			globalRefAbListTableHeader.append('<th>');
			colgroups.append('<col>');
		}

		globalRefAbListTableHeader.children().slice(globalFixedContactDataColumnsCount).each(function(ind) {
			$(this).text(getDataColumnLabelAtIndex(ind));
		});

		globalRefABListTableCols=$('#ABListTable').find('colgroup').first().children();
		globalRefABListInnerTableCols=$('#ABListTableInner').find('colgroup').children();
		$('#ABListTable').find('.ablist_table_container').children().attr('colspan', getDataColumnCount()+globalFixedContactDataColumnsCount);
		globalRefABListTable.children('.ablist_header').children().attr('colspan', getDataColumnCount()+globalFixedContactDataColumnsCount);

		if(!globalOrigABListHeader) {
			globalOrigABListHeader=globalRefABListTable.children('.ablist_header').remove();
		}
		if(!globalOrigABListItem) {
			globalOrigABListItem=globalRefABListTable.children('.ablist_item').remove();
		}

		if(globalSettings.enablekbnavigation.value!==false)
			initKbAddrNavigation();

		applyAddrSettings(globalTranslVcardTemplate);
		applyAddrSettings($('#vCardEditor'));
	}
	if(isAvaible('Projects'))
		if(globalSettings.enablekbnavigation.value!==false)
			initKbProjectNavigation();
	settingsLoaded=true;
	if(!isAvaible(globalSettings.defaultactiveapp.value))
		globalActiveApp = globalAvailableAppsArray[0];
	else
		globalActiveApp = globalSettings.defaultactiveapp.value;
}

function checkForLoadedCollections(inputSettings)
{
	var val='', triggerSync=true;
	globalLoadedCollectionsNumber=0;
	globalLoadedCollectionsCount=0;
	if(globalSettingsSaving=='event')
	{
		hideUnloadedCollections('event');
		val = inputSettings.loadedcalendarcollections.value;
		if(val.length>0)
			globalLoadedCollectionsNumber+=$(val).not(globalSettings.loadedcalendarcollections.value).length;
		else
			globalLoadedCollectionsNumber++;
		if($(globalSettings.loadedcalendarcollections.value).not(val).length>0)
		{
			if(globalLoadedCollectionsNumber==0)
			{
				triggerSync=false;
				globalFirstHideLoader=false;
			}
			var unloadArray = $(globalSettings.loadedcalendarcollections.value).not(val);
			unloadCalDAVCollection(unloadArray.toArray(),true);
		}
		if(triggerSync)
			addLoadCalDAVCollection(val, true);
		globalSettings.loadedcalendarcollections.value = val;
	}
	else if(globalSettingsSaving=='todo')
	{
		hideUnloadedCollections('todo');
		val = inputSettings.loadedtodocollections.value;
		if(val.length>0)
			globalLoadedCollectionsNumber+=$(val).not(globalSettings.loadedtodocollections.value).length;
		else
			globalLoadedCollectionsNumber++;
		if($(globalSettings.loadedtodocollections.value).not(val).length>0)
		{
			if(globalLoadedCollectionsNumber==0)
			{
				triggerSync=false;
				globalFirstHideLoader=false;
			}
			var unloadArray = $(globalSettings.loadedtodocollections.value).not(val);
			unloadCalDAVCollection(unloadArray.toArray(),false);
		}
		if(triggerSync)
			addLoadCalDAVCollection(val, false);
		globalSettings.loadedtodocollections.value = val;
	}
	else if(globalSettingsSaving=='addressbook')
	{
		hideUnloadedCardDAVCollections();
		val = inputSettings.loadedaddressbookcollections.value;
		if(val.length>0)
			globalLoadedCollectionsNumber+=$(val).not(globalSettings.loadedaddressbookcollections.value).length;
		else
			globalLoadedCollectionsNumber++;
		if($(globalSettings.loadedaddressbookcollections.value).not(val).length>0)
		{
			if(globalLoadedCollectionsNumber==0)
			{
				triggerSync=false;
				globalFirstHideLoader=false;
			}
			var unloadArray = $(globalSettings.loadedaddressbookcollections.value).not(val);
			unloadCardDAVCollection(unloadArray.toArray());
		}
		if(triggerSync)
			addLoadCardDAVCollection(val)
		globalSettings.loadedaddressbookcollections.value = val;
	}
	if(triggerSync)
		ifLoadCollections();
}

function checkBeforeClose(isFormSave)
{
	if((isAvaible('CalDavZAP') && globalCalDAVInitLoad) || (isAvaible('CardDavMATE') && globalCardDAVInitLoad))
		return false;
	var old_settings=JSON.stringify(globalSettings);
	var settings=saveSettings(isFormSave);
	var new_settings = JSON.stringify(settings);
	if(old_settings == new_settings)
		return false;
	for(var i=0;i<globalAccountSettings.length;i++)
		if(globalAccountSettings[i].href.indexOf(globalLoginUsername)!=-1 && globalAccountSettings[i].settingsAccount)
		{
			netSaveSettings(globalAccountSettings[i], settings, isFormSave,false);
			break;
		}
}

function isEachResourceLoaded()
{
	var loaded = true;
	for(var i=0; i< globalAccountSettings.length; i++)
		if(typeof globalAccountSettings[i].errorLoaded!='undefined' && globalAccountSettings[i].errorLoaded!=null && globalAccountSettings[i].errorLoaded===true)
			loaded=false;
	return loaded;
}

window.onload=globalMain;

window.onkeydown=function(event)
{
	switch(event.which) {
		case 13:
			if(!isUserLogged)
				$('#Login').find('[data-type="system_login"]').trigger('click');
			break;
		case 27:
			if(globalActiveApp=='CalDavZAP' && $('#CAEvent').is(':visible') && $('#EventDisabler').is(':hidden'))
				$('#closeButton').trigger('click');
			if(globalActiveApp=='Projects' && $('#ProjectEventForm').is(':visible') && $('#ProjectsDisabler').is(':hidden'))
				$('#cancelActivity').trigger('click');
			if($('.sp-container').is(':visible'))
				$('html').trigger('click');
			break;
		default:
			break;
	}
};


function logoutCalDAV()
{
	globalTodolistStatusArray={};
	globalTodoCheckTimeout=null;
	globalVisibleCalDAVCollections.splice(0, globalVisibleCalDAVCollections.length);
	globalVisibleCalDAVTODOCollections.splice(0, globalVisibleCalDAVTODOCollections.length);
	processedTimezones.splice(0, processedTimezones.length);
	globalCalendarNumber=0;
	globalOnlyCalendarNumber=0;
	globalTodoCalendarNumber=0;
	globalCalendarNumberCount=0;
	globalLoadedLimit = new Date();
	globalToLoadedLimit = new Date();
	globalLimitLoading='';
	globalLimitTodoLoading='';
	globalBeginPast = new Date();
	globalBeginFuture = new Date();
	globalLoadedLimitTodo = new Date();
	globalToLoadedLimitTodo = new Date();
	globalDefaultCalendarCollectionActiveAll = false;
	globalDefaultTodoCalendarCollectionActiveAll = false;
	globalDefaultCalendarCollectionLoadAll = false;
	globalDefaultTodoCalendarCollectionLoadAll = false;
	globalCalDAVCollectionSync=false;
	globalAllowFcRerender=true;
	globalEventList.reset();
	globalResourceCalDAVList.reset();
	timeZonesEnabled.splice(0,timeZonesEnabled.length);
	if(globalEventIntervalID!=null)
		clearInterval(globalEventIntervalID);

	$('#EventDisabler, #TodoDisabler, #AlertDisabler').fadeOut(2000);
	$('#SystemCalDavZAP,  #SystemCalDavTODO').animate({opacity : 0},200).promise().done(function(){
		$('#SystemCalDavZAP, #SystemCalDavTODO').css('visibility','hidden');
		$('#main, #mainTODO').animate({top: 25}, 0);
		$('#searchForm, #searchFormTODO').hide();
		$('#searchInput, #searchInputTODO').val('').trigger('keyup').trigger('blur');
		$('#calendar').fullCalendar('destroy');
		$('#todoList').fullCalendar('destroy');
		$('#timezonePicker, #timezonePickerTODO').prop('disabled', false).empty();
		$('#eventColor, #todoColor').css('background-color','');
		if($('#ResourceCalDAVList').width()<1)
			$('#ResourceCalDAVToggle').trigger('click');
		if($('#ResourceCalDAVTODOList').width()<1)
			$('#ResourceCalDAVTODOToggle').trigger('click');
	});
}

function mainCalDAV()
{
	localizeCalDAV();
	// init();
}

function localizeCalDAV()
{
	globalCalDAVInitLoad = true;
	$('#ResourceCalDAVList').html(origResourceCalDAVListTemplate);
	$('#ResourceCalDAVTODOList').html(origResourceCalDAVTODOListTemplate);
	$('#CAEvent').html(origVcalendarTemplate);
	$('#CATodo').html(origVtodoTemplate);
	$('#todoLoader').html(origVtodoLoaderTemplate);
	translate();
	$('input[placeholder],textarea[placeholder]').placeholder();
	cleanResourceCalDAVListTemplate=$('#ResourceCalDAVListTemplate').clone().wrap('<div>').parent().html();
	cleanResourceCalDAVTODOListTemplate=$('#ResourceCalDAVTODOListTemplate').clone().wrap('<div>').parent().html();
	cleanVcalendarTemplate=$('#CAEvent .saveLoader').clone().wrap('<div>').parent().html() + $('#repeatConfirmBox').clone().wrap('<div>').parent().html() + $('#event_details_template').clone().wrap('<div>').parent().html();
	cleanVtodoTemplate=$('#repeatConfirmBoxTODO').clone().wrap('<div>').parent().html() + $('#todo_details_template').clone().wrap('<div>').parent().html();
	$('#searchInput, #searchInputTODO').val('');
	globalSettings.titleformatmonth.value = localization[globalInterfaceLanguage]._default_title_format_month_;
	globalSettings.titleformatweek.value = localization[globalInterfaceLanguage]._default_title_format_week_;
	globalSettings.titleformatday.value = localization[globalInterfaceLanguage]._default_title_format_day_;
	globalSettings.titleformattable.value = localization[globalInterfaceLanguage]._default_title_format_table_;
	globalSettings.columnformatagenda.value = localization[globalInterfaceLanguage]._default_column_format_agenda_;
}

function runCalDAV()
{
	if(!isUserLogged)
		run();

	globalResourceRefreshNumber=0;
	globalResourceRefreshNumberTodo=0;

	$('#MainLoader').css('left','0px');
	$('#MainLoader').fadeIn(200);

	if(typeof globalSubscribedCalendars!='undefined' && globalSubscribedCalendars!=null)
	{
		globalAccountSettings[globalAccountSettings.length]=$.extend({},globalAccountSettings[0]);
		globalAccountSettings[globalAccountSettings.length-1].hrefLabel = globalSubscribedCalendars.hrefLabel;
		globalAccountSettings[globalAccountSettings.length-1].calendars = globalSubscribedCalendars.calendars;
		globalAccountSettings[globalAccountSettings.length-1].ignoreAlarms = '';
	}
}

// function fullMain(){

	// $(window).load(function() {

		// $(".sidebarleft").css({'display': 'none'});

		// $("#main").css({'left': '0'});
		// $("#searchForm").css({'left': '0'});
		// $("#main_h").css({'left': '0'});

		// $( "#ResourceCalDAVToggle" ).click(function() {
		//   $(".sidebarleft").css({'display': 'block'});

		//   $("#main").animate({'left': '224px'},600);
		// 	$("#searchForm").animate({'left': '224px'},600);
		// 	$("#main_h").animate({'left': '224px'},600);

		// });

// 	});
// }

// fullMain();

function algooCustomToggleSidebarleft () {
	var transSpeedResource=70;
	var isResourceVisible=$('#ResourceCalDAVList').width()>1;
	var col0=isResourceVisible? 0:218;
	var col1=isResourceVisible? 0:224;
	var col2=isResourceVisible? 0:224;
	var col3=isResourceVisible? 0:225;

	if(isIntegrated)
	{
		col2+=isResourceVisible? 0:1; // default value 49:50
		col3+=1; // default value 50
	}

	if(typeof globalCalDAVInitLoad!='undefined' && !globalCalDAVInitLoad && !globalResourceRefreshNumber)
		$('#CalendarLoader').children('.loaderInfo').text(localization[globalInterfaceLanguage].resizeLoader).parent().css('display','block');

	if(globalSettings.timezonesupport.value)
		$('#timezoneWrapper').animate({width: col0}, transSpeedResource);

	$('#resourceCalDAV_h, #ResourceCalDAVList').animate({width: col1}, transSpeedResource);
	$('#CalendarLoader').animate({left: col3}, transSpeedResource);
	$('#main_h, #searchForm, #main').animate({left: col2}, transSpeedResource).promise().done(function(){
		$('#SystemCalDavZAP .fc-header-title').width($('#main_h_placeholder').width()-$('#SystemCalDavZAP .fc-header-left').width()-$('#SystemCalDavZAP .fc-header-right').width()-20);
		$(window).resize();
	});
}

function globalMainCalDAV()
{
	$(window).resize(function(evt){
		if(evt.target!=window)
			return;

		if(typeof globalCalDAVInitLoad!='undefined' && !globalCalDAVInitLoad && !globalResourceRefreshNumber && $('#main').width()!=globalCalWidth)
			$('#CalendarLoader').children('.loaderInfo').text(localization[globalInterfaceLanguage].resizeLoader).parent().css('display','block');

		$('#SystemCalDavZAP .fc-header-title').css('width', $('#main_h_placeholder').width()-$('#SystemCalDavZAP .fc-header-left').outerWidth()-$('#SystemCalDavZAP .fc-header-right').outerWidth());
		$('#ResourceCalDAVList, #ResourceCalDAVTODOList').css('bottom',(globalSettings.timezonesupport.value ? 20 : 0));
		$('#alertBox').css('left', ($(window).width()/2)-($('#alertBox').width()/2));
		$('#calendar').fullCalendar('option', 'contentHeight', $('#main').height() - 14);
		$('#todoList').fullCalendar('allowSelectEvent',false);
		$('#todoList').fullCalendar('option', 'contentHeight', $('#mainTODO').height() - 14);
		$('#todoList').fullCalendar('allowSelectEvent',true);
		$('#todoList').fullCalendar('selectEvent', null, true);

		if($('#CATodo').is(':visible')) {
			checkTodoFormScrollBar();
		}

		if(globalSettings.displayhiddenevents.value)
		{
			hideEventCalendars();
			hideTodoCalendars();
		}
		globalCalWidth = $('#main').width();
	});

	$('#ResourceCalDAVToggle').click(function(){
		algooCustomToggleSidebarleft()
	});

	$('#ResourceCalDAVTODOToggle').click(function(){
		var transSpeedResource=70;
		var isResourceVisible=$('#ResourceCalDAVTODOList').width()>1;
		var col0=isResourceVisible? 0:218;
		var col1=isResourceVisible? 0:224;
		var col2=isResourceVisible? 0:224;
		var col3=isResourceVisible? 0:225;

		if(isIntegrated)
		{
			col2+=isResourceVisible? 0:1; // default value 49:50
			col3+=1; // default value 50
		}

		if(globalSettings.timezonesupport.value)
			$('#timezoneWrapperTODO').animate({width: col0}, transSpeedResource);

		$('#resourceCalDAVTODO_h, #ResourceCalDAVTODOList').animate({width: col1}, transSpeedResource);
		$('#CalendarLoaderTODO').animate({left: col3}, transSpeedResource);
		$('#main_h_TODO, #searchFormTODO').animate({left: col2}, transSpeedResource);
		$('#mainTODO').animate({left: col2}, transSpeedResource, function(){
			$('#todoList').fullCalendar('allowSelectEvent',false);
			$(window).resize();
			$('#todoList').fullCalendar('allowSelectEvent',true);
			$('#todoList').fullCalendar('selectEvent', null, true);
		});
	});

	$('#eventFormShowerTODO').click(function(){
			showNewEvent('TODO');
	});

	$('#eventFormShower').click(function(){
		showNewEvent('');
	});

	$('#searchInput').bind('keyup change', function(){
		if($(this).val()!='')
			$('#reserButton').css('visibility', 'visible');
		else
			$('#reserButton').css('visibility', 'hidden');
	});

	$('#searchInputTODO').bind('keyup change', function(){
		if($(this).val()!='')
			$('#resetButtonTODO').css('visibility', 'visible');
		else
			$('#resetButtonTODO').css('visibility', 'hidden');
	});

	$('#timezonePicker, #timezonePickerTODO').change(function(){
		var previousTimezone=globalSessionTimeZone;
		globalSessionTimeZone=$(this).val();
		$('#timezonePicker').val($(this).val());
		$('#timezonePickerTODO').val($(this).val());
		applyTimezone(previousTimezone);

    globalUpdateTimezoneCookieValue($(this).val())
	});

	/*************************** BAD HACKS SECTION ***************************/
	if($.browser.msie || $.browser.mozilla)
	{
		var newSVG=$(SVG_select_b).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#timezoneWrapper, #timezoneWrapperTODO').find('select').after($($('<div>').append($(newSVG).clone()).html()));
	}
	// INFO LABEL ALIGN WITH UNDELYING SELECT FIX
	if($.browser.webkit && !!$.browser.safari)
		$('.infoSpan[data-type="txt_interval"]').css('padding-left', '3px');
	/*************************** END OF BAD HACKS SECTION ***************************/

	globalCalWidth = $('#main').width();
	origResourceCalDAVListTemplate = $('#ResourceCalDAVListTemplate').clone().wrap('<div>').parent().html();
	origResourceCalDAVTODOListTemplate = $('#ResourceCalDAVTODOListTemplate').clone().wrap('<div>').parent().html();
	origVcalendarTemplate = $('#CAEvent .saveLoader').clone().wrap('<div>').parent().html() + $('#repeatConfirmBox').clone().wrap('<div>').parent().html() + $('#event_details_template').clone().wrap('<div>').parent().html();
	origVtodoTemplate = $('#repeatConfirmBoxTODO').clone().wrap('<div>').parent().html() + $('#todo_details_template').clone().wrap('<div>').parent().html();
	origVtodoLoaderTemplate=$('#todoLoader .saveLoader').clone().wrap('<div>').parent().html();

	populateTimezoneKeys();
}

function setCalendarNumber(initSearch)
{
	/*if($('.resourceCalDAV_header:visible').length>1 || (!$('.resourceCalDAV_header:visible').length  && $('.resourceCalDAV_item:visible').length>1))
		$('.addRemoveAllCalDAV').show();
	if($('.resourceCalDAVTODO_header:visible').length>1 || (!$('.resourceCalDAVTODO_header:visible').length  && $('.resourceCalDAVTODO_item:visible').length>1))
		$('.addRemoveAllCalDAVTODO').show();*/
	if(initSearch)
		initSearchEngine();

	globalCalendarNumber=0;
	globalOnlyCalendarNumber=0;
	globalTodoCalendarNumber=0;
	for(var i=0; i<globalResourceCalDAVList.collections.length;i++)
		if(globalResourceCalDAVList.collections[i].uid!=undefined && globalResourceCalDAVList.collections[i].makeLoaded)
		{
			globalCalendarNumber++;
			globalOnlyCalendarNumber++;
		}
	for(var i=0; i<globalResourceCalDAVList.TodoCollections.length;i++)
		if(globalResourceCalDAVList.TodoCollections[i].uid!=undefined && globalResourceCalDAVList.TodoCollections[i].makeLoaded)
		{
			globalCalendarNumber++;
			globalTodoCalendarNumber++;
		}
}

function algoo_get_basehref_for_href(href, globalAccountSettings) {
	for (config_key in globalAccountSettings) {
		var config = globalAccountSettings[config_key];
		if (config.href == href && config.basehref) {
			return config.basehref;
		}
	}
}

function algoo_replace_regex(href, globalAccountSettings) {
	var protocol_re = new RegExp('^(https?://)(.*)','i');

	var base_href = algoo_get_basehref_for_href(href, globalAccountSettings);
	var protocol_match = href.match(protocol_re);
	var protocol = protocol_match[1];
	var path = protocol_match[2].replace(base_href, '');

	return [href, protocol, base_href, path]
}

// 2018/05/03 - Côme: the call bellow is to auto hide the sidebarleft on startup
// @TODO: call the function algooCustomToggleSidebarleft at the right place in the code instead of hacking it with the setTimeout
// INFO - CH - 2019-04-12 - this test now uses a global variable which value come from tracim core who is able to
// tell whether the matching route is to display a workspace's agenda or all the agendas
if (!globalShouldShowSidebar) setTimeout(algooCustomToggleSidebarleft, 500)

var isIframeCaldavzapInFullscreen = false
function setAgendaFullscreen () {
  var iframeElement = window.parent.document.getElementById('agendaIframe')

  if (isIframeCaldavzapInFullscreen) {
    iframeElement.style.position = 'static'
  } else {
    iframeElement.style.position = 'fixed'
    iframeElement.style.top = '60px' // 60px is Tracim's header height
    iframeElement.style.left = '0px'
    iframeElement.style.zIndex = '40'
  }
  isIframeCaldavzapInFullscreen = !isIframeCaldavzapInFullscreen
}

