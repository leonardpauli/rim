#!/usr/bin/env sh
#	docs/app/misc/git-hook-runner.sh
# Created by Leonard Pauli, 24 apr 2018
# <script> install all; <script> install pre-commit commit-msg;
# <script> install -noop all
inner_runner_parents="web" # or "subdir1 subdir2/path app/vue/base/web" for multiple
# todo: get inner_runner_parents from .env or similar to avoid changing this file

script_dir () { (a="/$0"; a=${a%/*}; a=${a:-.}; a=${a#/}; echo "$a"); }

all_hooks="applypatch-msg commit-msg prepare-commit-msg push-to-checkout sendemail-validate update"
all_hooks="$all_hooks pre-applypatch pre-auto-gc pre-commit pre-push pre-rebase pre-receive"
all_hooks="$all_hooks post-applypatch post-checkout post-commit post-merge post-receive post-rewrite post-update"

# install hooks
if [ "$1" = "install" ]; then
	shift;
	use_noop=""; if [ "$1" = "-noop" ]; then use_noop="1"; shift; fi
	enabled_hooks="$*"; if [ "$1" = "all" ]; then enabled_hooks="$all_hooks"; fi

	project="$(script_dir)"
	git_dir="$project/.git"
	if [ -f "$git_dir" ]; then
		git_dir="$(cat .git | grep 'gitdir:' | head -n 1 | tr -d '\n')"
		git_dir="$project/${git_dir#gitdir: }"
	fi
	echo "installing $([ ! -z "$use_noop" ] && echo 'noop' || echo 'hooks') at $git_dir/hooks/{$enabled_hooks}"

	for hook_name in $enabled_hooks; do
		hook_file="$git_dir/hooks/$hook_name"
		if [ -f "$hook_file" ]; then
			echo "$hook_name exists, skipping"
		else
			if [ ! -z "$use_noop" ]; then
				cat <<-EOF > $hook_file
				#!/usr/bin/env sh
				# noop
				EOF
			else
				cat <<-EOF > $hook_file
				#!/usr/bin/env sh
				./git-hook-runner.sh $hook_name \$*
				EOF
			fi
			chmod u+x $hook_file
		fi
	done
	exit
fi

# check inner hooks
hook_name="$1"; shift; git_params="$*"
for parent in $inner_runner_parents; do
	if [ ! -d "$parent" ]; then echo "$parent not available, skipping"; else
		(cd "$parent" && ./git-hook-runner-inner.sh $hook_name $git_params) || exit 1
	fi
done
