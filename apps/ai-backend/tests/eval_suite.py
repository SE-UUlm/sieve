from langchain_openai import ChatOpenAI
import asyncio
import os
import httpx
import json
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# We need an openai api key to evaluate
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print(
        "WARNING: OPENAI_API_KEY is not set in environment. This is required for this test suite."
    )

JUDGE_MODEL = "gpt-5.2"

CATEGORIES = [
    {
        "name": "Product Inquiry",
        "description": "User is asking about a product or wants recommendations.",
        "flow": {
            "name": "product",
            "structured_response_schema": {
                "properties": {
                    "products": {
                        "description": "List all Products from 'Related Products'",
                        "items": {
                            "description": "Use the provided 'related products' to fill out the products, or if not matching, fill out only name and quantity with the user provided info.",
                            "properties": {
                                "product_name": {
                                    "title": "Product Name",
                                    "type": "string",
                                },
                                "quantity": {
                                    "title": "Quantity",
                                    "type": "integer",
                                },
                                "product_id": {
                                    "type": "string",
                                    "description": "If not known, leave empty",
                                    "title": "Product Id",
                                },
                                "product_category": {
                                    "type": "string",
                                    "description": "If not known, leave empty",
                                    "title": "Product Category",
                                },
                                "metadata": {
                                    "type": "object",
                                    "description": "If known from related products, always fill it out with number of parts",
                                    "properties": {
                                        "number_of_parts": {
                                            "type": "integer",
                                            "title": "Number of Parts",
                                        }
                                    },
                                    "title": "Metadata",
                                },
                                "price": {
                                    "type": "number",
                                    "description": "If not known, leave empty",
                                    "title": "Price",
                                },
                            },
                            "required": ["product_name", "quantity", "metadata"],
                            "title": "Product",
                            "type": "object",
                        },
                        "title": "Products",
                        "type": "array",
                    },
                    "urgency": {
                        "description": "How urgent is the inquiry from 0 (not urgent) to 100 (very urgent)",
                        "title": "Urgency",
                        "type": "integer",
                    },
                },
                "required": ["products", "urgency"],
                "title": "Product Inquiry",
                "type": "object",
            },
            "structured_response_prompt": "Extract the product type and budget if mentioned.",
            "summary_prompt": "Summarize the customer's request.",
            "db_step_prompt": "Database hints: Records contain LEGO sets; product names are primarily German.",
            "email_response_prompt": "Draft a friendly response with the recommended products.",
        },
    },
    {
        "name": "Complaint",
        "description": "User is complaining about an order, service, or product quality.",
        "flow": {
            "name": "simple",
            "structured_response_schema": {
                "type": "object",
                "properties": {
                    "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                    "reason": {"type": "string"},
                },
                "required": ["severity", "reason"],
            },
            "structured_response_prompt": "Extract the severity and reason for the complaint.",
            "summary_prompt": "Summarize the complaint.",
            "email_response_prompt": "Draft an empathetic response apologizing for the issue.",
        },
    },
    {
        "name": "Support and Returns",
        "description": "User wants to return an item or needs technical support.",
        "flow": {
            "name": "product",
            "structured_response_schema": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "issue_type": {"type": "string"},
                    "product_id": {
                        "type": "string",
                        "description": "From related products, leave empty if not found",
                    },
                },
                "required": ["order_id", "issue_type"],
            },
            "structured_response_prompt": "Extract order ID and issue type.",
            "summary_prompt": "Summarize the support request.",
            "db_step_prompt": "Database hints: Records contain LEGO sets; product names are primarily German.",
            "email_response_prompt": "Provide instructions for the return or troubleshooting steps.",
        },
    },
    {
        "name": "Other",
        "description": "General inquiries or emails that do not fit into any other category, including spam.",
        "flow": {
            "name": "simple",
            "structured_response_schema": {
                "type": "object",
                "properties": {"topic": {"type": "string"}},
            },
            "structured_response_prompt": "Extract the main topic of the email.",
            "summary_prompt": "Summarize the email content.",
            "email_response_prompt": "Draft a polite response if applicable, or just acknowledge receipt. If it is spam, draft a very brief rejection.",
        },
    },
]

GLOBAL_CONFIG = {
    "overall_email_response_prompt": "Combine the responses into a single coherent and professional email to the customer."
}

