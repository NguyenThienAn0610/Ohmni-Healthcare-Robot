import { Card, Col, Form, Input, Modal, Row, Select } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getDocument, setDocument } from "../api/firestore";
import Connection from "../components/MQTTTest/Connection";
import { check_phone_number, MAX_STEP, MEDICAL_FIELD } from "../utils/common";
import { getColor } from "../utils/getColor";

/** */

const InitFormValues = {
	tel: "",
	name: "",
	address: "",
	medical: "",
	last_submit: "",
	pid: "",
	rid: "",
};

const GenRecordID = () => {
	return uuidv4();
};

const MakeRecord = (record) =>
	`Record ID: ${record.rid} %0D%0APatient's name: ${record.name} %0D%0AMedical Exam: ${record.medical} %0D%0APhone: ${record.tel} %0D%0AAddress: ${record.address}`;
/** */

function MainForm({
	mqttConnect,
	mqttDisconnect,
	connectStatus,
	qosOption,
	mqttSub,
	mqttUnSub,
	isSubed,
	mqttPublish,
	payload,
}) {
	const [step, setStep] = useState(0);
	const [values, setValues] = useState(InitFormValues);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(true);
	const [retreat, setRetreat] = useState(false);
	const [loading, setLoading] = useState(false);

	const [form] = Form.useForm();

	/**
	 *  MQTT Connection
	 * */

	useEffect(() => {
		if (connectStatus === "Connected") {
			mqttSub(form.getFieldsValue());
		}
	}, [connectStatus, mqttSub, form]);

	const nextStep = (numStep) => {
		const numStepChanged = numStep ? step + numStep : step + 1;
		const progressbar = document.getElementById("progressbar");
		for (let i = step; i <= numStepChanged; i++)
			progressbar.childNodes[i].classList.add("active");
		setStep(numStepChanged);
		setProgressBar(numStepChanged);
	};

	const prevStep = (numStep) => {
		const numStepChanged = numStep ? step - numStep : step - 1;
		const progressbar = document.getElementById("progressbar");
		for (let i = step; i > numStepChanged; i--)
			progressbar.childNodes[i].classList.remove("active");
		setStep(numStepChanged);
		setProgressBar(numStepChanged);
	};

	const setProgressBar = (curStep) => {
		setError();
		var percent = parseFloat(100 / MAX_STEP) * (curStep + 1);
		percent = percent.toFixed();
		document.getElementsByClassName("progress-bar")[0].style["width"] =
			percent + "%";
	};

	const handleCreate = async () => {
		const tel = values.tel;
		const name = values.name;
		const address = values.address;
		const pid = values.pid;
		const medical = values.medical;

		setError("");
		if (check_phone_number(tel)) {
			setLoading(true);

			try {
				const docGet = await getDocument(`/patient`, tel);
				if (docGet) {
					[values.name, values.address] = [docGet.Name, docGet.Address];
					if (!window.confirm("Số điện thoại đã đăng ký, bạn muốn cập nhật?")) {
						setLoading(false);
						return;
					}
				}
				const docSet = await setDocument(`/patient`, tel, {
					Tel: tel,
					Name: name,
					Address: address,
					Pid: pid,
					Medical: medical,
				});

				console.log(docSet);
				nextStep();
				setLoading(false);
			} catch (error) {
				console.log(error);
				setError(error.message);
				setLoading(false);
			}
		} else setError("Vui lòng nhập số điện thoại Việt Nam");
	};

	const handleRetrive = () => {
		const tel = document.getElementsByName("tel")[0].value;
		setError("");
		if (check_phone_number(tel)) {
			setLoading(true);
			getDocument(`/patient`, tel)
				.then((doc) => {
					console.log(doc);
					[
						values.name,
						values.address,
						values.pid,
						values.medical,
						values.last_submit,
					] = [
						doc.Name,
						doc.Address,
						doc.Pid,
						doc.Medical,
						new Date(doc.ClientTimeStamp).toLocaleString(),
					];
					setLoading(false);
				})
				.catch((error) => {
					console.log(error);
					setError(error.message);
					setLoading(false);
				});
		} else setError("Vui lòng nhập số điện thoại Việt Nam");
	};

	const handleSubmitHistory = async () => {
		const uuid = GenRecordID();
		setValues({ ...values, rid: uuid });
		setLoading(true);
		await setDocument(`/patient`, values.tel, {}); // update timestamp
		await setDocument(`/history`, uuid, {
			Tel: values.tel,
			Name: values.name,
			Address: values.address,
			Pid: values.pid,
			Medical: values.medical,
		});
		setLoading(false);
		nextStep();
	};

	const handleCancel = () => {
		setOpen(false);
	};

	return (
		<div>
			<Modal
				title="Kết nối MQTT với Robot"
				visible={connectStatus !== "Connected" && open}
				onCancel={handleCancel}
				footer={[]}
			>
				<Card title="Topic To Subscribe" style={{ marginBottom: "10px" }}>
					<Form
						layout="vertical"
						name="basic"
						form={form}
						initialValues={{ topic: "thanhdanh27600/feeds/esp32", qos: 0 }}
					>
						<Row gutter={20}>
							<Col span={20}>
								<Form.Item label="Topic" name="topic">
									<Input />
								</Form.Item>
							</Col>

							<Col span={4}>
								<Form.Item label="QoS" name="qos">
									<Select options={qosOption} />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Card>
				<Connection
					connect={mqttConnect}
					disconnect={mqttDisconnect}
					connectBtn={connectStatus}
				/>
			</Modal>
			<div
				className="alert alert-success position-fixed text-center"
				role="alert"
				style={{ bottom: "17px", zIndex: "2", width: "20%" }}
			>
				{`MQTT Status: ${connectStatus}, message: ${
					payload.message ? payload.message : "./."
				}`}
			</div>
			<div
				className="alert position-fixed text-center font-weight-bold"
				role="alert"
				style={{
					bottom: "17px",
					left: "21%",
					zIndex: "2",
					width: "20%",
					backgroundColor: getColor(payload.message),
				}}
			>
				ACCURACY: {payload.message}
			</div>
			<Link to="/mqtt">
				<button
					type="button"
					className="btn btn-primary btn-sm btn-block position-fixed"
					style={{
						position: "fixed",
						bottom: "0",
						zIndex: "2",
					}}
				>
					MQTT Test
				</button>
			</Link>
			<div className="container-fluid">
				<div className="row justify-content-center">
					<div className="col-11 col-sm-9 col-md-8 col-lg-7 col-xl-6 text-center p-0 mt-3 mb-2">
						<div className="card px-0 pt-4 pb-0 mt-3 mb-5 pb-5">
							<h1 id="heading">Welcome to Ohmni Healthcare System</h1>
							<p>Please follow the instructions</p>
							<form
								id="msform"
								needs-validation
								onSubmit={(e) => {
									e.preventDefault();
									handleCreate();
								}}
							>
								<ul id="progressbar">
									<li className="active" id="account">
										<strong>Checkin</strong>
									</li>
									<li id="personal">
										<strong>Hồ sơ / Files</strong>
									</li>
									<li id="medical">
										<strong>Khai báo y tế / Medical Checkup</strong>
									</li>
									<li id="confirm">
										<strong>Kết thúc / Finish</strong>
									</li>
								</ul>
								<div className="progress">
									<div
										className="progress-bar progress-bar-striped progress-bar-animated"
										role="progressbar"
										aria-valuemin="0"
										aria-valuemax="100"
									></div>
								</div>
								<br />
								{loading && (
									<div class="spinner-border text-secondary" role="status">
										<span class="sr-only">Loading...</span>
									</div>
								)}
								<br />
								{step === 0 && (
									<fieldset>
										<div className="form-card">
											<div className="row">
												<div className="col-7">
													<h4 className="fs-title">
														Chọn để tiếp tục / Click to continue
													</h4>
												</div>
												<div className="col-5">
													<h4 className="steps">Bước 1 - 4</h4>
												</div>
											</div>
										</div>
										<button
											type="button"
											className="btn btn-primary btn-lg btn-block next"
											onClick={() => nextStep()}
										>
											Đăng ký khám bệnh / Register
										</button>
										<button
											type="button"
											className="btn btn-secondary btn-lg btn-block next"
											onClick={() => {
												nextStep();
												setRetreat(true);
											}}
										>
											Tái khám / Retrieve
										</button>
									</fieldset>
								)}
								{step === 1 && (
									<fieldset>
										<div className="form-card">
											<div className="row">
												<div className="col-7">
													<h4 className="fs-title">{`Nhập thông tin${
														retreat ? " số điện thoại đã đăng ký" : ""
													}`}</h4>
												</div>
												<div className="col-5">
													<h4 className="steps">Bước 2 - 4</h4>
												</div>
											</div>
											<label className="fieldlabels mt-2">
												Số điện thoại / Phone number: *
											</label>
											<div className="d-flex">
												<input
													type="tel"
													name="tel"
													placeholder="SĐT / Phone Number"
													className="align-self-center"
													value={values.tel}
													onChange={(e) =>
														setValues({ ...values, tel: e.target.value })
													}
													required
												/>
												{retreat && (
													<button
														type="button"
														name="next"
														className="next btn action-button"
														onClick={handleRetrive}
													>
														Kiểm tra
													</button>
												)}
											</div>
											<label className="fieldlabels mt-2">
												Họ và tên / Fullname: *
											</label>
											<input
												disabled={retreat}
												type="text"
												name="name"
												placeholder="Họ và tên / Fullname"
												value={values.name}
												onChange={(e) =>
													setValues({ ...values, name: e.target.value })
												}
												required
											/>
											<label className="fieldlabels mt-2">
												Địa chỉ / Address: *
											</label>
											<input
												disabled={retreat}
												type="address"
												name="address"
												placeholder="Địa chỉ / Address"
												value={values.address}
												onChange={(e) =>
													setValues({ ...values, address: e.target.value })
												}
												required
											/>
											<label className="fieldlabels mt-2">
												CMND, CCCD / ID: *
											</label>
											<input
												disabled={retreat}
												type="number"
												name="personal_id"
												placeholder="CMND, CCCD / ID"
												value={values.pid}
												onChange={(e) =>
													setValues({ ...values, pid: e.target.value })
												}
												required
											/>
											<label className="fieldlabels mt-2">
												Đăng ký khám / Medical exam: *
											</label>

											<select
												className="form-control"
												value={values.medical}
												onChange={(e) =>
													setValues({ ...values, medical: e.target.value })
												}
												required
												disabled={retreat}
											>
												<option value="" disabled>
													Vui lòng chọn / Please select
												</option>
												<option value={MEDICAL_FIELD.IN}>
													Nội khoa / Internal medicine
												</option>
												<option value={MEDICAL_FIELD.SUR}>
													Ngoại khoa / Surgery
												</option>
												<option value={MEDICAL_FIELD.OBS}>
													Khoa Sản / Obstetrics
												</option>
												<option value={MEDICAL_FIELD.PAE}>
													Khoa Nhi / Paediatric
												</option>
											</select>

											{retreat && (
												<>
													<label className="fieldlabels mt-2">
														Lần khám cuối cùng / Last retrived:
													</label>
													<input
														disabled={retreat}
														type="last_submit"
														name="last_submit"
														placeholder="Chưa rõ / Unknown"
														value={values.last_submit}
													/>{" "}
												</>
											)}
										</div>
										{error && (
											<div className="alert alert-danger mt-2" role="alert">
												{error}
											</div>
										)}
										{retreat ? (
											<button
												type="button"
												name="next"
												className="next btn action-button"
												disabled={values.last_submit === ""}
												onClick={() => nextStep()}
											>
												Tiếp tục
											</button>
										) : (
											<button
												name="next"
												type="submit"
												className="next btn action-button"
											>
												Tạo hồ sơ
											</button>
										)}
										<button
											type="button"
											name="previous"
											className="previous btn action-button-previous"
											onClick={() => {
												setRetreat(false);
												setValues(InitFormValues);
												prevStep();
											}}
										>
											Trở về
										</button>
									</fieldset>
								)}
								{step === 2 && (
									<fieldset>
										<div className="form-card">
											<div className="row">
												<div className="col-7">
													<h4 className="fs-title">
														Khai báo y tế / Medical Checkup
													</h4>
												</div>
												<div className="col-5">
													<h4 className="steps">Bước 3 - 4</h4>
												</div>
											</div>
											<label className="fieldlabels mt-2">
												Xin chào <strong>{values.name}</strong>, Hãy truy cập{" "}
												<a href="https://tokhaiyte.vn/">
													https://tokhaiyte.vn/
												</a>{" "}
												và khai báo y tế
											</label>

											<br />

											{/* <input type="file" name="pic" accept="image/* , .pdf" /> */}

											<label className="fieldlabels mt-2">
												Hoặc sử dụng App PC-Covid để quét Mã QR
											</label>

											<br />

											<em>
												{" "}
												<label className="fieldlabels mt-2">
													Hello <strong>{values.name}</strong>, Please head to{" "}
													<a href="https://tokhaiyte.vn/">
														https://tokhaiyte.vn/
													</a>{" "}
													and fulfill the medical checkup
												</label>
												<br />
												<label className="fieldlabels mt-2">
													Or scan this QR code via PC-Covid App
												</label>
											</em>

											<br />
											<img
												alt="Quý khách hãy cài đặt và sử dụng App PC-Covid để quét Mã QR!"
												src="/image/kiemdich.png"
												width="20%"
											/>
										</div>
										<button
											type="button"
											name="next"
											className="next btn action-button"
											onClick={handleSubmitHistory}
										>
											Tiếp tục
										</button>
										<button
											type="button"
											name="previous"
											className="previous btn action-button-previous"
											onClick={() => prevStep(2)}
										>
											Trở về
										</button>
									</fieldset>
								)}
								{step === 3 && (
									<fieldset>
										<div className="form-card">
											<div className="row">
												<div className="col-7">
													<h4 className="fs-title">Hoàn thành</h4>
												</div>
												<div className="col-5">
													<h4 className="steps">Bước 4 - 4</h4>
												</div>
											</div>
											<h2 className="purple-text text-center">
												<strong>MÃ HỒ SƠ / MEDICAL RECORD</strong>
											</h2>
											<br />
											<div className="row justify-content-center">
												<div className="col-3">
													<img
														alt=""
														src={`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${MakeRecord(
															values
														)}&chco=58329b`}
														className="fit-image"
													/>
												</div>
											</div>
											<br />
											<br />
											<div className="row justify-content-center">
												<div className="col-7 text-center">
													<h4 className="purple-text text-center">
														Bạn đã Check-in thành công, vui lòng chọn
													</h4>
													<em>
														<h4 className="purple-text text-center">
															Check-in successfully, please select
														</h4>
													</em>
												</div>
											</div>
											<button
												type="button"
												className="btn btn-primary btn-lg btn-block finish-button next"
											>
												Dẫn tôi đi / Guide me
											</button>
											<button
												type="button"
												className="btn btn-secondary btn-lg btn-block finish-button next"
											>
												Mở bản đồ, tôi tự đi / Show path only
											</button>
										</div>
									</fieldset>
								)}
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default MainForm;
