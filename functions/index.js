/* eslint-disable max-len */
/* eslint-disable indent */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// auth trigger (new user signup)
exports.newUserSignUp = functions.auth.user().onCreate((user) => {
  // for background triggers you must return a value/promise
  return admin.firestore().collection("users").doc(user.uid).set({
    email: user.email,
    upvotedOn: [],
  });
});

// auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete((user) => {
  const doc = admin.firestore().collection("users").doc(user.uid);
  return doc.delete();
});

// http callable function (adding a request)
exports.addRequest = functions.https.onCall((data, context) => {
  // Access the context argument to check if the user is Logged In
  if (!context.auth) {
    // HTTPError first argument must be a given error code given by Firebase then the error message itself
    throw new functions.https.HttpsError(
      "unauthenticated",
      "only authenticated users can add requests"
    );
  }
  // Access the data argument to get the text entered by the user
  if (data.text.length > 30) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "request must be no more than 30 characters long"
    );
  }
  // Create document in the targeted collection if the conditions pass
  return admin.firestore().collection("requests").add({
    text: data.text,
    upvotes: 0,
  });
});