TEST_CASES = [
    {
        "name": "Scenario 1: Product Inquiry Helicopters",
        "email": {
            "subject": "Looking for a new set",
            "body": "Hi, I'm looking for the helicopter set. Do you have any recommendations?",
        },
        "expected_categories": ["Product Inquiry"],
        "expected_structured_outputs": {
            "Product Inquiry": {
                "products": [
                    {
                        "product_id": "42181",
                        "product_name": "Technic Rettungshubschrauber",
                        "product_category": "Technic",
                        "price": 99.99,
                        "metadata": {"number_of_parts": 1104},
                        "quantity": 1,
                    },
                    {
                        "product_id": "60447",
                        "product_name": "City Polizeihubschrauber",
                        "product_category": "City",
                        "price": 24.99,
                        "metadata": {"number_of_parts": 274},
                        "quantity": 1,
                    },
                ]
            }
        },
    },
    {
        "name": "Scenario 2: Support and Returns Beach Villa",
        "email": {
            "subject": "Return request for order #12345",
            "body": "Hello, I want to return the villa at the beach I bought last week. It's missing some pieces. Order ID is 12345.",
        },
        "expected_categories": ["Support and Returns"],
        "expected_structured_outputs": {
            "Support and Returns": {"order_id": "12345", "product_id": "31146"}
        },
    },
    {
        "name": "Scenario 3: Missing Product Info",
        "email": {
            "subject": "Need a cable",
            "body": "I need a cable for my phone. Can you help?",
        },
        "expected_categories": ["Product Inquiry"],
        "expected_structured_outputs": {"Product Inquiry": {"products": []}},
    },
    {
        "name": "Scenario 4: Angry Complaint",
        "email": {
            "subject": "Terrible service!",
            "body": "I am furious! My order is 3 weeks late and support ignores me. This is unacceptable.",
        },
        "expected_categories": ["Complaint"],
        "expected_structured_outputs": {"Complaint": {"severity": "high"}},
    },
    {
        "name": "Scenario 5: Multi-intent Spam",
        "email": {
            "subject": "You have won a million dollars!",
            "body": "Click here to claim your prize! Best casino online!",
        },
        "expected_categories": ["Other"],
        "expected_structured_outputs": {},
    },
    {
        "name": "Scenario 6: 3 Categories Match",
        "email": {
            "subject": "Broken set, need replacement and I am angry",
            "body": "I am so mad right now! The set I bought (extraterrestial thing) arrived completely destroyed. Everything is in individual pieces. I want to return it immediately. Also, since I still need a new one, do you have friends set with more than 1000 pieces? Please list all of them. I need it for my son. Also I am mad because of your bad website!",
        },
        "expected_categories": ["Complaint", "Support and Returns", "Product Inquiry"],
        "expected_structured_outputs": {
            "Complaint": {"severity": "high"},
            "Support and Returns": {"product_id": "75408"},
            "Product Inquiry": {
                "products": [
                    {
                        "product_id": "42622",
                        "product_name": "Friends Filmstudio",
                        "product_category": "Friends",
                        "price": 99.99,
                        "metadata": {"number_of_parts": 1098},
                        "quantity": 1,
                    },
                    {
                        "product_id": "42623",
                        "product_name": "Friends Strandresort",
                        "product_category": "Friends",
                        "price": 139.99,
                        "metadata": {"number_of_parts": 1544},
                        "quantity": 1,
                    },
                    {
                        "product_id": "42628",
                        "product_name": "Friends Reitturnier Arena",
                        "product_category": "Friends",
                        "price": 99.99,
                        "metadata": {"number_of_parts": 1102},
                        "quantity": 1,
                    },
                    {
                        "product_id": "42632",
                        "product_name": "Friends Sommerhaus",
                        "product_category": "Friends",
                        "price": 109.99,
                        "metadata": {"number_of_parts": 1204},
                        "quantity": 1,
                    },
                ]
            },
        },
    },
]


def check_subset(expected, actual) -> tuple[bool, str]:
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            return False, f"Expected dictionary, got {type(actual).__name__}"
        for k, v in expected.items():
            if k not in actual:
                return False, f"Missing key: '{k}'"
            ok, msg = check_subset(v, actual[k])
            if not ok:
                return False, f"At key '{k}': {msg}"
        return True, ""
    elif isinstance(expected, list):
        if not isinstance(actual, list):
            return False, f"Expected list, got {type(actual).__name__}"
        for e_item in expected:
            found = False
            for a_item in actual:
                ok, _ = check_subset(e_item, a_item)
                if ok:
                    found = True
                    break
            if not found:
                return False, f"Missing item in array: {e_item}"
        return True, ""
    else:
        if str(expected).lower() != str(actual).lower():
            return False, f"Expected '{expected}', got '{actual}'"
        return True, ""


