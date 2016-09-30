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

function updateTodoFormDimensions(setHeight)
{
	$('#CATodo').css('width','');
	$('#CATodo').css('width',$('#todo_details_template').css('width'));

	if(setHeight)
	{
		$('#CATodo').css('height','');
		$('#CATodo').css('height',$('#todo_details_template').css('height'));
	}
}

function updateEventFormDimensions(setHeight)
{
	$('#CAEvent').css('width','');
	$('#CAEvent').css('width',$('#event_details_template').css('width'));

	if(setHeight)
	{
		$('#CAEvent').css('height','');
		$('#CAEvent').css('height',$('#event_details_template').css('height'));
	}
}

function setFormPosition(jsEvent, confirmRepeat)
{
	var position_x,
	position_y,
	dist_x,
	dist_y;

	$('#event_details_template').css('max-height','');

	if(jsEvent)
	{
		if(jsEvent.pageX<=($('#main').width()/2))
		{
			position_v='left';
			dist_x=jsEvent.pageX;
		}
		else
		{
			position_v='right';
			dist_x=$('body').width()-jsEvent.pageX;
		}

		/*if(jsEvent.pageY<=($('#main').height()/2))
		{
			position_h='top';
			dist_y=jsEvent.pageY;
		}
		else
		{
			position_h='top';
			dist_y=jsEvent.pageY-$('#event_details_template').height();
		}*/
		position_h='top';
		dist_y=Math.max(29, jsEvent.pageY-(confirmRepeat ? $('#CAEvent').height() : $('#event_details_template').height()));
	}
	else
	{
		position_v='right';
		position_h='top';
		dist_x=25;
		dist_y=29;
	}

	$('#CAEvent').css('left','');
	$('#CAEvent').css('right','');
	$('#CAEvent').css('top','');
	$('#CAEvent').css('bottom','');
	$('#CAEvent').css(position_v, dist_x);
	$('#CAEvent').css(position_h, dist_y);
	$('#event_details_template').css('max-height', $('#main').height()-dist_y+20+'px');
	$('#CAEvent').css('max-height', $('#main').height()-dist_y+20+'px');
}

function setTodoPosition(jsEvent)
{
	var dist,
	pointY=0;
	$('#todo_details_template').css('max-height','');
	$('#CATodo').css('max-height','');

	if(jsEvent!=undefined)
	{
		if(jsEvent.pageY!=undefined)
			pointY=jsEvent.pageY;
		else
			pointY=jsEvent.clientY;
	}

	if(jsEvent)
	{
		/*if((pointY)+$('#todo_details_template').height()<$(window).height())
			dist=jsEvent.pageY;
		else
			dist=pointY-$('#todo_details_template').height();*/
		dist=Math.max(25, jsEvent.pageY-$('#todo_details_template').height());
	}
	else
		dist=25;

	$('#CATodo').css('left','');
	$('#CATodo').css('right','');
	$('#CATodo').css('top','');
	$('#CATodo').css('bottom','');
	$('#CATodo').css('top', dist);
	$('#todo_details_template').css('right', 0);
	$('#CATodo').css('right', 25);
	$('#todo_details_template').css('max-height', $('#main').height()-dist+20+'px');
	$('#CATodo').css('max-height', $('#main').height()-dist+20+'px');
}

function showTimezones(selTimezone, todoSelector)
{
	if(!globalSettings.timezonesupport.value)
		return false;

	var select=$('#timezone'+todoSelector);
	select.empty();
	var isFirst=false;
	for(var izone in timezoneKeys)
	{
		if(timeZonesEnabled.indexOf(timezoneKeys[izone])==-1)
			continue;
		if(!isNaN(izone))
		{
			var tmp=null;
			if(!isFirst)
			{
				tmp=$('<option>');
				tmp.attr('data-type','local');
				isFirst=true;
				if(!(selTimezone in timezones) && selTimezone!= '' && selTimezone!= 'local' && (globalSettings.removeunknowntimezone.value == null || !globalSettings.removeunknowntimezone.value))
				{
					tmp.text(localization[globalInterfaceLanguage].customTimezone);
					tmp.attr('value','custom');
					if((todoSelector=='PickerTODO' || todoSelector=='Picker') && globalSettings.timezone.value != null)
						tmp.attr('value',globalSettings.timezone.value);
					select.append(tmp);
				}
			}
			tmp=$('<option>');
			tmp.attr('data-type',timezoneKeys[izone]);
			if(izone==0)
			{
				tmp.text(localization[globalInterfaceLanguage].localTime);
				tmp.attr('value','local');
				select.append(tmp);
			}
			else
			{
				tmp.text(timezoneKeys[izone]);
				tmp.attr('value',timezoneKeys[izone]);
				select.append(tmp);
			}
		}
	}

	if(!selTimezone && typeof globalSessionTimeZone!='undefined' && globalSessionTimeZone)
		selTimezone=globalSessionTimeZone;

	if(selTimezone in timezones)
		select.val(selTimezone);
	else
	{
		if((globalSettings.removeunknowntimezone.value != null && globalSettings.removeunknowntimezone.value) || selTimezone == 'local')
			select.val('local');
		else
			select.val('custom');
	}
}

