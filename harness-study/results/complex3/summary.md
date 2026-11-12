# Harness study results

## By arm

| arm | runs | accuracy % | median wall s | mean wall s | median turns | mean tool calls | median input ktok | median output tok | mean cost USD | codemode calls | tool calls inside codemode | guardrail follow-ups | harness errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cc | 64 | 100 | 42.1 | 46.3 | 4 | 15.6 | 111.7 | 2417 | 0.29 | 0 | 0 | 0 | 0 |
| cc-codemode | 64 | 100 | 38.1 | 38.9 | 4 | 2.8 | 111.6 | 2099 | 0.2 | 33 | 41 | 0 | 0 |
| pi | 64 | 100 | 34.6 | 40.3 | 4 | 15.8 | 105.7 | 1997 | 0.28 | 0 | 0 | 2 | 0 |
| pi-codemode | 64 | 100 | 32.3 | 32.3 | 4 | 3.1 | 111 | 1844 | 0.19 | 41 | 68 | 7 | 0 |

## By task

| task | arm | accuracy % | median wall s | median turns | mean tool calls | median input ktok | mean cost USD | codemode calls | guardrail follow-ups |
|---|---|---|---|---|---|---|---|---|---|
| bash-dedupe | cc | 100 | 57 | 4.5 | 3.5 | 127.1 | 0.24 | 0 | 0 |
| bash-dedupe | cc-codemode | 100 | 56.5 | 4 | 3.1 | 115.4 | 0.24 | 0 | 0 |
| bash-dedupe | pi | 100 | 41.3 | 4 | 3 | 105.6 | 0.2 | 0 | 0 |
| bash-dedupe | pi-codemode | 100 | 41.2 | 4.5 | 3.8 | 125.5 | 0.21 | 0 | 0 |
| ledger-reconcile | cc | 100 | 36.6 | 4 | 3 | 110 | 0.2 | 0 | 0 |
| ledger-reconcile | cc-codemode | 100 | 39 | 4.5 | 3.5 | 128 | 0.21 | 0 | 0 |
| ledger-reconcile | pi | 100 | 31.4 | 4 | 3.6 | 104.9 | 0.19 | 0 | 1 |
| ledger-reconcile | pi-codemode | 100 | 31.6 | 5.5 | 3.9 | 152.5 | 0.19 | 0 | 4 |
| map-limit | cc | 100 | 42.5 | 4 | 2.8 | 110.3 | 0.21 | 0 | 0 |
| map-limit | cc-codemode | 100 | 40.4 | 3 | 2.4 | 84.2 | 0.2 | 0 | 0 |
| map-limit | pi | 100 | 32.7 | 4 | 3 | 104.5 | 0.19 | 0 | 0 |
| map-limit | pi-codemode | 100 | 32.3 | 4 | 3.4 | 110.1 | 0.2 | 3 | 0 |
| mcp-orders | cc | 100 | 76.3 | 99 | 98 | 666.7 | 0.81 | 0 | 0 |
| mcp-orders | cc-codemode | 100 | 30.3 | 4 | 3.4 | 112.2 | 0.19 | 19 | 0 |
| mcp-orders | pi | 100 | 78.8 | 15.5 | 97.1 | 646.7 | 0.82 | 0 | 0 |
| mcp-orders | pi-codemode | 100 | 23.5 | 3 | 2.5 | 82.9 | 0.17 | 20 | 0 |
| mcp-tickets | cc | 100 | 31.6 | 11 | 10.3 | 140.2 | 0.21 | 0 | 0 |
| mcp-tickets | cc-codemode | 100 | 25 | 4 | 2.8 | 110.8 | 0.17 | 14 | 0 |
| mcp-tickets | pi | 100 | 30.9 | 4 | 10.1 | 109.2 | 0.21 | 0 | 0 |
| mcp-tickets | pi-codemode | 100 | 22.3 | 3 | 2.3 | 84.3 | 0.17 | 18 | 0 |
| misleading-debug | cc | 100 | 41.3 | 3 | 2.4 | 84.1 | 0.21 | 0 | 0 |
| misleading-debug | cc-codemode | 100 | 42.1 | 3 | 2.3 | 86.5 | 0.21 | 0 | 0 |
| misleading-debug | pi | 100 | 37.8 | 4 | 3.3 | 108.4 | 0.2 | 0 | 1 |
| misleading-debug | pi-codemode | 100 | 39.8 | 4 | 3 | 114.3 | 0.21 | 0 | 3 |
| parse-duration | cc | 100 | 44.3 | 3 | 2.3 | 82.3 | 0.21 | 0 | 0 |
| parse-duration | cc-codemode | 100 | 40.7 | 4 | 2.8 | 99.4 | 0.21 | 0 | 0 |
| parse-duration | pi | 100 | 37.5 | 4 | 3.4 | 105.7 | 0.2 | 0 | 0 |
| parse-duration | pi-codemode | 100 | 36.8 | 4 | 3.1 | 111.3 | 0.2 | 0 | 0 |
| ttl-cache | cc | 100 | 37.7 | 4 | 2.8 | 96.7 | 0.21 | 0 | 0 |
| ttl-cache | cc-codemode | 100 | 34.7 | 3 | 2.4 | 84.2 | 0.19 | 0 | 0 |
| ttl-cache | pi | 100 | 30.2 | 4 | 3 | 105.2 | 0.18 | 0 | 0 |
| ttl-cache | pi-codemode | 100 | 30.2 | 4 | 3 | 110.8 | 0.19 | 0 | 0 |
