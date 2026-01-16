#!/usr/bin/env python3
"""
GraphQL Test Data Generator for Shopify Analytics.

Creates realistic Shopify shop data that DeepSeek can analyze to build patterns.
Generates orders, products, customers, and inventory data in GraphQL-like format.
"""
import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any


class ShopifyGraphQLTestData:
    """
    Generate realistic Shopify shop data for AI pattern analysis.

    Creates test data matching Shopify GraphQL schema structures.
    """

    def __init__(self, shop_id: str = "demo-shop-id"):
        self.shop_id = shop_id
        self.products = self._generate_products()
        self.customers = self._generate_customers()

    def _generate_products(self, count: int = 20) -> list[dict[str, Any]]:
        """Generate realistic product catalog."""
        categories = [
            ("Electronics", ["Wireless Earbuds", "Smart Watch", "Phone Case", "Charger", "Bluetooth Speaker"]),
            ("Apparel", ["Cotton T-Shirt", "Denim Jeans", "Hoodie", "Sneakers", "Cap"]),
            ("Home & Garden", ["LED Lamp", "Plant Pot", "Throw Pillow", "Wall Clock", "Candle Set"]),
            ("Beauty", ["Face Serum", "Lip Balm Set", "Hair Oil", "Moisturizer", "Sunscreen"]),
        ]

        products = []
        for i in range(count):
            category, items = random.choice(categories)
            base_item = random.choice(items)
            variant = random.choice(["", "Pro", "Lite", "Plus", "Premium"])

            product_id = f"gid://shopify/Product/{7000000000 + i}"
            price = round(random.uniform(9.99, 199.99), 2)
            cost = round(price * random.uniform(0.3, 0.5), 2)
            inventory = random.randint(0, 500)

            products.append({
                "id": product_id,
                "title": f"{base_item} {variant}".strip(),
                "handle": f"{base_item.lower().replace(' ', '-')}-{variant.lower()}".strip("-"),
                "productType": category,
                "vendor": f"Brand{random.randint(1, 10)}",
                "status": "ACTIVE" if inventory > 0 else "DRAFT",
                "createdAt": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat(),
                "priceRangeV2": {
                    "minVariantPrice": {"amount": str(price), "currencyCode": "USD"},
                    "maxVariantPrice": {"amount": str(price * 1.2), "currencyCode": "USD"},
                },
                "totalInventory": inventory,
                "variants": {
                    "edges": [{
                        "node": {
                            "id": f"gid://shopify/ProductVariant/{8000000000 + i}",
                            "price": str(price),
                            "compareAtPrice": str(round(price * 1.3, 2)) if random.random() > 0.7 else None,
                            "inventoryQuantity": inventory,
                            "sku": f"SKU-{category[:3].upper()}-{i:04d}",
                            "unitCost": {"amount": str(cost)},
                        }
                    }]
                },
                "metafields": {
                    "edges": [{
                        "node": {
                            "key": "category",
                            "value": category,
                            "namespace": "custom",
                        }
                    }]
                },
            })

        return products

    def _generate_customers(self, count: int = 100) -> list[dict[str, Any]]:
        """Generate realistic customer base."""
        first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]
        domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"]

        customers = []
        for i in range(count):
            first = random.choice(first_names)
            last = random.choice(last_names)
            customer_id = f"gid://shopify/Customer/{9000000000 + i}"

            # Customer lifetime value distribution (power law)
            order_count = int(random.paretovariate(1.5))
            total_spent = order_count * random.uniform(35, 150)

            customers.append({
                "id": customer_id,
                "firstName": first,
                "lastName": last,
                "email": f"{first.lower()}.{last.lower()}{random.randint(1, 99)}@{random.choice(domains)}",
                "phone": f"+1{random.randint(2000000000, 9999999999)}",
                "ordersCount": order_count,
                "totalSpentV2": {
                    "amount": str(round(total_spent, 2)),
                    "currencyCode": "USD",
                },
                "createdAt": (datetime.now() - timedelta(days=random.randint(1, 730))).isoformat(),
                "state": random.choice(["ENABLED", "ENABLED", "ENABLED", "DISABLED"]),
                "tags": random.sample(["vip", "wholesale", "newsletter", "returning", "first-time"], k=random.randint(0, 3)),
                "addresses": {
                    "edges": [{
                        "node": {
                            "city": random.choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]),
                            "province": random.choice(["NY", "CA", "IL", "TX", "AZ"]),
                            "country": "United States",
                            "countryCodeV2": "US",
                        }
                    }]
                },
            })

        return customers

    def generate_orders(self, count: int = 200) -> list[dict[str, Any]]:
        """Generate realistic order history with patterns."""
        orders = []
        base_date = datetime.now()

        for i in range(count):
            order_date = base_date - timedelta(
                days=random.randint(0, 90),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )

            customer = random.choice(self.customers)
            line_items_count = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]
            selected_products = random.sample(self.products, k=line_items_count)

            line_items = []
            subtotal = Decimal("0")

            for product in selected_products:
                quantity = random.choices([1, 2, 3], weights=[0.7, 0.2, 0.1])[0]
                price = Decimal(product["priceRangeV2"]["minVariantPrice"]["amount"])
                item_total = price * quantity
                subtotal += item_total

                line_items.append({
                    "node": {
                        "id": f"gid://shopify/LineItem/{uuid.uuid4().hex[:16]}",
                        "title": product["title"],
                        "quantity": quantity,
                        "originalUnitPriceSet": {
                            "shopMoney": {"amount": str(price), "currencyCode": "USD"}
                        },
                        "product": {"id": product["id"]},
                        "variant": {"id": product["variants"]["edges"][0]["node"]["id"]},
                    }
                })

            # Apply discounts occasionally
            discount_amount = Decimal("0")
            if random.random() > 0.7:
                discount_amount = subtotal * Decimal(str(random.uniform(0.05, 0.2)))

            total = subtotal - discount_amount

            # Order status distribution
            status = random.choices(
                ["FULFILLED", "FULFILLED", "FULFILLED", "UNFULFILLED", "PARTIALLY_FULFILLED", "CANCELLED"],
                weights=[0.6, 0.1, 0.1, 0.1, 0.05, 0.05]
            )[0]

            orders.append({
                "id": f"gid://shopify/Order/{1000000000 + i}",
                "name": f"#100{i + 1}",
                "createdAt": order_date.isoformat(),
                "processedAt": order_date.isoformat(),
                "fulfillmentStatus": status,
                "financialStatus": "PAID" if status != "CANCELLED" else "REFUNDED",
                "customer": {
                    "id": customer["id"],
                    "email": customer["email"],
                    "firstName": customer["firstName"],
                    "lastName": customer["lastName"],
                },
                "lineItems": {"edges": line_items},
                "subtotalPriceSet": {
                    "shopMoney": {"amount": str(round(subtotal, 2)), "currencyCode": "USD"}
                },
                "totalDiscountsSet": {
                    "shopMoney": {"amount": str(round(discount_amount, 2)), "currencyCode": "USD"}
                },
                "totalPriceSet": {
                    "shopMoney": {"amount": str(round(total, 2)), "currencyCode": "USD"}
                },
                "shippingAddress": customer["addresses"]["edges"][0]["node"] if customer["addresses"]["edges"] else None,
                "tags": [],
                "note": None,
                "refundable": status == "FULFILLED",
                "riskLevel": random.choice(["LOW", "LOW", "LOW", "MEDIUM", "HIGH"]),
            })

        return sorted(orders, key=lambda x: x["createdAt"], reverse=True)

    def generate_analytics_summary(self) -> dict[str, Any]:
        """Generate dashboard-ready analytics summary."""
        orders = self.generate_orders(200)

        # Calculate metrics
        total_revenue = sum(
            float(o["totalPriceSet"]["shopMoney"]["amount"])
            for o in orders if o["financialStatus"] == "PAID"
        )
        order_count = len([o for o in orders if o["financialStatus"] == "PAID"])
        aov = total_revenue / order_count if order_count > 0 else 0

        # Last 7 days
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_orders = [
            o for o in orders
            if datetime.fromisoformat(o["createdAt"].replace("Z", "+00:00").replace("+00:00", "")) > seven_days_ago
        ]
        recent_revenue = sum(
            float(o["totalPriceSet"]["shopMoney"]["amount"])
            for o in recent_orders if o["financialStatus"] == "PAID"
        )

        # Top products
        product_sales = {}
        for order in orders:
            for item in order["lineItems"]["edges"]:
                product_id = item["node"]["product"]["id"]
                product_title = item["node"]["title"]
                qty = item["node"]["quantity"]
                price = float(item["node"]["originalUnitPriceSet"]["shopMoney"]["amount"])

                if product_id not in product_sales:
                    product_sales[product_id] = {
                        "id": product_id,
                        "title": product_title,
                        "units_sold": 0,
                        "revenue": 0,
                    }
                product_sales[product_id]["units_sold"] += qty
                product_sales[product_id]["revenue"] += qty * price

        top_products = sorted(
            product_sales.values(),
            key=lambda x: x["revenue"],
            reverse=True
        )[:10]

        return {
            "shop_id": self.shop_id,
            "generated_at": datetime.now().isoformat(),
            "period": "last_90_days",
            "metrics": {
                "total_revenue": round(total_revenue, 2),
                "total_orders": order_count,
                "average_order_value": round(aov, 2),
                "last_7_days_revenue": round(recent_revenue, 2),
                "last_7_days_orders": len(recent_orders),
                "total_customers": len(self.customers),
                "total_products": len(self.products),
            },
            "top_products": top_products,
            "customer_segments": {
                "new_customers": len([c for c in self.customers if c["ordersCount"] == 1]),
                "returning_customers": len([c for c in self.customers if c["ordersCount"] > 1]),
                "vip_customers": len([c for c in self.customers if "vip" in c["tags"]]),
            },
            "inventory_status": {
                "in_stock": len([p for p in self.products if p["totalInventory"] > 10]),
                "low_stock": len([p for p in self.products if 0 < p["totalInventory"] <= 10]),
                "out_of_stock": len([p for p in self.products if p["totalInventory"] == 0]),
            },
        }

    def generate_ai_analysis_prompt(self) -> str:
        """Generate prompt for DeepSeek pattern analysis."""
        summary = self.generate_analytics_summary()
        orders = self.generate_orders(50)  # Last 50 orders for context

        prompt = f"""You are an expert e-commerce analyst. Analyze this Shopify store data and identify:
1. Revenue patterns and trends
2. Customer behavior insights
3. Product performance issues
4. Inventory optimization opportunities
5. Actionable recommendations to increase revenue

## Store Analytics Summary
```json
{json.dumps(summary, indent=2)}
```

## Recent Orders Sample (Last 50)
```json
{json.dumps(orders[:10], indent=2, default=str)}
```

## Product Catalog (Sample)
```json
{json.dumps(self.products[:5], indent=2)}
```

Provide a structured analysis with:
- Key patterns identified
- Risk factors
- Growth opportunities
- Prioritized action items (with expected impact)

Respond in JSON format with these keys:
- patterns: list of identified patterns
- risks: list of risk factors
- opportunities: list of growth opportunities
- actions: list of prioritized actions with expected_uplift
- overall_health_score: 1-100
- summary: 2-3 sentence executive summary
"""
        return prompt

    def to_graphql_response(self) -> dict[str, Any]:
        """Format data as if it came from Shopify GraphQL API."""
        return {
            "data": {
                "shop": {
                    "id": f"gid://shopify/Shop/{self.shop_id}",
                    "name": "Demo Test Store",
                    "email": "owner@demo-store.com",
                    "myshopifyDomain": "demo-store.myshopify.com",
                    "plan": {"displayName": "Shopify Plus"},
                },
                "products": {
                    "edges": [{"node": p, "cursor": f"cursor_{i}"} for i, p in enumerate(self.products)]
                },
                "customers": {
                    "edges": [{"node": c, "cursor": f"cursor_{i}"} for i, c in enumerate(self.customers)]
                },
                "orders": {
                    "edges": [{"node": o, "cursor": f"cursor_{i}"} for i, o in enumerate(self.generate_orders(100))]
                },
            },
            "extensions": {
                "cost": {
                    "requestedQueryCost": 752,
                    "actualQueryCost": 752,
                    "throttleStatus": {
                        "maximumAvailable": 2000,
                        "currentlyAvailable": 1248,
                        "restoreRate": 100,
                    },
                },
            },
        }


