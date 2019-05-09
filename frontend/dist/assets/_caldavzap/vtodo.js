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

function AppleSupportNextDateArray()
{
	this.nextDates={};
	this.reset=function()
	{
		this.nextDates={};
	};
}

function addAndEditTODO(deleteMode)
{
	var inputUID='';
	if($('#uidTODO').val()!='')
		var coll = globalResourceCalDAVList.getTodoCollectionByUID($('#uidTODO').val().substring(0, $('#uidTODO').val().lastIndexOf('/')+1));
	else
		var coll = globalResourceCalDAVList.getTodoCollectionByUID($('#todo_calendar').val());
	var res = getAccount(coll.accountUID);
	var tmp=res.href.match(vCalendar.pre['hrefRex']);
	var origUID=tmp[1]+res.userAuth.userName+'@'+tmp[2];

	if($('#etagTODO').val()!='')
		inputUID=$('#uidTODO').val();
	else if($('#todo_calendar').val()!='choose')
		inputUID=$('#todo_calendar').val()+'';
	else
		return false;

	todoToVcalendar('EDIT',origUID, inputUID, $('#etagTODO').val(), '',deleteMode);
}

function interResourceEditTODO(operation, delUID)
{
	var inputUID='';
	if($('#uidTODO').val()!='')
		var coll = globalResourceCalDAVList.getTodoCollectionByUID($('#uidTODO').val().substring(0, $('#uidTODO').val().lastIndexOf('/')+1));
	else
		var coll = globalResourceCalDAVList.getTodoCollectionByUID($('#todo_calendar').val());
	var res = getAccount(coll.accountUID);
	var tmp=res.href.match(vCalendar.pre['hrefRex']);
	var origUID=tmp[1]+res.userAuth.userName+'@'+tmp[2];

	if(operation != 'MOVE_IN')
		$('#etagTODO').val('');
	var srcUID=$('#uidTODO').val().substring($('#uidTODO').val().lastIndexOf('/')+1, $('#uidTODO').val().length);

	inputUID=$('#todo_calendar').val()+srcUID;
	todoToVcalendar(operation, origUID, inputUID, '', delUID, false);
}

function saveTodo(deleteMode)
{
	$('#todo_details_template').scrollTop(0);
	var calUID=$('#uidTODO').val().substring(0, $('#uidTODO').val().lastIndexOf('/'));
	var newUID=$('#todo_calendar').val().substring(0, $('#todo_calendar').val().length-1);
	if($('#todo_details_template').find('img[data-type=invalidVerySmall],img[data-type=invalidSmall]').filter(function(){return this.style.display!='none'}).length>0)
	{
		show_editor_loader_messageCalendar('vtodo', 'message_error', localization[globalInterfaceLanguage].txtErorInputTodo);
		return false;
	}

	if($('#todo_calendar').val()!='choose')
	{
		if($('#nameTODO').val()=='')
			$('#name').val(localization[globalInterfaceLanguage].pholderNewTODO);

		if($('#todo_type').val()=='start' || $('#todo_type').val()=='due' || $('#todo_type').val()=='both')
		{
			if($('#date_toTODO').val()!='' && $('#date_fromTODO').val()!='')
			{
				var a=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_fromTODO').val());
				var a2=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_toTODO').val());
				var datetime_from=$.fullCalendar.formatDate(a, 'yyyy-MM-dd');
				var datetime_to=$.fullCalendar.formatDate(a2, 'yyyy-MM-dd');
				var time_from='00:00';
				var time_to='00:00';
				if($('#time_fromTODO').val()!='' && $('#time_toTODO').val()!='')
				{
					time_from=new Date(Date.parse("01/02/1990, "+$('#time_fromTODO').val()));
					time_from=$.fullCalendar.formatDate(time_from, 'HH:mm' );
					time_to=new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val()));
					time_to=$.fullCalendar.formatDate(time_to, 'HH:mm' );
				}
				if($('#todo_type').val()=='both' && $.fullCalendar.parseDate(datetime_from+'T'+time_from+'Z')>$.fullCalendar.parseDate(datetime_to+'T'+time_to+'Z'))
				{
					show_editor_loader_messageCalendar('vtodo', 'message_error', localization[globalInterfaceLanguage].txtErrorDatesTodo);
					return false;
				}
			}

			if($('#date_toTODO').val()!='' || $('#date_fromTODO').val()!='')
			{
				if(newUID==calUID || $('#etagTODO').val()=='')
					addAndEditTODO(deleteMode);
//				else if(calUID.substring(0, calUID.lastIndexOf('/'))==newUID.substring(0, newUID.lastIndexOf('/')))
//				{
//					var delUID=$('#uidTODO').val();
//					interResourceEditTODO('MOVE_IN',delUID);
//				}
				else if(/*calUID.substring(0, calUID.lastIndexOf('/'))!=newUID.substring(0, newUID.lastIndexOf('/')) && */$('#etagTODO').val()!='')
				{
					var delUID=$('#uidTODO').val();
					interResourceEditTODO('MOVE_OTHER',delUID);
				}
			}
			else
				show_editor_loader_messageCalendar('vtodo', 'message_error', localization[globalInterfaceLanguage].txtDateTimeErrorTodo);
		}
		else
		{
			if((newUID==calUID) || ($('#etagTODO').val()==''))
				addAndEditTODO(deleteMode);
//			else if(calUID.substring(0, calUID.lastIndexOf('/'))==newUID.substring(0, newUID.lastIndexOf('/')))
//			{
//				var delUID=$('#uidTODO').val();
//				interResourceEditTODO('MOVE_IN',delUID);
//			}
			else if(/*calUID.substring(0, calUID.lastIndexOf('/'))!=newUID.substring(0, newUID.lastIndexOf('/')) && */ $('#etagTODO').val()!='')
			{
				var delUID=$('#uidTODO').val();
				interResourceEditTODO('MOVE_OTHER',delUID);
			}
		}
	}
	else
		show_editor_loader_messageCalendar('vtodo', 'message_error', localization[globalInterfaceLanguage].txtNotChooseTodo);
}

function deleteTodo()
{
	var delUID=$('#uidTODO').val();

	if(delUID!='')
		deleteVcalendarFromCollection(delUID,'vtodo');
}

