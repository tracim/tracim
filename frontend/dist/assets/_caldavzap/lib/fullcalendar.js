/**
 * @preserve
 * FullCalendar v1.5.4
 * http://arshaw.com/fullcalendar/
 *
 * Use fullcalendar.css for basic styling.
 * For event drag & drop, requires jQuery UI draggable.
 * For event resizing, requires jQuery UI resizable.
 *
 * Copyright (c) 2011 Adam Shaw
 * Dual licensed under the MIT and GPL licenses, located in
 * MIT-LICENSE.txt and GPL-LICENSE.txt respectively.
 *
 * Date: Tue Sep 4 23:38:33 2012 -0700
 *
 */

(function($, undefined) {

var defaults = {

	// display
	defaultView: 'month',
	aspectRatio: 1.35,
	header: {
		left: 'title',
		center: '',
		right: 'today prev,next'
	},
	weekends: true,
	currentTimeIndicator: false,

	// editing
	//editable: false,
	//disableDragging: false,
	//disableResizing: false,

	allDayDefault: true,
	ignoreTimezone: true,

	// event ajax
	lazyFetching: true,
	startParam: 'start',
	endParam: 'end',

	// time formats
	titleFormat: {
		month: 'MMMM yyyy',
		multiWeek: "MMM d[ yyyy]{ '–'[ MMM] d yyyy}",
		week: "MMM d[ yyyy]{ '–'[ MMM] d yyyy}",
		day: 'dddd, MMM d, yyyy',
		list: 'MMM d, yyyy',
		table: "MMM d[ yyyy]{ '–'[ MMM] d yyyy}",
		todo: "MMM d[ yyyy]{ '–'[ MMM] d yyyy}",
	},
	columnFormat: {
		month: 'ddd',
		multiWeek: 'ddd',
		week: 'ddd M/d',
		day: 'dddd M/d',
		list: 'dddd, MMM d, yyyy',
		table: 'MMM d, yyyy',
		todo: 'MMM d, yyyy',
	},
	timeFormat: { // for event elements
		'': 'h(:mm)t', // default
		agenda: 'h:mm{ – h:mm}', //agenda views
		list: 'hh:mm{ – hh:mm}', //list and table views
		listFull: 'hh:mm M d yyyy{ – hh:mm M d yyyy}', //list and table views for events that span multiple days
		listFullAllDay: 'M d yyyy{ – M d yyyy}', //list and table views for allday events that span multiple days
	},

	// locale
	isRTL: false,
	firstDay: 0,
	weekendDays: [0, 6],
	monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
	monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
	dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
	dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
	buttonText: {
		prev: '&nbsp;❮&nbsp;',
		next: '&nbsp;❯&nbsp;',
		prevYear: '&nbsp;&lt;&lt;&nbsp;',
		nextYear: '&nbsp;&gt;&gt;&nbsp;',
		today: 'today',
		month: 'month',
		multiWeek: 'mweek',
		week: 'week',
		day: 'day',
		list: 'list',
		table: 'table',
		todo: 'todo',
		prevMonth: 'Load previous month',
		nextMonth: 'Load next month',
		filtersHeader: 'Filters',
		filtersFooter: '* completed at or after %date%',
		filterAction: 'Needs action',
		filterProgress: 'In progress',
		filterCompleted: 'Completed',
		filterCanceled: 'Canceled'
	},

	listTexts: {
		until: 'until',
		past: 'Past events',
		today: 'Today',
		tomorrow: 'Tomorrow',
		thisWeek: 'This week',
		nextWeek: 'Next week',
		thisMonth: 'This month',
		nextMonth: 'Next month',
		future: 'Future events',
		week: 'W'
	},

	// list/table options
	listSections: 'smart',  // false|'day'|'week'|'month'|'smart'
	listRange: 30,  // number of days to be displayed
	listPage: 7,  // number of days to jump when paging
	tableCols: ['handle', 'date', 'time', 'title'],
	todoCols: ['handle', 'check', 'priority', 'time', 'title', 'location', 'status', 'percent'],
	todoColThresholds: [],
	todoOptionalCols: [],
	//defaultFilters: ['filterAction', 'filterProgress', 'filterCompleted', 'filterCanceled'],
	defaultFilters: [],

	// jquery-ui theming
	theme: false,
	buttonIcons: {
		prev: 'circle-triangle-w',
		next: 'circle-triangle-e'
	},

	//selectable: false,
	unselectAuto: true,

	dropAccept: '*',

	headerContainer: false,
	bindingMode: 'single',
	dayEventSizeStrict: false,
	startOfBusiness: 0,
	endOfBusiness: 0,
	showWeekNumbers: true,
	multiWeekSize: 3,
	showDatepicker: false,
	eventMode: true,
	showUnstartedEvents: false,
	simpleFilters: false,
};

// right-to-left defaults
var rtlDefaults = {
	header: {
		left: 'next,prev today',
		center: '',
		right: 'title'
	},
	headerContainer: '',
	buttonText: {
		prev: '&nbsp;&#9658;&nbsp;',
		next: '&nbsp;&#9668;&nbsp;',
		prevYear: '&nbsp;&gt;&gt;&nbsp;',
		nextYear: '&nbsp;&lt;&lt;&nbsp;'
	},
	buttonIcons: {
		prev: 'circle-triangle-e',
		next: 'circle-triangle-w'
	}
};

var fc = $.fullCalendar = { version: "1.5.4" };
var fcViews = fc.views = {};

$.fn.fullCalendar = function(options) {
	// method calling
	if (typeof options == 'string') {
		var args = Array.prototype.slice.call(arguments, 1);
		var res;
		this.each(function() {
			var calendar = $.data(this, 'fullCalendar');
			if (calendar && $.isFunction(calendar[options])) {
				var r = calendar[options].apply(calendar, args);
				if (res === undefined) {
					res = r;
				}
				if (options == 'destroy') {
					$.removeData(this, 'fullCalendar');
				}
			}
		});
		if (res !== undefined) {
			return res;
		}
		return this;
	}

	// would like to have this logic in EventManager, but needs to happen before options are recursively extended
	var eventSources = options.eventSources || [];
	delete options.eventSources;
	if (options.events) {
		eventSources.push(options.events);
		delete options.events;
	}

	options = $.extend(true, {},
		defaults,
		(options.isRTL || options.isRTL===undefined && defaults.isRTL) ? rtlDefaults : {},
		options
	);

	this.each(function(i, _element) {
		var element = $(_element);
		var calendar = new Calendar(element, options, eventSources);
		element.data('fullCalendar', calendar); // TODO: look into memory leak implications
		calendar.render();
	});

	return this;
};

// function for adding/overriding defaults
function setDefaults(d) {
	$.extend(true, defaults, d);
}

function Calendar(element, options, eventSources) {
	var t = this;

	// exports
	t.options = options;
	t.render = render;
	t.destroy = destroy;
	t.refetchEvents = refetchEvents;
	t.reportEvents = reportEvents;
	t.reportEventChange = reportEventChange;
	t.rerenderEvents = rerenderEvents;
	t.changeView = changeView;
	t.select = select;
	t.unselect = unselect;
	t.prev = prev;
	t.next = next;
	t.prevYear = prevYear;
	t.nextYear = nextYear;
	t.today = today;
	t.findToday = findToday;
	t.gotoDate = gotoDate;
	t.incrementDate = incrementDate;
	t.formatDate = function(format, date) { return formatDate(format, date, options) };
	t.formatDates = function(format, date1, date2) { return formatDates(format, date1, date2, options) };
	t.getDate = getDate;
	t.getView = getView;
	t.option = option;
	t.trigger = trigger;
	t.selectEvent = selectEvent;
	t.allowSelectEvent = allowSelectEvent;
	t.updateToday = updateToday;
	t.updateGrid = updateGrid;
	t.renderViews = renderViews;
	t.setOptions = setOptions;
	t.getOption = getOption;
	t.viewInstances = {};

	// imports
	EventManager.call(t, options, eventSources);
	var isFetchNeeded = t.isFetchNeeded;
	var fetchEvents = t.fetchEvents;

	// locals
	var _element = element[0];
	var header;
	var headerElement;
	var content;
	var tm; // for making theme classes
	var currentView;
	var elementOuterWidth;
	var suggestedViewHeight;
	var absoluteViewElement;
	var resizeUID = 0;
	var ignoreWindowResize = 0;
	var date = new Date();
	var events = [];
	var _dragElement;

	/* Main Rendering
	-----------------------------------------------------------------------------*/

	setYMD(date, options.year, options.month, options.date);

	function render(inc) {
		if (!content) {
			initialRender();
		}else{
			calcSize();
			markSizesDirty();
			markEventsDirty();
			renderView(inc);
		}
	}

	function initialRender() {
		tm = options.theme ? 'ui' : 'fc';
		element.addClass('fc');
		if (options.isRTL) {
			element.addClass('fc-rtl');
		}
		if (options.theme) {
			element.addClass('ui-widget');
		}
		content = $("<div class='fc-content' style='position:relative'/>")
			.prependTo(element);
		header = new Header(t, options);
		headerElement = header.render();
		if (headerElement) {
			options.headerContainer ? options.headerContainer.prepend(headerElement) : element.prepend(headerElement);
		}
		changeView(options.defaultView);
		$(window).resize(windowResize);
		// needed for IE in a 0x0 iframe, b/c when it is resized, never triggers a windowResize
		if (!bodyVisible()) {
			lateRender();
		}
	}

	// called when we know the calendar couldn't be rendered when it was initialized,
	// but we think it's ready now
	function lateRender() {
		setTimeout(function() { // IE7 needs this so dimensions are calculated correctly
			if (!currentView.start && bodyVisible()) { // !currentView.start makes sure this never happens more than once
				renderView();
			}
		},0);
	}

	function updateToday()
	{
		for(var view in t.viewInstances)
			t.viewInstances[view].updateToday();
	}

	function updateGrid()
	{
		for(var view in t.viewInstances)
			t.viewInstances[view].updateGrid();
	}

	function renderViews()
	{
		//Force rerender of all views
		for(var view in t.viewInstances)
			t.viewInstances[view].start=null;
		renderView();
	}

	function setOptions(newOptions)
	{
		var rerender=false;

		$.each(newOptions, function(key,value){
			if($.isPlainObject(value))
				$.extend(options[key],value);
			else
				options[key]=value;

			if(key=='firstDay' || key=='timeFormat')
				rerender=true;
			else
			{
				for(var view in t.viewInstances)
					t.viewInstances[view]['set'+key.charAt(0).toUpperCase()+key.slice(1)]();
			}
		});

		if(rerender)
			renderViews();
	}

	function getOption(option)
	{
		return options[option];
	}

	function destroy() {
		$(window).unbind('resize', windowResize);
		header.destroy();
		content.remove();
		element.removeClass('fc fc-rtl ui-widget');
	}

	function elementVisible() {
		return _element.offsetWidth !== 0;
	}

	function bodyVisible() {
		return $('body')[0].offsetWidth !== 0;
	}

	/* View Rendering
	-----------------------------------------------------------------------------*/

	// TODO: improve view switching (still weird transition in IE, and FF has whiteout problem)

	function changeView(newViewName) {
		if (!currentView || newViewName != currentView.name) {
			ignoreWindowResize++; // because setMinHeight might change the height before render (and subsequently setSize) is reached

			unselect();

			var oldView = currentView;
			var newViewElement;

			if (oldView) {
				(oldView.beforeHide || noop)(); // called before changing min-height. if called after, scroll state is reset (in Opera)
				//setMinHeight(content, content.height()); why is this necessary?
				oldView.element.hide();
				if(oldView.addedView) {
					oldView.addedView.element.hide();
				}
			}else{
				setMinHeight(content, 1); // needs to be 1 (not 0) for IE7, or else view dimensions miscalculated
			}
			content.css('overflow', 'hidden');

			currentView = t.viewInstances[newViewName];
			if (currentView) {
				currentView.element.show();
			}else{
				currentView = t.viewInstances[newViewName] = new fcViews[newViewName](
					newViewElement = absoluteViewElement =
						$("<div class='fc-view fc-view-" + newViewName + "' style='position:absolute'/>")
							.appendTo(content),
					t // the calendar object
				);
			}

			if(newViewName == 'agendaDay') {
				addedView = t.viewInstances['table'];
				if (addedView) {
					addedView.element.show();
				}else{
					addedView = t.viewInstances['table'] = new fcViews['table'](
						addedNewViewElement = addedAbsoluteViewElement =
							$("<div class='fc-view fc-view-" + 'table' + "' style='position:absolute'/>")
								.appendTo(content),
						t // the calendar object
					);
					currentView.addedView = addedView;
				}
			}

			if (oldView) {
				header.deactivateButton(oldView.name);
			}
			header.activateButton(newViewName);

			renderView(); // after height has been set, will make absoluteViewElement's position=relative, then set to null

			content.css('overflow', '');
			if (oldView) {
				setMinHeight(content, 1);
			}

			if (!newViewElement) {
				(currentView.afterShow || noop)(); // called after setting min-height/overflow, so in final scroll state (for Opera)
			}

			ignoreWindowResize--;
			currentView.trigger('viewChanged', _element);
		}
	}

	function renderView(inc) {
		if (elementVisible()) {
			currentView.trigger('beforeViewDisplay', _element);
			ignoreWindowResize++; // because renderEvents might temporarily change the height before setSize is reached

			unselect();

			if (suggestedViewHeight === undefined) {
				calcSize();
			}

			if(currentView.addedView && currentView.start && cloneDate(date, true).getTime() == currentView.start.getTime()) {
				currentView.addedView.scrollToDate(date);
			}

			var forceEventRender = false;
			if (!currentView.start || inc || date < currentView.start || date >= currentView.end) {
				// view must render an entire new date range (and refetch/render events)
				currentView.render(date, inc || 0); // responsible for clearing events
				setSize(true);
				forceEventRender = true;
			}
			else if (currentView.sizeDirty) {
				// view must resize (and rerender events)
				currentView.clearEvents();
				setSize();
				forceEventRender = true;
			}
			else if (currentView.eventsDirty) {
				currentView.clearEvents();
				forceEventRender = true;
			}

			currentView.sizeDirty = false;
			currentView.eventsDirty = false;
			updateEvents(forceEventRender);

			elementOuterWidth = element.outerWidth();

			header.updateTitle(currentView.title);
			var today = new Date();
			if (today >= currentView.start && today < currentView.end) {
				//header.disableButton('today');
				header.setTodayScroll(element);
				findToday();
			}else{
				//header.enableButton('today');
				header.setTodayDefault();
			}

			ignoreWindowResize--;
			currentView.trigger('viewDisplay', _element);
		}
	}

	/* Resizing
	-----------------------------------------------------------------------------*/

	function updateSize() {
		markSizesDirty();
		if (elementVisible()) {
			calcSize();
			setSize();
			if(currentView.name!='todo')
			{
				unselect();
				currentView.clearEvents();
				currentView.renderEvents(events);
			}
			currentView.sizeDirty = false;
		}
	}

	function markSizesDirty() {
		$.each(t.viewInstances, function(i, inst) {
			inst.sizeDirty = true;
		});
	}

	function calcSize() {
		if (options.contentHeight) {
			suggestedViewHeight = options.contentHeight;
		}
		else if (options.height) {
			suggestedViewHeight = options.height - (headerElement ? headerElement.height() : 0) - vsides(content);
		}
		else {
			suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
		}
	}

	function setSize(dateChanged) { // todo: dateChanged?
		ignoreWindowResize++;
		currentView.setWidth(content.width(), dateChanged);
		currentView.setHeight(suggestedViewHeight, dateChanged);
		if (absoluteViewElement) {
			absoluteViewElement.css('position', 'relative');
			absoluteViewElement = null;
		}
		/*if(currentView.addedView) {
			currentView.addedView.setWidth(content.width(), dateChanged);
			var tmpContentWidth = Math.floor(content.width() / 2);
			currentView.element.width(tmpContentWidth);
			currentView.addedView.element.css({'left' : tmpContentWidth,
				'width' : tmpContentWidth - 2});
		}*/
		ignoreWindowResize--;
	}

	function windowResize() {
		if (!ignoreWindowResize) {
			if (currentView.start) { // view has already been rendered
				var uid = ++resizeUID;
				//setTimeout(function() { // add a delay
					if (uid == resizeUID && !ignoreWindowResize && elementVisible()) {
						if (elementOuterWidth != (elementOuterWidth = element.outerWidth())) {
							ignoreWindowResize++; // in case the windowResize callback changes the height
							updateSize();
							currentView.trigger('windowResize', _element);
							ignoreWindowResize--;
						}
					}
				//}, 200);
			}else{
				// calendar must have been initialized in a 0x0 iframe that has just been resized
				lateRender();
			}
		}
	}

	/* Event Fetching/Rendering
	-----------------------------------------------------------------------------*/

	// fetches events if necessary, rerenders events if necessary (or if forced)
	function updateEvents(forceRender) {
		if (!options.lazyFetching || isFetchNeeded(currentView.visStart, currentView.visEnd)) {
			refetchEvents();
		}
		else if (forceRender) {
			rerenderEvents();
		}
	}

	function refetchEvents() {
		fetchEvents(currentView.visStart, currentView.visEnd); // will call reportEvents
	}

	// called when event data arrives
	function reportEvents(_events) {
		events = _events;
		rerenderEvents();
	}

	// called when a single event's data has been changed
	function reportEventChange(eventID) {
		rerenderEvents(eventID);
	}

	// attempts to rerenderEvents
	function rerenderEvents(modifiedEventID) {
		markEventsDirty();
		if (elementVisible()) {
			currentView.clearEvents();
			currentView.renderEvents(events, modifiedEventID);
			currentView.eventsDirty = false;
		}
	}

	function markEventsDirty() {
		$.each(t.viewInstances, function(i, inst) {
			inst.eventsDirty = true;
		});
	}

	/* Selection
	-----------------------------------------------------------------------------*/

	function select(start, end, allDay) {
		currentView.select(start, end, allDay===undefined ? true : allDay);
	}

	function unselect() { // safe to be called before renderView
		if(currentView)
			currentView.unselect();
	}

	/* Date
	-----------------------------------------------------------------------------*/

	function prev() {
		renderView(-1);
		trigger('prevClick');
	}

	function next() {
		renderView(1);
		trigger('nextClick');
	}

	function prevYear() {
		addYears(date, -1);
		renderView();
	}

	function nextYear() {
		addYears(date, 1);
		renderView();
	}

	function today() {
		date = new Date();
		renderView();
		findToday();
		trigger('todayClick');
	}

	function findToday() {
		if(currentView.addedView) {
			if(currentView.addedView.getDaySegmentContainer().find('.fc-today').length>0) {
				if(new Date().getDate()==1) {
					currentView.addedView.getDaySegmentContainer().parent().scrollTop(0);
				}
				else {
					offset = currentView.addedView.getDaySegmentContainer().find('.fc-today').position().top;
					var top = currentView.addedView.getDaySegmentContainer().parent().scrollTop();
					currentView.addedView.getDaySegmentContainer().parent().scrollTop(top + offset);
				}
			}
		}
		else if(currentView.name == 'todo') {
			if(currentView.getDaySegmentContainer().find('.fc-today').length>0) {
				offset = currentView.getDaySegmentContainer().find('.fc-today').position().top;
				var top = currentView.getDaySegmentContainer().parent().scrollTop();
				currentView.getDaySegmentContainer().parent().scrollTop(top + offset);
			}
		}
		else {
			var todayElem = currentView.element.find('.fc-today');
			if(todayElem.length>0) {
				var offset = 0;
				if(!todayElem.parent().hasClass('fc-week0')) {
					offset = todayElem.position().top;
				}
				element.parent().scrollTop(offset);
			}
		}
	}

	function gotoDate(year, month, dateOfMonth) {
		if (year instanceof Date)
			date = cloneDate(year); // provided 1 argument, a Date
		else
			setYMD(date, year, month, dateOfMonth);
		renderView();
	}

	function incrementDate(years, months, days) {
		if(years !== undefined)
			addYears(date, years);
		if(months !== undefined)
			addMonths(date, months);
		if(days !== undefined)
			addDays(date, days);
		renderView();
	}

	function getDate() {
		return cloneDate(date);
	}

	/* Misc
	-----------------------------------------------------------------------------*/

	function getView() {
		return currentView;
	}

	function option(name, value) {
		if (value === undefined) {
			return options[name];
		}
		if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
			options[name] = value;
			updateSize();
		} else if (name.indexOf('list') == 0 || name == 'tableCols') {
			options[name] = value;
			currentView.start = null; // force re-render
		}
	}

	function trigger(name, thisObj) {
		if (options[name]) {
			return options[name].apply(
				thisObj || _element,
				Array.prototype.slice.call(arguments, 2)
			);
		}
	}

	function selectEvent(eventElement, noClick) {
		currentView.selectEvent(eventElement, noClick);
	}

	function allowSelectEvent(value) {
		currentView.allowSelectEvent(value);
	}

	/* External Dragging
	------------------------------------------------------------------------*/

	if (options.droppable) {
		$(document)
			.bind('dragstart', function(ev, ui) {
				var _e = ev.target;
				var e = $(_e);
				if (!e.parents('.fc').length) { // not already inside a calendar
					var accept = options.dropAccept;
					if ($.isFunction(accept) ? accept.call(_e, e) : e.is(accept)) {
						_dragElement = _e;
						currentView.dragStart(_dragElement, ev, ui);
					}
				}
			})
			.bind('dragstop', function(ev, ui) {
				if (_dragElement) {
					currentView.dragStop(_dragElement, ev, ui);
					_dragElement = null;
				}
			});
	}
}

function Header(calendar, options) {
	var t = this;

	// exports
	t.render = render;
	t.destroy = destroy;
	t.updateTitle = updateTitle;
	t.activateButton = activateButton;
	t.deactivateButton = deactivateButton;
	t.disableButton = disableButton;
	t.enableButton = enableButton;
	t.setTodayDefault = setTodayDefault;
	t.setTodayScroll = setTodayScroll;

	// locals
	var element = $([]);
	var tm;

	function render() {
		tm = options.theme ? 'ui' : 'fc';
		var sections = options.header;
		if (sections) {
			element = $("<table class='fc-header' style='width:100%'/>")
				.append(
					$("<tr/>")
						.append(renderSection('left'))
						.append(renderSection('center'))
						.append(renderSection('right'))
				);
			return element;
		}
	}

	function destroy() {
		element.remove();
	}

	function renderSection(position) {
		var e = $("<td class='fc-header-" + position + "'/>");
		var buttonStr = options.header[position];
		if (buttonStr) {
			$.each(buttonStr.split(' '), function(i) {
				if (i > 0) {
					e.append("<span class='fc-header-space'/>");
				}
				var prevButton;
				$.each(this.split(','), function(j, buttonName) {
					if (buttonName == 'title') {
						e.append("<span class='fc-header-title'><h2>&nbsp;</h2></span>");
						if (prevButton) {
							prevButton.addClass(tm + '-corner-right');
						}
						prevButton = null;
					}else{
						var buttonClick;
						if (calendar[buttonName]) {
							buttonClick = calendar[buttonName]; // calendar method
						}
						else if (fcViews[buttonName]) {
							buttonClick = function() {
								button.removeClass(tm + '-state-hover'); // forget why
								calendar.changeView(buttonName);
							};
						}
						if (buttonClick) {
//							var icon = options.theme ? smartProperty(options.buttonIcons, buttonName) : null; // why are we using smartProperty here?
							var icon = (buttonName=='prev' || buttonName=='next') ? buttonName : null;
							var text = smartProperty(options.buttonText, buttonName); // why are we using smartProperty here?
							var button = $(
								"<span class='fc-button fc-button-" + buttonName + " " + tm + "-state-default'>" +
									"<span class='fc-button-inner'>" +
										"<span class='fc-button-content'>" +
											(icon ?
												"<img src='images/arrow_" + icon + ".svg'/>" :
												text
											) +
										"</span>" +
										"<span class='fc-button-effect'><span></span></span>" +
									"</span>" +
								"</span>"
							);
							if (button) {
								button
									.click(function() {
										if (!button.hasClass(tm + '-state-disabled')) {
											buttonClick();
										}
									})
									.mousedown(function() {
										button
											.not('.' + tm + '-state-active')
											.not('.' + tm + '-state-disabled')
											.addClass(tm + '-state-down');
									})
									.mouseup(function() {
										button.removeClass(tm + '-state-down');
									})
									.hover(
										function() {
											button
												.not('.' + tm + '-state-active')
												.not('.' + tm + '-state-disabled')
												.addClass(tm + '-state-hover');
										},
										function() {
											button
												.removeClass(tm + '-state-hover')
												.removeClass(tm + '-state-down');
										}
									)
									.appendTo(e);
								if (!prevButton) {
									button.addClass(tm + '-corner-left');
								}
								prevButton = button;
							}
						}
					}
				});
				if (prevButton) {
					prevButton.addClass(tm + '-corner-right');
				}
			});
		}
		return e;
	}

	function updateTitle(html) {
		element.find('h2')
			.html(html)
			.attr('title', $("<div/>").html(html).text());
	}

	function activateButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.addClass(tm + '-state-active');
	}

	function deactivateButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.removeClass(tm + '-state-active');
	}

	function disableButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.addClass(tm + '-state-disabled');
	}

	function enableButton(buttonName) {
		element.find('span.fc-button-' + buttonName)
			.removeClass(tm + '-state-disabled');
	}

	function setTodayDefault() {
		var todayBt = element.find('span.fc-button-' + 'today');
		var todayBtClc = calendar['today'];

		todayBt.unbind('click');
		todayBt.click(function(){
			if(!todayBt.hasClass(tm + '-state-disabled')) {
				todayBtClc();
			}
		});
	}

	function setTodayScroll(body) {
		var todayBt = element.find('span.fc-button-' + 'today');
		var todayBtClc = calendar['findToday'];

		todayBt.unbind('click');
		todayBt.click(function(){
			if(!todayBt.hasClass(tm + '-state-disabled'))
				todayBtClc();
		});
	}

}

