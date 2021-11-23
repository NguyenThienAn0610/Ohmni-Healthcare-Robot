import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import MQTTTest from "./components/MQTTTest";
import useMqtt from "./hooks/HookMqtt";
import MainForm from "./pages/MainForm";

const App = () => {
	const mqttState = useMqtt();
	return (
		<Router>
			{/* <Link to="/">Form</Link>
			<Link to="/mqtt">MQTT Test</Link> */}
			<Routes>
				<Route path="/" element={<MainForm {...mqttState} />} />
				<Route path="/mqtt" element={<MQTTTest {...mqttState} />} />
				<Route path="*" element={<h1>Page Not Found</h1>} />
			</Routes>
		</Router>
	);
};

export default App;
