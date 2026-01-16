import { Page, Layout, Card, Text, BlockStack, InlineStack, InlineGrid, Badge } from "@shopify/polaris";
import { ChartHistogramGrowthIcon, PackageIcon, ReceiptIcon } from "@shopify/polaris-icons";
import { useDashboardStats } from "../services/api";
import { StatsCard } from "../components/StatsCard";
import { InsightsList } from "../components/InsightsList";
import { RevenueChart } from "../components/RevenueChart";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <Page title="Dashboard" subtitle="AI-powered insights for your store">
      <Layout>
        {/* Stats Cards Row */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            <StatsCard
              title="Revenue"
              value={stats?.yesterdayRevenue ?? 0}
              prefix="$"
              comparison={stats?.revenueDelta ?? 0}
              loading={isLoading}
              icon={ChartHistogramGrowthIcon}
            />
            <StatsCard
              title="Orders"
              value={stats?.yesterdayOrders ?? 0}
              comparison={stats?.ordersDelta ?? 0}
              loading={isLoading}
              icon={ReceiptIcon}
            />
            <StatsCard
              title="AOV"
              value={stats?.yesterdayAov ?? 0}
              prefix="$"
              comparison={stats?.aovDelta ?? 0}
              loading={isLoading}
              icon={PackageIcon}
            />
          </InlineGrid>
        </Layout.Section>

        {/* Main Content */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Revenue Overview
              </Text>
              <RevenueChart />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Insights Sidebar */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  AI Insights
                </Text>
                <Badge tone="attention">
                  {stats?.activeInsightsCount ?? 0} Active
                </Badge>
              </InlineStack>
              <InsightsList />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
