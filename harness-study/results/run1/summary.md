# Harness study results

## By arm

| arm | runs | accuracy % | median wall s | mean wall s | median turns | mean tool calls | median input ktok | median output tok | mean cost USD | codemode calls | tool calls inside codemode | guardrail follow-ups | harness errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cc | 248 | 100 | 28.8 | 28.1 | 3 | 2.2 | 179.2 | 685 | 0.43 | 0 | 0 | 0 | 0 |
| pi | 248 | 99 | 23.4 | 22.8 | 4 | 2.5 | 101.1 | 602 | 0.15 | 0 | 0 | 17 | 0 |
| pi-codemode | 248 | 98 | 22.9 | 22.4 | 3.5 | 2.5 | 95.5 | 586 | 0.15 | 2 | 3 | 16 | 0 |
| pi-codemode-only | 248 | 100 | 22.2 | 21.3 | 3 | 1.9 | 56.6 | 622 | 0.15 | 480 | 509 | 13 | 0 |

## By task

| task | arm | accuracy % | median wall s | median turns | mean tool calls | median input ktok | mean cost USD | codemode calls | guardrail follow-ups |
|---|---|---|---|---|---|---|---|---|---|
| bash-bugfix | cc | 100 | 29.7 | 3 | 2 | 175.2 | 0.42 | 0 | 0 |
| bash-bugfix | pi | 100 | 24.1 | 3 | 3 | 76.5 | 0.15 | 0 | 0 |
| bash-bugfix | pi-codemode | 100 | 24.6 | 4 | 3 | 107.7 | 0.15 | 2 | 0 |
| bash-bugfix | pi-codemode-only | 100 | 23.3 | 3 | 2 | 54 | 0.14 | 62 | 0 |
| dead-function | cc | 100 | 26.2 | 3 | 1.8 | 177.2 | 0.43 | 0 | 0 |
| dead-function | pi | 100 | 28.1 | 4 | 2.7 | 102.3 | 0.16 | 0 | 0 |
| dead-function | pi-codemode | 100 | 27.2 | 4 | 2.8 | 107.8 | 0.17 | 0 | 1 |
| dead-function | pi-codemode-only | 100 | 28.2 | 3 | 2.2 | 56.5 | 0.16 | 67 | 3 |
| fanout-ports | cc | 100 | 19.6 | 3 | 2 | 179.3 | 0.43 | 0 | 0 |
| fanout-ports | pi | 100 | 11.4 | 3 | 2 | 76.7 | 0.15 | 0 | 0 |
| fanout-ports | pi-codemode | 100 | 14.4 | 3 | 2 | 84.1 | 0.15 | 0 | 0 |
| fanout-ports | pi-codemode-only | 100 | 14.2 | 3 | 2.3 | 58.2 | 0.16 | 71 | 0 |
| js-bugfix | cc | 100 | 42.1 | 4 | 3.3 | 238.4 | 0.46 | 0 | 0 |
| js-bugfix | pi | 100 | 29.7 | 5 | 3.7 | 132 | 0.17 | 0 | 0 |
| js-bugfix | pi-codemode | 100 | 32.4 | 5 | 3.7 | 139.2 | 0.17 | 0 | 1 |
| js-bugfix | pi-codemode-only | 100 | 29.1 | 4 | 2.6 | 76.7 | 0.16 | 82 | 0 |
| log-filter | cc | 100 | 35.7 | 4 | 3.3 | 235.8 | 0.45 | 0 | 0 |
| log-filter | pi | 94 | 33 | 6 | 3.8 | 153.5 | 0.17 | 0 | 17 |
| log-filter | pi-codemode | 81 | 31.3 | 5 | 3.5 | 134.9 | 0.17 | 0 | 14 |
| log-filter | pi-codemode-only | 97 | 25.1 | 3 | 2.3 | 53.6 | 0.15 | 72 | 10 |
| org-chart | cc | 100 | 27.8 | 3 | 2.3 | 175.2 | 0.43 | 0 | 0 |
| org-chart | pi | 100 | 16.8 | 4 | 2.6 | 101.1 | 0.15 | 0 | 0 |
| org-chart | pi-codemode | 100 | 17.2 | 3 | 2.4 | 80.1 | 0.15 | 0 | 0 |
| org-chart | pi-codemode-only | 100 | 15.5 | 3 | 2 | 54 | 0.15 | 63 | 0 |
| qa-baseline | cc | 100 | 7.7 | 1 | 0 | 61.2 | 0.4 | 0 | 0 |
| qa-baseline | pi | 100 | 4.8 | 1 | 0 | 24.9 | 0.12 | 0 | 0 |
| qa-baseline | pi-codemode | 100 | 4.4 | 1 | 0 | 26.3 | 0.12 | 0 | 0 |
| qa-baseline | pi-codemode-only | 100 | 4.5 | 1 | 0 | 17.5 | 0.11 | 0 | 0 |
| rename-across | cc | 100 | 33.4 | 3 | 2.5 | 179.2 | 0.44 | 0 | 0 |
| rename-across | pi | 100 | 25.5 | 3 | 2.4 | 79.2 | 0.16 | 0 | 0 |
| rename-across | pi-codemode | 100 | 24.3 | 3 | 2.4 | 83.4 | 0.16 | 0 | 0 |
| rename-across | pi-codemode-only | 100 | 26.7 | 3 | 2 | 57 | 0.15 | 63 | 0 |
