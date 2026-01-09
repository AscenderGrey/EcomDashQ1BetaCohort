"""
Pydantic schemas for analytics API requests and responses.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from enum import Enum


class EventType(str, Enum):
    """Supported event types."""

    PAGEVIEW = "pageview"
    CLICK = "click"
    SCROLL = "scroll"
    FORM_SUBMIT = "form_submit"
    CUSTOM = "custom"
    ECOMMERCE = "ecommerce"
    ERROR = "error"
    PERFORMANCE = "performance"


class DeviceType(str, Enum):
    """Device categories."""

    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"
    UNKNOWN = "unknown"


class PerformanceMetrics(BaseModel):
    """Web Vitals and performance metrics."""

    # Core Web Vitals
    lcp: Optional[float] = Field(None, description="Largest Contentful Paint (seconds)")
    fid: Optional[float] = Field(None, description="First Input Delay (seconds)")
    cls: Optional[float] = Field(None, description="Cumulative Layout Shift (score)")

    # Additional metrics
    ttfb: Optional[float] = Field(None, description="Time to First Byte (seconds)")
    fcp: Optional[float] = Field(None, description="First Contentful Paint (seconds)")
    tti: Optional[float] = Field(None, description="Time to Interactive (seconds)")
    tbt: Optional[float] = Field(None, description="Total Blocking Time (ms)")

    # Resource timing
    dom_load_time: Optional[float] = None
    window_load_time: Optional[float] = None

    model_config = ConfigDict(extra="allow")


class EcommerceData(BaseModel):
    """Ecommerce-specific event data."""

    # Product data
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_category: Optional[str] = None
    product_price: Optional[float] = None
    product_quantity: Optional[int] = None

    # Cart data
    cart_value: Optional[float] = None
    cart_item_count: Optional[int] = None

    # Order data
    order_id: Optional[str] = None
    order_value: Optional[float] = None
    order_currency: Optional[str] = "USD"
    order_items: Optional[List[Dict[str, Any]]] = None

    # Funnel step
    funnel_step: Optional[str] = None  # view, add_to_cart, checkout, purchase

    model_config = ConfigDict(extra="allow")


class TrackEventRequest(BaseModel):
    """Request schema for tracking an analytics event."""

    # Event identification
    event_type: EventType
    event_name: Optional[str] = None

    # Session & User
    session_id: str = Field(..., min_length=1, max_length=255)
    visitor_id: str = Field(..., min_length=1, max_length=255)
    user_id: Optional[str] = None

    # Timestamp
    timestamp: Optional[int] = Field(None, description="Unix timestamp in milliseconds")

    # Page context
    url: str = Field(..., max_length=2048)
    path: str = Field(..., max_length=1024)
    referrer: Optional[str] = Field(None, max_length=2048)

    # UTM parameters
    utm_source: Optional[str] = Field(None, max_length=255)
    utm_medium: Optional[str] = Field(None, max_length=255)
    utm_campaign: Optional[str] = Field(None, max_length=255)
    utm_term: Optional[str] = Field(None, max_length=255)
    utm_content: Optional[str] = Field(None, max_length=255)

    # Device & Browser
    user_agent: str = Field(..., description="User-Agent header for parsing")
    device_type: Optional[DeviceType] = None
    browser: Optional[str] = None
    browser_version: Optional[str] = None
    os: Optional[str] = None
    os_version: Optional[str] = None

    # Viewport & Screen
    viewport_width: Optional[int] = Field(None, ge=0, le=10000)
    viewport_height: Optional[int] = Field(None, ge=0, le=10000)
    screen_width: Optional[int] = Field(None, ge=0, le=10000)
    screen_height: Optional[int] = Field(None, ge=0, le=10000)

    # Performance
    performance: Optional[PerformanceMetrics] = None

    # Ecommerce
    ecommerce: Optional[EcommerceData] = None

    # Custom properties
    properties: Optional[Dict[str, Any]] = Field(None, description="Custom event properties")

    # Privacy
    consent_given: bool = True

    model_config = ConfigDict(extra="forbid")

    @field_validator("url", "referrer")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Ensure URLs are not excessively long."""
        if v and len(v) > 2048:
            return v[:2048]
        return v


