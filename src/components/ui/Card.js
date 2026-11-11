import React, { useEffect } from "react";
import styled from "styled-components";
import Chart from "chart.js/auto";
import { resilientFetch } from "../../apiConfig";

const Card = styled.div`
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  text-align: left;
`;

const Stat = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
`;

const HighEngagement = styled.div`
  background: var(--success);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.85rem;
  width: fit-content;
  margin-top: 10px;
`;

const InfluencerCard = ({ influencer, index }) => {
  const { title, subscriber_count, engagement_rate, influencer_type, channel_id } = influencer;

  useEffect(() => {
    async function fetchEngagementData() {
      const response = await resilientFetch(`/influencer/fetch_channel_engagement?channel_id=${channel_id}`);
      const data = await response.json();
      
      const ctx = document.getElementById(`chart-${index}`);
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(data.engagement_scores),
          datasets: [{
            label: "Engagement Rate",
            data: Object.values(data.engagement_scores),
            backgroundColor: "rgba(99, 102, 241, 0.5)"
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: true, max: 100 },
            x: { title: { display: true, text: "Content Categories" } }
          }
        }
      });
    }

    fetchEngagementData();
  }, [channel_id, index]);

  return (
    <Card>
      <h3>{title}</h3>
      <Stat>{subscriber_count.toLocaleString()} Subscribers</Stat>
      <Stat>{engagement_rate}% Engagement</Stat>
      <Stat style={{ color: "var(--primary)" }}>{influencer_type}</Stat>
      {engagement_rate > 15 && <HighEngagement>🌟 Top Performer</HighEngagement>}
      <canvas id={`chart-${index}`}></canvas>
    </Card>
  );
};

export default InfluencerCard;
