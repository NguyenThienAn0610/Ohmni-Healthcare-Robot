const PHONE_REGEX =
	/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
export const check_phone_number = (tel) => {
	return PHONE_REGEX.test(tel);
};

export const MEDICAL_FIELD = {
	IN: "INTERNAL",
	SUR: "SURGERY",
	OBS: "OBSTETRICS",
	PAE: "PAEDIATRIC",
};

export const MAX_STEP = 4;