fc.sourceNormalizers = [];
fc.sourceFetchers = [];

var ajaxDefaults = {
	dataType: 'json',
	cache: false
};

var eventGUID = 1;

function EventManager(options, _sources) {
	var t = this;

	// exports
	t.isFetchNeeded = isFetchNeeded;
	t.fetchEvents = fetchEvents;
	t.addEventSource = addEventSource;
	t.removeEventSource = removeEventSource;
	t.removeEventSources = removeEventSources;
	t.updateEvent = updateEvent;
	t.renderEvent = renderEvent;
	t.removeEvents = removeEvents;
	t.clientEvents = clientEvents;
	t.normalizeEvent = normalizeEvent;

	// imports
	var trigger = t.trigger;
	var getView = t.getView;
	var reportEvents = t.reportEvents;

	// locals
	var stickySource = { events: [] };
	var sources = [ stickySource ];
	var rangeStart, rangeEnd;
	var currentFetchID = 0;
	var pendingSourceCnt = 0;
	var loadingLevel = 0;
	var cache = [];

	for (var i=0; i<_sources.length; i++) {
		_addEventSource(_sources[i]);
	}

	/* Fetching
	-----------------------------------------------------------------------------*/

	function isFetchNeeded(start, end) {
		return !rangeStart || start < rangeStart || end > rangeEnd;
	}

	function fetchEvents(start, end) {
		rangeStart = start;
		rangeEnd = end;
		cache = [];
		var fetchID = ++currentFetchID;
		var len = sources.length;
		pendingSourceCnt = len;
		for (var i=0; i<len; i++) {
			fetchEventSource(sources[i], fetchID);
		}
	}

	function fetchEventSource(source, fetchID) {
		_fetchEventSource(source, function(events) {
			if (fetchID == currentFetchID) {
				if (events) {
					for (var i=0; i<events.length; i++) {
						events[i].source = source;
						normalizeEvent(events[i]);
					}
					cache = cache.concat(events);
				}
				pendingSourceCnt--;
				if (!pendingSourceCnt) {
					reportEvents(cache);
				}
			}
		});
	}

	function _fetchEventSource(source, callback) {
		var i;
		var fetchers = fc.sourceFetchers;
		var res;
		for (i=0; i<fetchers.length; i++) {
			res = fetchers[i](source, rangeStart, rangeEnd, callback);
			if (res === true) {
				// the fetcher is in charge. made its own async request
				return;
			}
			else if (typeof res == 'object') {
				// the fetcher returned a new source. process it
				_fetchEventSource(res, callback);
				return;
			}
		}
		var events = source.events;
		if (events) {
			if ($.isFunction(events)) {
				pushLoading();
				events(cloneDate(rangeStart), cloneDate(rangeEnd), function(events) {
					callback(events);
					popLoading();
				});
			}
			else if ($.isArray(events)) {
				callback(events);
			}
			else {
				callback();
			}
		}else{
			var url = source.url;
			if (url) {
				var success = source.success;
				var error = source.error;
				var complete = source.complete;
				var data = $.extend({}, source.data || {});
				var startParam = firstDefined(source.startParam, options.startParam);
				var endParam = firstDefined(source.endParam, options.endParam);
				if (startParam) {
					data[startParam] = Math.round(+rangeStart / 1000);
				}
				if (endParam) {
					data[endParam] = Math.round(+rangeEnd / 1000);
				}
				pushLoading();
				$.ajax($.extend({}, ajaxDefaults, source, {
					data: data,
					success: function(events) {
						events = events || [];
						var res = applyAll(success, this, arguments);
						if ($.isArray(res)) {
							events = res;
						}
						callback(events);
					},
					error: function() {
						applyAll(error, this, arguments);
						callback();
					},
					complete: function() {
						applyAll(complete, this, arguments);
						popLoading();
					}
				}));
			}else{
				callback();
			}
		}
	}

	/* Sources
	-----------------------------------------------------------------------------*/

	function addEventSource(source) {
		source = _addEventSource(source);
		if (source) {
			pendingSourceCnt++;
			fetchEventSource(source, currentFetchID); // will eventually call reportEvents
		}
		return source;
	}

	function _addEventSource(source) {
		if ($.isFunction(source) || $.isArray(source)) {
			source = { events: source };
		}
		else if (typeof source == 'string') {
			source = { url: source };
		}
		if (typeof source == 'object') {
			normalizeSource(source);
			sources.push(source);
			return source;
		}
	}

	function removeEventSource(source) {
		sources = $.grep(sources, function(src) {
			return !isSourcesEqual(src, source);
		});
		// remove all client events from that source
		cache = $.grep(cache, function(e) {
			return !isSourcesEqual(e.source, source);
		});
		reportEvents(cache);
	}

	function removeEventSources() {
		while(source = sources.shift()) {
			// remove all client events from that source
			cache = $.grep(cache, function(e) {
				return !isSourcesEqual(e.source, source);
			});
			reportEvents(cache);
		}
	}

	/* Manipulation
	-----------------------------------------------------------------------------*/

	function updateEvent(event) { // update an existing event
		var i, len = cache.length, e,
			defaultEventEnd = getView().defaultEventEnd, // getView???
			startDelta = event.start - event._start,
			endDelta = event.end ?
				(event.end - (event._end || defaultEventEnd(event)))	// event._end would be null if event.end
				: 0;													// was null and event was just resized
		for (i=0; i<len; i++) {
			e = cache[i];
			if (e._id == event._id && e != event) {
				e.start = new Date(+e.start + startDelta);
				if (event.end) {
					if (e.end) {
						e.end = new Date(+e.end + endDelta);
					}else{
						e.end = new Date(+defaultEventEnd(e) + endDelta);
					}
				}else{
					e.end = null;
				}
				e.title = event.title;
				e.url = event.url;
				e.allDay = event.allDay;
				e.className = event.className;
				e.editable = event.editable;
				e.color = event.color;
				e.backgroudColor = event.backgroudColor;
				e.borderColor = event.borderColor;
				e.textColor = event.textColor;
				normalizeEvent(e);
			}
		}
		normalizeEvent(event);
		reportEvents(cache);
	}

	function renderEvent(event, stick) {
		normalizeEvent(event);
		if (!event.source) {
			if (stick) {
				stickySource.events.push(event);
				event.source = stickySource;
			}
		}
		// always push event to cache (issue #1112:)
		cache.push(event);
		reportEvents(cache);
	}

	function removeEvents(filter) {
		var oldCache = cache;
		if (!filter) { // remove all
			cache = [];
			// clear all array sources
			/*for (var i=0; i<sources.length; i++) {
				if ($.isArray(sources[i].events)) {
					sources[i].events = [];
				}
			}*/
		}else{
			if (!$.isFunction(filter)) { // an event ID
				var id = filter + '';
				filter = function(e) {
					return e._id == id;
				};
			}
			cache = $.grep(cache, filter, true);
			// remove events from array sources
			/*for (var i=0; i<sources.length; i++) {
				if ($.isArray(sources[i].events)) {
					sources[i].events = $.grep(sources[i].events, filter, true);
				}
			}*/
		}
		if(oldCache.length != cache.length)
			reportEvents(cache);
	}

	function clientEvents(filter) {
		if ($.isFunction(filter)) {
			return $.grep(cache, filter);
		}
		else if (filter) { // an event ID
			filter += '';
			return $.grep(cache, function(e) {
				return e._id == filter;
			});
		}
		return cache; // else, return all
	}

	/* Loading State
	-----------------------------------------------------------------------------*/

	function pushLoading() {
		if (!loadingLevel++) {
			trigger('loading', null, true);
		}
	}

	function popLoading() {
		if (!--loadingLevel) {
			trigger('loading', null, false);
		}
	}

	/* Event Normalization
	-----------------------------------------------------------------------------*/

	function normalizeEvent(event) {
		var source = event.source || {};
		var ignoreTimezone = firstDefined(source.ignoreTimezone, options.ignoreTimezone);
		event._id = event._id || (event.id === undefined ? '_fc' + eventGUID++ : event.id + '');
		if (event.date) {
			if (!event.start) {
				event.start = event.date;
			}
			delete event.date;
		}
		event._start = cloneDate(event.start = parseDate(event.start, ignoreTimezone));
		event.end = parseDate(event.end, ignoreTimezone);
		if (event.end && ((options.eventMode && event.end <= event.start) || (!options.eventMode && event.end < event.start))) {
			event.end = null;
		}
		event._end = event.end ? cloneDate(event.end) : null;
		if (event.allDay === undefined) {
			event.allDay = firstDefined(source.allDayDefault, options.allDayDefault);
		}
		if (event.className) {
			if (typeof event.className == 'string') {
				event.className = event.className.split(/\s+/);
			}
		}else{
			event.className = [];
		}
		// TODO: if there is no start date, return false to indicate an invalid event
	}

	/* Utils
	------------------------------------------------------------------------------*/

	function normalizeSource(source) {
		if (source.className) {
			// TODO: repeat code, same code for event classNames
			if (typeof source.className == 'string') {
				source.className = source.className.split(/\s+/);
			}
		}else{
			source.className = [];
		}
		var normalizers = fc.sourceNormalizers;
		for (var i=0; i<normalizers.length; i++) {
			normalizers[i](source);
		}
	}

	function isSourcesEqual(source1, source2) {
		return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
	}

	function getSourcePrimitive(source) {
		return ((typeof source == 'object') ? (source.events || source.url) : '') || source;
	}
}

fc.addDays = addDays;
fc.cloneDate = cloneDate;
fc.parseDate = parseDate;
fc.parseISO8601 = parseISO8601;
fc.parseTime = parseTime;
fc.formatDate = formatDate;
fc.formatDates = formatDates;

/* Date Math
-----------------------------------------------------------------------------*/

var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	DAY_MS = 86400000,
	HOUR_MS = 3600000,
	MINUTE_MS = 60000;

function addYears(d, n, keepTime) {
	d.setFullYear(d.getFullYear() + n);
	if (!keepTime) {
		clearTime(d);
	}
	return d;
}

function addMonths(d, n, keepTime) { // prevents day overflow/underflow
	if (+d) { // prevent infinite looping on invalid dates
		var m = d.getMonth() + n,
			check = cloneDate(d);
		check.setDate(1);
		check.setMonth(m);
		d.setMonth(m);
		if (!keepTime) {
			clearTime(d);
		}
		while (d.getMonth() != check.getMonth()) {
			d.setDate(d.getDate() + (d < check ? 1 : -1));
		}
	}
	return d;
}

function addDays(d, n, keepTime) { // deals with daylight savings
	if (+d) {
		var dd = d.getDate() + n,
			check = cloneDate(d);
		check.setHours(9); // set to middle of day
		check.setDate(dd);
		d.setDate(dd);
		if (!keepTime) {
			clearTime(d);
		}
		fixDate(d, check);
	}
	return d;
}

function fixDate(d, check) { // force d to be on check's YMD, for daylight savings purposes
	if (+d) { // prevent infinite looping on invalid dates
		while (d.getDate() != check.getDate()) {
			d.setTime(+d + (d < check ? 1 : -1) * HOUR_MS);
		}
	}
}

function addMinutes(d, n) {
	d.setMinutes(d.getMinutes() + n);
	return d;
}

function clearTime(d) {
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}

function cloneDate(d, dontKeepTime) {
	if(d==null) {
		return null;
	}
	else if (dontKeepTime) {
		return clearTime(new Date(+d));
	}
	return new Date(+d);
}

function zeroDate() { // returns a Date with time 00:00:00 and dateOfMonth=1
	var i=0, d;
	do {
		d = new Date(1970, i++, 1);
	} while (d.getHours()); // != 0
	return d;
}

function skipWeekend(date, inc, excl) {
	inc = inc || 1;
	while (!date.getDay() || (excl && date.getDay()==1 || !excl && date.getDay()==6)) {
		addDays(date, inc);
	}
	return date;
}

function dayDiff(d1, d2) { // d1 - d2
	return Math.round((cloneDate(d1, true) - cloneDate(d2, true)) / DAY_MS);
}

function minDiff(d1, d2) { // d1 - d2
	return Math.round((cloneDate(d1, false) - cloneDate(d2, false)) / MINUTE_MS);
}

function setYMD(date, y, m, d) {
	if (y !== undefined && y != date.getFullYear()) {
		date.setDate(1);
		date.setMonth(0);
		date.setFullYear(y);
	}
	if (m !== undefined && m != date.getMonth()) {
		date.setDate(1);
		date.setMonth(m);
	}
	if (d !== undefined) {
		date.setDate(d);
	}
}

/* Date Parsing
-----------------------------------------------------------------------------*/

function parseDate(s, ignoreTimezone) { // ignoreTimezone defaults to true
	if (typeof s == 'object') { // already a Date object
		return s;
	}
	if (typeof s == 'number') { // a UNIX timestamp
		return new Date(s * 1000);
	}
	if (typeof s == 'string') {
		if (s.match(/^\d+(\.\d+)?$/)) { // a UNIX timestamp
			return new Date(parseFloat(s) * 1000);
		}
		if (ignoreTimezone === undefined) {
			ignoreTimezone = true;
		}
		return parseISO8601(s, ignoreTimezone) || (s ? new Date(s) : null);
	}
	// TODO: never return invalid dates (like from new Date(<string>)), return null instead
	return null;
}

function parseISO8601(s, ignoreTimezone) { // ignoreTimezone defaults to false
	// derived from http://delete.me.uk/2005/03/iso8601.html
	// TODO: for a know glitch/feature, read tests/issue_206_parseDate_dst.html
	var m = s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2})(:?([0-9]{2}))?))?)?)?)?$/);
	if (!m) {
		return null;
	}
	var date = new Date(m[1], 0, 1);
	if (ignoreTimezone || !m[13]) {
		var check = new Date(m[1], 0, 1, 12, 0);
		fixDate(date, check);
		if (m[3]) {
			date.setMonth(m[3] - 1);
			check.setMonth(m[3] - 1);
		}
		if (m[5]) {
			date.setDate(m[5]);
			check.setDate(m[5]);
		}
		fixDate(date, check);
		if (m[7]) {
			date.setHours(m[7]);
		}
		if (m[8]) {
			date.setMinutes(m[8]);
		}
		if (m[10]) {
			date.setSeconds(m[10]);
		}
		if (m[12]) {
			date.setMilliseconds(Number("0." + m[12]) * 1000);
		}
		fixDate(date, check);
	}else{
		date.setUTCFullYear(
			m[1],
			m[3] ? m[3] - 1 : 0,
			m[5] || 1
		);
		date.setUTCHours(
			m[7] || 0,
			m[8] || 0,
			m[10] || 0,
			m[12] ? Number("0." + m[12]) * 1000 : 0
		);
		if (m[14]) {
			var offset = Number(m[16]) * 60 + (m[18] ? Number(m[18]) : 0);
			offset *= m[15] == '-' ? 1 : -1;
			date = new Date(+date + (offset * 60 * 1000));
		}
	}
	return date;
}

function parseTime(s) { // returns minutes since start of day
	if (typeof s == 'number') { // an hour
		return s * 60;
	}
	if (typeof s == 'object') { // a Date object
		return s.getHours() * 60 + s.getMinutes();
	}
	var m = s.match(/(\d+)(?::(\d+))?\s*(\w+)?/);
	if (m) {
		var h = parseInt(m[1], 10);
		if (m[3]) {
			h %= 12;
			if (m[3].toLowerCase().charAt(0) == 'p') {
				h += 12;
			}
		}
		return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
	}
}

/* Date Formatting
-----------------------------------------------------------------------------*/
// TODO: use same function formatDate(date, [date2], format, [options])

function formatDate(date, format, options) {
	return formatDates(date, null, format, options);
}

function formatDates(date1, date2, format, options) {
	options = options || defaults;
	var date = date1,
		otherDate = date2,
		i, len = format.length, c,
		i2, formatter,
		res = '';
	for (i=0; i<len; i++) {
		c = format.charAt(i);
		if (c == "'") {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == "'") {
					if (date) {
						if (i2 == i+1) {
							res += "'";
						}else{
							res += format.substring(i+1, i2);
						}
						i = i2;
					}
					break;
				}
			}
		}
		else if (c == '(') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ')') {
					var subres = formatDate(date, format.substring(i+1, i2), options);
					if (parseInt(subres.replace(/\D/, ''), 10)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '[') {
			for (i2=i+1; i2<len; i2++) {
				if (format.charAt(i2) == ']') {
					var subformat = format.substring(i+1, i2);
					var subres = formatDate(date, subformat, options);
					if (subres != formatDate(otherDate, subformat, options)) {
						res += subres;
					}
					i = i2;
					break;
				}
			}
		}
		else if (c == '{') {
			date = date2;
			otherDate = date1;
		}
		else if (c == '}') {
			date = date1;
			otherDate = date2;
		}
		else {
			for (i2=len; i2>i; i2--) {
				if (formatter = dateFormatters[format.substring(i, i2)]) {
					if (date) {
						res += formatter(date, options);
					}
					i = i2 - 1;
					break;
				}
			}
			if (i2 == i) {
				if (date) {
					res += c;
				}
			}
		}
	}
	return res;
};

var dateFormatters = {
	s	: function(d)	{return d.getSeconds() },
	ss	: function(d)	{return zeroPad(d.getSeconds())},
	m	: function(d)	{return d.getMinutes()},
	mm	: function(d)	{return zeroPad(d.getMinutes())},
	h	: function(d)	{return d.getHours() % 12 || 12},
	hh	: function(d)	{return zeroPad(d.getHours() % 12 || 12)},
	H	: function(d)	{return d.getHours()},
	HH	: function(d)	{return zeroPad(d.getHours())},
	d	: function(d)	{return d.getDate()},
	dd	: function(d)	{return zeroPad(d.getDate())},
	ddd	: function(d,o)	{return o.dayNamesShort[d.getDay()]},
	dddd: function(d,o)	{return o.dayNames[d.getDay()]},
	W	: function(d)	{return getWeekNumber(d)},
	M	: function(d)	{return d.getMonth() + 1},
	MM	: function(d)	{return zeroPad(d.getMonth() + 1)},
	MMM	: function(d,o)	{return o.monthNamesShort[d.getMonth()]},
	MMMM: function(d,o)	{return o.monthNames[d.getMonth()]},
	yy	: function(d)	{return (d.getFullYear()+'').substring(2)},
	yyyy: function(d)	{return d.getFullYear()},
	t	: function(d)	{return d.getHours() < 12 ? 'a' : 'p'},
	tt	: function(d)	{return d.getHours() < 12 ? 'am' : 'pm'},
	T	: function(d)	{return d.getHours() < 12 ? 'A' : 'P'},
	TT	: function(d)	{return d.getHours() < 12 ? 'AM' : 'PM'},
	u	: function(d)	{return formatDate(d, "yyyy-MM-dd'T'HH:mm:ss'Z'")},
	S	: function(d)	{
		var date = d.getDate();
		if (date > 10 && date < 20) {
			return 'th';
		}
		return ['st', 'nd', 'rd'][date%10-1] || 'th';
	}
};

fc.applyAll = applyAll;

/* Event Date Math
-----------------------------------------------------------------------------*/

function exclEndDay(event) {
	if (event.end) {
		return _exclEndDay(event.end, event.allDay);
	}else{
		return addDays(cloneDate(event.start), 1);
	}
}

function _exclEndDay(end, allDay) {
	end = cloneDate(end);
	return allDay || end.getHours() || end.getMinutes() ? addDays(end, 1) : clearTime(end);
}

function segCmp(a, b) {
	return (b.msLength - a.msLength) * 100 + (a.event.start - b.event.start);
}

function segsCollide(seg1, seg2) {
	return seg1.end > seg2.start && seg1.start < seg2.end;
}

/* Event Sorting
-----------------------------------------------------------------------------*/

// event rendering utilities
function sliceSegs(events, visEventEnds, start, end) {
	var segs = [],
		i, len=events.length, event,
		eventStart, eventEnd,
		segStart, segEnd,
		isStart, isEnd;
	for (i=0; i<len; i++) {
		event = events[i];
		eventStart = event.start;
		eventEnd = visEventEnds[i];
		if (eventEnd > start && eventStart < end) {
			if (eventStart < start) {
				segStart = cloneDate(start);
				isStart = false;
			}else{
				segStart = eventStart;
				isStart = true;
			}
			if (eventEnd > end) {
				segEnd = cloneDate(end);
				isEnd = false;
			}else{
				segEnd = eventEnd;
				isEnd = true;
			}
			segs.push({
				event: event,
				start: segStart,
				end: segEnd,
				isStart: isStart,
				isEnd: isEnd,
				msLength: segEnd - segStart
			});
		}
	}
	return segs.sort(segCmp);
}

// event rendering calculation utilities
function stackSegs(segs) {
	var levels = [],
		i, len = segs.length, seg,
		j, collide, k;
	for (i=0; i<len; i++) {
		seg = segs[i];
		j = 0; // the level index where seg should belong
		while (true) {
			collide = false;
			if (levels[j]) {
				for (k=0; k<levels[j].length; k++) {
					if (segsCollide(levels[j][k], seg)) {
						collide = true;
						break;
					}
				}
			}
			if (collide) {
				j++;
			}else{
				break;
			}
		}
		if (levels[j]) {
			levels[j].push(seg);
		}else{
			levels[j] = [seg];
		}
	}
	return levels;
}

/* Event Element Binding
-----------------------------------------------------------------------------*/

function lazySegBind(container, segs, bindHandlers) {
	container.unbind('mouseover').mouseover(function(ev) {
		var parent=ev.target, e,
			i, seg;
		while (parent != this) {
			e = parent;
			parent = parent.parentNode;
		}
		if ((i = e._fci) !== undefined) {
			e._fci = undefined;
			seg = segs[i];
			bindHandlers(seg.event, seg.element, seg);
			$(ev.target).trigger(ev);
		}
		ev.stopPropagation();
	});
}

/* Element Dimensions
-----------------------------------------------------------------------------*/

function setOuterWidth(element, width, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.width(Math.max(0, width - hsides(e, includeMargins)));
	}
}

function setOuterHeight(element, height, includeMargins) {
	for (var i=0, e; i<element.length; i++) {
		e = $(element[i]);
		e.height(Math.max(0, height - vsides(e, includeMargins)));
	}
}

function hsides(element, includeMargins) {
	return hpadding(element) + hborders(element) + (includeMargins ? hmargins(element) : 0);
}

function hpadding(element) {
	return (parseFloat($.css(element[0], 'paddingLeft', true)) || 0) +
		(parseFloat($.css(element[0], 'paddingRight', true)) || 0);
}

function hmargins(element) {
	return (parseFloat($.css(element[0], 'marginLeft', true)) || 0) +
		(parseFloat($.css(element[0], 'marginRight', true)) || 0);
}

function hborders(element) {
	return (parseFloat($.css(element[0], 'borderLeftWidth', true)) || 0) +
		(parseFloat($.css(element[0], 'borderRightWidth', true)) || 0);
}

function vsides(element, includeMargins) {
	return vpadding(element) +  vborders(element) + (includeMargins ? vmargins(element) : 0);
}

function vpadding(element) {
	return (parseFloat($.css(element[0], 'paddingTop', true)) || 0) +
		(parseFloat($.css(element[0], 'paddingBottom', true)) || 0);
}

function vmargins(element) {
	return (parseFloat($.css(element[0], 'marginTop', true)) || 0) +
		(parseFloat($.css(element[0], 'marginBottom', true)) || 0);
}

function vborders(element) {
	return (parseFloat($.css(element[0], 'borderTopWidth', true)) || 0) +
		(parseFloat($.css(element[0], 'borderBottomWidth', true)) || 0);
}

function setMinHeight(element, height) {
	height = (typeof height == 'number' ? height + 'px' : height);
	element.each(function(i, _element) {
		_element.style.cssText += ';min-height:' + height + ';_height:' + height;
		// why can't we just use .css() ? i forget
	});
}

/* Misc Utils
-----------------------------------------------------------------------------*/

//TODO: arraySlice
//TODO: isFunction, grep ?

function noop() { }

function cmp(a, b) {
	return a - b;
}

function arrayMax(a) {
	return Math.max.apply(Math, a);
}

function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}

function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
	if (obj[name] !== undefined) {
		return obj[name];
	}
	var parts = name.split(/(?=[A-Z])/),
		i=parts.length-1, res;
	for (; i>=0; i--) {
		res = obj[parts[i].toLowerCase()];
		if (res !== undefined) {
			return res;
		}
	}
	return obj[''];
}