function showTodoForm(todo, mod, repeatOne, confirmRepeat)
{
	$('#CATodo').css('display','none');
	$('#todo_details_template').remove();
	$('#CATodo').html(cleanVtodoTemplate);
	setFirstDayTodo();
	bindTodoForm();

	$('#noteTODO').autosize({defaultStyles: {height: '64', overflow: '', 'overflow-y': '', 'word-wrap': '', resize: 'none'}, callback: function(){checkTodoFormScrollBar();}});
	$("#showTODO").val('');
	$("#uidTODO").val('');
	$("#etagTODO").val('');
	$("#vcalendarUIDTODO").val('');
	globalPrevDate='';
	globalObjectLoading=true;

	var color='';
	if(todo==null)
	{
		var activeCollection = $('#ResourceCalDAVTODOList').find('.resourceCalDAVTODO_item.resourceCalDAV_item_selected');
		if(activeCollection.length>0 && !globalResourceCalDAVList.getTodoCollectionByUID(activeCollection.attr('data-id')).permissions.read_only)
			color=rgbToHex(activeCollection.children('.resourceCalDAVColor').css('background-color'));
	}
	else
		color=globalResourceCalDAVList.getTodoCollectionByUID(todo.res_id).ecolor;

	if(confirmRepeat)
	{
		$('#showTODO').val(todo.id);
		$('#repeatTodo').val(true);
		$('#CATodo').show();
		$('#repeatConfirmBoxTODO').css('visibility', 'visible');
		if(todo.repeatCount!='' && todo.repeatCount == 1 || globalSettings.appleremindersmode.value)
		{
			$('#editFutureTODO').css('display','none');
			if($('#editFutureTODO').next('br').length>0)
				$('#editFutureTODO').next().remove();
		}
		else if($('#editFutureTODO').css('display')=='none')
		{
			$('#editFutureTODO').css('display','block');
			if($('#editFutureTODO').next('br').length==0)
				$('#editFutureTODO').after('<br/>')
		}

		$('#editAllTODO, #editOnlyOneTODO, #editFutureTODO').click(function(){
			if(globalCalTodo)
			{
				if($(this).attr('id')=='editOnlyOneTODO')
					showTodoForm(globalCalTodo, 'show', 'editOnly');
				else if($(this).attr('id')=='editAllTODO')
						showTodoForm(globalCalTodo, 'show', '');
				else if($(this).attr('id')=='editFutureTODO')
					showTodoForm(globalCalTodo, 'show', 'futureOnly');

				$('#repeatConfirmBoxContentTODO').html('');
				$('#repeatConfirmBoxTODO').css('visibility', 'hidden');
				$('#todo_details_template').css('visibility', 'visible');
				$('#AlertDisabler').fadeOut(globalEditorFadeAnimation);
			}
		});

		$('#repeatConfirmBoxContentTODO').html('<b>'+todo.title+"</b> "+localization[globalInterfaceLanguage].repeatBoxContentTODO);
		$('#repeatConfirmBoxQuestionTODO').html(localization[globalInterfaceLanguage].repeatBoxQuestionTODO);
		$('#todo_details_template').css('visibility', 'hidden');
		globalObjectLoading=false;
		$('#CATodo').show(200, function(){
			$('#todoColor').css('background-color',color);
			checkTodoFormScrollBar();
			$('#todoForm').scrollTop(0);
		});
		return true;
	}

	if(mod=='show' && repeatOne=='futureOnly')
	{
		if(todo.start!=null)
			$('#futureStartTODO').val(todo.realRepeatCount+';'+todo.start);
		else if(todo.end!=null)
			$('#futureStartTODO').val(todo.realRepeatCount+';'+todo.end);
	}

	if(mod=='show')
	{
		var checkDataStart='';
		if(todo.start)
			checkDataStart=$.fullCalendar.formatDate(todo.start, "yyyyMMdd'T'HHmmss'Z'");
		if($('.fc-event-selected').length>0 && $('.fc-event-selected').attr("data-start")!=checkDataStart)
			$('.fc-view-todo').addClass('fc-view-trans');
		else
			$('.fc-view-todo').removeClass('fc-view-trans');
	}

	if(repeatOne=='editOnly')
		if(todo!=null && (todo.type || todo.rec_id))
		{
			var eventsSorted=jQuery.grep(globalEventList.displayTodosArray[todo.res_id],function(e){if(e.id==todo.id)return true}).sort(repeatStartCompare);
			if(eventsSorted.indexOf(todo)!=-1)
			{
				if(eventsSorted.indexOf(todo)<(eventsSorted.length-1))
					showTodoNextNav();
				if(eventsSorted.indexOf(todo)!=0)
					showTodoPrevNav();

				var uncomplete=0;
				for(var ij=(eventsSorted.indexOf(todo)+1); ij<eventsSorted.length; ij++)
					if(eventsSorted[ij].status!='COMPLETED')
						uncomplete++;
				if(uncomplete>0 && eventsSorted.indexOf(todo)<(eventsSorted.length-1))
					showTodoNextNav(true);

				var uncomplete=0;
				for(var ij=(eventsSorted.indexOf(todo)-1); ij>=0; ij--)
					if(eventsSorted[ij].status!='COMPLETED')
						uncomplete++;
				if(uncomplete>0 && eventsSorted.indexOf(todo)!=0)
					showTodoPrevNav(true);
			}
		}

	if(todo!=null)
	{
		var prior=parseInt(todo.priority,10);
		if(prior==5)
			$('#priority_TODO').val(5);
		else if(prior>5 && prior<10)
		{
			$('#priority_TODO [data-type="priority_TODO_low"]').attr('value',prior)
			$('#priority_TODO').val(prior);
		}
		else if(prior<5 && prior>0)
		{
			$('#priority_TODO [data-type="priority_TODO_high"]').attr('value',prior)
			$('#priority_TODO').val(prior);
		}
		else
			$('#priority_TODO').val(0);
	}

	if(todo!=null)
		var sliderValue=todo.percent;
	else
		sliderValue=0;

	var cals=globalResourceCalDAVList.sortedTodoCollections;
	var todoCalendarObj = $('#todo_calendar');
	var calSelected = $('.resourceCalDAVTODO_item.resourceCalDAV_item_selected').attr('data-id');
	for(var i=0;i<cals.length;i++)
	{
		if( cals[i].uid!=undefined && ((todo!=null && todo.res_id==cals[i].uid) || (cals[i].makeLoaded && !cals[i].permissions_read_only)))
		{
			todoCalendarObj.append(new Option(cals[i].displayValue,cals[i].uid));
		}
	}

	if(mod!='new')
		fullVcalendarToTodoData(todo,true);
	else
		CalDAVeditor_cleanup('form');

	if(mod=='new')
	{
		$('#todoInEdit').val('true');
		$('#deleteTODO').hide();
		$('#resetTODO').hide();
		$('#editTODO').hide();
		$('#duplicateTODO').hide();
		$('#editOptionsButtonTODO').hide();
		$('#showTODO').val('');

		if($('#ResourceCalDAVTODOList').find('.resourceCalDAVTODO_item.resourceCalDAV_item_selected').length>0 && $('#todo_calendar').find('option[value="'+$('#ResourceCalDAVTODOList').find('.resourceCalDAVTODO_item.resourceCalDAV_item_selected').attr("data-id")+'"]').length>0)
			$('#todo_calendar').val($('#ResourceCalDAVTODOList').find('.resourceCalDAVTODO_item.resourceCalDAV_item_selected').attr("data-id"));
		else
			$('#todo_calendar').val('choose');
		//$('[data-type="name_TODO"]').attr('placeholder', localization[globalInterfaceLanguage].pholderNewTODO);

		showTimezones('', 'TODO');
		$('.timezone_rowTODO').css('display','none')
	}
	$('#CATodo').show();
	$('#todo_details_template').show();
	if(globalSettings.appleremindersmode.value)
	{
		$('[data-type="todo_type_start"], [data-type="todo_type_both"]').remove();
		if(typeof globalSettings.appleremindersmode.value == 'string' && globalSettings.appleremindersmode.value.toLowerCase()=='ios6')
		{
			$('#url_trTODO').hide();
			$('#location_row_TODO').hide();
		}
		$('[data-type="STATUS_CANCELLED_TODO"],[data-type="STATUS_IN-PROCESS_TODO"]').remove();
	}
	if(mod=='show')
	{
		$('#showTODO').val(todo.id);
		$('#todoDetailsTable :input[type!="button"]').prop('disabled', true);

			if(todo.timeZone)
				showTimezones(todo.timeZone,'TODO');
			else
				showTimezones('local','TODO');

		if(todo.etag!='')
			$('#todo_calendar').val(todo.res_id);

		$('#nameTODO').val(todo.title);
		if(todo.status=='CANCELLED')
			$('#nameTODO').addClass('title_cancelled');

		if(todo.start!=null || todo.end!=null)
		{
			if((!globalSettings.appleremindersmode.value) && ((todo.start!=null && todo.end!=null && repeatOne!='') || (!todo.type && todo.realStart!='' && todo.realEnd!='' && repeatOne=='') || (todo.type && todo.repeatStart!='' && todo.repeatEnd!='' && repeatOne=='')))
				$('#todo_type').val('both');
			else if((!globalSettings.appleremindersmode.value) && ((todo.start!=null && todo.end==null && repeatOne!='') || (!todo.type && todo.realStart!='' && todo.realEnd=='' && repeatOne=='') || (todo.type && todo.repeatStart!='' && todo.repeatEnd=='' && repeatOne=='')))
				$('#todo_type').val('start');
			else
				$('#todo_type').val('due');
			if(globalSettings.timezonesupport.value)
			$('.timezone_rowTODO').show();
		}
		else
		{
			$('#todo_type').val('none');
			$('.timezone_rowTODO').css('display','none');
		}
		if(todo.start!='' && todo.start!=null)
		{
			var date,
			year,
			month,
			day,
			hour,
			minute;

			if(todo.realStart)
				date=$.fullCalendar.parseDate(todo.realStart);
			else
				date=$.fullCalendar.parseDate(todo.start);

			if($('#showTODO').val()!='' && todo.repeatStart!='' && repeatOne=='')
				date=todo.repeatStart;
			else if($('#showTODO').val()!='' && todo.repeatStart=='' && repeatOne=='' && todo.type)
				date='';

			if(date)
			{
				(date.getHours())<10 ? (hour='0'+(date.getHours())) : (hour=date.getHours());
				(date.getMinutes())<10 ? (minute='0'+(date.getMinutes())) : (minute=date.getMinutes());

				var formattedDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
				$('#date_fromTODO').val(formattedDate);
				if($('#todo_type').val=='both')
					globalPrevDate = new Date(date.getTime());
				$('#time_fromTODO').val($.fullCalendar.formatDate(date, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			}
		}
		if(todo.end!='' && todo.end!=null)
		{
			if(todo.realEnd)
				date=$.fullCalendar.parseDate(todo.realEnd);
			else
				date=$.fullCalendar.parseDate(todo.end);

			if($('#showTODO').val()!='' && todo.repeatEnd!='' && repeatOne=='')
				date=todo.repeatEnd;
			else if($('#showTODO').val()!='' && todo.repeatEnd=='' && repeatOne=='' && todo.type)
				date='';

			if(date)
			{
				(date.getHours())<10 ? (hour='0'+(date.getHours())) : (hour=date.getHours());
				(date.getMinutes())<10 ? (minute='0'+(date.getMinutes())) : (minute=date.getMinutes());

				var formattedDate_to=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
				$('#date_toTODO').val(formattedDate_to);
				$('#time_toTODO').val($.fullCalendar.formatDate(date, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			}
		}
		if(repeatOne=='editOnly' && todo.rec_id=='')
		{
			if(todo.repeatStart!='' && todo.start)
			{
				if(typeof todo.realStart=='object')
					$('#recurrenceIDTODO').val($.fullCalendar.formatDate(todo.realStart, "yyyyMMdd'T'HHmmss"));
				else if(typeof todo.realStart =='string')
					$('#recurrenceIDTODO').val($.fullCalendar.formatDate($.fullCalendar.parseDate(todo.realStart), "yyyyMMdd'T'HHmmss"));
			}
			else if(todo.repeatEnd!='' && todo.end)
			{
				if(typeof todo.realEnd =='object')
					$('#recurrenceIDTODO').val($.fullCalendar.formatDate(todo.realEnd, "yyyyMMdd'T'HHmmss"));
				else if(typeof todo.realEnd =='string')
					$('#recurrenceIDTODO').val($.fullCalendar.formatDate($.fullCalendar.parseDate(todo.realEnd), "yyyyMMdd'T'HHmmss"));
			}
		}
		else
			$('#recurrenceIDTODO').val(todo.rec_id);

		if(todo.rec_id || repeatOne=='editOnly' || repeatOne=='futureOnly')
		{
			var savedEvs=jQuery.grep(globalEventList.displayTodosArray[todo.res_id],function(e){if(e.id==todo.id && (e.repeatCount<2 || !e.repeatCount))return true});
			if(savedEvs.length>1 || (repeatOne=='futureOnly' && todo.repeatCount>1) || (repeatOne=='editOnly' && todo.type!=''))
			{
				$('#deleteTODO').attr('onclick',"$('#todoInEdit').val('false');updateEventFormDimensions(true);$('#todoLoader').show();saveTodo(true);");
			}
		}

		if(todo.completedOn!='' && todo.completedOn!=null)
		{
			var date,
			year,
			month,
			day,
			hour,
			minute;


		//	(todo.completedOn.getHours())<10 ? (hour='0'+(todo.completedOn.getHours())) : (hour=todo.completedOn.getHours());
		//	(todo.completedOn.getMinutes())<10 ? (minute='0'+(todo.completedOn.getMinutes())) : (minute=todo.completedOn.getMinutes());
			if(typeof todo.completedOn=='string')
				date = $.fullCalendar.parseDate(todo.completedOn);
			else if(typeof todo.completedOn=='object')
				date=new Date(todo.completedOn.getTime());

			var formattedDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
			$('#completedOnDate').val(formattedDate);
			$('#completedOnTime').val($.fullCalendar.formatDate(date, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('.completedOnTr').show();
		}

		var alarmDate='';
		var alarmIterator=0;

		for(alarmIterator=0;alarmIterator<todo.alertTime.length;alarmIterator++)
		{
			if(alarmIterator>0)
				todo_alert_add(alarmIterator);

			$(".alertTODO[data-id="+(alarmIterator+1)+"]").val("message");

			if(todo.alertTime[alarmIterator].charAt(0)=='-' || todo.alertTime[alarmIterator].charAt(0)=='+')
			{
				var alVal=parseInt(todo.alertTime[alarmIterator].substring(1, todo.alertTime[alarmIterator].length-1));
				var alString='';

				if(todo.alertTime[alarmIterator].charAt(todo.alertTime[alarmIterator].length-1)=="W")
				{
					alVal=alVal/1000/60/60/24/7;
					alString='weeks';
				}
				else if(todo.alertTime[alarmIterator].charAt(todo.alertTime[alarmIterator].length-1)=="D")
				{
					alVal=alVal/1000/60/60/24;
					alString='days';
				}
				else if(todo.alertTime[alarmIterator].charAt(todo.alertTime[alarmIterator].length-1)=="H")
				{
					alVal=alVal/1000/60/60;
					alString='hours';
				}
				else if(todo.alertTime[alarmIterator].charAt(todo.alertTime[alarmIterator].length-1)=="M")
				{
					alVal=alVal/1000/60;
					alString='minutes';
				}
				else if(todo.alertTime[alarmIterator].charAt(todo.alertTime[alarmIterator].length-1)=="S")
				{
					alVal=alVal/1000;
					alString='seconds';
				}

				if(todo.alertTime[alarmIterator].charAt(0)=='-')
					alString+="_before";
				else
					alString+="_after"

				$(".alert_message_detailsTODO[data-id="+(alarmIterator+1)+"]").val(alString);
				$(".before_after_inputTODO[data-id="+(alarmIterator+1)+"]").val(alVal);
				$('.alert_detailsTODO[data-id="'+(alarmIterator+1)+'"]').show();
				$('.alert_message_dateTODO[data-id="'+(alarmIterator+1)+'"]').show();
				$('.before_after_inputTODO[data-id="'+(alarmIterator+1)+'"]').show();
				$(".message_date_inputTODO[data-id="+(alarmIterator+1)+"]").hide();
				$(".message_time_inputTODO[data-id="+(alarmIterator+1)+"]").hide();
			}
			else
			{
				alarmDate=$.fullCalendar.parseDate(todo.alertTime[alarmIterator]);
				(alarmDate.getHours())<10 ? (hour='0'+(alarmDate.getHours())) : (hour=alarmDate.getHours());
				(alarmDate.getMinutes())<10 ? (minute='0'+(alarmDate.getMinutes())) : (minute=alarmDate.getMinutes());

				$(".alert_message_detailsTODO[data-id="+(alarmIterator+1)+"]").val('on_date');
				var formattedAlarmDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, alarmDate);

				$(".message_date_inputTODO[data-id="+(alarmIterator+1)+"]").val(formattedAlarmDate);
				$(".message_time_inputTODO[data-id="+(alarmIterator+1)+"]").val($.fullCalendar.formatDate(alarmDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));

				$('.alert_detailsTODO[data-id="'+(alarmIterator+1)+'"]').show();
				$('.alert_message_dateTODO[data-id="'+(alarmIterator+1)+'"]').show();
			}
		}

		if(alarmIterator>0)
			todo_alert_add(alarmIterator);
		if(todo.type!='' && repeatOne!='editOnly' && todo.ruleString.match(vCalendar.re['recurCaldav'])!=null)
		{
			var ruleString=todo.vcalendar.match(vCalendar.pre['contentline_RRULE2'])[0].match(vCalendar.pre['contentline_parse'])[4];
			if(ruleString.indexOf('BYMONTH=')!=-1 || ruleString.indexOf('BYMONTHDAY=')!=-1 || ruleString.indexOf('BYDAY=')!=-1)
			{
				var pars=ruleString.split(';');

				if(pars.indexElementOf('BYMONTH=')!=-1 && pars.indexElementOf('BYMONTHDAY=')==-1 && pars.indexElementOf('BYDAY=')==-1)
					pars[pars.length] = "BYMONTHDAY="+todo.start.getDate();
				if(todo.type=="DAILY")
				{
					$("#repeat_TODO option[value='DAILY']").prop('selected', true);
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatDays);
				}
				else if(todo.type=="WEEKLY")
				{
					$("#repeat_TODO option[value='CUSTOM_WEEKLY']").prop('selected', true);
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);

					for(var ri=0;ri<pars.length;ri++)
					{
						if(pars[ri].indexOf("BYDAY=")!=-1)
						{
							var byDay=pars[ri].split('=')[1];
							byDay=byDay.replace(/\d*MO/,1).replace(/\d*TU/,2).replace(/\d*WE/,3).replace(/\d*TH/,4).replace(/\d*FR/,5).replace(/\d*SA/,6).replace(/\d*SU/,0).split(',');
							for(var rj=0;rj<byDay.length;rj++)
							{
								if(!isNaN(parseInt(byDay[rj],10)))
									$('#week_custom_TODO .customTable td[data-type="'+byDay[rj]+'"]').addClass('selected');
							}
						}
					}
					$('#week_custom_TODO').show();
				}
				else if(todo.type=="MONTHLY")
				{
					$("#repeat_TODO option[value='CUSTOM_MONTHLY']").prop('selected', true).change();
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);


					for(var ri=0;ri<pars.length;ri++)
					{
						if(pars[ri].indexOf("BYDAY=")!=-1)
						{
							var byDay=pars[ri].split('=')[1];
							byDay=byDay.split(',');
							for(var rj=0;rj<byDay.length;rj++)
							{
								var checkString = byDay[rj].match(vCalendar.pre['+/-number']);
								byDay[rj] = byDay[rj].replace(checkString[0],'');
								if(!isNaN(parseInt(checkString[0],10)))
								{
									switch(parseInt(checkString[0],10))
									{
										case 1:
											$('#repeat_month_custom_select_TODO').val('first');
											break;
										case 2:
											$('#repeat_month_custom_select_TODO').val('second');
											break;
										case 3:
											$('#repeat_month_custom_select_TODO').val('third');
											break;
										case 4:
											$('#repeat_month_custom_select_TODO').val('fourth');
											break;
										case 5:
											$('#repeat_month_custom_select_TODO').val('fifth');
											break;
										case -1:
											$('#repeat_month_custom_select_TODO').val('last');
											break;
										default:
											$('#repeat_month_custom_select_TODO').val('every');
											break;
									}
									$('#repeat_month_custom_select2_TODO').val(byDay[rj]);
								}
							}
						}
						else if(pars[ri].indexOf("BYMONTHDAY=")!=-1)
						{
							$('#repeat_month_custom_select_TODO').val('custom').change();
							var byMonthDay=pars[ri].split('=')[1];
							byMonthDay=byMonthDay.split(',');
							for(var rj=0; rj<byMonthDay.length;rj++)
							{
								if(parseInt(byMonthDay[rj],10)==-1)
								{
									$('#repeat_month_custom_select_TODO').val('last').change();
									$('#repeat_month_custom_select2_TODO').val("DAY");

								}
								else
									$('#month_custom2_TODO .customTable td[data-type="'+(parseInt(byMonthDay[rj],10))+'"]').addClass('selected');
							}
						}
					}
				}
				else if(todo.type=="YEARLY")
				{
					$("#repeat_TODO option[value='CUSTOM_YEARLY']").prop('selected', true).change();
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);
					var isMonthDay=false;
					for(var ri=0;ri<pars.length;ri++)
					{
						if(pars[ri].indexOf("BYDAY=")!=-1)
						{
							var byDay=pars[ri].split('=')[1];
							byDay=byDay.split(',');
							for(var rj=0;rj<byDay.length;rj++)
							{
								var checkString = byDay[rj].match(vCalendar.pre['+/-number']);
								byDay[rj] = byDay[rj].replace(checkString[0],'');
								if(!isNaN(parseInt(checkString[0],10)))
								{
									switch(parseInt(checkString[0],10))
									{
										case 1:
											$('#repeat_year_custom_select1_TODO').val('first');
											break;
										case 2:
											$('#repeat_year_custom_select1_TODO').val('second');
											break;
										case 3:
											$('#repeat_year_custom_select1_TODO').val('third');
											break;
										case 4:
											$('#repeat_year_custom_select1_TODO').val('fourth');
											break;
										case 5:
											$('#repeat_year_custom_select1_TODO').val('fifth');
											break;
										case -1:
											$('#repeat_year_custom_select1_TODO').val('last');
											break;
										default:
											$('#repeat_year_custom_select1_TODO').val('every');
											break;
									}
									$('#repeat_year_custom_select2_TODO').val(byDay[rj]);
								}
							}
						}
						else if(pars[ri].indexOf("BYMONTHDAY=")!=-1)
						{
							$('#repeat_year_custom_select1_TODO').val('custom').change()
							var byMonthDay=pars[ri].split('=')[1];
							byMonthDay=byMonthDay.split(',');
							for(var rj=0; rj<byMonthDay.length;rj++)
							{
								if(parseInt(byMonthDay[rj],10)==-1)
								{
									$('#repeat_year_custom_select1_TODO').val('last').change();
									$('#repeat_year_custom_select2_TODO').val("DAY");

								}
								else
									$('#year_custom1_TODO .customTable td[data-type="'+(parseInt(byMonthDay[rj],10))+'"]').addClass('selected');
							}
							isMonthDay=true;
						}
						else if(pars[ri].indexOf("BYMONTH=")!=-1)
						{
							var byMonth=pars[ri].split('=')[1];
							byMonth=byMonth.split(',');
							for(var rj=0; rj<byMonth.length;rj++)
								$('#year_custom3_TODO .customTable td[data-type="'+(parseInt(byMonth[rj],10)-1)+'"]').addClass('selected');
						}
					}
				}

				if(todo.after=='' && todo.untilDate=='')
					$("#repeat_end_details_TODO option[value='never']").prop('selected', true);
				else if(todo.after!='')
				{
					$("#repeat_end_details_TODO option[value='after']").prop('selected', true);
					$('#repeat_end_after_TODO').val(todo.after);
				}
				else if(todo.untilDate!='')
				{
					date=$.fullCalendar.parseDate(todo.untilDate);
					$("#repeat_end_details_TODO option[value='on_date']").prop('selected', true);
					var formattedRepeatDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
					$('#repeat_end_date_TODO').val(formattedRepeatDate);
				}

				$('#repeat_interval_detail_TODO').val(todo.interval);
				$('#repeat_interval_TODO').show();

				if(todo.byDay.length>0)
				{
					var businessArray=new Array();
					if(globalSettings.weekenddays.value.length>0)
						for(var i=0;i<7;i++)
							if(globalSettings.weekenddays.value.indexOf(i)==-1)
								businessArray[businessArray.length]=i+'';
					var businessCount=0;
					var weekendCount=0;
					for(var i=0;i<byDay.length;i++)
					{
						if(businessArray.indexOf(byDay[i])!=-1)
							businessCount++;
						if(globalSettings.weekenddays.value.indexOf(parseInt(byDay[i],10))!=-1)
							weekendCount++;
					}

					if(businessArray.length>0 && businessArray.length==businessCount)
					{
						$("#repeat_TODO option[value='BUSINESS']").prop('selected', true);
						$('#repeat_interval_TODO').hide();
						$('#week_custom_TODO').hide();
					}
					else if(globalSettings.weekenddays.value.length>0 && globalSettings.weekenddays.value.length==weekendCount)
					{
						$("#repeat_TODO option[value='WEEKEND']").prop('selected', true);
						$('#repeat_interval_TODO').hide();
						$('#week_custom_TODO').hide();
					}
				}
			}
			else
			{
				if(todo.type=="DAILY")
				{
					$("#repeat_TODO option[value='DAILY']").prop('selected', true);
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatDays);
				}
				else if(todo.type=="WEEKLY")
				{
					$("#repeat_TODO option[value='WEEKLY']").prop('selected', true);
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);
				}
				else if(todo.type=="MONTHLY")
				{
					$("#repeat_TODO option[value='MONTHLY']").prop('selected', true);
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);
				}
				else if(todo.type=="YEARLY")
				{
					$("#repeat_TODO option[value='YEARLY']").prop('selected', true);
					$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);
				}

				if(todo.after=='' && todo.untilDate=='')
					$("#repeat_end_details_TODO option[value='never']").prop('selected', true);
				else if(todo.after!='')
				{
					$("#repeat_end_details_TODO option[value='after']").prop('selected', true);
					$('#repeat_end_after_TODO').val(todo.after);
				}
				else if(todo.untilDate!='')
				{
					date=$.fullCalendar.parseDate(todo.untilDate);
					$("#repeat_end_details_TODO option[value='on_date']").prop('selected', true);
					var formattedRepeatDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
					$('#repeat_end_date_TODO').val(formattedRepeatDate);
				}

				$('#repeat_interval_detail_TODO').val(todo.interval);
				$('#repeat_interval_TODO').show();
				$('#repeatTodo').val(true);
			}
		}
		else if(todo.type!='' && repeatOne!='editOnly')
		{
			var cu_opt = new Option(localization[globalInterfaceLanguage].customRepeat, todo.ruleString, false, true);
			cu_opt.attr('data-type','custom_repeat');
			$('#repeat_TODO').append(cu_opt);
		}
		else
			$('#repeatTodo').val(false);

		if(todo.start!=null || todo.end!=null)
		{
			if(globalSettings.timezonesupport.value)
				$('.timezone_rowTODO').show()
		}
		else
			$('.timezone_rowTODO').css('display', 'none');


		if(todo.status!='')
			$('#statusTODO').find('option[value='+todo.status+']').prop('selected', true);

		$('#noteTODO').val(todo.note).trigger('autosize.resize');

		if(todo.classType!='')
			$('#typeTODO').val(todo.classType.toLowerCase());
		else
			$('#typeTODO').val('public');

		if(todo!=null && mod!='new')
		{
			var uidArray = todo.id.match(vCalendar.pre['uidParts']);

			if(decodeURIComponent(uidArray[4]).indexOf(uidArray[2])==-1)
				$('.row_typeTODO').css('display','none');
		}

		$('#uidTODO').val(todo.id);
		$('#url_TODO').val(todo.url);
		$('#location_TODO').val(todo.location);
		$('#etagTODO').val(todo.etag);
		$('#vcalendarHashTODO').val(hex_sha256(todo.vcalendar));
		var stringUIDcurrent=todo.vcalendar.match(vCalendar.pre['contentline_UID']);

		if(stringUIDcurrent!=null)
			stringUIDcurrent=stringUIDcurrent[0].match(vCalendar.pre['contentline_parse'])[4];

		if(stringUIDcurrent)
			$('#vcalendarUIDTODO').val(stringUIDcurrent);
	}


	if($('#todo_type').val()=='start')
	{
		$('.dateTrFromTODO').show();
		$('.dateTrToTODO').hide();
	}
	else if($('#todo_type').val()=='due')
	{
		$('.dateTrToTODO').show();
		$('.dateTrFromTODO').hide();
	}
	else if($('#todo_type').val()=='both')
	{
		$('.dateTrToTODO').show();
		$('.dateTrFromTODO').show();
	}
	else
	{
		$('.dateTrToTODO').hide();
		$('.dateTrFromTODO').hide();
		$('#repeat_row_TODO').hide();
	}

	if($('#repeat_TODO option:selected').attr('data-type')!="repeat_no-repeat" && $('#repeat_TODO option:selected').attr('data-type')!="custom_repeat")
		$('#repeat_details_TODO').show();

	if($('#repeat_end_details_TODO option:selected').attr('data-type')=="repeat_details_on_date")
	{
		$('#repeat_end_after_TODO').hide();
		$('#repeat_end_date_TODO').show();
	}

	if($('#repeat_end_details_TODO option:selected').attr('data-type')=="repeat_details_after")
	{
		$('#repeat_end_after_TODO').show();
		$('#repeat_end_date_TODO').hide();
	}

	if($('#repeat_end_details_TODO option:selected').attr('data-type')=="repeat_details_never")
	{
		$('#repeat_end_after_TODO').hide();
		$('#repeat_end_date_TODO').hide();
	}


	if(mod=='show')
	{
		if($('#ResourceCalDAVTODOList').find('[data-id="'+todo.res_id+'"]').hasClass("resourceCalDAV_item_ro"))
		{
			$('#editTODO').hide();
			$('#duplicateTODO').hide();
			$('#editOptionsButtonTODO').hide();
		}

		$('#saveTODO').hide();
		$('#resetTODO').hide();
		$('#deleteTODO').hide();
		$('#todoDetailsTable :input[type!="button"]').prop('disabled', true);
		$('#todoDetailsTable :input[type="text"]').prop('readonly', true);
		$('#todoDetailsTable textarea').prop('readonly', true);

		$('#percentageSlider').slider({disabled: true});

		/*************************** BAD HACKS SECTION ***************************/
		// here we fix the cross OS/cross broser problems (unfixable in pure CSS)
		if($.browser.webkit && !!window.chrome)	/* Chrome */
		{
			if(navigator.platform.toLowerCase().indexOf('win')==0)	/* Windows version */
			{
				$('#todo_details_template').find('input').css('text-indent', '2px');
				$('#todo_details_template').find('select').css({'padding-left': '0px', 'padding-right': '13px'});
			}
			else	/* non-Windows version */
				$('#todo_details_template').find('input').css('text-indent', '1px');
		}
		else if($.browser.safari)
		{
			$('#todo_details_template').find('textarea').addClass('safari_hack');
			$('#todo_details_template').find('input').addClass('safari_hack');
		}
		else if($.browser.msie)	/* IE */
		{
			if(parseInt($.browser.version, 10)==10)	/* IE 10 (because there are no more conditional comments) */
			{
				$('#todo_details_template').find('select').css({'padding-top': '1px', 'padding-left': '0px', 'padding-right': '0px'});
				$('#todo_details_template').find('textarea').css('padding-top', '3px');
				$('#todo_details_template').find('input[type=button]').css('padding-top', '2px');
			}
		}

		if($.browser.msie || $.browser.mozilla)
		{
			var newSVG=$(SVG_select_dis).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-22px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
			$('#todo_details_template').find('svg[data-type="select_icon"]').replaceWith($('<div>').append($(newSVG).clone()).html());
		}
		/*************************** END OF BAD HACKS SECTION ***************************/
	}
	if(repeatOne=='editOnly' || $('#recurrenceIDTODO').val()!='')
	{
		$('#repeat_TODO').parent().parent().css('display', 'none');
		$('#week_custom_TODO').css('display', 'none');
		$('#month_custom1_TODO').css('display', 'none');
		$('#month_custom2_TODO').css('display', 'none');
		$('#year_custom1_TODO').css('display', 'none');
		$('#year_custom2_TODO').css('display', 'none');
		$('#year_custom3_TODO').css('display', 'none');
		$('#repeat_details_TODO').css('display', 'none');
	}
	if(todo==null || todo.type=='' || (globalSettings.appleremindersmode.value && (todo.status=='COMPLETED' || todo.status== 'CANCELLED')) ||
		(globalSettings.appleremindersmode.value && typeof globalAppleSupport.nextDates[todo.id] == 'undefined'))
		$('#editOptionsButtonTODO').hide();
	else
		$('#editOptionsButtonTODO').click(function(){
			showTodoForm(globalCalTodo, 'show', '', true);
		});

	if(repeatOne=='editOnly' || repeatOne=='futureOnly' || $('#recurrenceIDTODO').val())
		$('#calendarLineTODO').hide();

	if(todo && todo.after && repeatOne=='futureOnly')
			$('#repeat_end_after_TODO').val(todo.after - todo.realRepeatCount + 1);

	$('#percenteCompleteValue').val(sliderValue);

	$('#percentageSlider').slider({
		animate: true,
		range: "min",
		value: sliderValue,
		min: 0,
		max: 100,
		step: 1,

		//this gets a live reading of the value and prints it on the page
		slide: function(event, ui)
		{
			$("#percenteCompleteValue").val(ui.value);
			$(this).parent().parent().find('img').css('display', 'none');
		},

		//this updates the hidden form field so we can submit the data using a form
		change: function(event, ui) {
			var status;

			if (ui.value>99 && $('#statusTODO').val()==='CANCELLED')
				status='CANCELLED';
			else if(ui.value>99)
				status='COMPLETED';
			else if(ui.value>0 && !globalSettings.appleremindersmode.value)
				status='IN-PROCESS';
			else
				status='NEEDS-ACTION';

			$('#statusTODO').val(status);
			todoStatusChanged(status);
		}
	});

	if(!globalSettings.timezonesupport.value)
		$('.timezone_rowTODO').css('display', 'none');

	//updateTodoFormDimensions();

	//if(window.event!=undefined)
	//	setTodoPosition(window.event);
	//else
	//	setTodoPosition(event);

	if($('#todo_type').val()=='none')
		stripTodoAlerts();
	if(mod!='new')
		$('#closeTODO').hide();
	globalObjectLoading=false;
	$('#CATodo').show(200, function(){
		$('#todoColor').css('background-color',color);
		checkTodoFormScrollBar();
		$('#todoForm').scrollTop(0);
	});
}

