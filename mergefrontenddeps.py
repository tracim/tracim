#!/usr/bin/env python3

# This script merges all the package.json files of the various frontend-related
# folders of the repository into a "super" package.json file that it will store
# in the .frontend-apps-node-modules folder.
# This only works if versions of packages are compatible across the repository.
# If an incompatibility is found, it is printed and the scripts exits with a
# non-zero exit code.
# Building a "super" package.json allows sharing a node_folder across all the
# frontend projects of the repository.

import os
import sys
import glob
import json


def compatible_carret_version(v1, v2):
    """ This function takes two semver strings without carret, and returns
    the closest compatible version, with the carret, following the rules
    of the carret when specifying a dependency.
    returns the empty string if the two semver are incompatible. """

    if v1 == v2:
        return "^" + v1

    version1 = v1.split(".")
    version2 = v2.split(".")

    if version1[0] == version2[0]:
        if version1[0] == "0":
            if version1[1] == version2[1]:
                if version1[2] >= version2[2]:
                    return "^" + v1
                return "^" + v2

            return ""

        if version1[1] > version2[1] or (version1[1] == version2[1] and version1[2] > version2[2]):
            return "^" + v1
        return "^" + v2

    return ""


def compatible_tilda_version(v1, v2):
    """ This function takes two semver strings without tilda, and returns
    the closest compatible version, with the tilda, following the rules
    of the tilda when specifying a dependency.
    Returns the empty string if the two semver are incompatible. """

    if v1 == v2:
        return "~" + v1

    version1 = v1.split(".")
    version2 = v2.split(".")

    if version1[0] == version2[0] and version1[1] == version2[1]:
        if version1[2] > version2[2]:
            return "~" + version1
        return "~" + version2

    return ""


def compatible_with_both_version(v1, v2, rec=False):
    """ Returns a semver dependency string that is compatible with both semver v1 and
    semver v2, or the empty string if v1 and v2 are incompatible """

    if v1 == v2:
        return v1

    if v1[0] == "^":
        if v2[0] == "^":
            return compatible_carret_version(v1[1:], v2[1:])

        if v2[0] == "~":
            return compatible_tilda_version(v1[1:], v2[1:])

        return compatible_with_both_version(v1[1:], v2)

    if v1[0] == "~":
        if v2[0] in ("^", "~"):
            return compatible_tidle_version(v1[1:], v2[1:])

        return compatible_with_both_version(v1[1:], v2)

    if not rec:
        return compatible_with_both_version(v2, v1, True)

    return ""


dependencies = {"dependencies": {}, "devDependencies": {}}

for app in glob.glob("frontend_app_*") + ["frontend", "frontend_lib"]:
    with open(app + "/package.json") as packagef:
        package = json.load(packagef)
        for (depType, knowndeps) in dependencies.items():
            for (dep, version) in package[depType].items():
                if dep in knowndeps:
                    (known_version, source) = knowndeps[dep]
                    if known_version == version:
                        knowndeps[dep] = (version, app)
                    else:
                        v = compatible_with_both_version(known_version, version)
                        if not v:
                            print(
                                "Error: conflict on dependency ("
                                + depType
                                + "): "
                                + dep
                                + ": "
                                + version
                                + " ("
                                + app
                                + ") vs. "
                                + known_version
                                + " ("
                                + source
                                + ")"
                            )
                            sys.exit(-1)
                        knowndeps[dep] = (v, app)
                else:
                    knowndeps[dep] = (version, app)

os.makedirs(".frontend-apps-node-modules", exist_ok=True)

with open(".frontend-apps-node-modules/package.json", "w") as fp:
    json.dump(
        {
            k: {dep: version for (dep, (version, app)) in val.items()}
            for (k, val) in dependencies.items()
        },
        fp,
        indent=4,
        sort_keys=True,
    )

with open(".frontend-apps-node-modules/.gitignore", "w") as f:
    f.write("*")
