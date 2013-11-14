<!DOCTYPE html>
<html>
<head>
    ${self.meta()}
    <title>${self.title()}</title>
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/bootstrap.min.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/bootstrap-responsive.min.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/style.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/glyphicons.css')}" />

    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/bootstrap-datetimepicker.min.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/external/font-awesome-4.0.3/css/font-awesome.min.css')}" />
    <style>
      /* Wrapper for page content to push down footer */
      #wrap {
        min-height: 100%;
        height: auto !important;
        height: 100%;
        /* Negative indent footer by it's height */
        margin: 0 auto -60px;
      }

      /* Set the fixed height of the footer here */
      #push,
      #footer {
        height: 60px;
      }
      #footer {
        background-color: #f5f5f5;
      }

      /* Lastly, apply responsive CSS fixes as necessary */
      @media (max-width: 767px) {
        #footer {
          margin-left: -20px;
          margin-right: -20px;
          padding-left: 20px;
          padding-right: 20px;
        }
      }
      
      /* vertical align icons in legend nodes */
      legend > i {
        vertical-align: baseline !important;
      }
      

div.pod-toolbar {
  visibility: hidden;
  position: absolute;
  right: 1.2em;
  top: 0;
}

.pod-toolbar-parent {
  border-bottom: 1px dotted #CCC;
}
.pod-toolbar-parent:Hover {
  background-color: #EFEFEF;
}
.pod-toolbar-parent:Hover > div.pod-toolbar {
  visibility: visible;
}
.pod-status {
  position: absolute;
  width: 1.2em;
  text-align: center;
  right: 0;
  top: 0;
}

.pod-item-nb-sup-block {
  color: #3a87ad;
  font-weight: bold;
}

h3:Hover div.pod-toolbar {
  visibility: visible;
}