function bindTodoForm()
{
	initCalDavDatepicker($('#todo_details_template'));
	initCalDavTimepicker($('#todo_details_template'));

	$('#todo_details_template .alert_message_detailsTODO').change(function(){
		var data_id=$(this).attr("data-id");
		$('.before_after_inputTODO[data-id="'+data_id+'"]').parent().parent().find('img').css('display','none');
		if($('.alert_message_detailsTODO[data-id="'+data_id+'"] option:selected').attr('data-type')=="on_dateTODO")
		{
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('.dateTrToTODO').is(':visible') && $('.dateTrToTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_toTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_toTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('.dateTrFromTODO').is(':visible') && $('.dateTrFromTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_fromTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_fromTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}

			$('.message_date_inputTODO[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_date_inputTODO[data-id="'+data_id+'"]').show();
			$('.message_time_inputTODO[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('.message_time_inputTODO[data-id="'+data_id+'"]').show();
			$('.before_after_inputTODO[data-id="'+data_id+'"]').hide();
		}
		else
		{
			$('.message_date_inputTODO[data-id="'+data_id+'"]').hide();
			$('.message_time_inputTODO[data-id="'+data_id+'"]').hide();
			$('.before_after_inputTODO[data-id="'+data_id+'"]').show();
			$('.before_after_inputTODO[data-id="'+data_id+'"]').val('15');
		}
	});

	$('#todo_details_template .before_after_inputTODO').bind('keyup change', function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
			//$(this).parent().find('img').css('visibility','visible');
		}
		else
		{
			if($(this).val().match("^[0-9]+$")==null)
			{
				$(this).parent().find('img').css('display', 'inline');
				//$(this).parent().find('img').css('visibility','visible');
			}
			else
				$(this).parent().find('img').css('display', 'none');
		}
	});

	$('#todo_details_template .alertTODO').change(function(){
		var data_id=$(this).attr("data-id");
		if($(this).val()!='none')
		{
			$('.alert_detailsTODO[data-id="'+data_id+'"]').show();
			$('.alert_message_dateTODO[data-id="'+data_id+'"]').show();
			if($('#todo_type').val()!='none')
				expandTodoAlerts();
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('.dateTrToTODO').is(':visible') && $('.dateTrToTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_toTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_toTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('.dateTrFromTODO').is(':visible') && $('.dateTrFromTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_fromTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_fromTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}

			$('.message_date_inputTODO[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_time_inputTODO[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			todo_alert_add(data_id);
		}
		else
		{
			$('.alert_detailsTODO[data-id="'+data_id+'"]').hide();
			$('.alert_message_dateTODO[data-id="'+data_id+'"]').hide();
			checkForTodo(data_id);
			var data_id=$(this).attr("data-id");
			$('#todo_details_template tr[data-id="'+data_id+'"]').remove();
		}
		checkTodoFormScrollBar();
	});

	$('#repeat_end_after_TODO, #repeat_interval_detail_TODO').bind('keyup change',function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
			//$(this).parent().find('img').css('visibility','visible');
		}
		else
		{
			if($(this).val().match("^[0-9]+$")==null || parseInt($(this).val(),10)<1)
			{
				$(this).parent().find('img').css('display', 'inline');
				//$(this).parent().find('img').css('visibility','visible');
			}
			else
				$(this).parent().find('img').css('display', 'none');
		}
	});

	$('#repeat_month_custom_select_TODO').change(function(){
		if($(this).val()=="custom")
		{
			$('#month_custom2_TODO').show();
			$('#repeat_month_custom_select2_TODO').parent().hide();
		}
		else
		{
			$('#month_custom2_TODO').hide();
			$('#repeat_month_custom_select2_TODO').parent().show();
		}
		checkTodoFormScrollBar();
	});

	$('#repeat_year_custom_select1_TODO').change(function(){
		if($(this).val()=="custom")
		{
			$('#year_custom1_TODO').show();
			$('#repeat_year_custom_select2_TODO').parent().hide();
		}
		else
		{
			$('#year_custom1_TODO').hide();
			$('#repeat_year_custom_select2_TODO').parent().show();
		}
		checkTodoFormScrollBar();
	});

	$('#repeat_end_details_TODO').change(function(){
		$('#repeat_end_date_TODO').parent().find('img').css('display', 'none');

		if($('#repeat_end_details_TODO option:selected').attr('data-type')=="repeat_details_on_date")
		{
			$('#repeat_end_after_TODO').hide();
			$('#repeat_end_date_TODO').show();

			var today;
			if($('#date_fromTODO').val()!='')
			{
				today=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_fromTODO').val());
				if(today==null)
					today=new Date();
			}
			else
				today=new Date();

			var date=new Date(today.getFullYear(), today.getMonth(), today.getDate()+2);
			$('#repeat_end_date_TODO').val($.datepicker.formatDate(globalSettings.datepickerformat.value, date));
		}

		if($('#repeat_end_details_TODO option:selected').attr('data-type')=="repeat_details_after")
		{
			$('#repeat_end_after_TODO').show();
			$('#repeat_end_after_TODO').val('2');
			$('#repeat_end_date_TODO').hide();
		}

		if($('#repeat_end_details_TODO option:selected').attr('data-type')=="repeat_details_never")
		{
			$('#repeat_end_after_TODO').hide();
			$('#repeat_end_date_TODO').hide();
		}

		checkTodoFormScrollBar();
	});

	$('#todo_details_template .customTable td').click(function(){
		if($(this).hasClass('disabled'))
			return true;
		else if($(this).hasClass('selected'))
			$(this).removeClass('selected');
		else
			$(this).addClass('selected');
	});

	$('#closeTODO').click(function()
	{
		$('#todoInEdit').val('false');
		if($('#uidTODO').val()!='')
		{
			var uid=$('#uidTODO').val();
			var calUID=uid.substring(0, uid.lastIndexOf('/')+1);
			var color=$('#ResourceCalDAVTODOList').find("[data-id='"+calUID+"']").find('.resourceCalDAVColor').css('background-color');

			$('.event_item[data-id="'+uid+'"]').children('.fc-event-handle').css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
		}

		$('#TodoDisabler').fadeOut(globalEditorFadeAnimation, function(){
			$('#timezonePickerTODO').prop('disabled', false);
		});

		if(typeof globalCalTodo!= 'undefined' && globalCalTodo!=null && globalVisibleCalDAVTODOCollections.indexOf(globalCalTodo.res_id)!=-1)
		{
			$('#todoList').fullCalendar('selectEvent');
		}
		else
			$('#CATodo').attr('style','display:none');
	});

	$('#resetTODO').click(function(){
		$('#todo_details_template').find('img[data-type=invalidSlider],img[data-type=invalidSmall]').css('display','none');
		if($('#uidTODO').val()!='')
		{
			var uid=$('#uidTODO').val();
			var calUID=uid.substring(0, uid.lastIndexOf('/')+1);
			var color=$('#ResourceCalDAVTODOList').find("[data-id='"+calUID+"']").find('.resourceCalDAVColor').css('background-color');

			$('.event_item[data-id="'+uid+'"]').children('.fc-event-handle').css({'background-color': rgbToRgba(color,0.9), 'border-color': color});

			if($('#recurrenceIDTODO').val()!='')
				showTodoForm(globalCalTodo, 'show','editOnly');
			else
				showTodoForm(globalCalTodo, 'show');
			startEditModeTodo();
		}
	});

	$('#todo_calendar').change(function(){
		var color = '';
		if($(this).val()=='choose')
			color = 'rgb(240,240,240)';
		else
			color=$('#ResourceCalDAVTODOList').find("[data-id='"+$(this).val()+"']").find('.resourceCalDAVColor').css('background-color');

		var uid='fooUID';
		if($('#uidTODO').val()!='')
			uid=$('#uidTODO').val();

		$('#todoColor').css('background-color',color);
		$('.event_item[data-id="'+uid+'"]').find('.fc-event-handle').css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
	});

	$('#repeat_TODO').change(function(){
		if($('#repeat_TODO option:selected').attr('data-type')=='repeat_no-repeat' || $('#repeat_TODO option:selected').attr('data-type')=="custom_repeat")
		{
			$('#repeat_details_TODO').hide();
			$('#repeat_interval_TODO').hide();
			$('#week_custom_TODO').hide();
			$('#month_custom1_TODO').hide();
			$('#month_custom2_TODO').hide();
			$('#year_custom1_TODO').hide();
			$('#year_custom2_TODO').hide();
			$('#year_custom3_TODO').hide();
		}
		else
		{
			$('#repeat_details_TODO').show();

			if($(this).val()!='BUSINESS' && $(this).val()!='TWO_WEEKLY' && $(this).val()!='WEEKEND')
			{
				$('#repeat_interval_TODO').show();
				$("#repeat_interval_detail_TODO").val('1');
				$('#repeat_interval_TODO').find('img').css('display','none');
			}
			else
				$('#repeat_interval_TODO').hide();

			if($(this).val()=='DAILY')
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatDays);

			if($(this).val()=='WEEKLY')
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);

			if($(this).val()=='MONTHLY')
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);

			if($(this).val()=='YEARLY')
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);

			if($(this).val()=='CUSTOM_WEEKLY')
			{
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);
				$('#week_custom_TODO').show();
			}
			else
				$('#week_custom_TODO').hide();

			if($(this).val()=='CUSTOM_MONTHLY')
			{
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);
				$('#month_custom1_TODO').show();
				if($('#repeat_month_custom_select_TODO').val() == "custom")
					$('#repeat_month_custom_select_TODO').trigger('change');
			}
			else
			{
				$('#month_custom1_TODO').hide();
				$('#month_custom2_TODO').hide();
			}

			if($(this).val()=='CUSTOM_YEARLY')
			{
				$('#repeat_interval_TODO [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);
				$('#year_custom2_TODO').show();
				$('#year_custom3_TODO').show();
				if($('#repeat_year_custom_select1_TODO').val() == "custom")
					$('#repeat_year_custom_select1_TODO').trigger('change');
			}
			else
			{
				$('#year_custom1_TODO').hide();
				$('#year_custom2_TODO').hide();
				$('#year_custom3_TODO').hide();
			}

			var today;
			if($('#date_fromTODO').val()!='')
			{
				today=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_fromTODO').val());
				if(today==null)
					today=new Date();
			}
			else
				today=new Date();

			var date=new Date(today.getFullYear(),today.getMonth(),today.getDate()+2);
			$('#repeat_end_date_TODO').val($.datepicker.formatDate(globalSettings.datepickerformat.value, date));
		}
		checkTodoFormScrollBar();
	});

	$('#statusTODO').change(function(){
		var status = $(this).val();

		switch(status) {
			case 'NEEDS-ACTION':
				$('#percenteCompleteValue').val(0);
				$('#percentageSlider').slider({value: 0});
				$('#nameTODO').removeClass('title_cancelled');
				break;
			case 'IN-PROCESS':
				var value = 50;
				var id = $('.fc-event-selected').attr('data-repeat-hash');
				if(typeof globalTodolistStatusArray[id]!='undefined' && typeof globalTodolistStatusArray[id].percent!='undefined')
					value=globalTodolistStatusArray[id].percent;
				$('#percenteCompleteValue').val(value);
				$('#percentageSlider').slider({value: value});
				$('#nameTODO').removeClass('title_cancelled');
				break;
			case 'CANCELLED':
				$('#percenteCompleteValue').val(100);
				$('#percentageSlider').slider({value: 100});
				$('#nameTODO').addClass('title_cancelled');
				break;
			case 'COMPLETED':
				$('#percenteCompleteValue').val(100);
				$('#percentageSlider').slider({value: 100});
				$('#nameTODO').removeClass('title_cancelled');
				break;
			default:
				break;
		}

		todoStatusChanged(status);
	});

	$('#todo_type').change(function(){
		if($(this).val()=='none')
		{
			$('#timezoneTODO').val('local');
			$('#repeat_row_TODO').hide();
			$('#date_fromTODO, #time_fromTODO, #date_toTODO, #time_toTODO').parent().find('img').css('display','none');
			$('.dateTrFromTODO, .dateTrToTODO, .timezone_rowTODO').hide();
			stripTodoAlerts();
		}
		else if($(this).val()=='start')
		{
			var myDate=new Date();
			$('#date_fromTODO').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('#time_fromTODO').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('#repeat_row_TODO').show();
			$('#date_toTODO, #time_toTODO').parent().find('img').css('display','none');
			$('.dateTrToTODO').hide();

			$('.dateTrFromTODO').show();
			if(globalSettings.timezonesupport.value)
			{
				$('.timezone_rowTODO').show();
				$('#timezoneTODO').val(globalSessionTimeZone);
			}
			$('#date_fromTODO, #time_fromTODO').trigger('change');
		}
		else if($(this).val()=='due')
		{
			var myDate=new Date($('#todoList').fullCalendar('getView').start.getTime());
			myDate.setHours(globalSettings.calendarendofbusiness.value);
			myDate.setMinutes((globalSettings.calendarendofbusiness.value%1)*60);
			$('#date_toTODO').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('#time_toTODO').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('#repeat_row_TODO').show();
			$('#date_fromTODO, #time_fromTODO').parent().find('img').css('display','none');
			$('.dateTrFromTODO').hide();

			$('.dateTrToTODO').show();
			if(globalSettings.timezonesupport.value)
			{
				$('.timezone_rowTODO').show();
				$('#timezoneTODO').val(globalSessionTimeZone);
			}
			$('#date_toTODO, #time_toTODO').trigger('change');
		}
		else if($(this).val()=='both')
		{
			var myDate='';
			var myDateStart= new Date();
			if($('#date_toTODO').val()!='')
			{
				var dateFrom=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_toTODO').val());
				var datetime_to=$.fullCalendar.formatDate(dateFrom, 'yyyy-MM-dd');
				var aDate=new Date(Date.parse("01/02/1990, "+$('#time_toTODO').val()));
				var time_from=$.fullCalendar.formatDate(aDate, 'HH:mm:ss');
				var myDate=$.fullCalendar.parseDate(datetime_to+'T'+time_from);
			}
			else
			{
				myDate=new Date($('#todoList').fullCalendar('getView').start.getTime());
				$('#repeat_row_TODO').show();
				myDate.setHours(globalSettings.calendarendofbusiness.value);
				myDate.setMinutes((globalSettings.calendarendofbusiness.value%1)*60);
				if($('#date_toTODO').val()=='')
					$('#date_toTODO').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
				if($('#time_toTODO').val()=='')
					$('#time_toTODO').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			}

			if(myDateStart>myDate)
				myDateStart= new Date(myDate.getTime());
			globalPrevDate = new Date(myDateStart.getTime());
			if($('#date_fromTODO').val()=='')
				$('#date_fromTODO').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDateStart));

			if($('#time_fromTODO').val()=='')
				$('#time_fromTODO').val($.fullCalendar.formatDate(myDateStart, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));

			$('.dateTrFromTODO, .dateTrToTODO').show();
			if(globalSettings.timezonesupport.value)
			{
				$('.timezone_rowTODO').show();
				$('#timezoneTODO').val(globalSessionTimeZone);
			}
			$('#date_fromTODO, #time_fromTODO, #date_toTODO, #time_toTODO').trigger('change');
		}
		if($('#todo_type').val()!='none')
			expandTodoAlerts();
		checkTodoFormScrollBar();
	});

	$('#percenteCompleteValue').bind('keyup change',function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
		}
		else
		{
			if($(this).val().match('^(([0-9])|([1-9][0-9])|(100))$')==null)
				$(this).parent().find('img').css('display', 'inline');
			else
			{
				$(this).parent().find('img').css('display', 'none');
				$( "#percentageSlider" ).slider({value: $(this).val()});
			}
		}
	});
}

