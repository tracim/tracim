# Profiler

## Table of Contents
- [Introduction](#introduction)
- [When to use which profiler](#when-to-use-which-profiler)
- [Pyramid debugToolbar](#pyramid-debugtoolbar)
  - [Config](#config)
  - [Usage](#usage)
- [Pyramid tweens](#pyramid-tweens)
  - [Config](#config-1)
  - [Output](#output)
  - [Usage](#usage-1)

## Introduction

Profilers are used to trace the execution time of each function in your code.

Profilers are mainly useful when you are investigating performance issues.

### When to use which profiler

The debugToolbar is recommended for general debugging and when you need to analyze database queries.
The tweens profiler is more suitable for deep performance analysis of specific API endpoints or when
you need detailed function-level timing information.


## Pyramid debugToolbar

This profiler is useful because it's easy to use and provides database data
with a list of all SQL requests made to the database with their execution times.
The drawbacks are the absence of a graphical timeline to follow the order of events
and some difficulties running it in Docker.

### Config

To enable it, add in your development.ini file:
```
pyramid.includes = pyramid_debugtoolbar
```


You can increase the number of requests stored with:
```
debugtoolbar.max_request_history = 100
debugtoolbar.max_visible_requests = 100
```

### Usage

To use it, open the URL {tracim_url}/_debug_toolbar/

You will see a list of all requests received by the backend and information about their execution.


## Pyramid tweens

Pyramid tweens profiler has the advantage of being powerful,
but the drawback is that it's harder to use than debugToolbar.

### Config

To enable tweens you must:

Installation:
```bash
pip install pyinstrument
```

- Set pyramid.tweens in development.ini [app:tracim_web] section:
  pyramid.tweens = tracim_backend.lib.utils.tweens.profiler_tween_factory pyramid_tm.tm_tween_factory pyramid.tweens.excview_tween_factor

(The order and other tweens are important.)

- Set the profiled path with:
  `profiler_tween.path = <method>:<path>`

Both `<method>` and `<path>` are written with a regex, for example:
  profiler_tween.path = (POST|GET):\/api\/workspaces\/\d+\/files
would match both POST and GET methods for the given path.
  profiler_tween.path = .*
would match any endpoint in the application.
  profiler_tween.path = (POST|GET):\/api\/workspaces\/\d+\/files\/\d+\/revisions\/\d+\/.*
would specifically target file revisions endpoints.

### Output

The default output is to print the results in the uwsgi log.
There are other possible outputs to choose from,
but for those you will have to change the code of the function `profiler_tween_factory` in `tracim/backend/tracim_backend/lib/utils/tweens.py` file.

Replace the line :
```python
logger.debug(logger, profiler.output_text())
```

with one of those exemple depending on the output wanted:
To print the HTML file in the uwsgi log (the HTML file is more graphical than text, but you will have a lot of code to copy from the log):
```python
logger.debug(logger, profiler.output_html())
```

To save the HTML to a specific file
(but you will only get the last request; you can use "a" instead of "w" to append every request to the same file,
but you will need to separate the HTML files before reading them):
```python
file=open("/tmp/test.html","w")
file.write(profiler.output_html())
file.close()
```

To open in the browser:
```python
profiler.open_in_browser()
```
One new tab will open for every request matching the regex.
It will open in the browser of the computer running tracim, so can only be used in local.

To create a new file for every request:
```python
import os
i=0
file_name = f"{request.method}_{str(request.path).replace('/','_')}_{i}.html"
while os.path.exists(f'/tmp/{file_name}'):
  i=i+1
  file_name = f"{request.method}_{str(request.path).replace('/','_')}_{i}.html"
file=open(f'/tmp/{file_name}',"w")
file.write(profiler.output_html())
file.close()
```

### Usage

Open the file you want to view or read the terminal output.
You can see the timeline of Python functions and the time taken by each one.
