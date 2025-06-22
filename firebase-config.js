import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
	getFirestore,
	collection,
	addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyCbYvv2UaOVYfJmhPw95vqCcZd3pA5TWqA",
	authDomain: "password-manager-extensi-da1ad.firebaseapp.com",
	projectId: "password-manager-extensi-da1ad",
	storageBucket: "password-manager-extensi-da1ad.firebasestorage.app",
	messagingSenderId: "55232570982",
	appId: "1:55232570982:web:879753d8dbd2938a85efa7",
	measurementId: "G-WSKY6PQ6TY",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };
