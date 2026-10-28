# Get comfortable with data

Use AI to explain spreadsheet formulas, clean sample data, and check analytical conclusions.

Source: https://lj-web-management.github.io/guides.ai-skills.work/work/ai-spreadsheets-and-data/
Updated: 2026-10-28
Publisher: ai-skills.work

## Explain the structure before asking for a formula

Describe column meanings, data types, and the result you need. Provide a small fictional example with an expected answer. Specify the spreadsheet product because functions can differ. Ask the assistant to explain a formula in plain language so you can judge whether it matches your intention.

- Check regional date and number formats.
- Clarify how blanks, duplicates, and zero values should behave.

## Test transformations on a copy

Keep an untouched original. Try cleaning or calculation steps on a sample that includes edge cases, such as missing values and repeated rows. Check before-and-after totals. A formula that works for the first row may fail on mixed formats or a larger range.

- Verify formulas with manually calculated examples.
- Watch for changed identifiers and leading zeros.

## Interpret results carefully

Ask what assumptions an analysis makes and which alternative explanations remain. Correlation does not establish cause. Check sample size, definitions, units, and time periods before making a decision. Use an appropriate analytical tool for the calculation and AI to help explain or inspect the method.

- Separate observed patterns from predictions.
- Do not upload sensitive datasets without approval.

## In practice: A useful test case

Before accepting a formula for average order value, test three orders, a refund, and a blank row. Decide whether refunds belong in revenue and which rows count as orders. The business definition comes before the formula.

## Try it yourself

Create five fictional rows and calculate an expected total by hand. Ask for a formula and test whether it handles a blank and a duplicate correctly.

## Common questions

### Can I trust a spreadsheet formula from AI?

Treat it as a draft. Test normal inputs and edge cases, and understand the formula before relying on it.

### Can AI replace statistical expertise?

No. AI can assist with explanations and code, but the design, assumptions, and interpretation still require appropriate expertise.

## Sources and further reading

- [NIST: AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [ICO: Artificial intelligence and data protection](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/)