function showEventForm(date, allDay, calEvent, jsEvent, mod, repeatOne, confirmRepeat)
{
	$('#event_details_template').remove();
	$('#CAEvent').html(cleanVcalendarTemplate);
	setFirstDayEvent();
	bindEventForm();

	$('#note').autosize({defaultStyles: {height: '64', overflow: '', 'overflow-y': '', 'word-wrap': '', resize: 'none'}, callback: function(){checkEventFormScrollBar();}});
	$("#show").val('');
	$("#uid").val('');
	$("#etag").val('');
	$("#repeatCount").val('');
	$("#repeatEvent").val('');
	$("#recurrenceID").val('');
	$("#futureStart").val('');
	$("#vcalendarHash").val('');
	$("#vcalendarUID").val('');
	globalPrevDate='';
	var color='';
	if(mod=='new')
	{
		var activeCollection = $('#ResourceCalDAVList').find('.resourceCalDAV_item.resourceCalDAV_item_selected');
		if(activeCollection.length>0 && !globalResourceCalDAVList.getEventCollectionByUID(activeCollection.attr('data-id')).permissions.read_only)
			color=rgbToHex(activeCollection.children('.resourceCalDAVColor').css('background-color'));
	}
	else
		color=globalResourceCalDAVList.getEventCollectionByUID(calEvent.res_id).ecolor;

	if(confirmRepeat)
	{
		$('#show').val(calEvent.id);
		$('#repeatEvent').val(true);
		$('#CAEvent').show();
		$('#repeatConfirmBox').css('visibility', 'visible');
		if(calEvent.repeatCount!='' && calEvent.repeatCount == 1)
		{
			$('#editFuture').css('display','none');
			if($('#editFuture').next('br').length>0)
				$('#editFuture').next().remove();
		}
		else if($('#editFuture').css('display')=='none')
		{
			$('#editFuture').css('display','block');
			if($('#editFuture').next('br').length==0)
				$('#editFuture').after('<br/>')
		}
		$('#repeatConfirmBoxContent').html('<b>'+calEvent.title+"</b> "+localization[globalInterfaceLanguage].repeatBoxContent);
		$('#repeatConfirmBoxQuestion').html(localization[globalInterfaceLanguage].repeatBoxQuestion);

		$('#editAll, #editOnlyOne, #editFuture').click(function(){
			if(globalCalEvent)
			{
				if($(this).attr('id')=='editOnlyOne')
					showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', 'editOnly');
				else if($(this).attr('id')=='editAll')
						showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', '');
				else if($(this).attr('id')=='editFuture')
					showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', 'futureOnly');

				$('#repeatConfirmBoxContent').html('');
				$('#repeatConfirmBox').css('visibility', 'hidden');
				$('#AlertDisabler').fadeOut(globalEditorFadeAnimation);
			}
		});

		$('#CAEvent').height($('#repeatConfirmBox').height());
		$('#eventColor').css('background-color',color);
		updateEventFormDimensions();
		setFormPosition(jsEvent, true);
		$('#event_details_template').scrollTop(0);
		return true;
	}

	if(mod=='show' && repeatOne=='futureOnly')
	{
		$('#futureStart').val(calEvent.realRepeatCount+';'+calEvent.start);
	}
	if(mod!='new')
		fullVcalendarToData(calEvent);
	else
		CalDAVeditor_cleanup();

		if(calEvent!=null && ((repeatOne=='editOnly'&&calEvent.type) || calEvent.rec_id))
		{
			var eventsSorted=jQuery.grep(globalEventList.displayEventsArray[calEvent.res_id],function(e){if(e.id==calEvent.id)return true}).sort(repeatStartCompare);
			if(eventsSorted.indexOf(calEvent)!=-1)
			{
				if(eventsSorted.indexOf(calEvent)<(eventsSorted.length-1))
					showEventNextNav();
				if(eventsSorted.indexOf(calEvent)!=0)
					showEventPrevNav();
			}
		}

	var cals=globalResourceCalDAVList.sortedCollections;
	var calendarObj = $('#event_calendar');
	var calSelected = $('.resourceCalDAV_item.resourceCalDAV_item_selected').attr('data-id');
		for(var i=0;i<cals.length;i++)
		{
			if(cals[i].uid!=undefined && ((calEvent!=null && calEvent.res_id==cals[i].uid) || (cals[i].makeLoaded && !cals[i].permissions_read_only )))
			{
				calendarObj.append(new Option(cals[i].displayValue,cals[i].uid));
			}
		}

	if(mod=='new')
	{
		$('#show').val('');
		$('#editButton').hide();
		$('#duplicateButton').hide();
		$('#editOptionsButton').hide();
		$('#resetButton').hide();
		$('#deleteButton').hide();

		if($('#ResourceCalDAVList').find('.resourceCalDAV_item.resourceCalDAV_item_selected').length>0 && $('#event_calendar').find('option[value="'+$('#ResourceCalDAVList').find('.resourceCalDAV_item.resourceCalDAV_item_selected').attr("data-id")+'"]').length>0)
			$('.R_calendar').val($('#ResourceCalDAVList').find('.resourceCalDAV_item.resourceCalDAV_item_selected').attr("data-id"));
		else
			$('#event_calendar').val('choose');
	}

	if(mod=='drop')
	{
		if(calEvent.etag!='')
			$('#event_calendar').val(calEvent.res_id);
	}

	if(mod=='new')
	{
		//$('[data-type="name"]').attr('placeholder', localization[globalInterfaceLanguage].pholderNewEvent);
		var date_to = null;

		if(calEvent!==null)
		{
			if(calEvent.realStart)
				date=calEvent.realStart;
			else
				date=calEvent.start;

			if(calEvent.realEnd)
				date_to=new Date(calEvent.realEnd.getTime());
			else
				date_to=new Date(calEvent.end.getTime());
		}

		if(!allDay && ((date_to==null) || ((date_to-date)==0))) {
			date_to = new Date(date.getTime());

			if(globalSettings.defaulteventduration.value!==null)
				date_to.setMinutes(date_to.getMinutes()+globalSettings.defaulteventduration.value);
			else {
				date_to.setHours(globalSettings.calendarendofbusiness.value);
				date_to.setMinutes((globalSettings.calendarendofbusiness.value%1)*60);
			}

			if(date_to.getTime()<date.getTime())
				date_to.setDate(date_to.getDate()+1);
		}

		var beforeScroll = $('#main').width()-$('#calendar').width();
		$('#calendar').fullCalendar('renderEvent', $.extend(new items('',date,date_to,localization[globalInterfaceLanguage].pholderNewEvent, allDay, 'fooUID', '', '', '', '', '', '', '', '', '', '', '', '', '','', '', '', '', '', '', '', '', '','', '', '', '', '', '', '', ''),{backgroundColor:hexToRgba(color,0.9),borderColor:color,textColor:checkFontColor(color)}));
		var afterScroll = $('#main').width()-$('#calendar').width();
		rerenderCalendar(beforeScroll!=afterScroll);

		if(allDay)
		{
			$('#allday').prop('checked', true);
			$('#time_from_cell').css('visibility', 'hidden');
			$('#time_to_cell').css('visibility', 'hidden');
			$('.timezone_row').css('display', 'none');
		}
		showTimezones('', '');
	}

	if(mod=='show' || mod=='drop')
	{
		if(calEvent.status=='CANCELLED')
			$('#name').addClass('title_cancelled');

		$('#name').val(calEvent.title);
		$('#location').val(calEvent.location);

		if(calEvent.allDay==true)
		{
			$('#allday').prop('checked', true);
			$('#time_from_cell').css('visibility', 'hidden');
			$('#time_to_cell').css('visibility', 'hidden');
			$('.timezone_row').css('display', 'none');
		}

		if(calEvent.end)
			if(calEvent.realEnd && (mod!='drop'  || repeatOne!='editOnly'))
				date_to=new Date(calEvent.realEnd.getTime());
			else
				date_to=new Date(calEvent.end.getTime());

		$('#note').val(calEvent.note).trigger('autosize.resize');
		if(typeof calEvent.classType!='undefined' && calEvent.classType!=null && calEvent.classType!='')
			$('#type').val(calEvent.classType.toLowerCase());
		else
			$('#type').val('public');

		if(calEvent.status!='')
			$('#status').val(calEvent.status);
		else
			$('#status').val('NONE');

		if(calEvent!=null && mod!='new')
		{
			var uidArray = calEvent.id.match(vCalendar.pre['uidParts']);
			if(decodeURIComponent(uidArray[4]).indexOf(uidArray[2])==-1)
				$('.row_type').css('display','none');
		}

		if(calEvent.avail == 'OPAQUE')
			$('#avail').val('busy');
		else
			$('#avail').val('free');

		if(calEvent!=null)
		{
			var prior=parseInt(calEvent.priority,10);
			if(prior==5)
				$('#priority').val(5);
			else if(prior>5 && prior<10)
			{
				$('#priority [data-type="priority_low"]').attr('value',prior)
				$('#priority').val(prior);
			}
			else if(prior<5 && prior>0)
			{
				$('#priority [data-type="priority_high"]').attr('value',prior)
				$('#priority').val(prior);
			}
			else
				$('#priority').val(0);
		}

		$('#uid').val(calEvent.id);
		$('#url_EVENT').val(calEvent.hrefUrl+'');
		$('#vcalendarHash').val(hex_sha256(calEvent.vcalendar));
		$('#etag').val(calEvent.etag);
		var stringUIDcurrent=calEvent.vcalendar.match(vCalendar.pre['contentline_UID']);

		if(stringUIDcurrent!=null)
			stringUIDcurrent=stringUIDcurrent[0].match(vCalendar.pre['contentline_parse'])[4];

		if(stringUIDcurrent)
			$('#vcalendarUID').val(stringUIDcurrent);

		var alarmDate='';
		for(var alarmIterator=0;alarmIterator<calEvent.alertTime.length;alarmIterator++)
		{
			if(alarmIterator>0)
				event_alert_add(alarmIterator);

			$(".alert[data-id="+(alarmIterator+1)+"]").val("message");
			if(calEvent.alertTime[alarmIterator].charAt(0)=='-' || calEvent.alertTime[alarmIterator].charAt(0)=='+')
			{
				var alVal=parseInt(calEvent.alertTime[alarmIterator].substring(1, calEvent.alertTime[alarmIterator].length-1));
				var alString='';

				if(calEvent.alertTime[alarmIterator].charAt(calEvent.alertTime[alarmIterator].length-1)=="W")
				{
					alVal=alVal/1000/60/60/24/7;
					alString='weeks';
				}
				else if(calEvent.alertTime[alarmIterator].charAt(calEvent.alertTime[alarmIterator].length-1)=="D")
				{
					alVal=alVal/1000/60/60/24;
					alString='days';
				}
				else if(calEvent.alertTime[alarmIterator].charAt(calEvent.alertTime[alarmIterator].length-1)=="H")
				{
					alVal=alVal/1000/60/60;
					alString='hours';
				}
				else if(calEvent.alertTime[alarmIterator].charAt(calEvent.alertTime[alarmIterator].length-1)=="M")
				{
					alVal=alVal/1000/60;
					alString='minutes';
				}
				else if(calEvent.alertTime[alarmIterator].charAt(calEvent.alertTime[alarmIterator].length-1)=="S")
				{
					alVal=alVal/1000;
					alString='seconds';
				}

				if(calEvent.alertTime[alarmIterator].charAt(0)=='-')
					alString+="_before";
				else
					alString+="_after"

				$(".alert_message_details[data-id="+(alarmIterator+1)+"]").val(alString);
				$(".before_after_input[data-id="+(alarmIterator+1)+"]").val(alVal);
				$('.alert_details[data-id="'+(alarmIterator+1)+'"]').show();
				$('.alert_message_date[data-id="'+(alarmIterator+1)+'"]').show();
				$('.before_after_input[data-id="'+(alarmIterator+1)+'"]').show();
				$(".message_date_input[data-id="+(alarmIterator+1)+"]").hide();
				$(".message_time_input[data-id="+(alarmIterator+1)+"]").hide();
			}
			else
			{
				alarmDate=$.fullCalendar.parseDate(calEvent.alertTime[alarmIterator]);
				(alarmDate.getHours())<10 ? (hour='0'+(alarmDate.getHours())) : (hour=alarmDate.getHours());
				(alarmDate.getMinutes())<10 ? (minute='0'+(alarmDate.getMinutes())) : (minute=alarmDate.getMinutes());

				$(".alert_message_details[data-id="+(alarmIterator+1)+"]").val('on_date');
				var formattedAlarmDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, alarmDate);

				$(".message_date_input[data-id="+(alarmIterator+1)+"]").val(formattedAlarmDate);
				$(".message_time_input[data-id="+(alarmIterator+1)+"]").val($.fullCalendar.formatDate(alarmDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));

				$('.alert_details[data-id="'+(alarmIterator+1)+'"]').show();
				$('.alert_message_date[data-id="'+(alarmIterator+1)+'"]').show();
			}
		}

		if(alarmIterator>0)
			event_alert_add(alarmIterator+2);

		if(calEvent.type!='' && repeatOne!='editOnly' && calEvent.ruleString.match(vCalendar.re['recurCaldav'])!=null)
		{
			var ruleString=calEvent.vcalendar.match(vCalendar.pre['contentline_RRULE2'])[0].match(vCalendar.pre['contentline_parse'])[4];
			if(ruleString.indexOf('BYMONTH=')!=-1 || ruleString.indexOf('BYMONTHDAY=')!=-1 || ruleString.indexOf('BYDAY=')!=-1)
			{
				var pars=ruleString.split(';');

				if(pars.indexElementOf('BYMONTH=')!=-1 && pars.indexElementOf('BYMONTHDAY=')==-1 && pars.indexElementOf('BYDAY=')==-1)
					pars[pars.length] = "BYMONTHDAY="+calEvent.start.getDate();
				if(calEvent.type=="DAILY")
				{
					$("#repeat option[value='DAILY']").prop('selected', true);
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatDays);
				}
				else if(calEvent.type=="WEEKLY")
				{
					$("#repeat option[value='CUSTOM_WEEKLY']").prop('selected', true);
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);

					for(var ri=0;ri<pars.length;ri++)
					{
						if(pars[ri].indexOf("BYDAY=")!=-1)
						{
							var byDay=pars[ri].split('=')[1];
							byDay=byDay.replace(/\d*MO/,1).replace(/\d*TU/,2).replace(/\d*WE/,3).replace(/\d*TH/,4).replace(/\d*FR/,5).replace(/\d*SA/,6).replace(/\d*SU/,0).split(',');
							for(var rj=0;rj<byDay.length;rj++)
							{
								if(!isNaN(parseInt(byDay[rj],10)))
									$('#week_custom .customTable td[data-type="'+byDay[rj]+'"]').addClass('selected');
							}
						}
					}
					$('#week_custom').show();
				}
				else if(calEvent.type=="MONTHLY")
				{
					$("#repeat option[value='CUSTOM_MONTHLY']").prop('selected', true).change();
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);


					for(var ri=0;ri<pars.length;ri++)
					{
						if(pars[ri].indexOf("BYDAY=")!=-1)
						{
							var byDay=pars[ri].split('=')[1];
							byDay=byDay.split(',');
							for(var rj=0;rj<byDay.length;rj++)
							{
								var checkString = byDay[rj].match(vCalendar.pre['+/-number']);
								byDay[rj] = byDay[rj].replace(checkString[0],'');
								if(!isNaN(parseInt(checkString[0],10)))
								{
									switch(parseInt(checkString[0],10))
									{
										case 1:
											$('#repeat_month_custom_select').val('first');
											break;
										case 2:
											$('#repeat_month_custom_select').val('second');
											break;
										case 3:
											$('#repeat_month_custom_select').val('third');
											break;
										case 4:
											$('#repeat_month_custom_select').val('fourth');
											break;
										case 5:
											$('#repeat_month_custom_select').val('fifth');
											break;
										case -1:
											$('#repeat_month_custom_select').val('last');
											break;
										default:
											$('#repeat_month_custom_select').val('every');
											break;
									}
									$('#repeat_month_custom_select2').val(byDay[rj]);
								}
							}
						}
						else if(pars[ri].indexOf("BYMONTHDAY=")!=-1)
						{
							$('#repeat_month_custom_select').val('custom').change();
							var byMonthDay=pars[ri].split('=')[1];
							byMonthDay=byMonthDay.split(',');
							for(var rj=0; rj<byMonthDay.length;rj++)
							{
								if(parseInt(byMonthDay[rj],10)==-1)
								{
									$('#repeat_month_custom_select').val('last').change();
									$('#repeat_month_custom_select2').val("DAY");

								}
								else
									$('#month_custom2 .customTable td[data-type="'+(parseInt(byMonthDay[rj],10))+'"]').addClass('selected');
							}
						}
					}
				}
				else if(calEvent.type=="YEARLY")
				{
					$("#repeat option[value='CUSTOM_YEARLY']").prop('selected', true).change();
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);
					var isMonthDay=false;
					for(var ri=0;ri<pars.length;ri++)
					{
						if(pars[ri].indexOf("BYDAY=")!=-1)
						{
							var byDay=pars[ri].split('=')[1];
							byDay=byDay.split(',');
							for(var rj=0;rj<byDay.length;rj++)
							{
								var checkString = byDay[rj].match(vCalendar.pre['+/-number']);
								byDay[rj] = byDay[rj].replace(checkString[0],'');
								if(!isNaN(parseInt(checkString[0],10)))
								{
									switch(parseInt(checkString[0],10))
									{
										case 1:
											$('#repeat_year_custom_select1').val('first');
											break;
										case 2:
											$('#repeat_year_custom_select1').val('second');
											break;
										case 3:
											$('#repeat_year_custom_select1').val('third');
											break;
										case 4:
											$('#repeat_year_custom_select1').val('fourth');
											break;
										case 5:
											$('#repeat_year_custom_select1').val('fifth');
											break;
										case -1:
											$('#repeat_year_custom_select1').val('last');
											break;
										default:
											$('#repeat_year_custom_select1').val('every');
											break;
									}
									$('#repeat_year_custom_select2').val(byDay[rj]);
								}
							}
						}
						else if(pars[ri].indexOf("BYMONTHDAY=")!=-1)
						{
							$('#repeat_year_custom_select1').val('custom').change()
							var byMonthDay=pars[ri].split('=')[1];
							byMonthDay=byMonthDay.split(',');
							for(var rj=0; rj<byMonthDay.length;rj++)
							{
								if(parseInt(byMonthDay[rj],10)==-1)
								{
									$('#repeat_year_custom_select1').val('last').change();
									$('#repeat_year_custom_select2').val("DAY");

								}
								else
									$('#year_custom1 .customTable td[data-type="'+(parseInt(byMonthDay[rj],10))+'"]').addClass('selected');
							}
							isMonthDay=true;
						}
						else if(pars[ri].indexOf("BYMONTH=")!=-1)
						{
							var byMonth=pars[ri].split('=')[1];
							byMonth=byMonth.split(',');
							for(var rj=0; rj<byMonth.length;rj++)
								$('#year_custom3 .customTable td[data-type="'+(parseInt(byMonth[rj],10)-1)+'"]').addClass('selected');
						}
					}
				}

				if(calEvent.after=='' && calEvent.untilDate=='')
					$("#repeat_end_details option[value='never']").prop('selected', true);
				else if(calEvent.after!='')
				{
					$("#repeat_end_details option[value='after']").prop('selected', true);
					$('#repeat_end_after').val(calEvent.after);
				}
				else if(calEvent.untilDate!='')
				{
					date=$.fullCalendar.parseDate(calEvent.untilDate);
					$("#repeat_end_details option[value='on_date']").prop('selected', true);
					var formattedRepeatDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
					$('#repeat_end_date').val(formattedRepeatDate);
				}

				$('#repeat_interval_detail').val(calEvent.interval);
				$('#repeat_interval').show();

				if(calEvent.byDay.length>0)
				{
					var businessArray=new Array();
					if(globalSettings.weekenddays.value.length>0)
						for(var i=0;i<7;i++)
							if(globalSettings.weekenddays.value.indexOf(i)==-1)
								businessArray[businessArray.length]=i+'';
					var businessCount=0;
					var weekendCount=0;
					for(var i=0;i<byDay.length;i++)
					{
						if(businessArray.indexOf(byDay[i])!=-1)
							businessCount++;
						if(globalSettings.weekenddays.value.indexOf(parseInt(byDay[i],10))!=-1)
							weekendCount++;

					}

					if(businessArray.length>0 && businessArray.length==businessCount)
					{
						$("#repeat option[value='BUSINESS']").prop('selected', true);
						$('#repeat_interval').hide();
						$('#week_custom').hide();
					}
					else if(globalSettings.weekenddays.value.length>0 && globalSettings.weekenddays.value.length==weekendCount)
					{
						$("#repeat option[value='WEEKEND']").prop('selected', true);
						$('#repeat_interval').hide();
						$('#week_custom').hide();
					}
				}

			}
			else
			{
				if(calEvent.type=="DAILY")
				{
					$("#repeat option[value='DAILY']").prop('selected', true);
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatDays);
				}
				else if(calEvent.type=="WEEKLY")
				{
					$("#repeat option[value='WEEKLY']").prop('selected', true);
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);
				}
				else if(calEvent.type=="MONTHLY")
				{
					$("#repeat option[value='MONTHLY']").prop('selected', true);
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);
				}
				else if(calEvent.type=="YEARLY")
				{
					$("#repeat option[value='YEARLY']").prop('selected', true);
					$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);
				}

				if(calEvent.after=='' && calEvent.untilDate=='')
					$("#repeat_end_details option[value='never']").prop('selected', true);
				else if(calEvent.after!='')
				{
					$("#repeat_end_details option[value='after']").prop('selected', true);
					$('#repeat_end_after').val(calEvent.after);
				}
				else if(calEvent.untilDate!='')
				{
					date=$.fullCalendar.parseDate(calEvent.untilDate);
					$("#repeat_end_details option[value='on_date']").prop('selected', true);
					var formattedRepeatDate=$.datepicker.formatDate(globalSettings.datepickerformat.value, date);
					$('#repeat_end_date').val(formattedRepeatDate);
				}

				$('#repeat_interval_detail').val(calEvent.interval);
				$('#repeat_interval').show();

				if(calEvent.byDay.length>0)
				{
					if(calEvent.byDay.indexOf('1')!=-1 && calEvent.byDay.indexOf('2')!=-1 && calEvent.byDay.indexOf('3')!=-1 && calEvent.byDay.indexOf('4')!=-1 && calEvent.byDay.indexOf('5')!=-1 && calEvent.byDay.indexOf('6')==-1 && calEvent.byDay.indexOf('0')==-1)
					{
						$("#repeat option[value='BUSINESS']").prop('selected', true);
						$('#repeat_interval').hide();
					}
					else if(calEvent.byDay.indexOf('1')==-1 && calEvent.byDay.indexOf('2')==-1 && calEvent.byDay.indexOf('3')==-1 && calEvent.byDay.indexOf('4')==-1 && calEvent.byDay.indexOf('5')==-1 && calEvent.byDay.indexOf('6')!=-1 && calEvent.byDay.indexOf('0')!=-1)
					{
						$("#repeat option[value='WEEKEND']").prop('selected', true);
						$('#repeat_interval').hide();
					}
				}
			$('#repeatEvent').val(true);
			}
		}
		else if(calEvent.type!='' && repeatOne!='editOnly')
		{
			var cu_opt = new Option(localization[globalInterfaceLanguage].customRepeat, calEvent.ruleString, false, true);
			$(cu_opt).attr('data-type','custom_repeat');
			$('#repeat').append(cu_opt);
		}
		else
			$('#repeatEvent').val(false);

		if(calEvent.timeZone)
			showTimezones(calEvent.timeZone,'');
		else
			showTimezones('local','');
	}

	var year,
	month,
	day,
	hour,
	minute;
	if(mod=='show')
		$('#show').val(calEvent.id);
	if(mod=='show' || mod=='drop')
	{
		$('#repeatCount').val(calEvent.repeatCount);
		if(calEvent.realStart && (mod!='drop' || repeatOne!='editOnly'))
			date=calEvent.realStart;
		else
			date=calEvent.start;

		if($('#show').val())
		{
			if(calEvent.repeatStart && repeatOne=='')
				date=new Date(calEvent.repeatStart.getTime());
			if(calEvent.repeatEnd && repeatOne=='')
				date_to=new Date(calEvent.repeatEnd.getTime());

		}
		if(repeatOne=='editOnly')
		{
			if((mod=='drop' && globalPrevDragEventAllDay) || (mod!='drop' && calEvent.allDay))
			{
				if(calEvent.realStart)
					$('#recurrenceID').val($.fullCalendar.formatDate($.fullCalendar.parseDate(calEvent.realStart), "yyyyMMdd"));
				else
					$('#recurrenceID').val($.fullCalendar.formatDate(date, "yyyyMMdd"));
			}
			else
			{
				if(calEvent.realStart)
					$('#recurrenceID').val($.fullCalendar.formatDate(calEvent.realStart, "yyyyMMdd'T'HHmmss"));
				else
					$('#recurrenceID').val($.fullCalendar.formatDate(date, "yyyyMMdd'T'HHmmss"));
			}
		}
		else
			$('#recurrenceID').val(calEvent.rec_id);

		if(calEvent.rec_id || repeatOne=='editOnly' || repeatOne=='futureOnly')
		{
			var savedEvs=jQuery.grep(globalEventList.displayEventsArray[calEvent.res_id],function(e){if(e.id==calEvent.id && (e.repeatCount<2 || !e.repeatCount))return true});
			if(savedEvs.length>1 || (repeatOne=='futureOnly' && calEvent.repeatCount>1) || (repeatOne=='editOnly' && calEvent.type!=''))
				$('#deleteButton').attr('onclick',"updateEventFormDimensions(true);$('#CAEvent .saveLoader').show();save(false, true);");
		}
	}


	var today = new Date();
	var todayClear = new Date(today.getTime());
	todayClear.setHours(0);
	todayClear.setMinutes(0);
	todayClear.setSeconds(0);
	todayClear.setMilliseconds(0);
	var dateClear = new Date(date.getTime());
	dateClear.setHours(0);
	dateClear.setMinutes(0);
	dateClear.setSeconds(0);
	dateClear.setMilliseconds(0);

	if(allDay)
	{
		if(globalSettings.defaulteventduration.value!==null && todayClear.getTime()===dateClear.getTime())
		{
			if(today.getMinutes()>0) {
				date.setHours(today.getHours()+1);
				date.setMinutes(0);
			}
			else {
				date.setHours(today.getHours());
				date.setMinutes(today.setMinutes());
			}
		}
		else {
			date.setHours(globalSettings.calendarstartofbusiness.value);
			date.setMinutes((globalSettings.calendarstartofbusiness.value%1)*60);
		}
	}

	$('#date_from').val($.datepicker.formatDate(globalSettings.datepickerformat.value, date));
	$('#time_from').val($.fullCalendar.formatDate(date, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
	globalPrevDate=new Date(date.getTime());

	if(typeof date_to==='undefined' || date_to===null)
		date_to = new Date(date.getTime());

	if(allDay) {
		if(globalSettings.defaulteventduration.value!==null)
		{
			date_to.setHours(date.getHours());
			date_to.setMinutes(date.getMinutes()+globalSettings.defaulteventduration.value);
		}
		else {
			date_to.setHours(globalSettings.calendarendofbusiness.value);
			date_to.setMinutes((globalSettings.calendarendofbusiness.value%1)*60);
		}
	}

	if(date_to.getTime()<date.getTime())
		date_to.setDate(date_to.getDate()+1);

	$('#date_to').val($.datepicker.formatDate(globalSettings.datepickerformat.value, date_to));
	$('#time_to').val($.fullCalendar.formatDate(date_to, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));

	if($('#repeat option:selected').attr('data-type')!="repeat_no-repeat" && $('#repeat option:selected').attr('data-type')!="custom_repeat")
		$('#repeat_details').show();

	if($('#repeat_end_details option:selected').attr('data-type')=="repeat_details_on_date")
	{
		$('#repeat_end_after').hide();
		$('#repeat_end_date').show();
	}

	if($('#repeat_end_details option:selected').attr('data-type')=="repeat_details_after")
	{
		$('#repeat_end_after').show();
		$('#repeat_end_date').hide();
	}

	if($('#repeat_end_details option:selected').attr('data-type')=="repeat_details_never")
	{
		$('#repeat_end_after').hide();
		$('#repeat_end_date').hide();
	}

	if(mod=='show')
	{
		$('#saveButton').hide();
		$('#resetButton').hide();
		$('#deleteButton').hide();
		if($('#ResourceCalDAVList').find('[data-id="'+calEvent.res_id+'"]').hasClass("resourceCalDAV_item_ro"))
		{
			$('#editButton').hide();
			$('#duplicateButton').hide();
			$('#editOptionsButton').hide();
		}
		$('#eventDetailsTable :input[type!="button"]').prop('disabled', true);
		$('#eventDetailsTable :input[type="text"]').prop('readonly', true);
		$('#eventDetailsTable .customTable td').addClass('disabled');
		$('#eventDetailsTable textarea').prop('readonly', true);

		/*************************** BAD HACKS SECTION ***************************/
		// here we fix the cross OS/cross broser problems (unfixable in pure CSS)
		if($.browser.webkit && !!window.chrome)	/* Chrome */
		{
			if(navigator.platform.toLowerCase().indexOf('win')==0)	/* Windows version */
			{
				$('#event_details_template').find('input').css('text-indent', '2px');
				$('#event_details_template').find('select').css({'padding-left': '0px', 'padding-right': '13px'});
			}
			else	/* non-Windows version */
				$('#event_details_template').find('input').css('text-indent', '1px');
		}
		else if($.browser.safari)
		{
			$('#event_details_template').find('textarea').addClass('safari_hack');
			$('#event_details_template').find('input').addClass('safari_hack');
		}
		else if($.browser.msie)	/* IE */
		{
			if(parseInt($.browser.version, 10)==10)	/* IE 10 (because there are no more conditional comments) */
			{
				$('#event_details_template').find('select').css({'padding-top': '1px', 'padding-left': '0px', 'padding-right': '0px'});
				$('#event_details_template').find('textarea').css('padding-top', '3px');
				$('#event_details_template').find('input[type=button]').css('padding-top', '2px');
			}
		}

		if($.browser.msie || $.browser.mozilla)
		{
			var newSVG=$(SVG_select_dis).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-22px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
			$('#event_details_template').find('svg[data-type="select_icon"]').replaceWith($('<div>').append($(newSVG).clone()).html());
		}
		/*************************** END OF BAD HACKS SECTION ***************************/
		if(calEvent.etag!='')
			$('#event_calendar').val(calEvent.res_id);
	}

	if(repeatOne=='editOnly' || $('#recurrenceID').val()!='')
	{
		$('#repeat').parent().parent().css('display', 'none');
		$('#week_custom').css('display', 'none');
		$('#month_custom1').css('display', 'none');
		$('#month_custom2').css('display', 'none');
		$('#year_custom1').css('display', 'none');
		$('#year_custom2').css('display', 'none');
		$('#year_custom3').css('display', 'none');
		$('#repeat_details').css('display', 'none');
	}

	if(repeatOne=='editOnly' || repeatOne=='futureOnly' || $('#recurrenceID').val())
		$('#calendarLine').hide();
	if(calEvent==null || calEvent.type=='')
		$('#editOptionsButton').hide();
	else
		$('#editOptionsButton').click(function(){
		showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', '', true);
	});
	if(calEvent && calEvent.after && repeatOne=='futureOnly')
			$('#repeat_end_after').val(calEvent.after - calEvent.realRepeatCount + 1);

	if(!globalSettings.timezonesupport.value)
		$('.timezone_row').css('display', 'none');

	if($('#allday').prop('checked'))
		stripEventAlerts();

	if(mod!='drop')
	{
		$('#CAEvent').show();
		$('#event_details_template').show();
		$('#eventColor').css('background-color',color);
		updateEventFormDimensions();
		setFormPosition(jsEvent);
	}

	checkEventFormScrollBar();
	$('#event_details_template').scrollTop(0);
}

function bindEventForm()
{
	initCalDavDatepicker($('#event_details_template'));
	initCalDavTimepicker($('#event_details_template'));

	$('#event_details_template .alert_message_details').change(function(){
		var data_id=$(this).attr("data-id");
		$('.before_after_input[data-id="'+data_id+'"]').parent().parent().find('img').css('display','none');
		if($('.alert_message_details[data-id="'+data_id+'"] option:selected').attr('data-type')=="on_date")
		{
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('#date_from').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_from").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_from").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('#date_to').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_to").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_to").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			$('.message_date_input[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_date_input[data-id="'+data_id+'"]').show();
			$('.message_time_input[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('.message_time_input[data-id="'+data_id+'"]').show();
			$('.before_after_input[data-id="'+data_id+'"]').hide();
		}
		else
		{
			$('.message_date_input[data-id="'+data_id+'"]').hide();
			$('.message_time_input[data-id="'+data_id+'"]').hide();
			$('.before_after_input[data-id="'+data_id+'"]').show();
			$('.before_after_input[data-id="'+data_id+'"]').val('15');
		}
	});

	$('#event_details_template .before_after_input').bind('keyup change', function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
			//$(this).parent().find('img').css('visibility','visible');
		}
		else
		{
			if($(this).val().match("^(\d*[0-9])*$")==null)
			{
				$(this).parent().find('img').css('display', 'inline');
				//$(this).parent().find('img').css('visibility','visible');
			}
			else
				$(this).parent().find('img').css('display', 'none');
		}
	});

	$('#event_details_template .alert').change(function(){
		var data_id=$(this).attr("data-id");
		if($(this).val()!='none')
		{
			$('.alert_details[data-id="'+data_id+'"]').show();
			$('.alert_message_date[data-id="'+data_id+'"]').show();
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('#date_from').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_from").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_from").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('#date_to').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_to").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_to").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			$('.message_date_input[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_time_input[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			event_alert_add(data_id);
		}
		else
		{
			$('.alert_details[data-id="'+data_id+'"]').hide();
			$('.alert_message_date[data-id="'+data_id+'"]').hide();
			checkFor(data_id);
			var data_id=$(this).attr("data-id");
			$('#event_details_template tr[data-id="'+data_id+'"]').remove();
		}
		checkEventFormScrollBar();
	});

	$('#repeat_end_after, #repeat_interval_detail').bind('keyup change',function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
			//$(this).parent().find('img').css('visibility','visible');
		}
		else
		{
			if($(this).val().match("^[0-9]+$")==null || parseInt($(this).val(),10)<1)
			{
				$(this).parent().find('img').css('display', 'inline');
				//$(this).parent().find('img').css('visibility','visible');
			}
			else
				$(this).parent().find('img').css('display', 'none');
		}
	});

	$('#repeat_month_custom_select').change(function(){
		if($(this).val()=="custom")
		{
			$('#month_custom2').show();
			$('#repeat_month_custom_select2').parent().hide();
		}
		else
		{
			$('#month_custom2').hide();
			$('#repeat_month_custom_select2').parent().show();
		}
		checkEventFormScrollBar();
	});

	$('#repeat_year_custom_select1').change(function(){
		if($(this).val()=="custom")
		{
			$('#year_custom1').show();
			$('#repeat_year_custom_select2').parent().hide();
		}
		else
		{
			$('#year_custom1').hide();
			$('#repeat_year_custom_select2').parent().show();
		}
		checkEventFormScrollBar();
	});

	$('#repeat_end_details').change(function(){
		$('#repeat_end_date').parent().find('img').css('display', 'none');

		if($('#repeat_end_details option:selected').attr('data-type')=="repeat_details_on_date")
		{
			$('#repeat_end_after').hide();
			$('#repeat_end_date').show();

			var today;
			if($('#date_from').val()!='')
			{
				today=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_from').val());
				if(today==null)
					today=new Date();
			}
			else
				today=new Date();

			var date=new Date(today.getFullYear(), today.getMonth(), today.getDate()+2);
			$('#repeat_end_date').val($.datepicker.formatDate(globalSettings.datepickerformat.value, date));
		}

		if($('#repeat_end_details option:selected').attr('data-type')=="repeat_details_after")
		{
			$('#repeat_end_after').show();
			$('#repeat_end_after').val('2');
			$('#repeat_end_date').hide();
		}

		if($('#repeat_end_details option:selected').attr('data-type')=="repeat_details_never")
		{
			$('#repeat_end_after').hide();
			$('#repeat_end_date').hide();
		}

		checkEventFormScrollBar();
	});

	$('#closeButton').click(function(){
		if($('#uid').val()!='')
		{
			var uid=$('#uid').val();
			var calUID=uid.substring(0, uid.lastIndexOf('/')+1);
			var events=$('.event_item[data-id="'+uid+'"]');
			var color=$('#ResourceCalDAVList').find("[data-id='"+calUID+"']").find('.resourceCalDAVColor').css('background-color');

			$.each(events, function(index, event){
				if(event.nodeName.toLowerCase()!='tr')
				{
					$(event).find('.fc-event-inner, .fc-event-head').addBack().css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
					$(event).find('.fc-event-title, .fc-event-title-strict, .fc-event-time').css('color',checkFontColor(rgbToHex(color)));
				}
				else
				{
					$(event).children('.fc-event-handle').css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
				}
			});
		}
		else
		{
			var beforeScroll = $('#main').width()-$('#calendar').width();
			$('#calendar').fullCalendar('unselect');
			$('#calendar').fullCalendar('removeEvents', 'fooUID');
			var afterScroll = $('#main').width()-$('#calendar').width();
			rerenderCalendar(beforeScroll!=afterScroll);
		}

		$('#show').val('');
		$('#CAEvent').hide();
		$('#EventDisabler').fadeOut(globalEditorFadeAnimation, function(){
			$('#timezonePicker').prop('disabled', false);
		});
	});

	$('#resetButton').click(function(){
		$('#event_details_template').find('img[data-type=invalidSmall]').css('display','none');
		var uid=$('#uid').val();

		if(uid!='')
		{
			var calUID=uid.substring(0, uid.lastIndexOf('/')+1);
			var events=$('.event_item[data-id="'+uid+'"]');
			var color=$('#ResourceCalDAVList').find("[data-id='"+calUID+"']").find('.resourceCalDAVColor').css('background-color');

			$.each(events, function(index, event){
				if(event.nodeName.toLowerCase()!='tr')
				{
					$(event).find('.fc-event-inner, .fc-event-head').addBack().css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
					$(event).find('.fc-event-title, .fc-event-title-strict, .fc-event-time').css('color',checkFontColor(rgbToHex(color)));
				}
				else
				{
					$(event).children('.fc-event-handle').css({'background-color': rgbToRgba(color,0.9), 'border-color': color})
				}
			});
			if($('#recurrenceID').val()!='' && $('#repeatCount').val()!='')
				showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', 'editOnly');
			else if($('#futureStart').val()!='')
				showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', 'futureOnly');
			else
				showEventForm(null, globalCalEvent.allDay, globalCalEvent, globalJsEvent, 'show', '');
			startEditModeEvent();
		}
	});

	$('#allday').click(function(){
		if($('#allday').prop('checked'))
		{
			$('#timezone').val('local');
			$('#time_from_cell').css('visibility','hidden');
			$('#time_to_cell').css('visibility','hidden');
			$('#time_to_cell').find('img').css('display','none');
			$('#time_from_cell').find('img').css('display','none');
			$('.timezone_row').css('display', 'none');
			stripEventAlerts();
		}
		else
		{
			$('#time_from_cell').css('visibility','visible');
			$('#time_to_cell').css('visibility','visible');
			$('#time_from').trigger('change');
			$('#time_to').trigger('change');
			if(globalSettings.timezonesupport.value)
			{
				$('.timezone_row').show();
				$('#timezone').val(globalSessionTimeZone);
			}
			expandEventAlerts();
		}
		checkEventFormScrollBar();
	});

	$('#event_details_template .customTable td').click(function(){
		if($(this).hasClass('disabled'))
			return true;
		else if($(this).hasClass('selected'))
			$(this).removeClass('selected');
		else
			$(this).addClass('selected');
	});

	$('#event_calendar').change(function(){
		var color = '';
		if($(this).val()=='choose')
			color = 'rgb(240,240,240)';
		else
			color=$('#ResourceCalDAVList').find("[data-id='"+$(this).val()+"']").find('.resourceCalDAVColor').css('background-color');

		var uid='fooUID';
		if($('#uid').val()!='')
			uid=$('#uid').val();
		var events=$('.event_item[data-id="'+uid+'"]');

		$('#eventColor').css('background-color',color);
		$.each(events, function(index, event){
			if(event.nodeName.toLowerCase()!='tr')
			{
				$(event).find('.fc-event-inner, .fc-event-head').addBack().css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
				$(event).find('.fc-event-title, .fc-event-title-strict, .fc-event-time').css('color', checkFontColor(rgbToHex(color)));
			}
			else
			{
				$(event).find('.fc-event-handle').css({'background-color': rgbToRgba(color,0.9), 'border-color': color});
			}
		});
	});

	$('#repeat').change(function(){
		if($('#repeat option:selected').attr('data-type')=='repeat_no-repeat' || $('#repeat option:selected').attr('data-type')=="custom_repeat")
		{
			$('#repeat_details').hide();
			$('#repeat_interval').hide();
			$('#week_custom').hide();
			$('#month_custom1').hide();
			$('#month_custom2').hide();
			$('#year_custom1').hide();
			$('#year_custom2').hide();
			$('#year_custom3').hide();
		}
		else
		{
			$('#repeat_details').show();

			if($(this).val()!='BUSINESS' && $(this).val()!='TWO_WEEKLY' && $(this).val()!='WEEKEND')
			{
				$('#repeat_interval').show();
				$("#repeat_interval_detail").val('1');
				$('#repeat_interval').find('img').css('display','none');
			}
			else
				$('#repeat_interval').hide();

			if($(this).val()=='DAILY')
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatDays);

			if($(this).val()=='WEEKLY')
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);

			if($(this).val()=='MONTHLY')
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);

			if($(this).val()=='YEARLY')
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);

			if($(this).val()=='CUSTOM_WEEKLY')
			{
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatWeeks);
				$('#week_custom').show();
			}
			else
				$('#week_custom').hide();

			if($(this).val()=='CUSTOM_MONTHLY')
			{
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatMonths);
				$('#month_custom1').show();
				if($('#repeat_month_custom_select').val() == "custom")
					$('#repeat_month_custom_select').trigger('change');
			}
			else
			{
				$('#month_custom1').hide();
				$('#month_custom2').hide();
			}

			if($(this).val()=='CUSTOM_YEARLY')
			{
				$('#repeat_interval [data-type="txt_interval"]').text(localization[globalInterfaceLanguage].repeatYears);
				$('#year_custom2').show();
				$('#year_custom3').show();
				if($('#repeat_year_custom_select1').val() == "custom")
					$('#repeat_year_custom_select1').trigger('change');
			}
			else
			{
				$('#year_custom1').hide();
				$('#year_custom2').hide();
				$('#year_custom3').hide();
			}

			var today;
			if($('#date_from').val()!='')
			{
				today=$.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_from').val());
				if(today==null)
					today=new Date();
			}
			else
				today=new Date();

			var date=new Date(today.getFullYear(),today.getMonth(),today.getDate()+2);
			$('#repeat_end_date').val($.datepicker.formatDate(globalSettings.datepickerformat.value, date));
		}
		checkEventFormScrollBar();
	});

	$('#status').change(function(){
		var status = $(this).val();

		if(status=='CANCELLED')
			$('#name').addClass('title_cancelled');
		else
			$('#name').removeClass('title_cancelled');

		todoStatusChanged(status);
	});
}

