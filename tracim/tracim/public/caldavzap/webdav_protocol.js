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

// VersionCheck (check for new version)
function netVersionCheck()
{
	$.ajax({
		type: 'GET',
		url: globalVersionCheckURL,
		cache: false,
		crossDomain: false,
		timeout: 30000,
		beforeSend: function(req) {
			req.setRequestHeader('X-client', globalXClientHeader);
		},
		contentType: 'text/xml; charset=utf-8',
		processData: true,
		data: '',
		dataType: 'xml',
		error: function(objAJAXRequest, strError){
			console.log("Error: [netVersionCheck: 'GET "+globalVersionCheckURL+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'");
			return false;
		},
		success: function(data, textStatus, xml)
		{
			var count=0;
			var tmp=$(xml.responseXML).find('updates').find(globalAppName.toLowerCase());
			var type=tmp.attr('type');
			var home=tmp.attr('homeURL');
			var version_txt=tmp.attr('version');
			var build_no_txt=(typeof globalEnableDevelBuilds=='undefined' || globalEnableDevelBuilds!=true ? tmp.attr('build_no') : tmp.attr('dev_build_no'));

			if(type==undefined || type=='' || home==undefined || home=='' || version_txt==undefined || version_txt=='' || build_no_txt==undefined || build_no_txt=='')
				return false;

			var build_no=build_no_txt.match(RegExp('^([0-9]+)$'));
			if(build_no==null)
				return false;

			if(globalBuildNo<parseInt(build_no[1]))
			{
				var showNofication=false;

				if(globalNewVersionNotifyUsers.length==0)
					showNofication=true;
				else
				{
					for(var i=0;i<globalAccountSettings.length;i++)
						if(globalNewVersionNotifyUsers.indexOf(globalAccountSettings[i].userAuth.userName)!=-1)
						{
							showNofication=true;
							break;
						}
				}

				if(showNofication==true)
				{
					$('div.update_h').html(localization[globalInterfaceLanguage].updateNotification.replace('%name%',globalAppName).replace('%new_ver%','<span id="newversion" class="update_h"></span>').replace('%curr_ver%', '<span id="version" class="update_h"></span>').replace('%url%', '<span id="homeurl" class="update_h" onclick=""></span>'));
					$('div.update_h').find('span#version').text(globalVersion);

					$('div.update_h').find('span#newversion').text(version_txt);
					$('div.update_h').find('span#homeurl').attr('onclick','window.open(\''+home+'\')');
					$('div.update_h').find('span#homeurl').text(home);

					setTimeout(function(){
						var orig_width=$('div.update_d').width();
						$('div.update_d').css('width', '0px');
						$('div.update_d').css('display','');
						$('div.update_d').animate({width: '+='+orig_width+'px'}, 500);
					}, 5000);
				}
			}
		}
	});
}

// Load the configuration from XML file
function netCheckAndCreateConfiguration(configurationURL)
{
	$.ajax({
		type: 'PROPFIND',
		url: configurationURL.href,
		cache: false,
		crossDomain: (typeof configurationURL.crossDomain=='undefined' ? true : configurationURL.crossDomain),
		xhrFields: {
			withCredentials: (typeof configurationURL.withCredentials=='undefined' ? false : configurationURL.withCredentials)
		},
		timeout: configurationURL.timeOut,
		beforeSend: function(req){
			if(globalSettings.usejqueryauth.value!=true && globalLoginUsername!='' && globalLoginPassword!='')
				req.setRequestHeader('Authorization', basicAuth(globalLoginUsername,globalLoginPassword));
			req.setRequestHeader('X-client', globalXClientHeader);
			req.setRequestHeader('Depth', '0');
		},
		username: (globalSettings.usejqueryauth.value==true ? globalLoginUsername : null),
		password: (globalSettings.usejqueryauth.value==true ? globalLoginPassword : null),
		contentType: 'text/xml; charset=utf-8',
		processData: true,
		data: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>',
		dataType: 'xml',
		error: function(objAJAXRequest, strError){
			console.log("Error: [netCheckAndCreateConfiguration: 'PROPFIND "+configurationURL.href+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			$('#LoginLoader').fadeOut(1200);
			return false;
		},
		success: function(data, textStatus, xml)
		{
			var count=0;
			if($(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('status').text().match(RegExp('200 OK$')))
			{
				if(typeof globalAccountSettings=='undefined')
					globalAccountSettings=[];

				globalAccountSettings[globalAccountSettings.length]=$.extend({}, configurationURL);
				globalAccountSettings[globalAccountSettings.length-1].type='network';
				if(typeof(globalAccountSettingsHook)=='function')	// Hook for globalAccountSettings (openCRX)
					globalAccountSettings[globalAccountSettings.length-1].href=globalAccountSettingsHook(configurationURL.href, globalLoginUsername);
				else	// standard version
					globalAccountSettings[globalAccountSettings.length-1].href=configurationURL.href+globalLoginUsername+'/';
				globalAccountSettings[globalAccountSettings.length-1].userAuth={userName: globalLoginUsername, userPassword: globalLoginPassword};
				count++;

				if(configurationURL.additionalResources!=undefined && configurationURL.additionalResources.length>0)
				{
					for(var i=0;i<configurationURL.additionalResources.length;i++)
					{
						if(globalLoginUsername!=configurationURL.additionalResources[i])
						{
							globalAccountSettings[globalAccountSettings.length]=$.extend({}, configurationURL);
							globalAccountSettings[globalAccountSettings.length-1].type='network';
							globalAccountSettings[globalAccountSettings.length-1].href=configurationURL.href+configurationURL.additionalResources[i]+'/';
							globalAccountSettings[globalAccountSettings.length-1].userAuth={userName: globalLoginUsername, userPassword: globalLoginPassword};
							count++;
						}
					}
				}
			}

			if(count)
			{
				if(globalAccountSettings[0].delegation)
					DAVresourceDelegation(globalAccountSettings[0], 0, 0);
				else
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
			else
				$('#LoginLoader').fadeOut(1200);
		}
	});
}

// Load the configuration from XML file
function netLoadConfiguration(configurationURL)
{
	$.ajax({
		type: 'GET',
		url: configurationURL.href+'?browser_date='+$.datepicker.formatDate("yyyy-MM-dd", new Date())+(ignoreServerSettings==true ? '&ignore_settings=1' : ''),
		cache: false,
		crossDomain: (typeof configurationURL.crossDomain=='undefined' ? true : configurationURL.crossDomain),
		xhrFields: {
			withCredentials: (typeof configurationURL.withCredentials=='undefined' ? false : configurationURL.withCredentials)
		},
		timeout: configurationURL.timeOut,
		beforeSend: function(req) {
			if(globalSettings.usejqueryauth.value!=true && globalLoginUsername!='' && globalLoginPassword!='')
				req.setRequestHeader('Authorization', basicAuth(globalLoginUsername,globalLoginPassword));
			req.setRequestHeader('X-client', globalXClientHeader);
		},
		username: (globalSettings.usejqueryauth.value==true ? globalLoginUsername : null),
		password: (globalSettings.usejqueryauth.value==true ? globalLoginPassword : null),
		contentType: 'text/xml; charset=utf-8',
		processData: true,
		data: '',
		dataType: 'xml',
		error: function(objAJAXRequest, strError){
			console.log("Error: [loadConfiguration: 'GET "+configurationURL.href+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			$('#LoginLoader').fadeOut(1200);
			return false;
		},
		success: function(data, textStatus, xml)
		{
			if(typeof globalAccountSettings=='undefined')
				globalAccountSettings=[];

			var count=0;
			var rex=new RegExp('^re(\\|[^:]*|):(.+)$');
			$(xml.responseXML).children('resources').children('resource').each(
				function(index, element)
				{
					if($(element).children().filterNsNode('type').children().filterNsNode('addressbook').length==1 || $(element).children().filterNsNode('type').children().filterNsNode('calendar').length==1)
					{
						// numeric/text options
						var href=$(element).children('href').text();
						var tmp=$(element).children('hreflabel').text();
						var hreflabel=(tmp!='' && tmp!='null' ? tmp : null);
						var username=$(element).children('userauth').children('username').text();
						var password=$(element).children('userauth').children('password').text();
						var timeout=$(element).children('timeout').text();
						var locktimeout=$(element).children('locktimeout').text();

						// array options
						var collectionTypes=new Array();
						if($(element).children().filterNsNode('type').children().filterNsNode('addressbook').length==1)
							collectionTypes[collectionTypes.length]='addressbook';
						if($(element).children().filterNsNode('type').children().filterNsNode('calendar').length==1)
							collectionTypes[collectionTypes.length]='calendar';

						// boolean options
						var tmp=$(element).children('withcredentials').text();
						var withcredentials=((tmp=='true' || tmp=='yes' || tmp=='1') ? true : false);
						var tmp=$(element).children('crossdomain').text();
						var crossdomain=((tmp=='false' || tmp=='no' || tmp=='0') ? false : true);
						var tmp=$(element).find('settingsaccount').text();
						var settingsaccount=((tmp=='true' || tmp=='yes' || tmp=='1') ? true : false);
						var tmp=$(element).find('checkcontenttype').text();
						var checkcontenttype=((tmp=='false' || tmp=='no' || tmp=='0') ? false : true);
						var tmp=$(element).find('ignorebound').text();
						var ignorebound=((tmp=='true' || tmp=='yes' || tmp=='1') ? true : false);

						// special options
						var forcereadonly=null;
						var tmp=$(element).children('forcereadonly');
						if(tmp.text()=='true')
							var forcereadonly=true;
						else
						{
							var tmp_ro=[];
							tmp.children('collection').each(
								function(index, element)
								{
									if((matched=$(element).text().match(rex))!=null && matched.length==3)
										tmp_ro[tmp_ro.length]=new RegExp(matched[2], matched[1].substring(matched[1].length>0 ? 1 : 0));
									else
										tmp_ro[tmp_ro.length]=$(element).text();
								}
							);
							if(tmp_ro.length>0)
								var forcereadonly=tmp_ro;
						}

						var delegation=false;
						var tmp=$(element).children('delegation');
						if(tmp.text()=='true')
							var delegation=true;
						else
						{
							var tmp_de=[];
							tmp.children('resource').each(
								function(index, element)
								{
									if((matched=$(element).text().match(rex))!=null && matched.length==3)
										tmp_de[tmp_de.length]=new RegExp(matched[2], matched[1].substring(matched[1].length>0 ? 1 : 0));
									else
										tmp_de[tmp_de.length]=$(element).text();
								}
							);
							if(tmp_de.length>0)
								var delegation=tmp_de;
						}
						var extendedDelegation=false;
						var tmp=$(element).children('extendeddelegation');
						if(tmp.text()=='true')
							extendedDelegation=true;

						var ignoreAlarms=false;
						var tmp=$(element).children('ignorealarms');
						if(tmp.text()=='true')
							var ignoreAlarms=true;
						else
						{
							var tmp_ia=[];
							tmp.children('collection').each(
								function(index, element)
								{
									if((matched=$(element).text().match(rex))!=null && matched.length==3)
										tmp_ia[tmp_ia.length]=new RegExp(matched[2], matched[1].substring(matched[1].length>0 ? 1 : 0));
									else
										tmp_ia[tmp_ia.length]=$(element).text();
								}
							);
							if(tmp_ia.length>0)
								var ignoreAlarms=tmp_ia;
						}

						var backgroundCalendars=[];
						var tmp=$(element).children('backgroundcalendars');
						if(tmp.text()!='')
						{
							tmp.children('collection').each(
								function(index, element)
								{
									if((matched=$(element).text().match(rex))!=null && matched.length==3)
										backgroundCalendars[backgroundCalendars.length]=new RegExp(matched[2], matched[1].substring(matched[1].length>0 ? 1 : 0));
									else
										backgroundCalendars[backgroundCalendars.length]=$(element).text();
								}
							);
						}

						globalAccountSettings[globalAccountSettings.length]={type: 'network', href: href, hrefLabel: hreflabel, crossDomain: crossdomain, settingsAccount: settingsaccount, checkContentType: checkcontenttype, forceReadOnly: forcereadonly, withCredentials: withcredentials, userAuth: {userName: username, userPassword: password}, timeOut: timeout, lockTimeOut: locktimeout, delegation: delegation, extendedDelegation: extendedDelegation, ignoreAlarms: ignoreAlarms, backgroundCalendars: backgroundCalendars, collectionTypes: collectionTypes, ignoreBound: ignorebound};
						count++;
					}
				}
			);

			if(count)
			{
				// store the pre-cached data for the client
				var tmp=$(xml.responseXML).children('resources').children('cache_data');
				if(tmp.length)
					globalXMLCache=tmp;

				if(globalAccountSettings[0].delegation)
					DAVresourceDelegation(globalAccountSettings[0], 0, 0);
				else
				{
					// start the client
					if(isAvaible('CardDavMATE'))
					{
						runCardDAV();
					}
					if(isAvaible('CalDavZAP'))
						runCalDAV();
					if(isAvaible('Projects'))
						runProjects();
					if(isAvaible('Settings'))
						runSettings();
					globalResourceNumber = globalAccountSettings.length;
					loadAllResources();
				}
			}
			else
				$('#LoginLoader').fadeOut(1200);
		}
	});
}

// Save the collection property (stored as DAV property on server)
function netSaveProperty(inputCollection, hrefProperty, inputProperty, inputValue)
{
	var dataXML = '<?xml version="1.0" encoding="utf-8"?><D:propertyupdate xmlns:D="DAV:"><D:set><D:prop><I:'+inputProperty+' xmlns:I="'+hrefProperty+'">'+inputValue+'</I:'+inputProperty+'></D:prop></D:set></D:propertyupdate>';
	$.ajax({
		type: 'PROPPATCH',
		url: inputCollection.url+inputCollection.href,
		cache: false,
		crossDomain: (typeof inputCollection.crossDomain=='undefined' ? true: inputCollection.crossDomain),
		xhrFields: {
			withCredentials: (typeof inputCollection.withCredentials=='undefined' ? false: inputCollection.withCredentials)
		},
		timeout: inputCollection.timeOut,
		beforeSend: function(req){
			if(globalSettings.usejqueryauth.value!=true && inputCollection.userAuth.userName!='' && inputCollection.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(inputCollection.userAuth.userName, inputCollection.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
			req.setRequestHeader('Depth', '0');
		},
		username: (globalSettings.usejqueryauth.value==true ? inputCollection.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? inputCollection.userAuth.userPassword : null),
		contentType: 'text/xml',
		processData: true,
		data: dataXML,
		dataType: 'xml',
		error: function(objAJAXRequest, strError){
			console.log("Error: [netSaveProperty: 'PROPPATCH "+inputCollection.url+inputCollection.href+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' (this error code usually means network connection error, or your browser is trying to make a cross domain query, but it is not allowed by the destination server or the browser itself)': ''));
			if(inputProperty=='calendar-color')
			{
				if(inputCollection.listType=='vevent')
				{
					$('#ResourceCalDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.resourceCalDAVColor').css('background',inputCollection.ecolor);
					$('#ResourceCalDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('set',inputCollection.ecolor);
				}
				else
				{
					$('#ResourceCalDAVTODOList').find('[data-id="'+inputCollection.uid+'"]').find('.resourceCalDAVColor').css('background',inputCollection.ecolor);
					$('#ResourceCalDAVTODOList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('set',inputCollection.ecolor);
				}
			}
			else if(inputProperty=='addressbook-color')
			{
				$('#ResourceCardDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.resourceCardDAVColor').css('background',inputCollection.color);
				$('#ResourceCardDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('set',inputCollection.color);
			}
			return false;
		},
		success: function(data, textStatus, xml)
		{
			var color;
			if(inputProperty=='calendar-color')
			{
				var secondColl = null;
				if(inputCollection.listType=='vevent')
				{
					color = $('#ResourceCalDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('get').toHexString();
					if(inputCollection.fcSource!=null)
					{
						inputCollection.fcSource.backgroundColor=hexToRgba(color,0.9);
						inputCollection.fcSource.borderColor=color;
						inputCollection.fcSource.textColor=checkFontColor(color);
					}
					secondColl = globalResourceCalDAVList.getTodoCollectionByUID(inputCollection.uid);
					if(secondColl!=null)
					{
						$('#ResourceCalDAVTODOList').find('[data-id="'+inputCollection.uid+'"]').find('.resourceCalDAVColor').css('background',color);
						$('#ResourceCalDAVTODOList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('set',color);
						if(secondColl.fcSource!=null)
						{
							secondColl.fcSource.backgroundColor=hexToRgba(color,0.9);
							secondColl.fcSource.borderColor=color;
						}
					}
				}
				else
				{
					color = $('#ResourceCalDAVTODOList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('get').toHexString();
					if(inputCollection.fcSource!=null)
					{
						inputCollection.fcSource.backgroundColor=hexToRgba(color,0.9);
						inputCollection.fcSource.borderColor=color;
					}
					secondColl = globalResourceCalDAVList.getEventCollectionByUID(inputCollection.uid);
					if(secondColl!=null)
					{
						$('#ResourceCalDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.resourceCalDAVColor').css('background',color);
						$('#ResourceCalDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('set',color);
						if(secondColl.fcSource!=null)
						{
							secondColl.fcSource.backgroundColor=hexToRgba(color,0.9);
							secondColl.fcSource.borderColor=color;
							secondColl.fcSource.textColor=checkFontColor(color);
						}
					}
				}

				inputCollection.ecolor = color;
				if(secondColl!=null)
					secondColl.ecolor = color;

				if(inputCollection.listType=='vevent' || secondColl!=null)
					$('#calendar').fullCalendar('refetchEvents');
				if(inputCollection.listType=='vtodo' || secondColl!=null)
					$('#todoList').fullCalendar('refetchEvents');
			}
			else if(inputProperty=='addressbook-color')
			{
				color = $('#ResourceCardDAVList').find('[data-id="'+inputCollection.uid+'"]').find('.colorPicker').spectrum('get').toHexString();
				inputCollection.color = color;
				if($('#ResourceCardDAVList').find('[data-id="'+inputCollection.uid+'"]').parent().find('.contact_group').find('div[data-id]').length>0)
					$('#ResourceCardDAVList').find('[data-id="'+inputCollection.uid+'"]').parent().find('.contact_group').find('div[data-id]').find('.resourceCardDAVGroupColor').css('background',color);
				globalAddressbookList.applyABFilter(dataGetChecked('#ResourceCardDAVList'), false);
				var selUID = $('#vCardEditor').find('[data-attr-name="_DEST_"]').find('option:selected').attr('data-type');
				var selColl=globalResourceCardDAVList.getCollectionByUID(selUID);
				$('#ABContactColor').css('background-color', selColl.color);
			}
		}
	});
}

function DAVresourceDelegation(inputResource, index, lastIndex)
{
	globalCalDAVResourceSync=false;
	var re=new RegExp('^(https?://)([^/]+)(.*)', 'i');
	var tmp=inputResource.href.match(re);

	var baseHref=tmp[1]+tmp[2];
	var uidBase=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2];
	var uidFull=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2]+tmp[3]; //for the error handler
	var settingsXML='';
	var delegationXML='';
	if(typeof inputResource.extendedDelegation!='undefined' && inputResource.extendedDelegation)
	{
		if(inputResource.href.indexOf(globalLoginUsername)!=-1 && inputResource.settingsAccount && (globalSettings.settingstype.value=='' || globalSettings.settingstype.value==null || (globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null && globalSettings.settingstype.value=='principal-URL')))
			settingsXML = '<D:property name="settings" namespace="http://inf-it.com/ns/dav/"/>';
		delegationXML='<?xml version="1.0" encoding="utf-8"?><D:expand-property xmlns:D="DAV:"><D:property name="calendar-proxy-read-for" namespace="http://calendarserver.org/ns/"><D:property name="resourcetype"/><D:property name="current-user-privilege-set"/><D:property name="displayname"/><D:property name="calendar-user-address-set" namespace="urn:ietf:params:xml:ns:caldav"/><D:property name="calendar-home-set" namespace="urn:ietf:params:xml:ns:caldav"/><D:property name="addressbook-home-set" namespace="urn:ietf:params:xml:ns:carddav"/></D:property><D:property name="calendar-proxy-write-for" namespace="http://calendarserver.org/ns/"><D:property name="resourcetype"/><D:property name="current-user-privilege-set"/><D:property name="displayname"/><D:property name="calendar-user-address-set" namespace="urn:ietf:params:xml:ns:caldav"/><D:property name="calendar-home-set" namespace="urn:ietf:params:xml:ns:caldav"/><D:property name="addressbook-home-set" namespace="urn:ietf:params:xml:ns:carddav"/></D:property>'+settingsXML+'<D:property name="resourcetype"/><D:property name="current-user-privilege-set"/><D:property name="displayname"/><D:property name="calendar-user-address-set" namespace="urn:ietf:params:xml:ns:caldav"/><D:property name="calendar-home-set" namespace="urn:ietf:params:xml:ns:caldav"/><D:property name="addressbook-home-set" namespace="urn:ietf:params:xml:ns:carddav"/></D:expand-property>';
	}
	else
		delegationXML='<?xml version="1.0" encoding="utf-8"?><A:expand-property xmlns:A="DAV:"><A:property name="calendar-proxy-read-for" namespace="http://calendarserver.org/ns/"><A:property name="email-address-set" namespace="http://calendarserver.org/ns/"/><A:property name="displayname" namespace="DAV:"/><A:property name="calendar-user-address-set" namespace="urn:ietf:params:xml:ns:caldav"/></A:property><A:property name="calendar-proxy-write-for" namespace="http://calendarserver.org/ns/"><A:property name="email-address-set" namespace="http://calendarserver.org/ns/"/><A:property name="displayname" namespace="DAV:"/><A:property name="calendar-user-address-set" namespace="urn:ietf:params:xml:ns:caldav"/></A:property></A:expand-property>';

	function ajaxComplete(data, textStatus, xml)
	{
		if(typeof globalAccountSettings=='undefined')
			globalAccountSettings=[];

		var hostPart=tmp[1]+tmp[2];
		var propElement=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop');

		var searchR=new Array();
		searchR[searchR.length]=$(propElement).children().filterNsNode('calendar-proxy-read-for');
		searchR[searchR.length]=$(propElement).children().filterNsNode('calendar-proxy-write-for');
		for(var m=0; m<searchR.length; m++)
		{
			searchR[m].children().filterNsNode('response').each(
			function(dindex,delement){
				var href = $(delement).children().filterNsNode('href').text();
				var found=false;
				for(var i=0; i<globalAccountSettings.length; i++)
					if(decodeURIComponent(globalAccountSettings[i].href)==(hostPart+href))
						found=true;
				if(!found)
				{
					globalAccountSettings[globalAccountSettings.length]=$.extend({}, inputResource);
					globalAccountSettings[globalAccountSettings.length-1].type=inputResource.type;
					globalAccountSettings[globalAccountSettings.length-1].href=decodeURIComponent(hostPart+href);
					globalAccountSettings[globalAccountSettings.length-1].userAuth={userName: inputResource.userAuth.userName, userPassword: inputResource.userAuth.userPassword};
				}
				if(typeof inputResource.extendedDelegation!='undefined' && inputResource.extendedDelegation)
				{
					$(delement).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-user-address-set').children().each(
					function(ind, elm)
					{
						var pHref = $(elm).text();
						if(pHref.indexOf('mailto:')!=-1)
							globalAccountSettings[globalAccountSettings.length-1].principalEmail=pHref.split('mailto:')[1];
					});

					var addressbook_home=$(delement).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('addressbook-home-set').children().filterNsNode('href').text();
					if(addressbook_home=='')	// addressbook-home-set has no 'href' value -> SabreDav
						addressbook_home=$(delement).children().filterNsNode('href').text().replace('/principals/users/caldav.php','/caldav.php');

					if(addressbook_home.match(RegExp('^https?://','i'))!=null)	// absolute URL returned
						globalAccountSettings[globalAccountSettings.length-1].abhref=addressbook_home;
					else	// relative URL returned
						globalAccountSettings[globalAccountSettings.length-1].abhref=baseHref+addressbook_home;

					var calendar_home=$(delement).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-home-set').children().filterNsNode('href').text();
					if(calendar_home=='')	// addressbook-home-set has no 'href' value -> SabreDav
						calendar_home=$(delement).children().filterNsNode('href').text().replace('/principals/users/caldav.php','/caldav.php');

					if(calendar_home.match(RegExp('^https?://','i'))!=null)	// absolute URL returned
						globalAccountSettings[globalAccountSettings.length-1].cahref=calendar_home;
					else	// relative URL returned
						globalAccountSettings[globalAccountSettings.length-1].cahref=baseHref+calendar_home;
				}

			});
		}
		if(typeof inputResource.extendedDelegation!='undefined' && inputResource.extendedDelegation && !settingsLoaded && inputResource.href.indexOf(globalLoginUsername)!=-1 && inputResource.settingsAccount && (globalSettings.settingstype.value=='' || globalSettings.settingstype.value==null || (globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null && globalSettings.settingstype.value=='principal-URL')))
		{
			var settings=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('settings').text();
			if(settings!='')
			{
				if(!ignoreServerSettings)
					loadSettings(settings, true, false);
				else
				{
					delete globalSettings.version.value;
					loadSettings(JSON.stringify(globalSettings), false, false);
					console.log('Ignoring server settings: '+'\n'+settings);
				}
			}
			else
			{
				delete globalSettings.version.value;
				loadSettings(JSON.stringify(globalSettings), false, false);
			}
		}
		if(typeof inputResource.extendedDelegation!='undefined' && inputResource.extendedDelegation)
		{
			var response=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response');
			$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-user-address-set').children().each(
			function(ind, elm)
			{
				var pHref = $(elm).text();
				if(pHref.indexOf('mailto:')!=-1)
					inputResource.principalEmail=pHref.split('mailto:')[1];
			});
			if(globalEmailAddress==''&&typeof inputResource.principalEmail!= 'undefined')
					globalEmailAddress=inputResource.principalEmail;

			var addressbook_home=response.children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('addressbook-home-set').children().filterNsNode('href').text();
			if(addressbook_home=='')	// addressbook-home-set has no 'href' value -> SabreDav
				addressbook_home=response.children().filterNsNode('href').text().replace('/principals/users/caldav.php','/caldav.php');

			if(addressbook_home.match(RegExp('^https?://','i'))!=null)	// absolute URL returned
				inputResource.abhref=addressbook_home;
			else	// relative URL returned
				inputResource.abhref=baseHref+addressbook_home;

			var calendar_home=response.children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-home-set').children().filterNsNode('href').text();
			if(calendar_home=='')	// addressbook-home-set has no 'href' value -> SabreDav
				calendar_home=response.children().filterNsNode('href').text().replace('/principals/users/caldav.php','/caldav.php');

			if(calendar_home.match(RegExp('^https?://','i'))!=null)	// absolute URL returned
				inputResource.cahref=calendar_home;
			else	// relative URL returned
				inputResource.cahref=baseHref+calendar_home;
		}

		if(index==lastIndex)
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

	// first try to process the cached data (if cached results are available in the "auth module" response)
	var tmpCache;
	var tmpDav = inputResource.href.match('^(.*/)([^/]+)/$');
	if(globalXMLCache!=null && (tmpCache=globalXMLCache.children('davprincipaldelegation[request_url="'+jqueryEscapeSelector(tmpDav[1]+encodeURIComponent(tmpDav[2])+'/')+'"]').remove()).length)
	{
		if(typeof globalDebug!='undefined' && globalDebug instanceof Array && globalDebug.indexOf('cache')!=-1)
			console.log('DBG Cache OK: '+arguments.callee.name+' url: \''+inputResource.href+'\': saved one request!');
		ajaxComplete('', 'success', {responseXML: tmpCache});
	}
	else
	{
		if(typeof globalDebug!='undefined' && globalDebug instanceof Array && globalDebug.indexOf('cache')!=-1)
			console.log('DBG Cache ERROR: '+arguments.callee.name+' url: \''+inputResource.href+'\': spend one request!');
		$.ajax({
			type: 'REPORT',
			url: inputResource.href,
			cache: false,
			crossDomain: (typeof inputResource.crossDomain=='undefined' ? true: inputResource.crossDomain),
			xhrFields:
			{
				withCredentials: (typeof inputResource.withCredentials=='undefined' ? false: inputResource.withCredentials)
			},
			timeout: inputResource.timeOut,
			beforeSend: function(req)
			{
				if(globalSettings.usejqueryauth.value!=true && inputResource.userAuth.userName!='' && inputResource.userAuth.userPassword!='')
					req.setRequestHeader('Authorization', basicAuth(inputResource.userAuth.userName, inputResource.userAuth.userPassword));

				req.setRequestHeader('X-client', globalXClientHeader);
				req.setRequestHeader('Depth', '0');
			},
			username: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userName : null),
			password: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userPassword : null),
			contentType: 'text/xml',
			processData: true,
			data: delegationXML,
			dataType: 'xml',
			error: function(objAJAXRequest, strError)
			{
				console.log("Error: [DAVresourceDelegation: 'REPORT "+uidFull+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' (this error code usually means network connection error, or your browser is trying to make a cross domain query, but it is not allowed by the destination server or the browser itself)': ''));
			},
			success: ajaxComplete
		});
	}
}

function netFindResource(inputResource, inputResourceIndex, forceLoad, indexR, loadArray)
{
	if(globalPreventLogoutSync)
	{
		logout(true);
		return false;
	}
	if(indexR<globalAccountSettings.length)
	{
		globalResourceNumberCount++;
		if((isAvaible('CardDavMATE') && globalCardDAVInitLoad) || (isAvaible('CalDavZAP') && globalCalDAVInitLoad) || (isAvaible('Projects') && !isProjectsLoaded) || (isAvaible('Settings') && !isSettingsLoaded))
			$('#MainLoaderInner').html(localization[globalInterfaceLanguage].loadingResources.replace('%act%', globalResourceNumberCount).replace('%total%', globalResourceNumber));
	}
	if((typeof inputResource!='undefined' && typeof inputResource.collectionTypes!='undefined' && inputResource.collectionTypes!=null && (inputResource.collectionTypes.indexOf('calendar')==-1) && inputResource.collectionTypes.indexOf('addressbook')==-1) || (typeof inputResource!='undefined' && typeof loadArray!='undefined' && loadArray!=null && loadArray.indexOf(inputResource.href)==-1))
	{
		indexR++;
		netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
		return false;
	}

	if(indexR>=globalAccountSettings.length && settingsLoaded)
	{
		if(globalResourceIntervalID==null)
			globalResourceIntervalID=setInterval(reloadResources, globalSettings.syncresourcesinterval.value);
		globalCalDAVResourceSync=false;
		globalCardDAVResourceSync=false;
		globalSyncSettingsSave=false;
		var rexo=new RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)');
		var rex=new RegExp('^(https?://)(.*)', 'i');
		var accRex=new RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@([^/]+)(.*/)', 'i');
		if((isAvaible('CalDavZAP') && !isCalDAVLoaded) || (isAvaible('CardDavMATE') && !isCardDAVLoaded))
		{
			if(isAvaible('CalDavZAP'))
			{
				if(!globalDefaultCalendarCollectionActiveAll)
				{
					for(var i=0; i<globalSettings.activecalendarcollections.value.length; i++)
					{
						if(typeof globalCrossServerSettingsURL!='undefined' && globalCrossServerSettingsURL!=null && globalCrossServerSettingsURL)
						{
							var tmpParts2=globalSettings.activecalendarcollections.value[i].match('^(.*/)([^/]+)/([^/]+)/$');
							var checkHref2=tmpParts2[2]+'/'+tmpParts2[3]+'/';
							if($('#ResourceCalDAVList input[data-id$="'+checkHref2+'"]:visible').length>0)
							{
								var elm=$('#ResourceCalDAVList input[data-id$="'+checkHref2+'"]');
								elm.trigger('click');
								globalVisibleCalDAVCollections.splice(globalVisibleCalDAVCollections.length, 0, elm.attr('data-id'));
							}
						}
						else
						{
							var uidPart=globalSettings.activecalendarcollections.value[i].match(rex)[1];
							var uidPart2=globalSettings.activecalendarcollections.value[i].match(rex)[2];
							if(globalLoginUsername!='')
								var uidPart3=globalLoginUsername;
							else
								var uidPart3=globalAccountSettings[0].userAuth.userName;
							var uid = uidPart+uidPart3+'@'+uidPart2;
							if($('#ResourceCalDAVList input[data-id="'+uid+'"]:visible').length>0)
							{
								$('#ResourceCalDAVList input[data-id="'+uid+'"]').trigger('click');
								globalVisibleCalDAVCollections.splice(globalVisibleCalDAVCollections.length, 0, uid);
							}
						}
					}
					if(globalSettings.activecalendarcollections.value.length>0 && globalVisibleCalDAVCollections.length==0)
						globalDefaultCalendarCollectionActiveAll=true;
				}

				if(globalDefaultCalendarCollectionActiveAll)
					for(var i=0; i<globalResourceCalDAVList.collections.length; i++)
					{
						if(globalResourceCalDAVList.collections[i].uid!=undefined && $('#ResourceCalDAVList input[data-id="'+globalResourceCalDAVList.collections[i].uid+'"]:visible').length>0)
						{
							$('#ResourceCalDAVList input[data-id="'+globalResourceCalDAVList.collections[i].uid+'"]').trigger('click');
							globalVisibleCalDAVCollections.splice(globalVisibleCalDAVCollections.length, 0, globalResourceCalDAVList.collections[i].uid);
						}
					}

				if(!globalDefaultTodoCalendarCollectionActiveAll)
				{
					for(var i=0; i<globalSettings.activetodocollections.value.length; i++)
					{
						if(typeof globalCrossServerSettingsURL!='undefined' && globalCrossServerSettingsURL!=null && globalCrossServerSettingsURL)
						{
							var tmpParts2=globalSettings.activetodocollections.value[i].match('^(.*/)([^/]+)/([^/]+)/$');
							var checkHref2=tmpParts2[2]+'/'+tmpParts2[3]+'/';
							if($('#ResourceCalDAVTODOList input[data-id$="'+checkHref2+'"]:visible').length>0)
							{
								var elm=$('#ResourceCalDAVTODOList input[data-id$="'+checkHref2+'"]');
								elm.trigger('click');
								globalVisibleCalDAVTODOCollections.splice(globalVisibleCalDAVTODOCollections.length, 0, elm.attr('data-id'));
							}
						}
						else
						{
							var uidPart=globalSettings.activetodocollections.value[i].match(rex)[1];
							var uidPart2=globalSettings.activetodocollections.value[i].match(rex)[2];
							if(globalLoginUsername!='')
								var uidPart3=globalLoginUsername;
							else
								var uidPart3=globalAccountSettings[0].userAuth.userName;
							var uid=uidPart+uidPart3+'@'+uidPart2;
							if($('#ResourceCalDAVTODOList input[data-id="'+uid+'"]:visible').length>0)
							{
								$('#ResourceCalDAVTODOList input[data-id="'+uid+'"]').trigger('click');
								globalVisibleCalDAVTODOCollections.splice(globalVisibleCalDAVTODOCollections.length, 0, uid);
							}
						}
					}

					if(globalSettings.activetodocollections.value.length>0 && globalVisibleCalDAVTODOCollections.length==0)
						globalDefaultTodoCalendarCollectionActiveAll=true;
				}

				if(globalDefaultTodoCalendarCollectionActiveAll)
					for(var i=0; i<globalResourceCalDAVList.TodoCollections.length; i++)
					{
						if(globalResourceCalDAVList.TodoCollections[i].uid!=undefined && $('#ResourceCalDAVTODOList input[data-id="'+globalResourceCalDAVList.TodoCollections[i].uid+'"]:visible').length>0)
						{
							$('#ResourceCalDAVTODOList input[data-id="'+globalResourceCalDAVList.TodoCollections[i].uid+'"]').trigger('click');
							globalVisibleCalDAVTODOCollections.splice(globalVisibleCalDAVTODOCollections.length, 0, globalResourceCalDAVList.TodoCollections[i].uid);
						}
					}
				if($('#ResourceCalDAVList .resourceCalDAV_item[data-id]:visible').length==0 && globalResourceCalDAVList.collections.length>1)
				{
					var enabledArray=new Array();
					for(var c=0; c<globalResourceCalDAVList.collections.length; c++)
						if(globalResourceCalDAVList.collections[c].uid!=undefined)
						{
							var tmp=globalResourceCalDAVList.collections[c].accountUID.match(accRex);
							var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
							if(globalAccountSettings[0].href==resourceCalDAV_href && globalAccountSettings[0].userAuth.userName==globalResourceCalDAVList.collections[c].userAuth.userName)
								enabledArray.push(globalResourceCalDAVList.collections[c]);
						}

					if(enabledArray.length==0)
						enabledArray.push(globalResourceCalDAVList.collections[1]);

					for(var c=0; c<enabledArray.length; c++)
					{
						enabledArray[c].makeLoaded=true;
						var uidParts=enabledArray[c].uid.match(rexo);
						globalSettings.loadedcalendarcollections.value.push(uidParts[1]+uidParts[3]);
						var resDOMItem=$('#ResourceCalDAVList').find('.resourceCalDAV_item[data-id="'+jqueryEscapeSelector(enabledArray[c].uid)+'"]');
						var resDOMHeader=resDOMItem.prevUntil('.resourceCalDAV_header').last().prev();
						if(!resDOMHeader.length)
							resDOMHeader=resDOMItem.prev();
						resDOMHeader.css('display','block');
						resDOMItem.css('display','');
						resDOMItem.find('input[type=checkbox]').not('.unloadCheck').trigger('click');
						globalVisibleCalDAVCollections.splice(globalVisibleCalDAVCollections.length, 0, enabledArray[c].uid);
					}
				}

				if($('#ResourceCalDAVTODOList .resourceCalDAVTODO_item[data-id]:visible').length==0 && globalResourceCalDAVList.TodoCollections.length>1)
				{
					var enabledArray=new Array();
					for(var c=0; c<globalResourceCalDAVList.TodoCollections.length; c++)
						if(globalResourceCalDAVList.TodoCollections[c].uid!=undefined)
						{
							var tmp=globalResourceCalDAVList.TodoCollections[c].accountUID.match(accRex);
							var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
							if(globalAccountSettings[0].href==resourceCalDAV_href && globalAccountSettings[0].userAuth.userName==globalResourceCalDAVList.TodoCollections[c].userAuth.userName)
								enabledArray.push(globalResourceCalDAVList.TodoCollections[c]);
						}

					if(enabledArray.length==0)
						enabledArray.push(globalResourceCalDAVList.TodoCollections[1]);

					for(var c=0; c<enabledArray.length; c++)
					{
						$('#ResourceCalDAVTODOList .resourceCalDAVTODO_item[data-id="'+enabledArray[c].uid+'"]').css('display','block')
						enabledArray[c].makeLoaded=true;
						var uidParts=enabledArray[c].uid.match(rexo);
						globalSettings.loadedtodocollections.value.push(uidParts[1]+uidParts[3]);
						var resDOMItem=$('#ResourceCalDAVTODOList').find('.resourceCalDAVTODO_item[data-id="'+jqueryEscapeSelector(enabledArray[c].uid)+'"]');
						var resDOMHeader=resDOMItem.prevUntil('.resourceCalDAVTODO_header').last().prev();
						if(!resDOMHeader.length)
							resDOMHeader=resDOMItem.prev();
						resDOMHeader.css('display','block');
						resDOMItem.css('display','');
						resDOMItem.find('input[type=checkbox]').not('.unloadCheck').trigger('click');
						globalVisibleCalDAVTODOCollections.splice(globalVisibleCalDAVTODOCollections.length, 0, enabledArray[c].uid);
					}
				}
				$('#ResourceCalDAVList').children('.resourceCalDAV_header').each(function(){
					if(!$(this).nextUntil('.resourceCalDAV_header').filter(':visible').length)
						$(this).css('display','none');
				});
				$('#ResourceCalDAVTODOList').children('.resourceCalDAVTODO_header').each(function(){
					if(!$(this).nextUntil('.resourceCalDAVTODO_header').filter(':visible').length)
						$(this).css('display','none');
				});
				selectActiveCalendar();
			}

			if(isAvaible('CardDavMATE'))
			{
				if($('#ResourceCardDAVList .resourceCardDAV_item:visible').length==0 && globalResourceCardDAVList.collections.length>1)
				{
					var enabledArray=new Array();
					for(var c=0; c<globalResourceCardDAVList.collections.length; c++)
						if(globalResourceCardDAVList.collections[c].uid!=undefined)
						{
							var tmp=globalResourceCardDAVList.collections[c].accountUID.match(accRex);
							var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
							if(globalAccountSettings[0].href==resourceCalDAV_href && globalAccountSettings[0].userAuth.userName==globalResourceCardDAVList.collections[c].userAuth.userName)
								enabledArray.push(globalResourceCardDAVList.collections[c]);
						}

					if(enabledArray.length==0)
						enabledArray.push(globalResourceCardDAVList.collections[1]);

					for(var c=0; c<enabledArray.length; c++)
					{
						$('#ResourceCardDAVList .resourceCardDAV_item .resourceCardDAV[data-id="'+enabledArray[c].uid+'"]').parent().css('display','block')
						enabledArray[c].makeLoaded=true;
						//$('#ResourceCardDAVList').find('.resourceCardDAV_item .resourceCardDAV').find('input[data-id="'+enabledArray[c].uid+'"]').trigger('click');
						var uidParts=enabledArray[c].uid.match(rexo);
						globalSettings.loadedaddressbookcollections.value.push(uidParts[1]+uidParts[3]);
						globalSettings.activeaddressbookcollections.value.push(uidParts[1]+uidParts[3]);
					}
				}

				$('#ResourceCardDAVList').children('.resourceCardDAV_header').each(function(){
					if(!$(this).nextUntil('.resourceCardDAV_header').filter(':visible').length)
						$(this).css('display','none');
				});
			}

			loadNextApplication(true);
		}

		var isTodoAv=false,isEventAv=false;
		if(isAvaible('CalDavZAP'))
		{
			setCalendarNumber(false);
			selectActiveCalendar();
			var cals=globalResourceCalDAVList.TodoCollections;

			if(cals.length==0 || (cals.length==1 && typeof cals[0].uid=='undefined'))
			{
				$('#intCaldavTodo').css('display','none');
				isTodoAv=false;
			}
			else
			{
				$('#intCaldavTodo').css('display','block');
				isTodoAv=true;
			}

			var calendarsArray=new Array();
			for(var i=0; i<cals.length; i++)
				if(cals[i].uid!=undefined)
					calendarsArray[calendarsArray.length]={displayValue:cals[i].displayvalue,uid:cals[i].uid, permissions_read_only:cals[i].permissions.read_only,makeLoaded:cals[i].makeLoaded};
			calendarsArray.sort(customResourceCompare);
			globalResourceCalDAVList.sortedTodoCollections=calendarsArray;
			var cals=globalResourceCalDAVList.collections;

			if(cals.length==0 || (cals.length==1 && typeof cals[0].uid=='undefined'))
			{
				$('#intCaldav').css('display','none');
				isEventAv=false;
			}
			else
			{
				$('#intCaldav').css('display','block');
				isEventAv=true;
			}

			calendarsArray=new Array();
			for(var i=0; i<cals.length; i++)
				if(cals[i].uid!=undefined)
					calendarsArray[calendarsArray.length]={displayValue:cals[i].displayvalue,uid:cals[i].uid, permissions_read_only:cals[i].permissions.read_only, makeLoaded:cals[i].makeLoaded};
			calendarsArray.sort(customResourceCompare);
			globalResourceCalDAVList.sortedCollections = calendarsArray;
		}

		var isAddrAv=false;
		if(isAvaible('CardDavMATE'))
		{
			selectActiveAddressbook();
			for(var adr in globalAddressbookList.vcard_groups)
			{
				if(globalAddressbookList.vcard_groups[adr].length>0)
				{
					extendDestSelect();
					if(typeof $('#vCardEditor').attr('data-vcard-uid')=='undefined')
						$('#vCardEditor').find('[data-attr-name="_DEST_"]').find('optiotn[data-type$="'+$('#ResourceCardDAVList').find('.resourceCardDAV_selected').find(':input[data-id]').attr('data-id')+'"]').prop('selected',true);
				}
			}

			var addrs=globalResourceCardDAVList.collections;
			if(addrs.length==0 || (addrs.length==1 && typeof addrs[0].uid == 'undefined'))
			{
				$('#intCarddav').css('display','none');
				isAddrAv=false;
			}
			else
			{
				isAddrAv=true;
				$('#intCarddav').css('display','block');
			}
		}

		if((isAvaible('CalDavZAP') && !isCalDAVLoaded) || (isAvaible('CardDavMATE') && !isCardDAVLoaded))
		{
			if(isAvaible('CalDavZAP'))
			{
				if(globalActiveApp=='CalDavTODO')
					if(!isTodoAv)
						globalActiveApp=null;

				if(globalActiveApp==null || globalActiveApp=='CalDavZAP')
				{
					if(!isEventAv)
						globalActiveApp=null;
					else
						globalActiveApp='CalDavZAP';
				}
			}
			if(isAvaible('CardDavMATE') && (globalActiveApp==null || globalActiveApp=='CardDavMATE'))
			{
				if(!isAddrAv)
					globalActiveApp=null;
				else
					globalActiveApp='CardDavMATE';
			}
			if(globalActiveApp!=null)
				checkForApplication(globalActiveApp);
		}

		ifLoadCollections();
		if(isAvaible('CalDavZAP'))
		{
			if($('#ResourceCalDAVList .resourceCalDAV_item:visible').not('.resourceCalDAV_item_ro').length==0)
			{
				$('#eventFormShower').css('display','none');
				$('#calendar').fullCalendar('setOptions',{'selectable':false});
			}
			else
			{
				$('#eventFormShower').css('display','block');
				$('#calendar').fullCalendar('setOptions',{'selectable':true});
			}

			if($('#ResourceCalDAVTODOList .resourceCalDAVTODO_item:visible').not('.resourceCalDAV_item_ro').length==0)
				$('#eventFormShowerTODO').css('display','none');
			else
				$('#eventFormShowerTODO').css('display','block');
		}
		return false;
	}
	else if(indexR>=globalAccountSettings.length && !settingsLoaded)
	{
		console.log("Error: [netFindResource]: 'Unable to load resources'");
		return false;
	}

	var re=new RegExp('^(https?://)([^/]+)(.*)','i');
	var tmp=inputResource.href.match(re);
	var uidBase=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2];
	var uidFull=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2]+tmp[3];	// for the error handler
	var settingsXML='';
	if(inputResource.href.indexOf(globalLoginUsername)!=-1 && inputResource.settingsAccount && (globalSettings.settingstype.value=='' || globalSettings.settingstype.value==null || (globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null && globalSettings.settingstype.value=='principal-URL')))
		settingsXML='<I:settings xmlns:I="http://inf-it.com/ns/dav/"/>';

	var baseHref=tmp[1]+tmp[2];
	if(typeof inputResource.extendedDelegation!='undefined' && inputResource.extendedDelegation && (typeof inputResource.abhref!='undefined' || typeof inputResource.cahref!='undefined'))
	{
		if(isAvaible('CardDavMATE') && isAvaible('CalDavZAP'))
		{
			if(inputResource.abhref==inputResource.cahref)
				netLoadResource(inputResource, inputResource.abhref, false, inputResourceIndex, forceLoad, indexR, loadArray);
			else
				netLoadResource(inputResource, inputResource.abhref, true, inputResourceIndex, forceLoad, indexR, loadArray);
		}
		else if(isAvaible('CardDavMATE'))
			netLoadResource(inputResource, inputResource.abhref, false, inputResourceIndex, forceLoad, indexR, loadArray);
		else if(isAvaible('CalDavZAP'))
			netLoadResource(inputResource, inputResource.cahref, false, inputResourceIndex, forceLoad, indexR, loadArray);
		return false;
	}

	$.ajax({
		type: 'PROPFIND',
		url: inputResource.href,
		cache: false,
		crossDomain: (typeof inputResource.crossDomain=='undefined' ? true : inputResource.crossDomain),
		xhrFields: {
			withCredentials: (typeof inputResource.withCredentials=='undefined' ? false : inputResource.withCredentials)
		},
		timeout: inputResource.timeOut,
		beforeSend: function(req) {
			if(globalSettings.usejqueryauth.value!=true && inputResource.userAuth.userName!='' && inputResource.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(inputResource.userAuth.userName,inputResource.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
			req.setRequestHeader('Depth', '0');
			if(globalSettingsSaving!=''||(isAvaible('CardDavMATE') && (!globalCardDAVInitLoad && !globalCardDAVResourceSync)) || (isAvaible('CalDavZAP') && (!globalCalDAVInitLoad && !globalCalDAVResourceSync))||(isAvaible('Projects') && isProjectsLoaded))
				/* XXX - System display:none changes */
				if(globalSettingsSaving!='' || (isAvaible('Settings') && $('#SystemSettings').css('visibility')=='visible' && $('.resourceSettings_item_selected').attr('data-type')=='setting_group_password'))
				{
					indexR++;
					if(((isAvaible('CardDavMATE') && globalCardDAVInitLoad) || (isAvaible('CalDavZAP') && globalCalDAVInitLoad)) && indexR==globalAccountSettings.length)
						$('#MainLoader').fadeOut(1200);
					netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
					return false;
				}
		},
		username: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userPassword : null),
		contentType: 'text/xml; charset=utf-8',
		processData: true,
		data: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop>'+settingsXML+'<D:current-user-privilege-set/><D:displayname/><D:resourcetype/><L:calendar-home-set xmlns:L="urn:ietf:params:xml:ns:caldav"/><R:addressbook-home-set xmlns:R="urn:ietf:params:xml:ns:carddav"/></D:prop></D:propfind>',
		dataType: 'xml',
		error: function(objAJAXRequest, strError){
			console.log("Error: [netFindResource: 'PROPFIND "+uidFull+"']: code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			indexR++;
			inputResource.errorLoaded=true;
			if(isAvaible('CalDavZAP'))
			{
				$('#intCaldav').find('.int_error').css('display', 'block');
				$('#intCaldavTodo').find('.int_error').css('display', 'block');
			}
			if(isAvaible('CardDavMATE'))
				$('#intCarddav').find('.int_error').css('display', 'block');
			var allFail=true;
			for(var i=0; i< globalAccountSettings.length; i++)
				if(typeof globalAccountSettings[i].errorLoaded=='undefined' || globalAccountSettings[i].errorLoaded==null || globalAccountSettings[i].errorLoaded===false)
					allFail=false;
			if(((isAvaible('CardDavMATE') && globalCardDAVInitLoad) || (isAvaible('CalDavZAP' && globalCalDAVInitLoad)))  && indexR==globalAccountSettings.length && allFail)
				$('#MainLoader').fadeOut(1200);
			else if((isAvaible('CardDavMATE') && !globalCardDAVInitLoad) || (isAvaible('CalDavZAP') && !globalCalDAVInitLoad))
			{
				if(isAvaible('CalDavZAP'))
					handleCalDAVError(true, inputResource);
				if(isAvaible('CardDavMATE'))
					handleCardDAVError(true, inputResource)
			}
			netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
			return false;
		},
		success: function(data, textStatus, xml)
		{
			inputResource.errorLoaded=false;
			if(isAvaible('CalDavZAP') && isEachResourceLoaded())
			{
				$('#intCaldav').find('.int_error').css('display', 'none');
				$('#intCaldavTodo').find('.int_error').css('display', 'none');
			}

			if(isAvaible('CardDavMATE') && isEachResourceLoaded())
				$('#intCarddav').find('.int_error').css('display','none');

			if(isAvaible('CalDavZAP') && !globalCalDAVInitLoad)
				handleCalDAVError(false, inputResource);

			if(isAvaible('CardDavMATE') && !globalCardDAVInitLoad)
				handleCardDAVError(false, inputResource);

			if(!settingsLoaded && inputResource.href.indexOf(globalLoginUsername)!=-1 && inputResource.settingsAccount && (globalSettings.settingstype.value=='' || globalSettings.settingstype.value==null || (globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null && globalSettings.settingstype.value=='principal-URL')))
			{
				var settings=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('settings').text();
				if(settings!='')
				{
					if(!ignoreServerSettings)
						loadSettings(settings, true, false);
					else
					{
						delete globalSettings.version.value;
						loadSettings(JSON.stringify(globalSettings), false, false);
						console.log('Ignoring server settings: '+'\n'+settings);
					}
				}
				else
				{
					delete globalSettings.version.value;
					loadSettings(JSON.stringify(globalSettings), false, false);
				}
			}
			else if(!globalSyncSettingsSave && inputResource.href.indexOf(globalLoginUsername)!=-1 && ((isAvaible('CardDavMATE')&&globalCardDAVResourceSync) || (isAvaible('CalDavZAP')&&globalCalDAVResourceSync)))
			{
				globalSyncSettingsSave=true;
				var loadedCals = new Array(), loadedTodoCals = new Array(), loadedAddrs = new Array();
				if(isAvaible('CardDavMATE'))
					loadedAddrs = globalSettings.loadedaddressbookcollections.value.slice();
				if(isAvaible('CalDavZAP'))
				{
					loadedCals = globalSettings.loadedcalendarcollections.value.slice();
					loadedTodoCals = globalSettings.loadedtodocollections.value.slice();
				}
				var settings = $(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('settings').text();
				if(typeof globalPreviousSupportedSettings !='undefined' && globalPreviousSupportedSettings!=null)
					loadSettings(settings, true, true);
				if(isAvaible('CardDavMATE'))
					globalSettings.loadedaddressbookcollections.value = loadedAddrs.slice();
				if(isAvaible('CalDavZAP'))
				{
					globalSettings.loadedcalendarcollections.value = loadedCals.slice();
					globalSettings.loadedtodocollections.value = loadedTodoCals.slice();
				}
				checkBeforeClose(false);
			}

			var response=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response');

			var addressbook_home=response.children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('addressbook-home-set').children().filterNsNode('href').text();
			if(addressbook_home=='')	// addressbook-home-set has no 'href' value -> SabreDav
				addressbook_home=response.children().filterNsNode('href').text().replace('/principals/users/caldav.php','/caldav.php');

			if(addressbook_home.match(RegExp('^https?://','i'))!=null)	// absolute URL returned
				inputResource.abhref=addressbook_home;
			else	// relative URL returned
				inputResource.abhref=baseHref+addressbook_home;
			var calendar_home=response.children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-home-set').children().filterNsNode('href').text();
			if(calendar_home=='')	// addressbook-home-set has no 'href' value -> SabreDav
				calendar_home=response.children().filterNsNode('href').text().replace('/principals/users/caldav.php','/caldav.php');

			if(calendar_home.match(RegExp('^https?://','i'))!=null)	// absolute URL returned
				inputResource.cahref=calendar_home;
			else	// relative URL returned
				inputResource.cahref=baseHref+calendar_home;

			if(isAvaible('CardDavMATE') && isAvaible('CalDavZAP'))
			{
				if(inputResource.abhref==inputResource.cahref)
					netLoadResource(inputResource, inputResource.abhref, false, inputResourceIndex, forceLoad, indexR, loadArray);
				else
					netLoadResource(inputResource, inputResource.abhref, true, inputResourceIndex, forceLoad, indexR, loadArray);
			}
			else if(isAvaible('CardDavMATE'))
				netLoadResource(inputResource, inputResource.abhref, false, inputResourceIndex, forceLoad, indexR, loadArray);
			else if(isAvaible('CalDavZAP'))
				netLoadResource(inputResource, inputResource.cahref, false, inputResourceIndex, forceLoad, indexR, loadArray);
		}
	});
}

function netLoadResource(inputResource, inputHref, hrefMode, inputResourceIndex, forceLoad, indexR, loadArray)
{
	var re=new RegExp('^(https?://)([^/]+)(.*)','i');
	if(!isAvaible('CardDavMATE') || !globalCardDAVInitLoad || (globalCardDAVInitLoad && typeof inputResource.addressbookNo == 'undefined'))
		inputResource.addressbookNo=0;
	if(!isAvaible('CalDavZAP') || !globalCalDAVInitLoad || (globalCalDAVInitLoad && typeof inputResource.calendarNo=='undefined' && typeof inputResource.todoNo=='undefined'))
	{
		inputResource.calendarNo=0;
		inputResource.todoNo=0;
	}
	var tmp=inputResource.abhref.match(re);
	var baseHref=tmp[1]+tmp[2];
	var uidBase=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2];
	var uidFull=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2]+tmp[3];	// for the error handler

	var tmp=inputResource.href.match(RegExp('^(https?://)(.*)','i'));
	var origUID=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2];

	if(typeof globalSubscribedCalendars!='undefined' && globalSubscribedCalendars!=null && typeof inputResource.calendars!='undefined' && inputResource.calendars!=null && inputResource.calendars.length>0)
	{
		var tmp1=inputResource.href.match(RegExp('^(https?://)(.*)', 'i'));
		var origUID1=tmp1[1]+inputResource.userAuth.userName+'@'+tmp1[2];
		var resultTimestamp=new Date().getTime();
		for(var k=0; k<globalSubscribedCalendars.calendars.length; k++)
		{
			color=globalSubscribedCalendars.calendars[k].color;
			if(color=='')
			{
				var par=(uidBase+globalSubscribedCalendars.calendars[k].href).split('/');
				var hash=hex_sha256(hex_sha256(par[par.length-3]+'/'+par[par.length-2]+'/'));
				var hex=hash.substring(0,6);
				while(checkColorBrightness(hex)>=252)
					hex=hex_sha256(hex_sha256(hash)).substring(0,6);
				color='#'+hex;
			}
			var syncRequired=true;
			var uidPArts=(uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/').split('/');
			if(globalSubscribedCalendars.calendars[k].typeList.indexOf('vevent')!=-1)
			{
				var uidParts=(uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/').match(RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)'));
				var checkHref=uidParts[1]+uidParts[3];
				if(!isHrefSet)
				{
					saveHref=uidBase+href;
					isHrefSet=true;
				}
				if(!globalDefaultCalendarCollectionLoadAll)
				{
					var toBeLoad=false;
					if(typeof globalCrossServerSettingsURL!='undefined' && globalCrossServerSettingsURL!=null && globalCrossServerSettingsURL)
					{
						var uidParts=(uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/').match(RegExp('/([^/]+/[^/]+/)$'));
						var tmpParts=uidParts[1].match('^(.*/)([^/]+)/$');
						var checkHref3=decodeURIComponent(tmpParts[1])+tmpParts[2]+'/';
						var found=false;
						for(var l=0; l<globalSettings.loadedcalendarcollections.value.length; l++)
						{
							var tmpParts2=globalSettings.loadedcalendarcollections.value[l].match('^(.*/)([^/]+)/([^/]+)/$');
							var checkHref2=decodeURIComponent(tmpParts2[2])+'/'+tmpParts2[3]+'/';
							if(checkHref3==checkHref2)
							{
								found=true;
								globalSettings.loadedcalendarcollections.value[l]=checkHref;
								break;
							}
						}
						toBeLoad=found;
					}
					else
						toBeLoad=globalSettings.loadedcalendarcollections.value.indexOf(checkHref)!=-1;
				}
				else
				{
					if(globalCalDAVInitLoad)
						globalSettings.loadedcalendarcollections.value.push(checkHref);
					var toBeLoad=true;
				}
				globalResourceCalDAVList.insertResource({makeLoaded:toBeLoad, typeList:globalSubscribedCalendars.calendars[k].typeList, listType:'vevent', syncRequired:syncRequired, ecolor: color, timestamp: resultTimestamp, uid: uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/', timeOut: inputResource.timeOut, displayvalue: globalSubscribedCalendars.calendars[k].displayName, userAuth: globalSubscribedCalendars.calendars[k].userAuth, resourceIndex: indexR, url: baseHref, accountUID: origUID1, href: globalSubscribedCalendars.calendars[k].href, hrefLabel: globalSubscribedCalendars.hrefLabel, permissions: {full: [], read_only: true}, crossDomain: inputResource.crossDomain, withCredentials: inputResource.withCredentials, interval: null, waitInterval: null, displayEventsArray: new Array(), pastUnloaded: '', fcSource: null,subscription: true, newlyAdded:toBeLoad, urlArray: new Array(), ignoreAlarms:globalSubscribedCalendars.calendars[k].ignoreAlarm,webdav_bind:false}, indexR, true);
				if(inputResource!=undefined)
					inputResource.calendarNo++;
				syncRequired=false;
			}
			if(globalSubscribedCalendars.calendars[k].typeList.indexOf('vtodo')!=-1)
			{
				var uidParts=(uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/').match(RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)'));
				var checkHref=uidParts[1]+uidParts[3];
				if(!isHrefSet)
				{
					saveHref=uidBase+href;
					isHrefSet=true;
				}
				if(!globalDefaultTodoCalendarCollectionLoadAll)
				{
					var toBeLoad=false;
					if(typeof globalCrossServerSettingsURL!='undefined'&&globalCrossServerSettingsURL!=null&globalCrossServerSettingsURL)
					{
						var uidParts=(uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/').match(RegExp('/([^/]+/[^/]+/)$'));
						var tmpParts=uidParts[1].match('^(.*/)([^/]+)/$');
						var checkHref3=decodeURIComponent(tmpParts[1])+tmpParts[2]+'/';
						var found=false;
						for(var l=0; l<globalSettings.loadedtodocollections.value.length; l++)
						{
							var tmpParts2=globalSettings.loadedtodocollections.value[l].match('^(.*/)([^/]+)/([^/]+)/$');
							var checkHref2=decodeURIComponent(tmpParts2[2])+'/'+tmpParts2[3]+'/';
							if(checkHref3==checkHref2)
							{
								found=true;
								globalSettings.loadedtodocollections.value[l]=checkHref;
								break;
							}
						}
						toBeLoad=found;
					}
					else
						toBeLoad=globalSettings.loadedtodocollections.value.indexOf(checkHref)!=-1;
				}
				else
				{
					var toBeLoad=true;
					if(globalCalDAVInitLoad)
						globalSettings.loadedtodocollections.value.push(checkHref);
				}
				globalResourceCalDAVList.insertResource({makeLoaded:toBeLoad, typeList:globalSubscribedCalendars.calendars[k].typeList, listType:'vtodo', syncRequired:syncRequired, ecolor: color, timestamp: resultTimestamp, uid: uidBase+'/'+globalSubscribedCalendars.calendars[k].href+'/', timeOut: inputResource.timeOut, displayvalue: globalSubscribedCalendars.calendars[k].displayName, userAuth: globalSubscribedCalendars.calendars[k].userAuth, resourceIndex: indexR, url: baseHref, accountUID: origUID1, href: globalSubscribedCalendars.calendars[k].href, hrefLabel: globalSubscribedCalendars.hrefLabel, permissions: {full: [], read_only: true}, crossDomain: inputResource.crossDomain, withCredentials: inputResource.withCredentials, interval: null, waitInterval: null, displayEventsArray: new Array(), pastUnloaded: '', fcSource: null,subscription: true, newlyAdded:toBeLoad, urlArray: new Array(), ignoreAlarms:globalSubscribedCalendars.calendars[k].ignoreAlarm,webdav_bind:false}, indexR, false);
				if(inputResource!=undefined)
					inputResource.todoNo++;
			}
		}

		//recursive call for resource loading
		indexR++;
		netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
		return true;
	}

	var settingsXML='';
	if(inputResource.href.indexOf(globalLoginUsername)!=-1 && inputResource.settingsAccount && globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null)
		if((globalSettings.settingstype.value=='addressbook-home-set' && inputResource.abhref==inputHref) || (globalSettings.settingstype.value=='calendar-home-set' && inputResource.cahref==inputHref) || (globalSettings.settingstype.value=='principal-URL'&& ((isAvaible('CardDavMATE')&&globalCardDAVResourceSync) || (isAvaible('CalDavZAP')&&globalCalDAVResourceSync))))
			settingsXML='<I:settings xmlns:I="http://inf-it.com/ns/dav/"/>';

	function ajaxComplete(data, textStatus, xml)
	{
		var Rname='';
		inputResource.errorLoaded=false;
		if(isAvaible('CalDavZAP') && isEachResourceLoaded())
		{
			$('#intCaldav').find('.int_error').css('display','none');
			$('#intCaldavTodo').find('.int_error').css('display','none');
		}
		if(isAvaible('CardDavMATE') && isEachResourceLoaded())
			$('#intCarddav').find('.int_error').css('display','none');
		if(isAvaible('CalDavZAP') && !globalCalDAVInitLoad)
			handleCalDAVError(false, inputResource);
		if(isAvaible('CardDavMATE') && !globalCardDAVInitLoad)
			handleCardDAVError(false, inputResource);
		var saveHref='';
		isHrefSet=false;
		var calendarNo=0;
		var resultTimestamp=new Date().getTime();
		if(!settingsLoaded && inputResource.href.indexOf(globalLoginUsername)!=-1 && inputResource.settingsAccount && globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null)
		{
			if((globalSettings.settingstype.value=='addressbook-home-set' && inputResource.abhref==inputHref) || (globalSettings.settingstype.value=='calendar-home-set' && inputResource.cahref==inputHref))
			{
				var settings=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('settings').text();
				if(settings!='')
				{
					if(!ignoreServerSettings)
						loadSettings(settings, true, false);
					else
					{
						delete globalSettings.version.value;
						loadSettings(JSON.stringify(globalSettings), false, false);
						console.log('Ignoring server settings: '+'\n'+settings);
					}
				}
				else
				{
					var calSettings=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('cal-settings').text();
					if(calSettings!='')
					{
						if(!ignoreServerSettings)
							loadSettings(calSettings, true, false);
						else
						{
							delete globalSettings.version.value;
							loadSettings(JSON.stringify(globalSettings), false, false);
							console.log('Ignoring server settings: '+'\n'+calSettings);
						}
					}
					else
					{
						delete globalSettings.version.value;
						loadSettings(JSON.stringify(globalSettings), false, false);
					}
				}
			}
		}
		else if(!settingsLoaded && inputResource.href.indexOf(globalLoginUsername)!=-1)
		{
			delete globalSettings.version.value;
			loadSettings(JSON.stringify(globalSettings), false, false);
		}
		else if(!globalSyncSettingsSave && inputResource.href.indexOf(globalLoginUsername)!=-1 && ((isAvaible('CardDavMATE')&&globalCardDAVResourceSync) || (isAvaible('CalDavZAP')&&globalCalDAVResourceSync)))
		{
			globalSyncSettingsSave=true;
			var loadedCals = new Array(), loadedTodoCals = new Array(), loadedAddrs = new Array();
			if(isAvaible('CardDavMATE'))
				loadedAddrs = globalSettings.loadedaddressbookcollections.value.slice();
			if(isAvaible('CalDavZAP'))
			{
				loadedCals = globalSettings.loadedcalendarcollections.value.slice();
				loadedTodoCals = globalSettings.loadedtodocollections.value.slice();
			}
			var settings = $(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('settings').text();
			if(typeof globalPreviousSupportedSettings !='undefined' && globalPreviousSupportedSettings!=null)
				loadSettings(settings, true, true);
			if(isAvaible('CardDavMATE'))
				globalSettings.loadedaddressbookcollections.value = loadedAddrs.slice();
			if(isAvaible('CalDavZAP'))
			{
				globalSettings.loadedcalendarcollections.value = loadedCals.slice();
				globalSettings.loadedtodocollections.value = loadedTodoCals.slice();
			}
			checkBeforeClose(false);
		}

		$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').each(function(index, element){
			$(element).children().filterNsNode('propstat').each(function(pindex, pelement){
				var resources=$(pelement).children().filterNsNode('prop');
				var color='';

				var typeList=new Array();
				resources.children().filterNsNode('supported-calendar-component-set').children().filterNsNode('comp').each(function(pindex, pelement){
					typeList[typeList.length]=pelement.getAttribute('name').toLowerCase();
				});

				if(typeof inputResource!='undefined' && typeof inputResource.collectionTypes!='undefined' && inputResource.collectionTypes!=null && inputResource.collectionTypes.indexOf('calendar')!=-1 ||
					typeof inputResource=='undefined' || inputResource.collectionTypes==null)
					if((isAvaible('CalDavZAP') && resources.children().filterNsNode('resourcetype').children().filterNsNode('calendar').length==1 && resources.children().filterNsNode('resourcetype').children().filterNsNode('collection').length==1) && (inputResource.ignoreBound==undefined || !(inputResource.ignoreBound==true && resources.children().filterNsNode('resourcetype').children().filterNsNode('webdav-binding').length==1)))
					{
						if(resources.children().filterNsNode('calendar-color').length==1)
						{
							color=resources.children().filterNsNode('calendar-color').text();
							if(color.length==9)
								color=color.substring(0, 7);
						}

						var permissions=new Array();
						resources.children().filterNsNode('current-user-privilege-set').children().filterNsNode('privilege').each(
							function(index, element)
							{
								$(element).children().each(
									function(index, element)
									{
										permissions[permissions.length]=$(element).prop('tagName').replace(/^[^:]+:/,'');
									}
								);
							}
						);

						var read_only=false;
						var href=$(element).children().filterNsNode('href').text();
						if(href.match(RegExp('^https?://','i'))!=null)
						{
							var tmpH = href.match(RegExp('^(https?://)([^/]+)(.*)','i'))
							if(tmpH!=null)
								href = tmpH[3];
						}

						if(permissions.length>0 && permissions.indexOf('all')==-1 && permissions.indexOf('write')==-1 && permissions.indexOf('write-content')==-1)
							read_only=true;
						else if(inputResource.forceReadOnly!=undefined && (inputResource.forceReadOnly==true || inputResource.forceReadOnly instanceof Array))
						{
							if(inputResource.forceReadOnly instanceof Array)
							{
								for(var j=0; j<inputResource.forceReadOnly.length; j++)
									if(typeof inputResource.forceReadOnly[j]=='string')
									{
										var index=href.indexOf(inputResource.forceReadOnly[j]);
										if(index!=-1)
											if(href.length==(index+inputResource.forceReadOnly[j].length))
												read_only=true;
									}
									else if(typeof inputResource.forceReadOnly[j]=='object')
									{
										if(href.match(inputResource.forceReadOnly[j]) != null)
											read_only=true;
									}
							}
							else
								read_only=true;
						}
						var displayvalue=resources.children().filterNsNode('displayname').text();
						var headervalue=resources.children().filterNsNode('headervalue').text();
						var synctoken=resources.children().filterNsNode('sync-token').text();
						var oldSyncToken='';
						var tmp_dv=href.match(RegExp('.*/([^/]+)/$', 'i'));

						if(displayvalue=='') // MacOSX Lion Server
							displayvalue=tmp_dv[1];

						if(color=='')
						{
							var par=(uidBase+href).split('/');
							var hash=hex_sha256(hex_sha256(par[par.length-3]+'/'+par[par.length-2]+'/'));
							var hex=hash.substring(0,6);
							while(checkColorBrightness(hex)>=252)
								hex=hex_sha256(hex_sha256(hash)).substring(0,6);
							color='#'+hex;
						}
						var ignoreAlarms=false;
						var uidPArts=(uidBase+href).split('/');
						if(typeof inputResource.ignoreAlarms=='boolean' && inputResource.ignoreAlarms)
							ignoreAlarms = true;
						else if(inputResource.ignoreAlarms instanceof Array && inputResource.ignoreAlarms.length>0)
						{
							for(var j=0; j<inputResource.ignoreAlarms.length; j++)
							{
								if(typeof inputResource.ignoreAlarms[j]=='string')
								{
									var index=href.indexOf(inputResource.ignoreAlarms[j]);
									if(index!=-1)
										if(href.length==(index+inputResource.ignoreAlarms[j].length))
											ignoreAlarms=true;
								}
								else if (typeof inputResource.ignoreAlarms[j]=='object' && href.match(inputResource.ignoreAlarms[j])!=null)
									ignoreAlarms = true;
							}
						}

						// insert the resource
						var webdav_bind=false;
						if(resources.children().filterNsNode('resourcetype').children().filterNsNode('webdav-binding').length==1)
							webdav_bind=true;

						var checkContentType=(inputResource.checkContentType==undefined ? true : inputResource.checkContentType);

						var syncRequired=true;
						if(typeList.indexOf('vevent')!=-1)
						{
							var someChanged=false;
							var existingResource=globalResourceCalDAVList.getEventCollectionByUID(uidBase+href);
							if(existingResource!=null)
							{
								if(existingResource.syncToken!=synctoken)
									someChanged=true;
							}
							else
							{
								someChanged=true;
								if(synctoken=='')
									synctoken=null;
							}
							var uidParts=(uidBase+href).match(RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)'));
							var checkHref=uidParts[1]+uidParts[3];
							if(!isHrefSet)
							{
								saveHref=uidBase+href;
								isHrefSet=true;
							}
							if(!globalDefaultCalendarCollectionLoadAll)
							{
								var toBeLoad=false;
								if(typeof globalCrossServerSettingsURL!='undefined' && globalCrossServerSettingsURL!=null && globalCrossServerSettingsURL)
								{
									var uidParts=(uidBase+href).match(RegExp('/([^/]+/[^/]+/)$'));
									var tmpParts=uidParts[1].match('^(.*/)([^/]+)/$');
									var checkHref3=decodeURIComponent(tmpParts[1])+tmpParts[2]+'/';
									var found=false;
									for(var l=0; l<globalSettings.loadedcalendarcollections.value.length; l++)
									{
										var tmpParts2=globalSettings.loadedcalendarcollections.value[l].match('^(.*/)([^/]+)/([^/]+)/$');
										var checkHref2=decodeURIComponent(tmpParts2[2])+'/'+tmpParts2[3]+'/';
										if(checkHref3==checkHref2)
										{
											found=true;
											globalSettings.loadedcalendarcollections.value[l]=checkHref;
											break;
										}
									}
									toBeLoad=found;
								}
								else
									toBeLoad=globalSettings.loadedcalendarcollections.value.indexOf(checkHref)!=-1;
							}
							else
							{
								var toBeLoad=true;
								if(globalCalDAVInitLoad)
									globalSettings.loadedcalendarcollections.value.push(checkHref);
							}
							if(!toBeLoad)
								oldSyncToken='';
							globalResourceCalDAVList.insertResource({makeLoaded:toBeLoad, typeList:typeList, listType:'vevent', ecolor: color, timestamp: resultTimestamp, uid: uidBase+href, timeOut: inputResource.timeOut, displayvalue: displayvalue, headervalue:headervalue, userAuth: inputResource.userAuth, resourceIndex: indexR, url: baseHref, accountUID: origUID, href: href, hrefLabel: inputResource.hrefLabel, permissions: {full: permissions, read_only: read_only}, crossDomain: inputResource.crossDomain, withCredentials: inputResource.withCredentials, interval: null, waitInterval: null, displayEventsArray: new Array(), pastUnloaded: '', fcSource: null, subscription: false, newlyAdded:toBeLoad, urlArray:null, ignoreAlarms:ignoreAlarms,webdav_bind:webdav_bind, syncRequired:syncRequired, checkContentType: checkContentType, syncToken: synctoken, oldSyncToken: oldSyncToken, someChanged:someChanged}, indexR, true);
							if(globalAccountSettings[indexR]!=undefined)
								globalAccountSettings[indexR].calendarNo++;
							syncRequired=false;
						}
						if(typeList.indexOf('vtodo')!=-1)
						{
							var someChanged=false;
							var existingResource=globalResourceCalDAVList.getTodoCollectionByUID(uidBase+href);
							if(syncRequired && existingResource!=null)
							{
								if(existingResource.syncToken!=synctoken)
									someChanged=true;
							}
							else
							{
								someChanged=true;
								if(synctoken=='')
									synctoken=null;
							}
							var uidParts=(uidBase+href).match(RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)'));
							var checkHref=uidParts[1]+uidParts[3];
							if(!isHrefSet)
							{
								saveHref=uidBase+href;
								isHrefSet=true;
							}
							if(!globalDefaultTodoCalendarCollectionLoadAll)
							{
								var toBeLoad=false;
								if(typeof globalCrossServerSettingsURL!='undefined' && globalCrossServerSettingsURL!=null && globalCrossServerSettingsURL)
								{
									var uidParts=(uidBase+href).match(RegExp('/([^/]+/[^/]+/)$'));
									var tmpParts=uidParts[1].match('^(.*/)([^/]+)/$');
									var checkHref3=decodeURIComponent(tmpParts[1])+tmpParts[2]+'/';
									var found=false;
									for(var l=0; l<globalSettings.loadedtodocollections.value.length; l++)
									{
										var tmpParts2=globalSettings.loadedtodocollections.value[l].match('^(.*/)([^/]+)/([^/]+)/$');
										var checkHref2=decodeURIComponent(tmpParts2[2])+'/'+tmpParts2[3]+'/';
										if(checkHref3==checkHref2)
										{
											found=true;
											globalSettings.loadedtodocollections.value[l]=checkHref;
											break;
										}
									}
									toBeLoad=found;
								}
								else
									toBeLoad=globalSettings.loadedtodocollections.value.indexOf(checkHref)!=-1;
							}
							else
							{
								var toBeLoad=true;
								if(globalCalDAVInitLoad)
									globalSettings.loadedtodocollections.value.push(checkHref);
							}
							if(!toBeLoad)
								oldSyncToken='';
							globalResourceCalDAVList.insertResource({makeLoaded:toBeLoad, typeList:typeList, hrefArray: new Array(), listType:'vtodo', ecolor: color, timestamp: resultTimestamp, uid: uidBase+href, timeOut: inputResource.timeOut, displayvalue: displayvalue, headervalue: headervalue, userAuth: inputResource.userAuth, resourceIndex: indexR, url: baseHref, accountUID: origUID, href: href, hrefLabel: inputResource.hrefLabel, permissions: {full: permissions, read_only: read_only}, crossDomain: inputResource.crossDomain, withCredentials: inputResource.withCredentials, interval: null, waitInterval: null, displayEventsArray: new Array(), pastUnloaded: '', fcSource: null, subscription: false, newlyAdded:toBeLoad, urlArray:null, ignoreAlarms:ignoreAlarms,webdav_bind:webdav_bind,syncRequired:syncRequired, checkContentType: checkContentType, syncToken: synctoken, oldSyncToken: oldSyncToken, someChanged:someChanged}, indexR, false);
							if(globalAccountSettings[indexR]!=undefined)
								globalAccountSettings[indexR].todoNo++;
						}
					}

					if(typeof inputResource!='undefined' && typeof inputResource.collectionTypes!='undefined' && inputResource.collectionTypes!=null && inputResource.collectionTypes.indexOf('addressbook')!=-1 || typeof inputResource=='undefined' || inputResource.collectionTypes==null)
						if((isAvaible('CardDavMATE') && resources.children().filterNsNode('resourcetype').children().filterNsNode('addressbook').length==1 && resources.children().filterNsNode('resourcetype').children().filterNsNode('collection').length==1) && (inputResource.ignoreBound==undefined || !(inputResource.ignoreBound==true && resources.children().filterNsNode('resourcetype').children().filterNsNode('webdav-binding').length==1)))
						{
							if(resources.children().filterNsNode('addressbook-color').length==1)
							{
								color=resources.children().filterNsNode('addressbook-color').text();
								if(color.length==9)
									color=color.substring(0, 7);
							}

							var permissions=new Array();
							resources.children().filterNsNode('current-user-privilege-set').children().filterNsNode('privilege').each(
								function(index, element)
								{
									$(element).children().each(
										function(index, element)
										{
											permissions[permissions.length]=$(element).prop('tagName').replace(/^[^:]+:/,'');
										}
									);
								}
							);

							var disableLocking=false;
							var tmp_lock_support=resources.children().filterNsNode('supportedlock').children().filterNsNode('lockentry').children().filterNsNode('lockscope').children().filterNsNode('exclusive');
							if(typeof tmp_lock_support=='undefined' || tmp_lock_support.length==undefined || tmp_lock_support.length==0)
								disableLocking=true;

							var href=$(element).children().filterNsNode('href').text();
							if(href.match(RegExp('^https?://','i'))!=null)
							{
								var tmpH = href.match(RegExp('^(https?://)([^/]+)(.*)','i'))
								if(tmpH!=null)
									href = tmpH[3];
							}
							var tmp_cn=href.match(RegExp('/([^/]+)/?$'));	// collection name

							var read_only=false;
							if(((typeof globalDisablePermissionChecking=='undefined' || globalDisablePermissionChecking!=true) && (permissions.length>0 && permissions.indexOf('all')==-1 && permissions.indexOf('write')==-1 && permissions.indexOf('write-content')==-1)) || (inputResource.forceReadOnly!=undefined && (inputResource.forceReadOnly==true || inputResource.forceReadOnly instanceof Array && inputResource.forceReadOnly.indexOf(tmp_cn[1])!=-1)))
								read_only=true;

							var displayvalue=resources.children().filterNsNode('displayname').text();
							var headervalue=resources.children().filterNsNode('headervalue').text();
							var synctoken=resources.children().filterNsNode('sync-token').text();
							var oldSyncToken='';

							var tmp_dv=href.match(RegExp('.*/([^/]+)/$','i'));
							if(displayvalue=='')	// OS X Server
								displayvalue=tmp_dv[1];

							if(color=='')
							{
								var par=(uidBase+href).split('/');
								var hash=hex_sha256(hex_sha256(par[par.length-3]+'/'+par[par.length-2]+'/'));
								var hex=hash.substring(0,6);
								while(checkColorBrightness(hex)>=252)
									hex=hex_sha256(hex_sha256(hash)).substring(0,6);
								color='#'+hex;
							}

							var checkContentType=(inputResource.checkContentType==undefined ? true : inputResource.checkContentType);
							// insert the resource
							var someChanged=false;
							var existingResource=globalResourceCardDAVList.getCollectionByUID(uidBase+href);
							if(existingResource!=null)
							{
								if(existingResource.syncToken!=synctoken)
									someChanged=true;
								if(typeof globalForceSyncURLArray!='undefined' && globalForceSyncURLArray.length>0 && globalForceSyncURLArray.indexOf(existingResource.uid)!=-1)
								{
									someChanged=true;
								}
							}
							else
							{
								someChanged=true;
								if(synctoken=='')
									synctoken=null;
							}
							var uidParts=(uidBase+href).match(RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@(.*)'));
							var checkHref=uidParts[1]+uidParts[3];
							if(!isHrefSet)
							{
								saveHref=uidBase+href;
								isHrefSet=true;
							}
							if(!globalDefaultAddrCollectionLoadAll)
							{
								var toBeLoad=false;
								if(typeof globalCrossServerSettingsURL!='undefined' && globalCrossServerSettingsURL!=null && globalCrossServerSettingsURL)
								{
									var uidParts=(uidBase+href).match(RegExp('/([^/]+/[^/]+/)$'));
									var tmpParts=uidParts[1].match('^(.*/)([^/]+)/$');
									var checkHref3=decodeURIComponent(tmpParts[1])+tmpParts[2]+'/';
									var found=false;
									for(var l=0; l<globalSettings.loadedaddressbookcollections.value.length; l++)
									{
										var tmpParts2=globalSettings.loadedaddressbookcollections.value[l].match('^(.*/)([^/]+)/([^/]+)/$');
										var checkHref2=decodeURIComponent(tmpParts2[2])+'/'+tmpParts2[3]+'/';
										if(checkHref3==checkHref2)
										{
											found=true;
											globalSettings.loadedaddressbookcollections.value[l]=checkHref;
											break;
										}
									}
									toBeLoad=found;
								}
								else
									toBeLoad=globalSettings.loadedaddressbookcollections.value.indexOf(checkHref)!=-1;
							}
							else
							{
								var toBeLoad=true;
								if(globalCardDAVInitLoad)
									globalSettings.loadedaddressbookcollections.value.push(checkHref);
							}
							globalResourceCardDAVList.insertResource({makeLoaded:toBeLoad, timestamp: resultTimestamp, uid: uidBase+href, timeOut: inputResource.timeOut, displayvalue: displayvalue, headervalue: headervalue, userAuth: inputResource.userAuth, url: baseHref, accountUID: origUID, href: href, hrefLabel: inputResource.hrefLabel, color: color, permissions: {full: permissions, read_only: read_only}, crossDomain: inputResource.crossDomain, withCredentials: inputResource.withCredentials, checkContentType: checkContentType, isLoaded:false, newlyAdded:toBeLoad, indexResource:indexR, disableLocking: disableLocking, syncToken: synctoken, oldSyncToken:oldSyncToken, someChanged:someChanged}, inputResourceIndex);
							inputResource.addressbookNo++;
						}
			});
		});

		if(saveHref!='')
		{
			var saveUserHref=saveHref.replace(new RegExp('[^/]+/$'),'');
			if(typeof globalResourceCalDAVList!='undefined' && globalResourceCalDAVList!=null)
				globalResourceCalDAVList.removeOldResources(saveUserHref, resultTimestamp);
			if(typeof globalResourceCardDAVList!='undefined' && globalResourceCardDAVList!=null)
				globalResourceCardDAVList.removeOldResources(saveUserHref, resultTimestamp);
		}
		//recursive call for resource loading
		if(hrefMode)
			netLoadResource(inputResource, inputResource.cahref, false, inputResourceIndex, forceLoad, indexR, loadArray)
		else
		{
			indexR++;
			netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
		}
	}

	// first try to process the cached data (if cached results are available in the "auth module" response)
	var tmpCache;
	if(globalXMLCache!=null && (tmpCache=globalXMLCache.children('davprincipalcollections[request_url="'+jqueryEscapeSelector(inputHref)+'"]').remove()).length)
	{
		if(typeof globalDebug!='undefined' && globalDebug instanceof Array && globalDebug.indexOf('cache')!=-1)
			console.log('DBG Cache OK: '+arguments.callee.name+' url: \''+inputHref+'\': saved one request!');
		ajaxComplete('', 'success', {responseXML: tmpCache});
	}
	else
	{
		if(typeof globalDebug!='undefined' && globalDebug instanceof Array && globalDebug.indexOf('cache')!=-1)
			console.log('DBG Cache ERROR: '+arguments.callee.name+' url: \''+inputHref+'\': spend one request!');
		$.ajax({
			type: 'PROPFIND',
			url: inputHref,
			cache: false,
			crossDomain: (typeof inputResource.crossDomain=='undefined' ? true : inputResource.crossDomain),
			xhrFields: {
				withCredentials: (typeof inputResource.withCredentials=='undefined' ? false : inputResource.withCredentials)
			},
			timeout: inputResource.timeOut,
			beforeSend: function(req){
				if(globalSettings.usejqueryauth.value!=true && inputResource.userAuth.userName!='' && inputResource.userAuth.userPassword!='')
					req.setRequestHeader('Authorization', basicAuth(inputResource.userAuth.userName, inputResource.userAuth.userPassword));

				req.setRequestHeader('X-client', globalXClientHeader);
				req.setRequestHeader('Depth', '1');
				if(globalSettingsSaving!=''||(isAvaible('CardDavMATE') && (!globalCardDAVInitLoad && !globalCardDAVResourceSync)) || (isAvaible('CalDavZAP') && (!globalCalDAVInitLoad && !globalCalDAVResourceSync))||(isAvaible('Projects') && isProjectsLoaded))
					/* XXX - System display:none changes */
					if(globalSettingsSaving!='' || (isAvaible('Settings') && $('#SystemSettings').css('visibility')=='visible' && $('.resourceSettings_item_selected').attr('data-type')=='setting_group_password'))
					{
						indexR++;
						if(((isAvaible('CardDavMATE')&&globalCardDAVInitLoad) || (isAvaible('CalDavZAP'&&globalCalDAVInitLoad))) && indexR==globalAccountSettings.length)
							$('#MainLoader').fadeOut(1200);
						netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
						return false;
					}
			},
			username: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userName : null),
			password: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userPassword : null),
			contentType: 'text/xml; charset=utf-8',
			processData: true,
			data: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop>'+settingsXML+'<D:current-user-privilege-set/><D:displayname/><D:supportedlock/><D:resourcetype/><D:supported-report-set/><D:sync-token/><A:calendar-color xmlns:A="'+(typeof globalCalendarColorPropertyXmlns!='undefined'&&globalCalendarColorPropertyXmlns!=null&&globalCalendarColorPropertyXmlns!='' ? globalCalendarColorPropertyXmlns : 'http://apple.com/ns/ical/')+'"/><I:headervalue xmlns:I="http://inf-it.com/ns/dav/"/><I:addressbook-color xmlns:I="'+(typeof globalAddrColorPropertyXmlns!='undefined'&&globalAddrColorPropertyXmlns!=null&&globalAddrColorPropertyXmlns!='' ? globalAddrColorPropertyXmlns : 'http://inf-it.com/ns/ab/')+'"/><L:supported-calendar-component-set xmlns:L="urn:ietf:params:xml:ns:caldav"/><R:max-image-size xmlns:R="urn:ietf:params:xml:ns:carddav"/></D:prop></D:propfind>',
			dataType: 'xml',
			error: function(objAJAXRequest, strError){
				console.log("Error: [netLoadResource: 'PROPFIND "+uidFull+"']: code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
				inputResource.errorLoaded=true;
				if(isAvaible('CalDavZAP'))
				{
					$('#intCaldav').find('.int_error').css('display','block');
					$('#intCaldavTodo').find('.int_error').css('display','block');
				}
				if(isAvaible('CardDavMATE'))
					$('#intCarddav').find('.int_error').css('display','block');
				if(hrefMode)
					netLoadResource(inputResource, inputResource.cahref, false, inputResourceIndex, forceLoad, indexR, loadArray);
				else
				{
					indexR++;
					var allFail=true;
					for(var i=0; i< globalAccountSettings.length; i++)
						if(typeof globalAccountSettings[i].errorLoaded=='undefined' || globalAccountSettings[i].errorLoaded==null || globalAccountSettings[i].errorLoaded===false)
							allFail=false;
					if(((isAvaible('CardDavMATE')&&globalCardDAVInitLoad) || (isAvaible('CalDavZAP')&&globalCalDAVInitLoad)) && indexR==globalAccountSettings.length && allFail)
						$('#MainLoader').fadeOut(1200);

					if(isAvaible('CalDavZAP') && !globalCalDAVInitLoad)
						handleCalDAVError(true, inputResource);
					if(isAvaible('CardDavMATE') && !globalCardDAVInitLoad)
						handleCardDAVError(true, inputResource);
					netFindResource(globalAccountSettings[indexR], inputResourceIndex, forceLoad, indexR,loadArray);
				}
				return false;
			},
			success: ajaxComplete
		});
	}
}// Save the client settings (stored as DAV property on server)
function netSaveSettings(inputResource, inputSettings, isFormSave, collectionLoad)
{
	var re=new RegExp('^(https?://)([^/]+)(.*)', 'i');
	var tmp=inputResource.href.match(re);
	var baseHref=tmp[1]+tmp[2];
	var uidBase=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2];
	var uidFull=tmp[1]+inputResource.userAuth.userName+'@'+tmp[2]+tmp[3]; //for the error handler
	var saveHref = inputResource.href;
	var serverSettingss = transformToServer(inputSettings);

	if(globalSettings.settingstype.value!='' && globalSettings.settingstype.value!=null)
	{
		if(globalSettings.settingstype.value=='addressbook-home-set')
			saveHref = inputResource.abhref;
		else if(globalSettings.settingstype.value=='calendar-home-set')
			saveHref = inputResource.cahref;
	}

	$.ajax({
		type: 'PROPPATCH',
		url: saveHref,
		cache: false,
		crossDomain: (typeof inputResource.crossDomain=='undefined' ? true: inputResource.crossDomain),
		xhrFields: {
			withCredentials: (typeof inputResource.withCredentials=='undefined' ? false: inputResource.withCredentials)
		},
		timeout: inputResource.timeOut,
		beforeSend: function(req){
			if(globalSettings.usejqueryauth.value!=true && inputResource.userAuth.userName!='' && inputResource.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(inputResource.userAuth.userName, inputResource.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
			req.setRequestHeader('Depth', '0');
		},
		username: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userPassword : null),
		contentType: 'text/xml',
		processData: true,
		data: '<?xml version="1.0" encoding="utf-8"?><D:propertyupdate xmlns:D="DAV:"><D:set><D:prop><I:settings xmlns:I="http://inf-it.com/ns/dav/">'+JSON.stringify(serverSettingss)+'</I:settings></D:prop></D:set></D:propertyupdate>',
		dataType: 'xml',
		error: function(objAJAXRequest, strError){
			console.log("Error: [netSaveSettings: 'PROPPATCH "+uidFull+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' (this error code usually means network connection error, or your browser is trying to make a cross domain query, but it is not allowed by the destination server or the browser itself)': ''));

			if(isAvaible('Settings'))
				show_editor_loader_messageSettings('message_error', localization[globalInterfaceLanguage].errSettingsSaved);

			var loader=null;
			if(typeof globalSettingsSaving!='undefined')
			{
				if(globalSettingsSaving=='event')
					loader=$('#CalendarLoader');
				else if(globalSettingsSaving=='todo')
					loader=$('#CalendarLoaderTODO');
				else if(globalSettingsSaving=='addressbook')
					loader=$('#AddressbookOverlay');
			}

			if(loader!=null)
			{
				loader.addClass('message_error').children('.loaderInfo').text(localization[globalInterfaceLanguage].errCollectionLoad);
				setTimeout(function(){
					loader.addClass('loader_hidden').removeClass('message_error').children('.loaderInfo').text('');
				}, globalHideInfoMessageAfter);
			}

			globalSettingsSaving='';
			return false;
		},
		success: function(data, textStatus, xml)
		{
			if(isAvaible('Settings')&&isFormSave)
			{
/*						if((isAvaible('CardDavMATE')&&globalCardDAVResourceSync) || (isAvaible('CalDavZAP')&&globalCalDAVResourceSync))
				{
					var myInt = setInterval(function(){
						if((isAvaible('CardDavMATE')&&!globalCardDAVResourceSync) && (isAvaible('CalDavZAP')&&!globalCalDAVResourceSync))
						{
							clearInterval(myInt);
							applySettings(getChangedSettings(globalSettings, inputSettings));
							globalSettings = inputSettings;
						}
					},100);
				}
				else
				{*/
					applySettings(getChangedSettings(globalSettings, inputSettings));
					globalSettings = inputSettings;
//						}
			}
			else if(collectionLoad)
			{
/*						if((isAvaible('CardDavMATE')&&globalCardDAVResourceSync) || (isAvaible('CalDavZAP')&&globalCalDAVResourceSync))
				{
					var myInt = setInterval(function(){
						if((isAvaible('CardDavMATE')&&!globalCardDAVResourceSync) && (isAvaible('CalDavZAP')&&!globalCalDAVResourceSync))
						{
							clearInterval(myInt);
							checkForLoadedCollections(inputSettings);
							globalSettings = inputSettings;
						}
					},100);
				}
				else
				{*/
					checkForLoadedCollections(inputSettings);
					globalSettings = inputSettings;
//						}
			}
		}
	});
}

function deleteVcalendarFromCollection(inputUID,inputForm, putMode)
{
	var tmp=inputUID.match(vCalendar.pre['uidParts']);
	var collection_uid=tmp[1]+tmp[2]+'@'+tmp[3]+tmp[4]+tmp[5];
	var put_href=tmp[1]+tmp[3]+tmp[4]+tmp[5]+tmp[6];

	var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
	var resourceCalDAV_user=tmp[2];

	var resourceSettings=null;

	var rid=inputUID.substring(0, inputUID.lastIndexOf('/')+1);
	if(inputForm=='vevent')
		var resources=globalResourceCalDAVList.collections;
	else
		var resources=globalResourceCalDAVList.TodoCollections;

	var rex=vCalendar.pre['accountUidParts'];
	for(var j=0;j<resources.length;j++)
	{
		if(rid==resources[j].uid)
		{
			var tmp=resources[j].accountUID.match(rex);
			var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
			var resourceCalDAV_user=tmp[2];

			// find the original settings for the resource and user
			for(var i=0;i<globalAccountSettings.length;i++)
				if(globalAccountSettings[i].href==resourceCalDAV_href && globalAccountSettings[i].userAuth.userName==resourceCalDAV_user)
					resourceSettings=globalAccountSettings[i];
			break;
		}
	}

	if(resourceSettings==null)
		return false;
	// the begin of each error message
	if(inputForm=='vevent')
		var errBegin=localization[globalInterfaceLanguage].errUnableDeleteBeginCalDAV;
	else
		var errBegin=localization[globalInterfaceLanguage].errUnableDeleteTodoBeginCalDAV;

	var vcalendarList=new Array();
	$.ajax({
		type: 'DELETE',
		url: put_href,
		cache: false,
		crossDomain: true,
		xhrFields: {
			withCredentials: (typeof resourceSettings.withCredentials=='undefined' ? false: resourceSettings.withCredentials)
		},
		timeout: resourceSettings.timeOut,
		beforeSend: function(req)
		{
			if(globalSettings.usejqueryauth.value!=true && resourceSettings.userAuth.userName!='' && resourceSettings.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(resourceSettings.userAuth.userName, resourceSettings.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
		},
		username: (globalSettings.usejqueryauth.value==true ? resourceSettings.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? resourceSettings.userAuth.userPassword : null),
		contentType: 'text/calendar',
		processData: true,
		data: '',
		dataType: 'text',
		error: function(objAJAXRequest, strError){
			console.log("Error: [deleteVcalendarFromCollection: 'DELETE "+put_href+"']: code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			switch (objAJAXRequest.status)
			{
				case 401:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp401));
					break;
				case 403:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp403));
					break;
				case 405:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp405));
					break;
				case 408:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp408));
					break;
				case 410:
					if(inputForm=='vevent')
						show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].CalDAVerrHttp410));
					else
						show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].CalDAVerrTodoHttp410));
					break;
				case 500:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp500));
					break;
				default:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttpCommon.replace('%%', objAJAXRequest.status)));
					break;
			}
			return false;
		},
		success: function(data, textStatus, xml){
			if(inputForm=='vevent')
				globalEventList.removeOldEvent(inputUID, true, true);
			else if(putMode)
				globalEventList.removeOldEvent(inputUID, true, false);
			if(putMode)
				return true;

			if(inputForm=='vevent')
			{
				show_editor_loader_messageCalendar('vevent', 'message_success', localization[globalInterfaceLanguage].txtAllDeleted, function(a)
				{
					//setTimeout(function()
					//{
						$('#show').val('');
						$('#CAEvent').hide();
						$('#event_details_template').remove();
						$('#CAEvent').append(cleanVcalendarTemplate);
						$('#EventDisabler').fadeOut(globalEditorFadeAnimation, function(){
							$('#timezonePicker').prop('disabled', false);
						});
					//}, a);
				});
			}
			else
			{
				show_editor_loader_messageCalendar('vtodo', 'message_success', localization[globalInterfaceLanguage].txtAllDeletedTodo, function(a)
				{
					//setTimeout(function()
					//{
						$('#showTODO').val('');
						$('#TodoDisabler').fadeOut(globalEditorFadeAnimation, function(){
							$('#timezonePickerTODO').prop('disabled', false);
						});
						globalEventList.removeOldEvent(inputUID, true, false);
					//}, a);
				});
			}
		}
	});
}

