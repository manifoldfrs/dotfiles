`ledger.csv` is our internal ledger and `bank.csv` is the bank export for the same period.
Each ledger entry should settle in the bank export under its reference `LDG-<5 digits>`.
The bank writes references in several styles and letter cases, formats dates as MM/DD/YYYY, puts thousands separators in amounts, and shows outflows in parentheses.
A ledger entry may settle in several partial bank rows; it is settled only when its bank rows sum exactly to the ledger amount, sign included.
Bank rows without a reference are fees and can be ignored.
Which ledger entries are not settled?
End your reply with a final line `ANSWER: <ledger ids, comma-separated, sorted>`.