function htmlEscape(s) {
	return s.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#039;')
		.replace(/"/g, '&quot;')
		.replace(/\n/g, '<br />');
}

function cssKey(_element) {
	return _element.id + '/' + _element.className + '/' + _element.style.cssText.replace(/(^|;)\s*(top|left|width|height)\s*:[^;]*/ig, '');
}

function disableTextSelection(element) {
	element
		.attr('unselectable', 'on')
		.css('MozUserSelect', 'none')
		.bind('selectstart.ui', function() { return false; });
}

/*
function enableTextSelection(element) {
	element
		.attr('unselectable', 'off')
		.css('MozUserSelect', '')
		.unbind('selectstart.ui');
}
*/

function markFirstLast(e) {
	e.children()
		.removeClass('fc-first fc-last')
		.filter(':first-child')
			.addClass('fc-first')
		.end()
		.filter(':last-child')
			.addClass('fc-last');
}

function setDayID(cell, date, opt) {
	cell.each(function(i, _cell) {
		_cell.className = _cell.className.replace(/^fc-\w*( fc-weekend-day)?/, 'fc-' + dayIDs[date.getDay()] + (opt('weekendDays').length>0 && opt('weekendDays').indexOf(date.getDay())!=-1 ? ' fc-weekend-day' : ''));
		// TODO: make a way that doesn't rely on order of classes
	});
}

function getSkinCss(event, opt) {
	var source = event.source || {};
	var eventColor = event.color;
	var sourceColor = source.color;
	var optionColor = opt('eventColor');
	var backgroundColor =
		event.backgroundColor ||
		eventColor ||
		source.backgroundColor ||
		sourceColor ||
		opt('eventBackgroundColor') ||
		optionColor;
	var borderColor =
		event.borderColor ||
		eventColor ||
		source.borderColor ||
		sourceColor ||
		opt('eventBorderColor') ||
		optionColor;
	var textColor =
		event.textColor ||
		source.textColor ||
		opt('eventTextColor');
	var statements = [];
	if (backgroundColor) {
		statements.push('background-color:' + backgroundColor);
	}
	if (borderColor) {
		statements.push('border-color:' + borderColor);
	}
	if (textColor) {
		statements.push('color:' + textColor);
	}
	return statements.join(';');
}

function applyAll(functions, thisObj, args) {
	if ($.isFunction(functions)) {
		functions = [ functions ];
	}
	if (functions) {
		var i;
		var ret;
		for (i=0; i<functions.length; i++) {
			ret = functions[i].apply(thisObj, args) || ret;
		}
		return ret;
	}
}

function firstDefined() {
	for (var i=0; i<arguments.length; i++) {
		if (arguments[i] !== undefined) {
			return arguments[i];
		}
	}
}

fcViews.month = MonthView;

function MonthView(element, calendar) {
	var t = this;

	// exports
	t.render = render;

	// imports
	BasicView.call(t, element, calendar, 'month');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDate = calendar.formatDate;

	function render(date, delta) {
		if (delta) {
			addMonths(date, delta);
			date.setDate(1);
		}
		var start = cloneDate(date, true);
		start.setDate(1);
		var end = addMonths(cloneDate(start), 1);
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var firstDay = opt('firstDay');
		var nwe = opt('weekends') ? 0 : 1;
		if (nwe) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
		addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
		var rowCnt = Math.round((visEnd - visStart) / (DAY_MS * 7));
		if (opt('weekMode') == 'fixed') {
			addDays(visEnd, (6 - rowCnt) * 7);
			rowCnt = 6;
		}
		t.title = formatDate(start, opt('titleFormat'));
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderBasic(6, rowCnt, nwe ? 5 : 7, true);
	}
}

fcViews.multiWeek = MultiWeekView;

function MultiWeekView(element, calendar) {
	var t = this;

	// exports
	t.render = render;

	// imports
	BasicView.call(t, element, calendar, 'multiWeek');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDates = calendar.formatDates;

	function render(date, delta) {
		if (delta) {
			addDays(date, delta * opt('multiWeekSize') * 7);
		}
		//Adjust displayed date-range, to make sure today will always stay in the top row
		var currentDate = cloneDate(new Date(), true);
		var dateWeekStart = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var currentWeekStart = addDays(cloneDate(currentDate), -((currentDate.getDay() - opt('firstDay') + 7) % 7));
		if(opt('multiWeekSize')>0)
			addDays(date, -(( - (Math.abs(Math.ceil(dayDiff(dateWeekStart, currentWeekStart) / 7)) % opt('multiWeekSize'))) % opt('multiWeekSize')) * 7);

		//var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var start = cloneDate(date);
		//var end = addDays(cloneDate(start), opt('multiWeekSize') * 7);
		//var visStart = cloneDate(start);
		var visStart = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(visStart), opt('multiWeekSize') * 7);
		var visEnd = cloneDate(end);

		var firstDay = opt('firstDay');
		var nwe = opt('weekends') ? 0 : 1;
		if (nwe) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}

		addDays(visStart, -((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
		addDays(visEnd, (7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);

		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderBasic(opt('multiWeekSize'), opt('multiWeekSize'), nwe ? 5 : 7, true);
	}
}

fcViews.basicWeek = BasicWeekView;

function BasicWeekView(element, calendar) {
	var t = this;

	// exports
	t.render = render;

	// imports
	BasicView.call(t, element, calendar, 'basicWeek');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDates = calendar.formatDates;

	function render(date, delta) {
		if (delta) {
			addDays(date, delta * 7);
		}
		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var weekends = opt('weekends');
		if (!weekends) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderBasic(1, 1, weekends ? 7 : 5, false);
	}
}

fcViews.basicDay = BasicDayView;

//TODO: when calendar's date starts out on a weekend, shouldn't happen

function BasicDayView(element, calendar) {
	var t = this;

	// exports
	t.render = render;

	// imports
	BasicView.call(t, element, calendar, 'basicDay');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDate = calendar.formatDate;

	function render(date, delta) {
		if (delta) {
			addDays(date, delta);
			if (!opt('weekends')) {
				skipWeekend(date, delta < 0 ? -1 : 1);
			}
		}
		t.title = formatDate(date, opt('titleFormat'));
		t.start = t.visStart = cloneDate(date, true);
		t.end = t.visEnd = addDays(cloneDate(t.start), 1);
		renderBasic(1, 1, 1, false);
	}
}

setDefaults({
	weekMode: 'fixed'
});

function BasicView(element, calendar, viewName) {
	var t = this;

	// exports
	t.renderBasic = renderBasic;
	t.setHeight = setHeight;
	t.setWidth = setWidth;
	t.renderDayOverlay = renderDayOverlay;
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderSelection = renderSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // for selection (kinda hacky)
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	t.defaultEventEnd = defaultEventEnd;
	t.getHoverListener = function() { return hoverListener };
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.dayOfWeekCol = dayOfWeekCol;
	t.dateCell = dateCell;
	t.cellDate = cellDate;
	t.cellIsAllDay = function() { return true };
	t.allDayRow = allDayRow;
	t.allDayBounds = allDayBounds;
	t.getRowCnt = function() { return rowCnt };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getDaySegmentContainer = function() { return daySegmentContainer };
	t.updateGrid = updateGrid;
	t.updateToday = updateToday;
	t.setAxisFormat = setAxisFormat;
	t.setStartOfBusiness = setStartOfBusiness;
	t.setEndOfBusiness = setEndOfBusiness;
	t.setWeekendDays = setWeekendDays;
	t.setBindingMode = setBindingMode;
	t.setSelectable = setSelectable;

	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	BasicEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var daySelectionMousedown = t.daySelectionMousedown;
	var formatDate = calendar.formatDate;

	// locals
	var head;
	var headCells;
	var body;
	var bodyRows;
	var bodyCells;
	var bodyFirstCells;
	var bodyCellTopInners;
	var daySegmentContainer;

	var viewWidth;
	var viewHeight;
	var colWidth;

	var rowCnt, colCnt;
	var coordinateGrid;
	var hoverListener;
	var colContentPositions;

	var rtl, dis, dit;
	var firstDay;
	var nwe;
	var tm;
	var colFormat;

	/* Rendering
	------------------------------------------------------------*/

	disableTextSelection(element.addClass('fc-grid'));

	function renderBasic(maxr, r, c, showNumbers) {
		rowCnt = r;
		colCnt = c;
		updateOptions();
		var firstTime = !body;
		if (firstTime) {
			buildSkeleton(maxr, showNumbers);
		}else{
			clearEvents();
		}
		updateCells(true);
	}

	function updateOptions() {
		rtl = opt('isRTL');
		if (rtl) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat');
	}

	function buildSkeleton(maxRowCnt, showNumbers) {
		var s;
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var i, j;
		var table;

		s =
			"<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
			"<thead>" +
			"<tr>";
		for (i=0; i<colCnt; i++) {
			s +=
				"<th class='fc- " + headerClass + "'/>"; // need fc- for setDayID
		}
		s +=
			"</tr>" +
			"</thead>" +
			"<tbody>";
		for (i=0; i<maxRowCnt; i++) {
			s +=
				"<tr class='fc-week" + i + "'>";
			for (j=0; j<colCnt; j++) {
				s +=
					"<td class='fc- " + contentClass + " fc-day" + (i*colCnt+j) + "'>" + // need fc- for setDayID
					"<div>" +
					(showNumbers ?
						"<div class='fc-day-header'><div class='fc-week-number'/><div class='fc-day-text'/><div class='fc-day-number'/></div>" :
						''
						) +
					"<div class='fc-day-content'>" +
					"<div style='position:relative'>&nbsp;</div>" +
					"</div>" +
					"</div>" +
					"</td>";
			}
			s +=
				"</tr>";
		}
		s +=
			"</tbody>" +
			"</table>";
		table = $(s).appendTo(element);

		head = table.find('thead');
		headCells = head.find('th');
		body = table.find('tbody');
		bodyRows = body.find('tr');
		bodyCells = body.find('td');
		bodyFirstCells = bodyCells.filter(':first-child');
		bodyCellTopInners = bodyRows.eq(0).find('div.fc-day-content div');

		markFirstLast(head.add(head.find('tr'))); // marks first+last tr/th's
		markFirstLast(bodyRows); // marks first+last td's
		bodyRows.eq(0).addClass('fc-first'); // fc-last is done in updateCells

		dayBind(bodyCells);
		daySegmentContainer =
			$("<div style='position:absolute;z-index:8;top:0;left:0'/>")
				.appendTo(element);
	}

	function updateCells(firstTime) {
		var dowDirty = firstTime || rowCnt == 1; // could the cells' day-of-weeks need updating?
		var month = t.start.getMonth();
		var today = clearTime(new Date());
		var cell;
		var date;
		var row;

		if (dowDirty) {
			headCells.each(function(i, _cell) {
				cell = $(_cell);
				date = indexDate(i);
				cell.html(formatDate(date, colFormat));
				setDayID(cell, date, opt);
			});
		}

		bodyCells.each(function(i, _cell) {
			cell = $(_cell);
			date = indexDate(i);
			if (date.getMonth() == month) {
				cell.removeClass('fc-other-month');
			}else{
				cell.addClass('fc-other-month');
			}
			if(opt('showWeekNumbers') && (i % 7 == 0)) {
				removeWeekNumber(cell, date);
				addWeekNumber(cell, date);
			}
			if (+date == +today) {
				cell.addClass(tm + '-state-highlight fc-today');
				removeTodayText(cell, opt('buttonText', 'today'));
				addTodayText(cell, opt('buttonText', 'today'));
			}else{
				cell.removeClass(tm + '-state-highlight fc-today');
				removeTodayText(cell, opt('buttonText', 'today'));
			}
			cell.find('div.fc-day-number').text(date.getDate());
			if (dowDirty) {
				setDayID(cell, date, opt);
			}
		});

		bodyRows.each(function(i, _row) {
			row = $(_row);
			if (i < rowCnt) {
				row.show();
				if (i == rowCnt-1) {
					row.addClass('fc-last');
				}else{
					row.removeClass('fc-last');
				}
			}else{
				row.hide();
			}
		});
	}

	function updateGrid()
	{
		updateToday();
		setAxisFormat();
		setStartOfBusiness();
		setEndOfBusiness();
		setWeekendDays();
		setBindingMode();
		setSelectable();
	}

	function updateToday()
	{
		var today = clearTime(new Date());
		var cell;
		var date;

		bodyCells.each(function(i, _cell) {
			cell = $(_cell);
			date = indexDate(i);

			if (+date == +today) {
				cell.addClass(tm + '-state-highlight fc-today');
				removeTodayText(cell, opt('buttonText', 'today'));
				addTodayText(cell, opt('buttonText', 'today'));
			}else{
				cell.removeClass(tm + '-state-highlight fc-today');
				removeTodayText(cell, opt('buttonText', 'today'));
			}
		});
	}

	function setAxisFormat()
	{
		// dummy
	}

	function setStartOfBusiness()
	{
		// dummy
	}

	function setEndOfBusiness()
	{
		// dummy
	}

	function setWeekendDays()
	{
		headCells.each(function(i, _cell) {
			setDayID($(_cell), indexDate(i), opt);
		});

		bodyCells.each(function(i, _cell) {
			setDayID($(_cell), indexDate(i), opt);
		});
	}

	function setBindingMode()
	{
		dayBind(bodyCells);
	}

	function setSelectable()
	{
		dayBind(bodyCells);
	}

	function setHeight(height) {
		viewHeight = height;
		var bodyHeight = viewHeight - head.height();
		var rowHeight;
		var rowHeightLast;
		var cell;

		if (opt('weekMode') == 'variable') {
			rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt==1 ? 2 : 6));
		}else{
			rowHeight = Math.floor(bodyHeight / rowCnt);
			rowHeightLast = bodyHeight - rowHeight * (rowCnt-1);
		}

		bodyFirstCells.each(function(i, _cell) {
			if (i < rowCnt) {
				cell = $(_cell);
				setMinHeight(
					cell.find('> div'),
					(i==rowCnt-1 ? rowHeightLast : rowHeight) - vsides(cell)
				);
			}
		});
	}

	function setWidth(width) {
		viewWidth = width;
		colContentPositions.clear();
		colWidth = Math.floor(viewWidth / colCnt);
		setOuterWidth(headCells.slice(0, -1), colWidth);
	}

	/* Day clicking and binding
	-----------------------------------------------------------*/

	function dayBind(days) {
		days.unbind('click dblclick');
		if(opt('bindingMode') == 'double')
			days.dblclick(dayClick).mousedown(daySelectionMousedown);
		else
			days.click(dayClick).mousedown(daySelectionMousedown);
	}

	function dayClick(ev) {
		//if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
			var index = parseInt(this.className.match(/fc\-day(\d+)/)[1]); // TODO: maybe use .data
			var date = indexDate(index);
			trigger('dayClick', this, date, true, ev);
		//}
	}

	/* Semi-transparent Overlay Helpers
	------------------------------------------------------*/

	function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive
		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}
		var rowStart = cloneDate(t.visStart);
		var rowEnd = addDays(cloneDate(rowStart), colCnt);
		for (var i=0; i<rowCnt; i++) {
			var stretchStart = new Date(Math.max(rowStart, overlayStart));
			var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));
			if (stretchStart < stretchEnd) {
				var colStart, colEnd;
				if (rtl) {
					colStart = dayDiff(stretchEnd, rowStart)*dis+dit+1;
					colEnd = dayDiff(stretchStart, rowStart)*dis+dit+1;
				}else{
					colStart = dayDiff(stretchStart, rowStart);
					colEnd = dayDiff(stretchEnd, rowStart);
				}
				dayBind(
					renderCellOverlay(i, colStart, i, colEnd-1)
				);
			}
			addDays(rowStart, 7);
			addDays(rowEnd, 7);
		}
	}

	function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive
		var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
		return renderOverlay(rect, element);
	}

	/* Selection
	-----------------------------------------------------------------------*/

	function defaultSelectionEnd(startDate, allDay) {
		return cloneDate(startDate);
	}

	function renderSelection(startDate, endDate, allDay) {
		renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
	}

	function clearSelection() {
		clearOverlays();
	}

	function reportDayClick(date, allDay, ev) {
		var cell = dateCell(date);
		var _element = bodyCells[cell.row*colCnt + cell.col];
		trigger('dayClick', _element, date, allDay, ev);
	}

	/* External Dragging
	-----------------------------------------------------------------------*/

	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
			}
		}, ev);
	}

	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			var d = cellDate(cell);
			trigger('drop', _dragElement, d, true, ev, ui);
		}
	}

	/* Utilities
	--------------------------------------------------------*/

	function defaultEventEnd(event) {
		return cloneDate(event.start);
	}

	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		headCells.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		bodyRows.each(function(i, _e) {
			if (i < rowCnt) {
				e = $(_e);
				n = e.offset().top;
				if (i) {
					p[1] = n;
				}
				p = [n];
				rows[i] = p;
			}
		});
		p[1] = n + e.outerHeight();
	});

	hoverListener = new HoverListener(coordinateGrid);

	colContentPositions = new HorizontalPositionCache(function(col) {
		return bodyCellTopInners.eq(col);
	});

	function colContentLeft(col) {
		return colContentPositions.left(col);
	}

	function colContentRight(col) {
		return colContentPositions.right(col);
	}

	function dateCell(date) {
		return {
			row: Math.floor(dayDiff(date, t.visStart) / 7),
			col: dayOfWeekCol(date.getDay())
		};
	}

	function cellDate(cell) {
		return _cellDate(cell.row, cell.col);
	}

	function _cellDate(row, col) {
		return addDays(cloneDate(t.visStart), row*7 + col*dis+dit);
		// what about weekends in middle of week?
	}

	function indexDate(index) {
		return _cellDate(Math.floor(index/colCnt), index%colCnt);
	}

	function dayOfWeekCol(dayOfWeek) {
		return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt) * dis + dit;
	}

	function allDayRow(i) {
		return bodyRows.eq(i);
	}

	function allDayBounds(i) {
		return {
			left: 0,
			right: viewWidth
		};
	}

}

function BasicEventRenderer() {
	var t = this;

	// exports
	t.renderEvents = renderEvents;
	t.compileDaySegs = compileSegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.bindDaySeg = bindDaySeg;

	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	//var setOverflowHidden = t.setOverflowHidden;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var eventElementHandlers = t.eventElementHandlers;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getHoverListener = t.getHoverListener;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var renderDaySegs = t.renderDaySegs;
	var resizableDayEvent = t.resizableDayEvent;

	/* Rendering
	--------------------------------------------------------------------*/

	function renderEvents(events, modifiedEventId) {
		reportEvents(events);
		renderDaySegs(compileSegs(events), modifiedEventId, false);
	}

	function clearEvents() {
		reportEventClear();
		getDaySegmentContainer().empty();
	}

	function compileSegs(events) {
		var rowCnt = getRowCnt(),
			colCnt = getColCnt(),
			d1 = cloneDate(t.visStart),
			d2 = addDays(cloneDate(d1), colCnt),
			visEventsEnds = $.map(events, exclEndDay),
			i, row,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<rowCnt; i++) {
			row = stackSegs(sliceSegs(events, visEventsEnds, d1, d2));
			for (j=0; j<row.length; j++) {
				level = row[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.row = i;
					seg.level = j; // not needed anymore
					segs.push(seg);
				}
			}
			addDays(d1, 7);
			addDays(d2, 7);
		}
		return segs;
	}

	function bindDaySeg(event, eventElement, seg) {
		if (isEventDraggable(event)) {
			draggableDayEvent(event, eventElement);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableDayEvent(event, eventElement, seg);
		}
		eventElementHandlers(event, eventElement);
		// needs to be after, because resizableDayEvent might stopImmediatePropagation on click
	}

	/* Dragging
	----------------------------------------------------------------------------*/

	function draggableDayEvent(event, eventElement) {
		var hoverListener = getHoverListener();
		var dayDelta;
		eventElement.draggable({
			zIndex: 9,
			delay: 50,
			scroll: false,
			opacity: opt('dragOpacity'),
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {
				trigger('eventDragStart', eventElement, event, ev, ui);
				//hideEvents(event, eventElement);
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
					clearOverlays();
					if (cell) {
						//setOverflowHidden(true);
						dayDelta = rowDelta*7 + colDelta * (opt('isRTL') ? -1 : 1);
						renderDayOverlay(
							addDays(cloneDate(event.start), dayDelta),
							addDays(exclEndDay(event), dayDelta)
						);
					}else{
						//setOverflowHidden(false);
						dayDelta = 0;
					}
				}, ev, 'drag');
			},
			stop: function(ev, ui) {
				hoverListener.stop();
				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);
				if (dayDelta) {
					eventDrop(this, event, dayDelta, 0, event.allDay, ev, ui);
				}else{
					eventElement.css('filter', ''); // clear IE opacity side-effects
					//showEvents(event, eventElement);
				}
				//setOverflowHidden(false);
			}
		});
	}
}

fcViews.agendaWeek = AgendaWeekView;

function AgendaWeekView(element, calendar) {
	var t = this;

	// exports
	t.render = render;

	// imports
	AgendaView.call(t, element, calendar, 'agendaWeek');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var formatDates = calendar.formatDates;

	function render(date, delta) {
		if (delta) {
			addDays(date, delta * 7);
		}
		var start = addDays(cloneDate(date), -((date.getDay() - opt('firstDay') + 7) % 7));
		var end = addDays(cloneDate(start), 7);
		var visStart = cloneDate(start);
		var visEnd = cloneDate(end);
		var weekends = opt('weekends');
		if (!weekends) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		t.title = formatDates(
			visStart,
			addDays(cloneDate(visEnd), -1),
			opt('titleFormat')
		);
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderAgenda(weekends ? 7 : 5);
	}
}

fcViews.agendaDay = AgendaDayView;

function AgendaDayView(element, calendar) {
	var t = this;

	// exports
	t.render = render;
	t.addedView = null;

	// imports
	AgendaView.call(t, element, calendar, 'agendaDay');
	var opt = t.opt;
	var renderAgenda = t.renderAgenda;
	var formatDate = calendar.formatDate;

	function render(date, delta) {
		if (delta) {
			addDays(date, delta);
			if (!opt('weekends')) {
				skipWeekend(date, delta < 0 ? -1 : 1);
			}
		}
		var start = cloneDate(date, true);
		var end = addDays(cloneDate(start), 1);
		t.title = formatDate(date, opt('titleFormat'));
		t.start = t.visStart = start;
		t.end = t.visEnd = end;
		renderAgenda(1);

		if(t.addedView) {
			t.addedView.render(date);
		}
	}
}

setDefaults({
	allDaySlot: true,
	allDayText: 'all-day',
	firstHour: 6,
	slotMinutes: 30,
	defaultEventMinutes: 120,
	axisFormat: 'h(:mm)tt',
	timeFormat: {
		agenda: 'h:mm{ – h:mm}'
	},
	dragOpacity: {
		agenda: .5
	},
	minTime: 0,
	maxTime: 24
});

// TODO: make it work in quirks mode (event corners, all-day height)
// TODO: test liquid width, especially in IE6