function moveVcalendarToCollection(accountUID, inputUID, inputEtag, inputVcalendar, delUID,inputForm,isFormHidden,deleteMode,textArray)
{
	var resultTimestamp=new Date().getTime();
	if(inputForm=='vtodo')
		globalTodoLoaderHide = localization[globalInterfaceLanguage].txtAllSavedTodo;
	var hex=hex_sha256(inputVcalendar+(new Date().getTime()));

	var tmp=delUID.match(vCalendar.pre['uidParts']);
	var tmpDest=inputUID.match(vCalendar.pre['uidParts']);
	var collection_uid=tmpDest[1]+tmpDest[2]+'@'+tmpDest[3]+tmpDest[4]+tmpDest[5];
//console.log(collection_uid)
	// if inputEtag is empty, we have a newly created vevent/vtodo and need to create a .ics file name for it
	var put_href=tmp[1]+tmp[3]+tmp[4]+tmp[5]+tmp[6];
	var dest_href=tmpDest[1]+tmpDest[3]+tmpDest[4]+tmpDest[5]+tmpDest[6];

	var put_href_part=tmp[4]+tmp[5]+tmp[6];
	var dest_href_part=tmpDest[4]+tmpDest[5]+tmpDest[6];

	var resourceSettings=null;

	// find the original settings for the resource and user
	var tmp=accountUID.match(vCalendar.pre['accountUidParts']);

	var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
	var resourceCalDAV_user=tmp[2];

	for(var i=0;i<globalAccountSettings.length;i++)
		if(globalAccountSettings[i].href==resourceCalDAV_href && globalAccountSettings[i].userAuth.userName==resourceCalDAV_user)
			resourceSettings=globalAccountSettings[i];

	if(resourceSettings==null)
		return false;

	// the begin of each error message
	if(inputForm=='vevent')
		var errBegin=localization[globalInterfaceLanguage].errUnableSaveBeginCalDAV;
	else
		var errBegin=localization[globalInterfaceLanguage].errUnableSaveTodoBeginCalDAV;
	var collection=globalResourceCalDAVList.getEventCollectionByUID(collection_uid);
	if(collection==null)
		collection=globalResourceCalDAVList.getTodoCollectionByUID(collection_uid);
	var vcalendarList=new Array();
	$.ajax({
		type: 'MOVE',
		url: put_href,
		cache: false,
		crossDomain: (typeof resourceSettings.crossDomain=='undefined' ? true: resourceSettings.crossDomain),
		xhrFields: {
			withCredentials: (typeof resourceSettings.withCredentials=='undefined' ? false: resourceSettings.withCredentials)
		},
		timeout: resourceSettings.timeOut,
		beforeSend: function(req)
		{
			if(globalSettings.usejqueryauth.value!=true && resourceSettings.userAuth.userName!='' && resourceSettings.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(resourceSettings.userAuth.userName, resourceSettings.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
			req.setRequestHeader('Destination', dest_href);
		},
		username: (globalSettings.usejqueryauth.value==true ? resourceSettings.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? resourceSettings.userAuth.userPassword : null),
		contentType: 'text/calendar',
		processData: true,
		data: inputVcalendar,
		dataType: 'text',
		error: function(objAJAXRequest, strError)
		{
			console.log("Error: [moveVcalendarToCollection: 'MOVE from: "+put_href+" to: "+dest_href+"']: code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			switch (objAJAXRequest.status)
			{
				case 401:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp401));
					break;
				case 403:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp403));
					break;
				case 405:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp405));
					break;
				case 408:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp408));
					break;
				case 412:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp412));
					netLoadCalendar(globalResourceCalDAVList.getCollectionByUID(collection_uid), [{etag: '', href: put_href_part}], (collection.forceSyncPROPFIND==undefined || collection.forceSyncPROPFIND==false ? true : false), false, true, true,true, null, null);
					break;
				case 500:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp500));
					break;
				default:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttpCommon.replace('%%', objAJAXRequest.status)));
					break;
			}
			if(inputForm=='vtodo')
				globalTodoLoaderHide='';
			if(($('#InvitationBoxContent').is(':visible'))&&(inputForm=='vevent'||inputForm=='schedule-inbox'))
			{
				if(!$('#InvitationBoxHeader').find('.invitation_header_item_selected').length)
					$('#InvitationBoxHeader').find('.invitation_header_item').first().trigger('click');
				else
					filterInvitations($('#InvitationBoxHeader').find('.invitation_header_item_selected').attr('data-type'));
			}
			return false;
		},
		success: function(data, textStatus, xml){
			globalRevertFunction=null;
			var isTODO=false;
			globalWindowFocus=false;
			if(inputForm=='vevent' || (inputForm=='schedule-inbox' && $('#CAEvent').is(':visible')))
			{
				var eventSuccessMessage=localization[globalInterfaceLanguage].txtAllSaved;
				if(deleteMode)
					eventSuccessMessage=localization[globalInterfaceLanguage].txtAllDeleted;

				show_editor_loader_messageCalendar(inputForm, 'message_success', eventSuccessMessage, function(a){
					//setTimeout(function(){
						$('#show').val('');
						if(isFormHidden!=true)
						{
							$('#CAEvent').hide();
							$('#calendar').fullCalendar('unselect');
							$('#event_details_template').remove();
							$('#CAEvent').append(cleanVcalendarTemplate);
							$('#EventDisabler').fadeOut(globalEditorFadeAnimation, function(){
								$('#timezonePicker').prop('disabled', false);
							});
						}
					//}, a);
				});
				globalEventList.removeOldEvent(delUID, true, true);
			}
			else if(inputForm=='vtodo')
				globalEventList.removeOldEvent(delUID, true, false);

			if(inputForm=='vevent')
				netLoadCalendar(globalResourceCalDAVList.getEventCollectionByUID(collection_uid), [{etag: '', href: dest_href_part}], (collection.forceSyncPROPFIND==undefined || collection.forceSyncPROPFIND==false ? true : false), false, true,false, true, null, null);
			else if(inputForm=='vtodo')
			{
				$('#showTODO').val(inputUID);
				netLoadCalendar(globalResourceCalDAVList.getTodoCollectionByUID(collection_uid), [{etag: '', href: dest_href_part}], (collection.forceSyncPROPFIND==undefined || collection.forceSyncPROPFIND==false ? true : false), false, true,false, true, null, null);
			}
			globalWindowFocus=true;
		}
	});
}