async def test_deepseek_analysis(api_url: str = "http://localhost:8000") -> None:
    """Test DeepSeek analysis with generated GraphQL data."""
    import httpx

    generator = ShopifyGraphQLTestData()
    prompt = generator.generate_ai_analysis_prompt()

    print("=" * 60)
    print("Testing DeepSeek Pattern Analysis")
    print("=" * 60)
    print(f"\nAPI URL: {api_url}")
    print(f"Prompt Length: {len(prompt)} chars")

    # First test if API is reachable
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            health = await client.get(f"{api_url}/health")
            print(f"API Health: {health.status_code}")
        except Exception as e:
            print(f"API not reachable: {e}")
            return

    # Save test data for manual inspection
    summary = generator.generate_analytics_summary()
    graphql_data = generator.to_graphql_response()

    print("\n--- Analytics Summary ---")
    print(json.dumps(summary["metrics"], indent=2))

    print("\n--- Top 5 Products ---")
    for p in summary["top_products"][:5]:
        print(f"  {p['title']}: ${p['revenue']:.2f} ({p['units_sold']} units)")

    print("\n--- Customer Segments ---")
    print(json.dumps(summary["customer_segments"], indent=2))

    print("\n--- Inventory Status ---")
    print(json.dumps(summary["inventory_status"], indent=2))

    # Save full data to file
    output_path = "/tmp/shopify_test_data.json"
    with open(output_path, "w") as f:
        json.dump({
            "analytics_summary": summary,
            "graphql_response": graphql_data,
            "ai_prompt": prompt,
        }, f, indent=2, default=str)

    print(f"\nFull test data saved to: {output_path}")
    print("\nTo test DeepSeek manually, use the AI analysis prompt above.")


if __name__ == "__main__":
    import sys

    api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

    print("\n" + "=" * 60)
    print("Shopify GraphQL Test Data Generator")
    print("=" * 60)

    asyncio.run(test_deepseek_analysis(api_url))
