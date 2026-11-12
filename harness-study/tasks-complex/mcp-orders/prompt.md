The `orders` MCP server holds this shop's order data; use it, not local files.
What was the net merchandise revenue from orders that were delivered and shipped to Canada, placed in October 2026 (UTC)?
Net revenue for an order is the sum over its line items of `qty * unit_price_cents - discount_cents`.
Treat order status case-insensitively and ignore surrounding whitespace in country codes; the shipping country decides, not the billing country.
End your reply with a final line `ANSWER: <dollars with two decimals>`, for example `ANSWER: 1234.56`.