class BatchTrackRequest(BaseModel):
    """Request schema for batch event tracking."""

    events: List[TrackEventRequest] = Field(..., min_length=1, max_length=100)

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: List[TrackEventRequest]) -> List[TrackEventRequest]:
        """Ensure batch doesn't exceed limits."""
        if len(v) > 100:
            raise ValueError("Batch size cannot exceed 100 events")
        return v


class TrackEventResponse(BaseModel):
    """Response schema for event tracking."""

    success: bool
    event_id: Optional[str] = None
    message: Optional[str] = None


class BatchTrackResponse(BaseModel):
    """Response schema for batch tracking."""

    success: bool
    processed: int
    failed: int
    errors: Optional[List[str]] = None


class SessionSummaryResponse(BaseModel):
    """Response schema for session summary."""

    session_id: str
    visitor_id: str
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    pageview_count: int
    event_count: int
    entry_page: str
    exit_page: str
    device_type: str
    country_code: Optional[str]
    has_conversion: bool
    conversion_value: Optional[float]


class AnalyticsSummaryRequest(BaseModel):
    """Request schema for analytics summary."""

    date_from: datetime
    date_to: datetime
    metrics: Optional[List[str]] = Field(
        None, description="Specific metrics to return (default: all)"
    )
    group_by: Optional[str] = Field(None, description="Group by: hour, day, week, month")
    filters: Optional[Dict[str, Any]] = Field(None, description="Filters: country, device, etc.")


class AnalyticsSummaryResponse(BaseModel):
    """Response schema for analytics summary."""

    date_from: datetime
    date_to: datetime
    total_pageviews: int
    total_visitors: int
    total_sessions: int
    avg_session_duration: float
    bounce_rate: float
    conversion_rate: Optional[float] = None
    total_revenue: Optional[float] = None

    # Top pages
    top_pages: List[Dict[str, Any]]
    top_referrers: List[Dict[str, Any]]
    top_countries: List[Dict[str, Any]]

    # Device breakdown
    device_breakdown: Dict[str, int]

    # Time series (if grouped)
    time_series: Optional[List[Dict[str, Any]]] = None


class FunnelAnalysisRequest(BaseModel):
    """Request schema for funnel analysis."""

    funnel_id: Optional[str] = None
    steps: List[Dict[str, str]] = Field(
        ..., description="Funnel steps with url_pattern", min_length=2
    )
    date_from: datetime
    date_to: datetime
    filters: Optional[Dict[str, Any]] = None


class FunnelAnalysisResponse(BaseModel):
    """Response schema for funnel analysis."""

    total_entries: int
    steps: List[Dict[str, Any]]  # name, entries, drop_off_count, drop_off_rate, conversion_rate
    overall_conversion_rate: float
    avg_time_to_complete: Optional[float] = None


class HeatmapRequest(BaseModel):
    """Request schema for heatmap data."""

    page_path: str
    viewport_width: int = Field(..., description="Viewport width bucket: 375, 768, 1024, 1920")
    heatmap_type: str = Field(
        ..., description="Type: click, scroll, move, attention", pattern="^(click|scroll|move|attention)$"
    )
    date_from: datetime
    date_to: datetime


class HeatmapResponse(BaseModel):
    """Response schema for heatmap data."""

    page_path: str
    viewport_width: int
    heatmap_type: str
    data: List[Dict[str, Any]]  # Click coords, scroll depth, etc.
    sample_size: int
    date_from: datetime
    date_to: datetime


class SessionReplayListRequest(BaseModel):
    """Request schema for listing session replays."""

    date_from: datetime
    date_to: datetime
    min_quality_score: Optional[float] = Field(None, ge=0, le=100)
    has_errors: Optional[bool] = None
    has_rage_clicks: Optional[bool] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)


class SessionReplayMetadata(BaseModel):
    """Session replay metadata response."""

    id: str
    session_id: str
    visitor_id: str
    duration_ms: int
    event_count: int
    has_errors: bool
    has_rage_clicks: bool
    quality_score: Optional[float]
    recorded_at: datetime
    storage_path: str


class SessionReplayListResponse(BaseModel):
    """Response schema for session replay list."""

    total: int
    replays: List[SessionReplayMetadata]


class RealTimeStatsResponse(BaseModel):
    """Response schema for real-time statistics."""

    current_visitors: int
    visitors_last_5min: int
    pageviews_last_5min: int
    top_pages_now: List[Dict[str, Any]]
    top_countries_now: List[Dict[str, Any]]
    recent_conversions: List[Dict[str, Any]]
