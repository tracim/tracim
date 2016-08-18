<%inherit file="local:templates.master_authenticated"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ## This is the default left sidebar implementation
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ## This is the default right sidebar implementation
    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar">
        <div class="btn-group btn-group-vertical">
        </div>
        <p></p>
    </div> <!-- # End of side bar right -->
</%def>
<%def name="REQUIRED_DIALOGS()"></%def>
<%def name="FOOTER_CONTENT_LIKE_SCRIPTS_AND_CSS()"></%def>

<%def name="content_wrapper()">
    <div class="container-fluid">
        <div class="row-fluid">
        
            ## SIDEBAR LEFT
            <div id="sidebar-left" class="fixed-width-sidebar col-sm-3 sidebar" >
                <div class="btn-group" style="position: absolute; right: 2px; top: 4px; ">
                    <button id="toggle-left-sidebar-width" type="button" class="btn btn-link"><i class="fa fa-angle-double-right"></i></button>
                </div>
                ${self.SIDEBAR_LEFT_CONTENT()}
            </div>
            ## SIDEBAR LEFT [END]

            ## SIDEBAR RIGHT
            <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar">
                ${self.SIDEBAR_RIGHT_CONTENT()}
            </div> <!-- # End of side bar right -->
            ## SIDEBAR RIGHT [END]

            <div>
                ${self.TITLE_ROW()}
                ${TIM.FLASH_MSG('col-sm-8 col-sm-offset-3')}
                ${self.body()}
            </div>
        </div>
    </div>
    ${self.REQUIRED_DIALOGS()}
    
    ###########################################
    ##
    ## GENERIC STUFF LIKE SCRIPTS
    ##
    ###########################################
    <script src="${tg.url('/assets/js/jquery.min.js')}"></script>
    <!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->
    <script src="${tg.url('/assets/js/ie10-viewport-bug-workaround.js')}"></script>
    <script>
        $(function () {
            $('#toggle-left-sidebar-width').click( function() {
              sidebar = $('#sidebar-left');
              buttonIcon = $('> i', this);
              if (sidebar.hasClass('fixed-width-sidebar')) {
                sidebar.removeClass('fixed-width-sidebar')
                sidebar.removeClass('col-sm-3');
                
                buttonIcon.removeClass('fa-angle-double-right');
                buttonIcon.addClass('fa-angle-double-left');
              } else {
                sidebar.addClass('fixed-width-sidebar')
                sidebar.addClass('col-sm-3');
                buttonIcon.removeClass('fa-angle-double-left');
                buttonIcon.addClass('fa-angle-double-right');
              }
            });

            $('#current-page-breadcrumb-toggle-button').click( function() {
              $('#current-page-breadcrumb').toggle();
            });
        });
    </script>
    <!-- TinyMCE ================================================== -->
    <script src="${tg.url('/assets/tinymce/js/tinymce/tinymce.min.js')}"></script>
    ${TIM.TINYMCE_INIT_SCRIPT('.pod-rich-textarea')}

    <!-- JSTree ================================================== -->
    <link rel="stylesheet" href="${tg.url('/assets/jstree/themes/default/style.min.css')}" />
    <link rel="stylesheet" href="${tg.url('/assets/jstree/themes/tracim/style.css')}" />
    <script src="${tg.url('/assets/jstree/jstree.min.js')}"></script>


##    <link rel="stylesheet" href="${tg.url('/assets/tablesorter/themes/blue/style.css')}" />
    <script src="${tg.url('/assets/tablesorter/jquery.tablesorter.min.js')}"></script>

</%def>

