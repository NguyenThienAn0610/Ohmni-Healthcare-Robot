import { fs } from "./firebase";
import firebase from "firebase/app";

export async function setDocument(collectionPath, documentName, data) {
	if (
		typeof collectionPath != typeof "" ||
		typeof documentName != typeof "" ||
		typeof data != typeof {}
	)
		throw new Error("Type invalid");
	let doc = fs.collection(collectionPath).doc(documentName);
	return new Promise((resolve, reject) => {
		doc
			.set(
				{
					...data,
					ClientTimeStamp: Date.now(),
					ServerTimeStamp: firebase.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true }
			)
			.then((value) => {
				resolve(value);
			})
			.catch((e) => {
				reject(e);
			});
	});
}

export async function getDocument(collectionPath, documentName) {
	if (typeof collectionPath != typeof "" || typeof documentName != typeof "")
		new Error("Type invalid");
	let docRef = fs.collection(collectionPath).doc(documentName);
	return new Promise((resolve, reject) => {
		docRef
			.get()
			.then((doc) => {
				if (doc.exists) {
					resolve(doc.data());
				} else {
					console.log("No such document!");
					resolve(null);
				}
			})
			.catch((error) => {
				console.log("Error getting document:", error);
				reject(error);
			});
	});
}

export async function deleteDocument(collectionPath, documentName, data) {
	if (
		typeof collectionPath != typeof "" ||
		typeof documentName != typeof "" ||
		typeof data != typeof {}
	)
		new Error("Type invalid");

	let doc = fs.collection(collectionPath).doc(documentName);
	return new Promise((resolve, reject) => {
		doc
			.delete(data)
			.then((value) => {
				resolve(value);
			})
			.catch((e) => {
				reject(e);
			});
	});
}