function getRepeatTodoObject(inputRepeatObj)
{
	var appleTodoMode = false;
	var tzArray=new Array();
	var tzString='';
	var isTimeZone=false;
	var origTimezone = '';
	var vCalendarText = inputRepeatObj.vCalendarText;
	var sel_option = '';
	var inputTodos=jQuery.grep(globalEventList.displayTodosArray[inputRepeatObj.rid],function(e){if(e.id==inputRepeatObj.uidTodo && ((globalSettings.appleremindersmode.value || e.repeatCount<2) || !e.repeatCount))return true});
	if(globalSettings.appleremindersmode.value && inputTodos.length==1)
	{
		if(inputRepeatObj.recurrenceId!='' || inputRepeatObj.futureStart!='')
			appleTodoMode = true;
	}
	for(var iE=0;iE<inputTodos.length;iE++)
	{
		if(tzArray.indexOf(inputTodos[iE].timeZone)==-1)
		{
			if(!appleTodoMode && inputRepeatObj.deleteMode && (inputRepeatObj.vcalendarHash==hex_sha256(inputTodos[iE].vcalendar)))
				continue;
			var component=buildTimezoneComponent(inputTodos[iE].timeZone);
			if(component!='' && (inputRepeatObj.vcalendarHash!=hex_sha256(inputTodos[iE].vcalendar)))
			{
				tzArray[tzArray.length]=inputTodos[iE].timeZone;
				tzString+=component;
				if(tzString.lastIndexOf('\r\n')!=(tzString.length-2))
					tzString+='\r\n';
				isTimeZone=true;
			}
			else if(component!='' && (inputRepeatObj.vcalendarHash==hex_sha256(inputTodos[iE].vcalendar)))
				origTimezone+=component;
		}
	}
	if(isTimeZone)
	{
		if(vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2))
			vCalendarText+='\r\n';
		vCalendarText+=tzString;
	}

	var newFirst = vCalendarText;
	var origRepeatRule = '';
	var realTodo='';
	var origVcalendarString='';
	var todoStringArray=new Array();
	if(inputTodos.length>0)
	{
		var rid=inputRepeatObj.uidTodo.substring(0, inputRepeatObj.uidTodo.lastIndexOf('/')+1);
		if(rid && globalEventList.todos[rid][inputRepeatObj.uidTodo].uid!=undefined)
			origVcalendarString=globalEventList.todos[rid][inputRepeatObj.uidTodo].vcalendar;
		while(origVcalendarString.match(vCalendar.pre['vtodo'])!=null)
		{
			if(origVcalendarString.substring(origVcalendarString.indexOf('BEGIN:VTODO')-2, origVcalendarString.indexOf('BEGIN:VTODO'))=='\r\n')
			{
				var partTodo=origVcalendarString.substring(origVcalendarString.indexOf('BEGIN:VTODO')-2,origVcalendarString.indexOf('END:VTODO')+'END:VTODO'.length);
				origVcalendarString=origVcalendarString.replace(partTodo, '');
			}
			else
			{
				var partTodo=origVcalendarString.substring(origVcalendarString.indexOf('BEGIN:VTODO'),origVcalendarString.indexOf('END:VTODO')+'END:VTODO'.length);
				origVcalendarString=origVcalendarString.replace(partTodo, '');
				partTodo+='\r\n';
			}
			todoStringArray[todoStringArray.length]=partTodo;
		}
	}
	var beginVcalendar = vCalendarText;
	var futureMode = false;
	for(var j=0;j<inputTodos.length;j++)
	{
		todoStringArray.splice(todoStringArray.indexOf(inputTodos[j].vcalendar),1);
		if((inputRepeatObj.futureStart== '' &&  inputRepeatObj.vcalendarHash!=hex_sha256(inputTodos[j].vcalendar)) || inputTodos[j].rec_id!=inputRepeatObj.recurrenceId)
		{
			var stringUIDcurrent=inputTodos[j].vcalendar.match(vCalendar.pre['contentline_UID']);
			if(stringUIDcurrent!=null)
				stringUIDcurrent=stringUIDcurrent[0].match(vCalendar.pre['contentline_parse'])[4];
			if((inputRepeatObj.deleteMode && inputRepeatObj.vcalendarHash==hex_sha256(inputTodos[j].vcalendar)) || (inputRepeatObj.deleteMode && !inputTodos[j].rec_id && inputRepeatObj.vcalendarUID==stringUIDcurrent) || appleTodoMode)
			{
				var ruleString=inputTodos[j].vcalendar.match(vCalendar.pre['contentline_RRULE2']);
				var origRuleString=ruleString;
				origRepeatRule = ruleString;
				var exDate=inputTodos[j].start;
				var process_elem=vCalendar.tplC['VTcontentline_EXDATE'];
				process_elem=process_elem.replace('##:::##group_wd##:::##', '');
				process_elem=process_elem.replace('##:::##params_wsc##:::##', '');

				exDate=inputRepeatObj.recurrenceId.parseComnpactISO8601();

				if(globalSettings.timezonesupport.value)
					sel_option=inputRepeatObj.timezoneTODO;

				if(sel_option!='local')
				{
					var valOffsetFrom=getOffsetByTZ(sel_option, exDate);
					var intOffset = valOffsetFrom.getSecondsFromOffset()*-1;
					exDate = new Date(exDate.setSeconds(intOffset));
				}
				else
					exDate=new Date(exDate.setSeconds(getLocalOffset(exDate)));

				exDate=$.fullCalendar.formatDate(exDate, "yyyyMMdd'T'HHmmss'Z'");
				process_elem=process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
				process_elem=process_elem.replace('##:::##TZID##:::##','');
				process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(exDate));
				if(inputTodos[j].finalString.length>2);
					inputTodos[j].vcalendar=inputTodos[j].vcalendar.replace(ruleString,ruleString+(inputTodos[j].finalString.substring(2,inputTodos[j].finalString.length)));
				if(!appleTodoMode)
					inputTodos[j].vcalendar=inputTodos[j].vcalendar.replace(ruleString,ruleString+process_elem);
			}
			else
			{
				var endPart = (inputTodos[j].vcalendar+'\r\n').match(vCalendar.pre['endVTODO']);
				if(endPart!=null)
				{
					if(inputTodos[j].finalString.length>2)
						inputTodos[j].vcalendar=inputTodos[j].vcalendar.replace(endPart[0].substring(0,endPart[0].length-2),(inputTodos[j].finalString)+endPart[0].substring(2,endPart[0].length));
				}
			}

			var origVcalendar = inputTodos[j].vcalendar;
			if(appleTodoMode && typeof globalAppleSupport.nextDates[inputTodos[j].id] != 'undefined')
			{
				var startPart='',endPart='';
				if(origVcalendar.match(vCalendar.pre['contentline_DTSTART'])!=null && origVcalendar.match(vCalendar.pre['contentline_DUE'])!=null)
				{
					startPart = origVcalendar.match(vCalendar.pre['contentline_DTSTART'])[0].match(vCalendar.pre['contentline_parse'])[4];
					endPart = origVcalendar.match(vCalendar.pre['contentline_DUE'])[0].match(vCalendar.pre['contentline_parse'])[4];
				}

				var isUTC=false;
				if(globalSettings.timezonesupport.value)
					sel_option=inputRepeatObj.timezoneTODO;

				if(sel_option=='UTC')
					isUTC=true;

				var newStart = new Date(globalAppleSupport.nextDates[inputTodos[j].id].getTime());
				var valOffsetFrom=getOffsetByTZ(sel_option,newStart );
				var intOffset='';
				if(typeof globalSessionTimeZone!='undefined' && globalSessionTimeZone!=null && globalSessionTimeZone!='')
					intOffset=getOffsetByTZ(globalSessionTimeZone, newStart).getSecondsFromOffset();
				else
					intOffset=newStart.getTimezoneOffset()*60*-1;

				intOffset = valOffsetFrom.getSecondsFromOffset() - intOffset;

				newStart.setSeconds(intOffset);
				var datetime_to=$.fullCalendar.formatDate(newStart, "yyyyMMdd'T'HHmmss");
				inputTodos[j].vcalendar = inputTodos[j].vcalendar.replace(endPart,vcalendarEscapeValue(datetime_to+(isUTC ? 'Z' : '')));
				inputTodos[j].vcalendar = inputTodos[j].vcalendar.replace(startPart,vcalendarEscapeValue(datetime_to+(isUTC ? 'Z' : '')));
				if(inputTodos[j].after!='')
					inputTodos[j].vcalendar = changeRuleForFuture(inputTodos[j], inputTodos[j].after);
				origVcalendar = inputTodos[j].vcalendar;
			}

			if(origVcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2))
				vCalendarText+=origVcalendar.substring(2,origVcalendar.length);
			else if((origVcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || (origVcalendar.indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) )
				vCalendarText+=origVcalendar;
			else
				vCalendarText+='\r\n'+origVcalendar;
		}
		else if(inputRepeatObj.futureStart.split(';')[0]!='' && inputRepeatObj.futureStart.split(';')[1]!=inputTodos[j].start && inputRepeatObj.futureStart.split(';')[1]!=inputTodos[j].end)
		{
			var ruleString=inputTodos[j].vcalendar.match(vCalendar.pre['contentline_RRULE2']);
			if(inputTodos[j].finalString.length>2);
				inputTodos[j].vcalendar=inputTodos[j].vcalendar.replace(ruleString,ruleString+(inputTodos[j].finalString.substring(2,inputTodos[j].finalString.length)));
			if(inputRepeatObj.futureStart.split(';')[0]>1 && inputRepeatObj.vcalendarHash==hex_sha256(inputTodos[j].vcalendar))
				inputTodos[j].vcalendar=changeRuleForFuture(inputTodos[j], inputRepeatObj.futureStart.split(';')[0]);
			if(inputTodos[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2))
				vCalendarText+=inputTodos[j].vcalendar.substring(2,inputTodos[j].vcalendar.length);
			else if((inputTodos[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || (inputTodos[j].vcalendar.indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) )
				vCalendarText+=inputTodos[j].vcalendar;
			else
				vCalendarText+='\r\n'+inputTodos[j].vcalendar;
			futureMode=true;
		}
		else if(inputRepeatObj.deleteMode && inputRepeatObj.futureStart.split(';')[0]!='' && (inputRepeatObj.futureStart.split(';')[1]==inputTodos[j].start || inputRepeatObj.futureStart.split(';')[1]==inputTodos[j].end))
		{
			var ruleString=inputTodos[j].vcalendar.match(vCalendar.pre['contentline_RRULE2']);
			if(inputTodos[j].finalString.length>2);
				inputTodos[j].vcalendar=inputTodos[j].vcalendar.replace(ruleString,ruleString+(inputTodos[j].finalString.substring(2,inputTodos[j].finalString.length)));

			if(inputRepeatObj.vcalendarHash==hex_sha256(inputTodos[j].vcalendar))
				inputTodos[j].vcalendar=changeRuleForFuture(inputTodos[j], 2);
			if(inputTodos[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2))
				vCalendarText+=inputTodos[j].vcalendar.substring(2,inputTodos[j].vcalendar.length);
			else if((inputTodos[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || (inputTodos[j].vcalendar.indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) )
				vCalendarText+=inputTodos[j].vcalendar;
			else
				vCalendarText+='\r\n'+inputTodos[j].vcalendar;
		}
		else
			realTodo=inputTodos[j];
	}
	vCalendarText=vCalendarText.replace(realTodo.vcalendar,'');

	if(!appleTodoMode)
		for(var ip=0; ip<todoStringArray.length;ip++)
		{
			if(todoStringArray[ip].indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2))
				vCalendarText+=todoStringArray[ip].substring(2,todoStringArray[ip].length);
			else if((todoStringArray[ip].indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || (todoStringArray[ip].indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) )
				vCalendarText+=todoStringArray[ip];
			else
				vCalendarText+='\r\n'+todoStringArray[ip];
		}
	return {
		tzArray:tzArray,
		tzString:tzString,
		isTimeZone:isTimeZone,
		origTimezone:origTimezone,
		vCalendarText:vCalendarText,
		realTodo:realTodo,
		sel_option: sel_option,
		futureMode:futureMode,
		appleTodoMode:appleTodoMode,
		newFirst:newFirst,
		beginVcalendar:beginVcalendar
	};
}

function todoToVcalendar(operation, accountUID, inputUID, inputEtag, delUID, deleteMode)
{
	var vtodo=false;
	var vCalendarText='',
	groupCounter=0;
	var repeatHash = 'form';
	if(delUID!='')
		var rid=delUID.substring(0, delUID.lastIndexOf('/')+1);
	else
		var rid=inputUID.substring(0, inputUID.lastIndexOf('/')+1);
	// vCalendar BEGIN (required by RFC)
	if(vCalendar.tplM['VTbegin'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTbegin'][repeatHash][0])!=undefined)
		vCalendarText+=vCalendar.tplM['VTbegin'][repeatHash][0];
	else
	{
		process_elem=vCalendar.tplC['VTbegin'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		vCalendarText+=process_elem;
	}

	// VERSION (required by RFC)
	if(vCalendar.tplM['VTcontentline_VERSION'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_VERSION'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
	}
	process_elem=process_elem.replace('##:::##version##:::##', '2.0');
	vCalendarText+=process_elem;

	// CALSCALE
	if(vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_CALSCALE'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
	}
	process_elem=process_elem.replace('##:::##calscale##:::##', 'GREGORIAN');
	vCalendarText+=process_elem;

	var resultTodoObj = getRepeatTodoObject({
		rid:rid,
		uidTodo:$('#uidTODO').val(),
		vcalendarHash: $('#vcalendarHashTODO').val(),
		vcalendarUID: $('#vcalendarUIDTODO').val(),
		recurrenceId: $('#recurrenceIDTODO').val(),
		timezoneTODO: $('#timezoneTODO').val(),
		futureStart: $('#futureStartTODO').val(),
		deleteMode: deleteMode,
		vCalendarText:vCalendarText
	});
	vCalendarText = resultTodoObj.vCalendarText;
	var tzArray=resultTodoObj.tzArray;
	var tzString=resultTodoObj.tzString;
	var isTimeZone=resultTodoObj.isTimeZone;
	var origTimezone =resultTodoObj.origTimezone;
	var appleTodoMode=resultTodoObj.appleTodoMode;
	var realTodo = resultTodoObj.realTodo;
	var newFirst = resultTodoObj.newFirst;
	var sel_option = resultTodoObj.sel_option;

	//until here will function TODOCLICK
	var origEvent='';
	if(deleteMode || resultTodoObj.futureMode)
	{
		if(vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2))
			vCalendarText+='\r\n';
		if(!isTimeZone && ( appleTodoMode || (resultTodoObj.futureMode && origTimezone!='')))
		{
			vCalendarText+=origTimezone;
			if(vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2))
				vCalendarText+='\r\n';
		}
		// PRODID
		if(vCalendar.tplM['VTcontentline_PRODID'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_PRODID'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		process_elem=process_elem.replace('##:::##value##:::##', '-//Inf-IT//'+globalAppName+' '+globalVersion+'//EN');
		vCalendarText+=process_elem;

		if(typeof vCalendar.tplM['VTunprocessed'][repeatHash]!='undefined' && vCalendar.tplM['VTunprocessed'][repeatHash]!='' && vCalendar.tplM['VTunprocessed'][repeatHash]!=null)
			vCalendarText+=vCalendar.tplM['VTunprocessed'][repeatHash].replace(RegExp('^\r\n'), '');

		vCalendar.tplM['VTunprocessed'][repeatHash]=new Array();
		// vCalendar END (required by RFC)

		if(vCalendar.tplM['VTend'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTend'][repeatHash][0])!=undefined)
			vCalendarText+=vCalendar.tplM['VTend'][repeatHash][0];
		else
		{
			process_elem=vCalendar.tplC['VTend'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			vCalendarText+=process_elem;
		}
		if(deleteMode)
		{
			var fixedArr = checkAndFixMultipleUID(vCalendarText,false);
			var inputS = fixedArr[0];
			fixedArr.splice(0,1);
			return putVcalendarToCollection(accountUID, inputUID, inputEtag, inputS, delUID,'vtodo',false,deleteMode,fixedArr);
		}
		else if(resultTodoObj.futureMode)
		{
			origEvent = vCalendarText;
			vCalendarText = resultTodoObj.beginVcalendar;
		}
	}

	var timeZoneAttr='';
	if(typeof globalSessionTimeZone!='undefined' && globalSessionTimeZone)
		sel_option=globalSessionTimeZone;
	var isUTC=false;

	var origFirst=vCalendarText;
	if(appleTodoMode)
		vCalendarText='';
	if($('#todo_type').val()!='none')
	{
		if(globalSettings.timezonesupport.value)
			sel_option=$('#timezoneTODO').val();

		if(sel_option=='UTC')
		{
			isUTC=true;
			timeZoneAttr='';
		}
		else if(sel_option=='local')
			timeZoneAttr='';
		else if(sel_option=='custom')
			timeZoneAttr=';'+vcalendarEscapeValue('TZID='+realTodo.timeZone);
		else
			timeZoneAttr=';'+vcalendarEscapeValue('TZID='+sel_option);

		if(vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2))
			vCalendarText+='\r\n';

		if(globalSettings.rewritetimezonecomponent.value || !vCalendar.tplM['VTunprocessedVTIMEZONE'][repeatHash])
		{
			if(tzArray.indexOf(sel_option)==-1)
				vCalendarText+= buildTimezoneComponent(sel_option);
		}
		else
			vCalendarText+=vCalendar.tplM['VTunprocessedVTIMEZONE'][repeatHash];
	}
	origFirst+=vCalendarText;
	// ---------------------------------------------------------------------------------------------------- //
	if(vCalendar.tplM['VTbeginVTODO'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTbeginVTODO'][repeatHash][0])!=undefined)
		vCalendarText+=vCalendar.tplM['VTbeginVTODO'][repeatHash][0];
	else
	{
		process_elem=vCalendar.tplC['VTbeginVTODO'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		vCalendarText+=process_elem;
		vtodo=true;
	}
	var d, utc;
	d=new Date();
	utc=d.getUTCFullYear()+(d.getUTCMonth()+1<10 ? '0': '')+(d.getUTCMonth()+1)+(d.getUTCDate()<10 ? '0': '')+d.getUTCDate()+'T'+(d.getUTCHours()<10 ? '0': '')+d.getUTCHours()+(d.getUTCMinutes()<10 ? '0': '')+d.getUTCMinutes()+(d.getUTCSeconds()<10 ? '0': '')+d.getUTCSeconds()+'Z';
	var create=true;

	if($('#recurrenceIDTODO').val()=='')
		var checkVal='orig';
	else
		var checkVal=$('#recurrenceIDTODO').val();

	var created='';
	for(vev in vCalendar.tplM['VTcontentline_CREATED'][repeatHash])
	{
		if(vev==checkVal)
			created=vCalendar.tplM['VTcontentline_CREATED'][repeatHash][vev];
	}

	if(created!='')
	{
		process_elem=created;
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_CREATED'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(utc));
	}
	vCalendarText+=process_elem;

	if(vCalendar.tplM['VTcontentline_LM'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_LM'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_LM'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
	}
	process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(utc));
	vCalendarText+=process_elem;

	if(vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_DTSTAMP'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
	}
	process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(utc));
	vCalendarText+=process_elem;

	// UID (required by RFC)
	if(!appleTodoMode && $("#futureStartTODO").val()=='' && (operation!='MOVE_IN'&& operation!='MOVE_OTHER') && vCalendar.tplM['VTcontentline_UID'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_UID'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_UID'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
	}
	var newUID=globalEventList.getNewUID();
	// it is VERY small probability, that for 2 newly created events the same UID is generated (but not impossible :( ...)
	process_elem=process_elem.replace('##:::##uid##:::##', newUID);
	vCalendarText+=process_elem;

	if(vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_SUMMARY'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
	}
	if($('#nameTODO').val()=='')
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("New TODO"));
	else
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#nameTODO').val()));
	//process_elem=process_elem.replace('##:::##value##:::##',vcalendarEscapeValue('zmena'));
	vCalendarText+=process_elem;

	if($('#statusTODO').val()!='NONE')
	{
		//if((value=$('[id="vcalendar_editor"] [data-type="\\%note"]').find('textarea').val())!='')
		//{
		if(vCalendar.tplM['VTcontentline_STATUS'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_STATUS'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#statusTODO').val()));
		vCalendarText+=process_elem;
	}

	if($('#percenteCompleteValue').val()!='')
	{
		if(vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_PERCENT-COMPLETE'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#percenteCompleteValue').val()));
		vCalendarText+=process_elem;
	}

	if($('#priority_TODO').val()!='0')
	{
		if(vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_PRIORITY'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#priority_TODO').val()));
		vCalendarText+=process_elem;
	}

	if($('#noteTODO').val()!='')
	{
		// NOTE
		if(vCalendar.tplM['VTcontentline_NOTE'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_NOTE'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#noteTODO').val()));
		vCalendarText+=process_elem;
	}

	if($('#typeTODO').val()!='')
	{
		// CLASS
		if(vCalendar.tplM['VTcontentline_CLASS'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_CLASS'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
			if(typeof vCalendar.tplM['VTcontentline_CLASS'][repeatHash] =='undefined' || vCalendar.tplM['VTcontentline_CLASS'][repeatHash]==null || vCalendar.tplM['VTcontentline_CLASS'][repeatHash].length==0)
				process_elem='';
		}

		if($('.row_typeTODO').css('display')!='none')
		{
			process_elem=vCalendar.tplC['VTcontentline_CLASS'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
			process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#typeTODO').val().toUpperCase()));
		}
		vCalendarText+=process_elem;
	}

	if($('#url_TODO').val()!='')
	{
		if(vCalendar.tplM['VTcontentline_URL'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_URL'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_URL'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#url_TODO').val()));
		vCalendarText+=process_elem;
	}

	//RFC OPTIONAL
	if(vCalendar.tplM['VTcontentline_LOCATION'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)','m'));
		if(parsed[1]!='')	// if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.','\\.'),'mg'),'\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_LOCATION'];
		process_elem=process_elem.replace('##:::##group_wd##:::##','');
		process_elem=process_elem.replace('##:::##params_wsc##:::##','');
	}

	if($('#location_TODO').val()!='')
	{
		process_elem=process_elem.replace('##:::##value##:::##',vcalendarEscapeValue($('#location_TODO').val()));
		vCalendarText+=process_elem;
	}

	if($('#repeat_TODO').val()!='no-repeat')
	{
		var interval=$("#repeat_interval_detail_TODO").val();
		var byDay='';
		var isCustom=false;
		var monthDay='';
		var bymonth='';
		var wkst='';
		if(interval==1 || interval=='')
			interval='';
		else interval=";INTERVAL="+$("#repeat_interval_detail_TODO").val();

		var frequency=$('#repeat_TODO').val();
		if(frequency=='TWO_WEEKLY')
		{
			frequency='WEEKLY';
			interval=";INTERVAL="+2;
		}
		else if(frequency=='BUSINESS')
		{
			frequency='WEEKLY';
			byDay=';BYDAY=';
			if(globalSettings.weekenddays.value.length>0)
			{
				for(var i=0;i<7;i++)
					if(globalSettings.weekenddays.value.indexOf(i)==-1)
						byDay+=i+',';
				byDay=byDay.substring(0,byDay.length-1);
				byDay=byDay.replace(1,'MO').replace(2,'TU').replace(3,'WE').replace(4,'TH').replace(5,'FR').replace(6,'SA').replace(0,'SU');
			}
			else
			{
				byDay='SA,SU';
			}
			interval='';
		}
		else if(frequency=='WEEKEND')
		{
			frequency='WEEKLY';
			byDay=';BYDAY=';
			if(globalSettings.weekenddays.value.length>0)
			{
				for(var i=0;i<globalSettings.weekenddays.value.length;i++)
					byDay+=globalSettings.weekenddays.value[i]+',';
				byDay=byDay.substring(0,byDay.length-1);
				byDay=byDay.replace(1,'MO').replace(2,'TU').replace(3,'WE').replace(4,'TH').replace(5,'FR').replace(6,'SA').replace(0,'SU');
			}
			else
			{
				byDay='SA,SU';
			}
			interval='';
		}
		else if(frequency=='CUSTOM_WEEKLY')
		{
			frequency='WEEKLY';
			var byDayArray=$('#week_custom_TODO .customTable td.selected');
			if(byDayArray.length>0)
			{
				byDay=';BYDAY=';
				for(var ri=0;ri<byDayArray.length;ri++)
					byDay+=$(byDayArray[ri]).attr('data-type')+',';
				byDay=byDay.substring(0,byDay.length-1);
				byDay=byDay.replace(1,'MO').replace(2,'TU').replace(3,'WE').replace(4,'TH').replace(5,'FR').replace(6,'SA').replace(0,'SU');
				if(globalSettings.mozillasupport.value==null || !globalSettings.mozillasupport.value)
					if(realTodo!='')
					{
						if(realTodo.wkst!='')
							wkst=';WKST='+realTodo.wkst.replace(1,'MO').replace(2,'TU').replace(3,'WE').replace(4,'TH').replace(5,'FR').replace(6,'SA').replace(0,'SU');
					}
					else
						wkst=';WKST='+globalSettings.datepickerfirstdayofweek.value.toString().replace(1,'MO').replace(2,'TU').replace(3,'WE').replace(4,'TH').replace(5,'FR').replace(6,'SA').replace(0,'SU');
			}
		}
		else if(frequency=='CUSTOM_MONTHLY')
		{
			frequency='MONTHLY';
			var byDayFirstPart='';
			var monthCustomOption = $('#repeat_month_custom_select_TODO').val();
			if(monthCustomOption!='custom' && $('#repeat_month_custom_select2_TODO').val()!='DAY')
			{
				if(monthCustomOption!='')
					byDay=';BYDAY=';
				switch(monthCustomOption)
				{
					case 'every':
						byDayFirstPart='';
						break;
					case 'first':
						byDayFirstPart='1';
						break;
					case 'second':
						byDayFirstPart='2';
						break;
					case 'third':
						byDayFirstPart='3';
						break;
					case 'fourth':
						byDayFirstPart='4';
						break;
					case 'fifth':
						byDayFirstPart='5';
						break;
					case 'last':
						byDayFirstPart='-1';
						break;
					default:
						byDayFirstPart='';
						break;
				}
				byDay+= byDayFirstPart+$('#repeat_month_custom_select2_TODO').val();
			}
			else if(monthCustomOption!='custom' && $('#repeat_month_custom_select2_TODO').val()=='DAY')
			{
				byDay='';
				switch(monthCustomOption)
				{
					case 'every':
						monthDay=';BYMONTHDAY=';
						for(var p=1;p<32;p++)
							monthDay+=p+',';
						monthDay=monthDay.substring(0,monthDay.length-1);
						break;
					case 'first':
						monthDay=';BYMONTHDAY=1';
						break;
					case 'second':
						monthDay=';BYMONTHDAY=2';
						break;
					case 'third':
						monthDay=';BYMONTHDAY=3';
						break;
					case 'fourth':
						monthDay=';BYMONTHDAY=4';
						break;
					case 'fifth':
						monthDay=';BYMONTHDAY=5';
						break;
					case 'last':
						monthDay=';BYMONTHDAY=-1';
						break;
					default:
						byDayFirstPart='';
						monthDay='';
						break;
				}
			}
			else
			{
				var monthDayArray = $('#month_custom2_TODO .selected');
				if(monthDayArray.length>0)
				{
					monthDay=';BYMONTHDAY=';
					for(var ri=0;ri<monthDayArray.length;ri++)
						monthDay+=$(monthDayArray[ri]).attr('data-type')+',';
					monthDay=monthDay.substring(0,monthDay.length-1);
				}
			}
		}
		else if(frequency=='CUSTOM_YEARLY')
		{
			frequency='YEARLY';
			var byDayFirstPart='';
			var monthCustomOption = $('#repeat_year_custom_select1_TODO').val();
			var monthArray = $('#year_custom3_TODO .selected');
			if(monthArray.length>0)
			{
				bymonth=';BYMONTH=';
				for(var ri=0;ri<monthArray.length;ri++)
				{
					var val = parseInt($(monthArray[ri]).attr('data-type'),10);
					if(!isNaN(val))
						bymonth+=(val+1)+',';
				}
				bymonth=bymonth.substring(0,bymonth.length-1);
			}
			if(monthCustomOption!='custom' && $('#repeat_year_custom_select2_TODO').val()!='DAY')
			{
				if(monthCustomOption!='')
					byDay=';BYDAY=';
				switch(monthCustomOption)
				{
					case 'every':
						byDayFirstPart='';
						break;
					case 'first':
						byDayFirstPart='1';
						break;
					case 'second':
						byDayFirstPart='2';
						break;
					case 'third':
						byDayFirstPart='3';
						break;
					case 'fourth':
						byDayFirstPart='4';
						break;
					case 'fifth':
						byDayFirstPart='5';
						break;
					case 'last':
						byDayFirstPart='-1';
						break;
					default:
						byDayFirstPart='';
						break;
				}
				byDay+= byDayFirstPart+$('#repeat_month_custom_select2_TODO').val();
			}
			else if(monthCustomOption!='custom' && $('#repeat_year_custom_select2_TODO').val()=='DAY')
			{
				byDay='';
				switch(monthCustomOption)
				{
					case 'every':
						monthDay=';BYMONTHDAY=';
						for(var p=1;p<32;p++)
							monthDay+=p+',';
						monthDay=monthDay.substring(0,monthDay.length-1);
						break;
					case 'first':
						monthDay=';BYMONTHDAY=1';
						break;
					case 'second':
						monthDay=';BYMONTHDAY=2';
						break;
					case 'third':
						monthDay=';BYMONTHDAY=3';
						break;
					case 'fourth':
						monthDay=';BYMONTHDAY=4';
						break;
					case 'fifth':
						monthDay=';BYMONTHDAY=5';
						break;
					case 'last':
						monthDay=';BYMONTHDAY=-1';
						break;
					default:
						byDayFirstPart='';
						monthDay='';
						break;
				}
			}
			else
			{
				var monthDayArray = $('#year_custom1_TODO .selected');
				if(monthDayArray.length>0)
				{
					monthDay=';BYMONTHDAY=';
					for(var ri=0;ri<monthDayArray.length;ri++)
						monthDay+=$(monthDayArray[ri]).attr('data-type')+',';
					monthDay=monthDay.substring(0,monthDay.length-1);
				}
			}
		}
		else if($('#repeat_TODO option:selected').attr('data-type')=="custom_repeat")
			isCustom=true;

		if(vCalendar.tplM['VTcontentline_RRULE'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_RRULE'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}

		if(!isCustom)
		{
			if($('#repeat_end_details_TODO').val()=="on_date")
			{
				var dateUntil=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#repeat_end_date_TODO').val());
				var datetime_until='';
				if($('#todo_type').val()=='start')
					var tForR=new Date(Date.parse("01/02/1990, "+$('#time_fromTODO').val()));
				else
					var tForR=new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val()));
				dateUntil.setHours(tForR.getHours());
				dateUntil.setMinutes(tForR.getMinutes());
				dateUntil.setSeconds(tForR.getSeconds());
				if(globalSettings.timezonesupport.value && sel_option in timezones)
					var valOffsetFrom=getOffsetByTZ(sel_option, dateUntil);
				if(valOffsetFrom)
				{
					var intOffset=valOffsetFrom.getSecondsFromOffset()*1000*-1;
					dateUntil.setTime(dateUntil.getTime()+intOffset);
				}
				datetime_until=$.fullCalendar.formatDate(dateUntil, "yyyyMMdd'T'HHmmss'Z'");
				process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("FREQ="+frequency)+interval+";UNTIL="+datetime_until+bymonth+monthDay+byDay+wkst);
			}
			else if($('#repeat_end_details_TODO').val()=="after")
				process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("FREQ="+frequency)+interval+";COUNT="+(parseInt($('#repeat_end_after_TODO').val()))+bymonth+monthDay+byDay+wkst);
			else
				process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("FREQ="+frequency)+interval+bymonth+monthDay+byDay+wkst);
		}
		else
			process_elem=process_elem.replace('##:::##value##:::##', $('#repeat_TODO').val());
		vCalendarText+=process_elem;

		if(realTodo.repeatStart || realTodo.repeatEnd)
		{
			if(realTodo.repeatStart)
				var a=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_fromTODO').val());
			else
				var a=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_toTODO').val());
			if(realTodo.repeatStart)
				var repeatStart=realTodo.repeatStart;
			else
				var repeatStart=realTodo.repeatEnd;

			var b=new Date(1970,1,1,0,0,0);
			if(realTodo.repeatStart)
				b=new Date(Date.parse("01/02/1990, "+$('#time_fromTODO').val() ));
			else
				b=new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val() ));
			a.setHours(b.getHours());
			a.setMinutes(b.getMinutes());
			a.setSeconds(b.getSeconds());

			var offsetDate=a-repeatStart;
			for(var iter in vCalendar.tplM['VTcontentline_EXDATE'][repeatHash])
			{
				if(isNaN(iter))
					continue;

				var exStr=('\r\n'+vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][iter]).match(vCalendar.pre['contentline_parse']);
				var exVal=exStr[4].parseComnpactISO8601();
				if(exVal)
				{
					if(exStr[4].indexOf('T')==-1)
					{
						//HERE
						if(realTodo.repeatStart)
							var timePart = new Date(Date.parse("01/02/1990, "+$('#time_fromTODO').val() ));
						else
							var timePart = new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val() ));
						var time_from = $.fullCalendar.formatDate(b, 'HHmmss');
						exVal = (exStr[4] + 'T' + time_from).parseComnpactISO8601();
						if(sel_option!='local')
						{
							var valOffsetFrom=getOffsetByTZ(sel_option, exVal);
							var intOffset = valOffsetFrom.getSecondsFromOffset()*-1;
							exVal = new Date(exVal.setSeconds(intOffset));
						}
					}
					else if(exStr[4].indexOf('T')!=-1)
					{
						if(sel_option!='local')
						{
							var valOffsetFrom=getOffsetByTZ(sel_option, exVal);
							var origValOffset = getOffsetByTZ(realTodo.timeZone, exVal);
							var intOffset = (valOffsetFrom.getSecondsFromOffset() - origValOffset.getSecondsFromOffset())*-1;
							exVal = new Date(exVal.setSeconds(intOffset));
						}
						else
						{
							var origValOffset = getOffsetByTZ(realTodo.timeZone, exVal);
							exVal = new Date(exVal.setSeconds(origValOffset.getSecondsFromOffset()));
						}
					}

					var value=new Date(exVal.getTime()+offsetDate);
					process_elem=vCalendar.tplC['VTcontentline_EXDATE'];
					process_elem=process_elem.replace('##:::##group_wd##:::##', '');
					process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
					newValue=$.fullCalendar.formatDate(value, "yyyyMMdd'T'HHmmss")+(sel_option!='local' ? 'Z' : '');
					process_elem=process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
					process_elem=process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
					process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
					vCalendarText+=process_elem;
				}
			}
		}
	}

	//RECURRENCE-ID
	if($('#recurrenceIDTODO').val() && !appleTodoMode)
	{
		if(vCalendar.tplM['VTcontentline_REC_ID'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_REC_ID'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}

		var rec_id=$('#recurrenceIDTODO').val()
		if(rec_id.indexOf('T')==-1)
		{
			process_elem=process_elem.replace('##:::##AllDay##:::##', ';'+vcalendarEscapeValue('VALUE=DATE'));
			process_elem=process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
			process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(rec_id));
		}
		else
		{
			process_elem=process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
			process_elem=process_elem.replace('##:::##TZID##:::##',timeZoneAttr);
			if(isUTC && rec_id.charAt(rec_id.length-1)!='Z')
				rec_id+='Z';
			process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(rec_id));
		}
		vCalendarText+=process_elem;
	}

	var a=$('#todoDetailsTable').find("tr[data-id]");
	var lastDataId=0;
	for(var i=0;i<a[a.length-1].attributes.length;i++)
		if(a[a.length-1].attributes[i].nodeName=="data-id")
		{
			lastDataId=a[a.length-1].attributes[i].value;
			break;
		}

	var alarmIterator=0;
	var alarmUniqueArray = new Array();
	for(var t=0;t<lastDataId;t++)
	{
		if($(".alertTODO[data-id="+(t+1)+"]").length>0)
		{
			var alarmText = '';
			if($(".alertTODO[data-id="+(t+1)+"]").val()!='none')
			{
				if(vCalendar.tplM['VTbeginVALARM'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTbeginVALARM'][repeatHash][0])!=undefined)
					alarmText+=vCalendar.tplM['VTbeginVALARM'][repeatHash][0];
				else
				{
					process_elem=vCalendar.tplC['VTbeginVALARM'];
					process_elem=process_elem.replace('##:::##group_wd##:::##', '');
					alarmText+=process_elem;
					vevent=true;
				}

				if($(".alertTODO[data-id="+(t+1)+"]").val()=='message')
				{
					if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='on_date')
					{
						if(vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][0])!=undefined)
						{
							parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
							if(parsed[1]!='') // if group is present, replace the object and related objects' group names
								process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
						}
						else
						{
							process_elem=vCalendar.tplC['VTcontentline_TRIGGER'];
							process_elem=process_elem.replace('##:::##group_wd##:::##', '');
							process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
						}

						var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$(".message_date_inputTODO[data-id="+(t+1)+"]").val());
						var datetime_to=$.fullCalendar.formatDate(dateTo, 'yyyy-MM-dd');
						var aDate=new Date(Date.parse("01/02/1990, "+$(".message_time_inputTODO[data-id="+(t+1)+"]").val()));
						var time_to=$.fullCalendar.formatDate(aDate, 'HH:mm:ss');
						var alarmDT=$.fullCalendar.parseDate(datetime_to+'T'+time_to);

						if(globalSettings.timezonesupport.value)
							sel_option=$('#timezoneTODO').val();

						if($('.timezone_rowTODO').css('display')=='none')
							sel_option='local';

						if(sel_option!='local')
						{
							var valOffsetFrom=getOffsetByTZ(sel_option, alarmDT);
							var intOffset = valOffsetFrom.getSecondsFromOffset()*-1;
							alarmDT = new Date(alarmDT.setSeconds(intOffset));
						}
						else
						{
							var intOffset = getLocalOffset(alarmDT);
							alarmDT = new Date(alarmDT.setSeconds(intOffset));
						}

						var newValue=$.fullCalendar.formatDate(alarmDT, "yyyyMMdd'T'HHmmss")+'Z';
						process_elem=process_elem.replace('##:::##VALUE=DATE-TIME##:::##', ';VALUE=DATE-TIME');
						process_elem=process_elem.replace('##:::##VALUE=DURATION##:::##', '');
						process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
						alarmText+=process_elem;
					}
					else
					{
						var duration='';
						var before_after=$(".before_after_inputTODO[data-id="+(t+1)+"]").val();

						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='minutes_before')
							duration="-PT"+before_after+"M";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='hours_before')
							duration="-PT"+before_after+"H";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='days_before')
							duration="-P"+before_after+"D";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='weeks_before')
							duration="-P"+before_after+"W";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='seconds_before')
							duration="-PT"+before_after+"S";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='minutes_after')
							duration="PT"+before_after+"M";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='hours_after')
							duration="PT"+before_after+"H";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='days_after')
							duration="P"+before_after+"D";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='weeks_after')
							duration="P"+before_after+"W";
						if($(".alert_message_detailsTODO[data-id="+(t+1)+"]").val()=='seconds_after')
							duration="PT"+before_after+"S";

						if(vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][0])!=undefined)
						{
							parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
							if(parsed[1]!='') // if group is present, replace the object and related objects' group names
								process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
						}
						else
						{
							process_elem=vCalendar.tplC['VTcontentline_TRIGGER'];
							process_elem=process_elem.replace('##:::##group_wd##:::##', '');
							process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
						}
						process_elem=process_elem.replace('##:::##VALUE=DATE-TIME##:::##', '');
						process_elem=process_elem.replace('##:::##VALUE=DURATION##:::##', ';VALUE=DURATION');
						process_elem=process_elem.replace('##:::##value##:::##', duration);
						alarmText+=process_elem;
					}

					if(vCalendar.tplM['VTcontentline_ACTION'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_ACTION'][repeatHash][0])!=undefined)
					{
						parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
						if(parsed[1]!='') // if group is present, replace the object and related objects' group names
							process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
					}
					else
					{
						process_elem=vCalendar.tplC['VTcontentline_ACTION'];
						process_elem=process_elem.replace('##:::##group_wd##:::##', '');
						process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
					}
					process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue('DISPLAY'));
					alarmText+=process_elem;
					
					if(vCalendar.tplM['VTcontentline_DESCRIPTION']!=null && (process_elem=vCalendar.tplM['VTcontentline_DESCRIPTION'][0])!=undefined)
					{
						parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
						if(parsed[1]!='') // if group is present, replace the object and related objects' group names
							process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
					}
					else
					{
						process_elem=vCalendar.tplC['VTcontentline_DESCRIPTION'];
						process_elem=process_elem.replace('##:::##group_wd##:::##', '');
						process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
					}
					process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue('Reminder'));
					alarmText+=process_elem;
					
				}

				if(typeof vCalendar.tplM['VTunprocessedVALARM'][repeatHash]!='undefined' && vCalendar.tplM['VTunprocessedVALARM'][repeatHash]!='' && vCalendar.tplM['VTunprocessedVALARM'][repeatHash]!=null)
				{
					if(vCalendar.tplM['VTunprocessedVALARM'][repeatHash][t]!=undefined)
					{
						tmp=vCalendar.tplM['VTunprocessedVALARM'][repeatHash][t].replace(RegExp('^\r\n'), '').replace(RegExp('\r\n$'), '');
						if(tmp.indexOf('\r\n')==0)
							tmp=tmp.substring(2, tmp.length);
						if(tmp.lastIndexOf('\r\n')!=(tmp.length-2))
							tmp+='\r\n';
						alarmText+=tmp;
					}
				}

				if(vCalendar.tplM['VTendVALARM'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTendVALARM'][repeatHash][0])!=undefined)
					alarmText+=vCalendar.tplM['VTendVALARM'][repeatHash][0];
				else
				{
					process_elem=vCalendar.tplC['VTendVALARM'];
					process_elem=process_elem.replace('##:::##group_wd##:::##', '');
					alarmText+=process_elem;
				}
				if(alarmUniqueArray.indexOf(alarmText)==-1)
				{
					alarmUniqueArray.push(alarmText);
					vCalendarText+=alarmText;
				}
			}
		}
	}

	if($('#todo_type').val()=='start' || $('#todo_type').val()=='due' || $('#todo_type').val()=='both')
	{
		if($('#date_fromTODO').val()=='' && $('#date_toTODO').val()=='')
		{
			alert("Not enough data!");
			return false;
		}

		if(($('#todo_type').val()=='start' || ($('#todo_type').val()=='both' && !appleTodoMode)) && $('#date_fromTODO').val()!='')
		{
			if(vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0])!=undefined)
			{
				// replace the object and related objects' group names (+ append the related objects after the processed)
				parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
				if(parsed[1]!='') // if group is present, replace the object and related objects' group names
					process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
			}
			else
			{
				process_elem=vCalendar.tplC['VTcontentline_E_DTSTART'];
				process_elem=process_elem.replace('##:::##group_wd##:::##', '');
				process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
			}

			var dateFrom=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_fromTODO').val());
			var datetime_from=$.fullCalendar.formatDate(dateFrom, 'yyyyMMdd');
			var timeFrom=new Date(Date.parse("01/02/1990, "+$('#time_fromTODO').val()));
			var time_from=((timeFrom.getHours())<10 ? '0'+(timeFrom.getHours()): (timeFrom.getHours()))+''+((timeFrom.getMinutes())<10 ? '0'+(timeFrom.getMinutes()): (timeFrom.getMinutes()))+'00';

			process_elem=process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
			process_elem=process_elem.replace('##:::##TZID##:::##', timeZoneAttr);
			process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_from+'T'+time_from+(isUTC ? 'Z' : '')));

			if(appleTodoMode)
			{
				var process_elem2 = '';
				if(vCalendar.tplM['VTcontentline_DUE'][repeatHash]!=null && (process_elem2=vCalendar.tplM['VTcontentline_DUE'][repeatHash][0])!=undefined)
				{
					// replace the object and related objects' group names (+ append the related objects after the processed)
					parsed=('\r\n'+process_elem2).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
					if(parsed[1]!='') // if group is present, replace the object and related objects' group names
						process_elem2=('\r\n'+process_elem2).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
				}
				else
				{
					process_elem2=vCalendar.tplC['VTcontentline_DUE'];
					process_elem2=process_elem2.replace('##:::##group_wd##:::##', '');
					process_elem2=process_elem2.replace('##:::##params_wsc##:::##', '');
				}
				process_elem2=process_elem2.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
				process_elem2=process_elem2.replace('##:::##TZID##:::##',timeZoneAttr);
				process_elem2=process_elem2.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_from+'T'+time_from+(isUTC ? 'Z' : '')));
				vCalendarText+=process_elem2;
			}
			vCalendarText+=process_elem;
		}

		if(($('#todo_type').val()=='due' || $('#todo_type').val()=='both') && $('#date_toTODO').val()!='')
		{
			if(vCalendar.tplM['VTcontentline_DUE'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_DUE'][repeatHash][0])!=undefined)
			{
				// replace the object and related objects' group names (+ append the related objects after the processed)
				parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
				if(parsed[1]!='') // if group is present, replace the object and related objects' group names
					process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
			}
			else
			{
				process_elem=vCalendar.tplC['VTcontentline_DUE'];
				process_elem=process_elem.replace('##:::##group_wd##:::##', '');
				process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
			}

			var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$('#date_toTODO').val());
			var datetime_to=$.fullCalendar.formatDate(dateTo, 'yyyyMMdd');
			var timeTo=new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val()));
			var time_to=((timeTo.getHours())<10 ? '0'+(timeTo.getHours()): (timeTo.getHours()))+''+((timeTo.getMinutes())<10 ? '0'+(timeTo.getMinutes()): (timeTo.getMinutes()))+'00';

			process_elem=process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
			process_elem=process_elem.replace('##:::##TZID##:::##',timeZoneAttr);
			process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_to+'T'+time_to+(isUTC ? 'Z' : '')));

			if(globalSettings.appleremindersmode.value)
			{
				var process_elem2 = '';
				if(vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash]!=null && (process_elem2=vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0])!=undefined)
				{
					// replace the object and related objects' group names (+ append the related objects after the processed)
					parsed=('\r\n'+process_elem2).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
					if(parsed[1]!='') // if group is present, replace the object and related objects' group names
						process_elem2=('\r\n'+process_elem2).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
				}
				else
				{
					process_elem2=vCalendar.tplC['VTcontentline_E_DTSTART'];
					process_elem2=process_elem2.replace('##:::##group_wd##:::##', '');
					process_elem2=process_elem2.replace('##:::##params_wsc##:::##', '');
				}
				process_elem2=process_elem2.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
				process_elem2=process_elem2.replace('##:::##TZID##:::##',timeZoneAttr);
				process_elem2=process_elem2.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_to+'T'+time_to+(isUTC ? 'Z' : '')));
				vCalendarText+=process_elem2;
			}
			vCalendarText+=process_elem;
		}
	}

	if(realTodo!='')
	{
		if(realTodo.type!='')
		{
			if(realTodo.repeatStart)
			{
				var a=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_fromTODO').val());
				var b=new Date(Date.parse("01/02/1990, "+$('#time_fromTODO').val() ));
			}
			else if(realTodo.repeatEnd)
			{
				var a=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_toTODO').val());
				var b=new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val() ));
			}

			if(realTodo.repeatStart)
				var repeatStart=realTodo.repeatStart;
			else if(realTodo.repeatEnd)
				var repeatEnd=realTodo.repeatEnd;
			a.setHours(b.getHours());
			a.setMinutes(b.getMinutes());
			a.setSeconds(b.getSeconds());
			var changeDate=new Date(a.getTime());
			var offsetDate=0;

			if(realTodo.repeatStart)
				offsetDate=changeDate-repeatStart;
			else if(realTodo.repeatEnd)
				offsetDate=changeDate-repeatEnd;

			var realEventUID=realTodo.vcalendar.match(vCalendar.pre['contentline_UID']);

			if(realEventUID!=null)
				realEventUID=realEventUID[0].match(vCalendar.pre['contentline_parse'])[4];

			if(offsetDate!=0)
			{
				var vcalendarOrig=vCalendarText;
				var eventArray=new Array(),backupEventArray= new Array();
				while(vcalendarOrig.match(vCalendar.pre['vtodo'])!=null)
				{
					if(vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VTODO')-2, vcalendarOrig.indexOf('BEGIN:VTODO'))=='\r\n')
					{
						var partEvent=vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VTODO')-2,vcalendarOrig.indexOf('END:VTODO')+'END:VTODO'.length);
						vcalendarOrig=vcalendarOrig.replace(partEvent, '');
					}
					else
					{
						var partEvent=vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VTODO'),vcalendarOrig.indexOf('END:VTODO')+'END:VTODO'.length);
						vcalendarOrig=vcalendarOrig.replace(partEvent, '');
						partEvent+='\r\n';
					}
					eventArray[eventArray.length]=partEvent;
					backupEventArray[backupEventArray.length]=partEvent;
				}
				if(eventArray.length==0)
					console.log("Error: '"+inputUID+"': unable to parse vTodo");

				for(var it=0;it<eventArray.length;it++)
				{
					var findUid=eventArray[it].match(vCalendar.pre['contentline_UID']);
					if(findUid!=null)
					{
						if(findUid[0].match(vCalendar.pre['contentline_parse'])[4]!=realEventUID)
						continue;
					}
					var findRec=eventArray[it].match(vCalendar.pre['contentline_RECURRENCE_ID']);
					if(findRec!=null)
					{
						var parsed=findRec[0].match(vCalendar.pre['contentline_parse']);
						process_elem=vCalendar.tplC['VTcontentline_REC_ID'];
						process_elem=process_elem.replace('##:::##group_wd##:::##', parsed[1]);
						process_elem=process_elem.replace('##:::##params_wsc##:::##', '');

						var value=parsed[4].parseComnpactISO8601();
						if(value)
						{
							value=new Date(value.getTime()+offsetDate)

							var newValue=$.fullCalendar.formatDate(value, "yyyyMMdd'T'HHmmss");
							if(isUTC)
								newValue+='Z';

							process_elem=process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
							process_elem=process_elem.replace('##:::##TZID##:::##', timeZoneAttr);
							process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
							eventArray[it]=eventArray[it].replace(findRec[0],'\r\n'+process_elem);
						}
					}
					vCalendarText=vCalendarText.replace(backupEventArray[it],eventArray[it]);
				}
			}
		}
	}

	if($('.completedOnTr').css('display')!='none')
	{
		if(vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][0])!=undefined)
		{
			// replace the object and related objects' group names (+ append the related objects after the processed)
			parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
			if(parsed[1]!='') // if group is present, replace the object and related objects' group names
				process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
		}
		else
		{
			process_elem=vCalendar.tplC['VTcontentline_COMPLETED'];
			process_elem=process_elem.replace('##:::##group_wd##:::##', '');
			process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
		}
		if($('.completedOnTr .date').val()!='' && $('.completedOnTr .time').val()!='')
		{
			var completedDate=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('.completedOnTr .date').val());
			var timeCompleted=new Date(Date.parse("01/02/1990, "+$('#completedOnTime').val()));
			var datetime_completed=$.fullCalendar.parseDate($.fullCalendar.formatDate(completedDate, "yyyy'-'MM'-'dd")+'T'+$.fullCalendar.formatDate(timeCompleted, "HH':'mm'-'ss"));

			if(globalSettings.timezonesupport.value)
				sel_option=$('#timezoneTODO').val();

			if($('.timezone_rowTODO').css('display')=='none')
				sel_option='local';

			if(sel_option!='local')
			{
				var valOffsetFrom=getOffsetByTZ(sel_option, datetime_completed);
				var intOffset = valOffsetFrom.getSecondsFromOffset()*-1;
				datetime_completed = new Date(datetime_completed.setSeconds(intOffset));
			}
			var newValue=$.fullCalendar.formatDate(datetime_completed, "yyyyMMdd'T'HHmmss")+'Z';

			process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
			vCalendarText+=process_elem;
		}
	}

	if(appleTodoMode)
	{
		if(vCalendarText.indexOf('\r\n')==0 && newFirst.lastIndexOf('\r\n')==(newFirst.length-2))
			newFirst+=vCalendarText.substring(2,vCalendarText.length);
		else if((vCalendarText.indexOf('\r\n')==0 && newFirst.lastIndexOf('\r\n')!=(newFirst.length-2)) || (vCalendarText.indexOf('\r\n')!=0 && newFirst.lastIndexOf('\r\n')==(newFirst.length-2)) )
			newFirst+=vCalendarText;
		else
			newFirst+='\r\n'+vCalendarText;
	}

	if($('#recurrenceIDTODO').val()=='')
		var checkVal='orig';
	else
		var checkVal=$('#recurrenceIDTODO').val();

	if(typeof vCalendar.tplM['VTunprocessedVTODO'][repeatHash]!='undefined' && vCalendar.tplM['VTunprocessedVTODO'][repeatHash]!=null)
	{
		for(vev in vCalendar.tplM['VTunprocessedVTODO'][repeatHash])
			if(vev==checkVal)
				vCalendarText+=vCalendar.tplM['VTunprocessedVTODO'][repeatHash][vev].replace(RegExp('^\r\n'), '');
	}
	if(appleTodoMode)
		vCalendarText = '';

	if(vCalendar.tplM['VTendVTODO'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTendVTODO'][repeatHash][0])!=undefined)
	{
		if(!appleTodoMode)
			vCalendarText+=vCalendar.tplM['VTendVTODO'][repeatHash][0];
		else
			newFirst+=vCalendar.tplM['VTendVTODO'][repeatHash][0];
	}
	else
	{
		process_elem=vCalendar.tplC['VTendVTODO'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		if(!appleTodoMode)
			vCalendarText+=process_elem;
		else
			newFirst+=process_elem;
	}

	// PRODID
	if(vCalendar.tplM['VTcontentline_PRODID'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0])!=undefined)
	{
		// replace the object and related objects' group names (+ append the related objects after the processed)
		parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
		if(parsed[1]!='') // if group is present, replace the object and related objects' group names
			process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
	}
	else
	{
		process_elem=vCalendar.tplC['VTcontentline_PRODID'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
	}
	process_elem=process_elem.replace('##:::##value##:::##', '-//Inf-IT//'+globalAppName+' '+globalVersion+'//EN');
	vCalendarText+=process_elem;

	if(typeof vCalendar.tplM['VTunprocessed'][repeatHash]!='undefined' && vCalendar.tplM['VTunprocessed'][repeatHash]!='' && vCalendar.tplM['VTunprocessed'][repeatHash]!=null)
	{
		if(!appleTodoMode)
			vCalendarText+=vCalendar.tplM['VTunprocessed'][repeatHash].replace(RegExp('^\r\n'), '');
		else
			origFirst+=vCalendar.tplM['VTunprocessed'][repeatHash].replace(RegExp('^\r\n'), '');;
	}

	vCalendar.tplM['VTunprocessed'][repeatHash]=new Array();

	// vCalendar END (required by RFC)
	if(vCalendar.tplM['VTend'][repeatHash]!=null && (process_elem=vCalendar.tplM['VTend'][repeatHash][0])!=undefined)
		vCalendarText+=vCalendar.tplM['VTend'][repeatHash][0];
	else
	{
		process_elem=vCalendar.tplC['VTend'];
		process_elem=process_elem.replace('##:::##group_wd##:::##', '');
		vCalendarText+=process_elem;
	}

	var textArray = new Array();
	if(appleTodoMode)
	{
		newFirst += vCalendarText;
		if(origFirst.lastIndexOf('\r\n')!=(origFirst.length-2))
			origFirst += '\r\n';
		origFirst += vCalendarText;
		var fixed = checkAndFixMultipleUID(newFirst,false);
		if(fixed.length==1)
			textArray[textArray.length]=origFirst;
		else
			textArray=fixed;
		vCalendarText = newFirst;
	}
	else if(resultTodoObj.futureMode && origEvent!='')
	{
		var fixed = checkAndFixMultipleUID(origEvent,false);
		if(fixed.length==1)
			textArray[textArray.length]=origEvent;
		else
			textArray=fixed;
	}
	var fixedArr = checkAndFixMultipleUID(vCalendarText,false);
	fixedArr = $.merge(textArray,fixedArr);
	var inputS = fixedArr[0];
	fixedArr.splice(0,1);
	if(operation=='MOVE_IN')
		return moveVcalendarToCollection(accountUID, inputUID, inputEtag, inputS, delUID, 'vtodo', false, deleteMode, fixedArr);
	else
		return putVcalendarToCollection(accountUID, inputUID, inputEtag, inputS, delUID,'vtodo',false,deleteMode,fixedArr);
}

function fullVcalendarToTodoData(inputEvent, formMode)
{
	var vcalendar='';
	if(formMode)
		var repeatHash = 'form';
	else
		var repeatHash = inputEvent.repeatHash;
	CalDAVeditor_cleanup(repeatHash);

	var rid=inputEvent.id.substring(0, inputEvent.id.lastIndexOf('/')+1);
	if(rid)
		if(globalEventList.todos[rid][inputEvent.id].uid!=undefined)
			vcalendar=globalEventList.todos[rid][inputEvent.id].vcalendar;
	if(!vcalendar)
		return false;
	var vcalendar_full=vcalendar.split('\r\n');
	if((parsed=('\r\n'+vcalendar_full[0]+'\r\n').match(vCalendar.pre['contentline_parse']))==null)
		return false;
	//BEGIN, END VCALENDAR

	vCalendar.tplM['VTbegin'][repeatHash]=new Array();
	vCalendar.tplM['VTbegin'][repeatHash][0]=vCalendar.tplC['VTbegin'].replace(/##:::##group_wd##:::##/g, vcalendar_begin_group=parsed[1]);
	// parsed (contentline_parse)=[1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
	if((parsed=('\r\n'+vcalendar_full[vcalendar_full.length-2]+'\r\n').match(vCalendar.pre['contentline_parse']))==null)
		return false;
	// values not directly supported by the editor (old values are kept intact)
	vCalendar.tplM['VTend'][repeatHash]=new Array();
	vCalendar.tplM['VTend'][repeatHash][0]=vCalendar.tplC['VTend'].replace(/##:::##group_wd##:::##/g, vcalendar_end_group=parsed[1]);

	if(vcalendar_begin_group!=vcalendar_end_group)
		return false; // the vCalendar BEGIN and END "group" are different

	// remove the vCalendar BEGIN and END
	vcalendar='\r\n'+vcalendar_full.slice(1, vcalendar_full.length-2).join('\r\n')+'\r\n';

	//FIX TIMEZONE
	var beginTimeZone=vcalendar.indexOf('BEGIN:VTIMEZONE');
	var startEndTimeZone=vcalendar.indexOf('END:VTIMEZONE');
	var endTimeZone=0;
	var vTimeZone='';
	while(beginTimeZone!=-1 && startEndTimeZone!=-1)
	{
		for(i=(startEndTimeZone+2);i<vcalendar.length;i++)
		{
			if(vcalendar.charAt(i)=='\n')
			{
				endTimeZone=i+1;
				break;
			}
		}
		vTimeZone=vcalendar.substring(beginTimeZone, endTimeZone);
		vcalendar=vcalendar.substring(0, beginTimeZone)+vcalendar.substring(endTimeZone, vcalendar.length);
		beginTimeZone=vcalendar.indexOf('BEGIN:VTIMEZONE');
		startEndTimeZone=vcalendar.indexOf('END:VTIMEZONE');
	}

	vcalendar_element=vcalendar.match(vCalendar.pre['contentline_VERSION']);
	if(vcalendar_element!=null)
	{
		parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
		version=vcalendarUnescapeValue(parsed[4]);
		vCalendar.tplM['VTcontentline_VERSION'][repeatHash] = new Array();
		vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0]=vCalendar.tplC['VTcontentline_VERSION'];
		vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0]=vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
		vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0]=vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

		vcalendar=vcalendar.replace(vcalendar_element[0], '\r\n');

		if(parsed[1]!='')
		{
			var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
			while ((vcalendar_element_related=vcalendar.match(re))!=null)
			{
				// append the parameter to its parent
				vCalendar.tplM['VTcontentline_VERSION'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
				// remove the processed parameter
				vcalendar=vcalendar.replace(vcalendar_element_related[0], '\r\n');
			}
		}
	}

	vcalendar_element=vcalendar.match(vCalendar.pre['contentline_CALSCALE']);
	if(vcalendar_element!=null)
	{
		parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
		version=vcalendarUnescapeValue(parsed[4]);
		vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash] = new Array();
		vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0]=vCalendar.tplC['VTcontentline_CALSCALE'];
		vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0]=vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
		vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0]=vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
		vcalendar=vcalendar.replace(vcalendar_element[0], '\r\n');

		if(parsed[1]!='')
		{
			var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
			while ((vcalendar_element_related=vcalendar.match(re))!=null)
			{
				// append the parameter to its parent
				vCalendar.tplM['VTcontentline_CALSCALE'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
				// remove the processed parameter
				vcalendar=vcalendar.replace(vcalendar_element_related[0], '\r\n');
			}
		}
	}

	//PRODID
	vcalendar_element=vcalendar.match(RegExp('\r\n'+vCalendar.re['contentline_PRODID'], 'mi'));
	if(vcalendar_element!=null)
	{
		parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

		vCalendar.tplM['VTcontentline_PRODID'][repeatHash] = new Array();
		vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0]=vCalendar.tplC['VTcontentline_PRODID'];
		vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0]=vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
		vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0]=vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
		vcalendar=vcalendar.replace(vcalendar_element[0], '\r\n');
		if(parsed[1]!='')
		{
			var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
			while ((vcalendar_element_related=vcalendar.match(re))!=null)
			{
				// append the parameter to its parent
				vCalendar.tplM['VTcontentline_PRODID'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
				// remove the processed parameter
				vcalendar=vcalendar.replace(vcalendar_element_related[0], '\r\n');
			}
		}
	}
	// -------------------VTODO---------------------- //
	var todoArray=new Array();
	while(vcalendar.match(vCalendar.pre['vtodo'])!=null)
	{
		if(vcalendar.substring(vcalendar.indexOf('BEGIN:VTODO')-2, vcalendar.indexOf('BEGIN:VTODO'))=='\r\n')
		{
			var partTodo=vcalendar.substring(vcalendar.indexOf('BEGIN:VTODO')-2,vcalendar.indexOf('END:VTODO')+'END:VTODO'.length);
			vcalendar=vcalendar.replace(partTodo, '');
		}
		else
		{
			var partTodo=vcalendar.substring(vcalendar.indexOf('BEGIN:VTODO'),vcalendar.indexOf('END:VTODO')+'END:VTODO'.length);
			vcalendar=vcalendar.replace(partTodo, '');
			partTodo+='\r\n';
		}
		todoArray[todoArray.length]=partTodo;
	}
	if(todoArray.length==0)
		console.log("Error: '"+inputEvent.id+"': unable to parse vTodo");

	for(var it=0;it<todoArray.length;it++)
	{
		var vtodo=todoArray[it];
		var vtodo_full=vtodo.split('\r\n');
		var isThisTODO=false;
		if(vtodo==null)
			return false;

		//BEGIN
		if((parsed=('\r\nBEGIN:VTODO\r\n').match(vCalendar.pre['contentline_parse']))==null)
			return false;
		//BEGIN, END VCALENDAR
		vCalendar.tplM['VTbeginVTODO'][repeatHash] = new Array();
		vCalendar.tplM['VTbeginVTODO'][repeatHash][0]=vCalendar.tplC['VTbeginVTODO'].replace(/##:::##group_wd##:::##/g, vcalendar_begin_group=parsed[1]);
		// parsed (contentline_parse)=[1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
		if((parsed=('\r\n'+vcalendar_full[vtodo_full.length-2]+'\r\n').match(vCalendar.pre['contentline_parse']))==null)
			return false;
		// values not directly supported by the editor (old values are kept intact)
		vCalendar.tplM['VTendVTODO'][repeatHash] = new Array();
		vCalendar.tplM['VTendVTODO'][repeatHash][0]=vCalendar.tplC['VTendVTODO'].replace(/##:::##group_wd##:::##/g, vcalendar_end_group=parsed[1]);
		if(vcalendar_begin_group!=vcalendar_end_group)
			return false; // the vCalendar BEGIN and END "group" are different

		// remove the vCalendar BEGIN and END
		vtodo='\r\n'+vtodo_full.slice(2, vtodo_full.length-1).join('\r\n')+'\r\n';
		var created='',recurr_id='', frequency='';

		//RECURRENCE-ID
		var rec='';
		vcalendar_element=vtodo.match(vCalendar.pre['contentline_RECURRENCE_ID']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			var rec=parsed[4];
			vCalendar.tplM['VTcontentline_REC_ID'][repeatHash]= new Array();
			vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0]=vCalendar.tplC['VTcontentline_REC_ID'];
			vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0]=vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			var pars=vcalendarSplitParam(parsed[3]);
			var parString='';

			for(var i=0;i<pars.length;i++)
			{
				if((pars[i]!='VALUE=DATE') && (pars[i].indexOf('TZID=')==-1) && (pars[i]!=''))
					parString+=';'+pars[i];
			}

			vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0]=vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parString);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');
			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_REC_ID'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}
		if(rec=='')
			rec='orig';
		else
			recurr_id=rec;

		//CREATED
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_CREATED'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_CREATED'][repeatHash]={};
			vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec]=vCalendar.tplC['VTcontentline_CREATED'];
			vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec]=vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec]=vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			created = parsed[4];
			vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec]=vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec].replace(/##:::##value##:::##/g,parsed[4]);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');
			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_CREATED'][repeatHash][rec]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//RRULE
		vcalendar_element=vtodo.match(vCalendar.pre['contentline_RRULE2']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_RRULE'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0]=vCalendar.tplC['VTcontentline_RRULE'];
			vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0]=vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			var pars=parsed[4].split(';');
			var parString='';

			for(var i=0;i<pars.length;i++)
			{
				if((pars[i].indexOf('FREQ=')==-1) && (pars[i].indexOf('COUNT=')==-1) && (pars[i].indexOf('UNTIL=')==-1) && (pars[i]!='') && (pars[i].indexOf('INTERVAL=')==-1) && (pars[i].indexOf('BYDAY=')==-1)
				&& (pars[i].indexOf('BYMONTHDAY=')==-1) && (pars[i].indexOf('BYMONTH=')==-1) && (pars[i].indexOf('WKST=')==-1))
					parString+=';'+pars[i];
				if(pars[i].indexOf('FREQ=')!=-1)
					frequency=pars[i].split('FREQ=')[1];
			}
			vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0]=vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0]=vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0].replace(/##:::##value##:::##/g, '##:::##value##:::##'+parString);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');
			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_RRULE'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}
		var tmpR=''
		if(frequency!='')
			tmpR=inputEvent.id+'#'+created+'#'+frequency;
		else
			tmpR=inputEvent.id+'#'+created+'#'+recurr_id;
		if(tmpR==repeatHash)
			isThisTODO=true;
		//SUMMARY
		vcalendar_element=vtodo.match(vCalendar.pre['contentline_SUMMARY']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			title=vcalendarUnescapeValue(parsed[4]);
			vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0]=vCalendar.tplC['VTcontentline_SUMMARY'];
			vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0]=vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0]=vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_SUMMARY'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_TRANSP'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_TRANSP'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_TRANSP'][repeatHash][0]=vCalendar.tplC['VTcontentline_TRANSP'];
			vCalendar.tplM['VTcontentline_TRANSP'][repeatHash][0]=vCalendar.tplM['VTcontentline_TRANSP'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_TRANSP'][repeatHash][0]=vCalendar.tplM['VTcontentline_TRANSP'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_TRANSP'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		vcalendar_element=vtodo.match(vCalendar.pre['contentline_STATUS']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			title=vcalendarUnescapeValue(parsed[4]);
			vCalendar.tplM['VTcontentline_STATUS'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0]=vCalendar.tplC['VTcontentline_STATUS'];
			vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0]=vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0]=vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_STATUS'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//LOCATION
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_LOCATION'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			//note=String(vcalendar_element).split(':')[1];
			title=vcalendarUnescapeValue(parsed[4]);
			vCalendar.tplM['VTcontentline_LOCATION'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0]=vCalendar.tplC['VTcontentline_LOCATION'];
			vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0]=vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0]=vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_LOCATION'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//URL
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_URL'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			//note=String(vcalendar_element).split(':')[1];
			title=vcalendarUnescapeValue(parsed[4]);
			vCalendar.tplM['VTcontentline_URL'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_URL'][repeatHash][0]=vCalendar.tplC['VTcontentline_URL'];
			vCalendar.tplM['VTcontentline_URL'][repeatHash][0]=vCalendar.tplM['VTcontentline_URL'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_URL'][repeatHash][0]=vCalendar.tplM['VTcontentline_URL'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_URL'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		vcalendar_element=vtodo.match(vCalendar.pre['contentline_PERCENT-COMPLETE']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

			//note=String(vcalendar_element).split(':')[1];
			title=vcalendarUnescapeValue(parsed[4]);
			vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0]=vCalendar.tplC['VTcontentline_PERCENT-COMPLETE'];
			vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0]=vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0]=vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_PERCENT-COMPLETE'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		vcalendar_element=vtodo.match(vCalendar.pre['contentline_PRIORITY']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

			//note=String(vcalendar_element).split(':')[1];
			title=vcalendarUnescapeValue(parsed[4]);
			vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0]=vCalendar.tplC['VTcontentline_PRIORITY'];
			vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0]=vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0]=vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_PRIORITY'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		// ---------------- VALARM --------------- //
		var valarm=vtodo.match(vCalendar.pre['valarm']);
		if(valarm!=null)
		{
			vtodo=vtodo.replace(valarm[0], '');
			vCalendar.tplM['VTalarm_STRING'][repeatHash]='';
			var alarmString='';
			var alarmArray=new Array();

			for(var i=0;i<valarm[0].length;i++)
			{
				if(valarm[0].substring(i-'END:VALARM'.length, i)=='END:VALARM')
				{
					alarmArray[alarmArray.length]=alarmString+'\r\n';
					if(isThisTODO)
						vCalendar.tplM['VTalarm_STRING'][repeatHash]+=alarmString+'\r\n';
					alarmString='';
				}
				alarmString+=valarm[0][i];
			}
			for(var j=0;j<alarmArray.length;j++)
			{
				checkA=alarmArray[j].match(vCalendar.re['valarm']);
				if(checkA!=null)
				{
					var valarm_full=checkA[0].split('\r\n');

					//BEGIN
					if((parsed=('\r\n'+valarm_full[0]+'\r\n').match(vCalendar.pre['contentline_parse']))==null)
						return false;
					//BEGIN, END VCALENDAR
					vCalendar.tplM['VTbeginVALARM'][repeatHash] = new Array();
					vCalendar.tplM['VTbeginVALARM'][repeatHash][j]=vCalendar.tplC['VTbeginVALARM'].replace(/##:::##group_wd##:::##/g, vcalendar_begin_group=parsed[1]);
					// parsed (contentline_parse)=[1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
					if((parsed=('\r\n'+valarm_full[valarm_full.length-2]+'\r\n').match(vCalendar.pre['contentline_parse']))==null)
						return false;
					// values not directly supported by the editor (old values are kept intact)
					vCalendar.tplM['VTendVALARM'][repeatHash] = new Array();
					vCalendar.tplM['VTendVALARM'][repeatHash][j]=vCalendar.tplC['VTendVALARM'].replace(/##:::##group_wd##:::##/g, vcalendar_end_group=parsed[1]);

					if(vcalendar_begin_group!=vcalendar_end_group)
						return false; // the vCalendar BEGIN and END "group" are different

					// remove the vCalendar BEGIN and END
					alarmArray[j]='\r\n'+valarm_full.slice(1, valarm_full.length-2).join('\r\n')+'\r\n';

					trigger=alarmArray[j].match(vCalendar.pre['contentline_TRIGGER']);
					if(trigger!=null)
					{

						parsed=(trigger[0]+'\r\n').match(vCalendar.pre['contentline_parse']);
						vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash] = new Array();
						vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][j]=vCalendar.tplC['VTcontentline_TRIGGER'];
						vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][j]=vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][j].replace(/##:::##group_wd##:::##/g, parsed[1]);

						var pars=vcalendarSplitParam(parsed[3]);
						var parString='';
						for(var i=0;i<pars.length;i++)
						{
							if((pars[i]!='VALUE=DATE-TIME') && (pars[i]!='VALUE=DURATION') && (pars[i]!=''))
								parString+=';'+pars[i];
						}

						vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][j]=vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][j].replace(/##:::##params_wsc##:::##/g, parString);

						alarmArray[j]=alarmArray[j].replace(trigger[0], '\r\n');

						if(parsed[1]!='')
						{
							var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
							while ((vcalendar_element_related=vtodo.match(re))!=null)
							{
								// append the parameter to its parent
								vCalendar.tplM['VTcontentline_TRIGGER'][repeatHash][j]+=vcalendar_element_related[0].substr(2);
								// remove the processed parameter
								vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
							}
						}

					}

					note=alarmArray[j].match(vCalendar.pre['contentline_NOTE']);
					if(note!=null)
					{
						parsed=note[0].match(vCalendar.pre['contentline_parse']);
						vCalendar.tplM['VTcontentline_VANOTE'][repeatHash] = new Array();
						vCalendar.tplM['VTcontentline_VANOTE'][repeatHash][j]=vCalendar.tplC['VTcontentline_VANOTE'];
						vCalendar.tplM['VTcontentline_VANOTE'][repeatHash][j]=vCalendar.tplM['VTcontentline_VANOTE'][repeatHash][j].replace(/##:::##group_wd##:::##/g, parsed[1]);
						vCalendar.tplM['VTcontentline_VANOTE'][repeatHash][j]=vCalendar.tplM['VTcontentline_VANOTE'][repeatHash][j].replace(/##:::##params_wsc##:::##/g, parsed[3]);

						alarmArray[j]=alarmArray[j].replace(note[0], '\r\n');

						if(parsed[1]!='')
						{
							var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
							while ((vcalendar_element_related=vtodo.match(re))!=null)
							{
								// append the parameter to its parent
								vCalendar.tplM['VTcontentline_VANOTE'][repeatHash][j]+=vcalendar_element_related[0].substr(2);
								// remove the processed parameter
								vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
							}
						}
					}

					action=(alarmArray[j]).match(vCalendar.pre['contentline_ACTION']);
					if(action!=null)
					{
						parsed=action[0].match(vCalendar.pre['contentline_parse']);
						vCalendar.tplM['VTcontentline_ACTION'][repeatHash] = new Array();
						vCalendar.tplM['VTcontentline_ACTION'][repeatHash][j]=vCalendar.tplC['VTcontentline_ACTION'];
						vCalendar.tplM['VTcontentline_ACTION'][repeatHash][j]=vCalendar.tplM['VTcontentline_ACTION'][repeatHash][j].replace(/##:::##group_wd##:::##/g, parsed[1]);
						vCalendar.tplM['VTcontentline_ACTION'][repeatHash][j]=vCalendar.tplM['VTcontentline_ACTION'][repeatHash][j].replace(/##:::##params_wsc##:::##/g, parsed[3]);

						alarmArray[j]=alarmArray[j].replace(action[0], '\r\n');

						if(parsed[1]!='')
						{
							var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
							while ((vcalendar_element_related=vtodo.match(re))!=null)
							{
								// append the parameter to its parent
								vCalendar.tplM['VTcontentline_ACTION'][repeatHash][j]+=vcalendar_element_related[0].substr(2);
								// remove the processed parameter
								vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
							}
						}
					}

					var checkUnprocess=$.trim(alarmArray[j]);
					vCalendar.tplM['VTunprocessedVALARM'][repeatHash] = new Array();
					if(checkUnprocess!='')
						vCalendar.tplM['VTunprocessedVALARM'][repeatHash][j]=alarmArray[j];
				}
			}
		}

		//NOTE
		vcalendar_element=vtodo.match(vCalendar.pre['contentline_NOTE']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_NOTE'][repeatHash]=new Array();
			vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0]=vCalendar.tplC['VTcontentline_NOTE'];
			vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0]=vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0]=vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_NOTE'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//NOTE
		vcalendar_element=vtodo.match(vCalendar.pre['contentline_CLASS']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_CLASS'][repeatHash]=new Array()
			vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0]=vCalendar.tplC['VTcontentline_CLASS'];
			vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0]=vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0]=vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0]=vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0].replace(/##:::##value##:::##/g, parsed[4]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_CLASS'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}
		//END

		vcalendar_element=vtodo.match(vCalendar.pre['contentline_DUE']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_DUE'][repeatHash]= new Array();
			vCalendar.tplM['VTcontentline_DUE'][repeatHash][0]=vCalendar.tplC['VTcontentline_DUE'];
			vCalendar.tplM['VTcontentline_DUE'][repeatHash][0]=vCalendar.tplM['VTcontentline_DUE'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);

			var pars=vcalendarSplitParam(parsed[3]);
			var parString='';

			for(var i=0;i<pars.length;i++)
			{
				if((pars[i]!='VALUE=DATE') && (pars[i].indexOf('TZID=')==-1) && (pars[i]!=''))
					parString+=';'+pars[i];
			}

			vCalendar.tplM['VTcontentline_DUE'][repeatHash][0]=vCalendar.tplM['VTcontentline_DUE'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parString);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_DUE'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//START
		vcalendar_element=vtodo.match(vCalendar.pre['contentline_DTSTART']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0]=vCalendar.tplC['VTcontentline_E_DTSTART'];
			vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0]=vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);

			var pars=vcalendarSplitParam(parsed[3]);
			var parString='';

			for(var i=0;i<pars.length;i++)
			{
				if(pars[i]!='VALUE=DATE' && pars[i].indexOf('TZID=')==-1 && pars[i]!='')
					parString+=';'+pars[i];
			}

			vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0]=vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parString);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_E_DTSTART'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//UID
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_UID'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_UID'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_UID'][repeatHash][0]=vCalendar.tplC['VTcontentline_UID'];
			vCalendar.tplM['VTcontentline_UID'][repeatHash][0]=vCalendar.tplM['VTcontentline_UID'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_UID'][repeatHash][0]=vCalendar.tplM['VTcontentline_UID'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vCalendar.tplM['VTcontentline_UID'][repeatHash][0]=vCalendar.tplM['VTcontentline_UID'][repeatHash][0].replace(/##:::##uid##:::##/g,parsed[4]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_UID'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//LAST-MODIFIED
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_LM'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_LM'][repeatHash]=new Array();
			vCalendar.tplM['VTcontentline_LM'][repeatHash][0]=vCalendar.tplC['VTcontentline_LM'];
			vCalendar.tplM['VTcontentline_LM'][repeatHash][0]=vCalendar.tplM['VTcontentline_LM'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_LM'][repeatHash][0]=vCalendar.tplM['VTcontentline_LM'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_LM'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		//DTSTAMP
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_DTSTAMP'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash] = new Array();
			vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0]=vCalendar.tplC['VTcontentline_DTSTAMP'];
			vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0]=vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0]=vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');

			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_DTSTAMP'][repeatHash][0]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

			var i=-1;
			while(vtodo.match(vCalendar.pre['contentline_EXDATE'])!= null)
			{
				i++;
				vcalendar_element=vtodo.match(vCalendar.pre['contentline_EXDATE']);
				if(vcalendar_element!=null)
				{
					parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
					vCalendar.tplM['VTcontentline_EXDATE'][repeatHash]=new Array();
					vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplC['VTcontentline_EXDATE'];
					vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i].replace(/##:::##group_wd##:::##/g, parsed[1]);
					var pars=vcalendarSplitParam(parsed[3]);
					var parString='', dateStr='';

					for(var j=0;j<pars.length;j++)
					{
						if(pars[j]!='VALUE=DATE' && pars[j]!='')
							parString+=';'+pars[j];
						if(pars[j]=='VALUE=DATE')
							dateStr=pars[j];
					}

					if(dateStr.indexOf('VALUE=DATE')!=-1)
						vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i].replace(/##:::##AllDay##:::##/g, ';VALUE=DATE');
					else
						vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i].replace(/##:::##AllDay##:::##/g, '');

					vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i].replace(/##:::##TZID##:::##/g, '');
					vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i].replace(/##:::##params_wsc##:::##/g, parString);
					vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]=vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i].replace(/##:::##value##:::##/g,parsed[4]);
					vtodo=vtodo.replace(vcalendar_element[0], '\r\n');
					if(parsed[1]!='')
					{
						var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
						while ((vcalendar_element_related=vtodo.match(re))!=null)
						{
							// append the parameter to its parent
							vCalendar.tplM['VTcontentline_EXDATE'][repeatHash][i]+=vcalendar_element_related[0].substr(2);
							// remove the processed parameter
							vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
						}
					}
				}
			}

		//COMPLETED
		vcalendar_element=vtodo.match(RegExp('\r\n'+vCalendar.re['contentline_COMPLETED'], 'mi'));
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash] = {};
			vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][rec]=vCalendar.tplC['VTcontentline_COMPLETED'];
			vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][rec]=vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][rec].replace(/##:::##group_wd##:::##/g, parsed[1]);
			vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][rec]=vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][rec].replace(/##:::##params_wsc##:::##/g, parsed[3]);
			vtodo=vtodo.replace(vcalendar_element[0], '\r\n');
			if(parsed[1]!='')
			{
				var re=RegExp('\r\n'+parsed[1].replace('.','\\..*')+'\r\n', 'im');
				while ((vcalendar_element_related=vtodo.match(re))!=null)
				{
					// append the parameter to its parent
					vCalendar.tplM['VTcontentline_COMPLETED'][repeatHash][rec]+=vcalendar_element_related[0].substr(2);
					// remove the processed parameter
					vtodo=vtodo.replace(vcalendar_element_related[0], '\r\n');
				}
			}
		}

		if(vcalendar.indexOf('\r\n')==0)
			vcalendar=vcalendar.substring(2, vcalendar.length-2);

		if(vcalendar.lastIndexOf('\r\n')!=(vcalendar.length-2))
			vcalendar+='\r\n';
		vCalendar.tplM['VTunprocessedVTODO'][repeatHash]={};
		vCalendar.tplM['VTunprocessedVTODO'][repeatHash][rec]=vtodo;
	//	if(vTimeZone!='')
	//		vcalendar+=vTimeZone;
		isThisTODO=false;
	}

	if(vcalendar.indexOf('\r\n')==0)
		vcalendar=vcalendar.substring(2, vcalendar.length-2);

	if(vcalendar.lastIndexOf('\r\n')!=(vcalendar.length-2))
		vcalendar+='\r\n';

	vCalendar.tplM['VTunprocessedVTIMEZONE'][repeatHash]=vTimeZone;
	vCalendar.tplM['VTunprocessed'][repeatHash]=vcalendar;
}