function AgendaView(element, calendar, viewName) {
	var t = this;

	// exports
	t.renderAgenda = renderAgenda;
	t.setWidth = setWidth;
	t.setHeight = setHeight;
	t.beforeHide = beforeHide;
	t.afterShow = afterShow;
	t.defaultEventEnd = defaultEventEnd;
	t.timePosition = timePosition;
	t.dayOfWeekCol = dayOfWeekCol;
	t.dateCell = dateCell;
	t.cellDate = cellDate;
	t.cellIsAllDay = cellIsAllDay;
	t.allDayRow = getAllDayRow;
	t.allDayBounds = allDayBounds;
	t.getHoverListener = function() { return hoverListener };
	t.colContentLeft = colContentLeft;
	t.colContentRight = colContentRight;
	t.getDaySegmentContainer = function() { return daySegmentContainer };
	t.getSlotJumpersTop = function() { return slotJumpersTop };
	t.getSlotJumpersBottom = function() { return slotJumpersBottom };
	t.getslotScroller = function() { return slotScroller };
	t.getSlotContent = function() { return slotContent };
	t.getSlotSegmentContainer = function() { return slotSegmentContainer };
	t.getMinMinute = function() { return minMinute };
	t.getMaxMinute = function() { return maxMinute };
	t.getBodyContent = function() { return slotContent }; // !!??
	t.getRowCnt = function() { return 1 };
	t.getColCnt = function() { return colCnt };
	t.getColWidth = function() { return colWidth };
	t.getSlotHeight = function() { return slotHeight };
	t.defaultSelectionEnd = defaultSelectionEnd;
	t.renderDayOverlay = renderDayOverlay;
	t.renderSelection = renderSelection;
	t.renderSlotSelection = renderSlotSelection;
	t.clearSelection = clearSelection;
	t.reportDayClick = reportDayClick; // selection mousedown hack
	t.dragStart = dragStart;
	t.dragStop = dragStop;
	t.updateGrid = updateGrid;
	t.updateToday = updateToday;
	t.setAxisFormat = setAxisFormat;
	t.setStartOfBusiness = setStartOfBusiness;
	t.setEndOfBusiness = setEndOfBusiness;
	t.setWeekendDays = setWeekendDays;
	t.setBindingMode = setBindingMode;
	t.setSelectable = setSelectable;

	// imports
	View.call(t, element, calendar, viewName);
	OverlayManager.call(t);
	SelectionManager.call(t);
	AgendaEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var renderOverlay = t.renderOverlay;
	var clearOverlays = t.clearOverlays;
	var reportSelection = t.reportSelection;
	var unselect = t.unselect;
	var daySelectionMousedown = t.daySelectionMousedown;
	var slotSegHtml = t.slotSegHtml;
	var formatDate = calendar.formatDate;
	var setTimeIndicator = t.setTimeIndicator;

	// locals
	var dayTable;
	var dayHead;
	var dayHeadCells;
	var dayBody;
	var dayBodyCells;
	var dayBodyCellInners;
	var dayBodyFirstCell;
	var dayBodyFirstCellStretcher;
	var slotLayer;
	var daySegmentContainer;
	var allDayTable;
	var allDayRow;
	var slotJumpersTopContainer;
	var slotJumpersTop;
	var slotJumpersBottomContainer;
	var slotJumpersBottom;
	var slotScroller;
	var slotContent;
	var slotSegmentContainer;
	var dayScroller;
	var dayContent;
	var daySegmentContainer;
	var slotTable;
	var slotTableFirstInner;
	var axisFirstCells;
	var gutterCells;
	var divider;
	var selectionHelper;
	var viewWidth;
	var viewHeight;
	var axisWidth;
	var colWidth;
	var gutterWidth;
	//var gutterAck = false;
	var slotHeight; // TODO: what if slotHeight changes? (see issue 650)
	var savedScrollTop;
	var colCnt;
	var slotCnt;
	var coordinateGrid;
	var hoverListener;
	var colContentPositions;
	var slotTopCache = {};
	var tm;
	var firstDay;
	var nwe;            // no weekends (int)
	var rtl, dis, dit;  // day index sign / translate
	var minMinute, maxMinute;
	var colFormat;

	/* Rendering
	-----------------------------------------------------------------------------*/

	disableTextSelection(element.addClass('fc-agenda'));

	function renderAgenda(c) {
		colCnt = c;
		updateOptions();
		if (!dayTable) {
			buildSkeleton();
		}else{
			clearEvents();
		}
		updateCells();
	}

	function updateOptions() {
		tm = opt('theme') ? 'ui' : 'fc';
		nwe = opt('weekends') ? 0 : 1;
		firstDay = opt('firstDay');
		if (rtl = opt('isRTL')) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}
		minMinute = parseTime(opt('minTime'));
		maxMinute = parseTime(opt('maxTime'));
		colFormat = opt('columnFormat');
	}

	function buildSkeleton() {
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var s;
		var i;
		var d;
		var maxd;
		var minutes;
		var slotNormal = opt('slotMinutes') % 15 == 0;

		s =
			"<table style='width:100%' class='fc-agenda-days fc-border-separate' cellspacing='0'>" +
			"<thead>" +
			"<tr>" +
			"<th class='fc-agenda-axis " + headerClass + "'><div class='fc-week-number'/></th>";
		for (i=0; i<colCnt; i++) {
			s +=
				"<th class='fc- fc-col" + i + ' ' + headerClass + "'/>"; // fc- needed for setDayID
		}
		s +=
			"<th class='fc-agenda-gutter " + headerClass + "'>&nbsp;</th>" +
			"</tr>" +
			"</thead>" +
			"<tbody>" +
			"<tr>" +
			"<th class='fc-agenda-axis " + headerClass + "'>&nbsp;</th>";
		for (i=0; i<colCnt; i++) {
			s +=
				"<td class='fc- fc-col" + i + ' ' + contentClass + "'>" + // fc- needed for setDayID
				"<div>" +
				"<div class='fc-day-content'>" +
				"<div style='position:relative'>&nbsp;</div>" +
				"</div>" +
				"</div>" +
				"</td>";
		}
		s +=
			"<td class='fc-agenda-gutter " + contentClass + "'>&nbsp;</td>" +
			"</tr>" +
			"</tbody>" +
			"</table>";
		dayTable = $(s).appendTo(element);
		dayHead = dayTable.find('thead');
		dayHeadCells = dayHead.find('th').slice(1, -1);
		dayBody = dayTable.find('tbody');
		dayBodyCells = dayBody.find('td').slice(0, -1);
		dayBodyCellInners = dayBodyCells.find('div.fc-day-content div');
		dayBodyFirstCell = dayBodyCells.eq(0);
		dayBodyFirstCellStretcher = dayBodyFirstCell.find('> div');

		markFirstLast(dayHead.add(dayHead.find('tr')));
		markFirstLast(dayBody.add(dayBody.find('tr')));

		axisFirstCells = dayHead.find('th:first');
		gutterCells = dayTable.find('.fc-agenda-gutter');

		slotLayer =
			$("<div style='position:absolute;z-index:2;left:0;width:100%'/>")
				.appendTo(element);

		if(opt('allDaySlot')) {
			dayScroller = $("<div style='position:absolute;width:100%;overflow-x:hidden;overflow-y:auto;'/>").appendTo(slotLayer);
			dayContent = $("<div style='position:relative;width:100%;overflow:hidden;min-height:37px'/>").appendTo(dayScroller);
			daySegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(dayContent);

			s =
				"<table style='width:100%;' class='fc-agenda-allday' cellspacing='0'>" +
				"<tr>" +
				"<th class='" + headerClass + " fc-agenda-axis'>" + opt('allDayText') + "</th>" +
				"<td>" +
				"<div class='fc-day-content'><div style='position:relative;min-height:34px'/></div>" +
				"</td>" +
				"</tr>" +
				"</table>";

			allDayTable = $(s).appendTo(dayScroller);
			allDayRow = allDayTable.find('tr');
			dayBind(allDayRow.find('td'));
			axisFirstCells = axisFirstCells.add(allDayTable.find('th:first'));
			gutterCells = gutterCells.add(allDayTable.find('th.fc-agenda-gutter'));

			divider = $(
				"<div class='fc-agenda-divider " + headerClass + "'>" +
				"<div class='fc-agenda-divider-inner'/>" +
				"</div>"
			).appendTo(slotLayer);

		}else{
			daySegmentContainer = $([]); // in jQuery 1.4, we can just do $()
		}

		slotJumpersTopContainer = $("<div style='position:relative;width:100%;'/>").appendTo(slotLayer);
		slotJumpersBottomContainer = $("<div style='position:relative;width:100%;'/>").appendTo(slotLayer);
		slotScroller = $("<div style='position:absolute;width:100%;overflow-x:hidden;overflow-y:auto'/>").appendTo(slotLayer);
		slotContent = $("<div style='position:relative;width:100%;overflow:hidden'/>").appendTo(slotScroller);
		slotSegmentContainer = $("<div style='position:absolute;z-index:8;top:0;left:0'/>").appendTo(slotContent);

		for (i=0; i<colCnt; i++) {
			slotJumpersTopContainer.append($('<div class="fc-slot-jumper-top"/>'));
			slotJumpersBottomContainer.append($('<div class="fc-slot-jumper-bottom"/>'));
		}
		slotJumpersTop = slotJumpersTopContainer.children();
		slotJumpersBottom = slotJumpersBottomContainer.children();

		s =
			"<table class='fc-agenda-slots' style='width:100%' cellspacing='0'>" +
			"<tbody>";
		d = zeroDate();
		maxd = addMinutes(cloneDate(d), maxMinute);
		addMinutes(d, minMinute);
		slotCnt = 0;

		var startOfBusiness = opt("startOfBusiness") * (60/opt("slotMinutes"));
		var endOfBusiness = (opt("endOfBusiness") - (opt("slotMinutes")/60)) * (60/opt("slotMinutes"));
		for (i=0; d < maxd; i++) {
			minutes = d.getMinutes();
			var nonBusinessHours = (i < startOfBusiness || i > endOfBusiness) ? " fc-non-business-hours" : "";
			s +=
				"<tr class='fc-slot" + i + ' ' + (!minutes ? '' : 'fc-minor') + nonBusinessHours + "'>" +
				"<th class='fc-agenda-axis " + headerClass + "'>" +
				((!slotNormal || !minutes) ? formatDate(d, opt('axisFormat')) : '&nbsp;') +
				"</th>" +
				"<td class='" + contentClass + "'>" +
				"<div style='position:relative'>&nbsp;</div>" +
				"</td>" +
				"</tr>";
			addMinutes(d, opt('slotMinutes'));
			slotCnt++;
		}
		s +=
			"</tbody>" +
			"</table>";
		slotTable = $(s).appendTo(slotContent);
		slotTableFirstInner = slotTable.find('div:first');
		slotBind(slotTable.find('td'));
		axisFirstCells = axisFirstCells.add(slotTable.find('th:first'));
	}

	function updateCells() {
		var i;
		var headCell;
		var bodyCell;
		var axisCell;
		var date;
		var today = clearTime(new Date());
		axisCell = axisFirstCells[0];

		if(opt('showWeekNumbers')) {
			removeWeekNumber($(axisCell), colDate(0));
			addWeekNumber($(axisCell), colDate(0));
		}
		for (i=0; i<colCnt; i++) {
			date = colDate(i);
			headCell = dayHeadCells.eq(i);
			headCell.html(formatDate(date, colFormat));
			bodyCell = dayBodyCells.eq(i);
			setDayID(headCell.add(bodyCell), date, opt);
			if (+date == +today) {
				bodyCell.addClass(tm + '-state-highlight fc-today');
				addTodayClass(bodyCell);
			}else{
				bodyCell.removeClass(tm + '-state-highlight fc-today');
				removeTodayClass(bodyCell);
			}
		}
	}

	function updateGrid()
	{
		updateToday();
		setTimeIndicator();
		setAxisFormat();
		setStartOfBusiness();
		setEndOfBusiness();
		setWeekendDays();
		setBindingMode();
		setSelectable();
	}

	function updateToday()
	{
		var i;
		var bodyCell;
		var date;
		var today = clearTime(new Date());
		for (i=0; i<colCnt; i++) {
			date = colDate(i);
			bodyCell = dayBodyCells.eq(i);
			if (+date == +today) {
				bodyCell.addClass(tm + '-state-highlight fc-today');
				addTodayClass(bodyCell);
			}else{
				bodyCell.removeClass(tm + '-state-highlight fc-today');
				removeTodayClass(bodyCell);
			}
		}
	}

	function setAxisFormat()
	{
		var slotNormal = opt('slotMinutes') % 15 == 0;
		var d = zeroDate();
		addMinutes(d, minMinute);

		slotTable.find('th').each(function(index, element){
			var minutes = d.getMinutes();
			$(element).html((!slotNormal || !minutes) ? formatDate(d, opt('axisFormat')) : '&nbsp;');
			addMinutes(d, opt('slotMinutes'));
		});
	}

	function setStartOfBusiness()
	{
		updateBusinessHours();
	}

	function setEndOfBusiness()
	{
		updateBusinessHours();
	}

	function updateBusinessHours()
	{
		var startOfBusiness = opt("startOfBusiness") * (60/opt("slotMinutes"));
		var endOfBusiness = (opt("endOfBusiness") - (opt("slotMinutes")/60)) * (60/opt("slotMinutes"));
		slotTable.find('tr').each(function(index, element){
			if(index < startOfBusiness || index > endOfBusiness)
				$(element).addClass('fc-non-business-hours');
			else
				$(element).removeClass('fc-non-business-hours');
		});
	}

	function setWeekendDays()
	{
		dayHeadCells.each(function(i, _cell) {
			setDayID($(_cell),  colDate(i), opt);
		});

		dayBodyCells.each(function(i, _cell) {
			setDayID($(_cell),  colDate(i), opt);
		});
	}

	function setBindingMode()
	{
		dayBind(allDayRow.find('td'));
		slotBind(slotTable.find('td'));
	}

	function setSelectable()
	{
		dayBind(allDayRow.find('td'));
		slotBind(slotTable.find('td'));
	}

	function setHeight(height, dateChanged) {
		if (height === undefined) {
			height = viewHeight;
		}
		viewHeight = height;
		slotTopCache = {};

		var headHeight = dayBody.position().top;
		var allDayHeight = opt('allDaySlot') ? 4 : 0; //if divider is present
		var bodyHeight = Math.min( // total body height, including borders
			height - headHeight,   // when scrollbars
			slotTable.height() + allDayHeight + 1 // when no scrollbars. +1 for bottom border
		);

		var maxAllDayHeight = Math.floor((bodyHeight - allDayHeight - 1) / 3);
		dayScroller.css('max-height', maxAllDayHeight + 3);
		allDayRow.find('div:first').children().css('max-height', maxAllDayHeight);

		allDayHeight = allDayTable.height();
		if(opt('allDaySlot')) {
			divider.css('position', 'relative');
			divider.css('top', allDayHeight);
			slotScroller.css('top', allDayHeight + 4);
		}

		//allDayHeight = slotScroller.position().top; // including divider
		bodyHeight = Math.min( // total body height, including borders
			height - headHeight,   // when scrollbars
			slotTable.height() + allDayHeight + 1 // when no scrollbars. +1 for bottom border
		);

		dayBodyFirstCellStretcher
			.height(bodyHeight - vsides(dayBodyFirstCell));

		var slotScrollerHeight = bodyHeight - allDayHeight - 1 - (opt('allDaySlot') ? 4 : 0);
		slotLayer.css('top', headHeight);
		slotScroller.height(slotScrollerHeight);
		slotHeight = slotTableFirstInner.height() + 1; // +1 for border

		slotJumpersTopContainer.css('top', allDayHeight+1);
		slotJumpersBottomContainer.css('top', slotScrollerHeight + allDayHeight + 1 - slotJumpersBottom.first().height());

		if (dateChanged) {
			resetScroll();
		}

		if(t.addedView) {
			t.addedView.setHeight(height, dateChanged);
		}
	}

	function setWidth(width) {
		if (width === undefined) {
			width = viewWidth;
		}
		viewWidth = width;
		if(t.addedView) {
			var outerWidth = Math.floor(element.parent().width() / 2);
			element.css({'width' : outerWidth});
			viewWidth = outerWidth;
		}
		colContentPositions.clear();

		axisWidth = 0;
		setOuterWidth(
			axisFirstCells
				.width('')
				.each(function(i, _cell) {
					axisWidth = Math.max(axisWidth, $(_cell).outerWidth());
				}),
			axisWidth
		);

		var slotTableWidth = slotScroller[0].clientWidth; // needs to be done after axisWidth (for IE7)
		//slotTable.width(slotTableWidth);

		//var oldGutterWidth = gutterWidth;
		gutterWidth = slotScroller.width() - slotTableWidth || dayScroller.width() - dayContent.width();
		if (gutterWidth) {
			/*if(!gutterAck) {
				viewWidth -= gutterWidth;
				gutterAck = true;
			}*/
			setOuterWidth(gutterCells, gutterWidth);
			gutterCells
				.show()
				.prev()
				.removeClass('fc-last');
		}else{
			/*if(gutterAck) {
				viewWidth += oldGutterWidth;
				gutterAck = false;
			}*/
			gutterCells
				.hide()
				.prev()
				.addClass('fc-last');
		}

		colWidth = Math.floor((slotTableWidth - axisWidth) / colCnt);
		setOuterWidth(dayHeadCells.slice(0, -1), colWidth);

		slotJumpersTop.each(function(i,e){
			var jumper=$(e);
			jumper.css('left',axisWidth + (colWidth*(i+1)) - 1 - jumper.width());
		});
		slotJumpersBottom.each(function(i,e){
			var jumper=$(e);
			jumper.css('left',axisWidth + (colWidth*(i+1)) - 1 - jumper.width());
		});

		if(t.addedView) {
			t.addedView.setWidth(outerWidth);
		}
	}

	function resetScroll() {
		var d0 = zeroDate();
		var scrollDate = cloneDate(d0);
		scrollDate.setHours(opt('firstHour'));
		var top = timePosition(d0, scrollDate) + 1; // +1 for the border
		function scroll() {
			slotScroller.scrollTop(top);
		}
		scroll();
		setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
	}

	function beforeHide() {
		savedScrollTop = slotScroller.scrollTop();
	}

	function afterShow() {
		slotScroller.scrollTop(savedScrollTop);
	}

	/* Slot/Day clicking and binding
	-----------------------------------------------------------------------*/

	function dayBind(cells) {
		cells.unbind('click dblclick');
		if(opt('bindingMode') == 'double')
			cells.dblclick(daySlotClick).mousedown(daySelectionMousedown);
		else
			cells.click(daySlotClick).mousedown(daySelectionMousedown);
	}

	function slotBind(cells) {
		cells.unbind('click dblclick');
		if(opt('bindingMode') == 'double')
			cells.dblclick(slotClick).mousedown(slotSelectionMousedown);
		else
			cells.click(slotClick).mousedown(slotSelectionMousedown);
	}

	function daySlotClick(ev) {
		var col = Math.min(colCnt-1, Math.floor((ev.pageX - dayTable.offset().left - axisWidth) / colWidth));
		var date = colDate(col);
		trigger('dayClick', dayBodyCells[col], date, true, ev);
	}

	function slotClick(ev) {
		//if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
			var col = Math.min(colCnt-1, Math.floor((ev.pageX - dayTable.offset().left - axisWidth) / colWidth));
			var date = colDate(col);
			var rowMatch = this.parentNode.className.match(/fc-slot(\d+)/); // TODO: maybe use data
			if (rowMatch) {
				var mins = parseInt(rowMatch[1]) * opt('slotMinutes');
				var hours = Math.floor(mins/60);
				date.setHours(hours);
				date.setMinutes(mins%60 + minMinute);
				trigger('dayClick', dayBodyCells[col], date, false, ev);
			}else{
				trigger('dayClick', dayBodyCells[col], date, true, ev);
			}
		//}
	}

	/* Semi-transparent Overlay Helpers
	-----------------------------------------------------*/

	function renderDayOverlay(startDate, endDate, refreshCoordinateGrid) { // endDate is exclusive
		if (refreshCoordinateGrid) {
			coordinateGrid.build();
		}
		var visStart = cloneDate(t.visStart);
		var startCol, endCol;
		if (rtl) {
			startCol = dayDiff(endDate, visStart)*dis+dit+1;
			endCol = dayDiff(startDate, visStart)*dis+dit+1;
		}else{
			startCol = dayDiff(startDate, visStart);
			endCol = dayDiff(endDate, visStart);
		}
		startCol = Math.max(0, startCol);
		endCol = Math.min(colCnt, endCol);
		if (startCol < endCol) {
			dayBind(
				renderCellOverlay(0, startCol, 0, endCol-1)
			);
		}
	}

	function renderCellOverlay(row0, col0, row1, col1) { // only for all-day?
		var rect = coordinateGrid.rect(row0, col0, row1, col1, slotLayer);
		return renderOverlay(rect, slotLayer);
	}

	function renderSlotOverlay(overlayStart, overlayEnd) {
		var dayStart = cloneDate(t.visStart);
		var dayEnd = addDays(cloneDate(dayStart), 1);
		for (var i=0; i<colCnt; i++) {
			var stretchStart = new Date(Math.max(dayStart, overlayStart));
			var stretchEnd = new Date(Math.min(dayEnd, overlayEnd));
			if (stretchStart < stretchEnd) {
				var col = i*dis+dit;
				var rect = coordinateGrid.rect(0, col, 0, col, slotContent); // only use it for horizontal coords
				var top = timePosition(dayStart, stretchStart);
				var bottom = timePosition(dayStart, stretchEnd);
				rect.top = top;
				rect.height = bottom - top;
				slotBind(
					renderOverlay(rect, slotContent)
				);
			}
			addDays(dayStart, 1);
			addDays(dayEnd, 1);
		}
	}

	/* Coordinate Utilities
	-----------------------------------------------------------------------------*/

	coordinateGrid = new CoordinateGrid(function(rows, cols) {
		var e, n, p;
		dayHeadCells.each(function(i, _e) {
			e = $(_e);
			n = e.offset().left;
			if (i) {
				p[1] = n;
			}
			p = [n];
			cols[i] = p;
		});
		p[1] = n + e.outerWidth();
		if (opt('allDaySlot')) {
			e = allDayRow;
			n = e.offset().top;
			rows[0] = [n, n+e.outerHeight()];
		}
		var slotTableTop = slotContent.offset().top;
		var slotScrollerTop = slotScroller.offset().top;
		var slotScrollerBottom = slotScrollerTop + slotScroller.outerHeight();
		function constrain(n) {
			return Math.max(slotScrollerTop, Math.min(slotScrollerBottom, n));
		}
		for (var i=0; i<slotCnt; i++) {
			rows.push([
				constrain(slotTableTop + slotHeight*i),
				constrain(slotTableTop + slotHeight*(i+1))
			]);
		}
	});

	hoverListener = new HoverListener(coordinateGrid);

	colContentPositions = new HorizontalPositionCache(function(col) {
		return dayBodyCellInners.eq(col);
	});

	function colContentLeft(col) {
		return colContentPositions.left(col);
	}

	function colContentRight(col) {
		return colContentPositions.right(col);
	}

	function dateCell(date) { // "cell" terminology is now confusing
		return {
			row: Math.floor(dayDiff(date, t.visStart) / 7),
			col: dayOfWeekCol(date.getDay())
		};
	}

	function cellDate(cell) {
		var d = colDate(cell.col);
		var slotIndex = cell.row;
		if (opt('allDaySlot')) {
			slotIndex--;
		}
		if (slotIndex >= 0) {
			addMinutes(d, minMinute + slotIndex * opt('slotMinutes'));
		}
		return d;
	}

	function colDate(col) { // returns dates with 00:00:00
		return addDays(cloneDate(t.visStart), col*dis+dit);
	}

	function cellIsAllDay(cell) {
		return opt('allDaySlot') && !cell.row;
	}

	function dayOfWeekCol(dayOfWeek) {
		return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt)*dis+dit;
	}

	// get the Y coordinate of the given time on the given day (both Date objects)
	function timePosition(day, time) { // both date objects. day holds 00:00 of current day
		day = cloneDate(day, true);
		if (time < addMinutes(cloneDate(day), minMinute)) {
			return 0;
		}
		if (time >= addMinutes(cloneDate(day), maxMinute)) {
			return slotTable.height();
		}
		var slotMinutes = opt('slotMinutes'),
			minutes = time.getHours()*60 + time.getMinutes() - minMinute,
			slotI = Math.floor(minutes / slotMinutes),
			slotTop = slotTopCache[slotI];
		if (slotTop === undefined) {
			slotTop = slotTopCache[slotI] = slotTable.find('tr:eq(' + slotI + ') td div')[0].offsetTop; //.position().top; // need this optimization???
		}
		return Math.max(0, Math.round(
			slotTop - 1 + slotHeight * ((minutes % slotMinutes) / slotMinutes)
		));
	}

	function allDayBounds() {
		return {
			left: axisWidth,
			right: viewWidth - gutterWidth
		}
	}

	function getAllDayRow(index) {
		return allDayRow;
	}

	function defaultEventEnd(event) {
		var start = cloneDate(event.start);
		if (event.allDay) {
			return start;
		}
		return addMinutes(start, opt('defaultEventMinutes'));
	}

	/* Selection
	---------------------------------------------------------------------------------*/

	function defaultSelectionEnd(startDate, allDay) {
		if (allDay) {
			return cloneDate(startDate);
		}
		return addMinutes(cloneDate(startDate), opt('slotMinutes'));
	}

	function renderSelection(startDate, endDate, allDay) { // only for all-day
		if (allDay) {
			if (opt('allDaySlot')) {
				renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true);
			}
		}else{
			renderSlotSelection(startDate, endDate);
		}
	}

	function renderSlotSelection(startDate, endDate) {
		var helperOption = opt('selectHelper');
		coordinateGrid.build();
		if (helperOption) {
			var col = dayDiff(startDate, t.visStart) * dis + dit;
			if (col >= 0 && col < colCnt) { // only works when times are on same day
				var rect = coordinateGrid.rect(0, col, 0, col, slotContent); // only for horizontal coords
				var top = timePosition(startDate, startDate);
				var bottom = timePosition(startDate, endDate);
				if (bottom > top) { // protect against selections that are entirely before or after visible range
					rect.top = top;
					rect.height = bottom - top;
					rect.left += 2;
					rect.width -= 5;
					if ($.isFunction(helperOption)) {
						var helperRes = helperOption(startDate, endDate);
						if (helperRes) {
							rect.position = 'absolute';
							rect.zIndex = 8;
							selectionHelper = $(helperRes)
								.css(rect)
								.appendTo(slotContent);
						}
					}else{
						rect.isStart = true; // conside rect a "seg" now
						rect.isEnd = true;   //
						selectionHelper = $(slotSegHtml(
							{
								title: '',
								start: startDate,
								end: endDate,
								className: ['fc-select-helper'],
								editable: false
							},
							rect
						));
						selectionHelper.css('opacity', opt('dragOpacity'));
					}
					if (selectionHelper) {
						slotBind(selectionHelper);
						slotContent.append(selectionHelper);
						setOuterWidth(selectionHelper, rect.width, true); // needs to be after appended
						setOuterHeight(selectionHelper, rect.height, true);
					}
				}
			}
		}else{
			renderSlotOverlay(startDate, endDate);
		}
	}

	function clearSelection() {
		clearOverlays();
		if (selectionHelper) {
			selectionHelper.remove();
			selectionHelper = null;
		}
	}

	function slotSelectionMousedown(ev) {
		if (ev.which == 1 && opt('selectable')) { // ev.which==1 means left mouse button
			unselect(ev);
			var dates;
			hoverListener.start(function(cell, origCell) {
				clearSelection();
				if (cell && (cell.col == origCell.col || !opt('selectHelper')) && !cellIsAllDay(cell)) {
					var d1 = cellDate(origCell);
					var d2 = cellDate(cell);
					dates = [
						d1,
						addMinutes(cloneDate(d1), opt('slotMinutes')),
						d2,
						addMinutes(cloneDate(d2), opt('slotMinutes'))
					].sort(cmp);
					renderSlotSelection(dates[0], dates[3]);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						//reportDayClick(dates[0], false, ev);
					}
					reportSelection(dates[0], dates[3], false, ev);
				}
			});
		}
	}

	function reportDayClick(date, allDay, ev) {
		trigger('dayClick', dayBodyCells[dayOfWeekCol(date.getDay())], date, allDay, ev);
	}

	/* External Dragging
	--------------------------------------------------------------------------------*/

	function dragStart(_dragElement, ev, ui) {
		hoverListener.start(function(cell) {
			clearOverlays();
			if (cell) {
				if (cellIsAllDay(cell)) {
					renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
				}else{
					var d1 = cellDate(cell);
					var d2 = addMinutes(cloneDate(d1), opt('defaultEventMinutes'));
					renderSlotOverlay(d1, d2);
				}
			}
		}, ev);
	}

	function dragStop(_dragElement, ev, ui) {
		var cell = hoverListener.stop();
		clearOverlays();
		if (cell) {
			trigger('drop', _dragElement, cellDate(cell), cellIsAllDay(cell), ev, ui);
		}
	}

}

