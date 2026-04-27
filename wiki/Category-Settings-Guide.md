# Category Settings Guide

This page explains how to configure categories in `Settings -> Category`.

## Quick start guide

In the UI, each category card has these required fields:

1. **Name** (`name`)
2. **Flow Type** (`flow.name`) with values `Simple` or `Product`
3. **Description** (`description`)
4. **Structured Response Schema (JSON Object)** (`flow.structured_response_schema`)

Minimal working example:

```json
{
  "name": "Complaint",
  "description": "Customer reports dissatisfaction or a problem.",
  "flow": {
    "name": "simple",
    "structured_response_schema": {
      "type": "object",
      "properties": {
        "complaints": {
          "type": "array",
          "items": { "type": "string" }
        },
        "urgency": { "type": "integer" }
      },
      "required": ["complaints", "urgency"]
    }
  }
}
```

## In-depth guide

### UI field names vs JSON keys

| UI field label                              | JSON key                           |
| ------------------------------------------- | ---------------------------------- |
| `Name`                                      | `name`                             |
| `Flow Type` dropdown (`Simple` / `Product`) | `flow.name` (`simple` / `product`) |
| `Description`                               | `description`                      |
| `Structured Response Schema (JSON Object)`  | `flow.structured_response_schema`  |
| `Structured Response Prompt (Optional)`     | `flow.structured_response_prompt`  |
| `Summary Prompt (Optional)`                 | `flow.summary_prompt`              |
| `DB Step Prompt (Product Flow only)`        | `flow.db_step_prompt`              |
| `Email Response Prompt (Optional)`          | `flow.email_response_prompt`       |

### What each key is used for

- `name`: category label in output and category matching.
- `description`: context text used during categorization and per-category prompting.
- `flow.name`:
  - `simple`: summary + structured output + optional response drafting.
  - `product`: same as simple, plus product DB step.
- `flow.structured_response_schema`: schema passed to structured output generation.

### Required keys in `flow.structured_response_schema`

Practical required keys are:

1. `"type": "object"`
2. `"properties": { ... }`

Why these are required:

- The **Settings UI validation** rejects schema JSON without root `type: "object"` and `properties`.
- The structured output step expects an object schema.

Additional schema notes:

- `"required"` is optional but strongly recommended for stable outputs.
- `"title"` is optional.
  - If missing, backend auto-generates one from category name.
  - If present and containing spaces, backend sanitizes it before provider call.

### Full example (product flow)

```json
{
  "name": "Product Inquiry",
  "description": "Customer asks about product availability or ordering.",
  "flow": {
    "name": "product",
    "structured_response_schema": {
      "type": "object",
      "title": "Product Inquiry",
      "properties": {
        "products": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product_name": { "type": "string" },
              "quantity": { "type": "integer" }
            },
            "required": ["product_name", "quantity"]
          }
        },
        "urgency": { "type": "integer" }
      },
      "required": ["products", "urgency"]
    },
    "db_step_prompt": "Database hints: product names are stored in German.",
    "structured_response_prompt": "Be concise and use exact quantities from the email.",
    "summary_prompt": "Summarize in one short paragraph.",
    "email_response_prompt": "If product is unclear, ask follow-up questions."
  }
}
```
