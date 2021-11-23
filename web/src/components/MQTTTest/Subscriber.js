import { Button, Card, Col, Form, Input, Row, Select } from "antd";
import React from "react";

export const Subscriber = ({ sub, unSub, showUnsub, qosOption }) => {
	const [form] = Form.useForm();

	const record = {
		topic: "thanhdanh27600/feeds/esp32",
		qos: 0,
	};

	const onFinish = (values) => {
		sub(values);
	};

	const handleUnsub = () => {
		const values = form.getFieldsValue();
		unSub(values);
	};

	const SubForm = (
		<Form
			layout="vertical"
			name="basic"
			form={form}
			initialValues={record}
			onFinish={onFinish}
		>
			<Row gutter={20}>
				<Col span={12}>
					<Form.Item label="Topic" name="topic">
						<Input />
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item label="QoS" name="qos">
						<Select options={qosOption} />
					</Form.Item>
				</Col>
				<Col span={8} offset={16} style={{ textAlign: "right" }}>
					<Form.Item>
						<Button type="primary" htmlType="submit">
							Subscribe
						</Button>
						{showUnsub ? (
							<Button
								type="danger"
								style={{ marginLeft: "10px" }}
								onClick={handleUnsub}
							>
								Unsubscribe
							</Button>
						) : null}
					</Form.Item>
				</Col>
			</Row>
		</Form>
	);

	return <Card title="Subscriber">{SubForm}</Card>;
};

export default Subscriber;
