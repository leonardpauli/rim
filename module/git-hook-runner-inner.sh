#!/usr/bin/env sh
node_hook_runner_script="${node_hook_runner_script:-./node_modules/yorkie/src/runner.js}"
. $lpdocs/app/repo/git-hook-runner-inner.sh
