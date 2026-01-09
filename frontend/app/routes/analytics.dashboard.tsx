/**
 * Real-time Analytics Dashboard
 * Displays live web traffic, conversions, and user behavior metrics
 */
import { useEffect, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  DataTable,
  ProgressBar,
  Box,
} from '@shopify/polaris';
import { useQuery } from '@tanstack/react-query';

// Types
interface RealTimeStats {
  current_visitors: number;
  visitors_last_5min: number;
  pageviews_last_5min: number;
  top_pages_now: Array<{ path: string; visitors: number }>;
  top_countries_now: Array<{ country_code: string; visitors: number }>;
  recent_conversions: Array<{ type: string; value: number; timestamp: string }>;
}

interface AnalyticsSummary {
  date_from: string;
  date_to: string;
  total_pageviews: number;
  total_visitors: number;
  total_sessions: number;
  avg_session_duration: number;
  bounce_rate: number;
  conversion_rate: number;
  total_revenue: number;
  top_pages: Array<{ path: string; pageviews: number; unique_visitors: number }>;
  top_referrers: Array<{ referrer: string; visits: number }>;
  top_countries: Array<{ country_code: string; country_name: string; visitors: number }>;
  device_breakdown: Record<string, number>;
}

// Fetch functions
async function fetchRealTimeStats(): Promise<RealTimeStats> {
  const response = await fetch('/api/v1/analytics/realtime');
  if (!response.ok) {
    throw new Error('Failed to fetch real-time stats');
  }
  return response.json();
}

