import mqtt from "mqtt";
import { createContext, useEffect, useState } from "react";

export const QosOption = createContext([]);
const qosOption = [
	{
		label: "0",
		value: 0,
	},
	{
		label: "1",
		value: 1,
	},
	{
		label: "2",
		value: 2,
	},
];

const useMqtt = () => {
	const [client, setClient] = useState(null);
	const [isSubed, setIsSub] = useState(false);
	const [payload, setPayload] = useState({});
	const [connectStatus, setConnectStatus] = useState("Connect");

	const mqttConnect = (host, mqttOption) => {
		setConnectStatus("Connecting");
		setClient(mqtt.connect(host, mqttOption));
	};

	useEffect(() => {
		if (client) {
			client.on("connect", () => {
				setConnectStatus("Connected");
			});
			client.on("error", (err) => {
				console.error("Connection error: ", err);
				client.end();
			});
			client.on("reconnect", () => {
				setConnectStatus("Reconnecting");
			});
			client.on("message", (topic, message) => {
				const payload = { topic, message: message.toString() };
				setPayload(payload);
			});
		}
	}, [client]);

	const mqttDisconnect = () => {
		if (client) {
			client.end(() => {
				setConnectStatus("Connect");
			});
		}
	};

	const mqttPublish = (context) => {
		if (client) {
			const { topic, qos, payload } = context;
			client.publish(topic, payload, { qos }, (error) => {
				if (error) {
					console.log("Publish error: ", error);
				}
			});
		}
	};

	const mqttSub = (subscription) => {
		if (client) {
			const { topic, qos } = subscription;
			client.subscribe(topic, { qos }, (error) => {
				if (error) {
					console.log("Subscribe to topics error", error);
					return;
				}
				setIsSub(true);
			});
		}
	};

	const mqttUnSub = (subscription) => {
		if (client) {
			const { topic } = subscription;
			client.unsubscribe(topic, (error) => {
				if (error) {
					console.log("Unsubscribe error", error);
					return;
				}
				setIsSub(false);
			});
		}
	};
	return {
		qosOption,
		connectStatus,
		isSubed,
		payload,
		mqttConnect,
		mqttDisconnect,
		mqttSub,
		mqttUnSub,
		mqttPublish,
	};
	// (
	// 	<WrappedComponent
	// 		qosOption={qosOption}
	// 		connectStatus={connectStatus}
	// 		isSubed={isSubed}
	// 		payload={payload}
	// 		mqttConnect={mqttConnect}
	// 		mqttDisconnect={mqttDisconnect}
	// 		mqttSub={mqttSub}
	// 		mqttUnSub={mqttUnSub}
	// 		mqttPublish={mqttPublish}
	// 	/>
	// )
};

export default useMqtt;