function startEditModeEvent()
{
	$('#timezonePicker').prop('disabled', true);
	$('#EventDisabler').fadeIn(globalEditorFadeAnimation);
	$('#CAEvent .formNav').css('display', 'none');
	$('#CAEvent textarea.header').removeClass('leftspace rightspace');
	$('#editButton').hide();
	$('#duplicateButton').hide();
	$('#editOptionsButton').hide();
	$('#saveButton').show();
	$('#resetButton').show();
	$('#deleteButton').show();
	$('#show').val('');
	$('#eventDetailsTable :input[disabled]').prop('disabled', false);
	$('#eventDetailsTable :input[type="text"]').prop('readonly', false);
	$('#eventDetailsTable .customTable td').removeClass('disabled');
	$('#eventDetailsTable textarea').prop('readonly', false);
	/*************************** BAD HACKS SECTION ***************************/
	if($.browser.msie || $.browser.mozilla)
	{
		var newSVG=$(SVG_select).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#event_details_template').find('svg[data-type="select_icon"]').replaceWith($('<div>').append($(newSVG).clone()).html());
	}
	/*************************** END OF BAD HACKS SECTION ***************************/

	$('#name').focus();
}

function startEditModeTodo()
{
	$('#todoInEdit').val('true');
	$('#timezonePickerTODO').prop('disabled', true);
	$('#TodoDisabler').fadeIn(globalEditorFadeAnimation);
	$('#CATodo .formNav').css('display', 'none');
	$('#CATodo textarea.header').removeClass('leftspace rightspace');
	$('#editTODO').hide();
	$('#duplicateTODO').hide();
	$('#editOptionsButtonTODO').hide();
	$('#closeTODO').show();
	$('#saveTODO').show();
	$('#resetTODO').show();
	$('#deleteTODO').show();
	$('#showTODO').val('');

	$('#todoDetailsTable :input[disabled]').prop('disabled', false);
	$('#todoDetailsTable :input[type="text"]').prop('readonly', false);
	$('#todoDetailsTable textarea').prop('readonly', false);
	/*************************** BAD HACKS SECTION ***************************/
	if($.browser.msie || $.browser.mozilla)
	{
		var newSVG=$(SVG_select).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#todo_details_template').find('svg[data-type="select_icon"]').replaceWith($('<div>').append($(newSVG).clone()).html());
	}
	/*************************** END OF BAD HACKS SECTION ***************************/

	$('#percentageSlider').slider({
		disabled: false
	});
	$('#nameTODO').focus();
}

