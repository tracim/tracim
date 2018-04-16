#coding: utf8
from datetime import datetime

from tracim.models.data import VirtualEvent
from tracim.models.data import ContentType
from tracim.models import data

# FIXME: fix temporaire ...
style = """
.title {
	background:#F5F5F5;
	padding-right:15px;
	padding-left:15px;
	padding-top:10px;
	border-bottom:1px solid #CCCCCC;
	overflow:auto;
} .title h1 { margin-top:0; }

.content {
	padding: 15px;
}

#left{ padding:0; }

#right {
	background:#F5F5F5;
	border-left:1px solid #CCCCCC;
	border-bottom: 1px solid #CCCCCC;
	padding-top:15px;
}
@media (max-width: 1200px) {
	#right {
		border-top:1px solid #CCCCCC;
		border-left: none;
		border-bottom: none;
	}
}

body { overflow:auto; }

.btn {
	text-align: left;
}

.table tbody tr .my-align {
	vertical-align:middle;
}

.title-icon {
	font-size:2.5em;
	float:left;
	margin-right:10px;
}
.title.page, .title-icon.page { color:#00CC00; }
.title.thread, .title-icon.thread { color:#428BCA; }

/* ****************************** */
.description-icon {
	color:#999;
	font-size:3em;
}

.description {
	border-left: 5px solid #999;
	padding-left: 10px;
	margin-left: 10px;
	margin-bottom:10px;
}

.description-text {
	display:block;
	overflow:hidden;
	color:#999;
}

.comment-row:nth-child(2n) {
	background-color:#F5F5F5;
}

.comment-row:nth-child(2n+1) {
	background-color:#FFF;
}

.comment-icon {
	color:#CCC;
	font-size:3em;
	display:inline-block;
	margin-right: 10px;
	float:left;
}

.comment-content {
	display:block;
	overflow:hidden;
}

.comment, .comment-revision {
	padding:10px;
	border-top: 1px solid #999;
}

.comment-revision-icon {
	color:#777;
	margin-right: 10px;
}

.title-text {
	display: inline-block;
}
"""

_LABELS = {
    'archiving': 'Item archived',
    'content-comment': 'Item commented',
    'creation': 'Item created',
    'deletion': 'Item deleted',
    'edition': 'item modified',
    'revision': 'New revision',
    'status-update': 'New status',
    'unarchiving': 'Item unarchived',
    'undeletion': 'Item undeleted',
    'move': 'Item moved',
    'comment': 'Comment',
    'copy' : 'Item copied',
}


def create_readable_date(created, delta_from_datetime: datetime = None):
    if not delta_from_datetime:
        delta_from_datetime = datetime.now()

    delta = delta_from_datetime - created

    if delta.days > 0:
        if delta.days >= 365:
            aff = '%d year%s ago' % (delta.days / 365, 's' if delta.days / 365 >= 2 else '')
        elif delta.days >= 30:
            aff = '%d month%s ago' % (delta.days / 30, 's' if delta.days / 30 >= 2 else '')
        else:
            aff = '%d day%s ago' % (delta.days, 's' if delta.days >= 2 else '')
    else:
        if delta.seconds < 60:
            aff = '%d second%s ago' % (delta.seconds, 's' if delta.seconds > 1 else '')
        elif delta.seconds / 60 < 60:
            aff = '%d minute%s ago' % (delta.seconds / 60, 's' if delta.seconds / 60 >= 2 else '')
        else:
            aff = '%d hour%s ago' % (delta.seconds / 3600, 's' if delta.seconds / 3600 >= 2 else '')

    return aff

