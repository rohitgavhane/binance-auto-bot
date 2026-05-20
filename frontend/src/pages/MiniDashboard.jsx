import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import API from "../api/axios";
import MarketChart from "../components/MarketChart";

const MiniDashboard = () => {

    const [dashboardData, setDashboardData] = useState(null);
    const [chartData, setChartData] = useState([]);

    // ======================
    // AUTO REFRESH
    // ======================

    useEffect(() => {
        let cancelled = false;
        const fetchDashboard = async () => {
            try {
                const [dashboardRes, chartRes] = await Promise.all([
                    API.get("/bot/status"),
                    API.get("/chart")
                ]);
                if (!cancelled) {
                    setDashboardData(dashboardRes.data);
                    setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);
                }
            } catch (error) {
                console.log("Mini Dashboard Error:", error.message);
            }
        };
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 5000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    // ======================
    // Screen Shot Capturing Automatically
    // ======================
    
    useEffect(() => {
        const captureScreenShot = async () => {
            try {
                const element = document.getElementById("mini-dashboard");
                if (!element) return;

                const dataUrl = await toPng(element, { pixelRatio: 2 });

                // Convert base64 to blob
                const res = await fetch(dataUrl);
                const blob = await res.blob();

                const formData = new FormData();
                formData.append("screenshot", blob, "chart.png");

                await API.post("/upload-screenshot", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                console.log("✅ Screenshot Uploaded");

            } catch (err) {
                console.log("❌ Upload Failed:", err);
            }
        };

        captureScreenShot();
        const interval = setInterval(captureScreenShot, 30500);
        return () => clearInterval(interval);
    }, []);

    // ======================
    // LOADING
    // ======================

    if (!dashboardData) {

        return (
            <div className="min-h-screen bg-slate-950 flex justify-center items-center text-white text-2xl">
                Loading Mini Dashboard...
            </div>
        );

    }

    // ======================
    // DATA
    // ======================

    const latestCandle = chartData[chartData.length - 1] || {};

    const currentPrice = latestCandle.close || 0;

    const currentProfit = dashboardData.solHolding > 0 && dashboardData.averageBuyPrice > 0
            ? ((currentPrice - dashboardData.averageBuyPrice) / dashboardData.averageBuyPrice) * 100
            : 0;

    const marketType =
        latestCandle.ema20 &&
            latestCandle.ema50
            ?
            Math.abs(latestCandle.ema20 - latestCandle.ema50) < 0.05
                ? "SIDEWAYS"
                : latestCandle.ema20 > latestCandle.ema50
                    ? "BULLISH"
                    : "BEARISH"
            : "LOADING";

    // ======================
    // UI
    // ======================

    return (

        <div className="bg-slate-950 min-h-screen text-white overflow-hidden" id="mini-dashboard">

            {/* ====================== */}
            {/* HEADER */}
            {/* ====================== */}

            <div className="flex justify-between items-center gap-4 px-6 py-4 border-b border-slate-800">

                <div>

                    <h1 className="text-3xl font-bold">
                        SOLUSDT AI BOT
                    </h1>

                    <p className="text-slate-400 text-sm">
                        AI Trading Snapshot
                    </p>

                </div>

                <div className="flex items-center gap-5">

                    <Link
                        to="/"
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-cyan-400/30
                            bg-cyan-400/10
                            px-5
                            py-3
                            text-sm
                            font-semibold
                            text-cyan-200
                            shadow-lg
                            shadow-cyan-500/10
                            transition
                            duration-200
                            hover:border-cyan-300/60
                            hover:bg-cyan-400/20
                            hover:text-white
                        "
                    >
                        <span className="text-cyan-300">&lt;-</span>
                        Full Dashboard
                    </Link>

                <div className="text-right">

                    <h2 className="text-4xl font-bold text-green-400">
                        ${currentPrice.toFixed(2)}
                    </h2>

                    <p className="text-slate-400 text-sm">
                        Live Price
                    </p>

                </div>

                </div>

            </div>

            {/* ====================== */}
            {/* TOP STATS */}
            {/* ====================== */}

            <div className="grid grid-cols-4 gap-4 p-4">

                {/* RSI */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        RSI
                    </p>

                    <h2 className="text-3xl font-bold">
                        {latestCandle.rsi?.toFixed(2) || "0"}
                    </h2>

                </div>

                {/* EMA20 */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        EMA 20
                    </p>

                    <h2 className="text-2xl font-bold">
                        {latestCandle.ema20?.toFixed(2)}
                    </h2>

                </div>

                {/* EMA50 */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        EMA 50
                    </p>

                    <h2 className="text-2xl font-bold">
                        {latestCandle.ema50?.toFixed(2)}
                    </h2>

                </div>

                {/* MARKET */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        Market
                    </p>

                    <h2
                        className={`text-3xl font-bold
                        
                        ${marketType === "BULLISH"
                                ? "text-green-400"
                                : marketType === "BEARISH"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                            }
                        `}
                    >
                        {marketType}
                    </h2>

                </div>

                {/* PROFIT */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        Profit
                    </p>

                    <h2
                        className={`text-3xl font-bold
                        
                        ${currentProfit >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                        `}
                    >
                        {currentProfit.toFixed(2)}%
                    </h2>

                </div>

            </div>


            {/* ====================== */}
            {/* FOOTER */}
            {/* ====================== */}

            <div className="grid grid-cols-3 gap-4 p-4">

                {/* HOLDINGS */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        SOL Holdings
                    </p>

                    <h2 className="text-2xl font-bold">
                        {dashboardData.solHolding?.toFixed(4)}
                    </h2>

                </div>

                {/* BALANCE */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        Live Balance
                    </p>

                    <h2 className="text-2xl font-bold">
                        ${dashboardData.availableBalance?.toFixed(2)}
                    </h2>

                </div>

                {/* BOT MODE */}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">

                    <p className="text-slate-400 text-sm mb-2">
                        Bot Mode
                    </p>

                    <h2 className="text-2xl font-bold text-purple-400">
                        {dashboardData.botMode}
                    </h2>

                </div>

            </div>
            {/* ====================== */}
            {/* CHART */}
            {/* ====================== */}

            <div className="px-4">

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">

                    <div className="flex justify-between items-center mb-4">

                        <div>

                            <h2 className="text-2xl font-bold">
                                Market Chart
                            </h2>

                            <p className="text-slate-400 text-sm">
                                EMA + RSI + MACD
                            </p>

                        </div>

                        <div className="text-right">

                            <p className="text-slate-400 text-sm">
                                Strategy
                            </p>

                            <h2 className="text-xl font-bold text-cyan-400">
                                {dashboardData.currentStrategy || "NONE"}
                            </h2>

                        </div>

                    </div>

                    <MarketChart
                        chartData={chartData}
                        botState={dashboardData}
                        mini={true}
                    />

                </div>

            </div>

        </div>

    );

};

export default MiniDashboard;