class EvalOutput(BaseModel):
    is_plausible: bool = Field(
        description="Whether the tested response / output is plausible based on the input email"
    )
    reasoning: str = Field(description="Short reason why it was evaluated as such")


async def evaluate_with_llm(context: str, to_evaluate: str) -> EvalOutput:
    try:
        llm = ChatOpenAI(model=JUDGE_MODEL, api_key=OPENAI_API_KEY, temperature=0.0)  # ty:ignore[unknown-argument]
        structured_llm = llm.with_structured_output(EvalOutput)

        prompt = f"""
        You are an expert evaluator. Evaluate the plausibility and correctness of the generated outputs based on the provided context (an email).
        
        Email Context:
        {context}
        
        Generated Output to evaluate:
        {to_evaluate}
        """

        result = await structured_llm.ainvoke(prompt)
        assert isinstance(result, EvalOutput)

        return result
    except Exception as e:
        return EvalOutput(
            is_plausible=False, reasoning=f"Evaluation failed with error: {str(e)}"
        )


async def run_scenario(client: httpx.AsyncClient, scenario: dict):
    print(f"\n{'=' * 60}")
    print(f"🛠️  Running {scenario['name']}")
    print(f"Subject: {scenario['email']['subject']}")

    payload = {
        "email": scenario["email"],
        "model": {
            "provider": "OPENAI",
            "api_key": OPENAI_API_KEY,
            "simple_model": "gpt-4o-mini",
            "complex_model": "gpt-5.2",
        },
        "categories": CATEGORIES,
        "config": GLOBAL_CONFIG,
    }

    try:
        response = await client.post(
            "http://localhost:8000/analyze-email", json=payload, timeout=60.0
        )
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"🛑 [ERROR] Failed to make request: {e}")
        print(
            "AI-Backend needs to be running for this test suite. Product DB needs to be running and prepared."
        )
        return

    result_data = data.get("data", {})
    category_results = result_data.get("category_results", [])
    matched_categories = [
        cr.get("category") for cr in category_results if "category" in cr
    ]
    expected = set(scenario["expected_categories"])
    matched = set(matched_categories)

    cat_match = expected == matched
    print(f"\n📊 [Category Match] {'✅ PASS' if cat_match else '❌ FAIL'}")
    print(f"  Expected: {list(expected)}")
    print(f"  Actual:   {list(matched)}")

    # Evaluate individual category results
    email_context = (
        f"Subject: {scenario['email']['subject']}\nBody: {scenario['email']['body']}"
    )

    for cat_res in category_results:
        cat_name = cat_res["category"]
        steps = cat_res.get("steps", {})
        structured_output = cat_res.get("structured_output")
        summary = steps.get("summary", "")

        print(f"\n  ⚙️  --- Category Result: {cat_name} ---")

        # Evaluate structured output (fixed match)
        expected_struct = scenario.get("expected_structured_outputs", {}).get(cat_name)
        if expected_struct is not None:
            is_match, reason = check_subset(expected_struct, structured_output)
            print(
                f"  [Eval Structured Output] {'✅ PASS' if is_match else '❌ FAIL'} - {reason if not is_match else 'Matches expected values'}"
            )
            print(f"Actual value: {structured_output}")
        else:
            print("  [Eval Structured Output] ⏭️  SKIPPED - No expected values defined")

        # Evaluate summary
        eval_summary = await evaluate_with_llm(
            f"This summary is only for the category '{cat_name}'.\nCustomer email:\n{email_context}",
            f"Category: {cat_name}\nSummary:\n{summary}",
        )
        print(
            f"  [Eval Summary] {'✅ PASS' if eval_summary.is_plausible else '❌ FAIL'} - {eval_summary.reasoning}"
        )

    # Evaluate overall email response
    overall_response = result_data.get("email_response")
    if overall_response:
        eval_overall = await evaluate_with_llm(
            f"You can use the following structured information to check data retrieved from the product database:\n{json.dumps(scenario.get('expected_structured_outputs'))}\n\nCustomer email:\n{email_context}",
            f"Overall Email Response Draft:\nSubject:{overall_response.get('response_subject')}\nBody:{overall_response.get('response_body')}",
        )
        print(
            f"\n[Eval Overall Email Response] {'✅ PASS' if eval_overall.is_plausible else '❌ FAIL'} - {eval_overall.reasoning}"
        )
    else:
        print(
            "\n[Eval Overall Email Response] ⏭️  SKIPPED (No overall email response generated)"
        )


async def main():
    async with httpx.AsyncClient() as client:
        for scenario in TEST_CASES:
            await run_scenario(client, scenario)


if __name__ == "__main__":
    asyncio.run(main())
