def ok_response(arg1=None, arg2=None, **kwargs):
    ok, message = True, ''

    if isinstance(arg1, bool) and isinstance(arg2, str):
        ok, message = arg1, arg2

    elif isinstance(arg1, str):
        if len(arg1) > 0 and arg1[0] == '-':
            ok, message = False, arg1[1:]
        else:
            ok, message = True, arg1

    result = {'ok': ok}
    if message: result['message'] = message
    if kwargs: result.update(kwargs)

    return result
