<%inherit file="local:templates.master_authenticated"/>

<%def name="title()">Debug - Tango Icons</%def>

    <style>
        body{
            padding-top: 60px;
        }
        #icon_grid li{
            width: 23%;
        }
    </style>

    <div class="container">
        <h1>Tango Icons</h1>

<%
    # ./pod/public/assets/icons/22x22/mimetypes/x-office-calendar.png
    # -> size 22
    # -> icon mimetypes/x-office-calendar
    # -> url  /assets/icons/22x22/mimetypes/x-office-calendar.png
    import os
    import sys

    icon_files = dict()
    rootdir = './tracim/public/assets/icons/'
    
    for root, subFolders, files in os.walk(rootdir):
        for foundFile in files:
            file_path = os.path.join(root,foundFile)
            file_path, file_ext = os.path.splitext(file_path)
            file_path = file_path.replace(rootdir, '')
            
            if file_ext=='.png':
                # now we have something like 22x22/mimetypes/x-office-calendar
                file_size, file_id = file_path.split('/', 1) # will keep mimetypes/x-office-calendar as one part
            
                if file_id not in icon_files:
                    icon_files[file_id] = list()
              
                icon_files[file_id].append(tg.url('/assets/icons/{0}/{1}.png'.format(file_size, file_id)))
                
%>
        <div><div class="row">
% for icon_id in sorted(icon_files):
            <div class="pull-left" style="margin: 1em; overflow: hidden; height: 4em; width: 10em;" title="${icon_id}">
                % for icon_path in sorted(icon_files[icon_id]):
                    <img src="${icon_path}"/>
                % endfor
                <br/>${icon_id}
            </div>
% endfor
      
        </div></div>
    </div>


