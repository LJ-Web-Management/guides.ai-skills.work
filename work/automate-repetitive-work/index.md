# Automate one small thing well

Choose a sensible first automation and test triggers, approvals, failures, and recovery.

Source: https://lj-web-management.github.io/guides.ai-skills.work/work/automate-repetitive-work/
Updated: 2026-10-28
Publisher: ai-skills.work

## Choose a repeatable, low-stakes task

Look for work with a clear input, stable rules, and an output you can verify. Standard software rules may be enough; not every automation needs an AI model. Use AI when the task benefits from language interpretation or flexible classification, and keep the scope small while you learn.

- Estimate current effort and common mistakes.
- Avoid starting with payments, deletion, or irreversible commitments.

## Map the workflow before connecting tools

Write the trigger, input, transformation, review, and output. Check which accounts and permissions are needed. Decide where a person approves the result. Give the workflow only the access it requires, and protect any credentials through the platform’s supported secret settings.

- Make repeated events safe to handle.
- Set limits on volume, runtime, and spending.

## Test failure and recovery

Try missing fields, duplicate inputs, unavailable services, and incorrect classifications. Define what happens when a step fails. Keep a log that helps you investigate without exposing sensitive information. Run a pilot alongside the manual process and compare quality before depending on the automation.

- Build a visible stop or disable option.
- Record how to recover work that only partly completed.

## In practice: A good first pilot

A form submission creates a draft internal task with a suggested category. A team member checks the category before assignment. Duplicate submissions are recognized so the workflow does not create repeated tasks.

## Try it yourself

Map one routine task in five boxes. Mark which steps need rules, AI assistance, or human review, and write one failure case for each.

## Common questions

### Do I need coding skills?

Many automation tools provide visual builders. You still need to understand permissions, logic, errors, and the consequences of each action.

### How do I know automation saved time?

Compare total effort, including setup, corrections, monitoring, and failures, against the previous process.

## Sources and further reading

- [OWASP: Top risks for generative AI applications](https://genai.owasp.org/llm-top-10/)
- [NIST: AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
