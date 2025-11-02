import React from "react";
import { Card, Badge, Progress, Divider, Typography, Space } from "antd";
import { TrophyOutlined, StarOutlined, GiftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const tierConfig = {
  bronze: { color: "#CD7F32", nextTier: "silver", nextThreshold: 1000 },
  silver: { color: "#C0C0C0", nextTier: "gold", nextThreshold: 5000 },
  gold: { color: "#FFD700", nextTier: "platinum", nextThreshold: 10000 },
  platinum: { color: "#E5E4E2", nextTier: null, nextThreshold: null },
};

const LoyaltyCard = ({ loyalty }) => {
  if (!loyalty) {
    return (
      <Card className="bg-gray-800 border border-gray-700 text-gray-300">
        <Text type="secondary">No loyalty information available</Text>
      </Card>
    );
  }

  const { tier, available_points, lifetime_points } = loyalty;
  const tierInfo = tierConfig[tier.toLowerCase()];

  let progressPercent = 100;
  let pointsToNextTier = 0;

  if (tierInfo.nextTier) {
    const basePoints =
      tier === "bronze" ? 0 : tier === "silver" ? 1000 : tier === "gold" ? 5000 : 0;
    progressPercent = Math.min(
      Math.round(
        ((lifetime_points - basePoints) /
          (tierInfo.nextThreshold - basePoints)) *
          100
      ),
      100
    );
    pointsToNextTier = Math.max(0, tierInfo.nextThreshold - lifetime_points);
  }

  return (
    <Card
      bordered={false}
      className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-xl text-gray-200 shadow-md"
      title={
        <Space>
          <TrophyOutlined style={{ color: tierInfo.color }} />
          <span className="text-emerald-400 font-semibold">Customer Loyalty</span>
        </Space>
      }
    >
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Badge.Ribbon text={tier.toUpperCase()} color={tierInfo.color}>
          <Card bordered={false} className="bg-gray-900 text-gray-100 rounded-lg">
            <Title level={2} style={{ margin: 0, color: tierInfo.color }}>
              {available_points}
            </Title>
            <Text type="secondary" className="text-gray-400">
              Available Points
            </Text>
            <Divider className="border-gray-700" />
            <Text strong>Lifetime Points: {lifetime_points}</Text>
          </Card>
        </Badge.Ribbon>
      </div>

      {tierInfo.nextTier && (
        <>
          <Space align="center" style={{ marginBottom: 8 }}>
            <StarOutlined className="text-yellow-400" />
            <Text className="text-gray-300">
              Progress to {tierInfo.nextTier.charAt(0).toUpperCase() + tierInfo.nextTier.slice(1)}
            </Text>
          </Space>
          <Progress
            percent={progressPercent}
            strokeColor={tierConfig[tierInfo.nextTier].color}
            trailColor="#374151"
            size="small"
          />
          <Text type="secondary" className="block text-right text-gray-400">
            {pointsToNextTier} points to go
          </Text>
        </>
      )}

      <Divider className="border-gray-700" />

      <div className="flex justify-between items-center">
        <Text type="secondary" className="text-gray-400">
          <GiftOutlined /> Redeem points during checkout
        </Text>
      </div>
    </Card>
  );
};

export default LoyaltyCard;
