function find_pr --description 'Open the Coinbase pull request for a selected commit'
    set --local url (git config --get remote.upstream.url 2>/dev/null)
    if test -z "$url"
        set url (git config --get remote.origin.url 2>/dev/null)
    end
    if test -z "$url"
        echo "$PWD is not a git repository" >&2
        return 1
    end

    set --local target (git log --color --first-parent --pretty=format:'%Cred%h%Creset %C(blue)<%an>%Creset %s -%C(bold yellow)%d%Creset %Cgreen(%cr)' --abbrev-commit | fzf --ansi --no-sort)
    test -n "$target"; or return

    set --local ref (string split ' ' -- "$target")[1]
    set --local repo_path
    if string match --quiet 'https://*' "$url"
        set repo_path (string replace --regex '^https://[^/]+/' '' "$url")
    else
        set repo_path (string replace --regex '^[^:]+:' '' "$url")
    end
    set repo_path (string replace --regex '\\.git$' '' "$repo_path")

    set --local pr_url (gh api "repos/$repo_path/commits/$ref/pulls" --hostname coinbase.ghe.com --jq '.[0].html_url' 2>/dev/null)
    if test -z "$pr_url"; or test "$pr_url" = null
        echo "PR not found for commit $ref in $repo_path" >&2
        return 1
    end

    open "$pr_url"
end