async function fetchAnalyticsSummary(dateFrom: string, dateTo: string): Promise<AnalyticsSummary> {
  const response = await fetch(
    `/api/v1/analytics/summary?date_from=${dateFrom}&date_to=${dateTo}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch analytics summary');
  }
  return response.json();
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
    to: new Date().toISOString(),
  });

  // Real-time stats (refetch every 10 seconds)
  const { data: realTimeStats, isLoading: realTimeLoading } = useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: fetchRealTimeStats,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Summary stats
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary', dateRange],
    queryFn: () => fetchAnalyticsSummary(dateRange.from, dateRange.to),
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <Page
      title="Analytics Dashboard"
      subtitle="Real-time web traffic and conversion insights"
    >
      <Layout>
        {/* Real-time Stats Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Box paddingBlockEnd="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Live Traffic
                  </Text>
                  <Badge tone="success">
                    <InlineStack gap="100" blockAlign="center">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00A862' }} />
                      <Text as="span">Live</Text>
                    </InlineStack>
                  </Badge>
                </InlineStack>
              </Box>

              <InlineStack gap="600" wrap={false}>
                <StatCard
                  label="Current Visitors"
                  value={realTimeStats?.current_visitors || 0}
                  loading={realTimeLoading}
                  tone="success"
                />
                <StatCard
                  label="Visitors (5 min)"
                  value={realTimeStats?.visitors_last_5min || 0}
                  loading={realTimeLoading}
                />
                <StatCard
                  label="Pageviews (5 min)"
                  value={realTimeStats?.pageviews_last_5min || 0}
                  loading={realTimeLoading}
                />
              </InlineStack>

              {/* Top Pages Now */}
              {realTimeStats && realTimeStats.top_pages_now.length > 0 && (
                <Box>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm">
                      Top Pages Right Now
                    </Text>
                    {realTimeStats.top_pages_now.slice(0, 5).map((page) => (
                      <InlineStack key={page.path} align="space-between">
                        <Text as="span" truncate>
                          {page.path}
                        </Text>
                        <Badge>{page.visitors} visitors</Badge>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </Box>
              )}

              {/* Recent Conversions */}
              {realTimeStats && realTimeStats.recent_conversions.length > 0 && (
                <Box>
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm">
                      Recent Conversions
                    </Text>
                    {realTimeStats.recent_conversions.slice(0, 5).map((conversion, idx) => (
                      <InlineStack key={idx} align="space-between">
                        <Text as="span">{conversion.type}</Text>
                        <Badge tone="success">${conversion.value.toFixed(2)}</Badge>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Summary Stats Grid */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Total Pageviews
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {summary?.total_pageviews.toLocaleString() || 0}
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Unique Visitors
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {summary?.total_visitors.toLocaleString() || 0}
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Total Sessions
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {summary?.total_sessions.toLocaleString() || 0}
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Avg Session Duration
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {formatDuration(summary?.avg_session_duration || 0)}
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Bounce Rate
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {summary?.bounce_rate.toFixed(1) || 0}%
                  </Text>
                  <ProgressBar progress={summary?.bounce_rate || 0} size="small" tone={
                    (summary?.bounce_rate || 0) > 70 ? 'critical' : (summary?.bounce_rate || 0) > 50 ? 'attention' : 'success'
                  } />
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Conversion Rate
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {summary?.conversion_rate.toFixed(2) || 0}%
                  </Text>
                  <ProgressBar progress={summary?.conversion_rate || 0} size="small" tone="success" />
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Total Revenue
                  </Text>
                  <Text as="p" variant="heading2xl">
                    ${summary?.total_revenue.toFixed(2) || 0}
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Top Pages Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Top Pages
              </Text>
              {summary && summary.top_pages.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'numeric', 'numeric']}
                  headings={['Page', 'Pageviews', 'Unique Visitors']}
                  rows={summary.top_pages.map((page) => [
                    page.path,
                    page.pageviews.toLocaleString(),
                    page.unique_visitors.toLocaleString(),
                  ])}
                />
              ) : (
                <Text as="p" tone="subdued">
                  No data available
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Traffic Sources */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Box minWidth="50%">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Top Referrers
                  </Text>
                  {summary && summary.top_referrers.length > 0 ? (
                    <BlockStack gap="200">
                      {summary.top_referrers.slice(0, 10).map((ref) => (
                        <InlineStack key={ref.referrer} align="space-between">
                          <Text as="span" truncate>
                            {ref.referrer}
                          </Text>
                          <Badge>{ref.visits.toLocaleString()}</Badge>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  ) : (
                    <Text as="p" tone="subdued">
                      No referrer data
                    </Text>
                  )}
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="50%">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Top Countries
                  </Text>
                  {summary && summary.top_countries.length > 0 ? (
                    <BlockStack gap="200">
                      {summary.top_countries.slice(0, 10).map((country) => (
                        <InlineStack key={country.country_code} align="space-between">
                          <Text as="span">
                            {country.country_code} - {country.country_name}
                          </Text>
                          <Badge>{country.visitors.toLocaleString()}</Badge>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  ) : (
                    <Text as="p" tone="subdued">
                      No geographic data
                    </Text>
                  )}
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Device Breakdown */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Device Breakdown
              </Text>
              {summary && Object.keys(summary.device_breakdown).length > 0 ? (
                <BlockStack gap="300">
                  {Object.entries(summary.device_breakdown).map(([device, count]) => {
                    const total = Object.values(summary.device_breakdown).reduce(
                      (acc, val) => acc + val,
                      0
                    );
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <Box key={device}>
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <Text as="span" fontWeight="semibold">
                              {device.charAt(0).toUpperCase() + device.slice(1)}
                            </Text>
                            <Text as="span">
                              {count.toLocaleString()} ({percentage}%)
                            </Text>
                          </InlineStack>
                          <ProgressBar progress={parseFloat(percentage)} size="small" />
                        </BlockStack>
                      </Box>
                    );
                  })}
                </BlockStack>
              ) : (
                <Text as="p" tone="subdued">
                  No device data
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  loading,
  tone = 'default',
}: {
  label: string;
  value: number;
  loading?: boolean;
  tone?: 'default' | 'success' | 'critical';
}) {
  return (
    <Box minWidth="150px">
      <BlockStack gap="100">
        <Text as="p" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <Text as="p" variant="headingLg" tone={tone === 'default' ? undefined : tone}>
          {loading ? '...' : value.toLocaleString()}
        </Text>
      </BlockStack>
    </Box>
  );
}

// Helper Functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
