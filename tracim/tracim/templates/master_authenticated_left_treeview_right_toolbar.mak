<%inherit file="local:templates.master_authenticated"/>
<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SIDEBAR_LEFT_CONTENT()"></%def>
<%def name="SIDEBAR_RIGHT_CONTENT()"></%def>
<%def name="REQUIRED_DIALOGS()"></%def>
<%def name="FOOTER_CONTENT_LIKE_SCRIPTS_AND_CSS()"></%def>

<%def name="content_wrapper()">
    <div class="container-fluid">
        <div class="row-fluid">
        
            ## SIDEBAR LEFT
            <div id="sidebar-left" class="fixed-width-sidebar col-sm-2 sidebar" >
                <div class="btn-group" style="position: absolute; right: 2px; top: 4px; ">
                    <button id="toggle-left-sidebar-width" type="button" class="btn btn-link"><i class="fa fa-angle-double-right"></i></button>
                </div>
                ${self.SIDEBAR_LEFT_CONTENT()}
            </div>
            ## SIDEBAR LEFT [END]

            ## SIDEBAR RIGHT
            <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">
                ${self.SIDEBAR_RIGHT_CONTENT()}
            </div> <!-- # End of side bar right -->
            ## SIDEBAR RIGHT [END]
            
        <div>
            ${TIM.FLASH_MSG('col-sm-9 col-sm-offset-2')}
            
            <div class="row">
                <div class="col-sm-9 col-sm-offset-2 main">
                    ## BODY
                    ${self.body()}
                    ## BODY [END]
                </div>
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
                sidebar.removeClass('col-sm-2');
                
                buttonIcon.removeClass('fa-angle-double-right');
                buttonIcon.addClass('fa-angle-double-left');
              } else {
                sidebar.addClass('fixed-width-sidebar')
                sidebar.addClass('col-sm-2');
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
    <script>
      tinymce.init({
          menubar:false,
          statusbar:true,
          plugins: [ "table", "image", "charmap", "autolink" ],

          skin : 'custom',
          selector:'.pod-rich-textarea',
          toolbar: [
              "undo redo | bold italic underline strikethrough | bullist numlist outdent indent | table | charmap | styleselect | alignleft aligncenter alignright",
          ]
      });
    </script>
    
    <!-- JSTree ================================================== -->
    <link rel="stylesheet" href="${tg.url('/assets/jstree/themes/default/style.min.css')}" />
    <script src="${tg.url('/assets/jstree/jstree.min.js')}"></script>

</%def>