function putVcalendarToCollection(accountUID, inputUID, inputEtag, inputVcalendar, delUID,inputForm,isFormHidden,deleteMode,textArray)
{
	var resultTimestamp=new Date().getTime();
	if(inputForm=='vtodo')
		globalTodoLoaderHide = localization[globalInterfaceLanguage].txtAllSavedTodo;

	// line folding (RFC2445 - section 4.1) - maximum of 75 octects (and cannot break
	//  multi-octet UTF8-characters) allowed on one line, excluding a line break (CRLF)
	inputVcalendar=vObjectLineFolding(inputVcalendar);

	var hex=hex_sha256(inputVcalendar+(new Date().getTime()));

	var tmp=inputUID.match(vCalendar.pre['uidParts']);
	var collection_uid=tmp[1]+tmp[2]+'@'+tmp[3]+tmp[4]+tmp[5];

	// if inputEtag is empty, we have a newly created vevent/vtodo and need to create a .ics file name for it
	if(inputEtag!='')
	{
		var put_href=tmp[1]+tmp[3]+tmp[4]+tmp[5]+tmp[6];
		var put_href_part=tmp[4]+tmp[5]+tmp[6];
	}
	else
	{
		if(inputUID.charAt(inputUID.length-1)!='/')
		{
			var put_href=tmp[1]+tmp[3]+tmp[4]+tmp[5]+tmp[6];
			var put_href_part=tmp[4]+tmp[5]+tmp[6];
		}
		else
		{
			var vcalendarFile=hex+'.ics';
			var put_href=tmp[1]+tmp[3]+tmp[4]+tmp[5]+vcalendarFile;
			var put_href_part=tmp[4]+tmp[5]+vcalendarFile;
			inputUID+=vcalendarFile;
		}
	}
	var resourceSettings=null;

	// find the original settings for the resource and user
	var tmp=accountUID.match(vCalendar.pre['accountUidParts']);

	var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
	var resourceCalDAV_user=tmp[2];

	for(var i=0;i<globalAccountSettings.length;i++)
		if(globalAccountSettings[i].href==resourceCalDAV_href && globalAccountSettings[i].userAuth.userName==resourceCalDAV_user)
			resourceSettings=globalAccountSettings[i];

	if(resourceSettings==null)
		return false;

	// the begin of each error message
	if(inputForm=='vevent')
		var errBegin=localization[globalInterfaceLanguage].errUnableSaveBeginCalDAV;
	else
		var errBegin=localization[globalInterfaceLanguage].errUnableSaveTodoBeginCalDAV;
	var collection=globalResourceCalDAVList.getEventCollectionByUID(collection_uid);
	if(collection==null)
		collection=globalResourceCalDAVList.getTodoCollectionByUID(collection_uid);
	var vcalendarList=new Array();
	$.ajax({
		type: 'PUT',
		url: put_href,
		cache: false,
		crossDomain: (typeof resourceSettings.crossDomain=='undefined' ? true: resourceSettings.crossDomain),
		xhrFields: {
			withCredentials: (typeof resourceSettings.withCredentials=='undefined' ? false: resourceSettings.withCredentials)
		},
		timeout: resourceSettings.timeOut,
		beforeSend: function(req)
		{
			req.setRequestHeader('Prefer', 'return=representation');
			if(globalSettings.usejqueryauth.value!=true && resourceSettings.userAuth.userName!='' && resourceSettings.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(resourceSettings.userAuth.userName, resourceSettings.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
			if(inputEtag!='')
				req.setRequestHeader('If-Match', inputEtag);
			else // adding new object
				req.setRequestHeader('If-None-Match', '*');
		},
		username: (globalSettings.usejqueryauth.value==true ? resourceSettings.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? resourceSettings.userAuth.userPassword : null),
		contentType: 'text/calendar',
		processData: true,
		data: inputVcalendar,
		dataType: 'text',
		error: function(objAJAXRequest, strError)
		{
			console.log("Error: [putVcalendarToCollection: 'PUT "+put_href+"']: code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			switch (objAJAXRequest.status)
			{
				case 401:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp401));
					break;
				case 403:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp403));
					break;
				case 405:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp405));
					break;
				case 408:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp408));
					break;
				case 412:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp412));
					netLoadCalendar(globalResourceCalDAVList.getCollectionByUID(collection_uid), [{etag: '', href: put_href_part}], (collection.forceSyncPROPFIND==undefined || collection.forceSyncPROPFIND==false ? true : false), false, true, true,true, null, null);
					break;
				case 500:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttp500));
					break;
				default:
					show_editor_loader_messageCalendar(inputForm, 'message_error', errBegin.replace('%%', localization[globalInterfaceLanguage].errHttpCommon.replace('%%', objAJAXRequest.status)));
					break;
			}
			if(inputForm=='vevent' && globalRevertFunction!=null)
			{
				globalRevertFunction();
				globalRevertFunction=null
			}
			else if(inputForm=='vtodo')
			{
				globalTodoLoaderHide='';
				if(isFormHidden)
					$('#todoList').fullCalendar('allowSelectEvent',true);
			}

			return false;
		},
		success: function(data, textStatus, xml){
			globalRevertFunction=null;
			if(delUID!='')
				deleteVcalendarFromCollection(delUID,inputForm, true);

			if(textArray.length>0)
			{
				var tArr = textArray[0];
				textArray.splice(0,1);
				putVcalendarToCollection(accountUID, inputUID.substring(0, inputUID.lastIndexOf('/')+1), '', tArr, delUID,inputForm,isFormHidden,deleteMode,textArray)
			}
			var newEtag=xml.getResponseHeader('Etag');
			var isTODO=false;
			globalWindowFocus=false;
			if(inputForm=='vevent')
			{
				var eventSuccessMessage=localization[globalInterfaceLanguage].txtAllSaved;
				if(deleteMode)
					eventSuccessMessage=localization[globalInterfaceLanguage].txtAllDeleted;

				show_editor_loader_messageCalendar(inputForm, 'message_success', eventSuccessMessage, function(a){
					//setTimeout(function(){
						$('#show').val('');
						if(isFormHidden!=true)
						{
							$('#CAEvent').hide();
							$('#calendar').fullCalendar('unselect');
							$('#event_details_template').remove();
							$('#CAEvent').append(cleanVcalendarTemplate);
							$('#EventDisabler').fadeOut(globalEditorFadeAnimation, function(){
								$('#timezonePicker').prop('disabled', false);
							});
						}
					//}, a);
				});
			}
			else
			{
				if(newEtag!=null)
				{
					if(deleteMode)
						globalTodoLoaderHide=localization[globalInterfaceLanguage].txtAllDeletedTodo;
					show_editor_loader_messageCalendar(inputForm, 'message_success', globalTodoLoaderHide, function(a){
								globalTodoLoaderHide='';
								if(inputForm=='vtodo'&&isFormHidden!=true)
									$('#showTODO').val('');
								$('#TodoDisabler').fadeOut(globalEditorFadeAnimation, function(){
									$('#timezonePickerTODO').prop('disabled', false);
								});
					});
				}
			}

			if(newEtag!=null)
			{
				var rid=inputUID.substring(0, inputUID.lastIndexOf('/')+1);
				if(inputForm=='vevent')
				{
					var resources=globalResourceCalDAVList.collections;
					for(var j=0;j<resources.length;j++)
					{
						if(rid==resources[j].uid)
						{
							if(inputVcalendar!='')
							{
								var rawVcalendar=inputVcalendar;
								if(xml.getResponseHeader('Preference-Applied')=='return=representation' && xml.responseText)
									rawVcalendar=xml.responseText;

								var vcalendar_clean=vCalendarCleanup(rawVcalendar);
							}
							else
								return true;

							globalEventList.insertEvent(true, resources[j], {isRepeat: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: resources[j].accountUID, uid: inputUID, displayValue: resources[j].displayvalue, etag: newEtag, vcalendar: vcalendar_clean}, true, true,false);
							break;
						}
					}
				}
				else
				{
					var resources=globalResourceCalDAVList.TodoCollections;
					for(var j=0;j<resources.length;j++)
					{
						if(rid==resources[j].uid)
						{
							if(inputVcalendar!='')
							{
								var rawVcalendar=inputVcalendar;
								if(xml.getResponseHeader('Preference-Applied')=='return=representation' && xml.responseText)
									rawVcalendar=xml.responseText;

								var vcalendar_clean=vCalendarCleanup(rawVcalendar);
							}
							else
								return true;

							if(inputForm=='vtodo'&&isFormHidden!=true)
								$('#showTODO').val(inputUID);
							globalEventList.insertEvent(true, resources[j], {isRepeat: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: resources[j].accountUID, uid: inputUID, displayValue: resources[j].displayvalue, etag: newEtag, vcalendar: vcalendar_clean}, true, false,false);
							if(isFormHidden)
								$('#todoList').fullCalendar('allowSelectEvent',true);
							if(inputEtag=='' || isFormHidden)
								$('#todoList').fullCalendar('selectEvent',$('[data-id="'+inputUID+'"]'));
							break;
						}
					}
				}
			}
			else
			{
				if(inputForm=='vevent')
					netLoadCalendar(globalResourceCalDAVList.getEventCollectionByUID(collection_uid), [{etag: '', href: put_href_part}], (collection.forceSyncPROPFIND==undefined || collection.forceSyncPROPFIND==false ? true : false), false, true,false, true, null, null);
				else
				{
					if(isFormHidden)
						$('#todoList').fullCalendar('allowSelectEvent',true);
					if(inputForm=='vtodo'&&isFormHidden!=true)
						$('#showTODO').val(inputUID);
					netLoadCalendar(globalResourceCalDAVList.getTodoCollectionByUID(collection_uid), [{etag: '', href: put_href_part}], (collection.forceSyncPROPFIND==undefined || collection.forceSyncPROPFIND==false ? true : false), false, true,false, true, null, null);
				}
			}
			globalWindowFocus=true;
			return true;
		}
	});
}

