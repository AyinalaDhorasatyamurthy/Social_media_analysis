import { resilientFetch } from "../apiConfig";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import "chartjs-chart-matrix";
import styled from "styled-components";
import NavBar from "./Navbar";

Chart.register(MatrixController, MatrixElement);

// Styled Components
const Container = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    color: #333;
`;

const Title = styled.h2`
    text-align: center;
    color: #2196F3;
    margin-bottom: 30px;
    font-size: 2.5em;
`;

const InputGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
    }
`;

const Input = styled.input`
    padding: 10px 15px;
    font-size: 16px;
    border: 2px solid #2196F3;
    border-radius: 5px;
    width: 300px;
    outline: none;
    transition: border-color 0.3s ease;

    &:focus {
        border-color: #1976D2;
    }

    @media (max-width: 768px) {
        width: 100%;
        max-width: 300px;
    }
`;

const Button = styled.button`
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    background-color: ${props => props.view ? '#4CAF50' : '#2196F3'};
    color: white;

    &:hover {
        background-color: ${props => props.view ? '#388E3C' : '#1976D2'};
    }
`;

const ErrorMessage = styled.p`
    color: #f44336;
    text-align: center;
    margin: 10px 0;
    font-size: 16px;
`;

const ChartsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 30px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const ChartBox = styled.div`
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    height: 400px;
    position: relative;

    @media (max-width: 768px) {
        height: 300px;
    }

    canvas {
        width: 100% !important;
        height: 100% !important;
    }
`;

const Highlight = styled.div`
    text-align: center;
    margin: 20px 0;
    padding: 15px;
    background-color: #E3F2FD;
    border-radius: 5px;
    font-size: 18px;
    color: #1976D2;
`;

const LoadingOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const YouTubeSentiment = () => {
    // State management
    const [channel, setChannel] = useState("");
    const [bestTime, setBestTime] = useState("");
    const [error, setError] = useState(null);
    const [showCharts, setShowCharts] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCentralities, setShowCentralities] = useState(false);

    // Hooks and refs
    const navigate = useNavigate();
    const charts = useRef({});

    // Navigate to Reports Page
    const handleViewReport = () => {
        if (!channel.trim()) {
            setError("⚠ Please enter a channel name.");
            return;
        }
        // Store the channel data in session storage
        sessionStorage.setItem("channelData", JSON.stringify({
            channelName: channel,
            sentiment: chartData,
            videos: videos
        }));
        sessionStorage.setItem("reportType", "Sentiment Analysis");
        navigate("/reports");
    };

    // Fetch sentiment data
    const fetchSentiment = async () => {
        if (!channel.trim()) {
            setError("⚠ Please enter a channel name.");
            setShowCharts(false);
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const response = await resilientFetch(`/sentiment/analyze_sentiment?channel=${encodeURIComponent(channel)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "❌ Failed to fetch data.");
            }

            if (!data) {
                throw new Error("❌ Invalid data received from the server.");
            }

            setChartData(data);
            setBestTime(data.best_time);
            setVideos(data.video_sentiments || []);
            setShowCharts(true);
        } catch (error) {
            setError(error.message);
            setShowCharts(false);
        } finally {
            setLoading(false);
        }
    };

    // Chart initialization effect
    useEffect(() => {
        if (!chartData) return;
        
        try {
            updatePieChart(chartData.percentages);
            updateLineChart(chartData.video_sentiments);
            updateHeatmapChart(chartData.hourly_sentiment);
            updatePerformanceChart(chartData.predicted_performance);
        } catch (error) {
            console.error("Error updating charts:", error);
            setError("❌ Error displaying charts. Please try again.");
        }
    }, [chartData]);

    // Chart creation utilities
    const createChart = (id, type, data, options) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        if (charts.current[id]) {
            charts.current[id].destroy();
        }

        charts.current[id] = new Chart(ctx, { type, data, options });
    };

    const updatePieChart = (data) => {
        if (!data) return;
        createChart("sentimentChart", "pie", {
            labels: ["Positive", "Negative", "Neutral"],
            datasets: [{
                data: [data.Positive || 0, data.Negative || 0, data.Neutral || 0],
                backgroundColor: ["#28a745", "#dc3545", "#6c757d"]
            }]
        }, {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Overall Sentiment Distribution'
                }
            }
        });
    };

    const updateLineChart = (videoSentiments) => {
        if (!videoSentiments?.length) return;
        createChart("lineChart", "line", {
            labels: videoSentiments.map(video => video.video_title),
            datasets: [
                { 
                    label: "Positive", 
                    data: videoSentiments.map(v => v.Positive || 0), 
                    borderColor: "#28a745", 
                    fill: false,
                    tension: 0.4
                },
                { 
                    label: "Negative", 
                    data: videoSentiments.map(v => v.Negative || 0), 
                    borderColor: "#dc3545", 
                    fill: false,
                    tension: 0.4
                },
                { 
                    label: "Neutral", 
                    data: videoSentiments.map(v => v.Neutral || 0), 
                    borderColor: "#6c757d", 
                    fill: false,
                    tension: 0.4
                }
            ]
        }, { 
            responsive: true, 
            scales: { y: { beginAtZero: true } },
            plugins: {
                title: {
                    display: true,
                    text: 'Sentiment Trends Across Videos'
                }
            }
        });
    };

    const updateHeatmapChart = (hourlyData) => {
        if (!hourlyData) return;
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const heatmapData = [];

        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const key = `${day}-${hour}`;
                heatmapData.push({ x: hour, y: day, v: hourlyData[key] || 0 });
            }
        }

        createChart("heatmapChart", "matrix", {
            datasets: [{
                label: "Sentiment Intensity",
                data: heatmapData,
                backgroundColor: ctx => {
                    const value = ctx.dataset.data[ctx.dataIndex].v;
                    return `rgba(255, 0, 0, ${Math.min(value / 10, 1)})`;
                },
                borderWidth: 1,
                width: 20,
                height: 20
            }]
        }, {
            scales: {
                x: { 
                    type: "linear", 
                    position: "bottom", 
                    ticks: { callback: val => `${val}:00` },
                    title: {
                        display: true,
                        text: 'Hour of Day'
                    }
                },
                y: { 
                    type: "linear", 
                    ticks: { callback: val => days[val] },
                    title: {
                        display: true,
                        text: 'Day of Week'
                    }
                }
            },
            plugins: { 
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Sentiment Intensity Heatmap'
                },
                tooltip: { 
                    callbacks: { 
                        label: ctx => `Sentiment Score: ${ctx.dataset.data[ctx.dataIndex].v}` 
                    } 
                }
            }
        });
    };

    const updatePerformanceChart = (predictions) => {
        if (!predictions) return;
        createChart("performanceChart", "bar", {
            labels: Object.keys(predictions),
            datasets: [{
                label: "Predicted Views",
                data: Object.values(predictions),
                backgroundColor: "#007bff"
            }]
        }, { 
            responsive: true, 
            scales: { y: { beginAtZero: true } },
            plugins: {
                title: {
                    display: true,
                    text: 'Predicted Video Performance'
                }
            }
        });
    };

    return (
        <React.Fragment>
            <NavBar />
            <LoadingOverlay style={{ display: loading ? 'flex' : 'none' }}>
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            </LoadingOverlay>

            <Container>
                <Title>YouTube Sentiment Analysis</Title>
                <InputGroup>
                    <Input 
                        type="text" 
                        placeholder="Enter Channel Name" 
                        value={channel} 
                        onChange={(e) => setChannel(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchSentiment()}
                    />
                    <Button onClick={fetchSentiment} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                    <Button view onClick={handleViewReport}>📄 View Report</Button>
                </InputGroup>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                {showCharts && (
                    <>
                        <ChartsContainer>
                            <ChartBox><canvas id="sentimentChart"></canvas></ChartBox>
                            <ChartBox><canvas id="lineChart"></canvas></ChartBox>
                            <ChartBox><canvas id="heatmapChart"></canvas></ChartBox>
                            <ChartBox><canvas id="performanceChart"></canvas></ChartBox>
                        </ChartsContainer>
                        <Highlight>📌 Best Time to Post: {bestTime}</Highlight>
                        <Button 
                            view 
                            onClick={() => setShowCentralities(!showCentralities)}
                        >
                            {showCentralities ? "Hide Report" : "View Report"}
                        </Button>
                    </>
                )}
            </Container>

            {showCentralities && (
                <div className="centrality-table">
                    <h3>Centrality Metrics</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Video Title</th>
                                <th>Degree Centrality</th>
                                <th>Betweenness Centrality</th>
                                <th>Closeness Centrality</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videos.map((video, index) => (
                                <tr key={index}>
                                    <td>{video.video_title}</td>
                                    <td>{video.degree}</td>
                                    <td>{video.betweenness}</td>
                                    <td>{video.closeness}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </React.Fragment>
    );
};

export default YouTubeSentiment; 