function todo_alert_add(data_id)
{
	data_id++;
	var newTr1,
	newTr2,
	newTr3;

	newTr1='<tr data-id="'+data_id+'">'+
		'<td><label data-type="alert_TODO" for="alertTODO">alert: </label></td>'+
		'<td data-size="full" colspan="2">'+
		'<select class="long alertTODO" name="alert_typeTODO" data-id="'+data_id+'">'+
		'<option data-type="alert_none_TODO" value="none">none</option>'+
		'<option data-type="alert_message_TODO" value="message">message</option>'+
		'</select>'+
		'</td>'+
		'</tr>';
	newTr2='<tr class="alert_detailsTODO" style="display:none;" data-id="'+data_id+'">'+
		'<td></td>'+
		'<td data-size="full" colspan="2">'+
		'<select class="long alert_message_detailsTODO" name="alert_detailsTODO" data-id="'+data_id+'">'+
		'<option data-type="on_dateTODO" class="todoTimeOptions" value="on_date">On date</option>'+
		($('#todo_type').val()=='none' ? '' : '<option data-type="weeks_beforeTODO" value="weeks_before">weeks before</option>'+
		'<option data-type="days_beforeTODO" value="days_before">days before</option>'+
		'<option data-type="hours_beforeTODO" value="hours_before">hours before</option>'+
		'<option data-type="minutes_beforeTODO" value="minutes_before">minutes before</option>'+
		'<option data-type="seconds_beforeTODO" value="seconds_before">seconds before</option>'+
		'<option data-type="weeks_afterTODO" value="weeks_after">weeks after</option>'+
		'<option data-type="days_afterTODO" value="days_after">days after</option>'+
		'<option data-type="hours_afterTODO" value="hours_after">hours after</option>'+
		'<option data-type="minutes_afterTODO" value="minutes_after">minutes after</option>'+
		'<option data-type="seconds_afterTODO" value="seconds_after">seconds after</option>')+
		'</select>'+
		'</td>'+
		'</tr>';
	newTr3='<tr data-id="'+data_id+'" class="alert_message_dateTODO" style="display:none;">'+
		'<td></td>'+
		'<td><input data-id="'+data_id+'" data-type="PH_before_after_alert_TODO" class="small before_after_inputTODO" type="text" style="display:none;" />'+
		'<input data-id="'+data_id+'" class="date small message_date_inputTODO" data-type="PH_alarm_date_TODO" type="text" name="message_dateTODO" /><div class="invalidWrapper"><img data-type="invalidSmall" data-id="'+data_id+'" style="display: none;" src="images/error_b.svg" alt="invalid" /></div></td>'+
		'<td><input data-id="'+data_id+'" data-type="PH_alarm_time_TODO" class="time small message_time_inputTODO" type="text" name="message_timeTODO" /><div class="invalidWrapper"><img data-type="invalidSmall" data-id="'+data_id+'" style="display: none;" src="images/error_b.svg" alt="invalid" /></div></td>'+
		'<tr>';

	$('#url_trTODO').before(newTr1);
	$('#url_trTODO').before(newTr2);
	$('#url_trTODO').before(newTr3);
	translateTodoAlerts();
	$('#todo_details_template').find('input[placeholder],textarea[placeholder]').placeholder();

	$('#todo_details_template .alert_message_detailsTODO[data-id="'+data_id+'"]').change(function(){
		var data_id=$(this).attr("data-id");
		$('.before_after_inputTODO[data-id="'+data_id+'"]').parent().parent().find('img').css('display','none');
		if($('.alert_message_detailsTODO[data-id="'+data_id+'"] option:selected').attr('data-type')=="on_dateTODO")
		{
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('.dateTrToTODO').is(':visible') && $('.dateTrToTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_toTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_toTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('.dateTrFromTODO').is(':visible') && $('.dateTrFromTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_fromTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_fromTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}

			$('.message_date_inputTODO[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_date_inputTODO[data-id="'+data_id+'"]').show();
			$('.message_time_inputTODO[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('.message_time_inputTODO[data-id="'+data_id+'"]').show();
			$('.before_after_inputTODO[data-id="'+data_id+'"]').hide();
		}
		else
		{
			$('.message_date_inputTODO[data-id="'+data_id+'"]').hide();
			$('.message_time_inputTODO[data-id="'+data_id+'"]').hide();
			$('.before_after_inputTODO[data-id="'+data_id+'"]').show();
			$('.before_after_inputTODO[data-id="'+data_id+'"]').val('15');
		}
	});
	$('#todo_details_template .before_after_inputTODO[data-id="'+data_id+'"]').bind('keyup change', function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
			//$(this).parent().find('img').css('visibility','visible');
		}
		else
		{
			if($(this).val().match("^[0-9]+$")==null)
			{
				$(this).parent().find('img').css('display', 'inline');
				//$(this).parent().find('img').css('visibility','visible');
			}
			else
				$(this).parent().find('img').css('display', 'none');
		}
	});
	$('#todo_details_template .alertTODO[data-id="'+data_id+'"]').change(function(){
		var data_id=$(this).attr("data-id");
		if($(this).val()!='none')
		{
			$('.alert_detailsTODO[data-id="'+data_id+'"]').show();
			$('.alert_message_dateTODO[data-id="'+data_id+'"]').show();
			if($('#todo_type').val()!='none')
				expandTodoAlerts();
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('.dateTrToTODO').is(':visible') && $('.dateTrToTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_toTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_toTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('.dateTrFromTODO').is(':visible') && $('.dateTrFromTODO img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_fromTODO").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to +$("#time_fromTODO").val()));
				myDate.setHours(myDate.getHours()-1);
			}

			$('.message_date_inputTODO[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_time_inputTODO[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			todo_alert_add(data_id);
		}
		else
		{
			$('.alert_detailsTODO[data-id="'+data_id+'"]').hide();
			$('.alert_message_dateTODO[data-id="'+data_id+'"]').hide();
			checkForTodo(data_id);
			var data_id=$(this).attr("data-id");
			$('#todo_details_template tr[data-id="'+data_id+'"]').remove();
		}
		checkTodoFormScrollBar();
	});
	initCalDavDatepicker($('#todo_details_template .alert_message_dateTODO[data-id="'+data_id+'"]'));
	initCalDavTimepicker($('#todo_details_template .alert_message_dateTODO[data-id="'+data_id+'"]'));
	/*************************** BAD HACKS SECTION ***************************/
	// here we fix the cross OS/cross broser problems (unfixable in pure CSS)
	if($.browser.webkit && !!window.chrome)	/* Chrome */
	{
		if(navigator.platform.toLowerCase().indexOf('win')==0)	/* Windows version */
		{
			$('#todo_details_template').find('input').css('text-indent', '2px');
			$('#todo_details_template').find('select').css({'padding-left': '0px', 'padding-right': '13px'});
		}
		else	/* non-Windows version */
			$('#todo_details_template').find('input').css('text-indent', '1px');
	}
	else if($.browser.safari)
	{
		$('#todo_details_template').find('textarea').addClass('safari_hack');
		$('#todo_details_template').find('input').addClass('safari_hack');
	}
	else if($.browser.msie)	/* IE */
	{
		if(parseInt($.browser.version, 10)==10)	/* IE 10 (because there are no more conditional comments) */
		{
			$('#todo_details_template').find('select').css({'padding-top': '1px', 'padding-left': '0px', 'padding-right': '0px'});
			$('#todo_details_template').find('textarea').css('padding-top', '3px');
			$('#todo_details_template').find('input[type=button]').css('padding-top', '2px');
		}
	}

	/* IE or FF */
	if($.browser.msie || $.browser.mozilla)
	{
		// ADD empty SVG to interface (we will replace it later)
		$('<svg data-type="select_icon"></svg>').css('display', 'none').insertAfter($('#todo_details_template tr[data-id="'+data_id+'"]').find('select'));
	}

	if($.browser.msie || $.browser.mozilla)
	{
		var newSVG=$(SVG_select).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#todo_details_template tr[data-id="'+data_id+'"]').find('svg[data-type="select_icon"]').replaceWith($('<div>').append($(newSVG).clone()).html());
	}
	/*************************** END OF BAD HACKS SECTION ***************************/
}