def designPage(content: data.Content, content_revision: data.ContentRevisionRO) -> str:
    hist = content.get_history(drop_empty_revision=False)
    histHTML = '<table class="table table-striped table-hover">'
    for event in hist:
        if isinstance(event, VirtualEvent):
            date = event.create_readable_date()
            label = _LABELS[event.type.id]

            histHTML += '''
                <tr class="%s">
                    <td class="my-align"><span class="label label-default"><i class="fa %s"></i> %s</span></td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                </tr>
                ''' % ('warning' if event.id == content_revision.revision_id else '',
                       event.type.icon,
                       label,
                       date,
                       event.owner.display_name,
                       # NOTE: (WABDAV_HIST_DEL_DISABLED) Disabled for beta 1.0
                       '<i class="fa fa-caret-left"></i> shown'  if event.id == content_revision.revision_id else '' # '''<span><a class="revision-link" href="/.history/%s/(%s - %s) %s.html">(View revision)</a></span>''' % (
                       # content.label, event.id, event.type.id, event.ref_object.label) if event.type.id in ['revision', 'creation', 'edition'] else '')
                   )
    histHTML += '</table>'

    page = '''
<html>
<head>
	<meta charset="utf-8" />
	<title>%s</title>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
	<style>%s</style>
	<script type="text/javascript" src="/home/arnaud/Documents/css/script.js"></script>
	<script
			  src="https://code.jquery.com/jquery-3.1.0.min.js"
			  integrity="sha256-cCueBR6CsyA4/9szpPfrX3s49M9vUU5BgtiJj06wt/s="
			  crossorigin="anonymous"></script>
</head>
<body>
    <div id="left" class="col-lg-8 col-md-12 col-sm-12 col-xs-12">
        <div class="title page">
            <div class="title-text">
                <i class="fa fa-file-text-o title-icon page"></i>
                <h1>%s</h1>
                <h6>page created on <b>%s</b> by <b>%s</b></h6>
            </div>
            <div class="pull-right">
                <div class="btn-group btn-group-vertical">
                    <!-- NOTE: Not omplemented yet, don't display not working link
                     <a class="btn btn-default">
                         <i class="fa fa-external-link"></i> View in tracim</a>
                     </a>-->
                </div>
            </div>
        </div>
        <div class="content col-xs-12 col-sm-12 col-md-12 col-lg-12">
            %s
        </div>
    </div>
    <div id="right" class="col-lg-4 col-md-12 col-sm-12 col-xs-12">
        <h4>History</h4>
        %s
    </div>
    <script type="text/javascript">
        window.onload = function() {
            file_location = window.location.href
            file_location = file_location.replace(/\/[^/]*$/, '')
            file_location = file_location.replace(/\/.history\/[^/]*$/, '')

            // NOTE: (WABDAV_HIST_DEL_DISABLED) Disabled for beta 1.0
            // $('.revision-link').each(function() {
            //    $(this).attr('href', file_location + $(this).attr('href'))
            // });
        }
    </script>
</body>
</html>
        ''' % (content_revision.label,
               style,
               content_revision.label,
               content.created.strftime("%B %d, %Y at %H:%m"),
               content.owner.display_name,
               content_revision.description,
               histHTML)

    return page

