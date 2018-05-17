

def cors_headers(context):
    # TODO - G.M - 17-05-2018 - Allow to configure this header in config
    context.response.headers['Access-Control-Allow-Origin'] = '*'