function AgendaEventRenderer() {
	var t = this;

	// exports
	t.renderEvents = renderEvents;
	t.compileDaySegs = compileDaySegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.slotSegHtml = slotSegHtml;
	t.bindDaySeg = bindDaySeg;
	t.setTimeIndicator = setTimeIndicator;

	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	//var setOverflowHidden = t.setOverflowHidden;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var eventEnd = t.eventEnd;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var eventElementHandlers = t.eventElementHandlers;
	var setHeight = t.setHeight;
	var setWidth = t.setWidth;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var getSlotJumpersTop = t.getSlotJumpersTop;
	var getSlotJumpersBottom = t.getSlotJumpersBottom;
	var getslotScroller = t.getslotScroller;
	var getSlotContent = t.getSlotContent;
	var getSlotSegmentContainer = t.getSlotSegmentContainer;
	var getHoverListener = t.getHoverListener;
	var getMaxMinute = t.getMaxMinute;
	var getMinMinute = t.getMinMinute;
	var timePosition = t.timePosition;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var renderDaySegs = t.renderDaySegs;
	var resizableDayEvent = t.resizableDayEvent; // TODO: streamline binding architecture
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var getSlotHeight = t.getSlotHeight;
	var getBodyContent = t.getBodyContent;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventDrop = t.eventDrop;
	var eventResize = t.eventResize;
	var renderDayOverlay = t.renderDayOverlay;
	var renderSlotSelection = t.renderSlotSelection;
	var clearOverlays = t.clearOverlays;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;
	var timeLineInterval;

	/* Rendering
	----------------------------------------------------------------------------*/

	// draw a horizontal line indicating the current time (#143)
	function setTimeIndicator()
	{
		var container = getBodyContent();
		var timeline = container.children('.fc-timeline');
		var arrow = container.children('.fc-timeline-arrow');
		if (timeline.length == 0 || arrow.length == 0) { // if timeline isn't there, add it
			timeline = $('<hr>').addClass('fc-timeline').appendTo(container);
			arrow = $('<div>').addClass('fc-timeline-arrow').appendTo(container);
		}

		var cur_time = new Date();
		var daycol = $('.fc-today', t.element);
		if (daycol.length > 0) {
			timeline.show();
			arrow.show();
		}
		else {
			timeline.hide();
			arrow.hide();
			return;
		}

		var secs = (cur_time.getHours() * 60 * 60) + (cur_time.getMinutes() * 60) + cur_time.getSeconds();
		var percents = secs / 86400; // 24 * 60 * 60 = 86400, # of seconds in a day

		timeline.css('top', Math.floor(container.height() * percents - 1) + 'px');
		arrow.css('top', Math.floor(container.height() * percents - 1) - 5 + 'px');

		var left = daycol.position().left;
		var width = daycol.width();
		timeline.css({ left: left + 'px', width: width + 'px' });
	}

	function renderEvents(events, modifiedEventId) {
		reportEvents(events);
		var i, len=events.length,
			dayEvents=[],
			slotEvents=[];
		for (i=0; i<len; i++) {
			if (events[i].allDay) {
				dayEvents.push(events[i]);
			}else{
				slotEvents.push(events[i]);
			}
		}
		if (opt('allDaySlot')) {
			renderDaySegs(compileDaySegs(dayEvents), modifiedEventId, true);
			setHeight(); // no params means set to viewHeight
			setWidth(); // no params means set to viewWidth
		}
		renderSlotSegs(compileSlotSegs(slotEvents), modifiedEventId);

		if (opt('currentTimeIndicator')) {
			window.clearInterval(timeLineInterval);
			timeLineInterval = window.setInterval(setTimeIndicator, 30000);
			setTimeIndicator();
		}

		if(t.addedView) {
			t.addedView.renderEvents(events, modifiedEventId);
		}
	}

	function clearEvents() {
		reportEventClear();
		getDaySegmentContainer().empty();
		getSlotSegmentContainer().empty();

		if(t.addedView) {
			t.addedView.clearEvents();
		}
	}

	function compileDaySegs(events) {
		var levels = stackSegs(sliceSegs(events, $.map(events, exclEndDay), t.visStart, t.visEnd)),
			i, levelCnt=levels.length, level,
			j, seg,
			segs=[];
		for (i=0; i<levelCnt; i++) {
			level = levels[i];
			for (j=0; j<level.length; j++) {
				seg = level[j];
				seg.row = 0;
				seg.level = i; // not needed anymore
				segs.push(seg);
			}
		}
		return segs;
	}

	function compileSlotSegs(events) {
		var colCnt = getColCnt(),
			minMinute = getMinMinute(),
			maxMinute = getMaxMinute(),
			d = addMinutes(cloneDate(t.visStart), minMinute),
			visEventEnds = $.map(events, slotEventEnd),
			i, col,
			j, level,
			k, seg,
			segs=[];
		for (i=0; i<colCnt; i++) {
			col = stackSegs(sliceSegs(events, visEventEnds, d, addMinutes(cloneDate(d), maxMinute-minMinute)));
			countForwardSegs(col);
			for (j=0; j<col.length; j++) {
				level = col[j];
				for (k=0; k<level.length; k++) {
					seg = level[k];
					seg.col = i;
					seg.level = j;
					segs.push(seg);
				}
			}
			addDays(d, 1, true);
		}
		return segs;
	}

	function slotEventEnd(event) {
		if (event.end) {
			return cloneDate(event.end);
		}else{
			return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
		}
	}

	// renders events in the 'time slots' at the bottom

	function renderSlotSegs(segs, modifiedEventId) {
		var i, segCnt=segs.length, seg,
			event,
			classes,
			top, bottom,
			colI, levelI, forward,
			leftmost,
			availWidth,
			outerWidth,
			left,
			html='',
			eventElements,
			eventElement,
			triggerRes,
			vsideCache={},
			hsideCache={},
			key, val,
			contentElement,
			height,
			slotJumpersTop = getSlotJumpersTop(),
			slotJumpersBottom = getSlotJumpersBottom(),
			slotSegmentContainer = getSlotSegmentContainer(),
			slotScroller = getslotScroller(),
			rtl, dis, dit,
			colCnt = getColCnt(),
			colBoundaries = new Array(colCnt),
			jumperReserve = 10;

		if (rtl = opt('isRTL')) {
			dis = -1;
			dit = colCnt - 1;
		}else{
			dis = 1;
			dit = 0;
		}

		// init column tops array
		for(i=0;i<colCnt;i++) {
			colBoundaries[i]={positions:new Array()};
		}

		// calculate position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			top = timePosition(seg.start, seg.start);
			bottom = timePosition(seg.start, seg.end);
			colI = seg.col;
			levelI = seg.level;
			forward = seg.forward || 0;
			leftmost = colContentLeft(colI*dis + dit);
			availWidth = colContentRight(colI*dis + dit) - leftmost;
			availWidth = Math.min(availWidth-6, availWidth*.95); // TODO: move this to CSS
			if (levelI) {
				// indented and thin
				outerWidth = availWidth / (levelI + forward + 1);
			}else{
				if (forward) {
					// moderately wide, aligned left still
					outerWidth = ((availWidth / (forward + 1)) - (12/2)) * 2; // 12 is the predicted width of resizer =
				}else{
					// can be entire width, aligned left
					outerWidth = availWidth;
				}
			}
			left = leftmost +                                  // leftmost possible
				(availWidth / (levelI + forward + 1) * levelI) // indentation
				* dis + (rtl ? availWidth - outerWidth : 0);   // rtl
			seg.top = top;
			seg.left = left;
			seg.outerWidth = outerWidth;
			seg.outerHeight = bottom - top;
			html += slotSegHtml(event, seg);
		}
		slotSegmentContainer[0].innerHTML = html; // faster than html()
		eventElements = slotSegmentContainer.children();

		// retrieve elements, run through eventRender callback, bind event handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			eventElement = $(eventElements[i]); // faster than eq()
			triggerRes = trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes)
						.css({
							position: 'absolute',
							top: seg.top,
							left: seg.left
						})
						.appendTo(slotSegmentContainer);
				}
				seg.element = eventElement;
				if (event._id === modifiedEventId) {
					bindSlotSeg(event, eventElement, seg);
				}else{
					eventElement[0]._fci = i; // for lazySegBind
				}
				reportEventElement(event, eventElement);
			}
		}

		lazySegBind(slotSegmentContainer, segs, bindSlotSeg);

		// record event sides and title positions
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				val = vsideCache[key = seg.key = cssKey(eventElement[0])];
				seg.vsides = val === undefined ? (vsideCache[key] = vsides(eventElement, true)) : val;
				val = hsideCache[key];
				seg.hsides = val === undefined ? (hsideCache[key] = hsides(eventElement, true)) : val;
				contentElement = eventElement.find('div.fc-event-content');
				if (contentElement.length) {
					seg.contentTop = contentElement[0].offsetTop;
				}
			}
		}

		// set all positions/dimensions at once
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if (eventElement = seg.element) {
				eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
				height = Math.max(t.getSlotHeight() - seg.vsides, seg.outerHeight - seg.vsides);
				eventElement[0].style.height = height + 'px';
				event = seg.event;
				if (seg.contentTop !== undefined && height - seg.contentTop < 10) {
					// not enough room for title, put it in the time header
					eventElement.find('div.fc-event-time')
						.text(formatDate(event.start, opt('timeFormat')) + ' - ' + event.title);
						//.text(formatDates(event.start, event.end, opt('timeFormat')) + ' - ' + event.title);
					eventElement.find('div.fc-event-title')
						.remove();
				}
				colBoundaries[seg.col].positions.push({top:seg.top, bottom:seg.top+height+seg.vsides});
				trigger('eventAfterRender', event, event, eventElement);
			}
		}

		// sort column boundaries on top values and set min and max values
		for(i=0;i<colCnt;i++) {
			var min = null;
			var currentCol = colBoundaries[i];
			var currentColPositions = currentCol.positions;
			currentColPositions = currentColPositions.sort(function(a,b){return a.top-b.top;});
			$.each(currentColPositions,function(ei,ee){
				if(min==null)
					min=ee.bottom;
				else
					min=Math.min(min,ee.bottom);
			});
			currentCol.min=min;
			currentCol.max=currentColPositions.length?currentColPositions[currentColPositions.length-1].top:null;
		}

		slotScroller.unbind('scroll').scroll(function(){
			var currentPosition = $(this).scrollTop();
			for(i=0;i<colCnt;i++) {
				var currentCol = colBoundaries[i];
				if(currentCol.min!=null && currentCol.min<=currentPosition+jumperReserve)
					$(slotJumpersTop[i]).css('display','');
				else
					$(slotJumpersTop[i]).css('display','none');
				if(currentCol.max!=null && currentCol.max>=currentPosition+slotScroller.height()-jumperReserve)
					$(slotJumpersBottom[i]).css('display','');
				else
					$(slotJumpersBottom[i]).css('display','none');
			}
		}).trigger('scroll');
		slotJumpersTop.each(function(i, jumper){
			$(jumper).unbind('click').click(function(){
				var targetTop=0;
				var currentPosition = slotScroller.scrollTop();
				$.each(colBoundaries[i].positions,function(ei,ee){
					if(ee.bottom<=currentPosition+jumperReserve)
						targetTop=ee.top;
					return ee.top<currentPosition;
				});
				slotScroller.scrollTop(targetTop-t.getSlotHeight());
			});
		});
		slotJumpersBottom.each(function(i, jumper){
			$(jumper).unbind('click').click(function(){
				var targetPosition=0;
				var currentPosition = slotScroller.scrollTop();
				$.each(colBoundaries[i].positions,function(ei,ee){
					if(ee.top>=currentPosition+slotScroller.height()-jumperReserve)
					{
						targetPosition = ee;
						return false;
					}
				});
				slotScroller.scrollTop(
						targetPosition.bottom-targetPosition.top+t.getSlotHeight()>slotScroller.height()?
						targetPosition.top-t.getSlotHeight():
						targetPosition.bottom-slotScroller.height()+t.getSlotHeight()+1 // +1 is a magic independent constant, used just to make the default scroll position look better
				);
			});
		});

		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			if(seg.event.source && seg.event.source.background) {
				$('td.fc-col' + seg.col, t.element).addClass('fc-source-bg');
			}
		}
	}

	function slotSegHtml(event, seg) {
		var html = "<";
		var url = event.url;
		var skinCss = getSkinCss(event, opt);
		var skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
		var classes = ['fc-event', 'fc-event-skin', 'fc-event-vert'];
		if (isEventDraggable(event)) {
			classes.push('fc-event-draggable');
		}
		if (seg.isStart) {
			classes.push('fc-corner-top');
		}
		if (seg.isEnd) {
			classes.push('fc-corner-bottom');
		}
		classes = classes.concat(event.className);
		if (event.source) {
			classes = classes.concat(event.source.className || []);
		}
		if (url) {
			html += "a href='" + htmlEscape(event.url) + "'";
		}else{
			html += "div";
		}
		html +=
			" class='" + classes.join(' ') + "'" +
			" style='position:absolute;z-index:8;top:" + seg.top + "px;left:" + seg.left + "px;" + skinCss + "'" +
			">" +
			"<div class='fc-event-inner fc-event-skin'" + skinCssAttr + ">" +
			"<div class='fc-event-head fc-event-skin'" + skinCssAttr + ">" +
			"<div class='fc-event-time'>" +
			htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
			"</div>" +
			"</div>" +
			"<div class='fc-event-content'>" +
			"<div class='fc-event-title'>" +
			htmlEscape(event.title) +
			"</div>" +
			"</div>" +
			"<div class='fc-event-bg'></div>" +
			"</div>"; // close inner
		if (seg.isEnd && isEventResizable(event)) {
			html +=
				"<div class='ui-resizable-handle ui-resizable-s'>=</div>";
		}
		html +=
			"</" + (url ? "a" : "div") + ">";
		return html;
	}

	function bindDaySeg(event, eventElement, seg) {
		if (isEventDraggable(event)) {
			draggableDayEvent(event, eventElement, seg.isStart);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableDayEvent(event, eventElement, seg);
		}
		eventElementHandlers(event, eventElement);
			// needs to be after, because resizableDayEvent might stopImmediatePropagation on click
	}

	function bindSlotSeg(event, eventElement, seg) {
		var timeElement = eventElement.find('div.fc-event-time');
		if (isEventDraggable(event)) {
			draggableSlotEvent(event, eventElement, timeElement);
		}
		if (seg.isEnd && isEventResizable(event)) {
			resizableSlotEvent(event, eventElement, timeElement);
		}
		eventElementHandlers(event, eventElement);
	}

	/* Dragging
	-----------------------------------------------------------------------------------*/

	// when event starts out FULL-DAY

	function draggableDayEvent(event, eventElement, isStart) {
		var origWidth;
		var revert;
		var allDay=true;
		var dayDelta;
		var dis = opt('isRTL') ? -1 : 1;
		var hoverListener = getHoverListener();
		var colWidth = getColWidth();
		var slotHeight = getSlotHeight();
		var minMinute = getMinMinute();
		eventElement.draggable({
			zIndex: 9,
			scroll: false,
			opacity: opt('dragOpacity', 'month'), // use whatever the month view was using
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {
				trigger('eventDragStart', eventElement, event, ev, ui);
				//hideEvents(event, eventElement);
				origWidth = eventElement.width();
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					clearOverlays();
					if (cell) {
						//setOverflowHidden(true);
						revert = false;
						dayDelta = colDelta * dis;
						if (!cell.row) {
							// on full-days
							renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
							resetElement();
						}else{
							// mouse is over bottom slots
							if (isStart) {
								if (allDay) {
									// convert event to temporary slot-event
									eventElement.width(colWidth - 10); // don't use entire width
									setOuterHeight(
										eventElement,
										slotHeight * Math.round(
											(event.end ? ((event.end - event.start) / MINUTE_MS) : opt('defaultEventMinutes'))
											/ opt('slotMinutes')
										)
									);
									eventElement.draggable('option', 'grid', [colWidth, 1]);
									allDay = false;
								}
								else{
									var cellDate = t.cellDate;
									if (cell && (cell.col == origCell.col || !opt('selectHelper'))) {
										var d1 = cellDate(cell);
										var duration = event.end ? minDiff(event.end, event.start) : opt('defaultEventMinutes');
										var d2 = addMinutes(cloneDate(d1, false), duration);
										dates = [d1, d2].sort(cmp);
										renderSlotSelection(dates[0], dates[1]);
									}
								}

							}else{
								revert = true;
							}
						}
						revert = revert || (allDay && !dayDelta);
					}else{
						resetElement();
						//setOverflowHidden(false);
						revert = true;
					}
					eventElement.draggable('option', 'revert', revert);
				}, ev, 'drag');
			},
			stop: function(ev, ui) {
				hoverListener.stop();
				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);
				if (revert) {
					// hasn't moved or is out of bounds (draggable has already reverted)
					resetElement();
					eventElement.css('filter', ''); // clear IE opacity side-effects
					//showEvents(event, eventElement);
				}else{
					// changed!
					var minuteDelta = 0;
					if (!allDay) {
						minuteDelta = Math.round((eventElement.offset().top - getBodyContent().offset().top) / slotHeight)
							* opt('slotMinutes')
							+ minMinute
							- (event.start.getHours() * 60 + event.start.getMinutes());
					}
					eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
				}
				//setOverflowHidden(false);
			}
		});
		function resetElement() {
			if (!allDay) {
				eventElement
					.width(origWidth)
					.height('')
					.draggable('option', 'grid', null);
				allDay = true;
			}
		}
	}

	// when event starts out IN TIMESLOTS

	function draggableSlotEvent(event, eventElement, timeElement) {
		var origPosition;
		var allDay=false;
		var dayDelta;
		var minuteDelta;
		var prevMinuteDelta;
		var dis = opt('isRTL') ? -1 : 1;
		var hoverListener = getHoverListener();
		var colCnt = getColCnt();
		var colWidth = getColWidth();
		var slotHeight = getSlotHeight();
		eventElement.draggable({
			zIndex: 9,
			scroll: false,
			grid: [colWidth, slotHeight],
			axis: colCnt==1 ? 'y' : false,
			opacity: opt('dragOpacity'),
			revertDuration: opt('dragRevertDuration'),
			start: function(ev, ui) {
				trigger('eventDragStart', eventElement, event, ev, ui);
				//hideEvents(event, eventElement);
				origPosition = eventElement.position();
				minuteDelta = prevMinuteDelta = 0;
				hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
					eventElement.draggable('option', 'revert', !cell);
					clearOverlays();
					if (cell) {
						dayDelta = colDelta * dis;
						if (opt('allDaySlot') && !cell.row) {
							// over full days
							if (!allDay) {
								// convert to temporary all-day event
								allDay = true;
								timeElement.hide();
								eventElement.draggable('option', 'grid', null);
							}
							renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
						}else{
							// on slots
							resetElement();
						}
					}
				}, ev, 'drag');
			},
			drag: function(ev, ui) {
				ui.position.left = origPosition.left + (dayDelta * dis) * colWidth;
				minuteDelta = Math.round((ui.position.top - origPosition.top) / slotHeight) * opt('slotMinutes');
				if (minuteDelta != prevMinuteDelta) {
					if (!allDay) {
						updateTimeText(minuteDelta);
					}
					prevMinuteDelta = minuteDelta;
				}
			},
			stop: function(ev, ui) {
				var cell = hoverListener.stop();
				clearOverlays();
				trigger('eventDragStop', eventElement, event, ev, ui);
				if (cell && (dayDelta || minuteDelta || allDay)) {
					// changed!
					eventDrop(this, event, dayDelta, allDay ? 0 : minuteDelta, allDay, ev, ui);
				}else{
					// either no change or out-of-bounds (draggable has already reverted)
					resetElement();
					eventElement.css('filter', ''); // clear IE opacity side-effects
					eventElement.css(origPosition); // sometimes fast drags make event revert to wrong position
					updateTimeText(0);
					//showEvents(event, eventElement);
				}
			}
		});
		function updateTimeText(minuteDelta) {
			var newStart = addMinutes(cloneDate(event.start), minuteDelta);
			var newEnd;
			if (event.end) {
				newEnd = addMinutes(cloneDate(event.end), minuteDelta);
			}
			timeElement.text(formatDates(newStart, newEnd, opt('timeFormat')));
		}
		function resetElement() {
			// convert back to original slot-event
			if (allDay) {
				timeElement.css('display', ''); // show() was causing display=inline
				eventElement.draggable('option', 'grid', [colWidth, slotHeight]);
				allDay = false;
			}
		}
	}

	/* Resizing
	--------------------------------------------------------------------------------------*/

	function resizableSlotEvent(event, eventElement, timeElement) {
		var slotDelta, prevSlotDelta;
		var slotHeight = getSlotHeight();
		eventElement.resizable({
			handles: {
				s: 'div.ui-resizable-s'
			},
			grid: slotHeight,
			start: function(ev, ui) {
				slotDelta = prevSlotDelta = 0;
				//hideEvents(event, eventElement);
				eventElement.css('z-index', 9);
				trigger('eventResizeStart', this, event, ev, ui);
			},
			resize: function(ev, ui) {
				// don't rely on ui.size.height, doesn't take grid into account
				slotDelta = Math.round((Math.max(slotHeight, eventElement.height()) - ui.originalSize.height) / slotHeight);
				if (slotDelta != prevSlotDelta) {
					timeElement.text(
						formatDates(
							event.start,
							(!slotDelta && !event.end) ? null : // no change, so don't display time range
								addMinutes(eventEnd(event), opt('slotMinutes')*slotDelta),
							opt('timeFormat')
						)
					);
					prevSlotDelta = slotDelta;
				}
			},
			stop: function(ev, ui) {
				trigger('eventResizeStop', this, event, ev, ui);

				var minutesDelta = opt('slotMinutes')*slotDelta;
				if(event.end===null) {
					minutesDelta+=opt('defaultEventMinutes');
				}

				if (slotDelta) {
					eventResize(this, event, 0, minutesDelta, ev, ui);
				}else{
					eventElement.css('z-index', 8);
					//showEvents(event, eventElement);
					// BUG: if event was really short, need to put title back in span
				}
			}
		});
	}
}

function countForwardSegs(levels) {
	var i, j, k, level, segForward, segBack;
	for (i=levels.length-1; i>0; i--) {
		level = levels[i];
		for (j=0; j<level.length; j++) {
			segForward = level[j];
			for (k=0; k<levels[i-1].length; k++) {
				segBack = levels[i-1][k];
				if (segsCollide(segForward, segBack)) {
					segBack.forward = Math.max(segBack.forward||0, (segForward.forward||0)+1);
				}
			}
		}
	}
}

