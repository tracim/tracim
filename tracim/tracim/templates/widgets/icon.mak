<%def name="FA(classes, title='')"><i class="fa ${classes}" alt="" title="${title}"/></i></%def>
<%def name="FA_FW(classes, title='')">${FA('fa-fw '+classes, title)}</%def>
<%def name="FA_FW_2X(classes, title='')">${FA_FW('fa-2x '+classes, title)}</%def>
<%def name="FA_TOOLTIP(classes, title='')"><span rel="tooltip" data-toggle="tooltip" data-placement="bottom" data-title="${title}">${FA(classes)}</span></%def>
