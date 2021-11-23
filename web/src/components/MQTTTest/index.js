import { Button, Card } from "antd";
import React from "react";
import { Link } from "react-router-dom";
import { QosOption } from "../../hooks/HookMqtt";
import Connection from "./Connection";
import Publisher from "./Publisher";
import Receiver from "./Receiver";
import Subscriber from "./Subscriber";

const MQTTTest = ({
	mqttConnect,
	mqttDisconnect,
	connectStatus,
	qosOption,
	mqttSub,
	mqttUnSub,
	isSubed,
	mqttPublish,
	payload,
}) => {
	return (
		<div className="App">
			<Card title="Back to patient form">
				<Link to="/">
					<Button type="primary">Back to Home</Button>
				</Link>
			</Card>
			<Connection
				connect={mqttConnect}
				disconnect={mqttDisconnect}
				connectBtn={connectStatus}
			/>
			<QosOption.Provider value={qosOption}>
				<Subscriber sub={mqttSub} unSub={mqttUnSub} showUnsub={isSubed} />
				<Publisher publish={mqttPublish} />
			</QosOption.Provider>
			<Receiver payload={payload} />
		</div>
	);
};

export default MQTTTest;