/*
Permissions (from the davical wiki):
	all - aggregate of all permissions
	read - grants basic read access to the principal or collection.
	unlock - grants access to write content (i.e. update data) to the collection, or collections of the principal.
	read-acl - grants access to read ACLs on the collection, or collections of the principal.
	read-current-user-privilege-set - grants access to read the current user's privileges on the collection, or collections of the   write-acl-grants access to writing ACLs on the collection, or collections of the principal.
	write - aggregate of write-properties, write-content, bind & unbind
	write-properties - grants access to update properties of the principal or collection. In DAViCal, when granted to a user principal, this will only grant access to update properties of the principal's collections and not the user principal itself. When granted to a group or resource principal this will grant access to update the principal properties.
	write - content-grants access to write content (i.e. update data) to the collection, or collections of the principal.
	bind - grants access to creating resources in the collection, or in collections of the principal. Created resources may be new collections, although it is an error to create collections within calendar collections.
	unbind - grants access to deleting resources (including collections) from the collection, or from collections of the principal.
*/


function CalDAVnetLoadCollection(inputCollection, forceLoad, allSyncMode, recursiveIterator, collections)
{
	if(recursiveIterator>=collections.length)
	{
		setLoadingLimit(forceLoad, allSyncMode);
		if(!globalCalDAVInitLoad && isCalDAVLoaded && allSyncMode)
		{
			$('#SystemCalDavZAP .fc-header-center ').removeClass('r_operate_all');
			loadNextApplication(false);
		}

		return false;
	}
	if(collections.length>0)
	{
		if(inputCollection.uid!=undefined && inputCollection.makeLoaded && inputCollection.newlyAdded && globalSettingsSaving!='')
		{
			updateMainLoaderText(inputCollection.listType);
		}
		if(inputCollection.uid==undefined || inputCollection.subscription || (!inputCollection.newlyAdded && !inputCollection.syncRequired && !forceLoad && allSyncMode) || (!inputCollection.newlyAdded && !inputCollection.someChanged && !globalCalDAVInitLoad &&allSyncMode) || ((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null))&&!inputCollection.syncRequired)
		{
			if(inputCollection.subscription && inputCollection.syncRequired && inputCollection.uid!=undefined)
			{
				netLoadCalendarSubscription(globalAccountSettings[0], inputCollection, recursiveIterator, forceLoad, collections);
			}
			recursiveIterator++;
			if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
			{
				setLoadingLimit(forceLoad, allSyncMode);
				recursiveIterator=0;
				if((globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null) || allSyncMode)
					CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
			}
			else
				CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
			if(inputCollection.uid!=undefined)
			{
				if(!inputCollection.syncRequired && globalCalDAVInitLoad)
				{
					if(inputCollection.listType=='vtodo')
						$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
					else
						$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
					if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null))||(globalLimitLoading=='' && globalLimitTodoLoading==''))
					{
							globalAccountSettings[inputCollection.resourceIndex].todoNo--;
							if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad) || !globalCalDAVInitLoad)
								updateMainLoader();
					}
					else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
						updateMainLoader(true,inputCollection.listType);
				}
				else if(!globalCalDAVInitLoad && !inputCollection.someChanged)
				{
					if(inputCollection.listType=='vevent')
						$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
					else
						$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				}
			}
			return false;
		}
	}
	var resourceSettings=null;
	// find the original settings for the resource and user
	var tmp=inputCollection.accountUID.match(vCalendar.pre['accountUidParts']);

	var resourceCalDAV_href=tmp[1]+tmp[3]+tmp[4];
	var resourceCalDAV_user=tmp[2];

	for(var i=0;i<globalAccountSettings.length;i++)
		if(globalAccountSettings[i].href==resourceCalDAV_href && globalAccountSettings[i].userAuth.userName==resourceCalDAV_user)
			resourceSettings=globalAccountSettings[i];

	// POROVNAT S TYM AKO JE TO V CARDDAVMATE
	if(inputCollection.makeLoaded && globalSettingsSaving=='')
		updateMainLoaderText(inputCollection.listType);
	if((globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null )&&!allSyncMode && inputCollection.listType=='vevent')
		$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').addClass('r_operate');

	if(!inputCollection.makeLoaded)
	{
		if(inputCollection.listType == 'vevent')
			$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
		else if(inputCollection.listType == 'vtodo')
			$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
		recursiveIterator++;
		if((globalLimitLoading=='' && globalLimitTodoLoading=='') || ((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null)))
		{
			if(inputCollection.listType == 'vevent')
				globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
			else if(inputCollection.listType == 'vtodo')
			{
				globalAccountSettings[inputCollection.resourceIndex].todoNo--;
			}
			if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad))
			{
				updateMainLoader();
			}
		}
		else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
			updateMainLoader(true,inputCollection.listType);
		if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
		{
			recursiveIterator=0;
			setLoadingLimit(forceLoad, allSyncMode);
			if((globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value == null ) || allSyncMode)
				CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
		}
		else
			CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
		return false;
	}

	if(inputCollection.forceSyncPROPFIND!=undefined && inputCollection.forceSyncPROPFIND==true)
		var requestText='<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:getcontenttype/><D:getetag/></D:prop></D:propfind>';
	else if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null)))	// all sync turned off
	{
		var requestText='<?xml version="1.0" encoding="utf-8"?><D:sync-collection xmlns:D="DAV:"><D:prop><D:getcontenttype/><D:getetag/></D:prop><D:sync-level>1</D:sync-level>'+(forceLoad==true || inputCollection.syncToken==undefined || inputCollection.syncToken=='' ? '<D:sync-token/>' : '<D:sync-token>'+inputCollection.syncToken+'</D:sync-token>')+'</D:sync-collection>';
	}
	else // if inputCollection.forceSyncPROPFIND is undefined or false
	{
		var requestText = '';
		if(!forceLoad && !inputCollection.newlyAdded)
			requestText='<?xml version="1.0" encoding="utf-8"?><D:sync-collection xmlns:D="DAV:"><D:prop><D:getcontenttype/><D:getetag/></D:prop><D:sync-level>1</D:sync-level>'+(forceLoad==true || inputCollection.syncToken==undefined || inputCollection.syncToken=='' ? '<D:sync-token/>' : '<D:sync-token>'+inputCollection.syncToken+'</D:sync-token>')+'</D:sync-collection>';
		else
		{
			if(inputCollection.listType=='vevent')
			{
				if(globalCalDAVInitLoad&&allSyncMode)
				{
					if(globalSettings.eventstartpastlimit.value!=null)
					{
						globalLoadedLimit  = new Date();
						globalLoadedLimit.setDate(1);
						globalLoadedLimit.setHours(0);
						globalLoadedLimit.setMinutes(0);
						globalLoadedLimit.setSeconds(0);
						globalLoadedLimit.setMilliseconds(0);
						globalLoadedLimit.setMonth(globalLoadedLimit.getMonth()-globalSettings.eventstartpastlimit.value);
					}
					if(globalSettings.eventstartfuturelimit.value!=null)
					{
						globalToLoadedLimit  = new Date();
						globalToLoadedLimit.setDate(1);
						globalToLoadedLimit.setHours(0);
						globalToLoadedLimit.setMinutes(0);
						globalToLoadedLimit.setSeconds(0);
						globalToLoadedLimit.setMilliseconds(0);
						globalToLoadedLimit.setMonth(globalToLoadedLimit.getMonth()+globalSettings.eventstartfuturelimit.value+1);
					}
				}
				var pastInterval = '', futureInterval = '';
				if(!inputCollection.newlyAdded || globalCalDAVInitLoad)
				{
					if(globalSettings.eventstartpastlimit.value!=null && (allSyncMode || globalLimitLoading=='past'))
					{
						var pastDate = new Date(globalLoadedLimit.getTime());
						pastDate.setDate(pastDate.getDate()-7);
						if(allSyncMode)
							pastInterval = ' start="'+$.fullCalendar.formatDate(pastDate ,"yyyyMMdd'T'HHmmss")+'Z"';
						else
							pastInterval = ' start="'+$.fullCalendar.formatDate(pastDate ,"yyyyMMdd'T'HHmmss")+'Z" end="'+$.fullCalendar.formatDate(globalBeginPast,"yyyyMMdd'T'HHmmss")+'Z"';
						if(recursiveIterator==(collections.length-1))
							globalBeginPast = new Date(pastDate.getTime());
					}
					if(globalSettings.eventstartfuturelimit.value!=null && (allSyncMode || globalLimitLoading=='future'))
					{
						var futureDate = new Date(globalToLoadedLimit.getTime());
						futureDate.setDate(futureDate.getDate()+14);
						if(allSyncMode)
							futureInterval = ' end="'+$.fullCalendar.formatDate(futureDate ,"yyyyMMdd'T'HHmmss")+'Z"';
						else
							futureInterval = ' start="'+$.fullCalendar.formatDate(globalBeginFuture ,"yyyyMMdd'T'HHmmss")+'Z" end="'+$.fullCalendar.formatDate(futureDate,"yyyyMMdd'T'HHmmss")+'Z"';
						if(recursiveIterator==(collections.length-1))
							globalBeginFuture = new Date(futureDate.getTime());
					}
				}
				else
				{
					var pastDate = new Date(globalLoadedLimit.getTime());
					var futureDate = new Date(globalToLoadedLimit.getTime());
					pastInterval = ' start="'+$.fullCalendar.formatDate(pastDate ,"yyyyMMdd'T'HHmmss")+'Z"';
					futureInterval = ' end="'+$.fullCalendar.formatDate(futureDate ,"yyyyMMdd'T'HHmmss")+'Z"';
				}
				if(!allSyncMode)
					requestText='<?xml version="1.0" encoding="UTF-8"?><L:calendar-query xmlns:L="urn:ietf:params:xml:ns:caldav"><D:prop xmlns:D="DAV:"><D:getcontenttype/><D:getetag/><L:calendar-data/></D:prop><L:filter><L:comp-filter name="VCALENDAR"><L:comp-filter name="VEVENT"><L:time-range'+(globalLimitLoading=='past' ? pastInterval : futureInterval)+'/></L:comp-filter></L:comp-filter></L:filter></L:calendar-query>';
				else
					requestText='<?xml version="1.0" encoding="UTF-8"?><L:calendar-query xmlns:L="urn:ietf:params:xml:ns:caldav"><D:prop xmlns:D="DAV:"><D:getcontenttype/><D:getetag/><L:calendar-data/></D:prop><L:filter><L:comp-filter name="VCALENDAR"><L:comp-filter name="VEVENT"><L:time-range'+pastInterval+futureInterval+'/></L:comp-filter></L:comp-filter></L:filter></L:calendar-query>';
			}
			else if(inputCollection.listType=='vtodo')
			{
				if(allSyncMode)
				{
					if(globalSettings.todopastlimit.value!=null)
					{
						globalLoadedLimitTodo  = new Date();
						globalLoadedLimitTodo.setDate(1);
						globalLoadedLimitTodo.setHours(0);
						globalLoadedLimitTodo.setMinutes(0);
						globalLoadedLimitTodo.setSeconds(0);
						globalLoadedLimitTodo.setMilliseconds(0);
						globalLoadedLimitTodo.setMonth(globalLoadedLimitTodo.getMonth()-globalSettings.todopastlimit.value);
					}
					if(globalSettings.eventstartfuturelimit.value!=null)
					{
						globalToLoadedLimitTodo  = new Date();
						globalToLoadedLimitTodo.setDate(1);
						globalToLoadedLimitTodo.setHours(0);
						globalToLoadedLimitTodo.setMinutes(0);
						globalToLoadedLimitTodo.setSeconds(0);
						globalToLoadedLimitTodo.setMilliseconds(0);
						globalToLoadedLimitTodo.setMonth(globalToLoadedLimitTodo.getMonth()+globalSettings.eventstartfuturelimit.value+1);
					}
				}
				var pastInterval = '', futureInterval = '';
				if(!inputCollection.newlyAdded || globalCalDAVInitLoad)
				{
					if(globalSettings.todopastlimit.value!=null && (allSyncMode || globalLimitTodoLoading=='pastTodo'))
					{
						if(allSyncMode)
							pastInterval = ' start="'+$.fullCalendar.formatDate(globalLoadedLimitTodo ,"yyyyMMdd'T'HHmmss")+'Z"';
						else
							pastInterval = ' start="'+$.fullCalendar.formatDate(globalLoadedLimitTodo ,"yyyyMMdd'T'HHmmss")+'Z" end="'+$.fullCalendar.formatDate(new Date(new Date(globalLoadedLimitTodo.getTime()).setMonth(globalLoadedLimitTodo.getMonth()+globalSettings.todopastlimit.value+1)),"yyyyMMdd'T'HHmmss")+'Z"';
					}
				}
				else
					pastInterval = ' start="'+$.fullCalendar.formatDate(globalLoadedLimitTodo ,"yyyyMMdd'T'HHmmss")+'Z"';
				/*if(!globalSettings.appleremindersmode.value && globalSettings.eventstartfuturelimit.value!=null && (allSyncMode || globalLimitLoading=='futureTodo'))
				{
					if(allSyncMode)
						futureInterval = ' end="'+$.fullCalendar.formatDate(globalToLoadedLimitTodo ,"yyyyMMdd'T'HHmmss")+'Z"';
					else
						futureInterval = ' start="'+$.fullCalendar.formatDate(new Date(new Date(globalToLoadedLimitTodo.getTime()).setMonth(globalToLoadedLimitTodo.getMonth()-globalSettings.eventstartfuturelimit.value-1)) ,"yyyyMMdd'T'HHmmss")+'Z" end="'+$.fullCalendar.formatDate(globalToLoadedLimitTodo,"yyyyMMdd'T'HHmmss")+'Z"';
				}*/
				if(!allSyncMode)
					requestText='<?xml version="1.0" encoding="utf-8"?><L:calendar-query xmlns:L="urn:ietf:params:xml:ns:caldav"><D:prop xmlns:D="DAV:"><D:getcontenttype/><D:getetag/><L:calendar-data/></D:prop><L:filter><L:comp-filter name="VCALENDAR"><L:comp-filter name="VTODO"><L:time-range'+(globalLimitTodoLoading=='pastTodo' ? pastInterval : futureInterval)+'/></L:comp-filter></L:comp-filter></L:filter></L:calendar-query>';
				else
					requestText='<?xml version="1.0" encoding="utf-8"?><L:calendar-query xmlns:L="urn:ietf:params:xml:ns:caldav"><D:prop xmlns:D="DAV:"><D:getcontenttype/><D:getetag/><L:calendar-data/></D:prop><L:filter><L:comp-filter name="VCALENDAR"><L:comp-filter name="VTODO"><L:time-range'+pastInterval+futureInterval+'/></L:comp-filter></L:comp-filter></L:filter></L:calendar-query>';
			}
		}
	}

	function ajaxComplete(data, textStatus, xml)
	{
		$('[data-id="'+inputCollection.uid+'"]').removeClass('r_error');
		if(inputCollection.listType=='vevent' && $('#ResourceCalDAVList').find('.r_error').length==0 && isEachResourceLoaded())
			$('#intCaldav').find('.int_error').css('display','none');
		else if(inputCollection.listType=='vtodo' && $('#ResourceCalDAVTODOList').find('.r_error').length==0 && isEachResourceLoaded())
			$('#intCaldavTodo').find('.int_error').css('display','none');
		var prevNew = inputCollection.newlyAdded;
		inputCollection.newlyAdded = false;
		var vcalendarList=new Array();
		var isXMLEmpty=true;
		if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value!=null) || (inputCollection.listType=='vevent'&&(globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null))))
		{
			var hrefCounter = 0;
			$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode(new RegExp('^(sync-)?response$')).children().filterNsNode('href').each(function(index, element){
				hrefCounter++;
			});
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].collectionLength=hrefCounter;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].counter=0;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].resourceIndex=inputCollection.resourceIndex;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].listType=inputCollection.listType;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].typeList=inputCollection.typeList;
		}
		var re_found = new RegExp('200 OK$');
		var re_not_found = new RegExp('404 Not Found$');
		$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode(new RegExp('^(sync-)?response$')).each(
			function(index, element)
			{
				var hrefVal=$(element).children().filterNsNode('href').text();
				var etagVal=$(element).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('getetag').text();
				var allowContent=false;
				// checkContentType is undocumented but useful if somebody needs to disable it (wrong server response, etc.)
				if(inputCollection.checkContentType!=false)
				{
					var contenttypeVal=$(element).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('getcontenttype').text();
					if(contenttypeVal!=undefined)
					{
						contenttypeValArr=contenttypeVal.toLowerCase().replace(vCalendar.pre['spaceRex'],'').split(';');
						if(contenttypeValArr.indexOf('text/calendar')!=-1 || contenttypeValArr.indexOf('text/x-vcalendar')!=-1)
							allowContent=true;
					}
				}
				else
					allowContent=true;
				var result=$(element).find('*').filterNsNode('status').text();	// note for 404 there is no propstat!
				var match=false;
				if(hrefVal[hrefVal.length-1]!='/')	/* Google CalDAV problem with resource URL if content type checking is disabled */
				{
					if(allowContent==true)
					{
						if(result.match(re_found)) // HTTP OK
						{
							vcalendarList[vcalendarList.length]={etag: etagVal, href: hrefVal};
							match=true;
						}
					}
					if(!match && result.match(re_not_found)) // HTTP Not Found
						vcalendarList[vcalendarList.length]={deleted: true, etag: etagVal, href: hrefVal};
				}
				if((forceLoad || prevNew) && ((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value!=null) || (inputCollection.listType=='vevent'&&(globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null))))
				{
					var resultTimestamp=new Date().getTime();
					if($(element).children().filterNsNode('propstat').children().filterNsNode('status').text().match(RegExp('200 OK$'))) // HTTP OK
					{
						var uid=inputCollection.uid+hrefVal.replace(vCalendar.pre['hrefValRex'], '');
						var vcalendar_raw=$(element).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-data').text();
						if(vcalendar_raw!='')
						{
							isXMLEmpty=false;
							var vcalendar_clean=vCalendarCleanup(vcalendar_raw);
						}
						else
						{
							checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
							return true;
						}
						if((vcalendar_clean==undefined) || ((check=vcalendar_clean.match(vCalendar.pre['vcalendar']))==null))
						{
							checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
							console.log("Error: '"+uid+"': unable to parse vCalendar");
							return true;
						}

						if((check=vcalendar_clean.match(vCalendar.pre['vevent']))!=null)
						{
							if(inputCollection.typeList.indexOf('vevent')!=-1)
								globalEventList.insertEvent(false,inputCollection, {threadChange: '', isRepeat: false, isDrawn: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: inputCollection.accountUID, uid: uid, displayValue: inputCollection.displayvalue, counter: 0, etag: etagVal, vcalendar: vcalendar_clean}, false, true,true);	// when the inputMode=='sync' we force reload the vevent/vtodo
							else
								checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
						}
						else if((check=vcalendar_clean.match(vCalendar.pre['vtodo']))!=null)
						{
							if(inputCollection.typeList.indexOf('vtodo')!=-1)
								globalEventList.insertEvent(false,inputCollection, {threadChange: '', isRepeat: false, isDrawn: false, isTODO: true, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: inputCollection.accountUID, uid: uid, displayValue: inputCollection.displayvalue, counter: 0, etag: etagVal, vcalendar: vcalendar_clean}, false, false, true);	// when the inputMode=='sync' we force reload the vevent/vtodo
							else
								checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
						}
						else
						{
							console.log("Error: '"+uid+"': unable to parse vEvent or vTodo");
							checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
							return true;
						}
					}
					else
					{
						var uid=inputCollection.uid+hrefVal.replace(vCalendar.pre['hrefValRex'], '');
						console.log("Error: '"+uid+"': unable to parse vEvent or vTodo");
						checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
						return true;
					}
				}
			}
		);

		if(allSyncMode && !forceLoad && !prevNew)
		{
			// store the syncToken
			if(inputCollection.forceSyncPROPFIND==undefined || inputCollection.forceSyncPROPFIND==false)
				inputCollection.syncToken=$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('sync-token').text();
		}