function View(element, calendar, viewName) {
	var t = this;

	// exports
	t.element = element;
	t.calendar = calendar;
	t.name = viewName;
	t.opt = opt;
	t.trigger = trigger;
	//t.setOverflowHidden = setOverflowHidden;
	t.isEventDraggable = isEventDraggable;
	t.isEventResizable = isEventResizable;
	t.reportEvents = reportEvents;
	t.eventEnd = eventEnd;
	t.reportEventElement = reportEventElement;
	t.reportEventClear = reportEventClear;
	t.eventElementHandlers = eventElementHandlers;
	t.showEvents = showEvents;
	t.hideEvents = hideEvents;
	t.eventDrop = eventDrop;
	t.eventResize = eventResize;
	t.selectedElement = null;
	t.selectEvent = selectEvent;
	// t.title
	// t.start, t.end
	// t.visStart, t.visEnd

	// imports
	var defaultEventEnd = t.defaultEventEnd;
	var normalizeEvent = calendar.normalizeEvent; // in EventManager
	var reportEventChange = calendar.reportEventChange;

	// locals
	var eventsByID = {};
	var eventElements = [];
	var eventElementsByID = {};
	var options = calendar.options;

	function opt(name, viewNameOverride) {
		var v = options[name];
		if (typeof v == 'object' && !v.length && !$.isArray(v)) {
			return smartProperty(v, viewNameOverride || viewName);
		}
		return v;
	}

	function trigger(name, thisObj) {
		return calendar.trigger.apply(
			calendar,
			[name, thisObj || t].concat(Array.prototype.slice.call(arguments, 2), [t])
		);
	}

	function isEventDraggable(event) {
		return isEventEditable(event) && !opt('disableDragging');
	}

	function isEventResizable(event) { // but also need to make sure the seg.isEnd == true
		return isEventEditable(event) && !opt('disableResizing');
	}

	function isEventEditable(event) {
		return firstDefined(event.editable, (event.source || {}).editable, opt('editable'));
	}

	/* Event Data
	------------------------------------------------------------------------------*/

	// report when view receives new events
	function reportEvents(events) { // events are already normalized at this point
		eventsByID = {};
		var i, len=events.length, event;
		for (i=0; i<len; i++) {
			event = events[i];
			if (eventsByID[event._id]) {
				eventsByID[event._id].push(event);
			}else{
				eventsByID[event._id] = [event];
			}
		}
	}

	// returns a Date object for an event's end
	function eventEnd(event) {
		return event.end ? cloneDate(event.end) : defaultEventEnd(event);
	}

	/* Event Elements
	------------------------------------------------------------------------------*/

	// report when view creates an element for an event
	function reportEventElement(event, element) {
		eventElements.push(element);
		if (eventElementsByID[event._id]) {
			eventElementsByID[event._id].push(element);
		}else{
			eventElementsByID[event._id] = [element];
		}
	}

	function reportEventClear() {
		eventElements = [];
		eventElementsByID = {};
	}

	// attaches eventClick, eventMouseover, eventMouseout
	function eventElementHandlers(event, eventElement) {
		eventElement
			.click(function(ev) {
				if (!eventElement.hasClass('ui-draggable-dragging') &&
					!eventElement.hasClass('ui-resizable-resizing')) {
						selectEvent(eventElement, true);
						return trigger('eventClick', this, event, ev);
					}
			})
			.hover(
				function(ev) {
					trigger('eventMouseover', this, event, ev);
				},
				function(ev) {
					trigger('eventMouseout', this, event, ev);
				}
			);

		eventElement.find('.fc-event-checkbox').click(function(ev) {
			trigger('eventCheckClicked', this, $(this), event, ev);
		});
		// TODO: don't fire eventMouseover/eventMouseout *while* dragging is occuring (on subject element)
		// TODO: same for resizing
	}

	function selectEvent(eventElement, noClick) {
		if(t.name!='todo' || t.eventSelectLock<0) {
			return false;
		}

		if(typeof eventElement=='undefined' || eventElement==null || eventElement.length==0) {
			eventElement=t.getDaySegmentContainer().find($('.fc-event[data-repeat-hash="'+t.selectedElement+'"]:visible'));
		}

		if(eventElement.length==0) {
			eventElement=t.element.find('.fc-event:visible:first');
		}

		if(eventElement.length==0) {
			trigger('selectEmpty');
			return false;
		}

		t.selectedElement=eventElement.attr('data-repeat-hash');
		t.element.find('.fc-event-selected').removeClass('fc-event-selected');
		eventElement.addClass('fc-event-selected');

		var offset=eventElement.position().top;
		if(offset<eventElement.outerHeight() || offset>t.getDaySegmentContainer().parent().height())
		{
			var top=t.getDaySegmentContainer().parent().scrollTop();
			t.getDaySegmentContainer().parent().scrollTop(top+offset-(t.getDaySegmentContainer().parent().height()*0.2));
		}

		// Force event click callback, although its not pretty
		if(!noClick) {
			eventElement.trigger('mouseover').trigger('click');
		}
	}

	function showEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'show');
	}

	function hideEvents(event, exceptElement) {
		eachEventElement(event, exceptElement, 'hide');
	}

	function eachEventElement(event, exceptElement, funcName) {
		event[funcName]();
//		var elements = eventElementsByID[event._id],
//			i, len = elements.length;
//		for (i=0; i<len; i++) {
//			if (!exceptElement || elements[i][0] != exceptElement[0]) {
//				elements[i][funcName]();
//			}
//		}
	}

	/* Event Modification Reporting
	---------------------------------------------------------------------------------*/

	function eventDrop(e, event, dayDelta, minuteDelta, allDay, ev, ui) {
		var oldAllDay = event.allDay;
		var eventId = event._id;
		//moveEvents(eventsByID[eventId], dayDelta, minuteDelta, allDay);
		moveEvents([event], dayDelta, minuteDelta, allDay);
		trigger(
			'eventDrop',
			e,
			event,
			dayDelta,
			minuteDelta,
			allDay,
			function() {
				// TODO: investigate cases where this inverse technique might not work
				//moveEvents(eventsByID[eventId], -dayDelta, -minuteDelta, oldAllDay);
				moveEvents([event], -dayDelta, -minuteDelta, oldAllDay);
				reportEventChange(eventId);
			},
			ev,
			ui
		);
		reportEventChange(eventId);
	}

	function eventResize(e, event, dayDelta, minuteDelta, ev, ui) {
		var eventId = event._id;
		//elongateEvents(eventsByID[eventId], dayDelta, minuteDelta);
		elongateEvents([event], dayDelta, minuteDelta);
		trigger(
			'eventResize',
			e,
			event,
			dayDelta,
			minuteDelta,
			function() {
				// TODO: investigate cases where this inverse technique might not work
				//elongateEvents(eventsByID[eventId], -dayDelta, -minuteDelta);
				elongateEvents([event], -dayDelta, -minuteDelta);
				reportEventChange(eventId);
			},
			ev,
			ui
		);
		reportEventChange(eventId);
	}

	/* Event Modification Math
	---------------------------------------------------------------------------------*/

	function moveEvents(events, dayDelta, minuteDelta, allDay) {
		minuteDelta = minuteDelta || 0;
		for (var e, len=events.length, i=0; i<len; i++) {
			e = events[i];
			if (allDay !== undefined) {
				e.allDay = allDay;
			}
			addMinutes(addDays(e.start, dayDelta, true), minuteDelta);
			if (e.end) {
				e.end = addMinutes(addDays(e.end, dayDelta, true), minuteDelta);
			}
			normalizeEvent(e, options);
		}
	}

	function elongateEvents(events, dayDelta, minuteDelta) {
		minuteDelta = minuteDelta || 0;
		for (var e, len=events.length, i=0; i<len; i++) {
			e = events[i];
			e.end = addMinutes(addDays(eventEnd(e), dayDelta, true), minuteDelta);
			normalizeEvent(e, options);
		}
	}

}

function DayEventRenderer() {
	var t = this;

	// exports
	t.renderDaySegs = renderDaySegs;
	t.resizableDayEvent = resizableDayEvent;

	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var isEventDraggable = t.isEventDraggable;
	var isEventResizable = t.isEventResizable;
	var eventEnd = t.eventEnd;
	var reportEventElement = t.reportEventElement;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var eventResize = t.eventResize;
	var getRowCnt = t.getRowCnt;
	var getColCnt = t.getColCnt;
	var getColWidth = t.getColWidth;
	var allDayRow = t.allDayRow;
	var allDayBounds = t.allDayBounds;
	var colContentLeft = t.colContentLeft;
	var colContentRight = t.colContentRight;
	var dayOfWeekCol = t.dayOfWeekCol;
	var dateCell = t.dateCell;
	var compileDaySegs = t.compileDaySegs;
	var getDaySegmentContainer = t.getDaySegmentContainer;
	var bindDaySeg = t.bindDaySeg; //TODO: streamline this
	var formatDates = t.calendar.formatDates;
	var renderDayOverlay = t.renderDayOverlay;
	var clearOverlays = t.clearOverlays;
	var clearSelection = t.clearSelection;

	/* Rendering
	-----------------------------------------------------------------------------*/

	function renderDaySegs(segs, modifiedEventId, isAllDay) {
		var segmentContainer = getDaySegmentContainer();
		var rowDivs;
		var rowCnt = getRowCnt();
		var colCnt = getColCnt();
		var i = 0;
		var rowI;
		var levelI;
		var colHeights;
		var j;
		var segCnt = segs.length;
		var seg;
		var top;
		var k;
		segmentContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
		daySegElementResolve(segs, segmentContainer.children());
		daySegElementReport(segs);
		daySegHandlers(segs, segmentContainer, modifiedEventId);
		daySegCalcHSides(segs);
		daySegSetWidths(segs);
		daySegCalcHeights(segs);
		rowDivs = getRowDivs();
		// set row heights, calculate event tops (in relation to row top)
		for (rowI=0; rowI<rowCnt; rowI++) {
			levelI = 0;
			colHeights = [];
			for (j=0; j<colCnt; j++) {
				colHeights[j] = 0;
			}
			while (i<segCnt && (seg = segs[i]).row == rowI) {
				// loop through segs in a row
				top = arrayMax(colHeights.slice(seg.startCol, seg.endCol));
				seg.top = top;
				if (typeof seg.outerHeight != "undefined") top += seg.outerHeight;
				for (k=seg.startCol; k<seg.endCol; k++) {
					colHeights[k] = top;
				}
				i++;
			}
			if(isAllDay) {
				segmentContainer.parent().height(arrayMax(colHeights) ? arrayMax(colHeights) + 3 : 0);
			}
			rowDivs[rowI].height(arrayMax(colHeights));
		}
		daySegSetTops(segs, getRowTops(rowDivs));

		$('.fc-source-bg', t.element).removeClass('fc-source-bg');
		if(!isAllDay) { // month or multiweek view
			for (i=0; i<segCnt; i++) {
				seg = segs[i];
				if(seg.event.source && seg.event.source.background) {
					for(c=seg.startCol; c<seg.endCol; c++) {
						$('td.fc-day' + (seg.row*7+c), t.element).addClass('fc-source-bg');
					}
				}
			}
		}
		else { // agenda views
			for (i=0; i<segCnt; i++) {
				seg = segs[i];
				if(seg.event.source && seg.event.source.background) {
					for(c=seg.startCol; c<seg.endCol; c++) {
						$('td.fc-col' + c, t.element).addClass('fc-source-bg');
					}
				}
			}
		}
	}

	function renderTempDaySegs(segs, adjustRow, adjustTop) {
		var tempContainer = $("<div/>");
		var elements;
		var segmentContainer = getDaySegmentContainer();
		var i;
		var segCnt = segs.length;
		var element;
		tempContainer[0].innerHTML = daySegHTML(segs); // faster than .html()
		elements = tempContainer.children();
		segmentContainer.append(elements);
		daySegElementResolve(segs, elements);
		daySegCalcHSides(segs);
		daySegSetWidths(segs);
		daySegCalcHeights(segs);
		daySegSetTops(segs, getRowTops(getRowDivs()));
		elements = [];
		for (i=0; i<segCnt; i++) {
			element = segs[i].element;
			if (element) {
				if (segs[i].row === adjustRow) {
					element.css('top', adjustTop);
				}
				elements.push(element[0]);
			}
		}
		return $(elements);
	}

	function daySegHTML(segs) { // also sets seg.left and seg.outerWidth
		var rtl = opt('isRTL');
		var i;
		var segCnt=segs.length;
		var seg;
		var event;
		var url;
		var classes;
		var bounds = allDayBounds();
		var minLeft = bounds.left;
		var maxLeft = bounds.right;
		var leftCol;
		var rightCol;
		var left;
		var right;
		var titleWidth;
		var skinCss;
		var html = '';
		// calculate desired position/dimensions, create html
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			classes = ['fc-event', 'fc-event-skin', 'fc-event-hori'];
			if (isEventDraggable(event)) {
				classes.push('fc-event-draggable');
			}
			if (rtl) {
				if (seg.isStart) {
					classes.push('fc-corner-right');
				}
				if (seg.isEnd) {
					classes.push('fc-corner-left');
				}
				leftCol = dayOfWeekCol(seg.end.getDay()-1);
				rightCol = dayOfWeekCol(seg.start.getDay());
				left = seg.isEnd ? colContentLeft(leftCol) : minLeft;
				right = seg.isStart ? colContentRight(rightCol) : maxLeft;
			}else{
				if (seg.isStart) {
					classes.push('fc-corner-left');
				}
				if (seg.isEnd) {
					classes.push('fc-corner-right');
				}
				leftCol = dayOfWeekCol(seg.start.getDay());
				rightCol = dayOfWeekCol(seg.end.getDay()-1);
				left = seg.isStart ? colContentLeft(leftCol) : minLeft;
				right = seg.isEnd ? colContentRight(rightCol) : maxLeft;
			}
			titleWidth = right - left - 2 - 2 - 2;
			classes = classes.concat(event.className);
			if (event.source) {
				classes = classes.concat(event.source.className || []);
			}
			url = event.url;
			skinCss = getSkinCss(event, opt);
			if (url) {
				html += "<a href='" + htmlEscape(url) + "'";
			}else{
				html += "<div";
			}
			html +=
				" class='" + classes.join(' ') + "'" +
				" style='position:absolute;z-index:8;left:"+left+"px;" + skinCss + "'" +
				">" +
				"<div" +
				" class='fc-event-inner fc-event-skin'" +
				" style='width:" + titleWidth + "px;z-index:inherit;" +
				(skinCss ? skinCss : '') +
				"'" +
				//(skinCss ? " style='" + skinCss + "'" : '') +
				">";
			if (opt('dayEventSizeStrict')) {
				html += "<div class='fc-event-title-strict'>";
			}
			if (!event.allDay && seg.isStart && opt('timeFormat')) {
				html +=
					"<span class='fc-event-time'>" +
					htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
					"</span>";
			}
			html += "<span class='fc-event-title'>" + htmlEscape(event.title.replace(/(\r\n|\n|\r)+/gm," ")) + "</span>";
			if (opt('dayEventSizeStrict')) {
				html += "</div>";
			}
			html += "</div>";
			if (seg.isEnd && isEventResizable(event)) {
				html +=
					"<div class='ui-resizable-handle ui-resizable-" + (rtl ? 'w' : 'e') + "'>" +
					"&nbsp;&nbsp;&nbsp;" + // makes hit area a lot better for IE6/7
					"</div>";
			}
			html +=
				"<div class='fc-event-bg'></div>" +
				"</" + (url ? "a" : "div" ) + ">";
			seg.left = left;
			seg.outerWidth = right - left;
			seg.startCol = leftCol;
			seg.endCol = rightCol + 1; // needs to be exclusive
		}
		return html;
	}

	function daySegElementResolve(segs, elements) { // sets seg.element
		var i;
		var segCnt = segs.length;
		var seg;
		var event;
		var element;
		var triggerRes;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			event = seg.event;
			element = $(elements[i]); // faster than .eq()
			triggerRes = trigger('eventRender', event, event, element);
			if (triggerRes === false) {
				element.remove();
			}else{
				if (triggerRes && triggerRes !== true) {
					triggerRes = $(triggerRes)
						.css({
							position: 'absolute',
							left: seg.left
						});
					element.replaceWith(triggerRes);
					element = triggerRes;
				}
				seg.element = element;
			}
		}
	}


	function daySegElementReport(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				reportEventElement(seg.event, element);
			}
		}
	}


	function daySegHandlers(segs, segmentContainer, modifiedEventId) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var event;
		// retrieve elements, run through eventRender callback, bind handlers
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				event = seg.event;
				if (event._id === modifiedEventId) {
					bindDaySeg(event, element, seg);
				}else{
					element[0]._fci = i; // for lazySegBind
				}
			}
		}
		lazySegBind(segmentContainer, segs, bindDaySeg);
	}


	function daySegCalcHSides(segs) { // also sets seg.key
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var key, val;
		var hsideCache = {};
		// record event horizontal sides
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				key = seg.key = cssKey(element[0]);
				val = hsideCache[key];
				if (val === undefined) {
					val = hsideCache[key] = hsides(element, true);
				}
				seg.hsides = val;
			}
		}
	}


	function daySegSetWidths(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				element[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
			}
		}
	}


	function daySegCalcHeights(segs) {
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var key, val;
		var vmarginCache = {};
		// record event heights
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				key = seg.key; // created in daySegCalcHSides
				val = vmarginCache[key];
				if (val === undefined) {
					val = vmarginCache[key] = vmargins(element);
				}
				seg.outerHeight = element[0].offsetHeight + val;
			}
			else // always set a value (issue #1108 )
				seg.outerHeight = 0;
		}
	}


	function getRowDivs() {
		var i;
		var rowCnt = getRowCnt();
		var rowDivs = [];
		for (i=0; i<rowCnt; i++) {
			rowDivs[i] = allDayRow(i)
				.find('td:first div.fc-day-content > div'); // optimal selector?
		}
		return rowDivs;
	}


	function getRowTops(rowDivs) {
		var i;
		var rowCnt = rowDivs.length;
		var tops = [];
		for (i=0; i<rowCnt; i++) {
			tops[i] = rowDivs[i][0].offsetTop; // !!?? but this means the element needs position:relative if in a table cell!!!!
		}
		return tops;
	}


	function daySegSetTops(segs, rowTops) { // also triggers eventAfterRender
		var i;
		var segCnt = segs.length;
		var seg;
		var element;
		var event;
		for (i=0; i<segCnt; i++) {
			seg = segs[i];
			element = seg.element;
			if (element) {
				element[0].style.top = rowTops[seg.row] + (seg.top||0) + 'px';
				event = seg.event;
				trigger('eventAfterRender', event, event, element);
			}
		}
	}

	/* Resizing
	-----------------------------------------------------------------------------------*/

	function resizableDayEvent(event, element, seg) {
		var rtl = opt('isRTL');
		var direction = rtl ? 'w' : 'e';
		var handle = element.find('div.ui-resizable-' + direction);
		var isResizing = false;

		// TODO: look into using jquery-ui mouse widget for this stuff
		disableTextSelection(element); // prevent native <a> selection for IE
		element
			.mousedown(function(ev) { // prevent native <a> selection for others
				ev.preventDefault();
			})
			.click(function(ev) {
				if (isResizing) {
					ev.preventDefault();			// prevent link from being visited (only method that worked in IE6)
					ev.stopImmediatePropagation();	// prevent fullcalendar eventClick handler from being called
													// (eventElementHandlers needs to be bound after resizableDayEvent)
				}
			});

		handle.mousedown(function(ev) {
			if (ev.which != 1) {
				return; // needs to be left mouse button
			}
			isResizing = true;
			var hoverListener = t.getHoverListener();
			var rowCnt = getRowCnt();
			var colCnt = getColCnt();
			var dis = rtl ? -1 : 1;
			var dit = rtl ? colCnt-1 : 0;
			var elementTop = element.css('top');
			var dayDelta;
			var helpers;
			var eventCopy = $.extend({}, event);
			var minCell = dateCell(event.start);
			clearSelection();
			$('body')
				.css('cursor', direction + '-resize')
				.one('mouseup', mouseup);
			trigger('eventResizeStart', this, event, ev);
			hoverListener.start(function(cell, origCell) {
				if (cell) {
					var r = Math.max(minCell.row, cell.row);
					var c = cell.col;
					if (rowCnt == 1) {
						r = 0; // hack for all-day area in agenda views
					}
					if (r == minCell.row) {
						if (rtl) {
							c = Math.min(minCell.col, c);
						}else{
							c = Math.max(minCell.col, c);
						}
					}
					dayDelta = (r*7 + c*dis+dit) - (origCell.row*7 + origCell.col*dis+dit);
					var newEnd = addDays(eventEnd(event), dayDelta, true);
					if (dayDelta) {
						eventCopy.end = newEnd;
						var oldHelpers = helpers;
						helpers = renderTempDaySegs(compileDaySegs([eventCopy]), seg.row, elementTop);
						helpers.find('*').css('cursor', direction + '-resize');
						trigger('eventResizeHelperCreated', this, event, ev, element, helpers);
						if (oldHelpers) {
							oldHelpers.remove();
						}
						//hideEvents(event);
						hideEvents(element);
					}else{
						if (helpers) {
							//showEvents(event);
							showEvents(element);
							helpers.remove();
							helpers = null;
						}
					}
					clearOverlays();
					renderDayOverlay(event.start, addDays(cloneDate(newEnd), 1)); // coordinate grid already rebuild at hoverListener.start
				}
			}, ev);

			function mouseup(ev) {
				trigger('eventResizeStop', this, event, ev);
				$('body').css('cursor', '');
				hoverListener.stop();
				clearOverlays();
				if (dayDelta) {
					eventResize(this, event, dayDelta, 0, ev);
					// event redraw will clear helpers
				}
				// otherwise, the drag handler already restored the old events

				setTimeout(function() { // make this happen after the element's click event
					isResizing = false;
				},0);
			}

		});
	}


}

//BUG: unselect needs to be triggered when events are dragged+dropped

function SelectionManager() {
	var t = this;


	// exports
	t.select = select;
	t.unselect = unselect;
	t.reportSelection = reportSelection;
	t.daySelectionMousedown = daySelectionMousedown;


	// imports
	var opt = t.opt;
	var trigger = t.trigger;
	var defaultSelectionEnd = t.defaultSelectionEnd;
	var renderSelection = t.renderSelection;
	var clearSelection = t.clearSelection;


	// locals
	var selected = false;



	// unselectAuto
	if (opt('selectable') && opt('unselectAuto')) {
		$(document).mousedown(function(ev) {
			var ignore = opt('unselectCancel');
			if (ignore) {
				if ($(ev.target).parents(ignore).length) { // could be optimized to stop after first match
					return;
				}
			}
			unselect(ev);
		});
	}


	function select(startDate, endDate, allDay) {
		unselect();
		if (!endDate) {
			endDate = defaultSelectionEnd(startDate, allDay);
		}
		renderSelection(startDate, endDate, allDay);
		reportSelection(startDate, endDate, allDay);
	}


	function unselect(ev) {
		if (selected) {
			selected = false;
			clearSelection();
			trigger('unselect', null, ev);
		}
	}


	function reportSelection(startDate, endDate, allDay, ev) {
		selected = true;
		trigger('select', null, startDate, endDate, allDay, ev);
	}


	function daySelectionMousedown(ev) { // not really a generic manager method, oh well
		var cellDate = t.cellDate;
		var cellIsAllDay = t.cellIsAllDay;
		var hoverListener = t.getHoverListener();
		var reportDayClick = t.reportDayClick; // this is hacky and sort of weird
		if (ev.which == 1 && opt('selectable')) { // which==1 means left mouse button
			unselect(ev);
			var _mousedownElement = this;
			var dates;
			hoverListener.start(function(cell, origCell) { // TODO: maybe put cellDate/cellIsAllDay info in cell
				clearSelection();
				if (cell && cellIsAllDay(cell)) {
					dates = [ cellDate(origCell), cellDate(cell) ].sort(cmp);
					renderSelection(dates[0], dates[1], true);
				}else{
					dates = null;
				}
			}, ev);
			$(document).one('mouseup', function(ev) {
				hoverListener.stop();
				if (dates) {
					if (+dates[0] == +dates[1]) {
						//reportDayClick(dates[0], true, ev);
					}
					reportSelection(dates[0], dates[1], true, ev);
				}
			});
		}
	}


}

function OverlayManager() {
	var t = this;


	// exports
	t.renderOverlay = renderOverlay;
	t.clearOverlays = clearOverlays;


	// locals
	var usedOverlays = [];
	var unusedOverlays = [];


	function renderOverlay(rect, parent) {
		var e = unusedOverlays.shift();
		if (!e) {
			e = $("<div class='fc-cell-overlay' style='position:absolute;z-index:3'/>");
		}
		if (e[0].parentNode != parent[0]) {
			e.appendTo(parent);
		}
		usedOverlays.push(e.css(rect).show());
		return e;
	}


	function clearOverlays() {
		var e;
		while (e = usedOverlays.shift()) {
			unusedOverlays.push(e.hide().unbind());
		}
	}


}

function CoordinateGrid(buildFunc) {
	var t = this;
	var rows;
	var cols;

	t.build = function() {
		rows = [];
		cols = [];
		buildFunc(rows, cols);
	};

	t.cell = function(x, y) {
		var rowCnt = rows.length;
		var colCnt = cols.length;
		var i, r=-1, c=-1;
		for (i=0; i<rowCnt; i++) {
			if (y >= rows[i][0] && y < rows[i][1]) {
				r = i;
				break;
			}
		}
		for (i=0; i<colCnt; i++) {
			if (x >= cols[i][0] && x < cols[i][1]) {
				c = i;
				break;
			}
		}
		return (r>=0 && c>=0) ? { row:r, col:c } : null;
	};

	t.rect = function(row0, col0, row1, col1, originElement) { // row1,col1 is inclusive
		var origin = originElement.offset();
		return {
			top: rows[row0][0] - origin.top,
			left: cols[col0][0] - origin.left,
			width: cols[col1][1] - cols[col0][0],
			height: rows[row1][1] - rows[row0][0]
		};
	};
}

function HoverListener(coordinateGrid) {

	var t = this;
	var bindType;
	var change;
	var firstCell;
	var cell;
	var origEvent;

	t.start = function(_change, ev, _bindType) {
		origEvent = ev;
		change = _change;
		firstCell = cell = null;
		coordinateGrid.build();
		mouse(ev);
		bindType = _bindType || 'mousemove';
		$(document).bind(bindType, mouse);
	};

	function mouse(ev) {
		_fixUIEvent(ev); // see below
		if(origEvent.pageX - ev.pageX == 0 && origEvent.pageY - ev.pageY == 0) {
			return false;
		}
		var newCell = coordinateGrid.cell(ev.pageX, ev.pageY);
		if (!newCell != !cell || newCell && (newCell.row != cell.row || newCell.col != cell.col)) {
			if (newCell) {
				if (!firstCell) {
					firstCell = newCell;
				}
				change(newCell, firstCell, newCell.row-firstCell.row, newCell.col-firstCell.col);
			}else{
				change(newCell, firstCell);
			}
			cell = newCell;
		}
	}

	t.stop = function() {
		$(document).unbind(bindType, mouse);
		return cell;
	};
}

// this fix was only necessary for jQuery UI 1.8.16 (and jQuery 1.7 or 1.7.1)
// upgrading to jQuery UI 1.8.17 (and using either jQuery 1.7 or 1.7.1) fixed the problem
// but keep this in here for 1.8.16 users
// and maybe remove it down the line

function _fixUIEvent(event) { // for issue 1168
	if (event.pageX === undefined) {
		event.pageX = event.originalEvent.pageX;
		event.pageY = event.originalEvent.pageY;
	}
}
function HorizontalPositionCache(getElement) {

	var t = this,
		elements = {},
		lefts = {},
		rights = {};

	function e(i) {
		return elements[i] = elements[i] || getElement(i);
	}

	t.left = function(i) {
		return lefts[i] = lefts[i] === undefined ? e(i).position().left : lefts[i];
	};

	t.right = function(i) {
		return rights[i] = rights[i] === undefined ? t.left(i) + e(i).width() : rights[i];
	};

	t.clear = function() {
		elements = {};
		lefts = {};
		rights = {};
	};
}