function event_alert_add(data_id)
{
	data_id++;

	var newTr1,
	newTr2,
	newTr3;

	newTr1='<tr data-id="'+data_id+'">'+
		'<td><label data-type="alert" for="alert">alert: </label></td>'+
		'<td data-size="full" colspan="2">'+
		'<select class="long alert" name="alert_type" data-id="'+data_id+'">'+
		'<option data-type="alert_none" value="none">none</option>'+
		'<option data-type="alert_message" value="message">message</option>'+
		'</select>'+
		'</td>'+
		'</tr>';
	newTr2='<tr data-id="'+data_id+'" class="alert_details" style="display:none;">'+
		'<td></td>'+
		'<td data-size="full" colspan="2">'+
		'<select class="long alert_message_details" name="alert_details" data-id="'+data_id+'">'+
		'<option data-type="on_date" value="on_date">On date</option>'+
		($('#allday').prop('checked') ? '' : '<option data-type="weeks_before" value="weeks_before">weeks before</option>'+
		'<option data-type="days_before" value="days_before">days before</option>'+
		'<option data-type="hours_before" value="hours_before">hours before</option>'+
		'<option data-type="minutes_before" value="minutes_before">minutes before</option>'+
		'<option data-type="seconds_before" value="seconds_before">seconds before</option>'+
		'<option data-type="weeks_after" value="weeks_after">weeks after</option>'+
		'<option data-type="days_after" value="days_after">days after</option>'+
		'<option data-type="hours_after" value="hours_after">hours after</option>'+
		'<option data-type="minutes_after" value="minutes_after">minutes after</option>'+
		'<option data-type="seconds_after" value="seconds_after">seconds after</option>')
		+
		'</select>'+
		'</td>'+
		'</tr>';
	newTr3='<tr data-id="'+data_id+'" class="alert_message_date" style="display:none;">'+
		'<td></td>'+
		'<td><input class="small before_after_input" data-type="PH_before_after_alert" type="text" data-id="'+data_id+'" style="display:none;" />'+
		'<input class="date small message_date_input" data-type="PH_alarm_date" type="text" data-id="'+data_id+'" /><div class="invalidWrapper"><img data-type="invalidSmall" data-id="'+data_id+'" style="display: none;" src="images/error_b.svg" alt="invalid" /></div></td>'+
		'<td><input class="time small message_time_input" data-type="PH_alarm_time" type="text" data-id="'+data_id+'" /><div class="invalidWrapper"><img data-type="invalidSmall" data-id="'+data_id+'" style="display: none;" src="images/error_b.svg" alt="invalid" /></div></td>'+
		'<tr>';

	$('#url_tr').before(newTr1);
	$('#url_tr').before(newTr2);
	$('#url_tr').before(newTr3);

	translateEventAlerts();
	$('#event_details_template').find('input[placeholder],textarea[placeholder]').placeholder();

	$('#event_details_template .before_after_input[data-id="'+data_id+'"]').bind('keyup change', function(){
		if($(this).val()=='')
		{
			$(this).parent().find('img').css('display', 'inline');
			//$(this).parent().find('img').css('visibility','visible');
		}
		else
		{
			if($(this).val().match("^(\d*[0-9])*$")==null)
			{
				$(this).parent().find('img').css('display', 'inline');
				//$(this).parent().find('img').css('visibility','visible');
			}
			else
				$(this).parent().find('img').css('display', 'none');
		}
	});
	$('#event_details_template .alert[data-id="'+data_id+'"]').change(function(){
		var data_id=$(this).attr("data-id");
		if($(this).val()!='none')
		{
			$('.alert_details[data-id="'+data_id+'"]').show();
			$('.alert_message_date[data-id="'+data_id+'"]').show();
			if(!$('#allday').prop('checked'))
				expandEventAlerts();
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('#date_from').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_from").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_from").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('#date_to').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_to").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_to").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			$('.message_date_input[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_time_input[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			event_alert_add(data_id);
		}
		else
		{
			$('.alert_details[data-id="'+data_id+'"]').hide();
			$('.alert_message_date[data-id="'+data_id+'"]').hide();
			checkFor(data_id);
			var data_id=$(this).attr("data-id");
			$('#event_details_template tr[data-id="'+data_id+'"]').remove();
		}
		checkEventFormScrollBar();
	});
	$('#event_details_template .alert_message_details[data-id="'+data_id+'"]').change(function(){
		var data_id=$(this).attr("data-id");
		$('.before_after_input[data-id="'+data_id+'"]').parent().parent().find('img').css('display','none');
		if($('.alert_message_details[data-id="'+data_id+'"] option:selected').attr('data-type')=="on_date")
		{
			var myDate=new Date();
			myDate.setDate(myDate.getDate()+7);

			if($('#date_from').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_from").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_from").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			else if($('#date_to').parent().parent().find('img:visible').length==0) {
				var dateTo=$.datepicker.parseDate(globalSettings.datepickerformat.value,$("#date_to").val());
				var datetime_to=$.fullCalendar.formatDate(dateTo, 'MM/dd/yyyy, ');
				myDate=new Date(Date.parse(datetime_to + (!$("#allday").prop('checked')?$("#time_to").val():'')));
				myDate.setHours(myDate.getHours()-1);
			}
			$('.message_date_input[data-id="'+data_id+'"]').val($.datepicker.formatDate(globalSettings.datepickerformat.value, myDate));
			$('.message_date_input[data-id="'+data_id+'"]').show();
			$('.message_time_input[data-id="'+data_id+'"]').val($.fullCalendar.formatDate(myDate, (globalSettings.ampmformat.value ? 'hh:mm TT' : 'HH:mm')));
			$('.message_time_input[data-id="'+data_id+'"]').show();
			$('.before_after_input[data-id="'+data_id+'"]').hide();
		}
		else
		{
			$('.message_date_input[data-id="'+data_id+'"]').hide();
			$('.message_time_input[data-id="'+data_id+'"]').hide();
			$('.before_after_input[data-id="'+data_id+'"]').show();
			$('.before_after_input[data-id="'+data_id+'"]').val('15');
		}
	});
	initCalDavDatepicker($('#event_details_template .alert_message_date[data-id="'+data_id+'"]'));
	initCalDavTimepicker($('#event_details_template .alert_message_date[data-id="'+data_id+'"]'));
	/*************************** BAD HACKS SECTION ***************************/
	// here we fix the cross OS/cross broser problems (unfixable in pure CSS)
	if($.browser.webkit && !!window.chrome)	/* Chrome */
	{
		if(navigator.platform.toLowerCase().indexOf('win')==0)	/* Windows version */
		{
			$('#event_details_template').find('input').css('text-indent', '2px');
			$('#event_details_template').find('select').css({'padding-left': '0px', 'padding-right': '13px'});
		}
		else	/* non-Windows version */
			$('#event_details_template').find('input').css('text-indent', '1px');
	}
	else if($.browser.safari)
	{
		$('#event_details_template').find('textarea').addClass('safari_hack');
		$('#event_details_template').find('input').addClass('safari_hack');
	}
	else if($.browser.msie)	/* IE */
	{
		if(parseInt($.browser.version, 10)==10)	/* IE 10 (because there are no more conditional comments) */
		{
			$('#event_details_template').find('select').css({'padding-top': '1px', 'padding-left': '0px', 'padding-right': '0px'});
			$('#event_details_template').find('textarea').css('padding-top', '3px');
			$('#event_details_template').find('input[type=button]').css('padding-top', '2px');
		}
	}

	/* IE or FF */
	if($.browser.msie || $.browser.mozilla)
	{
		// ADD empty SVG to interface (we will replace it later)
		$('<svg data-type="select_icon"></svg>').css('display', 'none').insertAfter($('#event_details_template tr[data-id="'+data_id+'"]').find('select'));
	}

	if($.browser.msie || $.browser.mozilla)
	{
		var newSVG=$(SVG_select).attr('data-type', 'select_icon').css({'pointer-events': 'none', 'z-index': '1', 'display': 'inline', 'margin-left': '-19px', 'vertical-align': 'top', 'background-color': '#ffffff'});	// background-color = stupid IE9 bug
		$('#event_details_template tr[data-id="'+data_id+'"]').find('svg[data-type="select_icon"]').replaceWith($('<div>').append($(newSVG).clone()).html());
	}
	/*************************** END OF BAD HACKS SECTION ***************************/
}