/*			inputCollection.someChanged = false;
		if(globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null)
		{
			inputCollection.oldSyncToken = inputCollection.syncToken;
			inputCollection.someChanged = false;
		}
*/
		//loading of todo calendar when imit is set and we need to make 2 ajax filter requests
		if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value!=null) || (inputCollection.listType=='vevent'&&(globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null))) && !isXMLEmpty)
		{
			inputCollection.oldSyncToken = inputCollection.syncToken;
			inputCollection.someChanged = false;
			if(collections.length>0)
			{

				recursiveIterator++;
				if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
				{
					setLoadingLimit(forceLoad, allSyncMode);
					recursiveIterator=0;
					if(allSyncMode)
						CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
				}
				else
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
				/*if(globalLimitLoading=='')
				{
						if(inputCollection.listType == 'vevent')
							globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
						else if(inputCollection.listType == 'vtodo')
							globalAccountSettings[inputCollection.resourceIndex].todoNo--;
					if(globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0)
						updateMainLoader();
				}*/
				if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
					updateMainLoader(true,inputCollection.listType);
			}
			return false;
		}
		if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value!=null) || (inputCollection.listType=='vevent'&&(globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null))) && ((forceLoad && !allSyncMode)||(prevNew && !globalCalDAVInitLoad)))
			netLoadCalendar(inputCollection, vcalendarList, (inputCollection.forceSyncPROPFIND==undefined || inputCollection.forceSyncPROPFIND==false ? true : false), true, forceLoad,allSyncMode, false, recursiveIterator, collections);
		else
			netLoadCalendar(inputCollection, vcalendarList, (inputCollection.forceSyncPROPFIND==undefined || inputCollection.forceSyncPROPFIND==false ? true : false), true, forceLoad,allSyncMode, false, recursiveIterator, collections);

		vcalendarList=null;
		if(typeof globalParallelAjaxCallCalDAVEnabled!='undefined' && globalParallelAjaxCallCalDAVEnabled!=null && globalParallelAjaxCallCalDAVEnabled)
		{
			if(collections.length>0)
			{
				recursiveIterator++;
				if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
				{
					recursiveIterator=0;
					if((globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null) || allSyncMode)
						CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
				}
				else
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
			}
		}
	}

	// first try to process the cached data (if cached results are available in the "auth module" response)
	var tmpCache;
	var component='';
	if(inputCollection.listType=='vtodo')
		component='VTODO';
	else if(inputCollection.listType=='vevent')
		component='VEVENT';
	if(globalXMLCache!=null && (tmpCache=globalXMLCache.children('caldavcalendarquery[request_url="'+jqueryEscapeSelector(inputCollection.url+inputCollection.href)+'"][request_component="'+component+'"]').remove()).length)
	{
		if(typeof globalDebug!='undefined' && globalDebug instanceof Array && globalDebug.indexOf('cache')!=-1)
			console.log('DBG Cache OK: '+arguments.callee.name+' component: '+component+' url: \''+inputCollection.url+inputCollection.href+'\': saved one request!');
		ajaxComplete('', 'success', {responseXML: tmpCache});
	}
	else
	{
		if(typeof globalDebug!='undefined' && globalDebug instanceof Array && globalDebug.indexOf('cache')!=-1)
			console.log('DBG Cache ERROR: '+arguments.callee.name+' url: \''+inputCollection.url+inputCollection.href+'\': spend one request!');
		$.ajax({
			type: (inputCollection.forceSyncPROPFIND!=undefined && inputCollection.forceSyncPROPFIND==true ? 'PROPFIND' : 'REPORT'),
			url: 	inputCollection.url+inputCollection.href,
			cache: false,
			crossDomain: (typeof inputCollection.crossDomain=='undefined' ? true: inputCollection.crossDomain),
			xhrFields: {
				withCredentials: (typeof inputCollection.withCredentials=='undefined' ? false: inputCollection.withCredentials)
			},
			timeout: inputCollection.timeOut,
			beforeSend: function(req){
				if(globalSettings.usejqueryauth.value!=true && inputCollection.userAuth.userName!='' && inputCollection.userAuth.userPassword!='')
					req.setRequestHeader('Authorization', basicAuth(inputCollection.userAuth.userName, inputCollection.userAuth.userPassword));

				req.setRequestHeader('X-client', globalXClientHeader);
				req.setRequestHeader('Depth', '1');
				/* XXX - System display:none changes */
				if(isAvaible('Settings') && $('#SystemSettings').css('visibility')=='visible' && $('.resourceSettings_item_selected').attr('data-type')=='setting_group_password')
				{
					if(collections.length>0)
					{
						recursiveIterator++;
						if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
						{
							setLoadingLimit(forceLoad, allSyncMode);
							recursiveIterator=0;
							if(allSyncMode || (globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null))
								CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
						}
						else
							CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
					}
					return false;
				}
			},
			username: (globalSettings.usejqueryauth.value==true ? inputCollection.userAuth.userName : null),
			password: (globalSettings.usejqueryauth.value==true ? inputCollection.userAuth.userPassword : null),
			contentType: 'text/xml; charset=utf-8',
			processData: true,
			data: requestText,
			dataType: 'xml',
			error: function(objAJAXRequest, strError){
				if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value!=null) || (inputCollection.listType=='vevent'&&(globalSettings.eventstartpastlimit.value!=null || globalSettings.eventstartfuturelimit.value!=null))) && objAJAXRequest.responseXML!=null && $(objAJAXRequest.responseXML).children().filterNsNode('C:SUPPORTED-FILTER').length>0)
				{
					if(inputCollection.listType=='vevent')
					{
						globalSettings.eventstartfuturelimit.value = null;
						globalSettings.eventstartpastlimit.value = null;
					}
					else
						globalSettings.todopastlimit.value = null;
					globalCalendarNumberCount--;
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
				}
				if((objAJAXRequest.status==400 /* bad request */ || objAJAXRequest.status==403 /* forbidden (for stupid servers) */ || objAJAXRequest.status==501 /* unimplemented */) && inputCollection.forceSyncPROPFIND!=true /* prevent recursion */)
				{
					collections[recursiveIterator].forceSyncPROPFIND=true;
					if(inputCollection.listType=='vevent')
					{
						globalSettings.eventstartfuturelimit.value = null;
						globalSettings.eventstartpastlimit.value = null;
					}
					else
						globalSettings.todopastlimit.value = null;
					globalCalendarNumberCount--;
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
					return true;
				}
				else
				{
					if(collections.length>0)
					{
						recursiveIterator++;
						if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
						{
							recursiveIterator=0;
							setLoadingLimit(forceLoad, allSyncMode);
							if(allSyncMode || (globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null ))
								CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
						}
						else
							CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
					}

					if(inputCollection.listType=='vevent')
					{
						$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
						$('#intCaldav').find('.int_error').css('display','block');
					}
					else
					{
						$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
						$('#intCaldavTodo').find('.int_error').css('display','block');
					}
					$('[data-id="'+inputCollection.uid+'"]').addClass('r_error');
					inputCollection.syncToken = inputCollection.oldSyncToken;
					if((globalLimitTodoLoading=='' && globalLimitLoading=='') || ((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null)))
					{
						if(inputCollection.listType == 'vevent')
							globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
						else if(inputCollection.listType == 'vtodo')
						{
							globalAccountSettings[inputCollection.resourceIndex].todoNo--;
						}
						if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad) || !globalCalDAVInitLoad)
						{
							updateMainLoader();
						}
					}
					else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
						updateMainLoader(true,inputCollection.listType);
					console.log("Error: [CalDAVnetLoadCollection: '"+(inputCollection.forceSyncPROPFIND!=undefined && inputCollection.forceSyncPROPFIND==true ? 'PROPFIND' : 'REPORT')+" "+inputCollection.url+inputCollection.href+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
					return false;
				}
			},
			success: ajaxComplete
		});
	}
}