function addTodayText(cell, todayText)
{
	target = cell.find(".fc-day-text");
	target.html(todayText);
}

function removeTodayText(cell, todayText)
{
	target = cell.find(".fc-day-text");
	target.html('');
}

function addWeekNumber(cell, date)
{
	target = cell.find(".fc-week-number");
	target.html(getWeekNumber(date));
}

function removeWeekNumber(cell, date)
{
	target = cell.find(".fc-week-number");
	target.html('');
}

function addTodayClass(cell)
{
	var classes = cell.attr('class').split(' ');
	var filter = ['fc-state-highlight', 'fc-today', 'fc-widget-content', 'fc-source-bg'];
	classes = $.grep(classes, function(el) {
		if ($.inArray(el, filter) > -1) {
			return false;
		}

		return true;
	});
	classes.push('fc-widget-header');
	var target = $('.' + classes.join('.'));
	target.addClass('fc-today');
}

function removeTodayClass(cell)
{
	var classes = cell.attr('class').split(' ');
	var filter = ['fc-state-highlight', 'fc-today', 'fc-widget-content', 'fc-source-bg'];
	classes = $.grep(classes, function(el) {
		if ($.inArray(el, filter) > -1) {
			return false;
		}
		return true;
	});
	classes.push('fc-widget-header');
	var target = $('.' + classes.join('.'));
	target.removeClass('fc-today');
}

function getWeekNumber(date) {
    //By tanguy.pruvot at gmail.com (2010)

    //first week of year always contains 4th Jan, or 28 Dec (ISO)

    var jan4  = new Date(date.getFullYear(),0,4 ,date.getHours());

    //ISO weeks numbers begins on monday, so rotate monday:sunday to 0:6
    var jan4Day = (jan4.getDay() - 1 + 7) % 7;

    var days = Math.round((date - jan4) / 86400000);
    var week = Math.floor((days + jan4Day ) / 7)+1;

    //special cases
    var thisDay = (date.getDay() - 1 + 7) % 7;
    if (date.getMonth()==11 && date.getDate() >= 28) {

        jan4  = new Date(date.getFullYear()+1,0,4 ,date.getHours());
        jan4Day = (jan4.getDay() - 1 + 7) % 7;

        if (thisDay < jan4Day) return 1;

        var prevWeek = new Date(date.valueOf()-(86400000*7));
        return getWeekNumber(prevWeek) + 1;
    }

    if (week == 0 && thisDay > 3 && date.getMonth()==0) {
        var prevWeek = new Date(date.valueOf()-(86400000*7));
        return getWeekNumber(prevWeek) + 1;
    }

    return week;
}

/* Additional view: list (by bruederli@kolabsys.com)
---------------------------------------------------------------------------------*/

function ListEventRenderer() {
	var t = this;

	// exports
	t.renderEvents = renderEvents;
	t.renderEventTime = renderEventTime;
	t.compileDaySegs = compileSegs; // for DayEventRenderer
	t.clearEvents = clearEvents;
	t.lazySegBind = lazySegBind;
	t.sortCmp = sortCmp;

	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var reportEventElement = t.reportEventElement;
	var eventElementHandlers = t.eventElementHandlers;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var getListContainer = t.getDaySegmentContainer;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;


	/* Rendering
	--------------------------------------------------------------------*/

	function clearEvents() {
		reportEventClear();
		getListContainer().empty();
	}

	function renderEvents(events, modifiedEventId) {
		events.sort(sortCmp);
		reportEvents(events);
		renderSegs(compileSegs(events), modifiedEventId);
	}

	/*function compileSegs(events) {
		var segs = [];
		var colFormat = opt('titleFormat', 'day');
		var firstDay = opt('firstDay');
		var segmode = opt('listSections');
		var event, i, dd, wd, md, seg, segHash, curSegHash, segDate, curSeg = -1;
		var today = clearTime(new Date());
		var weekstart = addDays(cloneDate(today), -((today.getDay() - firstDay + 7) % 7));

		for (i=0; i < events.length; i++) {
			event = events[i];
			var eventEnd = event.end ? cloneDate(event.end) : cloneDate(event.start);

			// skip events out of range
			if (eventEnd < t.start || event.start > t.visEnd)
				continue;

			// define sections of this event
			// create smart sections such as today, tomorrow, this week, next week, next month, ect.
			segDate = cloneDate(event.start < t.start && eventEnd > t.start ? t.start : event.start, true);
			dd = dayDiff(segDate, today);
			wd = Math.floor(dayDiff(segDate, weekstart) / 7);
			md = segDate.getMonth() + ((segDate.getYear() - today.getYear()) * 12) - today.getMonth();

			// build section title
			if (segmode == 'smart') {
				if (dd < 0) {
					segHash = opt('listTexts', 'past');
				} else if (dd == 0) {
					segHash = opt('listTexts', 'today');
				} else if (dd == 1) {
					segHash = opt('listTexts', 'tomorrow');
				} else if (wd == 0) {
					segHash = opt('listTexts', 'thisWeek');
				} else if (wd == 1) {
					segHash = opt('listTexts', 'nextWeek');
				} else if (md == 0) {
					segHash = opt('listTexts', 'thisMonth');
				} else if (md == 1) {
					segHash = opt('listTexts', 'nextMonth');
				} else if (md > 1) {
					segHash = opt('listTexts', 'future');
				}
			} else if (segmode == 'month') {
				segHash = formatDate(segDate, 'MMMM yyyy');
			} else if (segmode == 'week') {
				segHash = opt('listTexts', 'week') + formatDate(segDate, ' W');
			} else if (segmode == 'day') {
				segHash = formatDate(segDate, colFormat);
			} else {
				segHash = '';
			}

			// start new segment
			if (segHash != curSegHash) {
				segs[++curSeg] = { events: [], start: segDate, title: segHash, daydiff: dd, weekdiff: wd, monthdiff: md };
				curSegHash = segHash;
			}

			segs[curSeg].events.push(event);
		}

		return segs;
	}*/

function compileSegs(events) {
		var segs = {};
		var colFormat = opt('columnFormat', t.name);
		var firstDay = opt('firstDay');
		var segmode = opt('listSections');
		var event, i, j, dd, wd, md, seg, segHash, segDate;
		var today = clearTime(new Date());
		var weekstart = addDays(cloneDate(today), -((today.getDay() - firstDay + 7) % 7));

		for (i=0; i < events.length; i++) {
			event = events[i];
			var eventEnd = event.end ? cloneDate(event.end) : cloneDate(event.start);

			// skip events out of range
			if (eventEnd < t.start || event.start > t.visEnd)
				continue;

			var boundEventStart = cloneDate(event.start < t.start ? t.start : event.start, true);
			var boundEventEnd = cloneDate(eventEnd > t.visEnd ? t.visEnd : eventEnd, true);
			var dayDuration = dayDiff(boundEventEnd, boundEventStart);

			for(j = 0; j <= dayDuration; j++) {
				segDate = cloneDate(boundEventStart);
				segDate.setDate(segDate.getDate() + j);

				// define sections of this event
				// create smart sections such as today, tomorrow, this week, next week, next month, ect.
				//segDate = cloneDate(event.start < t.start && eventEnd > t.start ? t.start : event.start, true);
				dd = dayDiff(segDate, today);
				wd = Math.floor(dayDiff(segDate, weekstart) / 7);
				md = segDate.getMonth() + ((segDate.getYear() - today.getYear()) * 12) - today.getMonth();

				// build section title
				if (segmode == 'smart') {
					if (dd < 0) {
						segHash = opt('listTexts', 'past');
					} else if (dd == 0) {
						segHash = opt('listTexts', 'today');
					} else if (dd == 1) {
						segHash = opt('listTexts', 'tomorrow');
					} else if (wd == 0) {
						segHash = opt('listTexts', 'thisWeek');
					} else if (wd == 1) {
						segHash = opt('listTexts', 'nextWeek');
					} else if (md == 0) {
						segHash = opt('listTexts', 'thisMonth');
					} else if (md == 1) {
						segHash = opt('listTexts', 'nextMonth');
					} else if (md > 1) {
						segHash = opt('listTexts', 'future');
					}
				} else if (segmode == 'month') {
					segHash = formatDate(segDate, 'MMMM yyyy');
				} else if (segmode == 'week') {
					segHash = opt('listTexts', 'week') + formatDate(segDate, ' W');
				} else if (segmode == 'day') {
					segHash = formatDate(segDate, colFormat);
				} else {
					segHash = '';
				}

				// start new segment
				if (!(segHash in segs)) {
					segs[segHash] = { events: [], start: segDate, title: segHash, daydiff: dd, weekdiff: wd, monthdiff: md };
				}

				segs[segHash].events.push(event);
			}
		}

		return segs;
	}

	function sortCmp(a, b) {
		/*var datediff = 0;
		if(a.start != null && b.start != null) {
			datediff = a.start.getTime() - b.start.getTime();
		}
		if(datediff == 0 && a.end != null && b.end != null) {
			datediff = a.end.getTime() - b.end.getTime();
		}
		return datediff;*/
		var retVal = a.start.getTime() - b.start.getTime();

		if(retVal == 0) {
			var aEnd = a.end ? a.end : a.start;
			var bEnd = b.end ? b.end : b.start;
			retVal = aEnd.getTime() - bEnd.getTime();
		}

		if(retVal == 0) {
			if(a.compareString < b.compareString) {
				retVal = -1;
			}
			else if(b.compareString < a.compareString) {
				retVal = 1;
			}
		}
		return retVal;
	}

	function renderSegs(segs, modifiedEventId) {
		var tm = opt('theme') ? 'ui' : 'fc';
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var i, j, seg, event, times, s, skinCss, skinCssAttr, classes, segContainer, eventElement, eventElements, triggerRes;

		for (j=0; j < segs.length; j++) {
			seg = segs[j];

			if (seg.title) {
				$('<div class="fc-list-header ' + headerClass + '">' + htmlEscape(seg.title) + '</div>').appendTo(getListContainer());
			}
			segContainer = $('<div>').addClass('fc-list-section ' + contentClass).appendTo(getListContainer());
			s = '';

			for (i=0; i < seg.events.length; i++) {
				event = seg.events[i];
				times = renderEventTime(event, seg);
				skinCss = getSkinCss(event, opt);
				skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
				classes = ['fc-event', 'fc-event-skin', 'fc-event-vert', 'fc-corner-top', 'fc-corner-bottom'].concat(event.className);
				if (event.source && event.source.className) {
					classes = classes.concat(event.source.className);
				}

				s +=
					"<div class='" + classes.join(' ') + "'" + skinCssAttr + ">" +
					"<div class='fc-event-inner fc-event-skin'" + skinCssAttr + ">" +
					"<div class='fc-event-head fc-event-skin'" + skinCssAttr + ">" +
					"<div class='fc-event-time'>" +
					(times[0] ? '<span class="fc-col-date">' + times[0] + '</span> ' : '') +
					(times[1] ? '<span class="fc-col-time">' + times[1] + '</span>' : '') +
					"</div>" +
					"</div>" +
					"<div class='fc-event-content'>" +
					"<div class='fc-event-title'>" +
					htmlEscape(event.title.replace(/(\r\n|\n|\r)+/gm," ")) +
					"</div>" +
					"</div>" +
					"<div class='fc-event-bg'></div>" +
					"</div>" + // close inner
					"</div>";  // close outer
			}

			segContainer[0].innerHTML = s;
			eventElements = segContainer.children();

			// retrieve elements, run through eventRender callback, bind event handlers
			for (i=0; i < seg.events.length; i++) {
				event = seg.events[i];
				eventElement = $(eventElements[i]); // faster than eq()
				triggerRes = trigger('eventRender', event, event, eventElement);
				if (triggerRes === false) {
					eventElement.remove();
				} else {
					if (triggerRes && triggerRes !== true) {
						eventElement.remove();
						eventElement = $(triggerRes).appendTo(segContainer);
					}
					if (event._id === modifiedEventId) {
						eventElementHandlers(event, eventElement, seg);
					} else {
						eventElement[0]._fci = i; // for lazySegBind
					}
					reportEventElement(event, eventElement);
				}
			}

			lazySegBind(segContainer, seg, eventElementHandlers);
		}

		markFirstLast(getListContainer());
	}

	// event time/date range to display
	function renderEventTime(event, seg) {
		var timeFormat = opt('timeFormat', 'list');
		var timeFormatFull = opt('timeFormat', 'listFull');
		var timeFormatFullAllDay = opt('timeFormat', 'listFullAllDay');
		var dateFormat = opt('columnFormat');
		var segmode = opt('listSections');
		var eventEnd = event.end ? cloneDate(event.end) : cloneDate(event.start);
		var duration = eventEnd.getTime() - event.start.getTime();
		var datestr = '', timestr = '';

		if (segmode == 'smart') {
			if (event.start < seg.start) {
				datestr = opt('listTexts', 'until') + ' ' + formatDate(eventEnd, (event.allDay || eventEnd.getDate() != seg.start.getDate()) ? dateFormat : timeFormat);
			} else if (duration > DAY_MS) {
				datestr = formatDates(event.start, eventEnd, dateFormat + '{ – ' + dateFormat + '}');
			} else if (seg.daydiff == 0) {
				datestr = opt('listTexts', 'today');
			} else if (seg.daydiff == 1) {
				datestr = opt('listTexts', 'tomorrow');
			} else if (seg.weekdiff == 0 || seg.weekdiff == 1) {
				datestr = formatDate(event.start, 'dddd');
			} else if (seg.daydiff > 1 || seg.daydiff < 0) {
				datestr = formatDate(event.start, dateFormat);
			}
		} else if (segmode != 'day') {
			datestr = formatDates(event.start, eventEnd, dateFormat + (duration > DAY_MS ? '{ – ' + dateFormat + '}' : ''));
		}

		if (!datestr && event.allDay) {
			if(dayDiff(eventEnd, event.start)) {  //spans multiple days
				timestr = formatDates(event.start, eventEnd, timeFormatFullAllDay);
			}
			else {
				timestr = opt('allDayText');
			}
		} else if ((!datestr || !dayDiff(eventEnd, event.start)) && !event.allDay) {
			if(dayDiff(eventEnd, event.start))  //spans multiple days
				timestr = formatDates(event.start, eventEnd, timeFormatFull);
			else if(duration)
				timestr = formatDates(event.start, eventEnd, timeFormat);
			else
				timestr = formatDates(event.start, null, timeFormat);
		}

		return [datestr, timestr];
	}

	function lazySegBind(container, seg, bindHandlers) {
		container.unbind('mouseover').mouseover(function(ev) {
			var parent = ev.target, e = parent, i, event;
			while (parent != this) {
				e = parent;
				parent = parent.parentNode;
			}
			if ((i = e._fci) !== undefined) {
				e._fci = undefined;
				event = seg.events[i];
				bindHandlers(event, container.children().eq(i), seg);
				$(ev.target).trigger(ev);
			}
			ev.stopPropagation();
		});
	}
}

fcViews.list = ListView;

function ListView(element, calendar) {
	var t = this;

	// exports
	t.render = render;
	t.select = dummy;
	t.unselect = dummy;
	t.getDaySegmentContainer = function(){ return body; };

	// imports
	View.call(t, element, calendar, 'list');
	ListEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var reportEventClear = t.reportEventClear;
	var formatDates = calendar.formatDates;
	var formatDate = calendar.formatDate;

	// overrides
	t.setWidth = setWidth;
	t.setHeight = setHeight;

	// locals
	var body;
	var firstDay;
	var nwe;
	var tm;
	var colFormat;


	function render(date, delta) {
		if (delta) {
			addDays(date, opt('listPage') * delta);
		}
		t.start = t.visStart = cloneDate(date, true);
		t.end = addDays(cloneDate(t.start), opt('listPage'));
		t.visEnd = addDays(cloneDate(t.start), opt('listRange'));
		addMinutes(t.visEnd, -1);  // set end to 23:59
		t.title = formatDates(date, t.visEnd, opt('titleFormat'));

		updateOptions();

		if (!body) {
			buildSkeleton();
		} else {
			clearEvents();
		}
	}


	function updateOptions() {
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat', 'day');
	}


	function buildSkeleton() {
		body = $('<div>').addClass('fc-list-content').appendTo(element);
	}

	function setHeight(height, dateChanged) {
		body.css('height', (height-1)+'px').css('overflow', 'auto');
	}

	function setWidth(width) {
		// nothing to be done here
	}

	function dummy() {
		// Stub.
	}

}

/* Additional view: table (by bruederli@kolabsys.com)
---------------------------------------------------------------------------------*/

function TableEventRenderer() {
	var t = this;

	// imports
	ListEventRenderer.call(t);
	var opt = t.opt;
	var sortCmp = t.sortCmp;
	var trigger = t.trigger;
	var getOrigDate = t.getOrigDate;
	var compileSegs = t.compileDaySegs;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var reportEventElement = t.reportEventElement;
	var eventElementHandlers = t.eventElementHandlers;
	var renderEventTime = t.renderEventTime;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var getListContainer = t.getDaySegmentContainer;
	var lazySegBind = t.lazySegBind;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;
	var prevMonth;
	var nextMonth;

	// exports
	t.renderEvents = renderEvents;
	t.scrollToDate = scrollToDate;
	t.clearEvents = clearEvents;
	t.prevMonthNav = prevMonth;
	t.nextMonthNav = nextMonth;


	/* Rendering
	--------------------------------------------------------------------*/

	function scrollToDate(date) {
		var colFormat = opt('columnFormat', t.name);
		var currentDate = cloneDate(date, false);
		var nextDate;
		var segHash;
		var currSegHash;
		var segFound = false;

		if(currentDate.getDate() == 1) {
			getListContainer().parent().scrollTop(0);
		}
		else {
			while(!segFound) {
				segHash = formatDate(currentDate, colFormat);
				getListContainer().find('td.fc-list-header.fc-widget-header').each(function(){
					currSegHash = $(this).html();
					if(currSegHash == segHash) {
						segFound = true;
						var offset = $(this).position().top;
						var top = getListContainer().parent().scrollTop();
						getListContainer().parent().scrollTop(top + offset);
					}
				});

				if(!segFound) {
					nextDate = cloneDate(currentDate, false);
					nextDate.setDate(nextDate.getDate()+1);

					if(nextDate.getDate() > currentDate.getDate()) {
						currentDate = cloneDate(nextDate, false);
					}
					else {
						segFound = true;
						getListContainer().parent().scrollTop(getListContainer().height());
					}
				}
			}
		}
	}

	function clearEvents() {
		reportEventClear();
		getListContainer().children('tbody').remove();
	}

	function renderEvents(events, modifiedEventId) {
		events.sort(sortCmp);
		reportEvents(events);
		renderSegs(compileSegs(events), modifiedEventId);
		getListContainer().removeClass('fc-list-smart fc-list-day fc-list-month fc-list-week').addClass('fc-list-' + opt('listSections'));
		scrollToDate(getOrigDate());
	}

	function renderSegs(segs, modifiedEventId) {
		var tm = opt('theme') ? 'ui' : 'fc';
		var table = getListContainer();
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var segHeader = null;
		var tableCols = opt('tableCols');
		var timecol = $.inArray('time', tableCols) >= 0;
		var i, j, seg, event, times, s, bg, skinCss, skinCssAttr, skinClasses, rowClasses, segContainer, eventElements, eventElement, triggerRes;

		prevMonth = $('<tbody class="fc-list-header"><tr><td class="fc-list-header fc-month-nav fc-month-prev ' + headerClass + '" colspan="' + tableCols.length + '">' + opt('buttonText', 'prevMonth') + '</td></tr></tbody>').appendTo(table);
		prevMonth.click(function(){
			var prevMonthDate = cloneDate(t.getOrigDate(), true);
			prevMonthDate.setDate(0);
			calendar.gotoDate(prevMonthDate);
			trigger('prevClick');
		});

		for (j in segs) {
			seg = segs[j];
			bg = false;

			if (seg.title) {
				var segHeader = $('<tbody class="fc-list-header"><tr><td class="fc-list-header ' + headerClass + '" colspan="' + tableCols.length + '">' + htmlEscape(seg.title) + '</td></tr></tbody>').appendTo(table);
			}
			segContainer = $('<tbody>').addClass('fc-list-section ' + contentClass).appendTo(table);
			s = '';

			for (i=0; i < seg.events.length; i++) {
				event = seg.events[i];
				times = renderEventTime(event, seg);
				skinCss = getSkinCss(event, opt);
				skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
				skinClasses = ['fc-event-skin', 'fc-corner-left', 'fc-corner-right', 'fc-corner-top', 'fc-corner-bottom'].concat(event.className);
				if (event.source && event.source.className) {
					skinClasses = skinClasses.concat(event.source.className);
				}
				if(event.source && event.source.background) {
					bg = true;
				}
				rowClasses = ['fc-'+dayIDs[event.start.getDay()], 'fc-event', 'fc-event-row'];
				if(opt('weekendDays').length>0 && opt('weekendDays').indexOf(segs[j].start.getDay())!=-1)
					rowClasses.splice(1, 0, 'fc-weekend-day');

				if (seg.daydiff == 0) {
					if(segHeader)
						segHeader.addClass('fc-today');
					rowClasses.push('fc-today');
					rowClasses.push('fc-state-highlight');
				}

				s +=  "<tr class='" + rowClasses.join(' ') + "'>";
				for (var col, c=0; c < tableCols.length; c++) {
					col = tableCols[c];
					if (col == 'handle') {
						s += "<td class='fc-event-handle'" + skinCssAttr + "></td>";
					} else if (col == 'title') {
						s += "<td class='fc-event-title'>" + (event.title ? htmlEscape(event.title.replace(/(\r\n|\n|\r)+/gm," ")) : '&nbsp;') + "</td>";
					} else if (col == 'date') {
						s += "<td class='fc-event-date' colspan='" + (times[1] || !timecol ? 1 : 2) + "'>" + htmlEscape(times[0]) + "</td>";
					} else if (col == 'time') {
						if (times[1]) {
							s += "<td class='fc-event-time' style='text-overflow: ellipsis; overflow: hidden;'>" + htmlEscape(times[1]) + "</td>";
						}
					} else {
						s += "<td class='fc-event-" + col + "'>" + (event[col] ? htmlEscape(event[col]) : '&nbsp;') + "</td>";
					}
				}
				s += "</tr>";

				// IE doesn't like innerHTML on tbody elements so we insert every row individually
				if (document.all) {
					$(s).appendTo(segContainer);
					s = '';
				}
			}

			if (!document.all)
				segContainer[0].innerHTML = s;

			eventElements = segContainer.children();

			// retrieve elements, run through eventRender callback, bind event handlers
			for (i=0; i < seg.events.length; i++) {
				event = seg.events[i];
				eventElement = $(eventElements[i]); // faster than eq()
				if(bg) {
					eventElement.addClass('fc-source-bg');
				}
				triggerRes = trigger('eventRender', event, event, eventElement);
				if (triggerRes === false) {
					eventElement.remove();
				} else {
					if (triggerRes && triggerRes !== true) {
						eventElement.remove();
						eventElement = $(triggerRes).appendTo(segContainer);
					}
					if (event._id === modifiedEventId) {
						eventElementHandlers(event, eventElement, seg);
					} else {
						eventElement[0]._fci = i; // for lazySegBind
					}
					reportEventElement(event, eventElement);
				}
				trigger('eventAfterRender', event, event, eventElement);
			}

			lazySegBind(segContainer, seg, eventElementHandlers);
			markFirstLast(segContainer);
			segContainer.addClass('fc-day-'+seg.start.getDay());
		}

		nextMonth = $('<tbody class="fc-list-header"><tr><td class="fc-list-header fc-month-nav fc-month-next ' + headerClass + '" colspan="' + tableCols.length + '">' + opt('buttonText', 'nextMonth') + '</td></tr></tbody>').appendTo(table);
		nextMonth.click(function(){
			var nextMonthDate = cloneDate(t.getOrigDate(), true);
			nextMonthDate.setDate(1);
			nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
			calendar.gotoDate(nextMonthDate);
			trigger('nextClick');
		});

		//markFirstLast(table);
	}

}


fcViews.table = TableView;


