export function getColor(value) {
	//value from 0 to 1
	var hue = ((value ? value : 0.5) * 120).toString(10);
	return ["hsl(", hue, ",90%,60%)"].join("");
}