function stripEventAlerts()
{
	$('.alert_message_details').each(function(){
		if($(this).val()=='on_date')
			$(this).find('option').not(':selected').remove();
		else
		{
			var dataID=$(this).parent().parent().attr('data-id');
			$('#event_details_template').find('tr[data-id="'+dataID+'"]').remove();
		}
	});
}

function expandEventAlerts()
{
	$('.alert_message_details').each(function(){
		var value=$(this).val();
		$(this).html('<option data-type="on_date" value="on_date">on date</option>'+
		'<option data-type="weeks_before" value="weeks_before">weeks before</option>'+
		'<option data-type="days_before" value="days_before">days before</option>'+
		'<option data-type="hours_before" value="hours_before">hours before</option>'+
		'<option data-type="minutes_before" value="minutes_before">minutes before</option>'+
		'<option data-type="seconds_before" value="seconds_before">seconds before</option>'+
		'<option data-type="weeks_after" value="weeks_after">weeks after</option>'+
		'<option data-type="days_after" value="days_after">days after</option>'+
		'<option data-type="hours_after" value="hours_after">hours after</option>'+
		'<option data-type="minutes_after" value="minutes_after">minutes after</option>'+
		'<option data-type="seconds_after" value="seconds_after">seconds after</option>');
		$(this).val(value);
	});
	translateEventAlerts();
}

function stripTodoAlerts()
{
	$('.alert_message_detailsTODO').each(function(){
		if($(this).val()=='on_date')
			$(this).find('option').not(':selected').remove();
		else
		{
			var dataID=$(this).parent().parent().attr('data-id');
			$('#todo_details_template').find('tr[data-id="'+dataID+'"]').remove();
		}
	});
}

function expandTodoAlerts()
{
	$('.alert_message_detailsTODO').each(function(){
		var value=$(this).val();
		$(this).html('<option data-type="on_dateTODO" value="on_date">On date</option>'+
		'<option data-type="weeks_beforeTODO" value="weeks_before">weeks before</option>'+
		'<option data-type="days_beforeTODO" value="days_before">days before</option>'+
		'<option data-type="hours_beforeTODO" value="hours_before">hours before</option>'+
		'<option data-type="minutes_beforeTODO" value="minutes_before">minutes before</option>'+
		'<option data-type="seconds_beforeTODO" value="seconds_before">seconds before</option>'+
		'<option data-type="weeks_afterTODO" value="weeks_after">weeks after</option>'+
		'<option data-type="days_afterTODO" value="days_after">days after</option>'+
		'<option data-type="hours_afterTODO" value="hours_after">hours after</option>'+
		'<option data-type="minutes_afterTODO" value="minutes_after">minutes after</option>'+
		'<option data-type="seconds_afterTODO" value="seconds_after">seconds after</option>');
		$(this).val(value);
	});
	translateTodoAlerts();
}
