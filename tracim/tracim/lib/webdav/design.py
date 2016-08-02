from tracim.model.data import VirtualEvent
from tracim.model import data
from tracim.model.data import ContentType
from datetime import datetime

def create_readable_date(created, delta_from_datetime: datetime = None):
    aff = ''

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
    # f = open('wsgidav/addons/webdav/style.css', 'r')
    style = ''  # f.read()
    # f.close()

    hist = content.get_history()
    histHTML = '<table class="table table-striped table-hover">'
    for event in hist:
        if isinstance(event, VirtualEvent):
            date = event.create_readable_date()
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
                'move': 'Item moved'
            }

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
                       '<i class="fa fa-caret-left"></i> shown' if event.id == content_revision.revision_id else '''<span><a class="revision-link" href="/.history/%s/%s-%s">(View revision)</a></span>''' % (
                       content_revision.label, event.id, event.ref_object.label) if event.type.id in ['revision', 'creation', 'edition'] else '')

    histHTML += '</table>'

    file = '''
<html>
<head>
	<title>%s</title>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
	<link rel="stylesheet" href="/home/arnaud/Documents/css/style.css">
	<script type="text/javascript" src="/home/arnaud/Documents/css/script.js"></script>
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
                    <a class="btn btn-default">
                        <i class="fa fa-external-link"></i> View in tracim</a>
                    </a>
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
            elems = document.getElementsByClassName('revision-link');
            for(var i = 0; i<elems.length; i++) {
                test = window.location.href
                test += "/.." + elems[i].href.replace(/file:\/\//, "")
                elems[i].href = test
            }
        }
    </script>
</body>
</html>
        ''' % (content_revision.label,
               content_revision.label,
               content.created.strftime("%B %d, %Y at %H:%m"),
               content.owner.display_name,
               content_revision.description,
               histHTML)

    return file

def designThread(content: data.Content, content_revision: data.ContentRevisionRO, comments) -> str:

        hist = content.get_history()

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
                        'comment' : 'hmmm'
                    }

                    label = _LABELS[t.type.id]

                    disc += '''
                    <div class="row comment comment-row to-hide">
                        <i class="fa %s comment-icon"></i>
                            <div class="comment-content">
                            <h5>
                                <span class="comment-author"><b>%s</b></span>
                                <div class="pull-right text-right">%s</div>
                            </h5>
                            %s %s
                        </div>
                    </div>
                    ''' % (t.type.icon,
                           t.owner.display_name,
                           t.create_readable_date(),
                           label,
                           '''<span><a class="revision-link" href="/.history/%s/%s-%s">(View revision)</a></span>''' % (
                               content_revision.label,
                               t.id,
                               t.ref_object.label) if t.type.id in ['revision', 'creation', 'edition'] else '')

        page = '''
<html>
<head>
	<title>%s</title>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
	<link rel="stylesheet" href="/home/arnaud/Documents/css/style.css">
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
                    <a class="btn btn-default" onclick="hide_elements()">
                        <i id="hideshow" class="fa fa-eye-slash"></i> <span id="hideshowtxt" >Hide history</span></a>
                    </a>
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
            elems = document.getElementsByClassName('revision-link');
            for(var i = 0; i<elems.length; i++) {
                test = window.location.href
                test += "/.." + elems[i].href.replace(/file:\/\//, "")
                elems[i].href = test
            }
        }

        function hide_elements() {
            elems = document.getElementsByClassName('to-hide');
            if (elems.length > 0) {
                for(var i = 0; i < elems.length; i++) {
                    $(elems[i]).addClass('to-show')
                    $(elems[i]).hide();
                }
                while (elems.length>0) {
                    $(elems[0]).removeClass('to-hide');
                }
                $('#hideshow').addClass('fa-eye').removeClass('fa-eye-slash');
                $('#hideshowtxt').html('Show history');
            }
            else {
                elems = document.getElementsByClassName('to-show');
                for(var i = 0; i<elems.length; i++) {
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
               content_revision.label,
               content.created.strftime("%B %d, %Y at %H:%m"),
               content.owner.display_name,
               content_revision.description,
               disc)

        return page