function netLoadCalendar(inputCollection, vcalendarList, syncReportSupport,  removeUntouched, forceLoad, allSyncMode, forceCall, recursiveIterator, collections)
{
	var vcalendarChangedList=new Array();
	var rid='';
	var resultTimestamp=new Date().getTime();
	if(!inputCollection.subscription)
	{
		if(syncReportSupport==true)
		{
			if(inputCollection.listType=='vevent')
				var isEvent = true;
			else
				var isEvent = false;
			for(var i=0;i<vcalendarList.length;i++)
				if(vcalendarList[i].deleted==true)
					globalEventList.removeOldEvent(inputCollection.uid+vcalendarList[i].href.replace(vCalendar.pre['hrefValRex'], ''), true, isEvent);
				else
					vcalendarChangedList[vcalendarChangedList.length]=vcalendarList[i].href;
		}
		else	// no sync-collection REPORT supported (we need to delete vevents/vtodos by timestamp comparison)
		{
			for(var i=0;i<vcalendarList.length;i++)
			{
				var uid=inputCollection.uid+vcalendarList[i].href.replace(vCalendar.pre['hrefValRex'],'');
				if(!globalEventList.checkAndTouchIfExists(inputCollection.uid,uid,vcalendarList[i].etag,resultTimestamp))
					vcalendarChangedList[vcalendarChangedList.length]=vcalendarList[i].href;
			}
			if(inputCollection.listType=='vevent')
				var isEvent = true;
			else
				var isEvent = false;
			globalEventList.removeOldEvents(inputCollection.uid, resultTimestamp, isEvent);
		}

		// not loaded vCalendars from the last multiget (if any)
		if(recursiveIterator!=null)
			if(collections[recursiveIterator]!=undefined)
				if(collections[recursiveIterator].pastUnloaded!=undefined && collections[recursiveIterator].pastUnloaded!=null && collections[recursiveIterator].pastUnloaded.length>0)
					vcalendarChangedList=vcalendarChangedList.concat(collections[recursiveIterator].pastUnloaded).sort().unique();

		// if nothing is changed on server return
		if(vcalendarChangedList.length==0)
		{
			inputCollection.someChanged = false;
			inputCollection.oldSyncToken = inputCollection.syncToken;
			if(forceLoad || globalSettingsSaving!='')
			{
				if(inputCollection.listType=='vevent')
					$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				else
					$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');

				if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null)) || (globalLimitLoading=='' && globalLimitTodoLoading==''))
				{
					if(inputCollection.listType=='vevent')
						globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
					else if(inputCollection.listType=='vtodo')
						globalAccountSettings[inputCollection.resourceIndex].todoNo--;
					if(globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0  && globalCalDAVInitLoad)
						updateMainLoader();
					else if(globalSettingsSaving!='')
						updateMainLoader(true,inputCollection.listType,inputCollection.uid);
				}
				else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber) || globalSettingsSaving!='')
					updateMainLoader(true,inputCollection.listType);
			}

			if((typeof globalParallelAjaxCallCalDAVEnabled=='undefined' || globalParallelAjaxCallCalDAVEnabled==null || !globalParallelAjaxCallCalDAVEnabled) && collections.length>0)
			{
				recursiveIterator++;
				if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
				{
					recursiveIterator=0;
					if((globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null) || allSyncMode)
						CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
				}
				else
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
			}
			return true;
		}
	}
	else
	{
		var evCount=0;
		for(c in vcalendarList)
			if(vcalendarList[c].etag!=undefined && vcalendarList[c].etag!=null)
				evCount++;
		globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].collectionLength=evCount;
		globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].counter=0;
		globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].resourceIndex=inputCollection.resourceIndex;
		globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].listType=inputCollection.listType;
		globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].typeList=inputCollection.typeList;