function TableView(element, calendar) {
	var t = this;

	// exports
	t.render = render;
	t.select = dummy;
	t.unselect = dummy;
	t.getDaySegmentContainer = function(){return table;};
	t.getOrigDate = function() {return origDate;};
	t.updateGrid = updateGrid;
	t.updateToday = updateToday;
	t.setAxisFormat = setAxisFormat;
	t.setStartOfBusiness = setStartOfBusiness;
	t.setEndOfBusiness = setEndOfBusiness;
	t.setWeekendDays = setWeekendDays;
	t.setBindingMode = setBindingMode;
	t.setSelectable = setSelectable;

	// imports
	View.call(t, element, calendar, 'table');
	TableEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var reportEventClear = t.reportEventClear;
	var formatDates = calendar.formatDates;
	var formatDate = calendar.formatDate;

	// overrides
	t.setWidth = setWidth;
	t.setHeight = setHeight;

	// locals
	var div;
	var table;
	var firstDay;
	var nwe;
	var tm;
	var colFormat;
	var datepicker;
	var dateInfo;
	var dateInfoNumber;
	var dateInfoNumberDiv;
	var dateInfoText;
	var origDate;

	function render(date, delta) {
		/*if (delta) {
			addDays(date, opt('listPage') * delta);
		}
		t.start = t.visStart = cloneDate(date, true);
		t.end = addDays(cloneDate(t.start), opt('listPage'));
		t.visEnd = addDays(cloneDate(t.start), opt('listRange'));*/

		origDate = date;
		if (delta) {
			addMonths(date, delta);
			date.setDate(1);
		}
		t.start = cloneDate(date, true);
		t.start.setDate(1);
		t.end = addMonths(cloneDate(t.start), 1);
		t.visStart = cloneDate(t.start);
		t.visEnd = cloneDate(t.end);

		addMinutes(t.visEnd, -1);  // set end to 23:59
		t.title = formatDates(
			t.visStart,
			t.visEnd,
			opt('titleFormat')
		);
		//t.title = (t.visEnd.getTime() - t.visStart.getTime() < DAY_MS) ? formatDate(date, opt('titleFormat')) : formatDates(date, t.visEnd, opt('titleFormat'));

		updateOptions();
		if (!table) {
			buildSkeleton(origDate);
		} else {
			clearEvents();
			if(opt('showDatepicker')) {
				dateInfoNumberDiv.html(origDate.getDate());
				dateInfoText.html(formatDates(origDate, null, opt('titleFormat', 'table')));
				datepicker.datepicker('option','firstDay',firstDay);
				datepicker.datepicker('setDate', origDate);
			}
		}
	}


	function updateOptions() {
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat');
	}

	function buildSkeleton(date) {
		var tableCols = opt('tableCols');
		var s =
			"<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
			"<colgroup>";
		for (var c=0; c < tableCols.length; c++) {
			s += "<col class='fc-event-" + tableCols[c] + "' />";
		}
		s += "</colgroup>" +
			"</table>";
		if(opt('showDatepicker')) {
			dateInfo = $('<div>').addClass('fc-table-dateinfo').appendTo(element);
			dateInfoNumber = $('<div>').addClass('fc-table-dateinfo-number').appendTo(dateInfo);
			dateInfoNumberDiv = $('<div>').appendTo(dateInfoNumber);
			dateInfoNumberDiv.html(date.getDate());
			dateInfoText = $('<div>').addClass('fc-table-dateinfo-text').appendTo(dateInfo);
			dateInfoText.html(formatDates(origDate, null, opt('titleFormat', 'table')));
			datepicker = $('<div>').addClass('fc-table-datepicker').appendTo(element);
			datepicker.datepicker({
				firstDay: opt('firstDay'),
				weekendDays: opt('weekendDays'),
				defaultDate: date,
				showWeek: true,
				weekHeader: '',

				onSelect: function(dateText, inst) {
					var date = new Date(dateText);
					calendar.gotoDate(date);
					trigger('datepickerClick', this, date);
				},
			});
		}
		div = $('<div>').addClass('fc-list-content').appendTo(element);
		table = $(s).appendTo(div);
	}

	function updateGrid()
	{
		updateToday();
		setAxisFormat();
		setStartOfBusiness();
		setEndOfBusiness();
		setWeekendDays();
		setBindingMode();
		setSelectable();
	}

	function updateToday()
	{
		var today = clearTime(new Date());
		var segHash = formatDate(today, colFormat);

		$(table).find('.fc-list-header').each(function() {
			$(this).removeClass('fc-today');
			$(this).next().children().removeClass('fc-state-highlight');

			if(segHash == $(this).find('td').html()) {
				$(this).addClass('fc-today');
				$(this).next().children().addClass('fc-state-highlight');
			}
		});

		datepicker.datepicker('refresh');
	}

	function setAxisFormat()
	{
		// dummy
	}

	function setStartOfBusiness()
	{
		// dummy
	}

	function setEndOfBusiness()
	{
		// dummy
	}

	function setWeekendDays()
	{
		var weekendDays = opt('weekendDays');

		$(table).find('.fc-list-section').each(function() {
			var day=parseInt(this.className.match(/fc-day-(\d)/)[1],10);
			if(weekendDays.indexOf(day)==-1)
				$(this).children().removeClass('fc-weekend-day');
			else
				$(this).children().addClass('fc-weekend-day');
		});

		if(opt('showDatepicker'))
			datepicker.datepicker('option','weekendDays',weekendDays);
	}

	function setBindingMode()
	{
		// dummy
	}

	function setSelectable()
	{
		// dummy
	}

	function setHeight(height, dateChanged) {
		if(opt('showDatepicker')) {
			var datepickerHeight = datepicker.height();
			dateInfoText.css('padding-bottom', datepickerHeight - datepicker.children().outerHeight() + 3); //+3 for paddings
			var textHeight = dateInfoText.outerHeight();
			dateInfoNumber.css({'height': datepickerHeight - textHeight,
									'font-size': 145 - textHeight});
			dateInfoNumberDiv.height(145 - textHeight);
		}

		div.css('height', (height-div.position().top-2)+'px').css('overflow', 'auto');
	}

	function setWidth(width) {
		var outerWidth = Math.floor(element.parent().width() / 2) - 8;
		element.css({'left' : width, 'width' : outerWidth});
	}

	function dummy() {
		// Stub.
	}

}

function TodoEventRenderer() {
	var t = this;

	// exports
	t.renderEvents = renderEvents;
	t.clearEvents = clearEvents;
	t.renderEventTime = renderEventTime;
	t.compileDaySegs = compileSegs; // for DayEventRenderer
	t.lazySegBind = lazySegBind;
	t.sortCmp = sortCmp;

	// imports
	DayEventRenderer.call(t);
	var opt = t.opt;
	var sortCmp = t.sortCmp;
	var trigger = t.trigger;
	var compileSegs = t.compileDaySegs;
	var reportEvents = t.reportEvents;
	var reportEventClear = t.reportEventClear;
	var reportEventElement = t.reportEventElement;
	var eventElementHandlers = t.eventElementHandlers;
	var renderEventTime = t.renderEventTime;
	var showEvents = t.showEvents;
	var hideEvents = t.hideEvents;
	var getListContainer = t.getDaySegmentContainer;
	var lazySegBind = t.lazySegBind;
	var calendar = t.calendar;
	var formatDate = calendar.formatDate;
	var formatDates = calendar.formatDates;
	var prevMonth;
	var nextMonth;

	function compileSegs(events) {
		var segs = {};
		var event, i;

		//for (i=0; i < events.length; i++) {
		for (i=events.length-1; i > -1; i--) {
			event = events[i];
			var segHash = event.repeatHash;
			var eventEnd = event.end ? cloneDate(event.end) : cloneDate(event.start);

			// skip events out of range
			if ((event.completedOn && event.completedOn < t.start && (opt('showUnstartedEvents') || !event.start || event.completedOn > event.start)) ||
				(!opt('showUnstartedEvents') && event.start && event.start > t.visEnd)) {
				continue;
			}

			// start new segment
			if (!(segHash in segs)) {
				segs[segHash] = { events: [], id: segHash};
			}

			segs[segHash].events.push(event);
		}

		return segs;
	}

	function reverseSegs(oldSegs) {
		var newSegs = {};
		var keys = $.map(oldSegs, function (value, key) { return key; });
		var values = $.map(oldSegs, function (value, key) { return value; });

		for (i=keys.length-1; i > -1; i--) {
			newSegs[keys[i]] = values[i];
		}

		return newSegs;
	}

	function sortCmp(a, b) {
		/*var sd = a.start.getTime() - b.start.getTime();
		var aEnd = a.end ? a.end : a.start;
		var bEnd = b.end ? b.end : b.start;
		return sd + (sd ? 0 : aEnd.getTime() - bEnd.getTime());*/
		var aEnd = a.end ? a.end.getTime() : Infinity;
		var bEnd = b.end ? b.end.getTime() : Infinity;
		var aStart = a.start ? a.start.getTime() : Infinity;
		var bStart = b.start ? b.start.getTime() : Infinity;
		var aPriority = parseInt(a.priority, 10) || 10;
		var bPriority = parseInt(b.priority, 10) || 10;

		var statusSort = {
			"NEEDS-ACTION": 1,
			"IN-PROCESS": 2,
			"COMPLETED": 3,
			"CANCELLED": 4
		};

		if(aEnd < bEnd) {
			return -1;
		}
		else if(bEnd < aEnd) {
			return 1;
		}
		else if(aStart < bStart){
			return -1;
		}
		else if(bStart < aStart) {
			return 1;
		}
		else if(aPriority < bPriority) {
			return -1;
		}
		else if(bPriority < aPriority) {
			return 1;
		}
		else if(statusSort[a.status] < statusSort[b.status]) {
			return -1;
		}
		else if(statusSort[b.status] < statusSort[a.status]) {
			return 1;
		}
		else if(a.percent < b.percent) {
			return -1;
		}
		else if(b.percent < a.percent) {
			return 1;
		}
		else if(a.compareString < b.compareString) {
			return -1;
		}
		else if(b.compareString < a.compareString) {
			return 1;
		}
		else {
			return 0;
		}
	}

	// event time/date range to display
	function renderEventTime(event) {
		var timeFormat = opt('timeFormat', 'list');
		return event.end? formatDate(event.end, timeFormat) : '';
	}

	function lazySegBind(container, seg, bindHandlers) {
		container.unbind('mouseover').mouseover(function(ev) {
			var parent = ev.target, e = parent, i, event;
			while (parent != this) {
				e = parent;
				parent = parent.parentNode;
			}
			if ((i = e._fci) !== undefined) {
				e._fci = undefined;
				event = seg.events[i];
				bindHandlers(event, container.children().eq(0), seg);
				$(ev.target).trigger(ev);
			}
			ev.stopPropagation();
		});
	}

	function clearEvents() {
		reportEventClear();
		getListContainer().children('tbody').remove();
	}

	function renderEvents(events, modifiedEventId) {
		events.sort(sortCmp);
		reportEvents(events);
		renderSegs(reverseSegs(compileSegs(events)), modifiedEventId);
		getListContainer().removeClass('fc-list-smart fc-list-day fc-list-month fc-list-week').addClass('fc-list-' + opt('listSections'));
		//t.selectEvent();
		t.applyFilters();
	}

	function renderSegs(segs, modifiedEventId) {
		var tm = opt('theme') ? 'ui' : 'fc';
		var table = getListContainer();
		var headerClass = tm + "-widget-header";
		var contentClass = tm + "-widget-content";
		var segHeader = null;
		var tableCols = opt('todoCols');
		var timecol = $.inArray('time', tableCols) >= 0;
		var i, j, iter, seg, event, times, s, skinCss, skinCssAttr, skinClasses, rowClasses, segContainer, eventElements, eventElement, triggerRes;

		for (j in segs) {
			seg = segs[j];

			segContainer = $('<tbody>').addClass('fc-list-section ' + contentClass).appendTo(table);
			s = '';

			event = seg.events[0];
			iter=0;
			if(opt('showUnstartedEvents') && seg.events.length>1) {
				for(;iter<seg.events.length; iter++) {
					if(seg.events[iter].start<t.end) {
						event = seg.events[iter];
						break;
					}
				}
				if(iter==seg.events.length) {
					continue;
				}
			}

			dueTime = renderEventTime(event);
			skinCss = getSkinCss(event, opt);
			skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');
			skinClasses = ['fc-event-skin', 'fc-corner-left', 'fc-corner-right', 'fc-corner-top', 'fc-corner-bottom'].concat(event.className);
			if (event.source && event.source.className) {
				skinClasses = skinClasses.concat(event.source.className);
			}

			rowClasses = ['fc-event', 'fc-event-row'];
			if(event.end && event.end.getTime() < cloneDate(t.start, true)) {
				rowClasses.push('fc-event-pastdue');
			}
			else if(event.end && event.end.getTime() < addDays(cloneDate(t.start), 2, false).getTime()) {
				rowClasses.push('fc-event-urgent');
			}
			if(event.filterStatus) {
				rowClasses.push('fc-event-'+event.filterStatus);
			}

			s +=  "<tr class='" + rowClasses.join(' ') + "'>";
			for (var col, c=0; c < tableCols.length; c++) {
				col = tableCols[c];
				if (col == 'handle') {
					s += "<td class='fc-event-handle'" + skinCssAttr + "></td>";
				} else if (col == 'check') {
					s += "<td class='fc-event-check'>" + '<input type="checkbox" class="fc-event-checkbox" data-ind="false"/>' + "</td>";
				} else if (col == 'priority') {
						s += "<td class='fc-event-priority fc-event-priority-" + event.renderPriority + "'>" + (event.renderPriority ? '&nbsp;' : '') + "</td>";
				} else if (col == 'time') {
						s += "<td class='fc-event-time'>" + htmlEscape(dueTime) + "</td>";
				} else if (col == 'title') {
					s += "<td class='fc-event-title'>" + htmlEscape(event.title.replace(/(\r\n|\n|\r)+/gm, " ")) + "</td>";
				} else if (col == 'location') {
						s += "<td class='fc-event-location'>" + htmlEscape(event.location.replace(/(\r\n|\n|\r)+/gm, " ")) + "</td>";
				} else if (col == 'status') {
					s += "<td class='fc-event-status'></td>";
				} else if (col == 'percent') {
					s += "<td class='fc-event-percent'>" + event.percent + '%' + "</td>";
				}
				else {
					s += "<td class='fc-event-" + col + "'>" + (event[col] ? htmlEscape(event[col]) : '&nbsp;') + "</td>";
				}
			}
			s += "</tr>";

			// IE doesn't like innerHTML on tbody elements so we insert every row individually
			if (document.all) {
				$(s).appendTo(segContainer);
				s = '';
			}

			if (!document.all)
				segContainer[0].innerHTML = s;

			eventElements = segContainer.children();

			// retrieve elements, run through eventRender callback, bind event handlers
			eventElement = $(eventElements[0]); // faster than eq()
			triggerRes = trigger('eventRender', event, event, eventElement);
			if (triggerRes === false) {
				eventElement.remove();
			} else {
				if (triggerRes && triggerRes !== true) {
					eventElement.remove();
					eventElement = $(triggerRes).appendTo(segContainer);
				}
				if (event._id === modifiedEventId) {
					eventElementHandlers(event, eventElement, seg);
				} else {
					eventElement[0]._fci = iter; // for lazySegBind
				}
				reportEventElement(event, eventElement);
			}
			trigger('eventCheckDefault', event, event, eventElement.find('.fc-event-checkbox'));
			trigger('eventAfterRender', event, event, eventElement);

			lazySegBind(segContainer, seg, eventElementHandlers);
			markFirstLast(segContainer);
		}

		//markFirstLast(table);
	}

}

fcViews.todo = TodoView;

function TodoView(element, calendar) {
	var t = this;

	// exports
	t.render = render;
	t.select = dummy;
	t.unselect = dummy;
	t.getDaySegmentContainer = function(){ return table; };
	t.applyFilters = applyFilters;
	t.allowSelectEvent = allowSelectEvent;
	t.eventSelectLock = 0;
	t.updateGrid = updateGrid;
	t.updateToday = updateToday;
	t.setAxisFormat = setAxisFormat;
	t.setStartOfBusiness = setStartOfBusiness;
	t.setEndOfBusiness = setEndOfBusiness;
	t.setWeekendDays = setWeekendDays;
	t.setBindingMode = setBindingMode;
	t.setSelectable = setSelectable;

	// imports
	View.call(t, element, calendar, 'todo');
	TodoEventRenderer.call(t);
	var opt = t.opt;
	var trigger = t.trigger;
	var clearEvents = t.clearEvents;
	var reportEventClear = t.reportEventClear;
	var formatDates = calendar.formatDates;
	var formatDate = calendar.formatDate;

	// overrides
	t.setWidth = setWidth;
	t.setHeight = setHeight;

	// locals
	var div;
	var table;
	var filter;
	var filterTable;
	var firstDay;
	var nwe;
	var tm;
	var colFormat;
	var currentDate;
	var datepickers;
	var dateInfo;
	var dateInfoNumber;
	var dateInfoNumberDiv;
	var dateInfoText;

	function render(date, delta) {
		if (delta) {
			addMonths(date, delta);
			date.setDate(1);
		}
		currentDate = date;
		var start = cloneDate(date, true);
		var end = addDays(cloneDate(start), 1);
		t.title = formatDate(date, opt('titleFormat'));
		t.start = t.visStart = start;
		t.end = t.visEnd = end;

		updateOptions();
		if (!table) {
			buildSkeleton(date);
			initFilters();
		} else {
			clearEvents();
			filterTable.find('.fc-filter-table-footer').text(opt('buttonText', 'filtersFooter').replace('%date%', formatDates(date, null, opt('columnFormat', 'todo'))));
			if(opt('showDatepicker')) {
				dateInfoNumberDiv.html(date.getDate());
				dateInfoText.html(formatDates(date, null, opt('titleFormat', 'todo')));

				var defaultDate = cloneDate(date, true);
				defaultDate.setHours(12);
				defaultDate.setDate(1);
				defaultDate.setMonth(currentDate.getMonth() - datepickers.length + 1);

				datepickers.forEach(function(e, i){
					defaultDate.setMonth(defaultDate.getMonth() + 1);
					e.datepicker('option','firstDay',firstDay);
					if((i===0 && datepickers.length<3) || (i===datepickers.length-2 && datepickers.length>2))
						e.datepicker('setDate', date);
					else
						e.datepicker('setDate', defaultDate);
				});
			}
		}
	}

	function updateOptions() {
		firstDay = opt('firstDay');
		nwe = opt('weekends') ? 0 : 1;
		tm = opt('theme') ? 'ui' : 'fc';
		colFormat = opt('columnFormat');
	}

	function buildSkeleton(date) {
		var tableCols = opt('todoCols');
		var s =
			"<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
			"<colgroup>";
		for (var c=0; c < tableCols.length; c++) {
			s += "<col class='fc-event-" + tableCols[c] + "' />";
		}
		s += "</colgroup>" +
			"</table>";
		if(opt('showDatepicker')) {
			dateInfo = $('<div>').addClass('fc-table-dateinfo').appendTo(element);
			dateInfoNumber = $('<div>').addClass('fc-table-dateinfo-number').appendTo(dateInfo);
			dateInfoNumberDiv = $('<div>').appendTo(dateInfoNumber);
			dateInfoNumberDiv.html(date.getDate());
			dateInfoText = $('<div>').addClass('fc-table-dateinfo-text').appendTo(dateInfo);
			dateInfoText.html(formatDates(date, null, opt('titleFormat', 'todo')));

			datepickers = [$('<div>').addClass('fc-table-datepicker fc-table-datepicker-current').appendTo(element)];
			datepickers[0].datepicker({
				firstDay: opt('firstDay'),
				weekendDays: opt('weekendDays'),
				defaultDate: date,
				showWeek: true,
				weekHeader: '',

				onSelect: function(dateText, inst) {
					var date = new Date(dateText);
					calendar.gotoDate(date);
					trigger('datepickerClick', this, date);
				}
			});
		}
		filter = $('<div>').addClass('fc-filter').appendTo(element);
		var ft = '<table class="fc-filter-table">' +
					'<tr>' +
					'<td class="fc-filter-table-header" colspan="2">'+opt('buttonText', 'filtersHeader')+'</td>' +
					'</tr>';

		if(opt('simpleFilters')) {
			ft += '<tr>' +
					'<td class="fc-filter-option fc-filter-action" data-type="filterAction">'+ opt('buttonText', 'filterAction') +'</td>' +
					'<td class="fc-filter-option fc-filter-completed fc-filter-option-last" data-type="filterCompleted">'+ opt('buttonText', 'filterCompleted') +' *</td>' +
					'</tr>';
		}
		else {
			ft += '<tr>' +
					'<td class="fc-filter-option fc-filter-action" data-type="filterAction">'+ opt('buttonText', 'filterAction') +'</td>' +
					'<td class="fc-filter-option fc-filter-progress" data-type="filterProgress">'+ opt('buttonText', 'filterProgress') +'</td>' +
					'</tr>' +
					'<tr>' +
					'<td class="fc-filter-option fc-filter-completed" data-type="filterCompleted">'+ opt('buttonText', 'filterCompleted') +' *</td>' +
					'<td class="fc-filter-option fc-filter-canceled fc-filter-option-last" data-type="filterCanceled">'+ opt('buttonText', 'filterCanceled') +'</td>' +
					'</tr>';
		}

		ft += '<tr>' +
				'<td class="fc-filter-table-footer" colspan="2">'+opt('buttonText', 'filtersFooter').replace('%date%', formatDates(date, null, opt('columnFormat', 'todo')))+'</td>' +
				'</tr>' +
				'</table>';
		filterTable = $(ft).appendTo(filter);
		div = $('<div>').addClass('fc-list-content').appendTo(element);
		table = $(s).appendTo(div);
	}

	function updateGrid()
	{
		updateToday();
		setAxisFormat();
		setStartOfBusiness();
		setEndOfBusiness();
		setWeekendDays();
		setBindingMode();
		setSelectable();
	}

	function updateToday()
	{
		if(opt('showDatepicker'))
			datepickers.forEach(function(e){
				e.datepicker('refresh');
			});
	}

	function setAxisFormat()
	{
		// dummy
	}

	function setStartOfBusiness()
	{
		// dummy
	}

	function setEndOfBusiness()
	{
		// dummy
	}

	function setWeekendDays()
	{
		if(opt('showDatepicker'))
			datepickers.forEach(function(e){
				e.datepicker('option','weekendDays',opt('weekendDays'));
			});
	}

	function setBindingMode()
	{
		// dummy
	}

	function setSelectable()
	{
		// dummy
	}

	function initFilters() {
		filterTable.find('.fc-filter-option').each(function() {
			if(opt('defaultFilters').indexOf($(this).attr('data-type')) != -1) {
				filterToggle($(this));
			}
			$(this).click(function(){
				filterToggle($(this));
			});
		});
	}

	function filterToggle(button) {
		if(button.hasClass('fc-filter-option-selected')) {
			button.removeClass('fc-filter-option-selected');
		}
		else {
			button.addClass('fc-filter-option-selected');
		}
		applyFilters();
	}

	function applyFilters() {
		filterTable.find('.fc-filter-option').each(function(){
			if($(this).hasClass('fc-filter-option-selected')) {
				t.getDaySegmentContainer().find('.fc-event-' + $(this).attr('data-type')).removeClass('fc-filter-hide');
			}
			else {
				t.getDaySegmentContainer().find('.fc-event-' + $(this).attr('data-type')).addClass('fc-filter-hide');
			}
		});

		opt('todoOptionalCols').forEach(function(item){
			var itemsFilled = $('.fc-event-'+item.col+':visible').filter(function(){
				return this.innerHTML!=='';
			});

			$('col.fc-event-'+item.col).toggleClass('fc-hidden-empty', !itemsFilled.length);
		});

		//if(!t.getDaySegmentContainer().find('.fc-event-selected:visible').length) {
			t.selectEvent();
		//}
	}

	function setHeight(height, dateChanged) {
		if(opt('showDatepicker')) {
			var datepickerHeight = datepickers[0].height();
			dateInfoText.css('padding-bottom', datepickerHeight - datepickers[0].children().outerHeight() + 3); //+3 for paddings
			var textHeight = dateInfoText.outerHeight();
			dateInfoNumber.css({'height': datepickerHeight - textHeight,
									'font-size': 145 - textHeight});
			dateInfoNumberDiv.height(145 - textHeight);
		}

		div.css({'height': height-div.position().top-2, 'overflow': 'auto'});
	}

	function setWidth(width) {
		element.width(width);
		var slots = Math.floor((width - dateInfo.outerWidth() - 1) / datepickers[0].outerWidth());

		if(slots > datepickers.length) {
			var defaultDate = cloneDate(currentDate, true);
			defaultDate.setHours(12);
			defaultDate.setDate(1);
			defaultDate.setMonth(currentDate.getMonth() + 1);

			if(datepickers.length==1) {
				datepickers.push($('<div>').addClass('fc-table-datepicker fc-table-datepicker-no-default').prependTo(element).datepicker({
					firstDay: opt('firstDay'),
					weekendDays: opt('weekendDays'),
					defaultDate: cloneDate(defaultDate),
					showWeek: true,
					weekHeader: '',
					hideIfNoPrevNext: true,

					onSelect: function(dateText, inst) {
						var date = new Date(dateText);
						calendar.gotoDate(date);
						trigger('datepickerClick', this, date);
					}
				}));
			}

			defaultDate.setMonth(defaultDate.getMonth() - datepickers.length + 1);
			for(var i=datepickers.length; i<slots; i++) {
				defaultDate.setMonth(defaultDate.getMonth() - 1);
				datepickers.unshift($('<div>').addClass('fc-table-datepicker fc-table-datepicker-no-default').insertBefore(filter).datepicker({
					firstDay: opt('firstDay'),
					weekendDays: opt('weekendDays'),
					defaultDate: cloneDate(defaultDate),
					showWeek: true,
					weekHeader: '',
					hideIfNoPrevNext: true,

					onSelect: function(dateText, inst) {
						var date = new Date(dateText);
						calendar.gotoDate(date);
						trigger('datepickerClick', this, date);
					}
				}));
			}
		}
		else {
			while(datepickers.length>slots && datepickers.length>1) {
				if(datepickers.length==2)
					datepickers.pop().remove();
				else
					datepickers.shift().remove();
			}
		}

		var hiddenWidth = 0;
		opt('todoOptionalCols').forEach(function(e){
			hiddenWidth += $('col.fc-event-'+e.col).hasClass('fc-hidden-empty') ? e.width : 0;
		});
		opt('todoColThresholds').forEach(function(e){
			$('col.fc-event-'+e.col).toggleClass('fc-hidden-width', width<e.width-hiddenWidth);
		});
	}

	function allowSelectEvent(value) {
		if(value)
			t.eventSelectLock++;
		else
			t.eventSelectLock--;
	}

	function dummy() {
		// Stub.
	}

}

})(jQuery);
