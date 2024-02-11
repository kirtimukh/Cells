import json, os, random

script_dir = os.path.dirname(os.path.abspath(__file__))
textfiles_dir = f"{script_dir}/text_files"
result_json_fname = "textfile_numlines.json"
result_json_fpath = f'{script_dir}/{result_json_fname}'


def num_of_lines_in_each_file():
    files = os.listdir(textfiles_dir)

    linecounts = []
    
    for fname in files:
        with open(f'{textfiles_dir}/{fname}', 'r') as f:
            num_lines = len(f.readlines())
            linecounts.append({'fname': fname, 'numlines': num_lines})

    obj = {
        'numfiles': len(files),
        'linecounts': linecounts
    }
    with open(result_json_fpath, 'w') as f:
        json.dump(obj, f)


def autogen_name(numwords=2):
    data = None
    with open(result_json_fpath, 'r') as f:
        data = json.load(f)
    
    autoname = ""

    for _ in range(numwords):
        f_index = random.randint(0, data['numfiles'] - 1)
        f_obj = data['linecounts'][f_index]

        f_path = f'{textfiles_dir}/{f_obj["fname"]}'
        w_index = random.randint(0, f_obj['numlines'] - 1)

        w = ""
        with open(f_path, 'r') as f1:
            w = f1.readlines()[w_index]
        
        autoname += w.strip().capitalize()

    return autoname
