# Kaspa Scarcity Simulator

An interactive and educational web tool designed to help users visualize their share of the Kaspa ecosystem by comparing it to the well-established scarcity of Bitcoin. This project provides a unique perspective on proportional ownership, independent of price or market capitalization.

[View the Live Demo here](https://macmachi.github.io/KaspaScarcitySimulator/)

## 🎯 Objective

The primary goal of this simulator is not to predict value, but to conceptualize scarcity. By transposing the percentage of ownership of Kaspa's max supply onto Bitcoin's, users can better understand what their investment represents in terms of relative share within a decentralized digital economy.

## ✨ Key Features

*   **Scarcity Calculator:** Enter any amount of Kaspa (KAS) via a text input or a dynamic slider to instantly see its equivalent share in Bitcoin (BTC).
*   **Multi-language Support (i18n):** The interface is fully translated into 8 languages (English, French, German, Spanish, Chinese, Portuguese, Russian, and Arabic) with automatic browser language detection on load.
*   **Comparative Emission Chart:** An interactive chart, powered by Chart.js, that visualizes the cumulative emission curves of Kaspa and Bitcoin over time, highlighting how quickly Kaspa's fairly-launched supply becomes scarce.
*   **Educational Content:** Clear sections explain the calculation, the fundamentals of Kaspa (BlockDAG, 100% fair launch, speed), and the monetary policies of both cryptocurrencies.
*   **Modern & Responsive Design:** A sleek, dark-themed user interface that is fully responsive and works seamlessly on both desktop and mobile devices.
*   **Fully Static Application:** A 100% client-side application (HTML, CSS, JS) with zero server-side dependencies, making it easy to host on any static platform (like GitHub Pages).

## ⚙️ How It Works

### The Calculation

The simulator uses a straightforward formula to determine the share equivalence:

```
BTC Equivalent = (Your KAS Amount / KAS Max Supply) * BTC Max Supply
```

Where:
*   `KAS Max Supply` = 28,700,000,000
*   `BTC Max Supply` = 21,000,000

### The Emission Chart

The logic in `script.js` generates the data points for the emission curves:
*   **Bitcoin:** The script simulates the halving cycles that occur approximately every four years.
*   **Kaspa:** The script implements Kaspa's unique monetary policy, which consists of a geometric monthly block reward reduction, equivalent to a halving every single year.

## 👤 Author

*   **Developed by:** Rymentz

## 📄 License

This project is distributed under the MIT License.