//		if(inputCollection.listType=='vevent')
//			$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').addClass('r_operate');
//		else
//			$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').addClass('r_operate');

		if($('.r_operate_all').length==0)
			$('#SystemCalDavZAP .fc-header-center ').addClass('r_operate_all');

		for(eventUID in vcalendarList)
		{
			if(vcalendarList[eventUID].etag==undefined || vcalendarList[eventUID]==null)
				continue;
			var etag=vcalendarList[eventUID].etag;
			var uid=vcalendarList[eventUID].href;
			var vcalendar_raw=vcalendarList[eventUID].eventText;
			if(vcalendar_raw!='')
				var vcalendar_clean=vCalendarCleanup(vcalendar_raw);
			else
			{
				checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
				return true;
			}

			if((check=vcalendar_clean.match(vCalendar.pre['vevent']))!=null)
			{
				if(inputCollection.typeList.indexOf('vevent')!=-1)
					globalEventList.insertEvent(forceCall,inputCollection, {threadChange: '', isRepeat: false, isDrawn: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: inputCollection.accountUID, uid: uid, displayValue: inputCollection.displayvalue, counter: 0, etag: etag, vcalendar:  'BEGIN:VCALENDAR'+vcalendar_clean+ 'END:VCALENDAR\r\n'}, false, true,true);	// when the inputMode=='sync' we force reload the vevent/vtodo
				else
				{
					checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
				}
			}
			else if((check=vcalendar_clean.match(vCalendar.pre['vtodo']))!=null)
			{
				if(inputCollection.typeList.indexOf('vtodo')!=-1)
					globalEventList.insertEvent(forceCall, inputCollection, {threadChange: '', isRepeat: false, isDrawn: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: inputCollection.accountUID, uid: uid, displayValue: inputCollection.displayvalue, counter: 0, etag: etag, vcalendar:  'BEGIN:VCALENDAR'+vcalendar_clean+ 'END:VCALENDAR\r\n'}, false, false,true);	// when the inputMode=='sync' we force reload the vevent/vtodo
				else
				{
					checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
				}
			}
			else
			{
				console.log("Error: '"+uid+"': unable to parse vEvent or vTodo");
				checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
			}
		}

		if(evCount==0)
		{
			if(inputCollection.listType=='vevent')
				$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
			else
				$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
			if(allSyncMode && globalLimitLoading=='' && globalLimitTodoLoading=='')
			{
				if(inputCollection.typeList.indexOf('vevent')!=-1)
						globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
				if(inputCollection.typeList.indexOf('vtodo')!=-1)
					globalAccountSettings[inputCollection.resourceIndex].todoNo--;
				if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad))
					updateMainLoader();
				else if(globalSettingsSaving!='')
					updateMainLoader(true,inputCollection.listType,inputCollection.uid);
			}
			else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
				updateMainLoader(true,inputCollection.listType);
		}
		return false;
	}
	if($('.r_operate_all').length==0)
		$('#SystemCalDavZAP .fc-header-center ').addClass('r_operate_all');
	multigetData='<?xml version="1.0" encoding="utf-8"?><L:calendar-multiget xmlns:D="DAV:" xmlns:L="urn:ietf:params:xml:ns:caldav"><D:prop><D:getetag/><L:calendar-data/></D:prop><D:href>'+vcalendarChangedList.join('</D:href><D:href>')+'</D:href></L:calendar-multiget>';
	var returnValue=false;
	$.ajax({
		type: 'REPORT',
		url: inputCollection.url+inputCollection.href,
		cache: false,
		crossDomain: (typeof inputCollection.crossDomain=='undefined' ? true: inputCollection.crossDomain),
		xhrFields: {
			withCredentials: (typeof inputCollection.withCredentials=='undefined' ? false: inputCollection.withCredentials)
		},
		timeout: inputCollection.timeOut,
		beforeSend: function(req){
			if(globalSettings.usejqueryauth.value!=true && inputCollection.userAuth.userName!='' && inputCollection.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(inputCollection.userAuth.userName, inputCollection.userAuth.userPassword));

			req.setRequestHeader('X-client', globalXClientHeader);
		},
		username: (globalSettings.usejqueryauth.value==true ? inputCollection.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? inputCollection.userAuth.userPassword : null),
		contentType: 'text/xml',
		processData: true,
		data: multigetData,
		dataType: 'xml',
		error: function(objAJAXRequest, strError) {
			// unable to load vcalendars, try to load them next time
			if(recursiveIterator!=null)
				if(inputCollection.pastUnloaded!=null && inputCollection.pastUnloaded!=undefined)
					inputCollection.pastUnloaded=vcalendarChangedList;

			console.log("Error: [netLoadCalendar: 'REPORT "+inputCollection.url+inputCollection.href+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'"+(objAJAXRequest.status==0 ? ' - see https://www.inf-it.com/'+globalAppName.toLowerCase()+'/readme.txt (cross-domain setup)' : ''));
			if(inputCollection.listType=='vevent')
			{
				$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				$('#intCaldav').find('.int_error').css('display','block');
			}
			else
			{
				$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				$('#intCaldavTodo').find('.int_error').css('display','block');
			}
			$('[data-id="'+inputCollection.uid+'"]').addClass('r_error');
			inputCollection.syncToken = inputCollection.oldSyncToken;

			if(((inputCollection.listType=='vtodo'&&globalSettings.todopastlimit.value==null) || (inputCollection.listType=='vevent'&&globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null)) || (globalLimitLoading=='' && globalLimitTodoLoading==''))
			{
				if(inputCollection.listType.indexOf('vevent')!=-1)
					globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
				else if(inputCollection.listType.indexOf('vtodo')!=-1)
					globalAccountSettings[inputCollection.resourceIndex].todoNo--;
				if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad))
					updateMainLoader();
				else if(globalSettingsSaving!='')
					updateMainLoader(true,inputCollection.listType,inputCollection.uid);
			}
			else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
				updateMainLoader(true,inputCollection.listType);
			if((typeof globalParallelAjaxCallCalDAVEnabled=='undefined' || globalParallelAjaxCallCalDAVEnabled==null || !globalParallelAjaxCallCalDAVEnabled) && collections.length>0)
			{
				recursiveIterator++;
				if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
				{
					recursiveIterator=0;
					if((globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null) || allSyncMode)
						CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode,  0, globalResourceCalDAVList.TodoCollections);
				}
				else
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
			}
			return false;
		},
		success: function(data, textStatus, xml){
			inputCollection.someChanged = false;
			if(inputCollection.listType=='vevent' && $('#ResourceCalDAVList').find('.r_error').length==0 && isEachResourceLoaded())
				$('#intCaldav').find('.int_error').css('display','none');
			else if(inputCollection.listType=='vtodo' && $('#ResourceCalDAVTODOList').find('.r_error').length==0 && isEachResourceLoaded())
				$('#intCaldavTodo').find('.int_error').css('display','none');
			inputCollection.oldSyncToken = inputCollection.syncToken;
			inputCollection.pastUnloaded='';
			var hrefCounter = 0;
			$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').children().filterNsNode('href').each(function(index, element){
				hrefCounter++;
			});
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].collectionLength=hrefCounter;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].counter=0;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].resourceIndex=inputCollection.resourceIndex;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].listType=inputCollection.listType;
			globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType].typeList=inputCollection.typeList;

			var isXMLEmpty=true;
			var re_found = new RegExp('200 OK$');
			$(xml.responseXML).children().filterNsNode('multistatus').children().filterNsNode('response').each(function(index, element){
				if($(element).children().filterNsNode('propstat').children().filterNsNode('status').text().match(re_found)) // HTTP OK
				{
					isXMLEmpty=false;
					var etag=$(element).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('getetag').text();
					var uid=inputCollection.uid+$(element).children().filterNsNode('href').text().replace(vCalendar.pre['hrefValRex'], '');
					var vcalendar_raw=$(element).children().filterNsNode('propstat').children().filterNsNode('prop').children().filterNsNode('calendar-data').text();
					if(vcalendar_raw!='')
						var vcalendar_clean=vCalendarCleanup(vcalendar_raw);
					else
					{
						checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
						return true;
					}
					if((vcalendar_clean==undefined) || ((check=vcalendar_clean.match(vCalendar.pre['vcalendar']))==null))
					{
						checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
						console.log("Error: '"+uid+"': unable to parse vCalendar");
						return true;
					}

					if((check=vcalendar_clean.match(vCalendar.pre['vevent']))!=null)
					{
						if(inputCollection.typeList.indexOf('vevent')!=-1)
							globalEventList.insertEvent(forceCall,inputCollection, {threadChange: '', isRepeat: false, isDrawn: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: inputCollection.accountUID, uid: uid, displayValue: inputCollection.displayvalue, counter: 0, etag: etag, vcalendar: vcalendar_clean}, false, true,true);	// when the inputMode=='sync' we force reload the vevent/vtodo
						else
							checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
					}
					else if((check=vcalendar_clean.match(vCalendar.pre['vtodo']))!=null)
					{
						if(inputCollection.typeList.indexOf('vtodo')!=-1)
							globalEventList.insertEvent(forceCall,inputCollection, {threadChange: '', isRepeat: false, isDrawn: false, isTODO: false, untilDate: '', sortStart: '', start: '', end: '', sortkey: '', timestamp: resultTimestamp, accountUID: inputCollection.accountUID, uid: uid, displayValue: inputCollection.displayvalue, counter: 0, etag: etag, vcalendar: vcalendar_clean}, false, false, true);	// when the inputMode=='sync' we force reload the vevent/vtodo
						else
							checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
					}
					else
					{
						console.log("Error: '"+uid+"': unable to parse vEvent or vTodo");
						checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
						return true;
					}
				}
				else
				{
					var uid=inputCollection.uid+$(element).children().filterNsNode('href').text().replace(vCalendar.pre['hrefValRex'], '');
					console.log("Error: '"+uid+"': unable to parse vEvent or vTodo");
					checkEventLoader(globalResourceCalDAVList.counterList[inputCollection.uid+' '+inputCollection.listType],false);
					return true;
				}
			});

			if(isXMLEmpty)
			{
				if(inputCollection.listType=='vevent')
					$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				else
					$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');

				if(globalLimitLoading=='' && globalLimitTodoLoading=='')
				{
					if(inputCollection.typeList.indexOf('vevent')!=-1)
						globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
					else if(inputCollection.typeList.indexOf('vtodo')!=-1)
						globalAccountSettings[inputCollection.resourceIndex].todoNo--;
					if(globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad)
						updateMainLoader();
					else if(globalSettingsSaving!='')
						updateMainLoader(true,inputCollection.listType,inputCollection.uid);
				}
				else if((globalOnlyCalendarNumber>0 && globalOnlyCalendarNumberCount==globalOnlyCalendarNumber) || (globalTodoCalendarNumber>0 && globalOnlyTodoCalendarNumberCount==globalTodoCalendarNumber))
					updateMainLoader(true,inputCollection.listType);
			}
			if((typeof globalParallelAjaxCallCalDAVEnabled=='undefined' || globalParallelAjaxCallCalDAVEnabled==null || !globalParallelAjaxCallCalDAVEnabled) && collections.length>0)
			{

				recursiveIterator++;
				if(recursiveIterator>=collections.length && inputCollection.uid!='undefined' && inputCollection.listType=='vevent')
				{
					recursiveIterator=0;
					if((globalSettings.eventstartpastlimit.value==null && globalSettings.eventstartfuturelimit.value==null) || allSyncMode)
						CalDAVnetLoadCollection(globalResourceCalDAVList.TodoCollections[0], forceLoad, allSyncMode, 0, globalResourceCalDAVList.TodoCollections);
				}
				else
					CalDAVnetLoadCollection(collections[recursiveIterator], forceLoad, allSyncMode, recursiveIterator, collections);
			}
			if(globalTodoLoaderHide!='')
			{
				show_editor_loader_messageCalendar('vtodo', 'message_success', globalTodoLoaderHide, function(a){
							globalTodoLoaderHide='';
							$('#showTODO').val('');
							$('#TodoDisabler').fadeOut(globalEditorFadeAnimation, function(){
								$('#timezonePickerTODO').prop('disabled', false);
							});
				});
			}
		}
	});
}

