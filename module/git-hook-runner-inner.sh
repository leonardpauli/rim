#!/usr/bin/env sh
#	docs/app/misc/git-hook-runner-inner.sh
# Created by Leonard Pauli, 24 apr 2018
# based on script from yorkie (husky), made reusable by Leonard Pauli, 24 apr 2018
# usage: (cd repo && ./git-hook-runner.sh pre-commit $*) || exit 1
node_hook_runner_script="${node_hook_runner_script:-./node_modules/yorkie/src/runner.js}"

main () {
	hook_name="$1"; shift; git_params="$*"

	# Check if applypatch-msg is defined, skip if not
	has_hook_script $hook_name || exit 0

	# Add common path where Node can be found
	# standard installation paths:
	# 	Brew: /usr/local/bin; Node: /usr/local;
	export PATH="$PATH:/usr/local/bin:/usr/local"

	# Try to load nvm using path of standard installation
	load_nvm "$HOME"/.nvm
	run_nvm

	# Export Git hook params
	export GIT_PARAMS="$git_params"

	# Run hook
	node "$node_hook_runner_script" $hook_name || {
	  echo
	  echo "$hook_name hook failed (add --no-verify to bypass)"
	  exit 1
	}
}

# helpers
command_exists () { command -v "$1" >/dev/null 2>&1; }
has_hook_script () {
  [ -f package.json ] && cat package.json | grep -q "\"$1\"[[:space:]]*:"
}
# OS X and Linux only
# If nvm is not loaded, load it
load_nvm () {
  command_exists nvm || {
    export NVM_DIR="$1"
    [ -s "$1/nvm.sh" ] && . "$1/nvm.sh"
  }
}
# OS X and Linux only
# If nvm has been loaded correctly, use project .nvmrc
run_nvm () { command_exists nvm && [ -f .nvmrc ] && nvm use; }

# start
main $*