function vcalendarTodoData(inputCollection, inputEvent, isNew)
{
	var vcalendarOrig=inputEvent.vcalendar;
	var todoArray=new Array();
	var preTodoArray=new Array();
	if((check=inputEvent.vcalendar.match(vCalendar.pre['vtodo']))==null)
	{
		console.log("Error: '"+inputEvent.uid+"': unable to parse vTodo");
		return false;
	}

	//CHECK CALSCALE
	var elem=vcalendarOrig.match(vCalendar.pre['contentline_CALSCALE']);
	if(elem!=null)
	{
		var calscale=elem[0].match(vCalendar.pre['contentline_parse'])[4];
		if(calscale!='GREGORIAN')
		{
			console.log("Error:'"+inputEvent.uid+"': Unsupported calscale in:"+vcalendarOrig);
			return false;
		}
	}
	//CHECK VERSION
	var elemV=vcalendarOrig.match(vCalendar.pre['contentline_VERSION']);
	if(elemV!=null)
	{
		var ver=elemV[0].match(vCalendar.pre['contentline_parse'])[4];
		if(ver!='2.0')
		{
			console.log("Error:'"+inputEvent.uid+"': Unsupported version ("+ver+") in:"+vcalendarOrig);
			return false;
		}
	}
	//FIX TIMEZONE
	var beginTimeZone=vcalendarOrig.indexOf('BEGIN:VTIMEZONE');
	var startEndTimeZone=vcalendarOrig.indexOf('END:VTIMEZONE');
	var endTimeZone=0;
	while(vcalendarOrig.indexOf('BEGIN:VTIMEZONE')!=-1)
		if(beginTimeZone!=-1 && startEndTimeZone!=-1)
		{
			for(i=(startEndTimeZone+2);i<vcalendarOrig.length;i++)
			{
				if(vcalendarOrig.charAt(i)=='\n')
				{
					endTimeZone=i+1;
					break;
				}
			}
			vTimeZone=vcalendarOrig.substring(beginTimeZone, endTimeZone);
			vcalendarOrig=vcalendarOrig.substring(0, beginTimeZone)+vcalendarOrig.substring(endTimeZone, vcalendarOrig.length);
		}

	var rid=inputEvent.uid.substring(0, inputEvent.uid.lastIndexOf('/')+1);
	var evid=inputEvent.uid.substring(inputEvent.uid.lastIndexOf('/')+1, inputEvent.uid.length);
	var recurrence_id_array=new Array();
		while(vcalendarOrig.match(vCalendar.pre['vtodo'])!=null)
		{
			if(vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VTODO')-2, vcalendarOrig.indexOf('BEGIN:VTODO'))=='\r\n')
			{
				var partTodo=vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VTODO')-2,vcalendarOrig.indexOf('END:VTODO')+'END:VTODO'.length);
				vcalendarOrig=vcalendarOrig.replace(partTodo, '');
			}
			else
			{
				var partTodo=vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VTODO'),vcalendarOrig.indexOf('END:VTODO')+'END:VTODO'.length);
				vcalendarOrig=vcalendarOrig.replace(partTodo, '');
				partTodo+='\r\n';
			}
			var rec_array=partTodo.match(vCalendar.pre['contentline_RECURRENCE_ID']);
			var uidString=partTodo.match(vCalendar.pre['contentline_UID']);

			if(uidString!=null && rec_array!=null)
				recurrence_id_array[recurrence_id_array.length]=rec_array[0].match(vCalendar.pre['contentline_parse'])[4]+';'+uidString[0].match(vCalendar.pre['contentline_parse'])[4];

			todoArray[todoArray.length]=partTodo;
		}

	if(todoArray.length==0)
		return false;
	var repeatHashEquals = false;
	for(var toIt=0; toIt<todoArray.length; toIt++)
	{
		var oo='',
		note='',
		start='',
		end='',
		title='',
		all=false,
		frequency='',
		until='',
		complete='',
		isUntilDate=false,
		alertTime=new Array(),
		alertNote=new Array(),
		alertTimeOut=new Array(),
		valOffsetFrom='',
		tzName='local',
		classType='',
		url='',
		tmpObj='',
		isRepeat=false,
		intOffset='',
		realStart='',
		realEnd='',
		interval='',
		until='',
		completedOn='',
		location='',
		isUntilDate=false,
		wkst='',
		byMonthDay='',
		byDay='',
		rec_id='',
		created='',
		repeatHash='',
		returnForValue = true,
		pars=new Array();
		var rid=inputEvent.uid.substring(0, inputEvent.uid.lastIndexOf('/')+1);
		var status='',filterStatus='',renderPriority=0,
		percent="0",
		priority="0",
		alarms=new Array();
		var vcalendar=inputEvent.vcalendar;
		var dates = new Array();
		var vcalendar=todoArray[toIt];
		var stringUID=vcalendar.match(vCalendar.pre['contentline_UID']);
		if(stringUID!=null)
			stringUID=stringUID[0].match(vCalendar.pre['contentline_parse'])[4];

		var exDates=new Array();
		var exDate=null;
		var exDate_array=new Array();
		var vcalendar2=vcalendar+'';

		while(vcalendar2.match(vCalendar.pre['contentline_EXDATE'])!= null)
		{
			exDate=vcalendar2.match(vCalendar.pre['contentline_EXDATE']);
			exDate_array[exDate_array.length]=exDate[0];
			vcalendar2=vcalendar2.replace(exDate,'\r\n');
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_RRULE2']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
//			if(parsed[4].indexOf('BYSETPOS')!=-1 || parsed[4].indexOf('BYWEEKNO')!=-1)
//			{
//				console.log("Error:'"+inputEvent.uid+"': Unsupported recurrence rule in todo:"+vcalendar);
//				return false;
//			}
			pars=parsed[4].split(';');
			var parString='';
			if(pars.length>0)
				isRepeat=true;
			for(var i=0;i<pars.length;i++)
			{
				if(pars[i].indexOf('FREQ=')!=-1)
					frequency=pars[i].split('=')[1];
				else if(pars[i].indexOf('INTERVAL=')!=-1)
					interval=pars[i].split('=')[1];
				else if(pars[i].indexOf('COUNT=')!=-1)
				{
					until=pars[i].split('=')[1];
					if(until==0)
					{
						returnForValue = false;
						break
					}
					else if(isNaN(until))
					{
							returnForValue = false;
							break
					}
				}
				else if(pars[i].indexOf('UNTIL=')!=-1)
				{
					isUntilDate=true;
					until=pars[i].split('=')[1];
				}
				else if(pars[i].indexOf('WKST=')!=-1)
				{
					wkst=pars[i].split('=')[1].replace(/\d*MO/,1).replace(/\d*TU/,2).replace(/\d*WE/,3).replace(/\d*TH/,4).replace(/\d*FR/,5).replace(/\d*SA/,6).replace(/\d*SU/,0);
					if(globalSettings.mozillasupport.value!=null && globalSettings.mozillasupport.value)
						wkst='';
				}
				else if(pars[i].indexOf('BYMONTHDAY=')!=-1)
					byMonthDay=pars[i].split('=')[1];
				else if(pars[i].indexOf('BYDAY=')!=-1)
				{
					byDay=pars[i].split('=')[1];
					byDay=byDay.replace(/\d*MO/,1).replace(/\d*TU/,2).replace(/\d*WE/,3).replace(/\d*TH/,4).replace(/\d*FR/,5).replace(/\d*SA/,6).replace(/\d*SU/,0).split(',');
					if(byDay.length>1 &&(frequency=='MONTHLY'||frequency=='YEARLY'))
					{
						console.log("Error:'"+inputEvent.uid+"': Unsupported recurrence rule in todo:"+vcalendar);
						return false;
					}
				}
			}
			if(!returnForValue)
				return false;
			if(!interval)
				interval=1;
		}
		var help1 = '';
		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_DTSTART']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			start=parsed[4];

			help1=start;
			if(help1.indexOf("T")==-1)
			{
				help1=help1.substring(0, 4)+'-'+help1.substring(4, 6)+'-'+help1.substring(6, 8);
				all=true;
			}
			else
			{
				help1=help1.substring(0, 4)+'-'+help1.substring(4, 6)+'-'+help1.substring(6, 8)+'T'+help1.substring(9, 11)+':'+help1.substring(11, 13)+':'+help1.substring(13, 15);
				all=false;
			}

			var t=$.fullCalendar.parseDate(help1);
			start=help1;
			if(t==null)
				return false;
			if((t.toString())=='Invalid Date')
				return false;
			if(exDate_array!=null)
				for(var j=0;j<exDate_array.length;j++)
				{
					var exString=(exDate_array[j]+'\r\n').match(vCalendar.pre['contentline_parse'])[4];
					if(exString.indexOf('T')!=-1 && exString.indexOf('Z')!=-1)
						var utcTime=exString.parseComnpactISO8601().setSeconds(getLocalOffset(exString.parseComnpactISO8601())*-1);
					else if(exString.indexOf('T')!=-1 && exString.indexOf('Z')==-1)
						var utcTime=exString.parseComnpactISO8601();
					else
					{
						if(start.indexOf('T')!=-1)
							exString += 'T' + $.fullCalendar.formatDate(t,'HHmmss');

						var utcTime=exString.parseComnpactISO8601();
					}
					exDates[exDates.length]=new Date(utcTime).toString();
				}

			var dtStartTimezone=parsed[3].split('=');
			if(!all)
			{
				if(parsed[4].charAt(parsed[4].length-1)=='Z')
					tzName='UTC';

				if(dtStartTimezone.length>1 || tzName=='UTC')
				{
					if(tzName!='UTC')
						tzName=$.trim(dtStartTimezone[1]);
					var finTZ = checkTimezone(tzName);
					if(finTZ!=null)
						tzName = finTZ;
					if(globalSettings.timezonesupport.value && tzName in timezones)
					{
						valOffsetFrom=getOffsetByTZ(tzName, t);
						intOffset=(getLocalOffset(t)*-1*1000)-valOffsetFrom.getSecondsFromOffset()*1000;
					}
				}
				else if(processedTimezones.indexOf(tzName)==-1)
				{
					if(timeZonesEnabled.indexOf(tzName)==-1)
						timeZonesEnabled.push('local');
					processedTimezones.push('local');
				}
				if(tzName!='' && tzName != 'local')
					if(processedTimezones.indexOf(tzName)==-1)
					{
						if(timeZonesEnabled.indexOf(tzName)==-1)
							timeZonesEnabled.push(tzName);
						processedTimezones.push(tzName);
					}
			}
			realStart=start;
			if(help1.indexOf("T")!=-1)
			{
				if(intOffset!='')
					t.setTime(t.getTime()+intOffset);

				start=$.fullCalendar.formatDate(t,'u');
			}
			inputEvent.start=$.fullCalendar.parseDate(start);
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_DUE']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			end=parsed[4];

			var help=end;
			var oldEnd = '';
			if(help.indexOf("T")==-1)
			{

				help=help.substring(0, 4)+'-'+help.substring(4, 6)+'-'+help.substring(6, 8);

				var d=$.fullCalendar.parseDate(help);
				var da=new Date(d.getTime());
				if(help1.indexOf("T")==-1)
					da.setDate(da.getDate()-1);
				help=$.fullCalendar.formatDate(da, "yyyy-MM-dd");
				all=true;
				oldEnd = help;
				if(help1.indexOf("T")!=-1)
				{
					all=false;
					help+='T00:00:00';
					if(tzName == 'UTC')
						help+='Z';
				}
			}
			else
			{
				help=help.substring(0, 4)+'-'+help.substring(4, 6)+'-'+help.substring(6, 8)+'T'+help.substring(9, 11)+':'+help.substring(11, 13)+':'+help.substring(13, 15);
				oldEnd = help;
				all=false;
			}

			end=help;
			var t1=$.fullCalendar.parseDate(end);
			if(t1==null)
				return false;

			if((t1.toString())=='Invalid Date')
				return false;

			if(exDate_array!=null && exDates.length==0)
				for(var j=0;j<exDate_array.length;j++)
				{
					var exString=(exDate_array[j]+'\r\n').match(vCalendar.pre['contentline_parse'])[4];
					if(exString.indexOf('T')!=-1 && exString.indexOf('Z')!=-1)
						var utcTime=exString.parseComnpactISO8601().setSeconds(getLocalOffset(exString.parseComnpactISO8601())*-1);
					else if(exString.indexOf('T')!=-1 && exString.indexOf('Z')==-1)
						var utcTime=exString.parseComnpactISO8601();
					else
					{
						if(end.indexOf('T')!=-1)
							exString += 'T' + $.fullCalendar.formatDate(t1,'HHmmss');

						var utcTime=exString.parseComnpactISO8601();
					}
					exDates[exDates.length]=new Date(utcTime).toString();
				}
			if(intOffset=='' && (help1.indexOf("T")!=-1 || oldEnd.indexOf("T")!=-1))
			{
				var dtStartTimezone=parsed[3].split('=');

				if(parsed[4].charAt(parsed[4].length-1)=='Z')
					tzName='UTC';
				if(dtStartTimezone.length>1 || tzName=='UTC')
				{
					if(tzName!='UTC' && oldEnd.indexOf("T")!=-1)
						tzName=$.trim(dtStartTimezone[1]);
					var finTZ = checkTimezone(tzName);
					if(finTZ!=null)
						tzName = finTZ;
					if(globalSettings.timezonesupport.value && tzName in timezones)
					{
						valOffsetFrom=getOffsetByTZ(tzName, t1);
						intOffset=(getLocalOffset(t1)*-1*1000)-valOffsetFrom.getSecondsFromOffset()*1000;
					}
				}
			}

			realEnd=help;
			if(globalSettings.appleremindersmode.value)
				realStart=help;
			if(help.indexOf("T")!=-1)
			{
				if(intOffset!='')
					t1.setTime(t1.getTime()+intOffset);
				end=$.fullCalendar.formatDate(t1,'u');
			}
			inputEvent.end=end;
			if(globalSettings.appleremindersmode.value)
				start=end;
		}
		if(globalSettings.appleremindersmode.value && realEnd=='' && realStart!='')
		{
			realStart='';
			start='';
		}

		var finalAString='';
		var valarm=vcalendar.match(vCalendar.pre['valarm']);
		if(valarm!=null)
		{
			vcalendar=vcalendar.replace(valarm[0], '');

			var alarmString='';
			var alarmArray=new Array();
			for(var i=0;i<valarm[0].length;i++)
			{
				if(valarm[0].substring(i-'END:VALARM'.length, i)=='END:VALARM')
				{
					alarmArray[alarmArray.length]=alarmString+'\r\n';
					alarmString='';
				}
				alarmString+=valarm[0][i];
			}

			for(var j=0;j<alarmArray.length;j++)
			{
				if(alarmArray[j].indexOf('\r\n')==0 && finalAString.lastIndexOf('\r\n')==(finalAString.length-2))
					finalAString+=alarmArray[j].substring(2,alarmArray[j].length);
				else if((alarmArray[j].indexOf('\r\n')==0 && finalAString.lastIndexOf('\r\n')!=(finalAString.length-2)) || (alarmArray[j].indexOf('\r\n')!=0 && finalAString.lastIndexOf('\r\n')==(finalAString.length-2)) )
					finalAString+=alarmArray[j];
				else
					finalAString+='\r\n'+alarmArray[j];
				checkA=alarmArray[j].match(vCalendar.re['valarm']);
				if(checkA!=null)
				{
					action=(alarmArray[j]).match(vCalendar.pre['contentline_ACTION']);
					if(action!=null)
						parsed=action[0].match(vCalendar.pre['contentline_parse']);
					else
						break;

					trigger=alarmArray[j].match(vCalendar.pre['contentline_TRIGGER']);
					if(trigger!=null)
					{
						parsed=(trigger[0]+'\r\n').match(vCalendar.pre['contentline_parse']);

						if(parsed!=null)
						{
							value=parsed[4];
							var checkD=value.match(vCalendar.pre['date-time-value']);
							var intOffsetA='';
							var tzNameA='';
							if(checkD!=null)
							{
								if(parsed[3])
									var dtStartTimezoneA=parsed[3].split('=');
								var alarmTimeA=$.fullCalendar.parseDate(value.substring(0, 4)+'-'+value.substring(4, 6)+'-'+value.substring(6, 8)+'T'+value.substring(9, 11)+':'+value.substring(11, 13)+':'+value.substring(13, 15));
								if(value.charAt(value.length-1)=='Z')
									tzNameA='UTC';
								if(dtStartTimezoneA.length>1 || tzNameA=='UTC')
								{
									if(tzNameA!='UTC' && dtStartTimezoneA[0]==';TZID')
										tzNameA=$.trim(dtStartTimezoneA[1]);
									var finTZ = checkTimezone(tzNameA);
									if(finTZ!=null)
										tzNameA = finTZ;
									if(globalSettings.timezonesupport.value && tzNameA in timezones)
									{
										var valOffsetFromA=getOffsetByTZ(tzNameA, alarmTimeA);
										if(tzName != 'local')
											intOffsetA=getOffsetByTZ(tzName, alarmTimeA).getSecondsFromOffset()*1000-valOffsetFromA.getSecondsFromOffset()*1000;
										else
											intOffsetA=-1*getLocalOffset(alarmTimeA)*1000-valOffsetFromA.getSecondsFromOffset()*1000;
									}
								}
								else if(processedTimezones.indexOf(tzName)==-1)
								{
									if(timeZonesEnabled.indexOf(tzName)==-1)
										timeZonesEnabled.push('local');
									processedTimezones.push('local');
								}
								if(tzNameA!='' && tzName != 'local')
									if(processedTimezones.indexOf(tzNameA)==-1)
									{
										if(timeZonesEnabled.indexOf(tzNameA)==-1)
											timeZonesEnabled.push(tzNameA);
										processedTimezones.push(tzNameA);
									}
								if(intOffsetA!='')
									alarmTimeA.setTime(alarmTimeA.getTime()+intOffsetA);
								alertTime[j]=$.fullCalendar.formatDate(alarmTimeA,"yyyy-MM-dd'T'HH:mm:ss");
							}
							else
							{
								alertTime[j]=0;

								if(value.indexOf('W')!=-1)
									alertTime[j]=parseAlarmWeek(value);
								else if(value.indexOf('D')!=-1)
									alertTime[j]=parseAlarmDay(value);
								else if(value.indexOf('T')!=-1)
									alertTime[j]=parseAlarmTime(value);

								if(parsed[4].charAt(0)=="-")
									alertTime[j]="-"+alertTime[j];
								else
									alertTime[j]="+"+alertTime[j];
							}
						}
					}
					else
						break;

					alnote=alarmArray[j].match(vCalendar.pre['contentline_NOTE']);
					if(alnote!=null)
					{
						parsed=alnote[0].match(vCalendar.pre['contentline_parse']);
						alertNote[j]=parsed[4];
					}
					else
						alertNote[j]='Default note';
				}
			}
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_LOCATION']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			location=vcalendarUnescapeValue(parsed[4]);
		}
		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_NOTE']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			note=vcalendarUnescapeValue(parsed[4]);
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_CLASS']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			classType=vcalendarUnescapeValue(parsed[4]);
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_URL']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			url=vcalendarUnescapeValue(parsed[4]);
		}

		//NEEDS-ACTION
		//COMPLETED
		//IN-PROCESS
		//CANCELLED
		//PERCENT-COMPLETE

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_RECURRENCE_ID']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			var rec=parsed[4];
			/*if(rec.indexOf("T")==-1)
			{
				rec=rec.substring(0, 4)+'/'+rec.substring(4, 6)+'/'+rec.substring(6, 8);
				var d=$.fullCalendar.parseDate(rec);
				var da=new Date(d.getTime()-1*24*60*60*1000);
				var day=da.getDate();

				if(day<10)
					day='0'+day;

				var month=da.getMonth();
				month++;
				if(month<10)
					month='0'+month;

				rec=da.getFullYear()+'-'+month+'-'+day;
			}
			else
				rec=rec.substring(0, 4)+'-'+rec.substring(4, 6)+'-'+rec.substring(6, 8)+'T'+rec.substring(9, 11)+':'+rec.substring(11, 13)+':'+rec.substring(13, 15);
			rec_id=$.fullCalendar.parseDate(rec);*/
			//if(!rec_id || rec_id=='Invalid Date')
			//	rec_id='';
			rec_id=rec;
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_SUMMARY']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			title=vcalendarUnescapeValue(parsed[4]);
		}
		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_CREATED']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			created=vcalendarUnescapeValue(parsed[4]);
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_STATUS']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			status=vcalendarUnescapeValue(parsed[4]);
		}
		if(globalSettings.appleremindersmode.value  && (status=='IN-PROCESS' || status=='CANCELLED'))
			status = 'NEEDS-ACTION';
		switch(status)
		{
			case 'NEEDS-ACTION':
				filterStatus = 'filterAction';
				break;
			case 'COMPLETED':
				filterStatus = 'filterCompleted';
				break;
			case 'IN-PROCESS':
				filterStatus = 'filterProgress';
				break;
			case 'CANCELLED':
				filterStatus = 'filterCanceled';
				break;
			default:
				filterStatus = 'filterAction';
				break;
		}

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_COMPLETED']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			var tmpDate=parsed[4];

			if(tmpDate.indexOf("T")!=-1)
				tmpDate=tmpDate.substring(0, 4)+'-'+tmpDate.substring(4, 6)+'-'+tmpDate.substring(6, 8)+'T'+tmpDate.substring(9, 11)+':'+tmpDate.substring(11, 13)+':'+tmpDate.substring(13, 15);

			var t1=$.fullCalendar.parseDate(tmpDate);
			if(t1==null || ((t1.toString())=='Invalid Date'))
				completedOn='';
			else
				completedOn=new Date(t1.getTime());

			if(completedOn!='')
			{
				var intOffsetA='';
				var dtStartTimezoneA = new Array();
				if(parsed[3])
					dtStartTimezoneA=parsed[3].split('=');
				if(parsed[4].charAt(parsed[4].length-1)=='Z')
					tzNameA='UTC';
				if(dtStartTimezoneA.length>1 || tzNameA=='UTC')
				{
					if(tzNameA!='UTC')
						tzNameA=$.trim(dtStartTimezoneA[1]);
					var finTZ = checkTimezone(tzNameA);
					if(finTZ!=null)
						tzNameA = finTZ;
					if(globalSettings.timezonesupport.value && tzNameA in timezones)
					{
						var valOffsetFromA=getOffsetByTZ(tzNameA, completedOn);
						intOffsetA=getOffsetByTZ(tzName, completedOn).getSecondsFromOffset()*1000-valOffsetFromA.getSecondsFromOffset()*1000;
					}
				}
				else if(processedTimezones.indexOf(tzName)==-1)
				{
					if(timeZonesEnabled.indexOf(tzName)==-1)
						timeZonesEnabled.push('local');
					processedTimezones.push('local');
				}
				if(tzName!='' && tzName != 'local')
					if(processedTimezones.indexOf(tzNameA)==-1)
					{
						if(timeZonesEnabled.indexOf(tzNameA)==-1)
							timeZonesEnabled.push(tzNameA);
						processedTimezones.push(tzNameA);
					}

				if(intOffsetA!='')
					completedOn.setTime(completedOn.getTime()+intOffsetA);
			}
		}
		if(status=='COMPLETED' && completedOn=='' &&  end!='' && typeof end=='object')
			completedOn=new Date(end.getTime());

		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_PERCENT-COMPLETE']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			complete=vcalendarUnescapeValue(parsed[4]);
			percent=complete;
		}
		vcalendar_element=vcalendar.match(vCalendar.pre['contentline_PRIORITY']);
		if(vcalendar_element!=null)
		{
			parsed=vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
			priority=vcalendarUnescapeValue(parsed[4]);
			var priorN = parseInt(priority,10);
			if(!isNaN(priorN))
			{
				if(priority>5 && priority<10)
					renderPriority=3;
				else if(priority<5 && priority>0)
					renderPriority=1;
				else if(priority==5)
					renderPriority=2;
				else
					renderPriority=0;
			}
		}

		var evid=inputEvent.uid.substring(inputEvent.uid.lastIndexOf('/')+1, inputEvent.uid.length);
		var todos='',
		p=0;
		var isChange=false;
		if(isRepeat &&(realStart || realEnd))
			repeatHash=inputEvent.uid+'#'+created+'#'+frequency;
		else if(!isRepeat)
			repeatHash=inputEvent.uid+'#'+created+'#'+rec_id;

		if(percent!='' && percent!='0' && percent!='100' && percent!='50')
		{
			if(typeof globalTodolistStatusArray[repeatHash]=='undefined')
				globalTodolistStatusArray[repeatHash] = {};
			globalTodolistStatusArray[repeatHash].percent = percent;
		}

		if(!isNew && !repeatHashEquals)
		{
			var checkForChangeTodo=findEventInArray(inputEvent.uid, false, globalCalTodo!=null ? globalCalTodo.repeatHash : null);
			if(checkForChangeTodo!='')
			{
				if(checkForChangeTodo.etag!=inputEvent.etag || ($('#showTODO').val()==inputEvent.uid && ($('#repeatTodo').val()=="true" || $('#recurrenceIDTODO').val()!='') && !repeatHashEquals))
				{
					for(var it=0; it<checkForChangeTodo.alertTimeOut.length; it++)
						clearTimeout(checkForChangeTodo.alertTimeOut[it]);
					if($('#showTODO').val()==inputEvent.uid)
					{
						if($('#repeatTodo').val()=="true" || $('#recurrenceIDTODO').val()!='')
						{
							if(!(typeof globalCalTodo!='undefined' && globalCalTodo!=null && globalCalTodo.repeatHash == repeatHash))
							{
								var name=globalCalTodo.title;
								//showTodoForm({title: name, id:inputEvent.uid}, 'show','', true);
								$('#editAllTODO').css('visibility','hidden');
								$('#editFutureTODO').css('visibility','hidden');
								$('#editOnlyOneTODO').css('visibility','hidden');
								$('#repeatConfirmBoxContentTODO').html('<b>'+name+"</b> "+localization[globalInterfaceLanguage].repeatChangeTxt);
								$('#repeatConfirmBoxQuestionTODO').html(localization[globalInterfaceLanguage].repeatTodoChangeTxtClose);
							}
							else
							{
								isChange=true;
								repeatHashEquals=true;
								$('#todoList').fullCalendar('selectEvent');
							}
						}
						else
							isChange=true;
					}
				}
			}
		}

		var res=0;
		var index=0;
		for(var p=0;p<globalResourceCalDAVList.TodoCollections.length;p++)
			if(typeof globalResourceCalDAVList.TodoCollections[p].uid !='undefined' && globalResourceCalDAVList.TodoCollections[p].uid==inputCollection.uid)
			{
				index=p;
				break;
			}
		var re=new RegExp('^(https?://)([^@/]+(?:@[^@/]+)?)@([^/]+)(.*/)([^/]+/)([^/]+/)([^/]*)', 'i');
		var tmp=rid.match(re);
		var firstPart=index.pad(String(globalResourceCalDAVList.TodoCollections.length).length);

		var compareString=(firstPart + title).toLowerCase();
		var isall=false;
		if(isRepeat &&(realStart || realEnd))
		{
			var firstDateSaved = false;
			if(globalAppleSupport.nextDates[inputEvent.uid]!=undefined)
				delete globalAppleSupport.nextDates[inputEvent.uid];
			var ruleString=vcalendar.match(vCalendar.pre['contentline_RRULE2'])[0].match(vCalendar.pre['contentline_parse'])[4];
			inputEvent.isRepeat=true;

			if(realStart)
				var varDate=new Date($.fullCalendar.parseDate(realStart).getTime());
			else if(realEnd)
				var varDate=new Date($.fullCalendar.parseDate(realEnd).getTime());

			if(realEnd)
				var varEndDate=new Date($.fullCalendar.parseDate(realEnd).getTime());

			var lastGenDate='';
			var repeatStart='', repeatEnd='';
			if(realStart)
				repeatStart=new Date(varDate.getTime());
			if(realEnd)
				repeatEnd=new Date(varEndDate.getTime());
			var untilDate='',
			realUntilDate='',
			realUntil='';
			if(until!=='')
			{
				if(isUntilDate)
				{
					if(until.indexOf('T')!=-1)
					{
						var uString = until.substring(0, 4)+'-'+until.substring(4, 6)+'-'+until.substring(6, 8)+'T'+until.substring(9, 11)+':'+until.substring(11, 13)+':'+until.substring(13, 15);
						var ut=$.fullCalendar.parseDate(uString);
						if(ut==null)
							return false;
						if(ut.toString()=='Invalid Date')
							return false;

						if(globalSettings.timezonesupport.value && tzName in timezones)
							valOffsetFrom=getOffsetByTZ(tzName, ut);
						if(valOffsetFrom)
						{
							var intOffset=valOffsetFrom.getSecondsFromOffset()*1000;
							ut.setTime(ut.getTime()+intOffset);
						}
						untilDate = new Date(ut.getTime());
					}
					else
					{
						untilDate=$.fullCalendar.parseDate(until.substring(0, 4)+'-'+until.substring(4, 6)+'-'+until.substring(6, 8));
						if(realStart!='')
						{
							untilDate.setHours($.fullCalendar.parseDate(realStart).getHours());
							untilDate.setMinutes($.fullCalendar.parseDate(realStart).getMinutes());
							untilDate.setSeconds($.fullCalendar.parseDate(realStart).getSeconds());
						}
						else if(realEnd!='')
						{
							untilDate.setHours($.fullCalendar.parseDate(realEnd).getHours());
							untilDate.setMinutes($.fullCalendar.parseDate(realEnd).getMinutes());
							untilDate.setSeconds($.fullCalendar.parseDate(realEnd).getSeconds());
						}
					}

					realUntil='';
				}
				else
				{
					untilDate='';
					realUntil=until;

				}
				realUntilDate=untilDate;
				inputEvent.untilDate=untilDate;
			}
			else
			{
				untilDate=globalToLoadedLimitTodo;
				realUntilDate='';
				inputEvent.untilDate='never';
			}
			var repeatCount=0, realRepeatCount=0;


			var repeatLimit = new Date(globalToLoadedLimitTodo.getTime());
			repeatLimit.setMonth(repeatLimit.getMonth() + 2);

			var dayDifference=0;
			if(realEnd)
				dayDifference=varEndDate.getTime()-varDate.getTime();
			var lastGenDate=generateTodoRepeatInstances({
				dayDifference:dayDifference,
				untilDate:realUntilDate,
				repeatStart:repeatStart,
				repeatEnd:repeatEnd,
				futureRLimit:repeatLimit,
				stringUID:stringUID,
				recurrence_id_array:recurrence_id_array,
				exDates:exDates,
				alertTime:alertTime,
				ignoreAlarms:inputCollection.ignoreAlarms,
				isChange:isChange,
				todoArray:todoArray,
				preTodoArray:preTodoArray,
				realRepeatCount:realRepeatCount,
				repeatCount:repeatCount,
				items:new todoItems(start,end, realUntilDate, frequency, interval, realUntil, wkst,  repeatStart, repeatEnd, repeatCount, realRepeatCount, byDay, location,  note, title, inputEvent.uid, vcalendar, inputEvent.etag, alertTime, alertNote, status, filterStatus, rec_id, repeatHash,  percent, inputEvent.displayValue, rid, compareString, tzName, realStart, realEnd, alertTimeOut,classType,url,completedOn, toIt, priority,renderPriority, finalAString,ruleString)
			});
		}
		else
		{
			if(end!='' && typeof end == 'string')
			{
				var ttt = $.fullCalendar.parseDate(end);
				end=new Date(ttt.getTime());
			}
			if(!inputCollection.ignoreAlarms)
				alertTimeOut=setAlertTimeouts(true, alertTime, start,end, {title:title, status:status},true, inputEvent.uid);

			var tmpObj=new todoItems(start, end, '', '', '', '', '',  '', '', '', '', '', location, note, title, inputEvent.uid, vcalendar, inputEvent.etag, alertTime, alertNote, status, filterStatus, rec_id, repeatHash,  percent, inputEvent.displayValue, rid, compareString, tzName, realStart, realEnd, alertTimeOut,classType,url,completedOn,toIt, priority,renderPriority, finalAString,'');
			preTodoArray.splice(preTodoArray.length, 0, tmpObj);
			if(isChange)
				globalCalTodo=tmpObj;
		}
		deleteEventFromArray(inputEvent.uid);
		$.merge(globalEventList.displayTodosArray[rid],preTodoArray);
	}
}