function netLoadCalendarSubscription(inputResource, inputCollection, recursiveIterator, forceLoad, collections)
{
	if(!inputCollection.makeLoaded || globalLimitLoading!='' || globalLimitTodoLoading!='')
	{
		if(inputCollection.makeLoaded)
			updateMainLoaderText(inputCollection.listType);
		if(inputCollection.listType=='vevent')
			$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
		else
			$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
		if(globalLimitLoading=='' && globalLimitTodoLoading=='')
		{
			if(inputCollection.typeList.indexOf('vevent')!=-1)
				globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
			else if(inputCollection.typeList.indexOf('vtodo')!=-1)
				globalAccountSettings[inputCollection.resourceIndex].todoNo--;
			if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad) || !globalCalDAVInitLoad)
			updateMainLoader();
		}
		else if(globalLimitLoading!='' || globalLimitTodoLoading!='')
			updateMainLoader();
		return false;
	}
	$.ajax({
		type: 'GET',
		url: inputCollection.href,
		cache: false,
		crossDomain: false,
		timeout: 30000,
		beforeSend: function(req) {
			if(globalSettings.usejqueryauth.value!=true && inputResource.userAuth.userName!='' && inputResource.userAuth.userPassword!='')
				req.setRequestHeader('Authorization', basicAuth(inputResource.userAuth.userName, inputResource.userAuth.userPassword));
		},
		username: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userName : null),
		password: (globalSettings.usejqueryauth.value==true ? inputResource.userAuth.userPassword : null),
		contentType: 'text/plain',
		processData: true,
		data: '',
		dataType: 'text',
		error: function(objAJAXRequest, strError){
			console.log("Error: [netLoadCalendarSubscription: 'GET "+inputCollection.href+"'] code: '"+objAJAXRequest.status+"' status: '"+strError+"'");
			if(inputCollection.listType=='vevent')
			{
				$('#ResourceCalDAVList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				$('#intCaldav').find('.int_error').css('display','block');
			}
			else
			{
				$('#ResourceCalDAVTODOList [data-id="'+inputCollection.uid+'"]').removeClass('r_operate');
				$('#intCaldavTodo').find('.int_error').css('display','block');
			}
				$('[data-id="'+inputCollection.uid+'"]').addClass('r_error');
			if(globalLimitLoading=='' && globalLimitTodoLoading=='')
			{
				if(inputCollection.typeList.indexOf('vevent')!=-1)
					globalAccountSettings[inputCollection.resourceIndex].calendarNo--;
				else if(inputCollection.typeList.indexOf('vtodo')!=-1)
					globalAccountSettings[inputCollection.resourceIndex].todoNo--;
				if((globalAccountSettings[inputCollection.resourceIndex].calendarNo==0 && globalAccountSettings[inputCollection.resourceIndex].todoNo==0 && globalCalDAVInitLoad) || !globalCalDAVInitLoad)
					updateMainLoader();
			}
			return false;
		},
		success: function(data, response, text)
		{
			if(inputCollection.listType=='vevent' && $('#ResourceCalDAVList').find('.r_error').length==0 && isEachResourceLoaded())
				$('#intCaldav').find('.int_error').css('display','none');
			else if(inputCollection.listType=='vtodo' && $('#ResourceCalDAVTODOList').find('.r_error').length==0 && isEachResourceLoaded())
				$('#intCaldavTodo').find('.int_error').css('display','none');
			var vcalendarText = vCalendarCleanup(text.responseText);
			inputCollection.urlArray={};
			inputCollection.newlyAdded = false;
			if(inputCollection.typeList.indexOf('vevent')!=-1)
			{
				var parseCounter=0;
				var isEvent = false;
				if(vcalendarText.match(vCalendar.pre['vevent'])!=null)
					isEvent = true;
				while(vcalendarText.match(vCalendar.pre['vevent'])!=null)
				{
					var partEvent=vcalendarText.substring(vcalendarText.indexOf('BEGIN:VEVENT')-2,vcalendarText.indexOf('END:VEVENT')+'END:VEVENT'.length);
					var realEventUID=partEvent.match(vCalendar.pre['contentline_UID']);

					if(realEventUID!=null)
					{
						realEventUID=realEventUID[0].match(vCalendar.pre['contentline_parse'])[4];
						realEventUID=realEventUID.replace('/','');
					}

					var hex = hex_sha256(partEvent);
					if(inputCollection.urlArray != null)
					{
						if(inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics']!=null && inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics']!=undefined)
							inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics'].eventText+=partEvent+'\r\n';
						else
							inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics'] = {etag: hex, href: inputCollection.uid+realEventUID+'.ics', eventText : partEvent+'\r\n'};
					}
					vcalendarText = vcalendarText.replace(partEvent,'');
					parseCounter++;
				}
				if(parseCounter==0 && isEvent)
				{
					if(typeof realEventUID=='undefined' || realEventUID==null)
						console.log("Error: '"+inputCollection.uid+"': unable to parse subscribed vEvent");
					else
						console.log("Error: '"+inputCollection.uid+realEventUID+'.ics'+"': unable to parse subscribed vEvent");
				}
			}
			if(inputCollection.typeList.indexOf('vtodo')!=-1)
			{
				var parseCounter=0;
				var isTodo = false;
				if(vcalendarText.match(vCalendar.pre['vtodo'])!=null)
					isTodo = true;
				while(vcalendarText.match(vCalendar.pre['vtodo'])!=null)
				{
					var partEvent=vcalendarText.substring(vcalendarText.indexOf('BEGIN:VTODO')-2,vcalendarText.indexOf('END:VTODO')+'END:VTODO'.length);
					var realEventUID=partEvent.match(vCalendar.pre['contentline_UID']);

					if(realEventUID!=null)
					{
						realEventUID=realEventUID[0].match(vCalendar.pre['contentline_parse'])[4];
						realEventUID=realEventUID.replace('/','');
					}

					var hex = hex_sha256(partEvent);
					if(inputCollection.urlArray != null)
					{
						if(inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics']!=null && inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics']!=undefined)
							inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics'].eventText+=partEvent+'\r\n';
						else
							inputCollection.urlArray[inputCollection.uid+realEventUID+'.ics'] = {etag: hex, href: inputCollection.uid+realEventUID+'.ics', eventText : partEvent+'\r\n'};
					}
					vcalendarText = vcalendarText.replace(partEvent,'');
					parseCounter++;
				}
				if(parseCounter==0 && isTodo)
				{
					if(typeof realEventUID=='undefined' || realEventUID==null)
						console.log("Error: '"+inputCollection.uid+"': unable to parse subscribed vTodo");
					else
						console.log("Error: '"+inputCollection.uid+realEventUID+'.ics'+"': unable to parse subscribed vTodo");
				}
			}

				if(typeof globalEventList.events[inputCollection.uid] != 'undefined')
				{
					for(event in globalEventList.events[inputCollection.uid])
					{
						if(inputCollection.urlArray[event] == undefined || inputCollection.urlArray[event] == null)
							globalEventList.removeOldEvent(event, true, true);
					}
				}
				else
				{
					for(event in globalEventList.todos[inputCollection.uid])
						if(inputCollection.urlArray[event] == undefined || inputCollection.urlArray[event] == null)
							globalEventList.removeOldEvent(event, true, false);
				}
			netLoadCalendar(inputCollection, inputCollection.urlArray, (inputCollection.forceSyncPROPFIND==undefined || inputCollection.forceSyncPROPFIND==false ? true : false), true, forceLoad, true, false, recursiveIterator, collections);
		}
	});
}
