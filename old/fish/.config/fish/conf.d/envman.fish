# Load envman's generated simple export files without evaluating POSIX shell
# functions or aliases. The current envman state only contributes environment
# variables and PATH entries.
for envman_file in "$HOME/.config/envman/ENV.env" "$HOME/.config/envman/PATH.env"
    test -f "$envman_file"; or continue

    while read --local line
        string match --quiet --regex '^export [A-Za-z_][A-Za-z0-9_]*=' -- "$line"; or continue

        set --local key (string replace --regex '^export ([A-Za-z_][A-Za-z0-9_]*)=.*$' '$1' -- "$line")
        set --local value (string replace --regex '^export [A-Za-z_][A-Za-z0-9_]*=' '' -- "$line")
        set value (string trim --chars '"' -- "$value")
        set value (string replace --all '$HOME' "$HOME" -- "$value")

        if test "$key" = PATH
            set value (string replace --regex ':\$PATH$' '' -- "$value")
            fish_add_path "$value"
        else if not string match --quiet '*$*' -- "$value"
            set --global --export "$key" "$value"
        end
    end <"$envman_file"
end

set --global --export ENVMAN_LOAD loaded