.pod-blue {color: #3a87ad !important; }
.pod-red {color: #F00 !important; }

body { padding-top: 60px; }
@media screen and (max-width: 768px) {
    body { padding-top: 0px; }
}

## ul.nav li.dropdown:hover > ul.dropdown-menu {
##     display: block;
## }

    </style>
</head>
<body class="${self.body_class()}">
  <script src="http://code.jquery.com/jquery.js"></script>

##########################
##
## HERE COMES THE FULLSCREEN CODE FOR RICH TEXT EDITING
##
## FIXME - D.A. - 2013-11-13 - This code is testing, to remove later
<style>
  .full-size-overlay {
    height:100%;
    width:100%;
    position:fixed;
    left:0;
    top:0;
    z-index:0 !important;
    background-color:white;
    
    filter: alpha(opacity=90); /* internet explorer */
    -khtml-opacity: 0.9;      /* khtml, old safari */
    -moz-opacity: 0.9;       /* mozilla, netscape */
    opacity: 0.9;           /* fx, safari, opera */
  }
  
  .full-size-overlay-inner {
    margin: 3.5em 0.5em 0.5em 0.5em;
    overflow: auto;
    max-height: 85%;
  }

</style>
<script>

  function toggleFullScreen(outerWidgetId, innerWidgetId) {
    if($(outerWidgetId).hasClass('full-size-overlay')) {
      // Toggle from fullscreen to "normal"
      $(outerWidgetId).removeClass('full-size-overlay');
      $(innerWidgetId).removeClass('full-size-overlay-inner');
      $('.pod-toggle-full-screen-button > i').removeClass('fa-compress')
      $('.pod-toggle-full-screen-button > i').addClass('fa-expand')
    } else {
      $(outerWidgetId).addClass('full-size-overlay');
      $(innerWidgetId).addClass('full-size-overlay-inner');
      $('.pod-toggle-full-screen-button > i').removeClass('fa-expand')
      $('.pod-toggle-full-screen-button > i').addClass('fa-compress')
    }
  }

  function initToolbarBootstrapBindings(richTextEditorId) {
    // $('a[title]').tooltip({container:'body'});
    $(richTextEditorId+' > .dropdown-menu input').click(function() {return false;})
      .change(function () {$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');})
      .keydown('esc', function () {this.value='';$(this).change();});

    $('[data-role=magic-overlay]').each(function () { 
      var overlay = $(this), target = $(overlay.data('target')); 
      overlay.css('opacity', 0).css('position', 'absolute').offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
    });
    if ("onwebkitspeechchange" in document.createElement("input")) {
      var editorOffset = $(richTextEditorId).offset();
      $('#voiceBtn').css('position','absolute').offset({top: editorOffset.top, left: editorOffset.left+$(richTextEditorId).innerWidth()-35});
    } else {
      $('#voiceBtn').hide();
    }
  };
  function showErrorAlert (reason, detail) {
    var msg='';
    if (reason==='unsupported-file-type') { msg = "Unsupported format " +detail; }
    else {
      console.log("error uploading file", reason, detail);
    }
    $('<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>'+ 
     '<strong>File upload error</strong> '+msg+' </div>').prependTo('#alerts');
  };

</script>
##
## END OF FULLSCREEN CODE FOR RICH TEXT EDITING
##
##########################

  <div class="container">
    ${self.main_menu()}
    ${self.content_wrapper()}
    ${self.footer()}
  </div>

##  <script src="http://code.jquery.com/jquery.js"></script>
  <script src="${tg.url('/javascript/external/bootstrap.min.js')}"></script>
  
  <link href="${tg.url('/css/external/google-code-prettify/prettify.css')}" rel="stylesheet">
##  <link href="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-combined.no-icons.min.css" rel="stylesheet">
##  <link href="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-responsive.min.css" rel="stylesheet">
## <link href="//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">


##  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>
  <script src="${tg.url('/javascript/external/jquery.hotkeys.js')}"></script>
##  <script src="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/js/bootstrap.min.js"></script>
  <script src="${tg.url('/javascript/external/google-code-prettify/prettify.js')}"></script>
##  <link href="index.css" rel="stylesheet">
  <script src="${tg.url('/javascript/external/bootstrap-wysiwyg.js')}"></script>

<!-- WYSIWYG Text editor -->
## FIXME D.A. 2013-11-13 <link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.css"></link>
<!--link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/libs/css/bootstrap.min.css"></link-->

## FIXME D.A. 2013-11-13 <script src="/bootstrap-wysihtml5-0.0.2/libs/js/wysihtml5-0.3.0_rc2.js"></script>
## FIXME<script src="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.js"></script>
<script src="/javascript/external/bootstrap-datetimepicker.min.js"></script>

<style>
tr:Hover td div.pod-toolbar {
  visibility: hidden;
}
tr:Hover td div.pod-toolbar {
  visibility: visible;
}

.pod-status-grey-light  { background-color: #DDD; }
.pod-status-grey-middle { background-color: #BBB; }
.pod-status-grey-dark   { background-color: #AAA; }
.pod-status-active      { background-color: #FEE; }

</style>

  
            <script>
            $('#create_document_save_button').on('click', function(e){
              // We don't want this to act as a link so cancel the link action
              e.preventDefault();

              // Find form and submit it
              $('#create_document_form').submit();
            });
            </script>

            <script>
              $(document).ready(function() {
## FIXME                $('#current_node_textarea').wysihtml5({
## FIXME                  "font-styles": true, //Font styling, e.g. h1, h2, etc. Default true
## FIXME                  "emphasis": true, //Italics, bold, etc. Default true
## FIXME                  "lists": true, //(Un)ordered lists, e.g. Bullets, Numbers. Default true
## FIXME                  "html": true, //Button which allows you to edit the generated HTML. Default false
## FIXME                  "link": true, //Button to insert a link. Default true
## FIXME                  "image": true, //Button to insert an image. Default true,
## FIXME                  // "color": true //Button to change color of font  
## FIXME                });
## FIXME                $('#current_node_textarea').css('margin-bottom', '0');
## FIXME                $('#current_node_textarea').css("min-height", "12em");
## FIXME                $('#current_node_textarea').addClass("span5");

###################
##
## HERE
##
###################

##
## RE-IMPLEMENT THIS SOON !!!
##
##                /* Edit title form */
##                $("#current-document-title-edit-form" ).css("display", "none");
##                $("#current-document-title" ).dblclick(function() {
##                  $("#current-document-title" ).css("display", "none");
##                  $("#current-document-title-edit-form" ).css("display", "block");
##                });
##                $("#current-document-title-edit-cancel-button" ).click(function() {
##                  $("#current-document-title" ).css("display", "block");
##                  $("#current-document-title-edit-form" ).css("display", "none");
##                });
##                $('#current-document-title-save-cancel-button').on('click', function(e){
##                  // We don't want this to act as a link so cancel the link action
##                  e.preventDefault();
##                  $('#current-document-title-edit-form').submit();
##                });


                /* EDIT CONTENT FORM */
                $("#current-document-content-edit-form" ).css("display", "none");
                $("#current-document-content-edit-button" ).click(function() {
                  $("#current-document-content" ).css("display", "none");
                  $("#current-document-content-edit-form" ).css("display", "block");
                });
                $("#current-document-content" ).dblclick(function() {
                  $("#current-document-content" ).css("display", "none");
                  $("#current-document-content-edit-form" ).css("display", "block");
                });
                $("#current-document-content-edit-cancel-button" ).click(function() {
                  $("#current-document-content" ).css("display", "block");
                  $("#current-document-content-edit-form" ).css("display", "none");
                });
                $('#current-document-content-edit-save-button').on('click', function(e){
                  // We don't want this to act as a link so cancel the link action
                  e.preventDefault();
                  $('#current_node_textarea_wysiwyg').cleanHtml();
                  $('#current_node_textarea').val($('#current_node_textarea_wysiwyg').html());
                  $('#current-document-content-edit-form').submit();
                });

                /* ADD EVENT => FORM */
                $('#add_event_data_content_textarea').wysiwyg();
                $('#add_event_data_content_textarea').css('margin-bottom', '0');
                $('#add_event_data_content_textarea').css("height", "4em");
                $('#add_event_data_content_textarea').addClass("span3");
                /* ADD EVENT => SHOW/HIDE/SUBMIT BUTTONS */
                $("#current-document-add-event-button" ).click(function() {
                  $("#current-document-add-event-form" ).css("display", "block");
                  $("#current-document-add-event-button" ).css("display", "none");
                });
                $('#current-document-add-event-cancel-button').on('click', function(e){
                  $("#current-document-add-event-form" ).css("display", "none");
                  $("#current-document-add-event-button" ).css("display", "block");
                });
                $('#current-document-add-event-save-button').on('click', function(e){
                  e.preventDefault(); // We don't want this to act as a link so cancel the link action
                  $('#add_event_data_content_textarea_wysiwyg').cleanHtml();
                  $('#add_event_data_content_textarea').val($('#add_event_data_content_textarea_wysiwyg').html());
                  $('#current-document-add-event-form').submit();
                });

                /* ADD CONTACT => FORM */
                $('#add_contact_data_content_textarea').wysiwyg();
                $('#add_contact_data_content_textarea').css('margin-bottom', '0');
                $('#add_contact_data_content_textarea').css("height", "4em");
                $('#add_contact_data_content_textarea').addClass("span3");
                /* ADD CONTACT => SHOW/HIDE/SUBMIT BUTTONS */
                $("#current-document-add-contact-button" ).click(function() {
                  $("#current-document-add-contact-form" ).css("display", "block");
                  $("#current-document-add-contact-button" ).css("display", "none");
                });
                $('#current-document-add-contact-cancel-button').on('click', function(e){
                  $("#current-document-add-contact-form" ).css("display", "none");
                  $("#current-document-add-contact-button" ).css("display", "block");
                });
                $('#current-document-add-contact-save-button').on('click', function(e){
                  e.preventDefault(); // We don't want this to act as a link so cancel the link action
                  $('#add_contact_data_content_textarea_wysiwyg').cleanHtml();
                  $('#add_contact_data_content_textarea').val($('#add_contact_data_content_textarea_wysiwyg').html());
                  $('#current-document-add-contact-form').submit();
                });


                /* ADD COMMENT => FORM */
                $('#add_comment_data_content_textarea').wysiwyg();
                $('#add_comment_data_content_textarea').css('margin-bottom', '0');
                $('#add_comment_data_content_textarea').css("height", "4em");
                $('#add_comment_data_content_textarea').addClass("span3");
                /* ADD COMMENT => SHOW/HIDE/SUBMIT BUTTONS */
                $("#current-document-add-comment-button" ).click(function() {
                  $("#current-document-add-comment-form" ).css("display", "block");
                  $("#current-document-add-comment-button" ).css("display", "none");
                });
                $('#current-document-add-comment-cancel-button').on('click', function(e){
                  $("#current-document-add-comment-form" ).css("display", "none");
                  $("#current-document-add-comment-button" ).css("display", "block");
                });
                $('#current-document-add-comment-save-button').on('click', function(e){
                  e.preventDefault(); // We don't want this to act as a link so cancel the link action
                  $('#add_comment_data_content_textarea_wysiwyg').cleanHtml();
                  $('#add_comment_data_content_textarea').val($('#add_comment_data_content_textarea_wysiwyg').html());
                  $('#current-document-add-comment-form').submit();
                });

                /* ADD FILE => FORM */
                $('#add_file_data_content_textarea').wysiwyg();
                $('#add_file_data_content_textarea').css('margin-bottom', '0');
                $('#add_file_data_content_textarea').css("height", "4em");
                $('#add_file_data_content_textarea').addClass("span3");
                /* ADD FILE => SHOW/HIDE/SUBMIT BUTTONS */
                $("#current-document-add-file-button" ).click(function() {
                  $("#current-document-add-file-form" ).css("display", "block");
                  $("#current-document-add-file-button" ).css("display", "none");
                });
                $('#current-document-add-file-cancel-button').on('click', function(e){
                  $("#current-document-add-file-form" ).css("display", "none");
                  $("#current-document-add-file-button" ).css("display", "block");
                });
                $('#current-document-add-file-save-button').on('click', function(e){
                  e.preventDefault(); // We don't want this to act as a link so cancel the link action
                  $('#add_file_data_content_textarea_wysiwyg').cleanHtml();
                  $('#add_file_data_content_textarea').val($('#add_file_data_content_textarea_wysiwyg').html());
                  $('#current-document-add-file-form').submit();
                });


                $(function() {
                  $('.datetime-picker-input-div').datetimepicker({
                    language: 'fr-FR',
                    pickSeconds: false
                  });
                });

/*
                // Allow to go directly to required tab on load
                // Javascript to enable link to tab
                var url = document.location.toString();
                if (url.match('#')) {
                  $('.nav-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
                } 

                // Change hash for page-reload
                $('.nav-tabs a').on('shown', function (e) {
                  window.location.hash = e.target.hash;
                })
*/
                #################################
                ##
                ## The following JS code allow t
                ##
                ##
                // Javascript to enable link to tab
                var hash = document.location.hash;
                var prefix = "tab-";
                if (hash) {
                    $('.nav-tabs a[href='+hash.replace(prefix,"")+']').tab('show');
                } 

                // Change hash for page-reload
                $('.nav-tabs a').on('shown', function (e) {
                    window.location.hash = e.target.hash.replace("#", "#" + prefix);
                });

              
                #################################
                ##
                ## Show/hide behavior
                ## for the main menu
                ##
                ##
                $('a.toggle-child-menu-items').on('click', function (e) {
                  parent_id    = $(this).parent().attr('id');
                  child        = $('#'+parent_id+'-children');
                  togglebutton = $(this).children('i:first')
                  if(child.css('display')=='none'){
                    child.css("display", "block");
                    togglebutton.removeClass('icon-g-folder-plus');
                    togglebutton.attr('class', 'icon-g-folder-open');
                    console.log("class is: "+togglebutton.attr('class'));
                  } else {
                    child.css("display", "none");
                    togglebutton.removeClass('icon-g-folder-open');
                    togglebutton.addClass('icon-g-folder-plus');
                    console.log("class is: "+togglebutton.attr('class'));
                  }
                });

                #################################
                ##
                ## large / small view of the document
                ## (toggle visibility of the left panel)
                ##
                ##
                $('a#view-size-toggle-button-small').on('click', function (e) {
                  console.log("Toggle view mode");
                  $('#view-size-toggle-button-small').css('display', 'none');
                  $('#view-size-toggle-button-medium').css('display', 'block');
                  $('#view-size-toggle-button-large').css('display', 'none');
              
                  left_panel_id     = '#application-left-panel'; // is span3 by default (to be hidden in fullscreen mode)
                  main_panel_id     = '#application-main-panel'; // is span9 by default (to be 12 in fullscreen mode)
                  docu_panel_id     = '#application-document-panel'; // is span5 by default (to be span8 in fullscreen mode)
                  metadata_panel_id = '#application-metadata-panel';
                  
                  left_panel = $(left_panel_id);
                  main_panel = $(main_panel_id);
                  docu_panel = $(docu_panel_id);
                  metadata_panel = $(metadata_panel_id);

                  console.log("Toggle from small (default) to medium (no left tab)");
                  left_panel.css('display', 'block');
                  metadata_panel.css('display', 'block');
                  main_panel.removeClass('span9');
                  main_panel.removeClass('span12');
                  main_panel.addClass('span9');
                  
                  docu_panel.removeClass('span5');
                  docu_panel.removeClass('span8');
                  docu_panel.removeClass('span12');
                  docu_panel.addClass('span5');
                });

                $('a#view-size-toggle-button-medium').on('click', function (e) {
                  console.log("Toggle view mode to: MEDIUM");
                  $('#view-size-toggle-button-small').css('display', 'none');
                  $('#view-size-toggle-button-medium').css('display', 'none');
                  $('#view-size-toggle-button-large').css('display', 'block');

                  left_panel_id     = '#application-left-panel'; // is span3 by default (to be hidden in fullscreen mode)
                  main_panel_id     = '#application-main-panel'; // is span9 by default (to be 12 in fullscreen mode)
                  docu_panel_id     = '#application-document-panel'; // is span5 by default (to be span8 in fullscreen mode)
                  metadata_panel_id = '#application-metadata-panel';
                  
                  left_panel = $(left_panel_id);
                  main_panel = $(main_panel_id);
                  docu_panel = $(docu_panel_id);
                  metadata_panel = $(metadata_panel_id);

                  left_panel.css('display', 'none');
                  metadata_panel.css('display', 'block');
                  
                  main_panel.removeClass('span12');
                  main_panel.addClass('span9');
                  
                  docu_panel.removeClass('span5');
                  docu_panel.removeClass('span12');
                  docu_panel.addClass('span8');

                });

                $('a#view-size-toggle-button-large').on('click', function (e) {
                  console.log("Toggle view mode to: LARGE");
                  $('#view-size-toggle-button-small').css('display', 'block');
                  $('#view-size-toggle-button-medium').css('display', 'none');
                  $('#view-size-toggle-button-large').css('display', 'none');

                  left_panel_id     = '#application-left-panel'; // is span3 by default (to be hidden in fullscreen mode)
                  main_panel_id     = '#application-main-panel'; // is span9 by default (to be 12 in fullscreen mode)
                  docu_panel_id     = '#application-document-panel'; // is span5 by default (to be span8 in fullscreen mode)
                  metadata_panel_id = '#application-metadata-panel';
                  
                  left_panel = $(left_panel_id);
                  main_panel = $(main_panel_id);
                  docu_panel = $(docu_panel_id);
                  metadata_panel = $(metadata_panel_id);

                  left_panel.css('display', 'none');
                  metadata_panel.css('display', 'none');
                  
                  main_panel.removeClass('span9');
                  main_panel.addClass('span12');
                  
                  docu_panel.removeClass('span5');
                  docu_panel.removeClass('span8');
                  docu_panel.addClass('span12');

                });
              });

              // ALLOW TO SHOW POPOVER WITH SPECIFIC DATA
              $('.item-with-data-popoverable').popover({ html: true});



      /** Make calculator available on all pages */
      $(document).ready(function() {
        $('#keyboard span').on('click', function (e) {
          current_value = $(this).text()
          if(current_value=='C') {
            $('#calculation').val('');
            $('#result').val('');
          } else if(current_value=='=') {
            string = $('#calculation').val().replace(/[^0-9+-/\*\%\(\)]/gi, ''); // replace('/[^0-9()*/-+]/g', "");
            console.log("Compute value of "+string)
            calculation = eval(string);
            console.log("Result is: "+calculation)
            $('#result').val(calculation)
          } else {
            field = $('#calculation')
            field.oldval = field.val();
            field.val(field.oldval+current_value)
          }
        });
      });

            </script>
  <style>
    .pod-rich-text-zone {
      overflow:auto;
      min-height:3em;
      max-height: 10%;
      border: 1px solid #CCC;
      padding: 0.5em;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.075) inset;
      border-radius: 4px;
      background-color: white;
    }
    
    .pod-input-like-shadow {
      -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
      -moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
      box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
      -webkit-transition: border linear 0.2s, box-shadow linear 0.2s;
      -moz-transition: border linear 0.2s, box-shadow linear 0.2s;
      -ms-transition: border linear 0.2s, box-shadow linear 0.2s;
      -o-transition: border linear 0.2s, box-shadow linear 0.2s;
      transition: border linear 0.2s, box-shadow linear 0.2s;
    }
    .pod-input-like-shadow:focus {
      border-color: rgba(82, 168, 236, 0.8);
      -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(82, 168, 236, 0.6);
      -moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(82, 168, 236, 0.6);
      box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(82, 168, 236, 0.6);
      outline: 0;
      outline: thin dotted \9;
    }

  </style>

</body>

<%def name="content_wrapper()">
  <%
    flash=tg.flash_obj.render('flash', use_js=False)
  %>
  % if flash:
    <div class="row">
      <button type="button" class="close" data-dismiss="alert">&times;</button>
      ${flash | n}
    </div>
  % endif
  ${self.body()}
</%def>

<%def name="body_class()"></%def>
<%def name="meta()">
  <meta charset="${response.charset}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</%def>

<%def name="title()">  </%def>

<%def name="footer()">
  <div class="footer hidden-tablet hidden-phone">
    <p>Copyright &copy; pod project ${h.current_year()}</p>
  </div>
</%def>

<%def name="main_menu()">
  <div id="pod-navbar" class="navbar navbar-fixed-top">
    <div class="navbar-inner">
      <div class="container">
        <div class="nav-collapse">
          <ul class="nav">
            <li>
              <a href="${tg.url('/')}">
                <i class="fa fa-home"></i>
                <strong>pod</strong>
              </a>
            </li>
          % if request.identity:
            <li>
              <a href="${tg.url('/dashboard')}">
                <i class="fa fa-dashboard"></i>
                Dashboard
              </a>
            </li>
            <li>
              <a href="${tg.url('/document')}"><i class="fa fa-file-text-o"></i> ${_('Documents')}</a>
            </li>

            <li title=" ${_('Toggle view mode [narrow, medium, large]')}">
              <a title="${_('Toggle view mode: narrow')}" id='view-size-toggle-button-small' style="display: none;"><i class='fa fa-eye'></i></a>
              <a title="${_('Toggle view mode: medium')}" id='view-size-toggle-button-medium'><i class='fa fa-eye'></i></a>
              <a title="${_('Toggle view mode: large')}" id='view-size-toggle-button-large' style="display: none;"><i class='fa fa-eye'></i></a>
            </li>

            <li title="Rebuild document index">
            % if current_node is UNDEFINED:
              <a href="${tg.url('/api/reindex_nodes?back_to_node_id=0')}"><i class="fa fa-refresh"></i></a>
            % else:
              <a href="${tg.url('/api/reindex_nodes?back_to_node_id=%i'%(current_node.node_id))}"><i class="fa fa-refresh"></i></a>
            % endif
            </li>

##            <li class="dropdown" title="Calculator">
##              <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-g-calculator"></i></a>
##              <ul class="dropdown-menu pull-left">
##                <li class="text-center">
##                  <fieldset>
##                    <legend><i class="icon-g-calculator"></i> Calculator</legend>
##                    <table id='keyboard' style="margin:0.2em;">
##                      <tr>
##                        <td colspan="5">
##                          <input type='text' class="text-right" id='calculation'/><br/>
##                          <input type='text' class="text-right" readonly id='result'/>
##                        </td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>7</span></td>
##                        <td><span class='btn'>8</span></td>
##                        <td><span class='btn'>9</span></td>
##                        <td><span class='btn'>(</span></td>
##                        <td><span class='btn'>)</span></td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>4</span></td>
##                        <td><span class='btn'>5</span></td>
##                        <td><span class='btn'>6</span></td>
##                        <td><span class='btn'>-</span></td>
##                        <td><span class='btn'>+</span></td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>1</span></td>
##                        <td><span class='btn'>2</span></td>
##                        <td><span class='btn'>3</span></td>
##                        <td><span class='btn'>/</span></td>
##                        <td><span class='btn'>*</span></td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>.</span></td>
##                        <td><span class='btn'>0</span></td>
##                        <td><span class='btn'>%</span></td>
##                        <td><span class='btn btn-success'>=</span></td>
##                        <td><span class='btn btn-danger'>C</span></td>
##                      </tr>
##                    </table>
##                  </fieldset>
##                  <p></p>
##               </ul>
##            </li>


          % endif
          
          % if request.identity and request.identity['repoze.who.userid']=='damien@accorsi.info':
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown">Admin <b class="caret"></b></a>
              <ul class="dropdown-menu">
                <li><a href="${tg.url('/admin')}"><i class="fa fa-magic"></i> Manage</a></li>
              </ul>
            </li>
            
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-cogs "></i> Debug <b class="caret"></b></a>
              <ul class="dropdown-menu">
                <li><a href="${tg.url('/debug/iconset')}"><i class="fa fa-picture-o"></i> icon set</a></li>
                <li><a href="${tg.url('/debug/environ')}"><i class="fa fa-globe"></i>     request.environ</a></li>
                <li><a href="${tg.url('/debug/identity')}"><i class="fa fa-user-md"></i>  request.identity</a></li>
              </ul>
            </li>
            
            
            
          % endif
          </ul>
          <ul class="nav pull-right">
            % if not request.identity:
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-user"></i> Login</a>
                <ul class="dropdown-menu pull-right">
                  <li class="text-center">
                    <form action="${tg.url('/login_handler')}">
                      <fieldset>
                        <legend><i class="fa fa-key" style="vertical-align: baseline !important;"></i> Login</legend>
                        <input class="span2" type="text" id="login" name="login" placeholder="email...">
                        <input class="span2" type="password" id="password" name="password" placeholder="password...">
                        <div class="span2 control-group">
                          Remember me <input type="checkbox" id="loginremember" name="remember" value="2252000"/>
                        </div>
                        <input type="submit" id="submit" value="Login" />
                      </fieldset>
                    </form>
                 </ul>
              </li>
            % else:
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-user"></i> ${request.identity['user']}</a>
                <ul class="dropdown-menu pull-right">
                  <li class="text-center">
                    <fieldset>
                      <legend><i class="fa fa-key"></i> Logout</legend>
                      <a class="btn btn-danger" href="${tg.url('/logout_handler')}">Logout <i class="fa fa-power-off"></i> </a>
                    </fieldset>
                    <p></p>
                 </ul>
              </li>
              
            % endif
          </ul>

          #####################
          ## FIXME - D.A. - 2013-11-07 - Make search available
          ## 
          ## <form class="navbar-search pull-right" action="">
          ##   <input type="text" class="search-query span2" placeholder="Search">
          ## </form>
        </div><!-- /.nav-collapse -->
      </div><!-- /.container -->
    </div><!-- /.navbar-inner -->
  </div><!-- /.navbar -->
</%def>


</html>
