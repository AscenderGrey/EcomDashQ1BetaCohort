"""
Test data generator for analytics events.
Creates realistic visitor sessions with diverse behavioral patterns.
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import httpx
import asyncio


class AnalyticsTestDataGenerator:
    """
    Generate realistic analytics test data for load testing and demos.

    Generates diverse visitor archetypes:
    - Browsers (50%): Low engagement, quick exits
    - Researchers (35%): Medium engagement, product comparison
    - High-Intent Buyers (15%): Strong signals, add-to-cart, checkout
    """

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.product_pages = [
            "/products/premium-widget",
            "/products/starter-kit",
            "/products/pro-bundle",
            "/products/essential-tool",
            "/products/advanced-system",
        ]
        self.utm_sources = ["google", "facebook", "instagram", "tiktok", "email", "direct"]
        self.utm_mediums = ["cpc", "social", "organic", "email", "referral"]
        self.countries = [
            ("US", "United States"),
            ("GB", "United Kingdom"),
            ("CA", "Canada"),
            ("AU", "Australia"),
            ("DE", "Germany"),
        ]
        self.devices = ["desktop", "mobile", "tablet"]
        self.browsers = [
            ("Chrome", "120.0"),
            ("Safari", "17.2"),
            ("Firefox", "121.0"),
            ("Edge", "120.0"),
        ]

    def generate_visitor_session(self, archetype: str = "random") -> List[Dict[str, Any]]:
        """
        Generate a complete visitor session with events.

        Args:
            archetype: "browser", "researcher", "high_intent_buyer", or "random"

        Returns:
            List of event dictionaries ready to send to /track/event
        """
        if archetype == "random":
            archetype = random.choices(
                ["browser", "researcher", "high_intent_buyer"],
                weights=[0.50, 0.35, 0.15],
            )[0]

        session_id = f"sess_{uuid.uuid4().hex[:16]}"
        visitor_id = f"visitor_{uuid.uuid4().hex[:16]}"
        device_type = random.choice(self.devices)
        browser, browser_version = random.choice(self.browsers)
        country_code, country_name = random.choice(self.countries)
        utm_source = random.choice(self.utm_sources)
        utm_medium = random.choice(self.utm_mediums)

        # Generate events based on archetype
        if archetype == "browser":
            events = self._generate_browser_session(session_id, visitor_id)
        elif archetype == "researcher":
            events = self._generate_researcher_session(session_id, visitor_id)
        else:  # high_intent_buyer
            events = self._generate_high_intent_session(session_id, visitor_id)

        # Add common context to all events
        for event in events:
            event.update({
                "session_id": session_id,
                "visitor_id": visitor_id,
                "device_type": device_type,
                "browser": browser,
                "browser_version": browser_version,
                "user_agent": f"Mozilla/5.0 ({device_type}) AppleWebKit/537.36 (KHTML, like Gecko) {browser}/{browser_version}",
                "utm_source": utm_source,
                "utm_medium": utm_medium,
                "utm_campaign": f"campaign_{random.randint(1, 5)}",
                "viewport_width": 1920 if device_type == "desktop" else 375,
                "viewport_height": 1080 if device_type == "desktop" else 667,
                "consent_given": True,
            })

        return events

    def _generate_browser_session(self, session_id: str, visitor_id: str) -> List[Dict]:
        """Browser: 1-2 pages, <30 seconds, low engagement."""
        events = []
        start_time = datetime.utcnow()

        # Homepage visit
        events.append({
            "event_type": "pageview",
            "url": "https://test-store.com/",
            "path": "/",
            "referrer": "https://google.com",
            "timestamp": int(start_time.timestamp() * 1000),
        })

        # Quick scroll (low depth)
        events.append({
            "event_type": "scroll",
            "url": "https://test-store.com/",
            "path": "/",
            "properties": {"scroll_depth": random.randint(10, 35)},
            "timestamp": int((start_time + timedelta(seconds=random.randint(3, 8))).timestamp() * 1000),
        })

        # Maybe one product view, then exit
        if random.random() > 0.5:
            product_path = random.choice(self.product_pages)
            events.append({
                "event_type": "pageview",
                "url": f"https://test-store.com{product_path}",
                "path": product_path,
                "referrer": "https://test-store.com/",
                "timestamp": int((start_time + timedelta(seconds=random.randint(10, 20))).timestamp() * 1000),
            })

        return events

    def _generate_researcher_session(self, session_id: str, visitor_id: str) -> List[Dict]:
        """Researcher: 3-5 pages, 1-3 minutes, product comparison."""
        events = []
        start_time = datetime.utcnow()
        current_time = start_time

        # Homepage
        events.append({
            "event_type": "pageview",
            "url": "https://test-store.com/",
            "path": "/",
            "referrer": "https://google.com/search?q=best+widgets",
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(15, 30))

        # View multiple products (comparison)
        products_viewed = random.sample(self.product_pages, k=random.randint(2, 4))
        for product_path in products_viewed:
            # Product pageview
            events.append({
                "event_type": "pageview",
                "url": f"https://test-store.com{product_path}",
                "path": product_path,
                "referrer": "https://test-store.com/",
                "timestamp": int(current_time.timestamp() * 1000),
            })
            current_time += timedelta(seconds=random.randint(5, 10))

            # Scroll to read details
            events.append({
                "event_type": "scroll",
                "url": f"https://test-store.com{product_path}",
                "path": product_path,
                "properties": {"scroll_depth": random.randint(50, 85)},
                "timestamp": int(current_time.timestamp() * 1000),
            })
            current_time += timedelta(seconds=random.randint(10, 25))

            # Click to view images
            events.append({
                "event_type": "click",
                "url": f"https://test-store.com{product_path}",
                "path": product_path,
                "properties": {"element": "product-image", "index": random.randint(0, 3)},
                "timestamp": int(current_time.timestamp() * 1000),
            })
            current_time += timedelta(seconds=random.randint(3, 8))

        return events

    def _generate_high_intent_session(self, session_id: str, visitor_id: str) -> List[Dict]:
        """High-Intent Buyer: 4-7 pages, 2-5 minutes, add-to-cart, checkout."""
        events = []
        start_time = datetime.utcnow()
        current_time = start_time

        # Homepage
        events.append({
            "event_type": "pageview",
            "url": "https://test-store.com/",
            "path": "/",
            "referrer": "https://facebook.com/ads",
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(10, 20))

        # Browse collection
        events.append({
            "event_type": "pageview",
            "url": "https://test-store.com/collections/all",
            "path": "/collections/all",
            "referrer": "https://test-store.com/",
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(15, 30))

        # View target product
        product_path = random.choice(self.product_pages)
        product_id = product_path.split("/")[-1]

        events.append({
            "event_type": "pageview",
            "url": f"https://test-store.com{product_path}",
            "path": product_path,
            "referrer": "https://test-store.com/collections/all",
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(20, 40))

        # Deep scroll (reading details)
        events.append({
            "event_type": "scroll",
            "url": f"https://test-store.com{product_path}",
            "path": product_path,
            "properties": {"scroll_depth": random.randint(85, 100)},
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(15, 25))

        # Add to cart (KEY EVENT)
        events.append({
            "event_type": "ecommerce",
            "event_name": "add_to_cart",
            "url": f"https://test-store.com{product_path}",
            "path": product_path,
            "ecommerce": {
                "product_id": product_id,
                "product_name": product_id.replace("-", " ").title(),
                "product_price": random.uniform(29.99, 199.99),
                "product_quantity": 1,
                "cart_value": random.uniform(29.99, 199.99),
                "funnel_step": "add_to_cart",
            },
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(5, 15))

        # View cart
        events.append({
            "event_type": "pageview",
            "url": "https://test-store.com/cart",
            "path": "/cart",
            "referrer": f"https://test-store.com{product_path}",
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(10, 20))

        # Go to checkout (HIGH INTENT)
        events.append({
            "event_type": "pageview",
            "url": "https://test-store.com/checkout",
            "path": "/checkout",
            "referrer": "https://test-store.com/cart",
            "timestamp": int(current_time.timestamp() * 1000),
        })
        current_time += timedelta(seconds=random.randint(15, 30))

        # Maybe complete purchase (50% chance)
        if random.random() > 0.5:
            order_value = random.uniform(29.99, 199.99)
            events.append({
                "event_type": "ecommerce",
                "event_name": "purchase",
                "url": "https://test-store.com/checkout/complete",
                "path": "/checkout/complete",
                "ecommerce": {
                    "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}",
                    "order_value": order_value,
                    "order_currency": "USD",
                    "funnel_step": "purchase",
                },
                "timestamp": int(current_time.timestamp() * 1000),
            })

        return events

    async def send_session_events(self, events: List[Dict]) -> Dict[str, Any]:
        """Send a session's events to the analytics API."""
        async with httpx.AsyncClient() as client:
            results = {"success": 0, "failed": 0, "errors": []}

            for event in events:
                try:
                    response = await client.post(
                        f"{self.base_url}/api/v1/analytics/track/event",
                        json=event,
                        timeout=10.0,
                    )
                    if response.status_code in (200, 202):
                        results["success"] += 1
                    else:
                        results["failed"] += 1
                        results["errors"].append(response.text)
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(str(e))

                # Small delay between events to simulate real timing
                await asyncio.sleep(0.1)

            return results

    async def generate_bulk_sessions(
        self,
        count: int = 100,
        archetype_distribution: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """
        Generate and send multiple sessions in bulk.

        Args:
            count: Number of sessions to generate
            archetype_distribution: {"browser": 0.5, "researcher": 0.35, "high_intent_buyer": 0.15}

        Returns:
            Summary statistics
        """
        if archetype_distribution is None:
            archetype_distribution = {
                "browser": 0.50,
                "researcher": 0.35,
                "high_intent_buyer": 0.15,
            }

        stats = {
            "total_sessions": count,
            "total_events": 0,
            "successful_events": 0,
            "failed_events": 0,
            "archetypes": {"browser": 0, "researcher": 0, "high_intent_buyer": 0},
        }

        # Determine archetypes for sessions
        archetypes = random.choices(
            list(archetype_distribution.keys()),
            weights=list(archetype_distribution.values()),
            k=count,
        )

        for archetype in archetypes:
            stats["archetypes"][archetype] += 1
            events = self.generate_visitor_session(archetype=archetype)
            stats["total_events"] += len(events)

            result = await self.send_session_events(events)
            stats["successful_events"] += result["success"]
            stats["failed_events"] += result["failed"]

            # Print progress
            print(f"✓ Generated {archetype} session with {len(events)} events")

        return stats


# CLI usage
if __name__ == "__main__":
    import sys

    api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    session_count = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    generator = AnalyticsTestDataGenerator(base_url=api_url)

    print(f"\n🧪 Analytics Test Data Generator")
    print(f"API URL: {api_url}")
    print(f"Generating {session_count} sessions...\n")

    async def run():
        stats = await generator.generate_bulk_sessions(count=session_count)
        print(f"\n✅ Generation Complete!")
        print(f"Total Sessions: {stats['total_sessions']}")
        print(f"Total Events: {stats['total_events']}")
        print(f"Successful: {stats['successful_events']}")
        print(f"Failed: {stats['failed_events']}")
        print(f"\nArchetype Distribution:")
        for archetype, count in stats['archetypes'].items():
            print(f"  {archetype}: {count} ({count/stats['total_sessions']*100:.1f}%)")

    asyncio.run(run())
