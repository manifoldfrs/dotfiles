# Harness study results

## By arm

| arm | runs | accuracy % | median wall s | mean wall s | median turns | mean tool calls | median input ktok | median output tok | mean cost USD | codemode calls | tool calls inside codemode | guardrail follow-ups | harness errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cc | 128 | 100 | 52.5 | 59.2 | 4 | 15.9 | 239.6 | 2449 | 0.58 | 0 | 0 | 0 | 0 |
| pi | 128 | 100 | 40.4 | 47.3 | 4 | 15.9 | 108.8 | 1951 | 0.28 | 0 | 0 | 14 | 0 |
| pi-codemode | 128 | 100 | 37.8 | 36.9 | 4 | 3 | 110.7 | 1859 | 0.19 | 69 | 116 | 16 | 0 |
| pi-codemode-only | 128 | 100 | 35.8 | 37.4 | 4 | 3 | 76.4 | 1918 | 0.19 | 379 | 477 | 17 | 0 |

## By task

| task | arm | accuracy % | median wall s | median turns | mean tool calls | median input ktok | mean cost USD | codemode calls | guardrail follow-ups |
|---|---|---|---|---|---|---|---|---|---|
| bash-dedupe | cc | 100 | 73.2 | 5 | 4.1 | 301.2 | 0.54 | 0 | 0 |
| bash-dedupe | pi | 100 | 48.8 | 4 | 3.7 | 106 | 0.22 | 0 | 0 |
| bash-dedupe | pi-codemode | 100 | 44.5 | 4 | 3.3 | 111.2 | 0.21 | 0 | 0 |
| bash-dedupe | pi-codemode-only | 100 | 49.1 | 4 | 3.1 | 76.7 | 0.2 | 49 | 0 |
| ledger-reconcile | cc | 100 | 49.2 | 4 | 3.3 | 239.2 | 0.48 | 0 | 0 |
| ledger-reconcile | pi | 100 | 40.6 | 5 | 3.8 | 130.6 | 0.19 | 0 | 7 |
| ledger-reconcile | pi-codemode | 100 | 38.5 | 5 | 3.8 | 137.7 | 0.19 | 0 | 7 |
| ledger-reconcile | pi-codemode-only | 100 | 33.6 | 4 | 2.8 | 75.7 | 0.18 | 45 | 4 |
| map-limit | cc | 100 | 53.8 | 4 | 3 | 237.2 | 0.48 | 0 | 0 |
| map-limit | pi | 100 | 37.1 | 4 | 3 | 104.5 | 0.19 | 0 | 0 |
| map-limit | pi-codemode | 100 | 38 | 4 | 3 | 110.1 | 0.19 | 0 | 0 |
| map-limit | pi-codemode-only | 100 | 36 | 3 | 2.3 | 55.8 | 0.18 | 36 | 0 |
| mcp-orders | cc | 100 | 103.6 | 99 | 98 | 1227.3 | 1.19 | 0 | 0 |
| mcp-orders | pi | 100 | 98.5 | 16 | 97 | 687.4 | 0.82 | 0 | 0 |
| mcp-orders | pi-codemode | 100 | 28.8 | 3 | 2.2 | 82.9 | 0.17 | 35 | 0 |
| mcp-orders | pi-codemode-only | 100 | 33.6 | 5 | 4.3 | 95.3 | 0.18 | 68 | 0 |
| mcp-tickets | cc | 100 | 42.1 | 11 | 10.4 | 315.7 | 0.53 | 0 | 0 |
| mcp-tickets | pi | 100 | 34.7 | 5 | 9.9 | 138.9 | 0.21 | 0 | 0 |
| mcp-tickets | pi-codemode | 100 | 26.6 | 3 | 2.1 | 84.8 | 0.17 | 34 | 0 |
| mcp-tickets | pi-codemode-only | 100 | 30.7 | 6 | 4.5 | 112.6 | 0.19 | 72 | 0 |
| misleading-debug | cc | 100 | 48.5 | 3.5 | 2.6 | 209.6 | 0.48 | 0 | 0 |
| misleading-debug | pi | 100 | 42.4 | 4 | 3.5 | 108.5 | 0.22 | 0 | 7 |
| misleading-debug | pi-codemode | 100 | 44.9 | 5 | 3.7 | 143.1 | 0.22 | 0 | 9 |
| misleading-debug | pi-codemode-only | 100 | 45 | 5 | 2.6 | 101.2 | 0.21 | 42 | 13 |
| parse-duration | cc | 100 | 53 | 4 | 3 | 238.3 | 0.49 | 0 | 0 |
| parse-duration | pi | 100 | 41 | 5 | 3.7 | 133.1 | 0.2 | 0 | 0 |
| parse-duration | pi-codemode | 100 | 40.9 | 4 | 3.4 | 111.4 | 0.2 | 0 | 0 |
| parse-duration | pi-codemode-only | 100 | 37.9 | 3 | 2.2 | 56.1 | 0.19 | 35 | 0 |
| ttl-cache | cc | 100 | 47 | 4 | 2.9 | 237.6 | 0.48 | 0 | 0 |
| ttl-cache | pi | 100 | 32.8 | 3 | 3 | 78.5 | 0.18 | 0 | 0 |
| ttl-cache | pi-codemode | 100 | 33.2 | 3 | 2.8 | 82.7 | 0.19 | 0 | 0 |
| ttl-cache | pi-codemode-only | 100 | 32.7 | 3 | 2 | 56 | 0.18 | 32 | 0 |
