# Harness study results

## By arm

| arm | runs | accuracy % | median wall s | mean wall s | median turns | mean tool calls | median input ktok | median output tok | mean cost USD | codemode calls | tool calls inside codemode | guardrail follow-ups | harness errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cc | 64 | 100 | 42.2 | 46.7 | 4 | 15.7 | 111.5 | 2310 | 0.29 | 0 | 0 | 0 | 0 |
| pi | 64 | 100 | 37.8 | 42.3 | 4 | 15.9 | 108.2 | 2058 | 0.28 | 0 | 0 | 6 | 0 |
| pi-codemode | 64 | 100 | 32.5 | 32.6 | 4 | 3.1 | 110.7 | 1885 | 0.19 | 35 | 60 | 8 | 0 |
| pi-codemode-only | 64 | 100 | 32.4 | 33.7 | 4 | 2.9 | 75.2 | 1975 | 0.19 | 186 | 229 | 8 | 0 |

## By task

| task | arm | accuracy % | median wall s | median turns | mean tool calls | median input ktok | mean cost USD | codemode calls | guardrail follow-ups |
|---|---|---|---|---|---|---|---|---|---|
| bash-dedupe | cc | 100 | 61.8 | 5 | 4 | 142 | 0.25 | 0 | 0 |
| bash-dedupe | pi | 100 | 44.1 | 4 | 3.1 | 105.9 | 0.21 | 0 | 0 |
| bash-dedupe | pi-codemode | 100 | 44.6 | 4 | 3.5 | 111.6 | 0.21 | 0 | 0 |
| bash-dedupe | pi-codemode-only | 100 | 46.4 | 4 | 3.1 | 76.9 | 0.21 | 25 | 0 |
| ledger-reconcile | cc | 100 | 36.3 | 4 | 2.9 | 110.7 | 0.2 | 0 | 0 |
| ledger-reconcile | pi | 100 | 35.3 | 4.5 | 3.8 | 117.4 | 0.19 | 0 | 1 |
| ledger-reconcile | pi-codemode | 100 | 30 | 4.5 | 3.3 | 123.8 | 0.18 | 0 | 2 |
| ledger-reconcile | pi-codemode-only | 100 | 31.2 | 4 | 3 | 75.2 | 0.18 | 24 | 1 |
| map-limit | cc | 100 | 41.6 | 3.5 | 2.6 | 96.1 | 0.21 | 0 | 0 |
| map-limit | pi | 100 | 36.1 | 4 | 3 | 104.7 | 0.19 | 0 | 0 |
| map-limit | pi-codemode | 100 | 33.6 | 4 | 3 | 110.2 | 0.19 | 0 | 0 |
| map-limit | pi-codemode-only | 100 | 32.4 | 3 | 2 | 55.8 | 0.18 | 16 | 0 |
| mcp-orders | cc | 100 | 73.9 | 99 | 98 | 666.2 | 0.81 | 0 | 0 |
| mcp-orders | pi | 100 | 78.5 | 17 | 97 | 759.3 | 0.84 | 0 | 0 |
| mcp-orders | pi-codemode | 100 | 26 | 3 | 2.3 | 82.9 | 0.18 | 18 | 0 |
| mcp-orders | pi-codemode-only | 100 | 26.5 | 5 | 4 | 95.8 | 0.18 | 32 | 0 |
| mcp-tickets | cc | 100 | 34 | 11.5 | 10.6 | 140.8 | 0.21 | 0 | 0 |
| mcp-tickets | pi | 100 | 32.4 | 4.5 | 9.9 | 124.2 | 0.22 | 0 | 0 |
| mcp-tickets | pi-codemode | 100 | 21.7 | 3 | 2.1 | 83.1 | 0.18 | 17 | 0 |
| mcp-tickets | pi-codemode-only | 100 | 25.4 | 5 | 4.3 | 97.5 | 0.18 | 34 | 0 |
| misleading-debug | cc | 100 | 40.3 | 3 | 2.1 | 84.1 | 0.21 | 0 | 0 |
| misleading-debug | pi | 100 | 41.3 | 4 | 3.4 | 109.1 | 0.21 | 0 | 4 |
| misleading-debug | pi-codemode | 100 | 38.3 | 5 | 3.4 | 144.1 | 0.22 | 0 | 6 |
| misleading-debug | pi-codemode-only | 100 | 40 | 5 | 2.8 | 100.8 | 0.21 | 22 | 7 |
| parse-duration | cc | 100 | 48 | 3.5 | 2.6 | 82.7 | 0.21 | 0 | 0 |
| parse-duration | pi | 100 | 37.6 | 5 | 3.9 | 133.4 | 0.21 | 0 | 1 |
| parse-duration | pi-codemode | 100 | 36.9 | 5 | 4 | 140.3 | 0.21 | 0 | 0 |
| parse-duration | pi-codemode-only | 100 | 34.4 | 3 | 2 | 56.2 | 0.19 | 16 | 0 |
| ttl-cache | cc | 100 | 40 | 4 | 3 | 110.8 | 0.21 | 0 | 0 |
| ttl-cache | pi | 100 | 29.4 | 3.5 | 2.9 | 91.9 | 0.19 | 0 | 0 |
| ttl-cache | pi-codemode | 100 | 28.9 | 4 | 3 | 110.6 | 0.19 | 0 | 0 |
| ttl-cache | pi-codemode-only | 100 | 30.3 | 3 | 2.1 | 56 | 0.18 | 17 | 0 |