def designThread(content: data.Content, content_revision: data.ContentRevisionRO, comments) -> str:
        hist = content.get_history(drop_empty_revision=False)

        allT = []
        allT += comments
        allT += hist
        allT.sort(key=lambda x: x.created, reverse=True)

        disc = ''
        participants = {}
        for t in allT:
            if t.type == ContentType.Comment:
                disc += '''
                    <div class="row comment comment-row">
                        <i class="fa fa-comment-o comment-icon"></i>
                            <div class="comment-content">
                            <h5>
                                <span class="comment-author"><b>%s</b> wrote :</span>
                                <div class="pull-right text-right">%s</div>
                            </h5>
                            %s
                        </div>
                    </div>
                    ''' % (t.owner.display_name, create_readable_date(t.created), t.description)

                if t.owner.display_name not in participants:
                    participants[t.owner.display_name] = [1, t.created]
                else:
                    participants[t.owner.display_name][0] += 1
            else:
                if isinstance(t, VirtualEvent) and t.type.id != 'comment':
                    label = _LABELS[t.type.id]

                    disc += '''
                    <div class="%s row comment comment-row to-hide">
                        <i class="fa %s comment-icon"></i>
                            <div class="comment-content">
                            <h5>
                                <span class="comment-author"><b>%s</b></span>
                                <div class="pull-right text-right">%s</div>
                            </h5>
                            %s %s
                        </div>
                    </div>
                    ''' % ('warning' if t.id == content_revision.revision_id else '',
                           t.type.icon,
                           t.owner.display_name,
                           t.create_readable_date(),
                           label,
                            # NOTE: (WABDAV_HIST_DEL_DISABLED) Disabled for beta 1.0
                            '<i class="fa fa-caret-left"></i> shown' if t.id == content_revision.revision_id else '' # else '''<span><a class="revision-link" href="/.history/%s/%s-%s">(View revision)</a></span>''' % (
                               # content.label,
                               # t.id,
                               # t.ref_object.label) if t.type.id in ['revision', 'creation', 'edition'] else '')
                           )

        thread = '''
<html>
<head>
	<meta charset="utf-8" />
	<title>%s</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
	<style>%s</style>
	<script type="text/javascript" src="/home/arnaud/Documents/css/script.js"></script>
</head>
<body>
    <div id="left" class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <div class="title thread">
            <div class="title-text">
                <i class="fa fa-comments-o title-icon thread"></i>
                <h1>%s</h1>
                <h6>thread created on <b>%s</b> by <b>%s</b></h6>
            </div>
            <div class="pull-right">
                <div class="btn-group btn-group-vertical">
                    <!-- NOTE: Not omplemented yet, don't display not working link
                    <a class="btn btn-default" onclick="hide_elements()">
                       <i id="hideshow" class="fa fa-eye-slash"></i> <span id="hideshowtxt" >Hide history</span></a>
                    </a>-->
                    <a class="btn btn-default">
                        <i class="fa fa-external-link"></i> View in tracim</a>
                    </a>
                </div>
            </div>
        </div>
        <div class="content col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <div class="description">
                <span class="description-text">%s</span>
            </div>
            %s
        </div>
    </div>
    <script type="text/javascript">
        window.onload = function() {
            file_location = window.location.href
            file_location = file_location.replace(/\/[^/]*$/, '')
            file_location = file_location.replace(/\/.history\/[^/]*$/, '')

            // NOTE: (WABDAV_HIST_DEL_DISABLED) Disabled for beta 1.0
            // $('.revision-link').each(function() {
            //     $(this).attr('href', file_location + $(this).attr('href'))
            // });
        }

        function hide_elements() {
            elems = document.getElementsByClassName('to-hide');
            if (elems.length > 0) {
                for(var i = 0; i < elems.length; i++) {
                    $(elems[i]).addClass('to-show')
                    $(elems[i]).hide();
                }
                while (elems.length>0) {
                    $(elems[0]).removeClass('comment-row');
                    $(elems[0]).removeClass('to-hide');
                }
                $('#hideshow').addClass('fa-eye').removeClass('fa-eye-slash');
                $('#hideshowtxt').html('Show history');
            }
            else {
                elems = document.getElementsByClassName('to-show');
                for(var i = 0; i<elems.length; i++) {
                    $(elems[0]).addClass('comment-row');
                    $(elems[i]).addClass('to-hide');
                    $(elems[i]).show();
                }
                while (elems.length>0) {
                    $(elems[0]).removeClass('to-show');
                }
                $('#hideshow').removeClass('fa-eye').addClass('fa-eye-slash');
                $('#hideshowtxt').html('Hide history');
            }
        }
    </script>
</body>
</html>
        ''' % (content_revision.label,
               style,
               content_revision.label,
               content.created.strftime("%B %d, %Y at %H:%m"),
               content.owner.display_name,
               content_revision.description,
               disc)

        return thread
